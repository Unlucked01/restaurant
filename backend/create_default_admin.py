#!/usr/bin/env python3
import os
import sys
from sqlmodel import Session, select, SQLModel
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

from db.database import engine, create_db_and_tables
from db.models import User
from utils.security import get_password_hash

def create_default_admin():
    """Create a default admin user if no admin exists"""
    # Get admin credentials from environment or use defaults
    admin_email = os.getenv("ADMIN_EMAIL", "admin@restaurant.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "adminpassword")
    admin_first_name = os.getenv("ADMIN_FIRST_NAME", "Admin")
    admin_last_name = os.getenv("ADMIN_LAST_NAME", "User")
    
    print("=== Creating default admin user ===")
    print(f"Email: {admin_email}")
    print(f"Password length: {len(admin_password)} chars")
    
    try:
        # Ensure database tables exist
        print("Creating database tables...")
        create_db_and_tables()
        print("Tables created successfully")
        
        with Session(engine) as session:
            # Check if admin user already exists
            print("Checking for existing admin users...")
            try:
                existing_admin = session.exec(
                    select(User).where(User.role == "admin")
                ).first()
                
                if existing_admin:
                    print(f"Admin user already exists: {existing_admin.email}")
                    return
                
                print("No existing admin found. Creating new admin...")
                
                # Create default admin user
                password_hash = get_password_hash(admin_password)
                admin_user = User(
                    email=admin_email,
                    password_hash=password_hash,
                    first_name=admin_first_name,
                    last_name=admin_last_name,
                    role="admin"
                )
                
                session.add(admin_user)
                session.commit()
                print(f"Default admin user created successfully: {admin_email}")
                print("IMPORTANT: Change the default password immediately!")
                
                # Verify the admin was created
                verify_admin = session.exec(
                    select(User).where(User.email == admin_email)
                ).first()
                
                if verify_admin:
                    print(f"Verified admin exists: {verify_admin.email}, role: {verify_admin.role}")
                else:
                    print("WARNING: Admin verification failed!")
            except Exception as e:
                print(f"Error during admin user query/creation: {e}")
                print(f"Error type: {type(e)}")
                raise
    
    except Exception as e:
        print(f"Error creating default admin user: {e}")
        print(f"Error type: {type(e)}")

if __name__ == "__main__":
    create_default_admin() 