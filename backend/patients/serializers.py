"""
Serializers for the patients app.
"""
from rest_framework import serializers
from .models import Patient

class PatientSerializer(serializers.ModelSerializer):
    """
    Serializer for Patient model
    """
    class Meta:
        model = Patient
        fields = [
            'id', 'external_id', 'first_name', 'last_name', 
            'date_of_birth', 'gender', 'weight', 'clinic'
        ]
        read_only_fields = ['id', 'clinic']

    def create(self, validated_data):
        """
        Create and return a new `Patient` instance, given the validated data.
        The clinic will be assigned by the view.
        """
        return Patient.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """
        Update and return an existing `Patient` instance, given the validated data.
        """
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.gender = validated_data.get('gender', instance.gender)
        instance.weight = validated_data.get('weight', instance.weight)
        instance.save()
        return instance

    @property
    def full_name(self):
        """
        Return the patient's full name.
        """
        return f"{self.first_name} {self.last_name}" 