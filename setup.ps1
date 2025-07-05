# setup.ps1 - Automated setup script for the Project Submission Portal on Windows (PowerShell)

Write-Host "--- Starting Project Setup ---" -ForegroundColor Green

# --- Environment File Setup ---
Write-Host "[1/6] Checking for environment files..." -ForegroundColor Cyan

# Create Backend .env if it doesn't exist
if (-not (Test-Path "BackEnd\.env")) {
    Write-Host "Creating dummy .env file for Backend..." -ForegroundColor Yellow
    $backendEnvContent = @"
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

# DynamoDB Table Names
DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations

# ML Model Configuration
ML_SCORE_WEIGHT=0.3
"@
    $backendEnvContent | Out-File -FilePath "BackEnd\.env" -Encoding utf8
    Write-Host "IMPORTANT: Dummy 'BackEnd\.env' created. Please edit it with your actual AWS credentials." -ForegroundColor Yellow
}

# Create Frontend .env if it doesn't exist
if (-not (Test-Path "FrontEnd\.env")) {
    Write-Host "Creating .env file for Frontend..." -ForegroundColor Yellow
    $frontendEnvContent = @"
VITE_BACKEND_API_URL=http://127.0.0.1:8000
VITE_AWS_PROJECT_REGION=us-east-1
VITE_AWS_COGNITO_REGION=us-east-1
VITE_AWS_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
VITE_AWS_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
VITE_AWS_S3_BUCKET=YOUR_S3_BUCKET_NAME
VITE_AWS_S3_REGION=us-east-1
"@
    $frontendEnvContent | Out-File -FilePath "FrontEnd\.env" -Encoding utf8
}

# --- Backend Setup ---
Write-Host "[2/6] Setting up Python backend..." -ForegroundColor Cyan
Set-Location -Path "BackEnd"

# Check for Python
$pythonExists = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonExists) {
    Write-Host "ERROR: python could not be found. Please install Python 3 and add it to your PATH." -ForegroundColor Red
    exit 1
}

Write-Host "Creating Python virtual environment..."
python -m venv venv
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create Python virtual environment." -ForegroundColor Red
    exit 1
}

Write-Host "Activating virtual environment..."
.\venv\Scripts\Activate.ps1

Write-Host "Installing Python packages from requirements.txt..."
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Python packages." -ForegroundColor Red
    deactivate
    exit 1
}
Write-Host "Backend setup complete." -ForegroundColor Green

# --- Frontend Setup ---
Write-Host "[3/6] Setting up Node.js frontend..." -ForegroundColor Cyan
Set-Location -Path "..\FrontEnd"

# Check for npm
$npmExists = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npmExists) {
    Write-Host "ERROR: npm could not be found. Please install Node.js and add it to your PATH." -ForegroundColor Red
    deactivate
    exit 1
}

Write-Host "Installing Node.js packages from package.json..."
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Node.js packages." -ForegroundColor Red
    deactivate
    exit 1
}
Write-Host "Frontend setup complete." -ForegroundColor Green

# --- NLTK Data Download ---
Write-Host "[4/6] Downloading NLTK models..." -ForegroundColor Cyan
Set-Location -Path "..\BackEnd"
python -m nltk.downloader punkt
python -m nltk.downloader stopwords
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to download NLTK data. The ML model may not work correctly." -ForegroundColor Yellow
}


# --- DynamoDB Table Creation ---
Write-Host "[5/6] Creating DynamoDB tables..." -ForegroundColor Cyan
python .\Proj\create_tables.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Failed to create DynamoDB tables. Ensure your AWS credentials in BackEnd\.env are correct." -ForegroundColor Yellow
}

# Deactivate and return to root
deactivate
Set-Location -Path ".."

Write-Host "[6/6] Final instructions..." -ForegroundColor Cyan
Write-Host "--- Setup Complete! ---" -ForegroundColor Green
Write-Host ""
Write-Host "ACTION REQUIRED: Please edit the dummy 'BackEnd\.env' and 'FrontEnd\.env' files with your real AWS credentials." -ForegroundColor Yellow
Write-Host ""
Write-Host "To run the application:"
Write-Host "1. Open a new PowerShell terminal and run the backend server:"
Write-Host "   Set-Location -Path 'BackEnd'"
Write-Host "   .\venv\Scripts\Activate.ps1"
Write-Host "   python manage.py runserver"
Write-Host ""
Write-Host "2. Open another new PowerShell terminal and run the frontend server:"
Write-Host "   Set-Location -Path 'FrontEnd'"
Write-Host "   npm run dev"
Write-Host ""
Write-Host "The application will be available at http://localhost:5173"