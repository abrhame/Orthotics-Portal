#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
# Check if netcat is installed, if not, try to use pg_isready instead
if command -v nc &> /dev/null; then
  until nc -z $DB_HOST $DB_PORT; do
    sleep 1
  done
else
  until pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER; do
    sleep 1
  done
fi
echo "PostgreSQL is ready!"

# Apply migrations
echo "Applying migrations..."
python manage.py migrate

# Create superuser if not exists
echo "Creating superuser if not exists..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser(email='admin@example.com', password='adminpassword');
    print('Superuser created.');
else:
    print('Superuser already exists.');
"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Setup completed!" 