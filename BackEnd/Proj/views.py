from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, permissions
from django.db.models import Sum, F
from .models import Project, Submission, Rubric, Evaluation
from .serializers import (
    ProjectSerializer, SubmissionSerializer, RubricSerializer, EvaluationSerializer, UserSerializer
)

class ProtectedAPI(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        content = {'message': 'Hello, World!'}
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
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access

    def perform_create(self, serializer):
        # The 'created_by' field is automatically set to the authenticated user.
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
        if hasattr(self.request.user, 'is_staff') and self.request.user.is_staff: # Assuming faculty are staff
            return Submission.objects.all()
        return Submission.objects.filter(student=self.request.user)

    def perform_create(self, serializer):
        # Ensure the student submitting is the authenticated user
        # Also ensure submission is within the project's active period
        project = serializer.validated_data['project']
        if not project.is_active:
            raise exceptions.ValidationError({"detail": "This project is not active for submissions."})
        if self.request.user in [sub.student for sub in project.submissions.all()]:
             raise exceptions.ValidationError({"detail": "You have already submitted for this project."})
        
        serializer.save(student=self.request.user)

class SubmissionDetailView(generics.RetrieveAPIView):
    """
    API endpoint for retrieving a specific submission.
    Students can view their own submission. Faculty can view any submission.
    """
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if hasattr(self.request.user, 'is_staff') and self.request.user.is_staff:
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
        return Rubric.objects.all()

    def perform_create(self, serializer):
        project = serializer.validated_data['project']
        # Ensure only the project owner can add rubrics to it
        if project.created_by != self.request.user:
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
            # If a submission ID is provided, filter evaluations for that submission
            if hasattr(self.request.user, 'is_staff') and self.request.user.is_staff:
                return Evaluation.objects.filter(submission_id=submission_id)
            else:
                # Students can only see evaluations for their own submissions
                return Evaluation.objects.filter(submission_id=submission_id, submission__student=self.request.user)
        
        # If no submission ID, faculty can see all evaluations, students see none
        if hasattr(self.request.user, 'is_staff') and self.request.user.is_staff:
            return Evaluation.objects.all()
        return Evaluation.objects.none() # Students shouldn't see all evaluations

    def perform_create(self, serializer):
        submission = serializer.validated_data['submission']
        # Ensure only faculty can evaluate
        if not (hasattr(self.request.user, 'is_staff') and self.request.user.is_staff):
            raise permissions.PermissionDenied("Only faculty can create evaluations.")
        
        # Ensure faculty is evaluating a valid submission
        if not submission: # Or check if submission exists for a valid project etc.
            raise exceptions.ValidationError({"detail": "Invalid submission."})

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