from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, authenticate
from django.views.decorators.http import require_http_methods
from patients.models import Patient
from orders.models import Order
from invoices.models import Invoice
from prescriptions.models import Prescription, Template
from users.models import Clinic
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@login_required
def home_view(request):
    """Home page view."""
    return render(request, 'orthotics_portal/index.html', {'use_absolute_urls': True})


def register_view(request):
    """Registration page view."""
    if request.method == 'POST':
        # Process the form data
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        email = request.POST.get('email')
        phone = request.POST.get('phone')
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')
        
        # Clinic information
        clinic_name = request.POST.get('clinic_name')
        clinic_phone = request.POST.get('clinic_phone')
        clinic_email = request.POST.get('clinic_email')
        clinic_address = request.POST.get('clinic_address')
        
        # Validate passwords match
        if password1 != password2:
            messages.error(request, 'Passwords do not match')
            return render(request, 'orthotics_portal/register.html', {'use_absolute_urls': True})
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            messages.error(request, 'User with this email already exists')
            return render(request, 'orthotics_portal/register.html', {'use_absolute_urls': True})
        
        try:
            # Create the clinic
            clinic = Clinic.objects.create(
                name=clinic_name,
                phone=clinic_phone,
                email=clinic_email,
                address=clinic_address
            )
            
            # Create the user
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password1,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role='clinician',  # Default role for registrations
                clinic=clinic
            )
            
            # Log the user in
            login(request, user)
            
            messages.success(request, 'Registration successful! Welcome to the Orthotics Portal.')
            return redirect('home')
        except Exception as e:
            messages.error(request, f'Error during registration: {str(e)}')
            return render(request, 'orthotics_portal/register.html', {'use_absolute_urls': True})
    
    return render(request, 'orthotics_portal/register.html', {'use_absolute_urls': True})


@login_required
def prescriptions_view(request):
    """Prescriptions page view."""
    logger.info(f"Prescriptions view accessed by user: {request.user} (authenticated: {request.user.is_authenticated})")
    
    patients = None
    prescriptions = None
    templates = None
    
    # If the user is associated with a clinic, get all patients from that clinic
    if hasattr(request.user, 'clinic') and request.user.clinic:
        logger.info(f"User has clinic: {request.user.clinic.name}")
        patients = Patient.objects.filter(clinic=request.user.clinic)
        prescriptions = Prescription.objects.filter(patient__clinic=request.user.clinic)
        templates = Template.objects.filter(is_active=True)
        logger.info(f"Found {patients.count()} patients and {prescriptions.count()} prescriptions")
    else:
        logger.warning(f"User {request.user.email} does not have an associated clinic")
    
    context = {
        'patients': patients,
        'prescriptions': prescriptions,
        'templates': templates,
        'use_absolute_urls': True,  # Set to True to use absolute URLs for static files in development
    }
    return render(request, 'orthotics_portal/prescriptions.html', context)


@login_required
def orders_view(request):
    """Orders page view."""
    orders = None
    
    # If the user is associated with a clinic, get all orders from that clinic
    if hasattr(request.user, 'clinic') and request.user.clinic:
        orders = Order.objects.filter(prescriptions__patient__clinic=request.user.clinic).distinct()
    
    context = {
        'orders': orders,
        'use_absolute_urls': True,
    }
    return render(request, 'orthotics_portal/orders.html', context)


@login_required
def invoices_view(request):
    """Invoices page view."""
    invoices = None
    
    # If the user is associated with a clinic, get all invoices from that clinic
    if hasattr(request.user, 'clinic') and request.user.clinic:
        invoices = Invoice.objects.filter(order__prescriptions__patient__clinic=request.user.clinic).distinct()
    
    context = {
        'invoices': invoices,
        'use_absolute_urls': True,
    }
    return render(request, 'orthotics_portal/invoices.html', context)


@login_required
def basket_view(request):
    """Basket page view."""
    return render(request, 'orthotics_portal/basket.html', {'use_absolute_urls': True})


@login_required
def profile_view(request):
    """User profile view."""
    logger.info(f"Profile view accessed by user: {request.user} (authenticated: {request.user.is_authenticated})")
    
    if hasattr(request.user, 'clinic') and request.user.clinic:
        logger.info(f"User has clinic: {request.user.clinic.name}")
    else:
        logger.warning(f"User {request.user.email} does not have an associated clinic")
        
    return render(request, 'orthotics_portal/profile.html', {'use_absolute_urls': True})


