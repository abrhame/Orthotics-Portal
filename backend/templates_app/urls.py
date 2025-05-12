"""
URL patterns for the templates app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TemplateViewSet

# Create a router for viewsets
router = DefaultRouter()
router.register(r'', TemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
] 