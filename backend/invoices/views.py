"""
Views for the invoices app.
"""
from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, FileResponse
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceItemSerializer, InvoiceDetailSerializer
import logging
from datetime import datetime
import os
import sys
from users.models import Clinic
try:
    import weasyprint
    HTML_TO_PDF_AVAILABLE = True
except ImportError:
    HTML_TO_PDF_AVAILABLE = False
    logging.warning("WeasyPrint not installed. PDF generation will not be available.")

logger = logging.getLogger(__name__)

# Create your views here.

class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InvoiceSerializer
    
    def get_queryset(self):
        """
        Filter invoices to only include those belonging to the current user's clinic.
        """
        user = self.request.user
        if user.is_staff:
            return Invoice.objects.all().order_by('-created_at')
        elif hasattr(user, 'clinic') and user.clinic:
            return Invoice.objects.filter(
                order__prescriptions__patient__clinic=user.clinic
            ).distinct().order_by('-created_at')
        return Invoice.objects.none()
    
    def get_serializer_class(self):
        """
        Return different serializers based on the action.
        """
        if self.action == 'retrieve':
            return InvoiceDetailSerializer
        return InvoiceSerializer
    
    def list(self, request, *args, **kwargs):
        """
        Override list method to handle DataTables request and return data in the expected format.
        """
        try:
            queryset = self.get_queryset()
            serializer = self.get_serializer(queryset, many=True)
            data = {
                'data': serializer.data,  # DataTables expects data in a 'data' key
                'recordsTotal': queryset.count(),
                'recordsFiltered': queryset.count(),
                'draw': request.GET.get('draw', 1)
            }
            return Response(data)
        except Exception as e:
            logger.error(f"Error in invoice list view: {str(e)}")
            return Response(
                {"error": f"Error retrieving invoices: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        """
        Generate a PDF version of the invoice.
        """
        try:
            invoice = self.get_object()
            # Add your PDF generation logic here
            return Response({"url": f"/invoices/{invoice.id}/pdf/"})
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return Response(
                {"error": f"Error generating PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def items(self, request, pk=None):
        """
        List all items for a specific invoice.
        """
        invoice = self.get_object()
        items = invoice.items.all()
        serializer = InvoiceItemSerializer(items, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """
        Add an item to an invoice.
        """
        invoice = self.get_object()
        serializer = InvoiceItemSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(invoice=invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InvoiceItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for invoice items.
    """
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter invoice items by the user's clinic if not staff.
        """
        user = self.request.user
        if user.is_staff:
            return InvoiceItem.objects.all()
        
        # Get the user's clinic
        clinic = Clinic.objects.filter(users=user).first()
        if clinic:
            return InvoiceItem.objects.filter(
                invoice__order__prescription__patient__clinic=clinic
            )
        return InvoiceItem.objects.none()
