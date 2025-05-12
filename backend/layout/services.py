from uuid import UUID, uuid4
from sqlmodel import Session, select
from db.models import Table, StaticItem, Wall, Reservation, TableType
from schemas.layout import LayoutUpdate, TableCreate, StaticItemCreate, WallCreate
import logging

logger = logging.getLogger(__name__)


def get_layout(session: Session, room_id: UUID = None, include_types: bool = False):
    """
    Get the restaurant layout (tables, static items and walls)
    """
    if room_id is None:
        # If no room_id is provided, get the first room's items
        table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
        if table:
            room_id = table.room_id
        else:
            # If no tables exist, create a default room ID
            room_id = uuid4()
    
    tables_query = select(Table).where(
        Table.room_id == room_id,
        Table.is_active == True
    )
    
    tables = session.exec(tables_query).all()
    static_items = session.exec(select(StaticItem).where(StaticItem.room_id == room_id)).all()
    walls = session.exec(select(Wall).where(Wall.room_id == room_id)).all()
    
    # If include_types is True, return the EnhancedLayout schema that includes related type info
    if include_types:
        for table in tables:
            # Load related objects
            if table.type_id:
                table.table_type = session.get(TableType, table.type_id)
    
    return {"tables": tables, "static_items": static_items, "walls": walls}


def save_layout(layout_data: LayoutUpdate, session: Session, room_id: UUID = None):
    """
    Save a new layout (replace existing)
    """
    with session.no_autoflush:
        if room_id is None:
            # If no room_id is provided, get the first room's items
            table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
            if table:
                room_id = table.room_id
            else:
                # If no tables exist, create a default room ID
                room_id = uuid4()
        
        # Create a map of existing tables to check if we're using any existing table IDs
        existing_tables = {}
        tables_to_update = session.exec(select(Table).where(
            Table.room_id == room_id,
            Table.is_active == True
        )).all()
        for table in tables_to_update:
            existing_tables[str(table.id)] = table
        
        # Create a list of tables that we'll preserve (those that appear in the new layout)
        preserved_table_ids = []

        # Create or update tables
        new_tables = []
        for i, table_data in enumerate(layout_data.tables):
            # If the table has an ID and exists, update it
            if hasattr(table_data, 'id') and table_data.id and str(table_data.id) in existing_tables:
                table_id = str(table_data.id)
                existing_table = existing_tables[table_id]
                
                # Update basic properties
                existing_table.type_id = table_data.type_id
                existing_table.table_number = table_data.table_number
                existing_table.max_guests = table_data.max_guests
                existing_table.x = table_data.x
                existing_table.y = table_data.y
                existing_table.rotation = table_data.rotation
                
                # Update width and height if provided
                if hasattr(table_data, 'width') and table_data.width is not None:
                    existing_table.width = table_data.width
                if hasattr(table_data, 'height') and table_data.height is not None:
                    existing_table.height = table_data.height
                
                session.add(existing_table)
                preserved_table_ids.append(table_id)
                new_tables.append(existing_table)
            else:
                # Create a new table
                new_table = Table(
                    type_id=table_data.type_id,
                    table_number=table_data.table_number,
                    max_guests=table_data.max_guests,
                    x=table_data.x,
                    y=table_data.y,
                    rotation=table_data.rotation,
                    room_id=room_id,
                    is_active=True
                )
                
                # Set additional properties if provided
                if hasattr(table_data, 'width') and table_data.width is not None:
                    new_table.width = table_data.width
                if hasattr(table_data, 'height') and table_data.height is not None:
                    new_table.height = table_data.height
                
                session.add(new_table)
                new_tables.append(new_table)
        
        # Commit tables first so they have IDs
        session.flush()
        
        # Mark tables as inactive instead of deleting them
        tables_to_mark_inactive = []
        for table_id, table in existing_tables.items():
            if table_id not in preserved_table_ids:
                tables_to_mark_inactive.append(table)
        
        # Handle reservations for tables that will be marked inactive
        if tables_to_mark_inactive:
            # First, get all affected reservations
            affected_reservations = []
            for table in tables_to_mark_inactive:
                reservations = session.exec(
                    select(Reservation).where(Reservation.table_id == table.id)
                ).all()
                affected_reservations.extend(reservations)
            
            # Then handle each reservation
            for reservation in affected_reservations:
                table_found = False
                # Try to find a suitable table
                if new_tables:
                    for new_table in new_tables:
                        if new_table.max_guests >= reservation.guests_count:
                            reservation.table_id = new_table.id
                            session.add(reservation)
                            table_found = True
                            break
                
                # If no suitable table found and there are any tables, assign to the largest one
                if not table_found and new_tables:
                    # Sort by max_guests descending
                    sorted_tables = sorted(new_tables, key=lambda t: t.max_guests, reverse=True)
                    reservation.table_id = sorted_tables[0].id
                    session.add(reservation)
                else:
                    # If no tables at all, we have to delete the reservation
                    if not new_tables:
                        session.delete(reservation)
        
        # Flush changes to avoid issues with the next operations
        session.flush()
        
        # Now mark tables as inactive instead of deleting them
        for table in tables_to_mark_inactive:
            table.is_active = False
            session.add(table)
        
        # Delete static items
        static_items_to_delete = session.exec(select(StaticItem).where(StaticItem.room_id == room_id)).all()
        for item in static_items_to_delete:
            session.delete(item)
        
        # Delete walls
        walls_to_delete = session.exec(select(Wall).where(Wall.room_id == room_id)).all()
        for wall in walls_to_delete:
            session.delete(wall)
        
        # Create new static items
        for item_data in layout_data.static_items:
            new_item = StaticItem(
                type=item_data.type,
                x=item_data.x,
                y=item_data.y,
                rotation=item_data.rotation,
                room_id=room_id
            )
            session.add(new_item)
        
        # Create new walls
        for wall_data in layout_data.walls:
            new_wall = Wall(
                x=wall_data.x,
                y=wall_data.y,
                rotation=wall_data.rotation,
                length=wall_data.length,
                room_id=room_id
            )
            session.add(new_wall)
        
        # Now commit everything
        session.commit()
        
        return get_layout(session, room_id)


