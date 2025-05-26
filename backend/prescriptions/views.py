"""
Views for the prescriptions app.
"""
from rest_framework import generics, viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404, render
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from .models import (
    Template, Prescription, Scan, ClinicalMeasure, IntrinsicAdjustment,
    OffLoading, PlanterModifier, Posting, MaterialSelection, ShoeFitting,
    DeviceOption, Attachment, PrescriptionStatus, FootType, WearTime, Activity
)
from users.models import Clinic
from .serializers import (
    TemplateSerializer, PrescriptionListSerializer, PrescriptionDetailSerializer,
    PrescriptionCreateSerializer, ScanSerializer, ClinicalMeasureSerializer,
    IntrinsicAdjustmentSerializer, OffLoadingSerializer, PlanterModifierSerializer,
    PostingSerializer, MaterialSelectionSerializer, ShoeFittingSerializer,
    DeviceOptionSerializer, AttachmentSerializer, PrescriptionStatusSerializer,
    FootTypeSerializer, WearTimeSerializer, ActivitySerializer
)
from patients.models import Patient
import logging
from rest_framework.exceptions import ValidationError
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class TemplateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for prescription templates.
    
    This viewset provides CRUD operations for orthotic prescription templates.
    Templates define the structure and default values for prescription forms.
    """
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="List all prescription templates",
        manual_parameters=[
            openapi.Parameter(
                'active', openapi.IN_QUERY, 
                description="Filter templates by active status (true/false)",
                type=openapi.TYPE_BOOLEAN
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Create a new prescription template"
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Retrieve a specific prescription template"
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update a prescription template"
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Partially update a prescription template"
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Delete a prescription template"
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    def get_queryset(self):
        """
        Optionally filter templates by active status.
        """
        queryset = Template.objects.all()
        active = self.request.query_params.get('active')
        if active is not None:
            active = active.lower() == 'true'
            queryset = queryset.filter(is_active=active)
        return queryset

@method_decorator(csrf_exempt, name='dispatch')
class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for prescriptions.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        elif self.action == 'retrieve':
            return PrescriptionDetailSerializer
        return PrescriptionListSerializer
    
    def get_queryset(self):
        """
        Get prescriptions for the current user's clinic.
        """
        user = self.request.user
        if user.is_staff:
            return Prescription.objects.all().order_by('-created_at')
        # Get the user's clinic
        clinic = Clinic.objects.filter(users=user).first()
        if clinic:
            return Prescription.objects.filter(patient__clinic=clinic).order_by('-created_at')
        return Prescription.objects.none()
    
    def perform_create(self, serializer):
        """
        Associate the prescription with the user when creating.
        """
        serializer.save(clinician=self.request.user)
    
    @swagger_auto_schema(
        operation_description="List all orthotic prescriptions",
        manual_parameters=[
            openapi.Parameter(
                'patient', openapi.IN_QUERY, 
                description="Filter by patient ID (UUID)",
                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
            ),
            openapi.Parameter(
                'clinician', openapi.IN_QUERY, 
                description="Filter by clinician ID (UUID)",
                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
            ),
            openapi.Parameter(
                'template', openapi.IN_QUERY, 
                description="Filter by template ID (UUID)",
                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
            )
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Create a new orthotic prescription",
        request_body=PrescriptionCreateSerializer
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Retrieve a specific orthotic prescription with all related data"
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Update an orthotic prescription"
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Partially update an orthotic prescription"
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @swagger_auto_schema(
        operation_description="Delete an orthotic prescription"
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=['get', 'put', 'patch', 'post'])
    def scans(self, request, pk=None):
        """
        Get or update scan images for the prescription.
        
        GET: Get scan images for the prescription
        PUT/PATCH: Update scan images for an existing scan
        POST: Create a new scan for the prescription
        """
        try:
            prescription = self.get_object()
            logger.info(f"Processing scan request for prescription {prescription.id}")
            
            if request.method == 'GET':
                scans = Scan.objects.filter(prescription=prescription)
                serializer = ScanSerializer(scans, many=True, context={'request': request})
                return Response(serializer.data)
            
            if request.method == 'POST':
                # Create a new scan
                data = {'prescription': prescription.pk}
                
                # Handle file uploads for left foot
                if 'left_foot' in request.FILES:
                    data['left_foot'] = request.FILES['left_foot']
                    logger.info(f"Left foot scan received for prescription {prescription.id}")
                
                # Handle file uploads for right foot
                if 'right_foot' in request.FILES:
                    data['right_foot'] = request.FILES['right_foot']
                    logger.info(f"Right foot scan received for prescription {prescription.id}")
                
                if not ('left_foot' in data or 'right_foot' in data):
                    return Response(
                        {"error": "At least one scan file must be provided."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Delete existing scans for this prescription
                Scan.objects.filter(prescription=prescription).delete()
                logger.info(f"Deleted existing scans for prescription {prescription.id}")
                
                serializer = ScanSerializer(data=data, context={'request': request})
                if serializer.is_valid():
                    serializer.save()
                    logger.info(f"Successfully saved new scans for prescription {prescription.id}")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                logger.error(f"Validation error for prescription {prescription.id}: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            # For PUT/PATCH, update existing scan
            scan = Scan.objects.filter(prescription=prescription).first()
            if not scan:
                scan = Scan(prescription=prescription)
            
            # Prepare data for update
            data = {'prescription': prescription.pk}
            
            # Handle file uploads
            if 'left_foot' in request.FILES:
                data['left_foot'] = request.FILES['left_foot']
            
            if 'right_foot' in request.FILES:
                data['right_foot'] = request.FILES['right_foot']
            
            serializer = ScanSerializer(scan, data=data, partial=request.method == 'PATCH', context={'request': request})
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Successfully updated scans for prescription {prescription.id}")
                return Response(serializer.data)
            logger.error(f"Validation error for prescription {prescription.id}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Prescription.DoesNotExist:
            logger.error(f"Prescription not found: {pk}")
            return Response(
                {"error": "Prescription not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error handling scan upload for prescription {pk}: {str(e)}")
            return Response(
                {"error": f"Error processing scan upload: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_description="Get clinical measurements for the prescription",
        responses={200: ClinicalMeasureSerializer()}
    )
    @swagger_auto_schema(
        method='post',
        operation_description="Create clinical measurements for the prescription",
        request_body=ClinicalMeasureSerializer,
        responses={201: ClinicalMeasureSerializer()}
    )
    @swagger_auto_schema(
        method='put',
        operation_description="Update clinical measurements for the prescription",
        request_body=ClinicalMeasureSerializer,
        responses={200: ClinicalMeasureSerializer()}
    )
    @swagger_auto_schema(
        method='patch',
        operation_description="Partially update clinical measurements for the prescription",
        request_body=ClinicalMeasureSerializer,
        responses={200: ClinicalMeasureSerializer()}
    )
    @action(detail=True, methods=['get', 'post', 'put', 'patch'])
    def clinical_measures(self, request, pk=None):
        try:
            prescription = self.get_object()
        except Prescription.DoesNotExist:
            return Response(
                {"error": "Prescription not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            clinical_measure, created = ClinicalMeasure.objects.get_or_create(
                prescription=prescription
            )

            if request.method == 'POST':
                serializer = ClinicalMeasureSerializer(clinical_measure, data=request.data)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_description="Get intrinsic adjustments for the prescription",
        responses={200: IntrinsicAdjustmentSerializer()}
    )
    @swagger_auto_schema(
        method='post',
        operation_description="Create intrinsic adjustments for the prescription",
        request_body=IntrinsicAdjustmentSerializer,
        responses={201: IntrinsicAdjustmentSerializer()}
    )
    @swagger_auto_schema(
        method='put',
        operation_description="Update intrinsic adjustments for the prescription",
        request_body=IntrinsicAdjustmentSerializer,
        responses={200: IntrinsicAdjustmentSerializer()}
    )
    @swagger_auto_schema(
        method='patch',
        operation_description="Partially update intrinsic adjustments for the prescription",
        request_body=IntrinsicAdjustmentSerializer,
        responses={200: IntrinsicAdjustmentSerializer()}
    )
    @action(detail=True, methods=['get', 'post', 'put', 'patch'])
    def intrinsic_adjustments(self, request, pk=None):
        """
        Get, create, or update intrinsic adjustments for the prescription.
        """
        try:
            prescription = self.get_object()
        except Prescription.DoesNotExist:
            return Response(
                {"error": "Prescription not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Get or create the instance
            instance, created = IntrinsicAdjustment.objects.get_or_create(
                prescription=prescription
            )
            
            if request.method == 'GET':
                serializer = IntrinsicAdjustmentSerializer(instance)
                return Response(serializer.data)
            
            # For POST, PUT, PATCH - update the instance
            data = request.data.copy()
            data['prescription'] = prescription.id
            
            serializer = IntrinsicAdjustmentSerializer(
                instance,
                data=data,
                partial=request.method == 'PATCH'
            )
            
            if serializer.is_valid():
                serializer.save()
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
                return Response(serializer.data, status=status_code)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error handling intrinsic adjustments for prescription {pk}: {str(e)}")
            return Response(
                {"error": f"Error processing intrinsic adjustments: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_description="Get off-loading details for the prescription",
        responses={200: OffLoadingSerializer()}
    )
    @swagger_auto_schema(
        method='post',
        operation_description="Create off-loading details for the prescription",
        request_body=OffLoadingSerializer,
        responses={201: OffLoadingSerializer()}
    )
    @swagger_auto_schema(
        method='put',
        operation_description="Update off-loading details for the prescription",
        request_body=OffLoadingSerializer,
        responses={200: OffLoadingSerializer()}
    )
    @swagger_auto_schema(
        method='patch',
        operation_description="Partially update off-loading details for the prescription",
        request_body=OffLoadingSerializer,
        responses={200: OffLoadingSerializer()}
    )
    @action(detail=True, methods=['get', 'post', 'put', 'patch'])
    def off_loadings(self, request, pk=None):
        """
        Get, create, or update off-loadings for the prescription.
        """
        try:
            prescription = self.get_object()
        except Prescription.DoesNotExist:
            return Response(
                {"error": "Prescription not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            # Get or create the instance
            instance, created = OffLoading.objects.get_or_create(
                prescription=prescription
            )
            
            if request.method == 'GET':
                serializer = OffLoadingSerializer(instance)
                return Response(serializer.data)
            
            # For POST, PUT, PATCH - update the instance
            data = request.data.copy()
            data['prescription'] = prescription.id
            
            serializer = OffLoadingSerializer(
                instance,
                data=data,
                partial=request.method == 'PATCH'
            )
            
            if serializer.is_valid():
                serializer.save()
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
                return Response(serializer.data, status=status_code)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error handling off-loading for prescription {pk}: {str(e)}")
            return Response(
                {"error": f"Error processing off-loading: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        methods=['post'],
        request_body=PlanterModifierSerializer,
        responses={
            201: PlanterModifierSerializer(),
            400: 'Bad Request',
            404: 'Prescription not found'
        }
    )
    @swagger_auto_schema(
        methods=['get'],
        responses={
            200: PlanterModifierSerializer(),
            404: 'Prescription not found'
        }
    )
    @action(detail=True, methods=['get', 'post'], url_path='plantar-modifiers')
    def plantar_modifiers(self, request, pk=None):
        """
        Get or create plantar modifiers for a prescription.
        """
        try:
            prescription = self.get_object()
        except Prescription.DoesNotExist:
            return Response(
                {'error': 'Prescription not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method == 'GET':
            try:
                # Use filter().first() instead of direct attribute access
                planter_modifier = PlanterModifier.objects.filter(prescription=prescription).first()
                if planter_modifier:
                    serializer = PlanterModifierSerializer(planter_modifier)
                    return Response(serializer.data)
                else:
                    # Return empty data if no plantar modifiers exist yet
                    return Response({})
            except Exception as e:
                logger.error(f"Error retrieving plantar modifiers: {str(e)}")
                return Response(
                    {'error': f'Error retrieving plantar modifiers: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        elif request.method == 'POST':
            try:
                # Add prescription to the data
                data = request.data.copy()
                data['prescription'] = prescription.id

                # Try to get existing planter modifier or create new one
                planter_modifier = PlanterModifier.objects.filter(prescription=prescription).first()
                
                if planter_modifier:
                    # Update existing
                    serializer = PlanterModifierSerializer(
                        planter_modifier,
                        data=data,
                        partial=True
                    )
                else:
                    # Create new
                    serializer = PlanterModifierSerializer(data=data)

                if serializer.is_valid():
                    serializer.save()
                    return Response(
                        serializer.data,
                        status=status.HTTP_201_CREATED
                    )
                return Response(
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                logger.error(f"Error saving plantar modifiers: {str(e)}")
                return Response(
                    {'error': f'Error saving plantar modifiers: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def postings(self, request, pk=None):
        """
        Get or update postings for the prescription.
        """
        try:
            prescription = self.get_object()
            logger.info(f"Processing posting request for prescription {prescription.id}")
            
            # Get or create the posting instance
            instance, created = Posting.objects.get_or_create(
                prescription=prescription,
                defaults={
                    'prescription': prescription,
                    'left_heel_post_angle': 0,
                    'right_heel_post_angle': 0,
                    'left_heel_post_pitch': 0,
                    'right_heel_post_pitch': 0,
                    'left_heel_post_raise': 0,
                    'right_heel_post_raise': 0,
                    'left_heel_post_taper': 0,
                    'right_heel_post_taper': 0,
                    'left_forefoot_post_width': 'none',
                    'right_forefoot_post_width': 'none',
                    'left_forefoot_post_medial': False,
                    'left_forefoot_post_lateral': False,
                    'right_forefoot_post_medial': False,
                    'right_forefoot_post_lateral': False,
                    'left_forefoot_post_angle': 0,
                    'right_forefoot_post_angle': 0
                }
            )
            
            if request.method == 'GET':
                serializer = PostingSerializer(instance)
                return Response(serializer.data)
            
            # For PUT/PATCH requests
            data = request.data.copy()
            data['prescription'] = prescription.id
            
            # Ensure all numeric fields are properly converted
            numeric_fields = [
                'left_heel_post_angle', 'right_heel_post_angle',
                'left_heel_post_pitch', 'right_heel_post_pitch',
                'left_heel_post_raise', 'right_heel_post_raise',
                'left_heel_post_taper', 'right_heel_post_taper',
                'left_forefoot_post_angle', 'right_forefoot_post_angle'
            ]
            
            for field in numeric_fields:
                if field in data:
                    try:
                        data[field] = float(data[field])
                    except (TypeError, ValueError):
                        data[field] = 0
            
            # Ensure boolean fields are properly converted
            boolean_fields = [
                'left_forefoot_post_medial', 'left_forefoot_post_lateral',
                'right_forefoot_post_medial', 'right_forefoot_post_lateral'
            ]
            
            for field in boolean_fields:
                if field in data:
                    data[field] = bool(data[field])
            
            # Ensure select fields have valid values
            select_fields = ['left_forefoot_post_width', 'right_forefoot_post_width']
            valid_widths = ['none', 'quarterly_width', 'half_width', 'full_width']
            
            for field in select_fields:
                if field in data and data[field] not in valid_widths:
                    data[field] = 'none'
            
            serializer = PostingSerializer(
                instance,
                data=data,
                partial=request.method == 'PATCH'
            )
            
            if serializer.is_valid():
                serializer.save()
                status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
                return Response(serializer.data, status=status_code)
            
            logger.error(f"Validation error for posting: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"Error handling posting for prescription {pk}: {str(e)}")
            return Response(
                {"error": f"Error processing posting: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def material_selection(self, request, pk=None):
        """
        Get or update material selection for the prescription.
        """
        try:
            prescription = self.get_object()
            instance, created = MaterialSelection.objects.get_or_create(prescription=prescription)
            
            if request.method == 'GET':
                serializer = MaterialSelectionSerializer(instance)
                return Response(serializer.data)
            
            serializer = MaterialSelectionSerializer(instance, data=request.data, partial=request.method == 'PATCH')
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error handling material selection: {str(e)}")
            return Response(
                {"error": f"Error handling material selection: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def shoe_fitting(self, request, pk=None):
        """
        Get or update shoe fitting details for the prescription.
        """
        try:
            prescription = self.get_object()
            
            # Get or create the shoe fitting instance
            instance, created = ShoeFitting.objects.get_or_create(
                prescription=prescription,
                defaults={'prescription': prescription}
            )
            
            if request.method == 'GET':
                serializer = ShoeFittingSerializer(instance)
                return Response(serializer.data)
            
            # For PUT/PATCH requests
            data = request.data.copy()
            data['prescription'] = prescription.id
            
            serializer = ShoeFittingSerializer(
                instance,
                data=data,
                partial=request.method == 'PATCH'
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error handling shoe fitting: {str(e)}")
            return Response(
                {"error": f"Error handling shoe fitting: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get', 'put', 'patch'])
    def device_options(self, request, pk=None):
        """
        Get or update device options for the prescription.
        """
        try:
            prescription = self.get_object()
            
            # Get or create the device options instance
            instance, created = DeviceOption.objects.get_or_create(
                prescription=prescription,
                defaults={'prescription': prescription}
            )
            
            if request.method == 'GET':
                serializer = DeviceOptionSerializer(instance)
                return Response(serializer.data)
            
            # For PUT/PATCH requests
            data = request.data.copy()
            data['prescription'] = prescription.id
            
            serializer = DeviceOptionSerializer(
                instance,
                data=data,
                partial=request.method == 'PATCH'
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error handling device options: {str(e)}")
            return Response(
                {"error": f"Error handling device options: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        method='get',
        operation_description="Get attachments for the prescription",
        responses={200: AttachmentSerializer(many=True)}
    )
    @swagger_auto_schema(
        method='post',
        operation_description="Add an attachment to the prescription",
        request_body=AttachmentSerializer,
        responses={201: AttachmentSerializer()}
    )
    @swagger_auto_schema(
        method='delete',
        operation_description="Delete an attachment from the prescription",
        manual_parameters=[
            openapi.Parameter(
                'id', openapi.IN_QUERY, required=True,
                description="ID of the attachment to delete",
                type=openapi.TYPE_STRING, format=openapi.FORMAT_UUID
            )
        ],
        responses={204: "No content"}
    )
    @action(detail=True, methods=['get', 'post', 'delete'])
    def attachments(self, request, pk=None):
        """
        Get, create, or delete attachments for the prescription.
        """
        try:
            prescription = self.get_object()
            
            if request.method == 'GET':
                attachments = Attachment.objects.filter(prescription=prescription)
                serializer = AttachmentSerializer(attachments, many=True)
                return Response(serializer.data)
            
            elif request.method == 'POST':
                # Handle file upload
                if 'file' not in request.FILES:
                    return Response(
                        {"error": "No file provided"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                file_obj = request.FILES['file']
                filename = request.POST.get('filename', file_obj.name)
                
                # Create attachment
                attachment = Attachment.objects.create(
                    prescription=prescription,
                    file=file_obj,
                    filename=filename
                )
                
                serializer = AttachmentSerializer(attachment)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            
            elif request.method == 'DELETE':
                attachment_id = request.query_params.get('id')
                if not attachment_id:
                    return Response(
                        {"error": "Attachment ID is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
                attachment = get_object_or_404(Attachment, id=attachment_id, prescription=prescription)
                attachment.delete()
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except Exception as e:
            logger.error(f"Error handling attachment: {str(e)}")
            return Response(
                {"error": f"Error processing attachment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@csrf_exempt
def create_prescription(request):
    """API endpoint to create a simplified prescription."""
    logger.info(f"Create prescription request from user: {request.user}")
    
    try:
        # Extract data from request
        data = request.data.copy()
        patient_id = data.get('patient')
        orthotic_type = data.get('orthotic_type')
        activity_level = data.get('activity_level')
        arch_support = data.get('arch_support')
        cushioning = data.get('cushioning')
        notes = data.get('additional_notes', '')
        
        # Validate patient exists and belongs to user's clinic
        try:
            patient = Patient.objects.get(id=patient_id)
            
            # Check if patient belongs to user's clinic
            clinic = Clinic.objects.filter(users=request.user).first()
            if not request.user.is_staff and (not clinic or patient.clinic != clinic):
                return Response(
                    {"error": "Patient does not belong to your clinic"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create default template
        template, _ = Template.objects.get_or_create(
            name="Default Template",
            defaults={"description": "Auto-generated default template"}
        )
        
        # Create prescription with basic info
        prescription = Prescription.objects.create(
            patient=patient,
            clinician=request.user,
            template=template,
            general_notes=notes
        )
        
        # Create related models if needed
        DeviceOption.objects.create(
            prescription=prescription
        )
        
        MaterialSelection.objects.create(
            prescription=prescription
        )
        
        # Serialize the prescription for response
        serializer = PrescriptionDetailSerializer(prescription, context={'request': request})
        
        # Return success response with full prescription data
        return Response(serializer.data, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Error creating prescription: {str(e)}")
        return Response(
            {"error": f"Error creating prescription: {str(e)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def prescription_off_loading(request, pk):
    """
    View to handle off-loading data for a prescription.
    GET: Retrieves existing off-loading data
    POST: Creates or updates off-loading data
    """
    try:
        prescription = get_object_or_404(Prescription, pk=pk)
        
        # Check if user has permission to access this prescription
        if prescription.clinic != request.user.clinic:
            return Response({'detail': 'Not authorized to access this prescription'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        if request.method == 'GET':
            # Get existing off-loading data
            off_loading_data = OffLoading.objects.filter(prescription=prescription).first()
            if off_loading_data:
                serializer = OffLoadingSerializer(off_loading_data)
                return Response(serializer.data)
            return Response({}, status=status.HTTP_404_NOT_FOUND)
            
        elif request.method == 'POST':
            # Create or update off-loading data
            existing_data = OffLoading.objects.filter(prescription=prescription).first()
            
            if existing_data:
                # Update existing data
                serializer = OffLoadingSerializer(existing_data, data=request.data)
            else:
                # Create new data
                data = request.data.copy()
                data['prescription'] = prescription.id
                serializer = OffLoadingSerializer(data=data)
                
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Error handling off-loading data: {str(e)}")
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class OffLoadingViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows off-loading data to be viewed or edited.
    """
    serializer_class = OffLoadingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter off-loading data based on the user's clinic
        """
        user = self.request.user
        try:
            # Filter by user's clinic
            if user.is_superuser:
                return OffLoading.objects.all().order_by('-created_at')
            else:
                # Get prescriptions associated with the user's clinic
                clinic_prescriptions = Prescription.objects.filter(patient__clinic=user.clinic).values_list('id', flat=True)
                return OffLoading.objects.filter(prescription__id__in=clinic_prescriptions).order_by('-created_at')
        except Exception as e:
            logger.error(f"Error retrieving off-loading data: {str(e)}")
            return OffLoading.objects.none()

    def perform_create(self, serializer):
        """
        Assign the prescription when creating off-loading data
        """
        try:
            serializer.save()
        except Exception as e:
            logger.error(f"Error creating off-loading data: {str(e)}")
            raise ValidationError({"error": str(e)})

@method_decorator(csrf_exempt, name='dispatch')
class PrescriptionStatusViewSet(viewsets.ModelViewSet):
    """
    API endpoint for prescription statuses.
    
    This viewset provides CRUD operations for prescription status options.
    """
    queryset = PrescriptionStatus.objects.all()
    serializer_class = PrescriptionStatusSerializer
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class FootTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for foot types.
    
    This viewset provides CRUD operations for foot type options.
    """
    queryset = FootType.objects.all()
    serializer_class = FootTypeSerializer
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class WearTimeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for wear times.
    
    This viewset provides CRUD operations for wear time options.
    """
    queryset = WearTime.objects.all()
    serializer_class = WearTimeSerializer
    permission_classes = [permissions.IsAuthenticated]


@method_decorator(csrf_exempt, name='dispatch')
class ActivityViewSet(viewsets.ModelViewSet):
    """
    API endpoint for activity levels.
    
    This viewset provides CRUD operations for activity level options.
    """
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

@login_required
def create_prescription_view(request):
    """
    View for the new prescription workflow page with sidebar layout
    """
    context = {
        'current_step': 'patient',  # Initial step is patient selection/creation
        'steps': [
            {'id': 'patient', 'name': 'Patient', 'icon': 'bi-person'},
            {'id': 'scan_upload', 'name': 'Scan Upload', 'icon': 'bi-cloud-upload'},
            {'id': 'clinical_measures', 'name': 'Clinical Measures', 'icon': 'bi-rulers'},
            {'id': 'intrinsic', 'name': 'Intrinsic Adjustments', 'icon': 'bi-sliders'},
            {'id': 'offloading', 'name': 'Off-Loading', 'icon': 'bi-layers'},
            {'id': 'plantar_modifiers', 'name': 'Plantar Modifiers', 'icon': 'bi-grid'},
            {'id': 'material_selection', 'name': 'Material Selection', 'icon': 'bi-box'},
            {'id': 'shoe_fitting', 'name': 'Shoe Fitting', 'icon': 'bi-boot'},
            {'id': 'posting', 'name': 'Posting', 'icon': 'bi-stack'},
            {'id': 'device_options', 'name': 'Device Options', 'icon': 'bi-gear'},
            {'id': 'notes_attachments', 'name': 'Notes & Attachments', 'icon': 'bi-paperclip'},
        ]
    }
    return render(request, 'orthotics_portal/create_prescription.html', context)

@login_required
def add_patient_view(request):
    """
    View for adding a new patient and creating their first prescription
    """
    if request.method == 'POST':
        # Handle form submission here
        return JsonResponse({'status': 'success'})
    
    context = {
        'page_title': 'Add New Patient',
        'is_new_patient': True,
        'prescription': {
            'id': 'New',
            'created_at': None,
            'status': {'name': 'Draft', 'color': 'secondary'},
            'template': {'name': 'Standard'},
            'patient': None,
            'foot_type': None,
            'wear_time': None,
            'activity_level': None,
            'contact_clinician': False,
            'confirm_before_manufacture': False,
            'clinician_computer_aided_design': False,
            'general_notes': '',
            'left_foot_notes': '',
            'right_foot_notes': '',
            'scans': [],
            'attachments': []
        }
    }
    return render(request, 'orthotics_portal/prescription_detail.html', context)
