from uuid import UUID
from sqlmodel import Session, select
from fastapi import HTTPException, status
from db.models import Category, MenuItem, OrderItem, Reservation
from schemas.menu import CategoryCreate, MenuItemCreate, OrderItemCreate


def get_menu(session: Session):
    """
    Get the complete menu with categories and items
    """
    categories = session.exec(select(Category)).all()
    items = session.exec(select(MenuItem)).all()
    
    return {"categories": categories, "items": items}


def create_category(category_data: CategoryCreate, session: Session):
    """
    Create a new menu category
    """
    new_category = Category(name=category_data.name)
    
    session.add(new_category)
    session.commit()
    session.refresh(new_category)
    
    return new_category


def update_category(category_id: UUID, category_data: CategoryCreate, session: Session):
    """
    Update an existing menu category
    """
    category = session.exec(select(Category).where(Category.id == category_id)).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    category.name = category_data.name
    
    session.add(category)
    session.commit()
    session.refresh(category)
    
    return category


def delete_category(category_id: UUID, session: Session):
    """
    Delete a menu category
    """
    category = session.exec(select(Category).where(Category.id == category_id)).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check if category has menu items
    items = session.exec(select(MenuItem).where(MenuItem.category_id == category_id)).all()
    
    if items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with menu items"
        )
    
    session.delete(category)
    session.commit()
    
    return {"message": "Category deleted successfully"}


def create_menu_item(item_data: MenuItemCreate, session: Session):
    """
    Create a new menu item
    """
    # Check if category exists
    category = session.exec(select(Category).where(Category.id == item_data.category_id)).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    new_item = MenuItem(
        name=item_data.name,
        description=item_data.description,
        price=item_data.price,
        category_id=item_data.category_id,
        image_url=item_data.image_url
    )
    
    session.add(new_item)
    session.commit()
    session.refresh(new_item)
    
    return new_item


def update_menu_item(item_id: UUID, item_data: MenuItemCreate, session: Session):
    """
    Update an existing menu item
    """
    item = session.exec(select(MenuItem).where(MenuItem.id == item_id)).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Check if category exists
    category = session.exec(select(Category).where(Category.id == item_data.category_id)).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    item.name = item_data.name
    item.description = item_data.description
    item.price = item_data.price
    item.category_id = item_data.category_id
    item.image_url = item_data.image_url
    
    session.add(item)
    session.commit()
    session.refresh(item)
    
    return item


def delete_menu_item(item_id: UUID, session: Session):
    """
    Delete a menu item
    """
    item = session.exec(select(MenuItem).where(MenuItem.id == item_id)).first()
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Check if menu item is used in any order
    orders = session.exec(select(OrderItem).where(OrderItem.menu_item_id == item_id)).first()
    
    if orders:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete menu item that is used in orders"
        )
    
    session.delete(item)
    session.commit()
    
    return {"message": "Menu item deleted successfully"}


def add_order_item(reservation_id: UUID, order_item_data: OrderItemCreate, session: Session):
    """
    Add an item to a reservation order
    """
    # Check if reservation exists
    reservation = session.exec(select(Reservation).where(Reservation.id == reservation_id)).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    # Check if menu item exists
    menu_item = session.exec(select(MenuItem).where(MenuItem.id == order_item_data.menu_item_id)).first()
    
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found"
        )
    
    # Create order item
    new_order_item = OrderItem(
        reservation_id=reservation_id,
        menu_item_id=order_item_data.menu_item_id,
        quantity=order_item_data.quantity
    )
    
    session.add(new_order_item)
    session.commit()
    session.refresh(new_order_item)
    
    return new_order_item


def get_order_statistics(session: Session):
    """
    Get statistics for menu orders
    """
    # Get all order items
    order_items = session.exec(select(OrderItem)).all()
    
    # Calculate total orders (unique reservations with orders)
    unique_reservations = set(item.reservation_id for item in order_items)
    total_orders = len(unique_reservations)
    
    # Get menu items and categories for reference
    menu_items = session.exec(select(MenuItem)).all()
    item_map = {item.id: item for item in menu_items}
    
    # Get categories
    categories = session.exec(select(Category)).all()
    category_map = {cat.id: cat.name for cat in categories}
    
    # Count items sold
    items_sold = {}
    items_by_category = {}
    total_revenue = 0
    
    for order_item in order_items:
        menu_item = item_map.get(order_item.menu_item_id)
        if not menu_item:
            continue
            
        # Count by item name
        if menu_item.name not in items_sold:
            items_sold[menu_item.name] = 0
        items_sold[menu_item.name] += order_item.quantity
        
        # Count by category
        category_name = category_map.get(menu_item.category_id, "Без категории")
        if category_name not in items_by_category:
            items_by_category[category_name] = 0
        items_by_category[category_name] += order_item.quantity
        
        # Calculate revenue
        total_revenue += menu_item.price * order_item.quantity
    
    return {
        "total_orders": total_orders,
        "items_sold": items_sold,
        "items_by_category": items_by_category,
        "total_revenue": total_revenue
    } 