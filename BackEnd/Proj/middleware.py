import requests
from django.http import JsonResponse
from django.conf import settings
from jose import jwt, jwk
from jose.utils import base64url_decode

class CognitoAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/public/') or request.path == '/':
            # Skip authentication for public API endpoints
            return self.get_response(request)
        
        auth_header = request.META.get(settings.AWS_COGNITO_JWT_HEADER_NAME)
        if not auth_header and not auth_header.startswith(settings.AWS_COGNITO_JWT_TOKEN_TYPE + ' '):
            return JsonResponse({'error': 'Authentication token is missing'}, status=401)
            
        token = auth_header.split(' ')[1]  # Remove the 'Bearer ' prefix   

        try:
            # Decode the JWT token
            jwks_url = f'http://cognito-idp.{settings.AWS_COGNITO_REGION}.amazonaws.com/{settings.AWS_COGNITO_USER_POOL_ID}/.well-known/jwks.json'
            jwks = requests.get(jwks_url).json()
            header = jwt.get_unverified_header(token)
            key = next(k for k in jwks['keys'] if k['kid'] == header['kid'])
            public_key = jwk.construct(key)

            claims = jwt.decode(
                token,
                public_key,
                algorithms=['RS256'],
                audience=settings.AWS_COGNITO_APP_CLIENT_ID,
                issuer=f'http://cognito-idp.{settings.AWS_COGNITO_REGION}.amazonaws.com/{settings.AWS_COGNITO_USER_POOL_ID}'
            )
            request.cognito_user = claims
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except jwt.JWTClaimsError:
            return JsonResponse({'error': 'Invalid claims'}, status=401)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=401)

        response = self.get_response(request)
        return response