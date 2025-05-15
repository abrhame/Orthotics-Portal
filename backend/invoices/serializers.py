"""
Serializers for the invoices app.
"""
from rest_framework import serializers
from .models import Invoice, InvoiceItem
from orders.serializers import OrderSerializer

class InvoiceItemSerializer(serializers.ModelSerializer):
    """
    Serializer for the InvoiceItem model.
    """
    class Meta:
        model = InvoiceItem
        fields = ['id', 'invoice', 'description', 'quantity', 'price', 'created_at']
        read_only_fields = ['id', 'created_at']

class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for the Invoice model.
    """
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    items_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'order', 'status', 'total_amount', 'items_count', 'created_at']
        read_only_fields = ['id', 'created_at']

class InvoiceDetailSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    order = OrderSerializer(read_only=True)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id', 
            'order', 
            'status', 
            'items',
            'subtotal',
            'shipping',
            'tax',
            'total_amount',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at'] 