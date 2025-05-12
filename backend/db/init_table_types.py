#!/usr/bin/env python3
"""
Script to initialize table types in the database.
Run this script to ensure all required table types are present,
including the banquet hall type that's currently missing.
"""

from sqlmodel import Session, select
from db.database import get_session, engine
from db.models import TableType

# Predefined table types with IDs
TABLE_TYPES = [
    {
        "id": 1,  # Circular table
        "name": "circular",
        "display_name": "Круглый столик",
        "default_width": 60,
        "default_height": 60,
        "default_max_guests": 2,
        "color_code": "#4CAF50",  # Green
    },
    {
        "id": 2,  # Large circular table
        "name": "circular-large",
        "display_name": "Большой круглый столик",
        "default_width": 80,
        "default_height": 80,
        "default_max_guests": 4,
        "color_code": "#4CAF50",  # Green
    },
    {
        "id": 3,  # Rectangular table
        "name": "rectangular",
        "display_name": "Прямоугольный столик",
        "default_width": 140,
        "default_height": 60,
        "default_max_guests": 10,
        "color_code": "#2196F3",  # Blue
    },
    {
        "id": 4,  # VIP table
        "name": "vip",
        "display_name": "VIP-столик",
        "default_width": 180,
        "default_height": 180,
        "default_max_guests": 8,
        "color_code": "#FFC107",  # Amber
    },
    {
        "id": 5,  # Banquet hall table
        "name": "banquet",
        "display_name": "Банкетный зал",
        "default_width": 200,
        "default_height": 100,
        "default_max_guests": 25,
        "color_code": "#9C27B0",  # Purple
    }
]

def init_table_types():
    """Initialize table types in the database."""
    print("Initializing table types...")
    with Session(engine) as session:
        # Get existing types
        existing_types = session.exec(select(TableType)).all()
        existing_ids = {t.id for t in existing_types}
        
        # Check and add missing types
        for type_data in TABLE_TYPES:
            if type_data["id"] not in existing_ids:
                # Create type if it doesn't exist
                new_type = TableType(**type_data)
                session.add(new_type)
                print(f"Created table type: {type_data['name']} (ID: {type_data['id']})")
            else:
                # Update existing type
                existing_type = session.get(TableType, type_data["id"])
                for key, value in type_data.items():
                    setattr(existing_type, key, value)
                print(f"Updated table type: {type_data['name']} (ID: {type_data['id']})")
        
        # Commit changes
        session.commit()
    
    # Verify all types are present
    with Session(engine) as session:
        all_types = session.exec(select(TableType)).all()
        print("\nCurrent table types in database:")
        for table_type in all_types:
            print(f"ID: {table_type.id}, Name: {table_type.name}, Display: {table_type.display_name}")
    
    print("\nTable types initialization completed.")

if __name__ == "__main__":
    init_table_types() 