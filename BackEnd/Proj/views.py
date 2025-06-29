from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError, NotFound
from django.conf import settings
from django.contrib.auth import get_user_model
from pynamodb.exceptions import DoesNotExist, GetError, ScanError, QueryError, PutError, DeleteError
from django.core.cache import cache # Ensure Django cache is configured in settings if used here

from .models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel
from .serializers import (
    ProjectSerializer, SubmissionSerializer, RubricSerializer, EvaluationSerializer, UserSerializer
)
from .utils import send_email_ses
from datetime import date # Import date for comparison
from django.utils import timezone # For timezone-aware datetimes

User = get_user_model() # Django's User model (still relational)

class ProtectedAPI(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        content = {'message': f'Hello, {request.user.username}! This is a protected API endpoint.'}
        return Response(content)
    
class HomeView(APIView):
    def get(self, request):
        content = {'message': 'Welcome to the Home Page!'}
        return Response(content)
    
class ProjectListCreateView(APIView):
    """
    API endpoint for listing and creating projects in DynamoDB.
    Faculty members can create projects. All authenticated users can view projects.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer # For documentation/schema generation

    def get(self, request, *args, **kwargs):
        try:
            projects = list(ProjectModel.scan())
            serializer = ProjectSerializer(projects, many=True)
            return Response(serializer.data)
        except ScanError as e:
            return Response({"detail": f"Error fetching projects: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, *args, **kwargs):
        if not request.user.is_staff:
            raise permissions.PermissionDenied("Only faculty members can create projects.")
        
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Set created_by_username from the authenticated user
            serializer.validated_data['created_by_username'] = request.user.username
            project = serializer.save() # This calls the create method in ProjectSerializer
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        except PutError as e:
            return Response({"detail": f"Error creating project: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProjectDetailView(APIView):
    """
    API endpoint for retrieving, updating, and deleting a specific project in DynamoDB.
    Only the faculty member who created the project can update/delete it.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ProjectSerializer # For documentation/schema generation

    def get_object(self, project_id, request):
        try:
            project = ProjectModel.get(project_id)
            # Permissions check for update/delete
            if request.method in ['PUT', 'PATCH', 'DELETE'] and project.created_by_username != request.user.username:
                raise permissions.PermissionDenied("You do not have permission to modify this project.")
            return project
        except DoesNotExist:
            raise NotFound(detail="Project not found.")
        except GetError as e:
            raise ValidationError(f"Error fetching project: {e}")
    def get(self, request, pk, *args, **kwargs):
        project = self.get_object(pk, request)
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    def put(self, request, pk, *args, **kwargs):
        project = self.get_object(pk, request)
        serializer = ProjectSerializer(project, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        try:
            # Ensure updated_at is set for updates
            serializer.validated_data['updated_at'] = timezone.now()
            updated_project = serializer.save()
            return Response(ProjectSerializer(updated_project).data)
        except PutError as e:
            return Response({"detail": f"Error updating project: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def delete(self, request, pk, *args, **kwargs):
        project = self.get_object(pk, request)
        try:
            project.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DeleteError as e:
            return Response({"detail": f"Error deleting project: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmissionListCreateView(APIView):
    """
    API endpoint for listing and creating submissions in DynamoDB.
    Students can create submissions for projects.
    Faculty can view all submissions.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionSerializer # For documentation/schema generation

    def get(self, request, *args, **kwargs):
        try:
            if request.user.is_staff:
                submissions = list(SubmissionModel.scan()) # Faculty see all
            else:
                # Students see only their own submissions using StudentIndex GSI for efficiency
                # StudentIndex has student_username as hash_key
                submissions = list(SubmissionModel.StudentIndex.query(request.user.username))

            serializer = SubmissionSerializer(submissions, many=True)
            return Response(serializer.data)
        except (ScanError, QueryError) as e:
            return Response({"detail": f"Error fetching submissions: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, *args, **kwargs):
        serializer = SubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project_id = serializer.validated_data.get('project_id')
        if not project_id:
            raise ValidationError({"project_id": "Project ID is required."})

        try:
            project = ProjectModel.get(project_id)
        except DoesNotExist:
            raise NotFound(detail="Project not found.")
        except GetError as e:
            return Response({"detail": f"Error fetching project for submission: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Check if project is active for submissions
        if not project.is_active:
            raise ValidationError({"detail": "This project is not active for submissions."})
        
        # Check if student has already submitted for this project using GSI
        # Query the ProjectStudentIndex GSI using project_id as hash_key and student_username as range_key
        existing_submissions = list(SubmissionModel.ProjectStudentIndex.query(
            hash_key=project_id,
            range_key_condition=SubmissionModel.ProjectStudentIndex.student_username == request.user.username,
            limit=1
        ))
        if existing_submissions:
            raise ValidationError({"detail": "You have already submitted for this project."})
        
        try:
            # Set student_username from the authenticated user
            serializer.validated_data['student_username'] = request.user.username
            submission = serializer.save()

            # Send confirmation email via SES
            if settings.AWS_SES_SOURCE_EMAIL and request.user.email:
                subject = f"Project Submission Confirmation: {project.title}"
                body_text = (
                    f"Dear {request.user.username},\n\n"
                    f"Your submission for the project '{project.title}' has been successfully received.\n"
                    f"Submission ID: {submission.submission_id}\n"
                    f"Submitted at: {submission.submitted_at}\n\n"
                    "Thank you!"
                )
                body_html = f"""
                <html>
                    <body>
                        <p>Dear {request.user.username},</p>
                        <p>Your submission for the project '<strong>{project.title}</strong>' has been successfully received.</p>
                        <p>Submission ID: {submission.submission_id}</p>
                        <p>Submitted at: {submission.submitted_at}</p>
                        <p>Thank you!</p>
                    </body>
                </html>
                """
                send_email_ses(request.user.email, subject, body_text, body_html)
            
            return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)
        except PutError as e:
            return Response({"detail": f"Error creating submission: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SubmissionDetailView(APIView):
    """
    API endpoint for retrieving a specific submission.
    Students can view their own submission. Faculty can view any submission.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubmissionSerializer

    def get_object(self, submission_id, request):
        try:
            submission = SubmissionModel.get(submission_id)
            if not request.user.is_staff and submission.student_username != request.user.username:
                raise permissions.PermissionDenied("You do not have permission to view this submission.")
            return submission
        except DoesNotExist:
            raise NotFound(detail="Submission not found.")
        except GetError as e:
            raise ValidationError(f"Error fetching submission: {e}")
    # Remove the redundant get method here. It should only be one `get` method per view class.
    # The get_object method is for internal use to retrieve the instance.
    # def get(self, request, pk, *args, **kwargs):
    #     submission = self.get_object(pk, request)
    #     serializer = SubmissionSerializer(submission)
    #     return Response(serializer.data)


class RubricListCreateView(APIView):
    """
    API endpoint for listing and creating rubrics.
    Only faculty can create rubrics for projects they own.
    All authenticated users can view rubrics for a given project.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = RubricSerializer

    def get(self, request, project_pk, *args, **kwargs):
        try:
            # Query rubrics by project_id using the GSI
            rubrics = list(RubricModel.ProjectIndex.query(project_pk))
            serializer = RubricSerializer(rubrics, many=True)
            return Response(serializer.data)
        except QueryError as e:
            return Response({"detail": f"Error fetching rubrics: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, project_pk, *args, **kwargs):
        if not request.user.is_staff:
            raise permissions.PermissionDenied("Only faculty members can create rubrics.")
        
        try:
            project = ProjectModel.get(project_pk)
            if project.created_by_username != request.user.username:
                raise permissions.PermissionDenied("You do not have permission to add rubrics to this project.")
        except DoesNotExist:
            raise NotFound(detail="Project not found.")
        except GetError as e:
            return Response({"detail": f"Error fetching project for rubric: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = RubricSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.validated_data['project_id'] = project_pk # Ensure project_id is set
        try:
            rubric = serializer.save()
            return Response(RubricSerializer(rubric).data, status=status.HTTP_201_CREATED)
        except PutError as e:
            return Response({"detail": f"Error creating rubric: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EvaluationListCreateView(APIView):
    """
    API endpoint for listing and creating evaluations.
    Only faculty can create evaluations.
    Students can view evaluations for their own submissions.
    Faculty can view all evaluations.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EvaluationSerializer

    def get(self, request, submission_pk, *args, **kwargs):
        try:
            evaluations = list(EvaluationModel.SubmissionRubricEvaluatorIndex.query(submission_pk))
            
            # Filter for students if not staff
            if not request.user.is_staff:
                # Need to verify if the submission belongs to the student
                try:
                    submission = SubmissionModel.get(submission_pk)
                    if submission.student_username != request.user.username:
                        raise permissions.PermissionDenied("You do not have permission to view evaluations for this submission.")
                except DoesNotExist:
                    raise NotFound(detail="Submission not found.")
                except GetError as e:
                    return Response({"detail": f"Error fetching submission for evaluation view: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            serializer = EvaluationSerializer(evaluations, many=True)
            return Response(serializer.data)
        except QueryError as e:
            return Response({"detail": f"Error fetching evaluations: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def post(self, request, submission_pk, *args, **kwargs):
        if not request.user.is_staff:
            raise permissions.PermissionDenied("Only faculty can create evaluations.")
        
        try:
            submission = SubmissionModel.get(submission_pk)
        except DoesNotExist:
            raise NotFound(detail="Submission not found.")
        except GetError as e:
            return Response({"detail": f"Error fetching submission for evaluation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        serializer = EvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        rubric_id = serializer.validated_data.get('rubric_id')
        if not rubric_id:
            raise ValidationError({"rubric_id": "Rubric ID is required."})
        
        try:
            rubric = RubricModel.get(rubric_id)
        except DoesNotExist:
            raise NotFound(detail="Rubric not found.")
        except GetError as e:
            return Response({"detail": f"Error fetching rubric for evaluation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Ensure the rubric belongs to the same project as the submission (optional but good practice)
        # This requires fetching the project from the submission's project_id and comparing it with rubric's project_id
        try:
            submission_project = ProjectModel.get(submission.project_id)
            if submission_project.project_id != rubric.project_id:
                raise ValidationError({"detail": "Rubric does not belong to the submission's project."})
        except DoesNotExist:
            raise NotFound(detail="Associated project for submission or rubric not found.")
        except GetError as e:
            return Response({"detail": f"Error verifying project for evaluation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


        serializer.validated_data['submission_id'] = submission_pk # Ensure submission_id is set
        serializer.validated_data['evaluated_by_username'] = request.user.username # Set evaluator
        # Create the composite key for the GSI if needed by the save method.
        # This needs to be consistent with how SubmissionRubricEvaluatorIndex range key is defined.
        # If range_key is 'rubric_evaluated_key', you need to set that.
        # For our model, it's composite using rubric_id and evaluated_by_username
        serializer.validated_data['rubric_evaluated_key'] = f"{rubric_id}-{request.user.username}"


        try:
            evaluation = serializer.save()
            return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)
        except PutError as e:
            return Response({"detail": f"Error creating evaluation: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LeaderboardView(APIView):
    """
    API endpoint to display a leaderboard of projects based on total evaluation points.
    All authenticated users can view the leaderboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    CACHE_KEY = 'leaderboard_data'
    CACHE_TTL = 300  # 5 minutes

    def get_leaderboard_data(self):
        all_submissions = list(SubmissionModel.scan())
        all_evaluations = list(EvaluationModel.scan())
        all_projects = list(ProjectModel.scan())

        projects_map = {p.project_id: p for p in all_projects}
        submissions_map = {s.submission_id: s for s in all_submissions}

        submission_total_points = {}
        for evaluation in all_evaluations:
            submission_id = evaluation.submission_id
            points = evaluation.points_awarded
            submission_total_points[submission_id] = submission_total_points.get(submission_id, 0) + points

        leaderboard_data = []
        for submission_id, total_points in submission_total_points.items():
            submission = submissions_map.get(submission_id)
            if submission and submission.project_id in projects_map:
                project = projects_map[submission.project_id]
                leaderboard_data.append({
                    'project_title': project.title,
                    'student_username': submission.student_username,
                    'total_points': total_points,
                    'submission_id': submission.submission_id,
                })
        leaderboard_data.sort(key=lambda x: x['total_points'], reverse=True)
        return leaderboard_data

    def get(self, request, *args, **kwargs):
        try:
            leaderboard_data = cache.get(self.CACHE_KEY)
            if leaderboard_data is None:
                leaderboard_data = self.get_leaderboard_data()
                cache.set(self.CACHE_KEY, leaderboard_data, timeout=self.CACHE_TTL)
            return Response(leaderboard_data)
        except (ScanError, QueryError) as e:
            return Response({"detail": f"Error generating leaderboard: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

