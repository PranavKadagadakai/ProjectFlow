#!/usr/bin/env bash
# Unix setup for Project Submission Portal
set -e
echo "--- Project Setup (Unix) ---"

# 1️⃣ ENV FILES ------------------------------------------------------------
if [ ! -f "BackEnd/.env" ]; then
cat <<'EOF' > BackEnd/.env
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
EOF
fi

if [ ! -f "FrontEnd/.env" ]; then
cat <<'EOF' > FrontEnd/.env
VITE_BACKEND_API_URL=http://127.0.0.1:8000
VITE_USE_LOCAL_FILE_STORAGE=true
#VITE_AWS_COGNITO_USER_POOL_ID=
#VITE_AWS_COGNITO_CLIENT_ID=
EOF
fi

# 2️⃣ BACKEND --------------------------------------------------------------
cd BackEnd
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# 3️⃣ FRONTEND -------------------------------------------------------------
cd ../FrontEnd
npm install

# 4️⃣ NLTK -----------------------------------------------------------------
cd ../BackEnd
python -m nltk.downloader punkt stopwords

# 5️⃣ DynamoDB -------------------------------------------------------------
python Proj/create_tables.py
deactivate
cd ..

echo -e "\nSetup complete! Follow README to start servers."
