from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from django.conf import settings
from pynamodb.exceptions import DoesNotExist, PutError, ScanError, QueryError
from datetime import date, datetime

from .models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel
from .serializers import (
    ProjectSerializer, SubmissionSerializer, RubricSerializer, EvaluationSerializer
)
from .utils import send_email_ses
from ml_evaluator.evaluator import simulate_ml_evaluation

# --- Helper Functions ---
def get_submission_and_check_permission(submission_id, request):
    """Fetches a submission and verifies user has permission to view it."""
    try:
        submission = SubmissionModel.get(submission_id)
        # Faculty can view any submission. Students can only view their own.
        if not request.user.is_staff and submission.student_username != request.user.username:
            raise PermissionDenied("You do not have permission to view this submission.")
        return submission
    except DoesNotExist:
        raise NotFound(detail="Submission not found.")

# --- Project Views ---
class ProjectListCreateView(APIView):
    """List all projects or create a new one. (Faculty only for creation)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        projects = list(ProjectModel.scan())
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can create projects.")
        
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by_username=request.user.username)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProjectDetailView(APIView):
    """Retrieve, update or delete a project instance. (Creator only for update/delete)."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, project_id, request_user):
        try:
            project = ProjectModel.get(project_id)
            if project.created_by_username != request_user.username and not request_user.is_staff:
                 raise PermissionDenied("You do not have permission to modify this project.")
            return project
        except DoesNotExist:
            raise NotFound(detail="Project not found.")

    def get(self, request, project_id):
        project = self.get_object(project_id, request.user)
        serializer = ProjectSerializer(project)
        return Response(serializer.data)

    def put(self, request, project_id):
        project = self.get_object(project_id, request.user)
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

# --- Submission Views ---
class SubmissionListCreateView(APIView):
    """Create a new submission. (Students only)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.is_staff:
            raise PermissionDenied("Only students can create submissions.")

        serializer = SubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        project_id = serializer.validated_data['project_id']
        try:
            project = ProjectModel.get(project_id)
        except DoesNotExist:
            raise NotFound(detail="Project not found.")

        # Enforce submission deadline
        if project.end_date < date.today():
            raise ValidationError("The submission deadline for this project has passed.")

        # Check for existing submission
        existing = list(SubmissionModel.project_student_index.query(
            hash_key=project_id,
            range_key_condition=SubmissionModel.student_username == request.user.username
        ))
        if existing:
            raise ValidationError("You have already submitted for this project.")
            
        submission = serializer.save(student_username=request.user.username)
        
        # Send confirmation email
        if settings.AWS_SES_SOURCE_EMAIL and request.user.email:
            send_email_ses(
                recipient_email=request.user.email,
                subject=f"Submission Confirmation: {project.title}",
                body_text=f"Your submission for '{project.title}' has been received."
            )
            
        return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)

class MySubmissionsListView(APIView):
    """List all submissions for the currently authenticated student."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            # Faculty should use the admin view or a different endpoint
            submissions = list(SubmissionModel.scan())
        else:
            submissions = list(SubmissionModel.student_index.query(request.user.username))
        
        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)

class SubmissionDetailView(APIView):
    """Retrieve a single submission's details."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, submission_id):
        submission = get_submission_and_check_permission(submission_id, request)
        serializer = SubmissionSerializer(submission)
        return Response(serializer.data)

# --- Rubric and Evaluation Views ---
class RubricListCreateView(APIView):
    """List or create rubrics for a specific project."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id):
        rubrics = list(RubricModel.project_index.query(project_id))
        serializer = RubricSerializer(rubrics, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can create rubrics.")
        
        try:
            project = ProjectModel.get(project_id)
            if project.created_by_username != request.user.username:
                raise PermissionDenied("You can only add rubrics to your own projects.")
        except DoesNotExist:
            raise NotFound("Project not found.")
        
        serializer = RubricSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(project_id=project_id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class EvaluationListCreateView(APIView):
    """List or create a manual evaluation for a submission criterion."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, submission_id):
        submission = get_submission_and_check_permission(submission_id, request)
        evaluations = list(EvaluationModel.submission_index.query(submission_id))
        
        # Add rubric details to each evaluation for context
        rubric_map = {r.rubric_id: r for r in RubricModel.scan(RubricModel.rubric_id.is_in(*[e.rubric_id for e in evaluations]))}
        for e in evaluations:
            e.rubric = rubric_map.get(e.rubric_id)
            
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    def post(self, request, submission_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can create evaluations.")

        submission = get_submission_and_check_permission(submission_id, request)
        submission.update(actions=[SubmissionModel.status.set('Under Evaluation')])
        
        serializer = EvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Prevent duplicate evaluation for the same rubric by the same user
        existing_eval = list(EvaluationModel.scan(
            (EvaluationModel.submission_id == submission_id) &
            (EvaluationModel.rubric_id == serializer.validated_data['rubric_id']) &
            (EvaluationModel.evaluated_by_username == request.user.username)
        ))
        if existing_eval:
            raise ValidationError("You have already evaluated this criterion for this submission.")

        evaluation = serializer.save(
            submission_id=submission_id,
            evaluated_by_username=request.user.username
        )
        return Response(EvaluationSerializer(evaluation).data, status=status.HTTP_201_CREATED)

class FinalizeEvaluationView(APIView):
    """Finalizes an evaluation, runs ML model, calculates final score."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can finalize evaluations.")

        submission = get_submission_and_check_permission(submission_id, request)
        
        # 1. Calculate total manual score
        evaluations = list(EvaluationModel.submission_index.query(submission_id))
        if not evaluations:
            raise ValidationError("Cannot finalize. No manual evaluations found.")
            
        total_manual_score = sum(e.points_awarded for e in evaluations)

        # 2. Simulate ML evaluation
        ml_results = simulate_ml_evaluation(submission.report_content_summary or "")
        total_ml_score = sum(ml_results.values())
        
        # 3. Calculate weighted final score
        weight = settings.ML_SCORE_WEIGHT
        final_score = (total_manual_score * (1 - weight)) + (total_ml_score * weight)
        
        # 4. Update submission with scores and status
        submission.update(actions=[
            SubmissionModel.manual_score.set(total_manual_score),
            SubmissionModel.ml_score.set(total_ml_score),
            SubmissionModel.overall_score.set(round(final_score, 2)),
            SubmissionModel.status.set('Evaluated')
        ])
        
        # 5. Send notification email
        # (Implementation omitted for brevity, but would be similar to submission confirmation)

        return Response({
            "status": "Evaluation finalized",
            "manual_score": total_manual_score,
            "ml_score": total_ml_score,
            "final_score": final_score
        }, status=status.HTTP_200_OK)

# --- Leaderboard View ---
class LeaderboardView(APIView):
    """Provides ranked list of evaluated submissions."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            # Get all evaluated submissions with an overall score
            submissions = list(SubmissionModel.scan(
                SubmissionModel.overall_score.exists()
            ))
            
            if not submissions:
                return Response([])

            # Get project titles for context
            project_ids = {s.project_id for s in submissions}
            projects = ProjectModel.scan(ProjectModel.project_id.is_in(*list(project_ids)))
            project_map = {p.project_id: p.title for p in projects}

            leaderboard_data = [{
                'student_username': s.student_username,
                'project_title': project_map.get(s.project_id, 'N/A'),
                'total_points': s.overall_score,
                'submission_id': s.submission_id
            } for s in submissions]

            leaderboard_data.sort(key=lambda x: x['total_points'], reverse=True)
            return Response(leaderboard_data)
        except ScanError as e:
            return Response({"detail": f"Error generating leaderboard: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)