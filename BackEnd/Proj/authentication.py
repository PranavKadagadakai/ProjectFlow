# BackEnd/Proj/authentication.py

import jwt
import requests
import time
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions

# A simple in-memory cache for the JSON Web Key Set (JWKS)
# In a distributed system, consider using a shared cache like Redis.
jwks_cache = {
    'keys': [],
    'last_fetched': 0,
    'cache_ttl': 3600  # Cache for 1 hour
}

def get_jwks():
    """
    Fetches the JSON Web Key Set (JWKS) from the Cognito User Pool.
    Caches the keys to avoid fetching them on every request.
    """
    global jwks_cache
    now = time.time()

    # Check if cache is still valid
    if jwks_cache['keys'] and (now - jwks_cache['last_fetched']) < jwks_cache['cache_ttl']:
        return jwks_cache['keys']

    # Construct the JWKS URL from settings
    if not hasattr(settings, 'COGNITO_USER_POOL_ID') or not hasattr(settings, 'COGNITO_REGION'):
        raise exceptions.AuthenticationFailed(
            'COGNITO_USER_POOL_ID and COGNITO_REGION must be set in Django settings.'
        )

    url = f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}/.well-known/jwks.json"

    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        jwks = response.json()['keys']
        
        # Update cache
        jwks_cache['keys'] = jwks
        jwks_cache['last_fetched'] = now
        
        return jwks
    except requests.exceptions.RequestException as e:
        # Could not fetch JWKS. Log this error and fail authentication.
        print(f"Error fetching JWKS: {e}")
        raise exceptions.AuthenticationFailed('Could not fetch public keys for token validation.')
    except (KeyError, TypeError):
        # The JWKS format is unexpected.
        print("Error: JWKS format is invalid.")
        raise exceptions.AuthenticationFailed('Invalid public key format.')


def get_public_key(token):
    """
    Finds the correct public key in the JWKS to verify the token's signature.
    """
    try:
        headers = jwt.get_unverified_header(token)
    except jwt.DecodeError as e:
        raise exceptions.AuthenticationFailed(f"Invalid token header: {e}")

    kid = headers.get('kid')
    if not kid:
        raise exceptions.AuthenticationFailed('Token is missing "kid" in the header.')

    jwks = get_jwks()
    for key in jwks:
        if key.get('kid') == kid:
            # Construct and return the public key
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    
    raise exceptions.AuthenticationFailed('Public key for token "kid" not found.')


class CognitoAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class for Django Rest Framework to authenticate
    users with a JWT token from AWS Cognito.
    """
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None  # No token provided, authentication will be handled by other classes

        token = auth_header.split(' ')[1]
        
        try:
            public_key = get_public_key(token)

            # --- DECODE AND VALIDATE THE TOKEN ---
            # This is the crucial step where the token's signature, expiration,
            # issuer, and audience are all verified.
            decoded_token = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=settings.COGNITO_APP_CLIENT_ID, # Your app client ID
                issuer=f"https://cognito-idp.{settings.COGNITO_REGION}.amazonaws.com/{settings.COGNITO_USER_POOL_ID}"
            )

            # --- TOKEN CLAIMS VALIDATION ---
            # Ensure the token is an ID token
            if decoded_token.get('token_use') != 'id':
                raise exceptions.AuthenticationFailed('Token is not an ID token.')
            
            # --- GET OR CREATE USER ---
            # Identify the user by their unique Cognito username or sub
            cognito_username = decoded_token.get('cognito:username')
            if not cognito_username:
                raise exceptions.AuthenticationFailed('Token does not contain a username.')
            
            User = get_user_model()

            # Get the custom:role attribute from the Cognito token
            # Default to 'student' if the attribute is missing (e.g., for existing users)
            cognito_role = decoded_token.get('custom:role', 'student')

            # Map Cognito role to Django's is_staff and is_superuser
            is_staff_bool = (cognito_role == 'faculty' or cognito_role == 'administrator')
            is_superuser_bool = (cognito_role == 'administrator')

            user, created = User.objects.get_or_create(
                username=cognito_username,
                defaults={
                    'email': decoded_token.get('email'),
                    'is_staff': is_staff_bool,
                    'is_superuser': is_superuser_bool,
                }
            )
            
            # If the user already exists, ensure their staff/superuser status is up-to-date
            if not created and (user.is_staff != is_staff_bool or user.is_superuser != is_superuser_bool):
                user.is_staff = is_staff_bool
                user.is_superuser = is_superuser_bool
                user.save(update_fields=['is_staff', 'is_superuser'])


            return (user, decoded_token)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired.')
        except jwt.InvalidAudienceError:
            raise exceptions.AuthenticationFailed('Invalid token audience.')
        except jwt.InvalidIssuerError:
            raise exceptions.AuthenticationFailed('Invalid token issuer.')
        except jwt.PyJWTError as e:
            # Catch other JWT-related errors
            raise exceptions.AuthenticationFailed(f'Token validation error: {e}')
        except Exception as e:
            # Catch-all for other unexpected errors.
            print(f"An unexpected error occurred during authentication: {e}")
            raise exceptions.AuthenticationFailed('An unexpected error occurred.')
