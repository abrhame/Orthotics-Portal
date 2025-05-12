"""
URL patterns for the invoices app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, InvoiceItemViewSet

# Create a router for viewsets
router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')
router.register(r'items', InvoiceItemViewSet, basename='invoice-item')

urlpatterns = [
    path('', include(router.urls)),
    # Add custom URL patterns here that aren't covered by the DRF router
    path('<uuid:invoice_id>/pdf/', InvoiceViewSet.as_view({'get': 'generate_pdf'}), name='invoice_pdf'),
] 