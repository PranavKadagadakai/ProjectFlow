from django.urls import path
from .views import HomeView, ProtectedAPI

urlpatterns = [
    path('', HomeView.as_view() , name='home'),
    path('api/protected/', ProtectedAPI.as_view(), name='protected_api'),
]