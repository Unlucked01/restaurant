#!/bin/bash
set -e

echo "Creating default admin user..."
python create_default_admin.py

echo "Starting FastAPI server in production mode..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 