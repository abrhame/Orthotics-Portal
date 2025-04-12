"""
Views for the users app.
"""
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from orthotics_portal.users.serializers import (
    LoginSerializer, UserSerializer
)


class LoginView(TokenObtainPairView):
    """
    Login view for API authentication.
    """
    permission_classes = (AllowAny,)
    serializer_class = LoginSerializer


class LogoutView(APIView):
    """
    Logout view for API authentication.
    Invalidates the refresh token to prevent it from being used again.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Successfully logged out"},
                status=status.HTTP_200_OK
            )
        except Exception:
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