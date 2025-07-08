import os
import sys

# This block allows the script to be run directly from the command line
# by adding the project's root directory to the Python path.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ProjectFlow.settings")

import django
django.setup()

# Now we can import our models and other necessary components
from pynamodb.indexes import GlobalSecondaryIndex
from Proj.models import ProjectModel, SubmissionModel, RubricModel, EvaluationModel, UserProfileModel

def create_all_tables():
    """
    Creates all necessary DynamoDB tables if they do not already exist.
    This function explicitly checks for each model's table and creates it
    with the required indexes as defined in the PynamoDB model class.
    """
    # List of all PynamoDB models to be created
    models_to_create = [ProjectModel, SubmissionModel, RubricModel, EvaluationModel, UserProfileModel]

    for model in models_to_create:
        table_name = model.Meta.table_name
        print(f"--- Checking for table: {table_name} ---")

        # Helper to find GSIs defined on the model
        def get_model_gsi_names(m):
            gsi_names = []
            for attr_name in dir(m):
                if not attr_name.startswith('_'):
                    attr = getattr(m, attr_name)
                    if isinstance(attr, GlobalSecondaryIndex):
                        gsi_names.append(attr.Meta.index_name)
            return gsi_names

        try:
            # Check if the table already exists in DynamoDB
            if not model.exists():
                print(f"Table '{table_name}' does not exist. Creating now...")

                # Log the GSIs that will be created with the table
                gsi_to_create = get_model_gsi_names(model)
                if gsi_to_create:
                    print(f"Will create table with the following Global Secondary Indexes: {gsi_to_create}")

                # The create_table method reads the schema from the model class,
                # including the primary key, range key, and any defined GSIs.
                model.create_table(read_capacity_units=1, write_capacity_units=1, wait=True)

                print(f"Successfully created table '{table_name}'.")
            else:
                print(f"Table '{table_name}' already exists. No action taken.")
                # For existing tables, log the GSIs the code expects to find.
                # This helps diagnose mismatches.
                expected_gsi = get_model_gsi_names(model)
                if expected_gsi:
                    print(f"Note: The model code expects the following GSIs for this table: {expected_gsi}")
                    print("If you are seeing errors about a missing index, you may need to delete the table in your AWS account and run this script again.")

        except Exception as e:
            print(f"An error occurred while creating or checking table '{table_name}': {e}")
            print("Please ensure your AWS credentials and region are correctly configured in 'BackEnd/.env'.")
            break

if __name__ == "__main__":
    print("Starting DynamoDB table setup...")
    print("This will create tables if they don't exist based on your models.")
    create_all_tables()
    print("\n--- DynamoDB setup script finished. ---")