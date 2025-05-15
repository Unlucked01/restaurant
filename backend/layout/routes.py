from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlmodel import Session, select
from db.database import get_session
from utils.security import get_current_user, get_current_admin
from schemas.layout import (
    Layout, EnhancedLayout, LayoutUpdate, TableCreate, TableRead, TableFullRead,
    StaticItemCreate, StaticItemRead, WallCreate, WallRead,
    TableTypeCreate, TableTypeRead, RoomCreate, RoomRead
)
from .services import get_layout, save_layout, add_table, add_static_item, add_wall, clear_layout
from db.models import User, TableType, Room
from datetime import datetime

router = APIRouter(prefix="/layout", tags=["layout"])

# Room Management Endpoints
@router.get("/rooms", response_model=List[RoomRead])
def get_rooms(session: Session = Depends(get_session)):
    return session.exec(select(Room)).all()

@router.get("/rooms/{room_id}", response_model=RoomRead)
def get_room(room_id: UUID, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room

@router.post("/rooms", response_model=RoomRead)
def create_room(
    room: RoomCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    existing = session.exec(select(Room).where(Room.name == room.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Room with name '{room.name}' already exists")
    new_room = Room(**room.dict())
    session.add(new_room)
    session.commit()
    session.refresh(new_room)
    return new_room

@router.put("/rooms/{room_id}", response_model=RoomRead)
def update_room(
    room_id: UUID,
    room: RoomCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    db_room = session.get(Room, room_id)
    if not db_room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    if db_room.name != room.name:
        existing = session.exec(select(Room).where(Room.name == room.name)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Room with name '{room.name}' already exists")
    db_room.name = room.name
    db_room.description = room.description
    db_room.updated_at = datetime.now()
    session.add(db_room)
    session.commit()
    session.refresh(db_room)
    return db_room

@router.get("/", response_model=Layout)
def get_restaurant_layout(room_id: Optional[UUID] = None, session: Session = Depends(get_session)):
    return get_layout(session, room_id)

@router.get("/enhanced", response_model=EnhancedLayout)
def get_enhanced_restaurant_layout(room_id: Optional[UUID] = None, session: Session = Depends(get_session)):
    return get_layout(session, room_id, include_types=True)

@router.post("/save", response_model=Layout)
def save_restaurant_layout(
    layout: LayoutUpdate,
    room_id: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    print(f"Saving layout with {len(layout.tables)} tables and {len(layout.static_items)} static items and {len(layout.walls)} walls")
    print(f"Current admin user: {current_user.email}")
    return save_layout(layout, session, room_id)

@router.post("/tables", response_model=TableRead)
def add_restaurant_table(
    table: TableCreate,
    room_id: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    return add_table(table, session, room_id)

@router.post("/static-items", response_model=StaticItemRead)
def add_restaurant_static_item(
    item: StaticItemCreate,
    room_id: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    return add_static_item(item, session, room_id)

@router.post("/walls", response_model=WallRead)
def add_restaurant_wall(
    wall: WallCreate,
    room_id: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    return add_wall(wall, session, room_id)

@router.post("/clear", response_model=Layout)
def clear_restaurant_layout(
    room_id: Optional[UUID] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    return clear_layout(session, room_id)

@router.get("/table-types", response_model=List[TableTypeRead])
def get_table_types(session: Session = Depends(get_session)):
    return session.exec(select(TableType)).all()

@router.get("/table-types/{type_id}", response_model=TableTypeRead)
def get_table_type(type_id: UUID, session: Session = Depends(get_session)):
    table_type = session.get(TableType, type_id)
    if not table_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table type not found")
    return table_type

@router.post("/table-types", response_model=TableTypeRead)
def create_table_type(
    table_type: TableTypeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    existing = session.exec(select(TableType).where(TableType.name == table_type.name)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Table type with name '{table_type.name}' already exists")
    new_type = TableType(**table_type.dict())
    session.add(new_type)
    session.commit()
    session.refresh(new_type)
    return new_type

@router.put("/table-types/{type_id}", response_model=TableTypeRead)
def update_table_type(
    type_id: UUID,
    table_type: TableTypeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_admin)
):
    db_type = session.get(TableType, type_id)
    if not db_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table type not found")
    if db_type.name != table_type.name:
        existing = session.exec(select(TableType).where(TableType.name == table_type.name)).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Table type with name '{table_type.name}' already exists")
    for key, value in table_type.dict().items():
        setattr(db_type, key, value)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type