@login_required
@require_http_methods(["POST"])
def update_profile(request):
    """Update user profile information."""
    try:
        # Update user information
        user = request.user
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)
        user.phone = request.POST.get('phone', user.phone)
        user.save()
        
        return JsonResponse({'success': True, 'message': 'Profile updated successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def update_clinic(request):
    """Update clinic information."""
    try:
        if not hasattr(request.user, 'clinic') or not request.user.clinic:
            return JsonResponse({'success': False, 'message': 'No clinic associated with this user'})
        
        # Update clinic information
        clinic = request.user.clinic
        clinic.name = request.POST.get('clinic_name', clinic.name)
        clinic.phone = request.POST.get('clinic_phone', clinic.phone)
        clinic.email = request.POST.get('clinic_email', clinic.email)
        clinic.address = request.POST.get('clinic_address', clinic.address)
        clinic.save()
        
        return JsonResponse({'success': True, 'message': 'Clinic information updated successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


@login_required
@require_http_methods(["POST"])
def change_password(request):
    """Change user password."""
    try:
        user = request.user
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        
        # Check if current password is correct
        if not user.check_password(current_password):
            return JsonResponse({'success': False, 'message': 'Current password is incorrect'})
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Update session auth hash to prevent logout
        from django.contrib.auth import update_session_auth_hash
        update_session_auth_hash(request, user)
        
        return JsonResponse({'success': True, 'message': 'Password changed successfully'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})


# API Views for AJAX requests
@login_required
def api_invoice_detail(request):
    """API endpoint to get invoice details."""
    invoice_id = request.GET.get('id')
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        # Check if the invoice belongs to the user's clinic
        if not request.user.is_staff and not invoice.order.prescriptions.filter(patient__clinic=request.user.clinic).exists():
            return JsonResponse({'success': False, 'error': 'Not authorized'})
        
        # Convert the invoice to a JSON-serializable format
        invoice_data = {
            'id': str(invoice.id),
            'order_id': str(invoice.order.id),
            'date': invoice.created_at.isoformat(),
            'formatted_date': invoice.created_at.strftime('%B %d, %Y'),
            'status': invoice.status,
            'subtotal': float(invoice.subtotal),
            'shipping': float(invoice.shipping),
            'tax': float(invoice.tax),
            'total': float(invoice.total),
            'items': [
                {
                    'description': item.description,
                    'price': float(item.price)
                } for item in invoice.items.all()
            ]
        }
        
        return JsonResponse({'success': True, 'invoice': invoice_data})
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invoice not found'})


@login_required
def create_order(request):
    """API endpoint to create an order."""
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Only POST method is allowed'})
    
    # Process the order data
    # Implementation will depend on your data model
    
    return JsonResponse({'success': True, 'message': 'Order created successfully'})


@login_required
def invoice_pdf(request, invoice_id):
    """Generate a PDF for an invoice."""
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        # Check if the invoice belongs to the user's clinic
        if not request.user.is_staff and not invoice.order.prescriptions.filter(patient__clinic=request.user.clinic).exists():
            return JsonResponse({'success': False, 'error': 'Not authorized'})
        
        # Check if WeasyPrint is available
        try:
            from weasyprint import HTML, CSS
            from django.http import HttpResponse
            from django.template.loader import render_to_string
            from django.conf import settings
            import tempfile
            import os
        except ImportError:
            logger.error("WeasyPrint is not installed. Cannot generate PDF.")
            return JsonResponse({'success': False, 'error': 'PDF generation is not available'})
        
        # Render the invoice template to a string
        html_string = render_to_string('orthotics_portal/invoice_print.html', {'invoice': invoice})
        
        # Generate PDF
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as output:
                temp_filename = output.name
            
            # Generate PDF and save to the temporary file
            HTML(string=html_string).write_pdf(
                temp_filename,
                stylesheets=[
                    CSS(string='@page { size: A4; margin: 1cm; }')
                ]
            )
            
            # Read the PDF file
            with open(temp_filename, 'rb') as f:
                pdf = f.read()
            
            # Clean up the temporary file
            os.unlink(temp_filename)
            
            # Create response
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.invoice_number}.pdf"'
            return response
        
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return JsonResponse({'success': False, 'error': f'Error generating PDF: {str(e)}'})
        
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invoice not found'})


@login_required
def invoice_print(request, invoice_id):
    """Print-friendly view for an invoice."""
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        # Check if the invoice belongs to the user's clinic
        if not request.user.is_staff and not invoice.order.prescriptions.filter(patient__clinic=request.user.clinic).exists():
            return JsonResponse({'success': False, 'error': 'Not authorized'})
        
        context = {
            'invoice': invoice,
            'use_absolute_urls': True,
        }
        return render(request, 'orthotics_portal/invoice_print.html', context)
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invoice not found'})


def debug_session(request):
    """Debug view to check session and authentication status."""
    logger.info(f"Debug session view accessed. User: {request.user}")
    logger.info(f"Is authenticated: {request.user.is_authenticated}")
    logger.info(f"Session ID: {request.session.session_key}")
    logger.info(f"Session data: {dict(request.session)}")
    
    if request.user.is_authenticated:
        return JsonResponse({
            'authenticated': True,
            'user_id': str(request.user.id),
            'username': request.user.username,
            'email': request.user.email,
            'session_id': request.session.session_key,
            'session_expiry': request.session.get_expiry_date().isoformat() if request.session.get_expiry_date() else None,
        })
    else:
        return JsonResponse({
            'authenticated': False,
            'session_id': request.session.session_key,
        })