def add_table(table_data: TableCreate, session: Session, room_id: UUID = None):
    """
    Add a single table to the layout
    """
    if room_id is None:
        # If no room_id is provided, get the first room's items
        existing_table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
        if existing_table:
            room_id = existing_table.room_id
        else:
            # If no tables exist, create a default room ID
            room_id = uuid4()
    
    new_table = Table(
        type_id=table_data.type_id,
        table_number=table_data.table_number,
        max_guests=table_data.max_guests,
        x=table_data.x,
        y=table_data.y,
        rotation=table_data.rotation,
        room_id=room_id,
        is_active=True
    )
    
    # Set additional properties if provided
    if hasattr(table_data, 'width') and table_data.width is not None:
        new_table.width = table_data.width
    if hasattr(table_data, 'height') and table_data.height is not None:
        new_table.height = table_data.height
    
    session.add(new_table)
    session.commit()
    session.refresh(new_table)
    
    return new_table


def add_static_item(item_data: StaticItemCreate, session: Session, room_id: UUID = None):
    """
    Add a single static item to the layout
    """
    if room_id is None:
        # If no room_id is provided, get the first room's items
        table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
        if table:
            room_id = table.room_id
        else:
            # If no tables exist, create a default room ID
            room_id = uuid4()
    
    new_item = StaticItem(
        type=item_data.type,
        x=item_data.x,
        y=item_data.y,
        rotation=item_data.rotation,
        room_id=room_id
    )
    
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    
    return new_item


def add_wall(wall_data: WallCreate, session: Session, room_id: UUID = None):
    """
    Add a single wall to the layout
    """
    if room_id is None:
        # If no room_id is provided, get the first room's items
        table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
        if table:
            room_id = table.room_id
        else:
            # If no tables exist, create a default room ID
            room_id = uuid4()
    
    new_wall = Wall(
        x=wall_data.x,
        y=wall_data.y,
        rotation=wall_data.rotation,
        length=wall_data.length,
        room_id=room_id
    )
    
    session.add(new_wall)
    session.commit()
    session.refresh(new_wall)
    
    return new_wall


def clear_layout(session: Session, room_id: UUID = None):
    """
    Clear the entire restaurant layout
    """
    try:
        if room_id is None:
            # If no room_id is provided, get the first room's items
            try:
                table = session.exec(select(Table).where(Table.is_active == True).limit(1)).first()
                if table:
                    room_id = table.room_id
                else:
                    # If no tables exist, create a default room ID
                    room_id = uuid4()
            except Exception as e:
                # If there's a database schema error, just use a default UUID
                logger.error(f"Error retrieving tables: {str(e)}")
                room_id = uuid4()
        
        try:
            # Mark tables as inactive instead of deleting them
            tables = session.exec(select(Table).where(
                Table.room_id == room_id,
                Table.is_active == True
            )).all()
            for table in tables:
                table.is_active = False
                session.add(table)
        except Exception as e:
            logger.error(f"Error marking tables as inactive: {str(e)}")
            # If there was an error with the Table model, we'll just skip this step
            pass
        
        try:
            # Delete static items
            static_items = session.exec(select(StaticItem).where(StaticItem.room_id == room_id)).all()
            for item in static_items:
                session.delete(item)
        except Exception as e:
            logger.error(f"Error deleting static items: {str(e)}")
            pass
        
        try:
            # Delete walls
            walls = session.exec(select(Wall).where(Wall.room_id == room_id)).all()
            for wall in walls:
                session.delete(wall)
        except Exception as e:
            logger.error(f"Error deleting walls: {str(e)}")
            pass
        
        session.commit()
        
        return {"tables": [], "static_items": [], "walls": []}
    except Exception as e:
        logger.error(f"Error in clear_layout: {str(e)}")
        session.rollback()
        # Return empty layout anyway
        return {"tables": [], "static_items": [], "walls": []} 