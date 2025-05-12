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
from .serializers import InvoiceSerializer, InvoiceItemSerializer
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
    API endpoint for invoices.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = InvoiceSerializer
    
    def get_queryset(self):
        """
        Filter invoices by the user's clinic if not staff.
        """
        user = self.request.user
        if user.is_staff:
            return Invoice.objects.all()
        
        # Get the user's clinic
        clinic = Clinic.objects.filter(users=user).first()
        if clinic:
            return Invoice.objects.filter(order__prescription__patient__clinic=clinic)
        return Invoice.objects.none()
    
    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, invoice_id=None, *args, **kwargs):
        """
        Generate a PDF for the invoice.
        """
        invoice = get_object_or_404(self.get_queryset(), id=invoice_id)
        logger.info(f"Generating PDF for invoice {invoice.id}")
        
        # If WeasyPrint is not available, return an error
        if not HTML_TO_PDF_AVAILABLE:
            return Response(
                {"error": "PDF generation is not available."},
                status=status.HTTP_501_NOT_IMPLEMENTED
            )
        
        try:
            # Render the HTML template
            context = {
                'invoice': invoice,
                'items': invoice.items.all(),
                'date': datetime.now().strftime('%B %d, %Y'),
                'is_pdf': True
            }
            html_string = render_to_string('orthotics_portal/invoice_print.html', context)
            
            # Convert HTML to PDF
            html = weasyprint.HTML(string=html_string)
            pdf = html.write_pdf()
            
            # Create response with PDF
            response = HttpResponse(pdf, content_type='application/pdf')
            response['Content-Disposition'] = f'inline; filename="invoice_{invoice.id}.pdf"'
            
            return response
        except Exception as e:
            logger.error(f"Error generating PDF: {str(e)}")
            return Response(
                {"error": "Error generating PDF."},
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
