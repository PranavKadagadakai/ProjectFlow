<#
PowerShell setup for Project Submission Portal
#>

Write-Host "--- Project Setup (PowerShell) ---" -ForegroundColor Green

# 1️⃣ ENV FILES ------------------------------------------------------------
if (-not (Test-Path "BackEnd\.env")) {
@"
USE_LOCAL_FILE_STORAGE=true
ML_SCORE_WEIGHT=0.3

#AWS_ACCESS_KEY_ID=
#AWS_SECRET_ACCESS_KEY=

#AWS_COGNITO_REGION=us-east-1
#AWS_COGNITO_USER_POOL_ID=
#AWS_COGNITO_APP_CLIENT_ID=

#AWS_S3_REGION_NAME=us-east-1
#AWS_STORAGE_BUCKET_NAME=

#AWS_SES_SOURCE_EMAIL=
#ERROR_NOTIFICATION_TOPIC=

AWS_DYNAMODB_REGION=us-east-1
DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations
DYNAMODB_USER_PROFILES_TABLE=ProjectFlow_UserProfiles
"@ | Out-File -Encoding utf8 "BackEnd\.env"
}

if (-not (Test-Path "FrontEnd\.env")) {
@"
VITE_BACKEND_API_URL=http://127.0.0.1:8000
VITE_USE_LOCAL_FILE_STORAGE=true
#VITE_AWS_COGNITO_USER_POOL_ID=
#VITE_AWS_COGNITO_CLIENT_ID=
"@ | Out-File -Encoding utf8 "FrontEnd\.env"
}

# 2️⃣ BACKEND --------------------------------------------------------------
Set-Location BackEnd
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# 3️⃣ FRONTEND -------------------------------------------------------------
Set-Location ..\FrontEnd
npm install

# 4️⃣ NLTK ----------------------------------------------------------------
Set-Location ..\BackEnd
python -m nltk.downloader punkt stopwords

# 5️⃣ DynamoDB -------------------------------------------------------------
python Proj\create_tables.py

deactivate
Set-Location ..

Write-Host "`nSetup complete! See README for next steps." -ForegroundColor Green
