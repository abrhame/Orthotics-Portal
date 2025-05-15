#!/bin/bash

# Exit on error
set -e

echo "Deploying Orthotics Portal..."

# Create necessary directories
echo "Creating directories..."
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
DEBUG=0
SECRET_KEY=your-secret-key-here
DB_NAME=orthotics_portal
DB_USER=postgres
DB_PASSWORD=your-db-password-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
EOL
    echo "Please update the .env file with your actual values"
    exit 1
fi

# Build and start containers
echo "Building and starting containers..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 10

# Check container status
echo "Checking container status..."
docker compose -f docker-compose.prod.yml ps

echo "Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your production values"
echo "2. Update nginx/nginx.conf with your domain name"
echo "3. Set up SSL certificates using certbot"
echo ""
echo "To view logs: docker compose -f docker-compose.prod.yml logs -f"
echo "To stop: docker compose -f docker-compose.prod.yml down" 