"""
Patient models for the Orthotics Portal.
"""
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Patient(models.Model):
    """
    Model representing a patient in the system.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(_('first name'), max_length=100)
    last_name = models.CharField(_('last name'), max_length=100)
    date_of_birth = models.DateField(_('date of birth'))
    email = models.EmailField(_('email address'), blank=True, null=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True, null=True)
    address = models.TextField(_('address'), blank=True, null=True)
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
        """Return the patient's full name."""
        return f"{self.first_name} {self.last_name}" 