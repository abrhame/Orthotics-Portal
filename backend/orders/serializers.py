"""
Serializers for the orders app.
"""
from rest_framework import serializers
from .models import Order
from prescriptions.models import Prescription
from prescriptions.serializers import PrescriptionSerializer
from django.db import transaction
import logging

logger = logging.getLogger(__name__)

class OrderItemSerializer(serializers.Serializer):
    """
    Serializer for order items (prescriptions in an order).
    """
    prescription_id = serializers.UUIDField()
    patient_name = serializers.CharField()
    orthotic_type = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)

class OrderSerializer(serializers.ModelSerializer):
    """
    Serializer for orders.
    """
    prescriptions_count = serializers.SerializerMethodField()
    total_amount = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'notes', 'created_at', 'updated_at', 
                  'prescriptions_count', 'total_amount', 'status_display']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_prescriptions_count(self, obj):
        """
        Get the count of prescriptions in the order.
        """
        return obj.prescriptions.count()
    
    def get_total_amount(self, obj):
        """
        Calculate the total amount of the order.
        Each prescription is charged at a base rate of $100 (example).
        """
        # In a real implementation, you would have a more complex pricing model
        prescription_count = obj.prescriptions.count()
        return prescription_count * 100.00
    
    def get_status_display(self, obj):
        """
        Get the human-readable status.
        """
        return obj.get_status_display()
    
    def create(self, validated_data):
        """
        Create an order with the provided prescription IDs.
        """
        prescription_ids = self.context['request'].data.get('prescription_ids', [])
        
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=validated_data['user'],
                status=validated_data.get('status', 'pending'),
                notes=validated_data.get('notes', '')
            )
            
            # Add prescriptions to the order
            prescriptions = Prescription.objects.filter(id__in=prescription_ids)
            order.prescriptions.add(*prescriptions)
            
            logger.info(f"Created order {order.id} with {prescriptions.count()} prescriptions")
            
            return order


class OrderDetailSerializer(OrderSerializer):
    """
    Detailed serializer for orders, including prescription details.
    """
    items = serializers.SerializerMethodField()
    shipping_method = serializers.CharField(default="Standard Shipping", read_only=True)
    
    class Meta(OrderSerializer.Meta):
        fields = OrderSerializer.Meta.fields + ['items', 'shipping_method']
    
    def get_items(self, obj):
        """
        Get detailed information about each prescription in the order.
        """
        items = []
        for prescription in obj.prescriptions.all():
            item = {
                'prescription_id': prescription.id,
                'patient_name': prescription.patient.full_name if prescription.patient else "Unknown",
                'orthotic_type': prescription.orthotic_type if hasattr(prescription, 'orthotic_type') else "Custom",
                'price': 100.00  # Base price per prescription
            }
            items.append(item)
        
        return OrderItemSerializer(items, many=True).data 