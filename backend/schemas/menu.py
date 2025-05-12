from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str


class CategoryCreate(CategoryBase):
    pass


class CategoryRead(CategoryBase):
    id: UUID

    class Config:
        orm_mode = True


class MenuItemBase(BaseModel):
    name: str
    description: str
    price: float
    image_url: Optional[str] = None


class MenuItemCreate(MenuItemBase):
    category_id: UUID


class MenuItemRead(MenuItemBase):
    id: UUID
    category_id: UUID

    class Config:
        orm_mode = True


class MenuItemWithCategory(MenuItemRead):
    category: CategoryRead


class Menu(BaseModel):
    categories: List[CategoryRead]
    items: List[MenuItemRead]

    class Config:
        orm_mode = True


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = 1


class OrderItemRead(BaseModel):
    id: UUID
    menu_item_id: UUID
    reservation_id: UUID
    quantity: int
    menu_item: Optional[MenuItemRead] = None

    class Config:
        orm_mode = True


class OrderStats(BaseModel):
    total_orders: int
    items_sold: Dict[str, int]
    items_by_category: Dict[str, int]
    total_revenue: float 