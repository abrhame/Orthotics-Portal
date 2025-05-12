"""
Models for the invoices app.
"""
import uuid
from django.db import models
from django.conf import settings
from orders.models import Order
from decimal import Decimal

class Invoice(models.Model):
    """
    Model for invoice information.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    due_date = models.DateField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.status}"
    
    @property
    def subtotal(self):
        """Calculate the subtotal of all invoice items."""
        return sum((item.price * item.quantity) for item in self.items.all()) or Decimal('0.00')
    
    @property
    def shipping(self):
        """Get shipping cost for the invoice."""
        # Default shipping cost if none is explicitly set
        return Decimal('10.00')
    
    @property
    def tax(self):
        """Calculate tax (9% of the subtotal)."""
        return (self.subtotal * Decimal('0.09')).quantize(Decimal('0.01'))
    
    @property
    def total(self):
        """Calculate the total invoice amount (subtotal + shipping + tax)."""
        return (self.subtotal + self.shipping + self.tax).quantize(Decimal('0.01'))


class InvoiceItem(models.Model):
    """
    Model for individual items on an invoice.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    description = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.description} (${self.price})"
