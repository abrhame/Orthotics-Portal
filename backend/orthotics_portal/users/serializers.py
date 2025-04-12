"""
Serializers for the users app.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from orthotics_portal.users.models import User, Clinic


class ClinicSerializer(serializers.ModelSerializer):
    """
    Serializer for the Clinic model.
    """
    class Meta:
        model = Clinic
        fields = ('id', 'name', 'address', 'phone', 'email', 'logo_url')


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model.
    """
    clinic = ClinicSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'role', 'clinic', 'last_login')
        read_only_fields = ('id', 'email', 'role', 'last_login')


class LoginSerializer(TokenObtainPairSerializer):
    """
    Serializer for user login, extends TokenObtainPairSerializer.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        user = self.user
        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'role': user.role
        }
        
        # Add clinic data if available
        if user.clinic:
            data['user']['clinic'] = {
                'id': str(user.clinic.id),
                'name': user.clinic.name
            }
        
        return data 