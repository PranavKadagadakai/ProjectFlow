from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions, status
from django.db.models import Sum, F
from django.conf import settings # Import settings
from .models import Project, Submission, Rubric, Evaluation
from .serializers import (
    ProjectSerializer, SubmissionSerializer, RubricSerializer, EvaluationSerializer, UserSerializer
)
from .utils import send_email_ses # Import the email utility

class ProtectedAPI(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        content = {'message': f'Hello, {request.user.username}! This is a protected API endpoint.'}
        return Response(content)
    
class HomeView(APIView):
    def get(self, request):
        content = {'message': 'Welcome to the Home Page!'}
        return Response(content)
    
class ProjectListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating projects.
    Faculty members can create projects. All authenticated users can view projects.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # Ensure only staff (faculty) can create projects
        if not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only faculty members can create projects.")
        serializer.save(created_by=self.request.user)

class ProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API endpoint for retrieving, updating, and deleting a specific project.
    Only the faculty member who created the project can update/delete it.
    """
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow faculty to update/delete only their own projects
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return self.queryset.filter(created_by=self.request.user)
        return self.queryset # All authenticated users can view

class SubmissionListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating submissions.
    Students can create submissions for projects.
    Faculty can view all submissions.
    """
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Students see only their own submissions
        if self.request.user.is_staff: # Assuming faculty are staff
            return Submission.objects.all()
        return Submission.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        project = serializer.validated_data['project']

        # Check if project is active for submissions
        if not project.is_active:
            raise exceptions.ValidationError({"detail": "This project is not active for submissions."})
        
        # Check if student has already submitted for this project
        if Submission.objects.filter(project=project, student=self.request.user).exists():
             raise exceptions.ValidationError({"detail": "You have already submitted for this project."})
        
        # Save the submission
        submission = serializer.save(student=self.request.user)

        # Send confirmation email via SES
        if settings.AWS_SES_SOURCE_EMAIL and self.request.user.email:
            subject = f"Project Submission Confirmation: {submission.project.title}"
            body_text = (
                f"Dear {self.request.user.username},\n\n"
                f"Your submission for the project '{submission.project.title}' has been successfully received.\n"
                f"Submission ID: {submission.id}\n"
                f"Submitted at: {submission.submitted_at}\n\n"
                "Thank you!"
            )
            body_html = f"""
            <html>
                <body>
                    <p>Dear {self.request.user.username},</p>
                    <p>Your submission for the project '<strong>{submission.project.title}</strong>' has been successfully received.</p>
                    <p>Submission ID: {submission.id}</p>
                    <p>Submitted at: {submission.submitted_at}</p>
                    <p>Thank you!</p>
                </body>
            </html>
            """
            send_email_ses(self.request.user.email, subject, body_text, body_html)

class SubmissionDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific submission.
    Students can view their own submission. Faculty can view any submission.
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Submission.objects.all()
        return Submission.objects.filter(student=self.request.user)

class RubricListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating rubrics.
    Only faculty can create rubrics for projects they own.
    All authenticated users can view rubrics for a given project.
    """
    serializer_class = RubricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk') # Get project ID from URL
        if project_id:
            return Rubric.objects.filter(project_id=project_id)
        return Rubric.objects.none() # Rubrics are always tied to a project

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        # Ensure only the project owner (faculty) can add rubrics to it
        if not self.request.user.is_staff or project.created_by != self.request.user:
            raise permissions.PermissionDenied("You do not have permission to add rubrics to this project.")
        serializer.save()

class EvaluationListCreateView(generics.ListCreateAPIView):
    """
    API endpoint for listing and creating evaluations.
    Only faculty can create evaluations.
    Students can view evaluations for their own submissions.
    Faculty can view all evaluations.
    """
    serializer_class = EvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        submission_id = self.kwargs.get('submission_pk')
        if submission_id:
            if self.request.user.is_staff:
                return Evaluation.objects.filter(submission_id=submission_id)
            else:
                return Evaluation.objects.filter(submission_id=submission_id, submission__student=self.request.user)
        
        if self.request.user.is_staff:
            return Evaluation.objects.all()
        return Evaluation.objects.none()

    def perform_create(self, serializer):
        # Ensure only faculty can evaluate
        if not self.request.user.is_staff:
            raise permissions.PermissionDenied("Only faculty can create evaluations.")
        
        submission = serializer.validated_data['submission']
        # You might add checks here to ensure the evaluation is for a valid submission
        # and that the faculty member is authorized to evaluate this specific project/submission.

        serializer.save(evaluated_by=self.request.user)

class LeaderboardView(APIView):
    """
    API endpoint to display a leaderboard of projects based on total evaluation points.
    All authenticated users can view the leaderboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # Calculate total points for each submission
        submissions_with_scores = Submission.objects.annotate(
            total_points=Sum('evaluations__points_awarded')
        ).filter(total_points__isnull=False).order_by('-total_points')

        leaderboard_data = []
        for submission in submissions_with_scores:
            leaderboard_data.append({
                'project_title': submission.project.title,
                'student_username': submission.student.username,
                'total_points': submission.total_points,
                'submission_id': submission.id,
            })
        
        return Response(leaderboard_data)
