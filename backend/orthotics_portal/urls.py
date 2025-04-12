"""
URL configuration for orthotics_portal project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# API schema view for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Orthotics Portal API",
        default_version="v1",
        description="API documentation for Orthotics Portal",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# API URL patterns
api_v1_patterns = [
    path('auth/', include('orthotics_portal.users.urls')),
    path('patients/', include('orthotics_portal.patients.urls')),
    path('prescriptions/', include('orthotics_portal.prescriptions.urls')),
    path('orders/', include('orthotics_portal.orders.urls')),
    path('invoices/', include('orthotics_portal.invoices.urls')),
    path('templates/', include('orthotics_portal.templates.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API routes
    path('api/v1/', include(api_v1_patterns)),
    
    # Swagger documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 