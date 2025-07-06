#!/bin/bash

# setup.sh - Automated setup script for the Project Submission Portal on Linux/macOS

echo "--- Starting Project Setup ---"

# --- Environment File Setup ---
echo "[1/6] Checking for environment files..."

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

# AWS DynamoDB Configuration
AWS_DYNAMODB_REGION=us-east-1
# For local DynamoDB, uncomment the next line:
# AWS_DYNAMODB_ENDPOINT_URL=http://localhost:8000
DYNAMODB_READ_CAPACITY=1
DYNAMODB_WRITE_CAPACITY=1

# DynamoDB Table Names
DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations

# ML Model Configuration
ML_SCORE_WEIGHT=0.3
EOF
    echo "IMPORTANT: Dummy 'BackEnd/.env' created. Please edit it with your actual AWS credentials."
fi

# Create Frontend .env if it doesn't exist
if [ ! -f "FrontEnd/.env" ]; then
    echo "Creating .env file for Frontend..."
    cat <<EOF > FrontEnd/.env
VITE_BACKEND_API_URL=http://127.0.0.1:8000
VITE_AWS_PROJECT_REGION=us-east-1
VITE_AWS_COGNITO_REGION=us-east-1
VITE_AWS_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_AWS_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
VITE_AWS_S3_BUCKET=YOUR_S3_BUCKET_NAME
VITE_AWS_S3_REGION=us-east-1
EOF
fi

# --- Backend Setup ---
echo "[2/6] Setting up Python backend..."
cd BackEnd

# Check if python3 is available
if ! command -v python3 &> /dev/null
then
    echo "ERROR: python3 could not be found. Please install Python 3."
    exit 1
fi

# Create a virtual environment
python3 -m venv .venv
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to create Python virtual environment."
    exit 1
fi

# Activate the virtual environment
source .venv/bin/activate

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
echo "[3/6] Setting up Node.js frontend..."
cd ../FrontEnd

# Check if npm is available
if ! command -v npm &> /dev/null
then
    echo "ERROR: npm could not be found. Please install Node.js."
    # We are in FrontEnd, need to go back to BackEnd to deactivate
    cd ../BackEnd
    deactivate
    exit 1
fi

# Install Node modules
echo "Installing Node.js packages from package.json..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install Node.js packages."
    cd ../BackEnd
    deactivate
    exit 1
fi

echo "Frontend setup complete."

# --- NLTK Data Download ---
echo "[4/6] Downloading NLTK models..."
cd ../BackEnd

# Run the download commands using the activated .venv
python -m nltk.downloader punkt
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to download NLTK 'punkt' model."
fi
python -m nltk.downloader stopwords
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to download NLTK 'stopwords' model."
fi


# --- DynamoDB Table Creation ---
echo "[5/6] Creating DynamoDB tables..."
# Already in BackEnd directory
python Proj/create_tables.py
if [ $? -ne 0 ]; then
    echo "WARNING: Failed to create DynamoDB tables. Ensure your AWS credentials in BackEnd/.env are correct."
fi

# Deactivate the virtual environment
deactivate
cd ..

echo "[6/6] Final instructions..."
echo "--- Setup Complete! ---"
echo ""
echo "ACTION REQUIRED: Please edit the dummy 'BackEnd/.env' and 'FrontEnd/.env' files with your real AWS credentials."
echo ""
echo "To run the application:"
echo "1. Open a new terminal and run the backend server:"
echo "   cd BackEnd"
echo "   source .venv/bin/activate"
echo "   python manage.py runserver"
echo ""
echo "2. Open another new terminal and run the frontend server:"
echo "   cd FrontEnd"
echo "   npm run dev"
echo ""
echo "The application will be available at http://localhost:5173"