import os
import sys
import django
from dotenv import load_dotenv

# Add the parent directory (BackEnd/) to sys.path
# This allows 'ProjectFlow.settings' to be imported correctly.
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, '..') # Go up one level to 'BackEnd'
sys.path.insert(0, backend_dir)

# Now, load environment variables using a robust path
# Ensure .env is in the BackEnd/ directory as per previous instructions
dotenv_path = os.path.join(backend_dir, '.env')
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path)

# Set Django settings module and setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ProjectFlow.settings')
django.setup()

from Proj.models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel
from pynamodb.exceptions import DoesNotExist # Import DoesNotExist for exists() check

def create_all_dynamodb_tables():
    """
    Attempts to create all defined DynamoDB tables if they do not already exist.
    """
    print("Attempting to create DynamoDB tables...")
    tables_to_create = [ProjectModel, SubmissionModel, RubricModel, EvaluationModel]
    for model in tables_to_create:
        try:
            # Check if table exists. pynamodb.models.Model.exists() handles this.
            if not model.exists():
                print(f"Creating table: {model.Meta.table_name}...")
                # It's good practice to specify billing_mode for new tables.
                # PAY_PER_REQUEST is simpler for development.
                model.create_table(wait=True, billing_mode='PAY_PER_REQUEST') 
                print(f"Table {model.Meta.table_name} created successfully.")
            else:
                print(f"Table {model.Meta.table_name} already exists.")
        except Exception as e:
            # Catch any exceptions during table creation and report them.
            print(f"Error creating table {model.Meta.table_name}: {e}")

if __name__ == '__main__':
    create_all_dynamodb_tables()