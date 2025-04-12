"""
Custom permission classes for the Orthotics Portal API.
"""
from rest_framework import permissions
from orthotics_portal.users.models import User


class IsAdminUser(permissions.BasePermission):
    """
    Permission to only allow admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.ADMIN


class IsClinicianUser(permissions.BasePermission):
    """
    Permission to only allow clinician users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.CLINICIAN


class IsLabTechUser(permissions.BasePermission):
    """
    Permission to only allow lab technician users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == User.LAB_TECH


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permission to only allow owners of an object or admin users.
    """
    def has_object_permission(self, request, view, obj):
        # Admin users have full access
        if request.user.role == User.ADMIN:
            return True
            
        # Check if the object has a user field
        if hasattr(obj, 'user'):
            return obj.user == request.user
            
        # Check if the object has a clinician field
        if hasattr(obj, 'clinician'):
            return obj.clinician == request.user
            
        return False 