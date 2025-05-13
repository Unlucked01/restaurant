from datetime import date, time, datetime, timedelta
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlmodel import Session, func, select
from db.database import get_session
from utils.security import get_current_user, get_current_admin
from db.models import User, Reservation, Table, OrderItem, TableType
from schemas.reservation import (
    ReservationCreate, ReservationRead, ReservationEnhanced,
    TableAvailability, AvailabilityQuery, ReservationStats,
    ReservationStatusUpdate
)
from .services import (
    get_available_tables, create_reservation, get_reservations_by_date, 
    get_reservation_statistics, get_user_reservations,
    get_reservation_by_id, update_reservation, update_reservation_status
)

router = APIRouter()


@router.post("/", response_model=ReservationRead)
def create_new_reservation(
    reservation: ReservationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new reservation for the current user"""
    return create_reservation(reservation, current_user.id, session)


@router.get("/availability", response_model=List[TableAvailability])
def check_tables_availability(
    date: str = Query(..., description="Date to check availability for (YYYY-MM-DD)"),
    time: Optional[str] = Query(None, description="Optional time to filter availability (HH:MM)"),
    session: Session = Depends(get_session)
):
    """Check table availability for a specific date and optionally time"""
    try:
        # Parse date string to date object
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        
        # Parse time string to time object if provided
        parsed_time = None
        if time:
            parsed_time = datetime.strptime(time, "%H:%M").time()
            
        return get_available_tables(parsed_date, parsed_time, session)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты или времени. Используйте ГГГГ-ММ-ДД для даты и ЧЧ:ММ для времени."
        )


@router.get("/", response_model=List[ReservationEnhanced])
def get_reservations(
    date: str = Query(..., description="Date to get reservations for (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Get all reservations for a specific date (admin only)"""
    try:
        # Parse date string to date object
        parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
        reservations = get_reservations_by_date(parsed_date, session)
        
        # Prepare enhanced response with table info
        enhanced_reservations = []
        for reservation in reservations:
            # Get the table information
            table = session.get(Table, reservation.table_id)
            if table:
                # Create a copy of the reservation to avoid modifying the ORM object
                reservation_dict = {
                    "id": str(reservation.id),
                    "user_id": str(reservation.user_id),
                    "table_id": str(reservation.table_id),
                    "reservation_date": reservation.reservation_date,
                    "reservation_time": reservation.reservation_time,
                    "guests_count": reservation.guests_count,
                    "first_name": reservation.first_name,
                    "last_name": reservation.last_name,
                    "phone": reservation.phone,
                    "status": reservation.status,
                    "table": {
                        "id": str(table.id),
                        "type_id": table.type_id,
                        "table_number": table.table_number,
                        "width": table.width,
                        "height": table.height
                    }
                }
                
                # Add table type info if available
                if table.type_id:
                    table_type = session.get(TableType, table.type_id)
                    if table_type:
                        reservation_dict["table"]["table_type"] = {
                            "id": table_type.id,
                            "name": table_type.name,
                            "display_name": table_type.display_name,
                            "default_width": table_type.default_width,
                            "default_height": table_type.default_height,
                            "default_max_guests": table_type.default_max_guests,
                            "color_code": table_type.color_code
                        }
                
                enhanced_reservations.append(reservation_dict)
        
        return enhanced_reservations
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте ГГГГ-ММ-ДД для даты."
        )


@router.get("/enhanced", response_model=List[ReservationEnhanced])
def get_enhanced_reservations(
    query_date: str = Query(..., description="Date to get reservations for (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Get all reservations with enhanced table info for a specific date (admin only)"""
    try:
        # Parse date string to date object
        parsed_date = datetime.strptime(query_date, "%Y-%m-%d").date()
        reservations = get_reservations_by_date(parsed_date, session)
        
        # Load related table info for each reservation
        for reservation in reservations:
            table = session.get(Table, reservation.table_id)
            if table:
                reservation.table = table
        
        return reservations
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат даты. Используйте ГГГГ-ММ-ДД для даты."
        )


@router.get("/my", response_model=List[ReservationEnhanced])
def get_my_reservations(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get all reservations for the current user with table info"""
    return get_user_reservations(current_user.id, session)


@router.get("/stats", response_model=ReservationStats)
def get_stats(
    period: str = Query("week", description="Statistics period (week, month, year)"),
    current_user: User = Depends(get_current_admin),
    session: Session = Depends(get_session)
):
    """Get reservation statistics (admin only)"""
    return get_reservation_statistics(period, session)


@router.get("/{reservation_id}", response_model=ReservationEnhanced)
def get_reservation_details(
    reservation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get a specific reservation details with table info"""
    reservation = get_reservation_by_id(reservation_id, session)
    
    # Check if the user is authorized to view this reservation
    if current_user.role != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для просмотра этого бронирования"
        )
    
    return reservation


@router.put("/{reservation_id}", response_model=ReservationEnhanced)
def update_reservation_details(
    reservation_id: UUID,
    updated_data: ReservationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a specific reservation"""
    # First get the existing reservation
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Check if the user is authorized to update this reservation
    if current_user.role != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для изменения этого бронирования"
        )
    
    # Update the reservation
    updated = update_reservation(reservation_id, updated_data, session)
    
    # Load the table for enhanced details
    table = session.get(Table, updated.table_id)
    if table:
        updated.table = table
    
    return updated


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    reservation_id: UUID,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete/cancel a specific reservation"""
    # First get the existing reservation
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Check if the user is authorized to delete this reservation
    if current_user.role != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы не можете отменить это бронирование"
        )
    
    # Delete the reservation
    session.delete(reservation)
    session.commit()
    
    return None


@router.patch("/{reservation_id}/status", response_model=ReservationEnhanced)
def update_status(
    reservation_id: UUID,
    status_data: ReservationStatusUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update just the status of a reservation"""
    # First get the existing reservation
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Check if the user is authorized to update this reservation
    if current_user.role != "admin" and reservation.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="У вас нет прав для изменения этого бронирования"
        )
    
    # Update the reservation status
    return update_reservation_status(reservation_id, status_data.status, session) 