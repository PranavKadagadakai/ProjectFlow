from pynamodb.models import Model
from pynamodb.attributes import Attribute, UnicodeAttribute, UTCDateTimeAttribute, BooleanAttribute, NumberAttribute, MapAttribute
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection
from uuid import uuid4
from datetime import datetime, date
from django.conf import settings # To access settings for table names
import re

# DynamoDB doesn't have a direct concept of ForeignKey.
# We store IDs to represent relationships.

class ISODateAttribute(Attribute):
    """
    Custom PynamoDB attribute for ISO 8601 'YYYY-MM-DD' date strings.
    Serializes/deserializes Python date objects to standardized string format.
    """
    attr_type = UnicodeAttribute.attr_type
    iso_regex = re.compile(r"^\d{4}-\d{2}-\d{2}$")

    def serialize(self, value):
        if isinstance(value, date):
            return value.strftime('%Y-%m-%d')
        elif isinstance(value, str):
            if not self.iso_regex.match(value):
                raise ValueError(f"Date string '{value}' is not in 'YYYY-MM-DD' format.")
            return value
        raise TypeError("ISODateAttribute only accepts date objects or ISO 8601 date strings.")

    def deserialize(self, value):
        if isinstance(value, str) and self.iso_regex.match(value):
            return datetime.strptime(value, '%Y-%m-%d').date()
        raise ValueError(f"Cannot deserialize value '{value}' as ISO 8601 date string.")

class ProjectModel(Model):
    """
    Represents an academic project in DynamoDB.
    Partition Key: project_id (UUID)
    """
    class Meta:
        table_name = settings.DYNAMODB_PROJECTS_TABLE
        region = settings.DYNAMODB_REGION
        aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
        aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
        host = settings.DYNAMODB_HOST if settings.DEBUG else None # Use local DynamoDB for dev

    project_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    title = UnicodeAttribute()
    description = UnicodeAttribute()
    created_by_username = UnicodeAttribute() # Storing username as link to Django User
    start_date = ISODateAttribute() # Store as 'YYYY-MM-DD' string
    end_date = ISODateAttribute() # Store as 'YYYY-MM-DD' string
    is_active = BooleanAttribute(default=True)
    created_at = UTCDateTimeAttribute(default=datetime.utcnow)
    updated_at = UTCDateTimeAttribute(default=datetime.utcnow)

    # Global Secondary Index for querying by creator
    # This allows efficient lookup of projects created by a specific user.
    class CreatedByIndex(GlobalSecondaryIndex):
        class Meta:
            read_capacity_units = settings.DYNAMODB_DEFAULT_READ_CAPACITY
            write_capacity_units = settings.DYNAMODB_DEFAULT_WRITE_CAPACITY
            projection = AllProjection() # Project all attributes
            region = settings.DYNAMODB_REGION
            aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
            aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
            host = settings.DYNAMODB_HOST if settings.DEBUG else None

        created_by_username = UnicodeAttribute(hash_key=True)


class SubmissionModel(Model):
    """
    Represents a student's submission for a specific project in DynamoDB.
    Partition Key: submission_id (UUID)
    Global Secondary Index: project_id-student_username-index (for uniqueness and querying)
    """
    class Meta:
        table_name = settings.DYNAMODB_SUBMISSIONS_TABLE
        region = settings.DYNAMODB_REGION
        aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
        aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
        host = settings.DYNAMODB_HOST if settings.DEBUG else None

    submission_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute() # Link to Project
    student_username = UnicodeAttribute() # Link to Django User
    report_file_s3_key = UnicodeAttribute(null=True) # S3 key for the report file
    github_link = UnicodeAttribute(null=True)
    youtube_link = UnicodeAttribute(null=True)
    demo_video_file_s3_key = UnicodeAttribute(null=True) # S3 key for the demo video file
    submitted_at = UTCDateTimeAttribute(default=datetime.utcnow)
    status = UnicodeAttribute(default='pending') # E.g., 'pending', 'evaluated', 'revisions_requested'

    # Global Secondary Index to enforce unique submission per project per student
    # Also allows querying submissions by project and student.
    class ProjectStudentIndex(GlobalSecondaryIndex):
        class Meta:
            read_capacity_units = settings.DYNAMODB_DEFAULT_READ_CAPACITY
            write_capacity_units = settings.DYNAMODB_DEFAULT_WRITE_CAPACITY
            projection = AllProjection()
            region = settings.DYNAMODB_REGION
            aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
            aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
            host = settings.DYNAMODB_HOST if settings.DEBUG else None

        project_id = UnicodeAttribute(hash_key=True)
        student_username = UnicodeAttribute(range_key=True)

    # GSI for querying all submissions by student (efficient for student views)
    class StudentIndex(GlobalSecondaryIndex):
        class Meta:
            read_capacity_units = settings.DYNAMODB_DEFAULT_READ_CAPACITY
            write_capacity_units = settings.DYNAMODB_DEFAULT_WRITE_CAPACITY
            projection = AllProjection()
            region = settings.DYNAMODB_REGION
            aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
            aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
            host = settings.DYNAMODB_HOST if settings.DEBUG else None
        student_username = UnicodeAttribute(hash_key=True)
        submitted_at = UTCDateTimeAttribute(range_key=True)


