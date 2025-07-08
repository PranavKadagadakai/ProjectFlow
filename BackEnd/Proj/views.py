from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from django.conf import settings
from pynamodb.exceptions import DoesNotExist, PutError, ScanError, QueryError, GetError
from datetime import date, datetime

from .models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel, UserProfileModel
from .serializers import (
    ProjectSerializer, SubmissionSerializer, RubricSerializer, EvaluationSerializer, UserProfileSerializer
)
from .utils import send_email_ses
from ml_evaluator.evaluator import get_ai_evaluation
from Proj.pdf_extractor import extract_text_from_local_pdf # UPDATED IMPORT

# --- Helper Functions ---
def get_submission_and_check_permission(submission_id, request):
    """Fetches a submission and verifies user has permission to view it."""
    try:
        submission = SubmissionModel.get(submission_id)
        if not request.user.is_staff and submission.student_username != request.user.username:
            raise PermissionDenied("You do not have permission to view this submission.")
        return submission
    except DoesNotExist:
        raise NotFound(detail="Submission not found.")

# --- Profile Views ---
class ProfileDetailView(APIView):
    """Retrieve or update a user's profile."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, username):
        try:
            profile = UserProfileModel.get(username)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfileModel.DoesNotExist:
            return Response({
                'username': username,
                'full_name': '',
                'bio': '',
                'profile_picture_url': ''
            })

    def put(self, request, username):
        if request.user.username != username:
            raise PermissionDenied("You can only edit your own profile.")
        
        try:
            profile = UserProfileModel.get(username)
        except UserProfileModel.DoesNotExist:
            profile = UserProfileModel(username=username)

        serializer = UserProfileSerializer(instance=profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(username=username)
        return Response(serializer.data)

# --- Project Views ---
class ProjectListCreateView(APIView):
    """List all projects or create a new one. (Faculty only for creation)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            projects = list(ProjectModel.scan(ProjectModel.created_by_username == request.user.username))
        else:
            projects = list(ProjectModel.scan(ProjectModel.is_active == True))
        
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
            if self.request.method != 'GET' and project.created_by_username != request_user.username:
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

        # Pass request context to serializer for file saving and username
        serializer = SubmissionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        project_id = serializer.validated_data['project_id']
        try:
            project = ProjectModel.get(project_id)
        except DoesNotExist:
            raise NotFound(detail="Project not found.")

        if project.end_date < date.today():
            raise ValidationError("The submission deadline for this project has passed. No more submissions are allowed.")

        # Validation for GitHub link vs. Source Code File is now handled in serializer's validate method
        
        existing_submissions = list(SubmissionModel.project_student_index.query(
            hash_key=project_id,
            range_key_condition=SubmissionModel.student_username == request.user.username
        ))
        
        if len(existing_submissions) >= 3:
            raise ValidationError("You have reached the maximum of 3 submissions for this project.")
        
        with SubmissionModel.batch_write() as batch:
            for sub in existing_submissions:
                sub.is_latest = False
                batch.save(sub)

        submission_version = len(existing_submissions) + 1
            
        submission = serializer.save(
            student_username=request.user.username,
            version=submission_version,
            is_latest=True
        )

        # NEW: Extract text from PDF report and save it to the submission
        # Use the local file path stored by the serializer
        if submission.report_file_path:
            extracted_text = extract_text_from_local_pdf(submission.report_file_path)
            if extracted_text:
                submission.update(actions=[
                    SubmissionModel.report_content_summary.set(extracted_text)
                ])
                # Refresh the submission object to get the updated summary
                submission = SubmissionModel.get(submission.submission_id)
            else:
                # Log an error if PDF extraction fails but don't block submission
                print(f"WARNING: Could not extract text from PDF for submission {submission.submission_id}")
                # Optionally set a placeholder or error message in the summary field
                submission.update(actions=[
                    SubmissionModel.report_content_summary.set("PDF text extraction failed or resulted in empty content.")
                ])
                submission = SubmissionModel.get(submission.submission_id) # Refresh

        
        if settings.AWS_SES_SOURCE_EMAIL and request.user.email:
            send_email_ses(
                recipient_email=request.user.email,
                subject=f"Submission Confirmation (Attempt {submission_version}): {project.title}",
                body_text=f"Your submission (version {submission_version}) for '{project.title}' has been received."
            )
            
        return Response(SubmissionSerializer(submission).data, status=status.HTTP_201_CREATED)

