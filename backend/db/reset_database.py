from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import create_async_engine
import asyncio
import logging
from db.database import get_engine, get_session
from db.models import TableType

logger = logging.getLogger(__name__)

async def reset_database():
    # Get the engine
    engine = get_engine()
    
    # Drop all tables
    logger.info("Dropping all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
    
    # Create all tables
    logger.info("Creating all tables with new schema...")
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    
    logger.info("Database reset complete!")

def reset_database_sync():
    # For sync usage
    asyncio.run(reset_database())

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    reset_database_sync()
    print("Database has been reset with the new schema!") 