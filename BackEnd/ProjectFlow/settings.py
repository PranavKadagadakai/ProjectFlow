from pathlib import Path
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-x$$wxzj&v29$(41cd)io@6#q^xjr1t8a8bsjv940=@h!uq@90o'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['127.0.0.1', 'localhost']

# Load environment variables from .env file
dotenv_path = BASE_DIR / '.env'
if dotenv_path.exists():
    load_dotenv(dotenv_path)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    # 'storages', # IMPORTANT: Commented out as we are not using S3
    'Proj',
    'ml_evaluator',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ProjectFlow.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ProjectFlow.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

## MANUAL SETTINGS
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('Proj.authentication.CognitoAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
}

CORS_ALLOWED_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ['accept', 'authorization', 'content-type', 'user-agent', 'x-csrftoken', 'x-requested-with']

# AWS Cognito - Still needed for authentication
COGNITO_REGION = os.getenv('AWS_COGNITO_REGION', 'us-east-1')
COGNITO_USER_POOL_ID = os.getenv('AWS_COGNITO_USER_POOL_ID')
COGNITO_APP_CLIENT_ID = os.getenv('AWS_COGNITO_APP_CLIENT_ID')

# AWS Credentials (still needed for DynamoDB, SES, Cognito)
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# --- LOCAL FILE STORAGE CONFIGURATION ---
# The default file storage is now Django's FileSystemStorage.
# MEDIA_URL is the public URL for the media directory.
# MEDIA_ROOT is the absolute filesystem path to the directory for user-uploaded files.
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# AWS SES Settings - Still needed for email notifications
AWS_SES_REGION_NAME = os.getenv('AWS_SES_REGION_NAME', COGNITO_REGION)
AWS_SES_SOURCE_EMAIL = os.getenv('AWS_SES_SOURCE_EMAIL')

# DynamoDB Settings (for PynamoDB)
DYNAMODB_REGION = os.getenv('AWS_DYNAMODB_REGION', COGNITO_REGION)
DYNAMODB_PROJECTS_TABLE = os.getenv('DYNAMODB_PROJECTS_TABLE', 'ProjectFlow_Projects')
DYNAMODB_SUBMISSIONS_TABLE = os.getenv('DYNAMODB_SUBMISSIONS_TABLE', 'ProjectFlow_Submissions')
DYNAMODB_RUBRICS_TABLE = os.getenv('DYNAMODB_RUBRICS_TABLE', 'ProjectFlow_Rubrics')
DYNAMODB_EVALUATIONS_TABLE = os.getenv('DYNAMODB_EVALUATIONS_TABLE', 'ProjectFlow_Evaluations')
DYNAMODB_USER_PROFILES_TABLE = os.getenv('DYNAMODB_USER_PROFILES_TABLE', 'ProjectFlow_UserProfiles')

# ML Model Settings
ML_SCORE_WEIGHT = float(os.getenv('ML_SCORE_WEIGHT', '0.3'))
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')