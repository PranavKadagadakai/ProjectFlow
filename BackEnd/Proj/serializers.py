from rest_framework import serializers
from .models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel

class ProjectSerializer(serializers.Serializer):
    """Serializer for the ProjectModel."""
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
    """Serializer for the SubmissionModel."""
    submission_id = serializers.CharField(read_only=True)
    project_id = serializers.CharField()
    student_username = serializers.CharField(read_only=True)
    report_file_s3_key = serializers.CharField(read_only=True, required=False)
    report_content_summary = serializers.CharField(required=False, allow_blank=True)
    github_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    youtube_link = serializers.URLField(required=False, allow_blank=True, allow_null=True)
    submitted_at = serializers.DateTimeField(read_only=True)
    status = serializers.CharField(read_only=True)
    manual_score = serializers.FloatField(read_only=True, required=False)
    ml_score = serializers.FloatField(read_only=True, required=False)
    overall_score = serializers.FloatField(read_only=True, required=False)

    def create(self, validated_data):
        submission = SubmissionModel(**validated_data)
        submission.save()
        return submission

class RubricSerializer(serializers.Serializer):
    """Serializer for the RubricModel."""
    rubric_id = serializers.CharField(read_only=True)
    project_id = serializers.CharField()
    criterion = serializers.CharField(max_length=255)
    max_points = serializers.IntegerField(min_value=1)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated_data):
        rubric = RubricModel(**validated_data)
        rubric.save()
        return rubric

class EvaluationSerializer(serializers.Serializer):
    """Serializer for the EvaluationModel."""
    evaluation_id = serializers.CharField(read_only=True)
    submission_id = serializers.CharField()
    rubric_id = serializers.CharField()
    evaluated_by_username = serializers.CharField(read_only=True)
    points_awarded = serializers.IntegerField(min_value=0)
    feedback = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    evaluated_at = serializers.DateTimeField(read_only=True)
    # Include rubric details for context in response
    rubric = RubricSerializer(read_only=True) 

    def create(self, validated_data):
        evaluation = EvaluationModel(**validated_data)
        evaluation.save()
        return evaluation