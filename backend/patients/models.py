"""
Models for the patients app.
"""
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Patient(models.Model):
    """
    Model for patient information.
    """
    GENDER_CHOICES = (
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='', blank=True)
    clinic = models.ForeignKey(
        'users.Clinic',
        on_delete=models.CASCADE,
        related_name='patients'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']
        verbose_name = _('patient')
        verbose_name_plural = _('patients')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
