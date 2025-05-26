"""
URL configuration for the prescriptions app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for viewsets
router = DefaultRouter()
router.register(r'templates', views.TemplateViewSet, basename='prescription-template')
router.register(r'status', views.PrescriptionStatusViewSet, basename='prescription-status')
router.register(r'foot-types', views.FootTypeViewSet, basename='foot-type')
router.register(r'wear-times', views.WearTimeViewSet, basename='wear-time')
router.register(r'activities', views.ActivityViewSet, basename='activity')
router.register(r'', views.PrescriptionViewSet, basename='prescription')

urlpatterns = [
    # Include the router URLs which will provide all the necessary endpoints
    path('', include(router.urls)),
    
    # Keep the standalone endpoint for simplicity in frontend integration
    path('create/', views.create_prescription_view, name='create_prescription'),
    
    # Add clinical measures endpoint
    path('<uuid:pk>/clinical-measures/', views.PrescriptionViewSet.as_view({'post': 'clinical_measures'}), name='prescription-clinical-measures'),
] 