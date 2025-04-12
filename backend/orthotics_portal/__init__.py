# This file is intentionally left empty to make the directory a Python package.

# Import celery app to ensure it's initialized
from orthotics_portal.celery import app as celery_app

__all__ = ('celery_app',) 