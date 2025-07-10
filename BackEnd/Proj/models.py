from pynamodb.models import Model
from pynamodb.attributes import (
    UnicodeAttribute, UTCDateTimeAttribute, BooleanAttribute,
    NumberAttribute, MapAttribute
)
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from uuid import uuid4
from datetime import datetime, date
from django.conf import settings
import re

class ISODateAttribute(UnicodeAttribute):
    attr_type = 'S'
    def serialize(self, value):
        if isinstance(value, date): return value.strftime('%Y-%m-%d')
        if isinstance(value, str):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
                raise ValueError(f"Date string '{value}' is not in 'YYYY-MM-DD' format.")
            return value
        raise TypeError("ISODateAttribute only accepts date objects or 'YYYY-MM-DD' strings.")
    def deserialize(self, value):
        return datetime.strptime(value, '%Y-%m-%d').date()

class BaseMeta:
    # Common Meta attributes for all PynamoDB models
    region = settings.DYNAMODB_REGION
    aws_access_key_id = settings.AWS_ACCESS_KEY_ID
    aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY
    # You can set default read/write capacity here for the main table,
    # but GSIs need their own explicit settings.
    read_capacity_units = 1
    write_capacity_units = 1


class UserProfileModel(Model):
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_USER_PROFILES_TABLE
    username = UnicodeAttribute(hash_key=True)
    full_name = UnicodeAttribute(null=True)
    bio = UnicodeAttribute(null=True)
    profile_picture_url = UnicodeAttribute(null=True)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)

class ProjectModel(Model):
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_PROJECTS_TABLE
    project_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    title = UnicodeAttribute()
    description = UnicodeAttribute()
    created_by_username = UnicodeAttribute()
    start_date = ISODateAttribute()
    end_date = ISODateAttribute()
    is_active = BooleanAttribute(default=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)

class SubmissionModel(Model):
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_SUBMISSIONS_TABLE

    class ProjectStudentIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta): # Inherit BaseMeta for region and credentials
            index_name = 'project_student_index'
            projection = AllProjection()
            # FIX: Explicitly define provisioned throughput for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        project_id = UnicodeAttribute(hash_key=True)
        student_username = UnicodeAttribute(range_key=True)

    class StudentIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta): # Inherit BaseMeta for region and credentials
            index_name = 'student_index'
            projection = AllProjection()
            # FIX: Explicitly define provisioned throughput for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        student_username = UnicodeAttribute(hash_key=True)
        submitted_at = UTCDateTimeAttribute(range_key=True)

    submission_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute()
    student_username = UnicodeAttribute()
    title = UnicodeAttribute()
    
    report_file_path = UnicodeAttribute(null=True)
    report_content_summary = UnicodeAttribute(null=True)
    github_link = UnicodeAttribute(null=True)
    
    source_code_file_path = UnicodeAttribute(null=True)
    
    submitted_at = UTCDateTimeAttribute(default=datetime.utcnow)
    status = UnicodeAttribute(default='Submitted')
    version = NumberAttribute(default=1)
    is_latest = BooleanAttribute(default=True)
    manual_score = NumberAttribute(null=True)
    ml_score = NumberAttribute(null=True)
    overall_score = NumberAttribute(null=True)

    # Associate the indexes with the model
    project_student_index = ProjectStudentIndex()
    student_index = StudentIndex()

class RubricModel(Model):
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_RUBRICS_TABLE

    class ProjectIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta): # Inherit BaseMeta for region and credentials
            index_name = 'project_index'
            projection = AllProjection()
            # FIX: Explicitly define provisioned throughput for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        project_id = UnicodeAttribute(hash_key=True)
    rubric_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute()
    criterion = UnicodeAttribute()
    max_points = NumberAttribute()
    description = UnicodeAttribute(null=True)
    project_index = ProjectIndex() # Associate the index

class EvaluationModel(Model):
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_EVALUATIONS_TABLE

    class SubmissionIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta): # Inherit BaseMeta for region and credentials
            index_name = 'submission_index'
            projection = AllProjection()
            # FIX: Explicitly define provisioned throughput for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        submission_id = UnicodeAttribute(hash_key=True)
    evaluation_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    submission_id = UnicodeAttribute()
    rubric_id = UnicodeAttribute()
    evaluated_by_username = UnicodeAttribute()
    points_awarded = NumberAttribute()
    feedback = UnicodeAttribute(null=True)
    evaluated_at = UTCDateTimeAttribute(default=datetime.utcnow)
    ml_points_awarded = NumberAttribute(null=True)
    ml_feedback = UnicodeAttribute(null=True)
    submission_index = SubmissionIndex() # Associate the index
