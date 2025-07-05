import os
import sys

# This block allows the script to be run directly from the command line
# by adding the project's root directory to the Python path.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ProjectFlow.settings")

import django
django.setup()

# Now we can import our models
from Proj.models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel

def create_all_tables():
    """
    Creates all necessary DynamoDB tables if they do not already exist.
    This function explicitly checks for each model's table and creates it
    with the required indexes as defined in the PynamoDB model class.
    """
    # List of all PynamoDB models to be created
    models_to_create = [ProjectModel, SubmissionModel, RubricModel, EvaluationModel]

    for model in models_to_create:
        table_name = model.Meta.table_name
        print(f"--- Checking for table: {table_name} ---")
        try:
            # Check if the table already exists in DynamoDB
            if not model.exists():
                print(f"Table '{table_name}' does not exist. Creating now...")
                
                # The create_table method reads the schema from the model class,
                # including the primary key, range key, and any defined Global Secondary Indexes (GSIs).
                model.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)
                
                print(f"Successfully created table '{table_name}'.")
            else:
                print(f"Table '{table_name}' already exists. No action taken.")
        except Exception as e:
            print(f"An error occurred while creating or checking table '{table_name}': {e}")
            print("Please ensure your AWS credentials and region are correctly configured in 'BackEnd/.env'.")
            break

if __name__ == "__main__":
    print("Starting DynamoDB table setup...")
    print("This will create tables if they don't exist based on your models.")
    create_all_tables()
    print("\n--- DynamoDB setup script finished. ---")