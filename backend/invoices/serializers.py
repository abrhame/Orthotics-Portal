"""
Serializers for the invoices app.
"""
from rest_framework import serializers
from .models import Invoice, InvoiceItem

class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the InvoiceItem model.
    """
    class Meta:
        model = InvoiceItem
        fields = ['id', 'description', 'price', 'quantity', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Invoice model.
    """
    items = InvoiceItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'user', 'order', 'invoice_number', 'amount', 
            'status', 'due_date', 'notes', 'created_at', 'updated_at',
            'items'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 