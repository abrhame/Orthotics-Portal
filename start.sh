#!/bin/bash

# Exit on error
set -e

echo "Setting up Orthotics Portal project..."

# Create necessary directories
mkdir -p backend/mediafiles backend/staticfiles

# Start docker-compose services
echo "Starting Docker containers..."
docker-compose up -d --build

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run migrations
echo "Running migrations..."
docker-compose exec backend python manage.py migrate

# Create superuser
echo "Creating superuser..."
docker-compose exec backend python manage.py shell -c "
from orthotics_portal.users.models import User, Clinic
from django.db.utils import IntegrityError

try:
    # Create clinic
    clinic, created = Clinic.objects.get_or_create(
        name='Demo Clinic',
        defaults={
            'address': '123 Main St, Anytown, USA',
            'phone': '555-123-4567',
            'email': 'demo@example.com'
        }
    )
    
    # Create admin user
    User.objects.create_superuser(
        email='admin@example.com',
        password='admin123',
        first_name='Admin',
        last_name='User',
        clinic=clinic
    )
    print('Admin user created successfully.')
except IntegrityError:
    print('Admin user already exists.')
"

echo "Setup complete! The application is now running."
echo "Access the frontend at: http://localhost:3000"
echo "Access the backend API at: http://localhost:8000/api/v1"
echo "Access the API documentation at: http://localhost:8000/api/docs"
echo "Admin credentials: admin@example.com / admin123" 