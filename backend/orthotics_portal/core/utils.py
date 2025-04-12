"""
Utility functions for the Orthotics Portal application.
"""
import os
import uuid
from django.utils import timezone


def get_file_upload_path(instance, filename):
    """
    Generate a unique file path for uploaded files.
    """
    # Get the file extension
    ext = filename.split('.')[-1]
    
    # Generate a UUID-based filename
    filename = f"{uuid.uuid4()}.{ext}"
    
    # Determine the upload folder based on the instance type
    if hasattr(instance, 'prescription'):
        # For prescription attachments
        prescription_id = str(instance.prescription.id)
        return os.path.join('prescriptions', prescription_id, filename)
    elif hasattr(instance, 'order'):
        # For order-related files
        order_id = str(instance.order.id)
        return os.path.join('orders', order_id, filename)
    elif hasattr(instance, 'clinic'):
        # For clinic logos
        clinic_id = str(instance.clinic.id)
        return os.path.join('clinics', clinic_id, filename)
    
    # Default path
    return os.path.join('uploads', filename)


def generate_order_number():
    """
    Generate a unique order number.
    Format: ORD-{timestamp}
    """
    timestamp = int(timezone.now().timestamp() * 1000)
    return f"ORD-{timestamp}"


def generate_invoice_number():
    """
    Generate a unique invoice number.
    Format: INV-{timestamp}
    """
    timestamp = int(timezone.now().timestamp() * 1000)
    return f"INV-{timestamp}" 