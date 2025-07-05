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

# We store IDs to represent relationships between tables.

class ISODateAttribute(UnicodeAttribute):
    """Custom PynamoDB attribute for ISO 8601 'YYYY-MM-DD' date strings."""
    attr_type = 'S'

    def serialize(self, value):
        if isinstance(value, date):
            return value.strftime('%Y-%m-%d')
        if isinstance(value, str):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
                raise ValueError(f"Date string '{value}' is not in 'YYYY-MM-DD' format.")
            return value
        raise TypeError("ISODateAttribute only accepts date objects or 'YYYY-MM-DD' strings.")

    def deserialize(self, value):
        return datetime.strptime(value, '%Y-%m-%d').date()

class BaseMeta:
    """Base configuration for PynamoDB models to connect to AWS."""
    region = settings.DYNAMODB_REGION
    aws_access_key_id = settings.AWS_ACCESS_KEY_ID
    aws_secret_access_key = settings.AWS_SECRET_ACCESS_KEY
    # Use local DynamoDB for development if DYNAMODB_HOST is set
    if settings.DYNAMODB_HOST:
        host = settings.DYNAMODB_HOST

class ProjectModel(Model):
    """Represents an academic project in DynamoDB."""
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
    """Represents a student's submission for a project."""
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_SUBMISSIONS_TABLE

    class ProjectStudentIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta):
            index_name = 'project_student_index'
            projection = AllProjection()
            # FIX: Added read and write capacity for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        project_id = UnicodeAttribute(hash_key=True)
        student_username = UnicodeAttribute(range_key=True)
    
    class StudentIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta):
            index_name = 'student_index'
            projection = AllProjection()
            # FIX: Added read and write capacity for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        student_username = UnicodeAttribute(hash_key=True)
        submitted_at = UTCDateTimeAttribute(range_key=True)

    submission_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute()
    student_username = UnicodeAttribute()
    report_file_s3_key = UnicodeAttribute(null=True)
    report_content_summary = UnicodeAttribute(null=True) # For ML model
    github_link = UnicodeAttribute(null=True)
    youtube_link = UnicodeAttribute(null=True)
    submitted_at = UTCDateTimeAttribute(default=datetime.utcnow)
    status = UnicodeAttribute(default='Submitted') # e.g., 'Submitted', 'Under Evaluation', 'Evaluated'
    
    # New fields for storing final scores
    manual_score = NumberAttribute(null=True)
    ml_score = NumberAttribute(null=True)
    overall_score = NumberAttribute(null=True)
    
    project_student_index = ProjectStudentIndex()
    student_index = StudentIndex()

class RubricModel(Model):
    """Defines an evaluation criterion for a project."""
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_RUBRICS_TABLE

    class ProjectIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta):
            index_name = 'project_index'
            projection = AllProjection()
            # FIX: Added read and write capacity for the GSI
            read_capacity_units = 1
            write_capacity_units = 1
        project_id = UnicodeAttribute(hash_key=True)

    rubric_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute()
    criterion = UnicodeAttribute() # E.g., 'Innovation', 'Quality', 'Impact'
    max_points = NumberAttribute()
    description = UnicodeAttribute(null=True)
    
    project_index = ProjectIndex()

class EvaluationModel(Model):
    """Represents a faculty's evaluation for a single rubric criterion on a submission."""
    class Meta(BaseMeta):
        table_name = settings.DYNAMODB_EVALUATIONS_TABLE

    class SubmissionIndex(GlobalSecondaryIndex):
        class Meta(BaseMeta):
            index_name = 'submission_index'
            projection = AllProjection()
            # FIX: Added read and write capacity for the GSI
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

    # New fields to store ML scores for comparison, if evaluated per criterion
    ml_points_awarded = NumberAttribute(null=True)
    ml_feedback = UnicodeAttribute(null=True)
    
    submission_index = SubmissionIndex()