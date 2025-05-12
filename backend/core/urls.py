from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('register/', views.register_view, name='register'),
    path('prescriptions/', views.prescriptions_view, name='prescriptions'),
    path('orders/', views.orders_view, name='orders'),
    path('invoices/', views.invoices_view, name='invoices'),
    path('basket/', views.basket_view, name='basket'),
    path('profile/', views.profile_view, name='profile'),
    
    # Profile and Clinic update endpoints
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/update-clinic/', views.update_clinic, name='update_clinic'),
    path('profile/change-password/', views.change_password, name='change_password'),

  
    # API endpoints
    path('api/invoice/detail/', views.api_invoice_detail, name='api_invoice_detail'),
    path('api/order/create/', views.create_order, name='create_order'),
    path('invoice/<uuid:invoice_id>/pdf/', views.invoice_pdf, name='invoice_pdf'),
    path('invoice/<uuid:invoice_id>/print/', views.invoice_print, name='invoice_print'),
    
    # Debug endpoint
    path('debug/session/', views.debug_session, name='debug_session'),
] 