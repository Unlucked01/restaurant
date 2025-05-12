from datetime import date, time, datetime
from typing import List, Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship


class TableType(SQLModel, table=True):
    __tablename__ = "table_types"
    
    id: int = Field(primary_key=True)
    name: str = Field(unique=True, index=True)  # "circular", "rectangular", "vip"
    display_name: str  # "Круглый столик", "Прямоугольный столик", "VIP-столик"
    default_width: int
    default_height: int
    default_max_guests: int
    color_code: Optional[str] = None  # For frontend styling
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    tables: List["Table"] = Relationship(back_populates="table_type")


class User(SQLModel, table=True):
    __tablename__ = "users"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = Field(default="user")
    
    reservations: List["Reservation"] = Relationship(back_populates="user")


class Table(SQLModel, table=True):
    __tablename__ = "tables"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    type_id: int = Field(foreign_key="table_types.id")
    table_number: int  # Sequential number for each table type (1 to n)
    max_guests: int
    x: int
    y: int
    rotation: int = Field(default=0)
    width: Optional[int] = None
    height: Optional[int] = None
    room_id: UUID = Field(default_factory=uuid4)
    is_active: bool = Field(default=True)  # Instead of deleting, tables can be marked inactive
    
    reservations: List["Reservation"] = Relationship(back_populates="table")
    table_type: TableType = Relationship(back_populates="tables")


class StaticItem(SQLModel, table=True):
    __tablename__ = "static_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    type: str
    x: int
    y: int
    rotation: int = Field(default=0)
    room_id: UUID


class Wall(SQLModel, table=True):
    __tablename__ = "walls"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    x: int
    y: int
    rotation: int = Field(default=0)
    length: int
    room_id: UUID


class Reservation(SQLModel, table=True):
    __tablename__ = "reservations"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id")
    table_id: UUID = Field(foreign_key="tables.id")
    reservation_date: date
    reservation_time: time
    guests_count: int
    first_name: str
    last_name: str
    phone: str
    
    user: User = Relationship(back_populates="reservations")
    table: Table = Relationship(back_populates="reservations")
    ordered_items: List["OrderItem"] = Relationship(back_populates="reservation")


class Category(SQLModel, table=True):
    __tablename__ = "categories"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    
    menu_items: List["MenuItem"] = Relationship(back_populates="category")


class MenuItem(SQLModel, table=True):
    __tablename__ = "menu_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    description: str
    price: float
    image_url: Optional[str] = None
    category_id: UUID = Field(foreign_key="categories.id")
    
    category: Category = Relationship(back_populates="menu_items")
    order_items: List["OrderItem"] = Relationship(back_populates="menu_item")


class OrderItem(SQLModel, table=True):
    __tablename__ = "order_items"
    
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    reservation_id: UUID = Field(foreign_key="reservations.id")
    menu_item_id: UUID = Field(foreign_key="menu_items.id")
    quantity: int
    
    reservation: Reservation = Relationship(back_populates="ordered_items")
    menu_item: MenuItem = Relationship(back_populates="order_items") 