class MySubmissionsListView(APIView):
    """List all submissions for the currently authenticated student or all for faculty."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
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

class RubricDetailView(APIView):
    """Retrieve, update, or delete a rubric instance."""
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, rubric_id, request_user):
        if not request_user.is_staff:
            raise PermissionDenied("You do not have permission to manage rubrics.")
        try:
            return RubricModel.get(rubric_id)
        except DoesNotExist:
            raise NotFound("Rubric not found.")

    def put(self, request, project_id, rubric_id):
        rubric = self.get_object(rubric_id, request.user)
        serializer = RubricSerializer(rubric, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, project_id, rubric_id):
        rubric = self.get_object(rubric_id, request.user)
        rubric.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EvaluationListCreateView(APIView):
    """List or create a manual evaluation for a submission criterion."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, submission_id):
        submission = get_submission_and_check_permission(submission_id, request)
        evaluations = list(EvaluationModel.submission_index.query(submission_id))
        
        if evaluations:
            rubric_ids = [e.rubric_id for e in evaluations if e.rubric_id]
            if rubric_ids:
                rubric_map = {r.rubric_id: r for r in RubricModel.scan(RubricModel.rubric_id.is_in(*rubric_ids))}
                for e in evaluations:
                    e.rubric = rubric_map.get(e.rubric_id)
        
        serializer = EvaluationSerializer(evaluations, many=True)
        return Response(serializer.data)

    def post(self, request, submission_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can create evaluations.")

        submission = get_submission_and_check_permission(submission_id, request)
        
        serializer = EvaluationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        existing_evals = list(EvaluationModel.scan(
            (EvaluationModel.submission_id == submission_id) &
            (EvaluationModel.rubric_id == serializer.validated_data['rubric_id'])
        ))
        
        if existing_evals:
            evaluation = existing_evals[0]
            evaluation.update(actions=[
                EvaluationModel.points_awarded.set(serializer.validated_data['points_awarded']),
                EvaluationModel.feedback.set(serializer.validated_data.get('feedback', '')),
                EvaluationModel.evaluated_at.set(datetime.utcnow()),
                EvaluationModel.evaluated_by_username.set(request.user.username)
            ])
        else:
            evaluation = serializer.save(
                submission_id=submission_id,
                evaluated_by_username=request.user.username
            )
        
        submission.update(actions=[SubmissionModel.status.set('Under Evaluation')])
        
        refreshed_evaluation = EvaluationModel.get(evaluation.evaluation_id)
        
        if refreshed_evaluation.rubric_id:
            try:
                refreshed_evaluation.rubric = RubricModel.get(refreshed_evaluation.rubric_id)
            except DoesNotExist:
                refreshed_evaluation.rubric = None

        return Response(EvaluationSerializer(refreshed_evaluation).data, status=status.HTTP_201_CREATED)

class TriggerAIEvaluationView(APIView):
    """Triggers the Gemini model to evaluate a submission and returns the scores."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can trigger AI evaluation.")

        submission = get_submission_and_check_permission(submission_id, request)
        
        # Ensure report_content_summary is available (extracted from PDF)
        if not submission.report_content_summary:
            return Response(
                {"detail": "Submission has no text content to analyze. PDF extraction might have failed or not completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Fetch the rubrics for the project to provide context to the AI
        rubrics = list(RubricModel.project_index.query(submission.project_id))
        if not rubrics:
            return Response(
                {"detail": "This project has no rubrics defined. AI evaluation cannot proceed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Call the new Gemini-based evaluator
        ml_results = get_ai_evaluation(submission.report_content_summary, rubrics)
        
        if "error" in ml_results:
            return Response({"detail": ml_results["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(ml_results, status=status.HTTP_200_OK)


class FinalizeEvaluationView(APIView):
    """Finalizes an evaluation, runs ML model, calculates final score."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        if not request.user.is_staff:
            raise PermissionDenied("Only faculty can finalize evaluations.")

        submission = get_submission_and_check_permission(submission_id, request)
        
        evaluations = list(EvaluationModel.submission_index.query(submission_id))
        if not evaluations:
            raise ValidationError("Cannot finalize. No manual evaluations found.")
            
        total_manual_score = sum(e.points_awarded for e in evaluations)

        # Fetch rubrics to pass to the AI evaluator
        rubrics = list(RubricModel.project_index.query(submission.project_id))
        if not rubrics:
            return Response(
                {"detail": "This project has no rubrics defined. AI evaluation cannot proceed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure report_content_summary is available (extracted from PDF)
        if not submission.report_content_summary:
            return Response(
                {"detail": "Cannot finalize. Submission has no text content for AI evaluation. PDF extraction might have failed or not completed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ml_results = get_ai_evaluation(submission.report_content_summary, rubrics)
        
        if "error" in ml_results:
            return Response({"detail": ml_results["error"]}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Extract only the scores from the structured AI response
        # Note: ml_results is a dictionary where keys end with '_score' or '_feedback'
        total_ml_score = sum(v['value'] for k, v in ml_results.items() if k.endswith('_score') and isinstance(v, dict) and 'value' in v and isinstance(v['value'], (int, float)))

        weight = settings.ML_SCORE_WEIGHT
        final_score = (total_manual_score * (1 - weight)) + (total_ml_score * weight)
        
        submission.update(actions=[
            SubmissionModel.manual_score.set(total_manual_score),
            SubmissionModel.ml_score.set(total_ml_score),
            SubmissionModel.overall_score.set(round(final_score, 2)),
            SubmissionModel.status.set('Evaluated')
        ])
        
        return Response({
            "status": "Evaluation finalized",
            "manual_score": total_manual_score,
            "ml_score": total_ml_score,
            "final_score": final_score
        }, status=status.HTTP_200_OK)

class LeaderboardView(APIView):
    """Provides ranked list of evaluated submissions."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            all_submissions = list(SubmissionModel.scan(
                (SubmissionModel.overall_score.exists()) & (SubmissionModel.is_latest == True)
            ))
            
            if not all_submissions:
                return Response([])

            project_ids = {s.project_id for s in all_submissions}
            projects = ProjectModel.scan(ProjectModel.project_id.is_in(*list(project_ids)))
            project_map = {p.project_id: p.title for p in projects}

            leaderboard_data = [{
                'student_username': s.student_username,
                'project_title': project_map.get(s.project_id, 'N/A'),
                'total_points': s.overall_score,
                'submission_id': s.submission_id
            } for s in all_submissions]

            leaderboard_data.sort(key=lambda x: x['total_points'], reverse=True)
            return Response(leaderboard_data)
        except ScanError as e:
            return Response({"detail": f"Error generating leaderboard: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
