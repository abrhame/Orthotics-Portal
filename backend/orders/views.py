"""
Views for the orders app.
"""
from django.shortcuts import render
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order
from .serializers import OrderSerializer, OrderDetailSerializer
import logging

logger = logging.getLogger(__name__)

# Create your views here.

class OrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing orders.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        """
        Filter orders to only include those belonging to the current user's clinic.
        """
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        elif hasattr(user, 'clinic') and user.clinic:
            return Order.objects.filter(
                prescription__patient__clinic=user.clinic
            ).order_by('-created_at')
        return Order.objects.none()
    
    def get_serializer_class(self):
        """
        Return different serializers based on the action.
        """
        if self.action == 'retrieve':
            return OrderDetailSerializer
        return OrderSerializer
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an order if it's still in 'pending' status.
        """
        try:
            order = self.get_object()
            
            # Only allow cancellation of pending orders
            if order.status != 'pending':
                return Response(
                    {"error": "Only pending orders can be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update the order status to cancelled
            order.status = 'cancelled'
            order.save()
            
            logger.info(f"Order {order.id} cancelled by user {request.user.id}")
            
            return Response({"success": True})
        except Exception as e:
            logger.error(f"Error cancelling order: {str(e)}")
            return Response(
                {"error": "An error occurred while cancelling the order."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def create(self, request, *args, **kwargs):
        """
        Create a new order from the prescription IDs provided.
        """
        logger.info(f"Creating order with data: {request.data}")
        
        prescription_ids = request.data.get('prescription_ids', [])
        if not prescription_ids:
            return Response(
                {"error": "No prescriptions provided for the order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add the user to the request data
        data = request.data.copy()
        data['user'] = request.user.id
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            order = serializer.save()
            logger.info(f"Order {order.id} created successfully")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        logger.error(f"Error creating order: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
