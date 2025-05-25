"""
Serializers for the orders app.
"""
from rest_framework import serializers
from .models import Order
from prescriptions.models import Prescription
from prescriptions.serializers import PrescriptionSerializer, PrescriptionListSerializer
from django.db import transaction
import logging
from patients.serializers import PatientSerializer

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
    prescriptions = PrescriptionListSerializer(many=True, read_only=True, required=False)
    patient_name = serializers.SerializerMethodField(required=False)
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True, required=False)
    prescription_ids = serializers.ListField(write_only=True, required=False, allow_empty=True)
    status = serializers.CharField(required=False, default='pending')
    notes = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Order
        fields = [
            'id',
            'prescriptions',
            'patient_name',
            'status',
            'created_at',
            'total_amount',
            'prescription_ids',
            'notes'
        ]
        read_only_fields = ['id', 'created_at']

    def get_patient_name(self, obj):
        """Get the patient name from the first prescription."""
        first_prescription = obj.prescriptions.first()
        if first_prescription and first_prescription.patient:
            return first_prescription.patient.full_name
        return 'N/A'

    def create(self, validated_data):
        """
        Create an order with the provided prescription IDs.
        """
        prescription_ids = validated_data.pop('prescription_ids', [])
        
        with transaction.atomic():
            # Create the order
            order = Order.objects.create(
                user=self.context['request'].user,
                status=validated_data.get('status', 'pending'),
                notes=validated_data.get('notes', '')
            )
            
            # Add prescriptions to the order if any are provided
            if prescription_ids:
                prescriptions = Prescription.objects.filter(id__in=prescription_ids)
                order.prescriptions.add(*prescriptions)
                logger.info(f"Created order {order.id} with {prescriptions.count()} prescriptions")
            else:
                logger.info(f"Created order {order.id} with no prescriptions")
            
            return order

class OrderDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for orders, including prescription details.
    """
    prescriptions = PrescriptionListSerializer(many=True, read_only=True)
    patient_name = serializers.SerializerMethodField()
    total_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    shipping_method = serializers.CharField(default="Standard Shipping", read_only=True)
    shipping_address = serializers.CharField(read_only=True)
    notes = serializers.CharField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id',
            'prescriptions',
            'patient_name',
            'status',
            'created_at',
            'total_amount',
            'shipping_method',
            'shipping_address',
            'notes'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_patient_name(self, obj):
        """Get the patient name from the first prescription."""
        first_prescription = obj.prescriptions.first()
        if first_prescription and first_prescription.patient:
            return first_prescription.patient.full_name
        return 'N/A'
    
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