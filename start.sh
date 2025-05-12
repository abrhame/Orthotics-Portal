#!/bin/bash

# Exit on error
set -e

if [ "$1" = "reset" ]; then
    echo "Resetting database volume..."
    ./reset-db.sh
    exit 0
fi

echo "Starting Orthotics Portal in development mode..."

# Build containers if needed
echo "Building containers..."
docker compose build

# Start containers
echo "Starting containers..."
docker compose up -d

# Wait for services to be available
echo "Waiting for services to be ready..."
sleep 10

# Display container status
echo "Container status:"
docker compose ps

# Fix collation warning if needed
echo "Checking if database needs collation fix..."
docker compose exec db psql -U postgres -c "ALTER DATABASE orthotics_portal REFRESH COLLATION VERSION;"

echo "Orthotics Portal is now running!"
echo ""
echo "Access the application at: http://localhost:8000/"
echo "Admin interface: http://localhost:8000/admin/"
echo "  Username: admin"
echo "  Password: adminpassword"
echo ""
echo "To view logs:                  docker compose logs -f"
echo "To stop the application:       docker compose down"
echo "To reset the database:         ./start.sh reset"
