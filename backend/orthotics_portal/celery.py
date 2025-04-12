"""
Celery configuration for the Orthotics Portal.
"""
import os
from celery import Celery

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'orthotics_portal.settings')

# Create the Celery app
app = Celery('orthotics_portal')

# Load the Celery configuration from the Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery."""
    print(f'Request: {self.request!r}') 