#!/bin/bash

echo "WARNING: This will delete all PostgreSQL data volumes!"
echo "Make sure your containers are stopped before proceeding."
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo 

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping containers if they're running..."
    docker compose down

    echo "Removing PostgreSQL data volume..."
    docker volume ls | grep postgres_data | awk '{print $2}' | xargs -r docker volume rm

    echo "Database volume has been reset."
    echo "You can now restart your containers with: docker compose up -d"
else
    echo "Operation cancelled."
fi 