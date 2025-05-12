from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlmodel import Session
from db.database import get_session
from utils.security import get_current_user, get_current_admin
from db.models import User
from schemas.menu import (
    Menu, CategoryCreate, CategoryRead, 
    MenuItemCreate, MenuItemRead, OrderItemCreate, OrderItemRead,
    OrderStats
)
from .services import (
    get_menu, create_category, update_category, delete_category,
    create_menu_item, update_menu_item, delete_menu_item, add_order_item,
    get_order_statistics
)

router = APIRouter()


@router.get("/", response_model=Menu)
def get_restaurant_menu(
    session: Session = Depends(get_session)
):
    """Get the complete restaurant menu"""
    return get_menu(session)


@router.post("/categories", response_model=CategoryRead)
def create_menu_category(
    category: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Create a new menu category (admin only)"""
    return create_category(category, session)


@router.put("/categories/{category_id}", response_model=CategoryRead)
def update_menu_category(
    category_id: UUID,
    category: CategoryCreate,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Update an existing menu category (admin only)"""
    return update_category(category_id, category, session)


@router.delete("/categories/{category_id}")
def delete_menu_category(
    category_id: UUID,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Delete a menu category (admin only)"""
    return delete_category(category_id, session)


@router.post("/items", response_model=MenuItemRead)
def create_restaurant_menu_item(
    item: MenuItemCreate,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Create a new menu item (admin only)"""
    return create_menu_item(item, session)


@router.put("/items/{item_id}", response_model=MenuItemRead)
def update_restaurant_menu_item(
    item_id: UUID,
    item: MenuItemCreate,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Update an existing menu item (admin only)"""
    return update_menu_item(item_id, item, session)


@router.delete("/items/{item_id}")
def delete_restaurant_menu_item(
    item_id: UUID,
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Delete a menu item (admin only)"""
    return delete_menu_item(item_id, session)


@router.post("/reservations/{reservation_id}/order", response_model=OrderItemRead)
def add_item_to_order(
    reservation_id: UUID,
    order_item: OrderItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Add an item to a reservation order"""
    return add_order_item(reservation_id, order_item, session)


@router.get("/stats", response_model=OrderStats)
def get_menu_stats(
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Get order statistics for menu items (admin only)"""
    return get_order_statistics(session) 