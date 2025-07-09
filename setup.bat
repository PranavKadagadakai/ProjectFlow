@echo off
REM Windows CMD setup for Project Submission Portal
echo --- Project Setup (Windows CMD) ---

REM 1️⃣ ENV FILES -----------------------------------------------------------
if not exist "BackEnd\.env" (
  echo Creating BackEnd\.env ...
  (
    echo ### Core ###
    echo USE_LOCAL_FILE_STORAGE=true
    echo ML_SCORE_WEIGHT=0.3
    echo.
    echo ### (Optional) AWS Credentials ###
    echo #AWS_ACCESS_KEY_ID=
    echo #AWS_SECRET_ACCESS_KEY=
    echo.
    echo ### (Optional) Cognito ###
    echo #AWS_COGNITO_REGION=us-east-1
    echo #AWS_COGNITO_USER_POOL_ID=
    echo #AWS_COGNITO_APP_CLIENT_ID=
    echo.
    echo ### (Optional) S3 ###
    echo #AWS_S3_REGION_NAME=us-east-1
    echo #AWS_STORAGE_BUCKET_NAME=
    echo.
    echo ### SES / SNS (optional) ###
    echo #AWS_SES_SOURCE_EMAIL=
    echo #ERROR_NOTIFICATION_TOPIC=
    echo.
    echo ### DynamoDB ###
    echo AWS_DYNAMODB_REGION=us-east-1
    echo DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
    echo DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
    echo DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
    echo DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations
    echo DYNAMODB_USER_PROFILES_TABLE=ProjectFlow_UserProfiles
  ) > "BackEnd\.env"
)

if not exist "FrontEnd\.env" (
  echo Creating FrontEnd\.env ...
  (
    echo VITE_BACKEND_API_URL=http://127.0.0.1:8000
    echo VITE_USE_LOCAL_FILE_STORAGE=true
    echo #VITE_AWS_COGNITO_USER_POOL_ID=
    echo #VITE_AWS_COGNITO_CLIENT_ID=
  ) > "FrontEnd\.env"
)

REM 2️⃣ BACKEND -------------------------------------------------------------
echo [Backend] Creating venv...
cd BackEnd
python -m venv .venv || goto :error
call .venv\Scripts\activate.bat
pip install -r requirements.txt || goto :error

REM 3️⃣ FRONTEND -----------------------------------------------------------
echo [Frontend] Installing NPM deps...
cd ..\FrontEnd
npm install || goto :error

REM 4️⃣ NLTK data ----------------------------------------------------------
cd ..\BackEnd
python -m nltk.downloader punkt stopwords

REM 5️⃣ DynamoDB tables ----------------------------------------------------
python Proj\create_tables.py

call .venv\Scripts\deactivate.bat
cd ..
echo --- Setup Complete! ---
echo Edit BackEnd\.env / FrontEnd\.env as needed, then follow README to run servers.
goto :eof

:error
echo Setup failed – check the error log above.
exit /b 1
