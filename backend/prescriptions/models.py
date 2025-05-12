"""
Models for the prescriptions app.
"""
import uuid
from django.db import models
from django.conf import settings
from patients.models import Patient
import os

def ensure_scan_directories():
    """Ensure scan directories exist with proper permissions."""
    left_dir = os.path.join(settings.MEDIA_ROOT, 'scans', 'left')
    right_dir = os.path.join(settings.MEDIA_ROOT, 'scans', 'right')
    
    for directory in [left_dir, right_dir]:
        if not os.path.exists(directory):
            os.makedirs(directory, mode=0o755, exist_ok=True)

def scan_upload_path(instance, filename, foot='left'):
    """Generate upload path for scan files."""
    ensure_scan_directories()
    ext = os.path.splitext(filename)[1].lower()
    new_filename = f"{instance.prescription.id}_{foot}{ext}"
    return os.path.join('scans', foot, new_filename)

def left_foot_upload_path(instance, filename):
    return scan_upload_path(instance, filename, 'left')

def right_foot_upload_path(instance, filename):
    return scan_upload_path(instance, filename, 'right')

class Template(models.Model):
    """
    Model for prescription templates.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Prescription(models.Model):
    """
    Model for prescription data.
    """
    TURNAROUND_CHOICES = [
        ('standard', '3DP Standard (5 working days)'),
        ('express', '3DP Express (3 working days)'),
        ('urgent', '3DP Urgent (1 working day)'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    clinician = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')
    template = models.ForeignKey(Template, on_delete=models.CASCADE, related_name='prescriptions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status
    status = models.ForeignKey('PrescriptionStatus', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    
    # Clinical information
    foot_type = models.ForeignKey('FootType', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    wear_time = models.ForeignKey('WearTime', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    activity_level = models.ForeignKey('Activity', on_delete=models.SET_NULL, null=True, blank=True, related_name='prescriptions')
    
    # Administration fields
    turnaround = models.CharField(max_length=20, choices=TURNAROUND_CHOICES, default='standard')
    contact_clinician = models.BooleanField(default=False)
    confirm_before_manufacture = models.BooleanField(default=False)
    clinician_computer_aided_design = models.BooleanField(default=False)
    
    # Notes
    general_notes = models.TextField(blank=True)
    left_foot_notes = models.TextField(blank=True)
    right_foot_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"Prescription for {self.patient.full_name} by {self.clinician.get_full_name()}"

class Scan(models.Model):
    """
    Model for foot scan 3D model files (STL, VRML, etc.).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='scans')
    left_foot = models.FileField(upload_to=left_foot_upload_path, null=True, blank=True)
    right_foot = models.FileField(upload_to=right_foot_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Scan for prescription {self.prescription.id}"

    def save(self, *args, **kwargs):
        # Ensure directories exist before saving
        ensure_scan_directories()
        super().save(*args, **kwargs)

class ClinicalMeasure(models.Model):
    """
    Model for clinical measurements for each foot.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='clinical_measures')
    
    # Left foot alignment
    left_scan_angle = models.FloatField(null=True, blank=True)
    left_forefoot_varus = models.FloatField(null=True, blank=True)
    left_forefoot_valgus = models.FloatField(null=True, blank=True)
    left_heel_to_mpj_centre = models.FloatField(null=True, blank=True)
    left_posterior_heel_to_heel_centre = models.FloatField(null=True, blank=True)
    
    # Right foot alignment
    right_scan_angle = models.FloatField(null=True, blank=True)
    right_forefoot_varus = models.FloatField(null=True, blank=True)
    right_forefoot_valgus = models.FloatField(null=True, blank=True)
    right_heel_to_mpj_centre = models.FloatField(null=True, blank=True)
    right_posterior_heel_to_heel_centre = models.FloatField(null=True, blank=True)

class IntrinsicAdjustment(models.Model):
    """
    Model for intrinsic adjustments for each foot.
    """
    EXPANSION_CHOICES = [
        ('none', 'None'),
        ('minimal', 'Minimal - 10%'),
        ('standard', 'Standard - 20%'),
        ('maximum', 'Maximum - 30%'),
    ]
    
    SHELL_WIDTH_CHOICES = [
        ('standard', 'Standard'),
        ('wide', 'Wide'),
        ('slim', 'Slim'),
        ('super_slim', 'Super Slim'),
    ]
    
    SHELL_LENGTH_CHOICES = [
        ('standard', 'Standard'),
        ('long', 'Long'),
        ('short', 'Short'),
    ]
    
    PFA_HEIGHT_CHOICES = [
        ('straight', 'Straight'),
        ('curved', 'Curved'),
        ('scan', 'Scan'),
        ('none', 'None'),
    ]
    
    SKIVE_CHOICES = [
        ('none', 'None'),
        ('medial', 'Medial'),
        ('lateral', 'Lateral'),
    ]
    
    SKIVE_METHOD_CHOICES = [
        ('depth', 'Depth/mm'),
        ('degree', 'Degree'),
    ]
    
    SKIVE_INCLINATION_CHOICES = [
        ('maximum', 'Maximum Inclination'),
        ('zero', 'Zero Degree Inclination'),
        ('specific', 'Specific Inclination'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='intrinsic_adjustments')
    
    # Left foot adjustments
    left_arch_expansion = models.CharField(max_length=20, choices=EXPANSION_CHOICES, default='standard')
    left_heel_expansion = models.CharField(max_length=20, choices=EXPANSION_CHOICES, default='standard')
    left_shell_width = models.CharField(max_length=20, choices=SHELL_WIDTH_CHOICES, default='standard')
    left_shell_length = models.CharField(max_length=20, choices=SHELL_LENGTH_CHOICES, default='standard')
    left_pfa_height = models.CharField(max_length=20, choices=PFA_HEIGHT_CHOICES, default='scan')
    left_pfa_value_mm = models.FloatField(null=True, blank=True)
    left_skive = models.CharField(max_length=20, choices=SKIVE_CHOICES, default='none')
    left_skive_method = models.CharField(max_length=20, choices=SKIVE_METHOD_CHOICES, null=True, blank=True)
    left_skive_depth_mm = models.FloatField(null=True, blank=True)
    left_skive_degree = models.FloatField(null=True, blank=True)
    left_skive_inclination = models.CharField(max_length=20, choices=SKIVE_INCLINATION_CHOICES, null=True, blank=True)
    left_skive_specific_inclination = models.FloatField(null=True, blank=True)
    
    # Right foot adjustments
    right_arch_expansion = models.CharField(max_length=20, choices=EXPANSION_CHOICES, default='standard')
    right_heel_expansion = models.CharField(max_length=20, choices=EXPANSION_CHOICES, default='standard')
    right_shell_width = models.CharField(max_length=20, choices=SHELL_WIDTH_CHOICES, default='standard')
    right_shell_length = models.CharField(max_length=20, choices=SHELL_LENGTH_CHOICES, default='standard')
    right_pfa_height = models.CharField(max_length=20, choices=PFA_HEIGHT_CHOICES, default='scan')
    right_pfa_value_mm = models.FloatField(null=True, blank=True)
    right_skive = models.CharField(max_length=20, choices=SKIVE_CHOICES, default='none')
    right_skive_method = models.CharField(max_length=20, choices=SKIVE_METHOD_CHOICES, null=True, blank=True)
    right_skive_depth_mm = models.FloatField(null=True, blank=True)
    right_skive_degree = models.FloatField(null=True, blank=True)
    right_skive_inclination = models.CharField(max_length=20, choices=SKIVE_INCLINATION_CHOICES, null=True, blank=True)
    right_skive_specific_inclination = models.FloatField(null=True, blank=True)

class OffLoading(models.Model):
    """
    Model to store off-loading data for a prescription
    """
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='off_loading')
    metatarsal_dome = models.BooleanField(default=False)
    metatarsal_bar = models.BooleanField(default=False)
    morton_extension = models.BooleanField(default=False)
    kinetic_wedge = models.BooleanField(default=False)
    lateral_wedge = models.BooleanField(default=False)
    medial_wedge = models.BooleanField(default=False)
    heel_skive = models.BooleanField(default=False)
    heel_aperture = models.BooleanField(default=False)
    custom_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Off-loading for {self.prescription}"

class PlanterModifier(models.Model):
    """
    Model for planter modifiers for each foot.
    """
    prescription = models.OneToOneField(
        Prescription,
        on_delete=models.CASCADE,
        related_name='planter_modifier'
    )
    
    # Left foot measurements
    left_y_rib = models.FloatField(default=0)
    left_k_rib = models.FloatField(default=0)
    left_cuboid = models.FloatField(default=0)
    left_styloid = models.FloatField(default=0)
    left_navicular = models.FloatField(default=0)
    left_first_ray = models.FloatField(default=0)
    left_fifth_ray = models.FloatField(default=0)
    
    # Right foot measurements
    right_y_rib = models.FloatField(default=0)
    right_k_rib = models.FloatField(default=0)
    right_cuboid = models.FloatField(default=0)
    right_styloid = models.FloatField(default=0)
    right_navicular = models.FloatField(default=0)
    right_first_ray = models.FloatField(default=0)
    right_fifth_ray = models.FloatField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'planter_modifiers'
        ordering = ['-created_at']

    def __str__(self):
        return f"Planter Modifier for Prescription {self.prescription.id}"

class Posting(models.Model):
    """
    Model for posting details for each foot.
    """
    HEEL_POST_WIDTH_CHOICES = [
        ('none', 'None'),
        ('half_width', 'Half Width'),
        ('full_width', 'Full Width'),
    ]
    
    FOREFOOT_POST_WIDTH_CHOICES = [
        ('none', 'None'),
        ('full_width', 'Full Width'),
        ('half_width', 'Half Width'),
        ('quarterly_width', 'Quarterly Width'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='postings')
    
    # Left foot heel post
    left_heel_post_width = models.CharField(max_length=20, choices=HEEL_POST_WIDTH_CHOICES, default='none')
    left_heel_post_angle = models.FloatField(null=True, blank=True)
    left_heel_post_pitch = models.FloatField(null=True, blank=True)
    left_heel_post_raise = models.FloatField(null=True, blank=True)
    left_heel_post_taper = models.FloatField(null=True, blank=True)
    
    # Left foot forefoot post
    left_forefoot_post_width = models.CharField(max_length=20, choices=FOREFOOT_POST_WIDTH_CHOICES, default='none')
    left_forefoot_post_medial = models.BooleanField(default=False)
    left_forefoot_post_lateral = models.BooleanField(default=False)
    left_forefoot_post_angle = models.FloatField(null=True, blank=True)
    
    # Right foot heel post
    right_heel_post_width = models.CharField(max_length=20, choices=HEEL_POST_WIDTH_CHOICES, default='none')
    right_heel_post_angle = models.FloatField(null=True, blank=True)
    right_heel_post_pitch = models.FloatField(null=True, blank=True)
    right_heel_post_raise = models.FloatField(null=True, blank=True)
    right_heel_post_taper = models.FloatField(null=True, blank=True)
    
    # Right foot forefoot post
    right_forefoot_post_width = models.CharField(max_length=20, choices=FOREFOOT_POST_WIDTH_CHOICES, default='none')
    right_forefoot_post_medial = models.BooleanField(default=False)
    right_forefoot_post_lateral = models.BooleanField(default=False)
    right_forefoot_post_angle = models.FloatField(null=True, blank=True)

class MaterialSelection(models.Model):
    """
    Model for material selection.
    """
    SHELL_MATERIAL_CHOICES = [
        ('pa11_nylon', 'PA-11 Nylon'),
    ]
    
    SHELL_THICKNESS_CHOICES = [
        ('2.0mm', '2.0mm (minimum)'),
        ('2.5mm', '2.5mm'),
        ('3.0mm', '3.0mm'),
        ('4.0mm', '4.0mm'),
        ('4.5mm', '4.5mm (maximum)'),
    ]
    
    COVER_MATERIAL_CHOICES = [
        ('eva_120_black_2mm', 'EVA 120 (Black) - 2.0mm'),
        ('eva_120_black_3mm', 'EVA 120 (Black) - 3.0mm'),
        ('eva_120_red_2mm', 'EVA 120 (Red) - 2.0mm'),
        ('eva_120_red_3mm', 'EVA 120 (Red) - 3.0mm'),
        ('eva_120_jelly_bean', 'EVA 120 (Jelly Bean) - 2.0mm'),
        ('microfibre_black', 'Microfibre (Black)'),
        ('microfibre_blue', 'Microfibre (Blue)'),
        ('ppt_poron_1_6mm', 'PPT (PORON) - 1.6mm'),
        ('ppt_poron_3_2mm', 'PPT (PORON) - 3.2mm'),
        ('poron_general', 'Poron (general)'),
        ('slow_release_poron', 'Slow Release Poron'),
        ('none', 'None'),
    ]
    
    PLANTAR_COVER_CHOICES = [
        ('none', 'None'),
        ('cambrille', 'Cambrille'),
    ]
    
    COVER_LENGTH_CHOICES = [
        ('full', 'Full'),
        ('sulcus', 'Sulcus'),
        ('met', 'Met'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='material_selection')
    
    # Shell material
    shell_material = models.CharField(max_length=20, choices=SHELL_MATERIAL_CHOICES, default='pa11_nylon')
    shell_thickness = models.CharField(max_length=10, choices=SHELL_THICKNESS_CHOICES, default='3.0mm')
    
    # Cover materials
    top_cover = models.CharField(max_length=30, choices=COVER_MATERIAL_CHOICES, default='eva_120_black_2mm')
    second_cover = models.CharField(max_length=30, choices=COVER_MATERIAL_CHOICES, default='none')
    third_cover = models.CharField(max_length=30, choices=COVER_MATERIAL_CHOICES, default='none')
    
    # Cover options
    full_length_plantar_cover = models.CharField(max_length=20, choices=PLANTAR_COVER_CHOICES, default='none')
    cover_length = models.CharField(max_length=10, choices=COVER_LENGTH_CHOICES, default='full')
    
    # Extensions
    extension_forefoot = models.BooleanField(default=False)
    extension_midfoot_medial = models.BooleanField(default=False)
    extension_midfoot_lateral = models.BooleanField(default=False)

class ShoeFitting(models.Model):
    """
    Model for shoe fitting details.
    """
    SIZING_STYLE_CHOICES = [
        ('mens', "Men's"),
        ('womens', "Women's"), 
        ('womens_address', "Women's Address"),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='shoe_fitting')
    
    sizing_style = models.CharField(max_length=20, choices=SIZING_STYLE_CHOICES, default='mens')
    orthosis_size = models.CharField(max_length=10)
    to_fit_shoe = models.CharField(max_length=255)

class DeviceOption(models.Model):
    """
    Model for specific device dimensions and options.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.OneToOneField(Prescription, on_delete=models.CASCADE, related_name='device_options')
    
    # Specific dimensions
    medial_arch_height = models.FloatField(null=True, blank=True)
    lateral_arch_height = models.FloatField(null=True, blank=True)
    medial_heel_height = models.FloatField(null=True, blank=True)
    lateral_heel_height = models.FloatField(null=True, blank=True)
    heel_width = models.FloatField(null=True, blank=True)
    midfoot_width = models.FloatField(null=True, blank=True)
    forefoot_width = models.FloatField(null=True, blank=True)

class Attachment(models.Model):
    """
    Model for prescription attachments.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='prescription_attachments/')
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

class PrescriptionStatus(models.Model):
    """
    Model for prescription status options.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default="primary")  # Bootstrap color class
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Prescription Status"
        verbose_name_plural = "Prescription Statuses"


class FootType(models.Model):
    """
    Model for foot type options.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Foot Type"
        verbose_name_plural = "Foot Types"


class WearTime(models.Model):
    """
    Model for wear time options.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Wear Time"
        verbose_name_plural = "Wear Times"


class Activity(models.Model):
    """
    Model for activity level options.
    """
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = "Activity"
        verbose_name_plural = "Activities"
