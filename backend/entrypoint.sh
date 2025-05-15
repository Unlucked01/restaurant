#!/bin/bash

# Create default admin user
python create_default_admin.py

# Create default room if needed
python -m db.create_default_room

# Start the API server with hot reload
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload