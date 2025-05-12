"""
Serializers for the templates app.
"""
from rest_framework import serializers
from .models import Template

class TemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the Template model.
    """
    class Meta:
        model = Template
        fields = ['id', 'name', 'description', 'content', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'DocumentTemplate' 