"""
Views for the templates app.
"""
from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Template
from .serializers import TemplateSerializer

# Create your views here.

class TemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for templates.
    """
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
