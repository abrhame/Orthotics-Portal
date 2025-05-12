"""
Serializers for the prescriptions app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from patients.serializers import PatientSerializer
from .models import (
    Template, Prescription, Scan, ClinicalMeasure, IntrinsicAdjustment,
    OffLoading, PlanterModifier, Posting, MaterialSelection, ShoeFitting,
    DeviceOption, Attachment, PrescriptionStatus, FootType, WearTime, Activity
)

User = get_user_model()

class TemplateSerializer(serializers.ModelSerializer):
    """
    Serializer for the Template model.
    """
    class Meta:
        model = Template
        fields = ['id', 'name', 'description', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        ref_name = 'PrescriptionTemplate'

class ScanSerializer(serializers.ModelSerializer):
    """
    Serializer for the Scan model.
    
    Handles validation and processing of 3D scan files (STL, VRML, etc.).
    """
    left_foot_url = serializers.SerializerMethodField(read_only=True)
    right_foot_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Scan
        fields = [
            'id', 'prescription', 'left_foot', 'right_foot', 
            'left_foot_url', 'right_foot_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'left_foot_url', 'right_foot_url']
    
    def get_left_foot_url(self, obj):
        """Get the full URL for the left foot scan."""
        if obj.left_foot:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.left_foot.url)
            return obj.left_foot.url
        return None
    
    def get_right_foot_url(self, obj):
        """Get the full URL for the right foot scan."""
        if obj.right_foot:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.right_foot.url)
            return obj.right_foot.url
        return None
    
    def validate(self, data):
        """
        Validate that at least one foot scan is provided.
        """
        if not data.get('left_foot') and not data.get('right_foot'):
            raise serializers.ValidationError(
                "At least one foot scan (left or right) must be provided."
            )
        return data
    
    def validate_left_foot(self, value):
        """Validate the left foot scan file."""
        if value:
            # Check file size (50MB max for 3D files)
            max_size = 50 * 1024 * 1024  # 50 MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"File size should not exceed {max_size / (1024 * 1024)}MB."
                )
            
            # Check file extension
            allowed_extensions = ['.stl', '.wrl', '.vrml', '.obj', '.ply']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f"File extension not allowed. Allowed extensions are: {', '.join(allowed_extensions)}"
                )
            
            # Basic content validation for STL files
            if ext == '.stl':
                try:
                    header = value.read(5).decode('utf-8')
                    value.seek(0)  # Reset file pointer
                    if not (header.startswith('solid') or self._is_binary_stl(value)):
                        raise serializers.ValidationError("Invalid STL file format")
                except UnicodeDecodeError:
                    # If we can't decode as UTF-8, check if it's a binary STL
                    if not self._is_binary_stl(value):
                        raise serializers.ValidationError("Invalid STL file format")
                    value.seek(0)  # Reset file pointer
        return value
    
    def validate_right_foot(self, value):
        """Validate the right foot scan file."""
        if value:
            # Check file size (50MB max for 3D files)
            max_size = 50 * 1024 * 1024  # 50 MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    f"File size should not exceed {max_size / (1024 * 1024)}MB."
                )
            
            # Check file extension
            allowed_extensions = ['.stl', '.wrl', '.vrml', '.obj', '.ply']
            import os
            ext = os.path.splitext(value.name)[1].lower()
            if ext not in allowed_extensions:
                raise serializers.ValidationError(
                    f"File extension not allowed. Allowed extensions are: {', '.join(allowed_extensions)}"
                )
            
            # Basic content validation for STL files
            if ext == '.stl':
                try:
                    header = value.read(5).decode('utf-8')
                    value.seek(0)  # Reset file pointer
                    if not (header.startswith('solid') or self._is_binary_stl(value)):
                        raise serializers.ValidationError("Invalid STL file format")
                except UnicodeDecodeError:
                    # If we can't decode as UTF-8, check if it's a binary STL
                    if not self._is_binary_stl(value):
                        raise serializers.ValidationError("Invalid STL file format")
                    value.seek(0)  # Reset file pointer
        return value
    
    def _is_binary_stl(self, file_obj):
        """Check if the file is a binary STL format."""
        try:
            # Save current position
            current_pos = file_obj.tell()
            
            # Binary STL files have an 80-byte header followed by a 4-byte number
            file_obj.seek(0)
            header = file_obj.read(80)
            num_triangles_bytes = file_obj.read(4)
            
            # Reset file position
            file_obj.seek(current_pos)
            
            # If we couldn't read 84 bytes, it's not a valid binary STL
            if len(header) != 80 or len(num_triangles_bytes) != 4:
                return False
            
            # Check if the file size matches what we expect for the number of triangles
            import struct
            num_triangles = struct.unpack('<I', num_triangles_bytes)[0]
            expected_size = 80 + 4 + (50 * num_triangles)
            actual_size = file_obj.size
            
            # Allow some tolerance in the size comparison
            return abs(expected_size - actual_size) < 100
            
        except Exception:
            return False

class ClinicalMeasureSerializer(serializers.ModelSerializer):
    """
    Serializer for the ClinicalMeasure model.
    """
    class Meta:
        model = ClinicalMeasure
        fields = [
            'id', 'prescription',
            'left_scan_angle', 'left_forefoot_varus', 'left_forefoot_valgus',
            'left_heel_to_mpj_centre', 'left_posterior_heel_to_heel_centre',
            'right_scan_angle', 'right_forefoot_varus', 'right_forefoot_valgus',
            'right_heel_to_mpj_centre', 'right_posterior_heel_to_heel_centre',
        ]
        read_only_fields = ['id']

class IntrinsicAdjustmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the IntrinsicAdjustment model.
    """
    class Meta:
        model = IntrinsicAdjustment
        fields = [
            'id', 'prescription',
            'left_arch_expansion', 'left_heel_expansion', 'left_shell_width', 'left_shell_length',
            'left_pfa_height', 'left_pfa_value_mm', 'left_skive', 'left_skive_method',
            'left_skive_depth_mm', 'left_skive_degree', 'left_skive_inclination', 'left_skive_specific_inclination',
            'right_arch_expansion', 'right_heel_expansion', 'right_shell_width', 'right_shell_length',
            'right_pfa_height', 'right_pfa_value_mm', 'right_skive', 'right_skive_method',
            'right_skive_depth_mm', 'right_skive_degree', 'right_skive_inclination', 'right_skive_specific_inclination',
        ]
        read_only_fields = ['id']

