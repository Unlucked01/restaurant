#!/bin/bash

# Stop docker containers
echo "Stopping Docker containers..."
docker-compose down

# Remove volumes to delete database data
echo "Removing database volumes..."
docker volume rm restaurant_postgres_data

# Start containers again
echo "Restarting containers with fresh database..."
docker-compose up -d

echo "Done! The database has been reset with the new schema."
echo "You may need to wait a few seconds for the containers to fully start up." 