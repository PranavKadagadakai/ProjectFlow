@echo off
REM setup.bat - Automated setup script for the Project Submission Portal on Windows (CMD)

echo --- Starting Project Setup ---

REM --- Environment File Setup ---
echo [1/6] Checking for environment files...

if not exist "BackEnd\.env" (
    echo Creating dummy .env file for Backend...
    (
        echo # AWS Credentials and Configuration
        echo AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
        echo AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
        echo.
        echo # AWS Cognito Configuration
        echo AWS_COGNITO_REGION=us-east-1
        echo AWS_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
        echo AWS_COGNITO_APP_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
        echo.
        echo # AWS S3 Configuration
        echo AWS_S3_REGION_NAME=us-east-1
        echo AWS_STORAGE_BUCKET_NAME=YOUR_S3_BUCKET_NAME
        echo.
        echo # AWS SES Configuration
        echo AWS_SES_SOURCE_EMAIL=your-verified-email@example.com
        echo.
        echo # AWS DynamoDB Configuration
        echo AWS_DYNAMODB_REGION=us-east-1
        echo # For local DynamoDB, uncomment the next line:
        echo # AWS_DYNAMODB_ENDPOINT_URL=http://localhost:8000
        echo.
        echo # DynamoDB Table Names
        echo DYNAMODB_PROJECTS_TABLE=ProjectFlow_Projects
        echo DYNAMODB_SUBMISSIONS_TABLE=ProjectFlow_Submissions
        echo DYNAMODB_RUBRICS_TABLE=ProjectFlow_Rubrics
        echo DYNAMODB_EVALUATIONS_TABLE=ProjectFlow_Evaluations
        echo.
        echo # ML Model Configuration
        echo ML_SCORE_WEIGHT=0.3
    ) > "BackEnd\.env"
    echo IMPORTANT: Dummy "BackEnd\.env" created. Please edit it with your actual AWS credentials.
)

if not exist "FrontEnd\.env" (
    echo Creating .env file for Frontend...
    (
      echo VITE_BACKEND_API_URL=http://127.0.0.1:8000
      echo VITE_AWS_PROJECT_REGION=us-east-1
      echo VITE_AWS_COGNITO_REGION=us-east-1
      echo VITE_AWS_COGNITO_USER_POOL_ID=YOUR_COGNITO_USER_POOL_ID
      echo VITE_AWS_COGNITO_CLIENT_ID=YOUR_COGNITO_APP_CLIENT_ID
      echo VITE_AWS_S3_BUCKET=YOUR_S3_BUCKET_NAME
      echo VITE_AWS_S3_REGION=us-east-1
    ) > "FrontEnd\.env"
)


REM --- Backend Setup ---
echo [2/6] Setting up Python backend...
cd BackEnd

REM Check for Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: python could not be found. Please install Python 3 and add it to your PATH.
    goto :eof
)

echo Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Python virtual environment.
    goto :eof
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing Python packages from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python packages.
    call venv\Scripts\deactivate.bat
    goto :eof
)
echo Backend setup complete.

REM --- Frontend Setup ---
echo [3/6] Setting up Node.js frontend...
cd ..\FrontEnd

REM Check for npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm could not be found. Please install Node.js and add it to your PATH.
    call ..\BackEnd\venv\Scripts\deactivate.bat
    goto :eof
)

echo Installing Node.js packages from package.json...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Node.js packages.
    call ..\BackEnd\venv\Scripts\deactivate.bat
    goto :eof
)
echo Frontend setup complete.

REM --- NLTK Data Download ---
echo [4/6] Downloading NLTK models...
cd ..\BackEnd
python -m nltk.downloader punkt
python -m nltk.downloader stopwords
if %errorlevel% neq 0 (
    echo WARNING: Failed to download NLTK data. The ML model may not work correctly.
)

REM --- DynamoDB Table Creation ---
echo [5/6] Creating DynamoDB tables...
python Proj\create_tables.py
if %errorlevel% neq 0 (
    echo WARNING: Failed to create DynamoDB tables. Ensure your AWS credentials in BackEnd\.env are correct.
)

REM Deactivate and finish
call venv\Scripts\deactivate.bat
cd ..

echo [6/6] Final instructions...
echo --- Setup Complete! ---
echo.
echo ACTION REQUIRED: Please edit the dummy "BackEnd\.env" and "FrontEnd\.env" files with your real AWS credentials.
echo.
echo To run the application:
echo 1. Open a new Command Prompt and run the backend server:
echo    cd BackEnd
echo    call venv\Scripts\activate.bat
echo    python manage.py runserver
echo.
echo 2. Open another new Command Prompt and run the frontend server:
echo    cd FrontEnd
echo    npm run dev
echo.
echo The application will be available at http://localhost:5173

:eof