from django.urls import path
from .views import (
    ProjectListCreateView, ProjectDetailView,
    SubmissionListCreateView, SubmissionDetailView,
    RubricListCreateView,
    EvaluationListCreateView,
    FinalizeEvaluationView,
    LeaderboardView,
    MySubmissionsListView
)

urlpatterns = [
    # Project URLs
    path('api/projects/', ProjectListCreateView.as_view(), name='project-list-create'),
    path('api/projects/<str:project_id>/', ProjectDetailView.as_view(), name='project-detail'),

    # Submission URLs
    path('api/submissions/', SubmissionListCreateView.as_view(), name='submission-list-create'),
    path('api/submissions/my-submissions/', MySubmissionsListView.as_view(), name='my-submissions-list'),
    path('api/submissions/<str:submission_id>/', SubmissionDetailView.as_view(), name='submission-detail'),

    # Rubric URLs
    path('api/projects/<str:project_id>/rubrics/', RubricListCreateView.as_view(), name='rubric-list-create'),

    # Evaluation URLs
    path('api/submissions/<str:submission_id>/evaluations/', EvaluationListCreateView.as_view(), name='evaluation-list-create'),
    path('api/submissions/<str:submission_id>/finalize_evaluation/', FinalizeEvaluationView.as_view(), name='finalize-evaluation'),

    # Leaderboard URL
    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]