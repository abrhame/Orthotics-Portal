"""
Views for the patients app.
"""
from django.shortcuts import render
from prescriptions.models import Prescription
from rest_framework import generics, viewsets, permissions, status, serializers
from rest_framework.response import Response
from .models import Patient
from .serializers import PatientSerializer
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
import logging
from django.views.decorators.http import require_http_methods
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from users.models import Clinic
from prescriptions.models import Template

logger = logging.getLogger(__name__)


class PatientListCreateView(generics.ListCreateAPIView):
    """
    View for listing and creating patients.
    """
    permission_classes = (IsAuthenticated,)
    queryset = Patient.objects.all()


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting a patient.
    """
    permission_classes = (IsAuthenticated,)
    queryset = Patient.objects.all()


@method_decorator(csrf_exempt, name='dispatch')
class PatientViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows patients to be viewed or edited.
    """
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Filter patients to show only those from the user's clinic.
        """
        user = self.request.user
        if user.is_staff:
            return Patient.objects.all()
        
        # Regular users can only see patients from their clinic
        if hasattr(user, 'clinic') and user.clinic:
            return Patient.objects.filter(clinic=user.clinic)
            
        # Alternative method using the reverse relationship
        try:
            clinic = Clinic.objects.filter(users=user).first()
            if clinic:
                return Patient.objects.filter(clinic=clinic)
        except Exception as e:
            logger.error(f"Error getting patient queryset: {str(e)}")
        
        return Patient.objects.none()

    def perform_create(self, serializer):
        """
        Set the clinic and template when creating a patient.
        """
        user = self.request.user
        logger.info(f"Creating patient for user: {user.email}")
        logger.info(f"User clinic direct: {getattr(user, 'clinic', None)}")
        
        template_id = self.request.data.get('template_id')
        logger.info(f"Template ID from request: {template_id}")

        # add default template_id if not provided
        if not template_id:
            # Fetch the default template
            default_template = Template.objects.filter(is_active=True).first()
            if default_template:
                template_id = default_template.id
                logger.info(f"Using default template: {template_id}")

        # First try direct relationship
        if hasattr(user, 'clinic') and user.clinic:
            logger.info(f"Using direct clinic relationship: {user.clinic}")
            patient = serializer.save(clinic=user.clinic)
        else:
            # Alternative method using the reverse relationship
            logger.info("Direct clinic not found, trying reverse relationship")
            clinic = Clinic.objects.filter(users=user).first()
            logger.info(f"Found clinic through reverse lookup: {clinic}")
            if not clinic:
                logger.error(f"No clinic found for user {user.email}")
                raise serializers.ValidationError({"clinic": "User does not have an associated clinic"})
            patient = serializer.save(clinic=clinic)

        # Create a new prescription for the patient
        prescription = Prescription.objects.create(patient=patient, clinician=user, template_id=template_id)
        logger.info(f"Prescription created: {prescription.__str__()}")
        logger.info(f"Prescription created: {prescription.id}")
        logger.info(f"Patient created: {patient.__str__()}")
        return {'patient': patient, 'prescription': prescription}
        
        

    @csrf_exempt  
    @action(detail=False, methods=['post'], url_path='create')
    def create_patient(self, request):
        """
        Create a new patient with form data.
        This endpoint is accessed via /api/patients/create/
        """
        try:
            logger.info(f"Request data in create patient view: {request.data}")
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                result = self.perform_create(serializer)
                patient = result['patient']
                prescription = result['prescription']
                logger.info(f"Patient created in create patient view: {patient.__str__()}")
                logger.info(f"Prescription created in create patient view: {prescription.id}")
                return Response(
                    {'message': 'Patient created successfully', 'patient': serializer.data, 'prescription_id': prescription.id},
                    status=status.HTTP_201_CREATED
                )
            print("serializer errors", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Error creating patient: {str(e)}")
            return Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def prescriptions(self, request, pk=None):
        """
        Return a list of prescriptions for this patient.
        """
        patient = self.get_object()
        prescriptions = patient.prescriptions.all()
        from prescriptions.serializers import PrescriptionListSerializer
        serializer = PrescriptionListSerializer(prescriptions, many=True)
        return Response(serializer.data)
