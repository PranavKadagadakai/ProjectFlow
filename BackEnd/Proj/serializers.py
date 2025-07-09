from rest_framework import serializers
from django.core.files.storage import default_storage
from .models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel, UserProfileModel
from datetime import datetime

class UserProfileSerializer(serializers.Serializer):
    username = serializers.CharField(read_only=True)
    full_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    profile_picture_url = serializers.URLField(required=False, allow_blank=True)
    updated_at = serializers.DateTimeField(read_only=True)
    def update(self, instance, validated_data):
        instance.full_name = validated_data.get('full_name', instance.full_name)
        instance.bio = validated_data.get('bio', instance.bio)
        instance.profile_picture_url = validated_data.get('profile_picture_url', instance.profile_picture_url)
        instance.updated_at = datetime.utcnow()
        instance.save()
        return instance

class ProjectSerializer(serializers.Serializer):
    project_id = serializers.CharField(read_only=True)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    created_by_username = serializers.CharField(read_only=True)
    start_date = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
    end_date = serializers.DateField(format="%Y-%m-%d", input_formats=["%Y-%m-%d"])
    is_active = serializers.BooleanField(required=False, default=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)
    def create(self, validated_data):
        project = ProjectModel(**validated_data)
        project.save()
        return project
    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.updated_at = datetime.utcnow()
        instance.save()
        return instance

class SubmissionSerializer(serializers.Serializer):
    # Fields that come from the frontend form
    project_id = serializers.CharField()
    title = serializers.CharField(max_length=255)
    github_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    
    # File fields for upload. These are not stored in the model directly.
    # `write_only=True` means they are used for input but not for output.
    report_file = serializers.FileField(write_only=True)
    source_code_file = serializers.FileField(write_only=True, required=False, allow_null=True)

    # Read-only fields that are returned in the API response
    submission_id = serializers.CharField(read_only=True)
    student_username = serializers.CharField(read_only=True)
    report_file_path = serializers.CharField(read_only=True)
    source_code_file_path = serializers.CharField(read_only=True, allow_null=True)
    report_content_summary = serializers.CharField(read_only=True)
    submitted_at = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)
    version = serializers.IntegerField(read_only=True)

    # FIX: Add the score fields so they are included in the API response.
    manual_score = serializers.FloatField(read_only=True, required=False)
    ml_score = serializers.FloatField(read_only=True, required=False)
    overall_score = serializers.FloatField(read_only=True, required=False)


    def validate(self, data):
        github_link = data.get('github_link')
        source_code_file = data.get('source_code_file')
        if not github_link and not source_code_file:
            raise serializers.ValidationError("Either a GitHub link or a source code ZIP file must be provided.")
        if github_link and source_code_file:
            raise serializers.ValidationError("Cannot provide both a GitHub link and a source code ZIP file.")
        return data

    def create(self, validated_data):
        # Pop the file objects from validated_data to handle them separately.
        report_file_obj = validated_data.pop('report_file')
        source_code_file_obj = validated_data.pop('source_code_file', None)

        # Save the report file using Django's default storage (FileSystemStorage)
        # This returns the relative path where the file was saved.
        report_path = default_storage.save(f"reports/{report_file_obj.name}", report_file_obj)
        validated_data['report_file_path'] = report_path

        # If a source code file was uploaded, save it too.
        if source_code_file_obj:
            source_code_path = default_storage.save(f"source_code/{source_code_file_obj.name}", source_code_file_obj)
            validated_data['source_code_file_path'] = source_code_path
        else:
            validated_data['source_code_file_path'] = None

        # Create and save the PynamoDB model instance with the file paths.
        submission = SubmissionModel(**validated_data)
        submission.save()
        return submission

class RubricSerializer(serializers.Serializer):
    rubric_id = serializers.CharField(read_only=True)
    project_id = serializers.CharField(read_only=True)
    criterion = serializers.CharField(max_length=255)
    max_points = serializers.IntegerField(min_value=1)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    def create(self, validated_data):
        rubric = RubricModel(**validated_data)
        rubric.save()
        return rubric
    def update(self, instance, validated_data):
        instance.criterion = validated_data.get('criterion', instance.criterion)
        instance.max_points = validated_data.get('max_points', instance.max_points)
        instance.description = validated_data.get('description', instance.description)
        instance.save()
        return instance

class EvaluationSerializer(serializers.Serializer):
    evaluation_id = serializers.CharField(read_only=True)
    # FIX: Set submission_id to read_only as it's provided by the URL, not the request body.
    submission_id = serializers.CharField(read_only=True)
    rubric_id = serializers.CharField()
    evaluated_by_username = serializers.CharField(read_only=True)
    points_awarded = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    evaluated_at = serializers.DateTimeField(read_only=True)
    rubric = RubricSerializer(read_only=True)
    def create(self, validated_data):
        # The view's serializer.save(submission_id=...) call adds submission_id here.
        evaluation = EvaluationModel(**validated_data)
        evaluation.save()
        return evaluation