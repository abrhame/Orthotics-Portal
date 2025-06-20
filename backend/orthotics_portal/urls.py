"""
URL Configuration for the Orthotics Portal project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.contrib.auth import views as auth_views
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from core import views
from rest_framework.routers import DefaultRouter
import django_browser_reload
from prescriptions.views import add_patient_view

# Create schema view for Swagger
schema_view = get_schema_view(
    openapi.Info(
        title="Orthotics Portal API",
        default_version='v1',
        description="API for orthotic prescriptions management",
        terms_of_service="https://www.example.com/terms/",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

# API URL patterns
api_patterns = [
    path('users/', include('users.urls')),
    path('patients/', include('patients.urls')),
    path('prescriptions/', include('prescriptions.urls')),
    path('templates/', include('templates_app.urls')),
    path('orders/', include('orders.urls')),
    path('invoices/', include('invoices.urls')),
]

router = DefaultRouter()

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    path("__reload__/", include("django_browser_reload.urls")),
    
    # Core app URLs
    path('', include('core.urls')),  # Include all core URLs
    
    # Authentication
    path('login/', auth_views.LoginView.as_view(template_name='orthotics_portal/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='login'), name='logout'),
    
    # API URLs
    path('api/', include(api_patterns)),
    
    # Swagger UI
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
    # Legacy paths (keeping for backward compatibility)
    path('api/docs/', RedirectView.as_view(url='/swagger/', permanent=True)),
    
    # New URLs
    path('register/', views.register_view, name='register'),
    path('prescriptions/', include([
        path('', views.prescriptions_view, name='prescriptions'),
        path('add-patient/', add_patient_view, name='add_patient'),
        path('<uuid:prescription_id>/', views.prescription_detail_view, name='prescription_detail'),
    ])),
    path('orders/', views.orders_view, name='orders'),
    path('orders/<uuid:order_id>/', views.order_detail_view, name='order_detail'),
    path('invoices/', views.invoices_view, name='invoices'),
    path('invoices/<uuid:invoice_id>/', views.invoice_detail_view, name='invoice_detail'),
    path('basket/', views.basket_view, name='basket'),
    path('profile/', views.profile_view, name='profile'),
]

# Serve media files in development and production
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve static files in development only
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
