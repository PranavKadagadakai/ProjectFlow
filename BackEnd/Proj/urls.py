from django.urls import path
from .views import (
    HomeView, ProtectedAPI,
    ProjectListCreateView, ProjectDetailView,
    SubmissionListCreateView, SubmissionDetailView,
    RubricListCreateView,
    EvaluationListCreateView,
    LeaderboardView
)

urlpatterns = [
    path('', HomeView.as_view() , name='home'),
    path('api/protected/', ProtectedAPI.as_view(), name='protected_api'),
    
    # Project URLs
    path('api/projects/', ProjectListCreateView.as_view(), name='project_list_create'),
    path('api/projects/<uuid:pk>/', ProjectDetailView.as_view(), name='project_detail'),

    # Submission URLs
    path('api/submissions/', SubmissionListCreateView.as_view(), name='submission_list_create'),
    path('api/submissions/<uuid:pk>/', SubmissionDetailView.as_view(), name='submission_detail'),

    # Rubric URLs (nested under project, or standalone if preferred)
    path('api/projects/<uuid:project_pk>/rubrics/', RubricListCreateView.as_view(), name='rubric_list_create'),

    # Evaluation URLs (nested under submission)
    path('api/submissions/<uuid:submission_pk>/evaluations/', EvaluationListCreateView.as_view(), name='evaluation_list_create'),

    # Leaderboard URL
    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
]