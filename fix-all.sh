#!/bin/bash

# Exit on error
set -e

echo "===== Orthotics Portal Comprehensive Fix Script ====="
echo "This script will fix common issues with the application."

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check for Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo "Docker Compose is not installed or not in your PATH."
    echo "Checking for docker-compose..."
    if ! command -v docker-compose &> /dev/null; then
        echo "Neither 'docker compose' nor 'docker-compose' found. Please install Docker Compose."
        exit 1
    else
        echo "Found docker-compose. We recommend updating to use the docker compose plugin."
        COMPOSE_CMD="docker-compose"
    fi
else
    COMPOSE_CMD="docker compose"
fi

echo "Using command: $COMPOSE_CMD"

# Stop all containers
echo "Stopping all containers..."
$COMPOSE_CMD down

# Reset database volume
echo "Do you want to reset the database? This will delete all data. (y/N)"
read -r reset_db
if [[ $reset_db =~ ^[Yy]$ ]]; then
    echo "Removing PostgreSQL data volume..."
    docker volume ls | grep postgres_data | awk '{print $2}' | xargs -r docker volume rm
    echo "Database volumes removed."
else
    echo "Skipping database reset."
fi

# Rebuild containers
echo "Rebuilding containers..."
$COMPOSE_CMD build --no-cache

# Start containers
echo "Starting containers..."
$COMPOSE_CMD up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Fix collation issues
echo "Fixing database collation issues..."
$COMPOSE_CMD exec db psql -U postgres -c "ALTER DATABASE orthotics_portal REFRESH COLLATION VERSION;" || echo "Failed to fix collation, but continuing..."

# Run migrations
echo "Running migrations..."
$COMPOSE_CMD exec backend python manage.py migrate

# Create superuser
echo "Creating superuser..."
$COMPOSE_CMD exec backend python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='admin@example.com').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword');
    print('Superuser created.');
else:
    print('Superuser already exists.');
"

# Collect static files
echo "Collecting static files..."
$COMPOSE_CMD exec backend python manage.py collectstatic --noinput

echo "===== Fix completed! ====="
echo "Your application should now be running at http://localhost:8000"
echo "Admin login: admin@example.com / adminpassword" 