class OffLoadingSerializer(serializers.ModelSerializer):
    """
    Serializer for OffLoading model
    """
    class Meta:
        model = OffLoading
        fields = [
            'id', 'prescription', 'metatarsal_dome', 'metatarsal_bar', 
            'morton_extension', 'kinetic_wedge', 'lateral_wedge', 
            'medial_wedge', 'heel_skive', 'heel_aperture', 
            'custom_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class PlanterModifierSerializer(serializers.ModelSerializer):
    """
    Serializer for the PlanterModifier model.
    """
    class Meta:
        model = PlanterModifier
        fields = [
            'prescription',
            'left_y_rib', 'left_k_rib', 'left_cuboid', 'left_styloid',
            'left_navicular', 'left_first_ray', 'left_fifth_ray',
            'right_y_rib', 'right_k_rib', 'right_cuboid', 'right_styloid',
            'right_navicular', 'right_first_ray', 'right_fifth_ray',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        """
        Validate that all measurements are non-negative and within reasonable range.
        """
        measurement_fields = [
            'left_y_rib', 'left_k_rib', 'left_cuboid', 'left_styloid',
            'left_navicular', 'left_first_ray', 'left_fifth_ray',
            'right_y_rib', 'right_k_rib', 'right_cuboid', 'right_styloid',
            'right_navicular', 'right_first_ray', 'right_fifth_ray'
        ]
        
        for field in measurement_fields:
            value = data.get(field, 0)
            if value < 0:
                raise serializers.ValidationError({
                    field: 'Measurement cannot be negative.'
                })
            if value > 100:
                raise serializers.ValidationError({
                    field: 'Measurement cannot exceed 100mm.'
                })
        
        return data

class PostingSerializer(serializers.ModelSerializer):
    """
    Serializer for the Posting model.
    """
    class Meta:
        model = Posting
        fields = [
            'id', 'prescription',
            'left_heel_post_width', 'left_heel_post_angle', 'left_heel_post_pitch',
            'left_heel_post_raise', 'left_heel_post_taper',
            'left_forefoot_post_width', 'left_forefoot_post_medial', 'left_forefoot_post_lateral',
            'left_forefoot_post_angle',
            'right_heel_post_width', 'right_heel_post_angle', 'right_heel_post_pitch',
            'right_heel_post_raise', 'right_heel_post_taper',
            'right_forefoot_post_width', 'right_forefoot_post_medial', 'right_forefoot_post_lateral',
            'right_forefoot_post_angle',
        ]
        read_only_fields = ['id']

class MaterialSelectionSerializer(serializers.ModelSerializer):
    """
    Serializer for the MaterialSelection model.
    """
    class Meta:
        model = MaterialSelection
        fields = [
            'id', 'prescription', 'shell_material', 'shell_thickness',
            'top_cover', 'second_cover', 'third_cover',
            'full_length_plantar_cover', 'cover_length',
            'extension_forefoot', 'extension_midfoot_medial', 'extension_midfoot_lateral',
        ]
        read_only_fields = ['id']

class ShoeFittingSerializer(serializers.ModelSerializer):
    """
    Serializer for the ShoeFitting model.
    """
    class Meta:
        model = ShoeFitting
        fields = ['id', 'prescription', 'sizing_style', 'orthosis_size', 'to_fit_shoe']
        read_only_fields = ['id']

class DeviceOptionSerializer(serializers.ModelSerializer):
    """
    Serializer for the DeviceOption model.
    """
    class Meta:
        model = DeviceOption
        fields = [
            'id', 'prescription',
            'medial_arch_height', 'lateral_arch_height', 'medial_heel_height', 'lateral_heel_height',
            'heel_width', 'midfoot_width', 'forefoot_width',
        ]
        read_only_fields = ['id']

class AttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Attachment model.
    """
    class Meta:
        model = Attachment
        fields = ['id', 'prescription', 'file', 'filename', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

class PrescriptionStatusSerializer(serializers.ModelSerializer):
    """
    Serializer for the PrescriptionStatus model.
    """
    class Meta:
        model = PrescriptionStatus
        fields = ['id', 'name', 'description', 'color', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FootTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for the FootType model.
    """
    class Meta:
        model = FootType
        fields = ['id', 'name', 'description', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class WearTimeSerializer(serializers.ModelSerializer):
    """
    Serializer for the WearTime model.
    """
    class Meta:
        model = WearTime
        fields = ['id', 'name', 'description', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for the Activity model.
    """
    class Meta:
        model = Activity
        fields = ['id', 'name', 'description', 'order', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PrescriptionListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for listing prescriptions.
    """
    patient_name = serializers.SerializerMethodField()
    clinician_name = serializers.SerializerMethodField()
    template_name = serializers.SerializerMethodField()
    status_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Prescription
        fields = ['id', 'patient_name', 'clinician_name', 'template_name', 'status', 'status_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_patient_name(self, obj):
        return obj.patient.full_name if obj.patient else None
    
    def get_clinician_name(self, obj):
        return obj.clinician.get_full_name() if obj.clinician else None
    
    def get_template_name(self, obj):
        return obj.template.name if obj.template else None
        
    def get_status_name(self, obj):
        return obj.status.name if obj.status else None

class PrescriptionDetailSerializer(serializers.ModelSerializer):
    """
    Detailed serializer for a complete prescription with all related data.
    """
    patient = PatientSerializer(read_only=True)
    clinician = serializers.SerializerMethodField()
    template = TemplateSerializer(read_only=True)
    status = PrescriptionStatusSerializer(read_only=True)
    foot_type = FootTypeSerializer(read_only=True)
    wear_time = WearTimeSerializer(read_only=True)
    activity_level = ActivitySerializer(read_only=True)
    scans = ScanSerializer(many=True, read_only=True)
    clinical_measures = ClinicalMeasureSerializer(read_only=True)
    intrinsic_adjustments = IntrinsicAdjustmentSerializer(read_only=True)
    off_loading = OffLoadingSerializer(read_only=True)
    planter_modifiers = PlanterModifierSerializer(read_only=True)
    postings = PostingSerializer(read_only=True)
    material_selection = MaterialSelectionSerializer(read_only=True)
    shoe_fitting = ShoeFittingSerializer(read_only=True)
    device_options = DeviceOptionSerializer(read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'clinician', 'template', 'created_at', 'updated_at',
            'status', 'foot_type', 'wear_time', 'activity_level',
            'turnaround', 'contact_clinician', 'confirm_before_manufacture', 'clinician_computer_aided_design',
            'general_notes', 'left_foot_notes', 'right_foot_notes',
            'scans', 'clinical_measures', 'intrinsic_adjustments', 'off_loading',
            'planter_modifiers', 'postings', 'material_selection', 'shoe_fitting',
            'device_options', 'attachments',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_clinician(self, obj):
        if not obj.clinician:
            return None
        return {
            'id': obj.clinician.id,
            'first_name': obj.clinician.first_name,
            'last_name': obj.clinician.last_name,
            'email': obj.clinician.email,
            'full_name': obj.clinician.get_full_name()
        }

class PrescriptionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new prescription with minimal fields.
    """
    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'clinician', 'template', 
            'status', 'foot_type', 'wear_time', 'activity_level',
            'turnaround', 'contact_clinician', 'confirm_before_manufacture', 'clinician_computer_aided_design',
            'general_notes', 'left_foot_notes', 'right_foot_notes',
        ]
        read_only_fields = ['id']

# Add an alias for backwards compatibility
PrescriptionSerializer = PrescriptionListSerializer 