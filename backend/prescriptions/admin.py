from django.contrib import admin
from .models import (
    Template, Prescription, Scan, ClinicalMeasure, IntrinsicAdjustment,
    OffLoading, PlanterModifier, Posting, MaterialSelection, ShoeFitting,
    DeviceOption, Attachment, PrescriptionStatus, FootType, WearTime, Activity
)

@admin.register(PrescriptionStatus)
class PrescriptionStatusAdmin(admin.ModelAdmin):
    list_display = ('name', 'color', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('order', 'name')

@admin.register(FootType)
class FootTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('order', 'name')

@admin.register(WearTime)
class WearTimeAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('order', 'name')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'description')
    ordering = ('order', 'name')

# Register your models here.
admin.site.register(Template)
admin.site.register(Prescription)
admin.site.register(Scan)
admin.site.register(ClinicalMeasure)
admin.site.register(IntrinsicAdjustment)
admin.site.register(OffLoading)
admin.site.register(PlanterModifier)
admin.site.register(Posting)
admin.site.register(MaterialSelection)
admin.site.register(ShoeFitting)
admin.site.register(DeviceOption)
admin.site.register(Attachment)
