"""
Serializers for the users app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import Clinic

User = get_user_model()

class ClinicSerializer(serializers.ModelSerializer):
    """
    Serializer for the Clinic model.
    """
    class Meta:
        model = Clinic
        fields = ['id', 'name', 'address', 'phone', 'email']
        read_only_fields = ['id']

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the User model (used for profile view).
    """
    clinic = ClinicSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'clinic']
        read_only_fields = ['id']

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Accepts name (which will be split into first_name and last_name),
    email, password, and clinic information.
    """
    name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    phone = serializers.CharField(write_only=True, required=True)
    
    # Clinic information fields
    clinic_name = serializers.CharField(write_only=True, required=True)
    clinic_address = serializers.CharField(write_only=True, required=True)
    clinic_phone = serializers.CharField(write_only=True, required=True)
    clinic_email = serializers.EmailField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'name', 'email', 'password', 'password_confirm', 'phone',
            'clinic_name', 'clinic_address', 'clinic_phone', 'clinic_email'
        ]
    
    def validate(self, attrs):
        """
        Validate that passwords match.
        """
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """
        Create a new user with the validated data.
        Split the name into first_name and last_name.
        Create a new clinic with the provided information.
        """
        # Remove password_confirm field
        validated_data.pop('password_confirm')
        
        # Split name into first_name and last_name
        name_parts = validated_data.pop('name').split()
        if len(name_parts) > 1:
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:])
        else:
            first_name = name_parts[0]
            last_name = ""
        
        # Extract clinic data
        clinic_name = validated_data.pop('clinic_name')
        clinic_address = validated_data.pop('clinic_address')
        clinic_phone = validated_data.pop('clinic_phone')
        clinic_email = validated_data.pop('clinic_email')
        
        # Create or get clinic
        clinic, created = Clinic.objects.get_or_create(
            name=clinic_name,
            defaults={
                'address': clinic_address,
                'phone': clinic_phone,
                'email': clinic_email
            }
        )
        
        # If clinic exists but with different details, update it
        if not created:
            clinic.address = clinic_address
            clinic.phone = clinic_phone
            clinic.email = clinic_email
            clinic.save()
        
        # Create user
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=first_name,
            last_name=last_name,
            clinic=clinic
        )
        
        return user

class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    Accepts email and password.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(required=True, write_only=True) 