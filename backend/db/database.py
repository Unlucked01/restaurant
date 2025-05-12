import os
from sqlmodel import create_engine, Session, SQLModel

# Get the DATABASE_URL from environment variable with a fallback
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/restaurant")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)

# Dependency to get DB session
def get_session():
    with Session(engine) as session:
        yield session

# Create all tables
def create_db_and_tables():
    SQLModel.metadata.create_all(engine) 