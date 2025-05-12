from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel


class TableTypeBase(BaseModel):
    name: str
    display_name: str
    default_width: int
    default_height: int
    default_max_guests: int
    color_code: Optional[str] = None


class TableTypeCreate(TableTypeBase):
    pass


class TableTypeRead(TableTypeBase):
    id: int

    class Config:
        orm_mode = True


class TableBase(BaseModel):
    type_id: int
    table_number: int
    max_guests: int
    x: int
    y: int
    rotation: int = 0
    width: Optional[int] = None
    height: Optional[int] = None


class TableCreate(TableBase):
    id: Optional[UUID] = None


class TableRead(TableBase):
    id: UUID
    room_id: UUID
    is_active: bool = True

    class Config:
        orm_mode = True


class TableFullRead(TableRead):
    table_type: Optional[TableTypeRead] = None

    class Config:
        orm_mode = True


class StaticItemBase(BaseModel):
    type: str
    x: int
    y: int
    rotation: int = 0


class StaticItemCreate(StaticItemBase):
    id: Optional[UUID] = None


class StaticItemRead(StaticItemBase):
    id: UUID
    room_id: UUID

    class Config:
        orm_mode = True


class WallBase(BaseModel):
    x: int
    y: int
    rotation: int = 0
    length: int


class WallCreate(WallBase):
    id: Optional[UUID] = None


class WallRead(WallBase):
    id: UUID
    room_id: UUID

    class Config:
        orm_mode = True


class LayoutItem(BaseModel):
    id: UUID
    type_id: int
    table_number: int
    x: int
    y: int
    rotation: int
    item_type: str  # "table" or "static"
    max_guests: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None


class LayoutUpdate(BaseModel):
    tables: List[TableCreate]
    static_items: List[StaticItemCreate]
    walls: List[WallCreate] = []


class Layout(BaseModel):
    tables: List[TableRead]
    static_items: List[StaticItemRead]
    walls: List[WallRead] = []

    class Config:
        orm_mode = True


class EnhancedLayout(BaseModel):
    tables: List[TableFullRead]
    static_items: List[StaticItemRead]
    walls: List[WallRead] = []

    class Config:
        orm_mode = True 