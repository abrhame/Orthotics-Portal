"""
URL patterns for the users app.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from orthotics_portal.users.views import (
    LoginView, LogoutView, UserProfileView
)

urlpatterns = [
    # Authentication
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    
    # User profile
    path('profile/', UserProfileView.as_view(), name='user-profile'),
] 