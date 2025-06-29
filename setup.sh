#!/bin/bash

# setup.sh - Automated setup script for the Project Submission Portal on Linux/macOS

echo "--- Starting Project Setup ---"

# --- Environment File Setup ---
echo "[1/5] Checking for environment files..."

# Create Backend .env if it doesn't exist
if [ ! -f "BackEnd/.env" ]; then
    echo "Creating dummy .env file for Backend..."
    cat <<EOF > BackEnd/.env
# AWS Credentials and Configuration
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# AWS Cognito Configuration
AWS_COGNITO_REGION=us-east-1
AWS_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
AWS_COGNITO_APP_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID

# AWS S3 Configuration
AWS_S3_REGION_NAME=us-east-1
AWS_STORAGE_BUCKET_NAME=YOUR_S3_BUCKET_NAME

# AWS SES Configuration
AWS_SES_SOURCE_EMAIL=your-verified-email@example.com

# AWS DynamoDB Configuration (for local development)
AWS_DYNAMODB_REGION=us-east-1
# For local DynamoDB, uncomment the next line:
# AWS_DYNAMODB_ENDPOINT_URL=http://localhost:8000

# DynamoDB Table Names (defaults are usually fine)
DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations
EOF
    echo "IMPORTANT: Dummy 'BackEnd/.env' created. Please edit it with your actual AWS credentials."
fi

# Create Frontend .env if it doesn't exist
if [ ! -f "FrontEnd/.env" ]; then
    echo "Creating .env file for Frontend..."
    echo "VITE_BACKEND_API_URL=http://127.0.0.1:8000" > FrontEnd/.env
fi

# --- Backend Setup ---
echo "[2/5] Setting up Python backend..."
cd BackEnd

# Check if python3 is available
if ! command -v python3 &> /dev/null
then
    echo "ERROR: python3 could not be found. Please install Python 3."
    exit 1
fi

# Create a virtual environment
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create Python virtual environment."
    exit 1
fi

# Activate the virtual environment
source venv/bin/activate

# Install Python packages
echo "Installing Python packages from requirements.txt..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Python packages."
    deactivate
    exit 1
fi

echo "Backend setup complete."

# --- Frontend Setup ---
echo "[3/5] Setting up Node.js frontend..."
cd ../FrontEnd

# Check if npm is available
if ! command -v npm &> /dev/null
then
    echo "ERROR: npm could not be found. Please install Node.js."
    deactivate
    exit 1
fi

# Install Node modules
echo "Installing Node.js packages from package.json..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js packages."
    deactivate
    exit 1
fi

echo "Frontend setup complete."

# --- DynamoDB Table Creation ---
echo "[4/5] Creating DynamoDB tables..."
cd ../BackEnd

# Run the table creation script using the activated venv
python Proj/create_tables.py
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to create DynamoDB tables. Ensure your AWS credentials in BackEnd/.env are correct and the local/remote DynamoDB instance is running."
fi

# Deactivate the virtual environment
deactivate
cd ..

echo "[5/5] Final instructions..."
echo "--- Setup Complete! ---"
echo ""
echo "ACTION REQUIRED: Please edit the dummy 'BackEnd/.env' file with your real AWS credentials."
echo ""
echo "To run the application:"
echo "1. Open a new terminal and run the backend server:"
echo "   cd BackEnd"
echo "   source venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. Open another new terminal and run the frontend server:"
echo "   cd FrontEnd"
echo "   npm run dev"
echo ""
echo "The application will be available at http://localhost:5173"