class RubricModel(Model):
    """
    Defines evaluation criteria (rubric) for a project in DynamoDB.
    Partition Key: rubric_id (UUID)
    Global Secondary Index: project_id-index
    """
    class Meta:
        table_name = settings.DYNAMODB_RUBRICS_TABLE
        region = settings.DYNAMODB_REGION
        aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
        aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
        host = settings.DYNAMODB_HOST if settings.DEBUG else None

    rubric_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    project_id = UnicodeAttribute() # Link to Project
    criterion = UnicodeAttribute()
    max_points = NumberAttribute()
    description = UnicodeAttribute(null=True)

    # GSI for querying rubrics by project_id
    class ProjectIndex(GlobalSecondaryIndex):
        class Meta:
            read_capacity_units = settings.DYNAMODB_DEFAULT_READ_CAPACITY
            write_capacity_units = settings.DYNAMODB_DEFAULT_WRITE_CAPACITY
            projection = AllProjection()
            region = settings.DYNAMODB_REGION
            aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
            aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
            host = settings.DYNAMODB_HOST if settings.DEBUG else None

        project_id = UnicodeAttribute(hash_key=True)


class EvaluationModel(Model):
    """
    Represents a faculty's evaluation of a specific submission based on rubrics in DynamoDB.
    Partition Key: evaluation_id (UUID)
    Global Secondary Index: submission_id-rubric_id-evaluated_by-index (for uniqueness and querying)
    """
    class Meta:
        table_name = settings.DYNAMODB_EVALUATIONS_TABLE
        region = settings.DYNAMODB_REGION
        aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
        aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
        host = settings.DYNAMODB_HOST if settings.DEBUG else None

    evaluation_id = UnicodeAttribute(hash_key=True, default=lambda: str(uuid4()))
    submission_id = UnicodeAttribute() # Link to Submission
    rubric_id = UnicodeAttribute() # Link to Rubric
    evaluated_by_username = UnicodeAttribute() # Link to Django User
    points_awarded = NumberAttribute()
    feedback = UnicodeAttribute(null=True)
    evaluated_at = UTCDateTimeAttribute(default=datetime.utcnow)

    # GSI to enforce uniqueness for evaluation of a rubric by a specific faculty for a submission
    # Also allows querying evaluations by submission, rubric, and evaluator.
    class SubmissionRubricEvaluatorIndex(GlobalSecondaryIndex):
        class Meta:
            read_capacity_units = settings.DYNAMODB_DEFAULT_READ_CAPACITY
            write_capacity_units = settings.DYNAMODB_DEFAULT_WRITE_CAPACITY
            projection = AllProjection()
            region = settings.DYNAMODB_REGION
            aws_access_key_id = settings.DYNAMODB_ACCESS_KEY_ID
            aws_secret_access_key = settings.DYNAMODB_SECRET_ACCESS_KEY
            host = settings.DYNAMODB_HOST if settings.DEBUG else None

        submission_id = UnicodeAttribute(hash_key=True)
        # Combine rubric_id and evaluated_by_username for range key to ensure uniqueness per rubric per evaluator
        # You might need to adjust this composite key based on your exact uniqueness requirement.
        # For true uniqueness of (submission, rubric, evaluated_by), you'd need a composite sort key.
        # For simplicity, let's use submission_id as PK and a composite string for RK.
        rubric_evaluated_key = UnicodeAttribute(range_key=True)


# Helper function to create tables if they don't exist
# This is typically run during deployment, not on every Django start.
def create_dynamodb_tables():
    if not ProjectModel.exists():
        ProjectModel.create_table(wait=True)
        print(f"Table {ProjectModel.Meta.table_name} created.")
    if not SubmissionModel.exists():
        SubmissionModel.create_table(wait=True)
        print(f"Table {SubmissionModel.Meta.table_name} created.")
    if not RubricModel.exists():
        RubricModel.create_table(wait=True)
        print(f"Table {RubricModel.Meta.table_name} created.")
    if not EvaluationModel.exists():
        EvaluationModel.create_table(wait=True)
        print(f"Table {EvaluationModel.Meta.table_name} created.")

