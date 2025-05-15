#!/usr/bin/env python3
"""
Script to initialize a default room in the database if none exists.
"""

import os
import sys
from sqlmodel import Session, select
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(os.path.dirname(__file__))))

# Load environment variables
load_dotenv()

from db.database import engine
from db.models import Room

def create_default_room():
    """Create a default room if no rooms exist in the database"""
    print("=== Checking for default room ===")
    
    try:
        with Session(engine) as session:
            # Check if any rooms exist
            existing_room = session.exec(select(Room)).first()
            
            if existing_room:
                print(f"Room already exists: {existing_room.name} (ID: {existing_room.id})")
                return existing_room
            
            print("No existing rooms found. Creating default room...")
            
            # Create default room
            default_room = Room(
                name="Основной зал",
                description="Основной зал ресторана"
            )
            
            session.add(default_room)
            session.commit()
            session.refresh(default_room)
            
            print(f"Default room created successfully: {default_room.name} (ID: {default_room.id})")
            return default_room
            
    except Exception as e:
        print(f"Error during room creation: {e}")
        print(f"Error type: {type(e)}")
        raise

if __name__ == "__main__":
    create_default_room() 