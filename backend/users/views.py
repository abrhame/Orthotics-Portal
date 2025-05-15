"""
Views for the users app.
"""
from rest_framework import status, generics, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate, login as django_login
from .serializers import UserSerializer, UserRegistrationSerializer, LoginSerializer
from .models import Clinic
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class LoginView(views.APIView):
    """
    Login view for API authentication.
    Takes email and password and returns an access token and refresh token.
    """
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer
    
    @swagger_auto_schema(
        request_body=LoginSerializer,
        operation_description="Authenticate a user with email and password",
        responses={
            200: openapi.Response(
                description="Login successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token'),
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='Access token'),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_STRING),
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'name': openapi.Schema(type=openapi.TYPE_STRING),
                                'role': openapi.Schema(type=openapi.TYPE_STRING),
                            }
                        )
                    }
                )
            ),
            401: "Invalid credentials"
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            email = request.data.get('email')
            password = request.data.get('password')
            
            if not email or not password:
                return Response(
                    {'error': 'Email and password are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Login attempt for user: {email}")
            
            user = authenticate(request, username=email, password=password)
            
            if user is not None:
                django_login(request, user)
                logger.info(f"User authenticated: {user.email}")
                
                # Get clinic info
                clinic = getattr(user, 'clinic', None)
                if not clinic:
                    clinic = Clinic.objects.filter(users=user).first()
                logger.info(f"User clinic: {clinic}")
                
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                
                response_data = {
                    'access': access_token,
                    'refresh': str(refresh),
                    'user': {
                        'id': str(user.id),
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'role': user.role,
                        'clinic': str(clinic.id) if clinic else None
                    }
                }
                
                return Response(response_data)
            else:
                logger.error(f"Authentication failed for user: {email}")
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response(
                {'error': 'An error occurred during login'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RegisterView(generics.CreateAPIView):
    """
    View for registering a new user.
    Takes name, email, password, password_confirm, and clinic information
    (clinic_name, clinic_address, clinic_phone, clinic_email).
    Creates both the user and the associated clinic in one request.
    """
    permission_classes = (AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    @swagger_auto_schema(
        request_body=UserRegistrationSerializer,
        operation_description="Register a new user with clinic information",
        responses={
            201: openapi.Response(
                description="Registration successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token'),
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='Access token'),
                        'user': openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                'id': openapi.Schema(type=openapi.TYPE_STRING),
                                'email': openapi.Schema(type=openapi.TYPE_STRING),
                                'name': openapi.Schema(type=openapi.TYPE_STRING),
                                'role': openapi.Schema(type=openapi.TYPE_STRING),
                                'clinic': openapi.Schema(
                                    type=openapi.TYPE_OBJECT,
                                    properties={
                                        'id': openapi.Schema(type=openapi.TYPE_STRING),
                                        'name': openapi.Schema(type=openapi.TYPE_STRING),
                                    }
                                )
                            }
                        )
                    }
                )
            ),
            400: "Validation error"
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'name': user.get_full_name(),
                'role': user.role,
                'clinic': {
                    'id': str(user.clinic.id),
                    'name': user.clinic.name,
                }
            }
        }, status=status.HTTP_201_CREATED)


class LogoutView(views.APIView):
    """
    Logout view for API authentication.
    Invalidates the refresh token to prevent it from being used again.
    """
    permission_classes = (AllowAny,)  # Changed from IsAuthenticated to AllowAny
    
    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=['refresh_token'],
            properties={
                'refresh_token': openapi.Schema(type=openapi.TYPE_STRING, description='JWT refresh token to blacklist')
            }
        ),
        operation_description="Logout by invalidating the refresh token",
        responses={
            200: openapi.Response(
                description="Logout successful",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING, description='Success message')
                    }
                )
            )
        }
    )
    def post(self, request):
        logger.info(f"Logout attempt for user: {request.user}")
        
        # Handle user session logout if authenticated
        if request.user.is_authenticated:
            # Import django logout
            from django.contrib.auth import logout
            logout(request)
            logger.info(f"User {request.user.id} session logged out")
        
        # Handle token blacklisting if token provided
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                logger.info(f"Refresh token blacklisted")
            
            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.warning(f"Error during logout: {str(e)}")
            # Still return success even if token blacklisting fails
            # This prevents issues with expired or invalid tokens
            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_200_OK
            )


class UserProfileView(generics.RetrieveAPIView):
    """
    View for retrieving the user's profile.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user
