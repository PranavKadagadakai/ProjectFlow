from rest_framework import serializers
from .models import Project, Submission, Rubric, Evaluation
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model, to expose only necessary fields."""
    class Meta:
        model = User
        fields = ['id', 'username', 'email'] # You might want to add more fields if needed

class ProjectSerializer(serializers.ModelSerializer):
    """Serializer for the Project model."""
    created_by = UserSerializer(read_only=True) # Read-only for creation, populated automatically

    class Meta:
        model = Project
        fields = '__all__' # Include all fields from the Project model

class SubmissionSerializer(serializers.ModelSerializer):
    """Serializer for the Submission model."""
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all()) # Allows setting project by ID
    student = UserSerializer(read_only=True) # Student is determined by authenticated user

    class Meta:
        model = Submission
        fields = '__all__' # Include all fields from the Submission model
        read_only_fields = ('status',) # Status will be managed by the system

class RubricSerializer(serializers.ModelSerializer):
    """Serializer for the Rubric model."""
    project = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all())

    class Meta:
        model = Rubric
        fields = '__all__'

class EvaluationSerializer(serializers.ModelSerializer):
    """Serializer for the Evaluation model."""
    submission = serializers.PrimaryKeyRelatedField(queryset=Submission.objects.all())
    rubric = serializers.PrimaryKeyRelatedField(queryset=Rubric.objects.all())
    evaluated_by = UserSerializer(read_only=True)

    class Meta:
        model = Evaluation
        fields = '__all__'