"""
Models for the orders app.
"""
import uuid
from django.db import models
from django.contrib.auth import get_user_model
from prescriptions.models import Prescription

User = get_user_model()

class Order(models.Model):
    """
    Model representing an order for one or more prescriptions.
    """
    # Status choices
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    prescriptions = models.ManyToManyField(Prescription, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Order {self.id} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']
        
    @property
    def total_amount(self):
        """
        Calculate the total amount for this order.
        In a real implementation, this would include individual prescription prices.
        """
        return self.prescriptions.count() * 100.00  # Base price of $100 per prescription
