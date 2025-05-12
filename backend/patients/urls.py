"""
URL configuration for the patients app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.PatientViewSet, basename='patient')

urlpatterns = [
    path('', include(router.urls)),
    # Removing duplicate endpoint, since it's available through the ViewSet action
    # path('api/patients/create/', views.create_patient, name='create_patient'),
] 