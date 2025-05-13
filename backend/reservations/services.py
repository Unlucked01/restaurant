from datetime import date, time, datetime, timedelta
from typing import List
from uuid import UUID
from sqlmodel import Session, select, and_, or_
from fastapi import HTTPException, status
from db.models import Reservation, Table, TableType
from schemas.reservation import ReservationCreate, TableAvailability

# Reservation time slots from 12:00 to 23:00
OPENING_HOUR = 12
CLOSING_HOUR = 23
TIME_SLOTS = [time(hour=h) for h in range(OPENING_HOUR, CLOSING_HOUR + 1)]

# Maximum days in advance for booking
MAX_DAYS_ADVANCE = 14

# Banquet hall table type ID
BANQUET_HALL_TYPE_ID = 5


def get_available_tables(query_date: date, query_time: time = None, session: Session = None):
    # Validate date is within allowed range
    today = date.today()
    max_date = today + timedelta(days=MAX_DAYS_ADVANCE)
    
    if query_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя бронировать на прошедшую дату"
        )
    
    if query_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Бронирование возможно только до {max_date}"
        )
    
    # Get all active tables
    tables = session.exec(select(Table).where(Table.is_active == True)).all()
    
    # For each table, check availability
    availability = []
    
    for table in tables:
        # Special handling for banquet hall tables
        is_banquet_hall = table.type_id == BANQUET_HALL_TYPE_ID
        
        if query_time:
            # For banquet halls, check if any reservation exists on that day
            if is_banquet_hall:
                existing_reservation = session.exec(
                    select(Reservation).where(
                        and_(
                            Reservation.table_id == table.id,
                            Reservation.reservation_date == query_date
                        )
                    )
                ).first()
            else:
                # Regular tables: check specific time availability
                existing_reservation = session.exec(
                    select(Reservation).where(
                        and_(
                            Reservation.table_id == table.id,
                            Reservation.reservation_date == query_date,
                            Reservation.reservation_time == query_time
                        )
                    )
                ).first()
            
            availability.append(
                TableAvailability(
                    table_id=table.id,
                    type_id=table.type_id,
                    table_number=table.table_number,
                    available=existing_reservation is None
                )
            )
        else:
            # For all time slots
            if is_banquet_hall:
                # For banquet halls, if any reservation exists on that day,
                # no time slots are available
                existing_reservation = session.exec(
                    select(Reservation).where(
                        and_(
                            Reservation.table_id == table.id,
                            Reservation.reservation_date == query_date
                        )
                    )
                ).first()
                
                if existing_reservation:
                    # Banquet hall is already booked for this day
                    availability.append(
                        TableAvailability(
                            table_id=table.id,
                            type_id=table.type_id,
                            table_number=table.table_number,
                            available=False,
                            available_times=[]
                        )
                    )
                else:
                    # Banquet hall is free for the whole day
                    available_times = TIME_SLOTS
                    
                    # For same-day reservations, filter out time slots up to and including current hour
                    if query_date == today:
                        now = datetime.now()
                        current_hour = now.hour
                        available_times = [t for t in available_times if t.hour > current_hour]
                    
                    availability.append(
                        TableAvailability(
                            table_id=table.id,
                            type_id=table.type_id,
                            table_number=table.table_number,
                            available=len(available_times) > 0,
                            available_times=available_times
                        )
                    )
            else:
                # For regular tables, check each time slot
                existing_reservations = session.exec(
                    select(Reservation).where(
                        and_(
                            Reservation.table_id == table.id,
                            Reservation.reservation_date == query_date
                        )
                    )
                ).all()
                
                reserved_times = {r.reservation_time for r in existing_reservations}
                available_times = [t for t in TIME_SLOTS if t not in reserved_times]
                
                # For same-day reservations, filter out time slots up to and including current hour
                if query_date == today:
                    now = datetime.now()
                    current_hour = now.hour
                    available_times = [t for t in available_times if t.hour > current_hour]
                
                availability.append(
                    TableAvailability(
                        table_id=table.id,
                        type_id=table.type_id,
                        table_number=table.table_number,
                        available=len(available_times) > 0,
                        available_times=available_times
                    )
                )
    
    return availability


def create_reservation(reservation_data: ReservationCreate, user_id: UUID, session: Session):
    # Validate date
    today = date.today()
    max_date = today + timedelta(days=MAX_DAYS_ADVANCE)
    
    if reservation_data.reservation_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя бронировать на прошедшую дату"
        )
    
    if reservation_data.reservation_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Бронирование возможно только до {max_date}"
        )
    
    # For same-day reservations, check if time is after the current hour
    if reservation_data.reservation_date == today:
        now = datetime.now()
        current_hour = now.hour
        
        if reservation_data.reservation_time.hour <= current_hour:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Бронирование возможно только на время позже текущего часа"
            )
    
    # Check if table exists and is active
    table = session.exec(
        select(Table).where(
            and_(
                Table.id == reservation_data.table_id,
                Table.is_active == True
            )
        )
    ).first()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Столик не найден или неактивен"
        )
    
    # Check if table has enough capacity
    if reservation_data.guests_count > table.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Столик вмещает максимум {table.max_guests} гостей"
        )
    
    # Check minimum guests requirement (at least half of maximum capacity)
    min_required_guests = table.max_guests // 2
    if reservation_data.guests_count < min_required_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Минимальное количество гостей для этого столика - {min_required_guests}"
        )
    
    # Check table availability based on table type
    is_banquet_hall = table.type_id == BANQUET_HALL_TYPE_ID
    
    if is_banquet_hall:
        # For banquet halls, check if ANY reservation exists for the entire day
        existing_reservation = session.exec(
            select(Reservation).where(
                and_(
                    Reservation.table_id == reservation_data.table_id,
                    Reservation.reservation_date == reservation_data.reservation_date
                )
            )
        ).first()
        
        if existing_reservation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Банкетный зал уже забронирован на эту дату"
            )
    else:
        # For regular tables, check specific time slot availability
        existing_reservation = session.exec(
            select(Reservation).where(
                and_(
                    Reservation.table_id == reservation_data.table_id,
                    Reservation.reservation_date == reservation_data.reservation_date,
                    Reservation.reservation_time == reservation_data.reservation_time
                )
            )
        ).first()
        
        if existing_reservation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Столик уже занят в это время"
            )
    
    # Create reservation
    new_reservation = Reservation(
        user_id=user_id,
        table_id=reservation_data.table_id,
        reservation_date=reservation_data.reservation_date,
        reservation_time=reservation_data.reservation_time,
        guests_count=reservation_data.guests_count,
        first_name=reservation_data.first_name,
        last_name=reservation_data.last_name,
        phone=reservation_data.phone
    )
    
    session.add(new_reservation)
    session.commit()
    session.refresh(new_reservation)
    
    return new_reservation


def get_reservations_by_date(query_date: date, session: Session):
    reservations = session.exec(
        select(Reservation).where(Reservation.reservation_date == query_date)
    ).all()
    
    return reservations


def get_reservation_statistics(period: str, session: Session):
    """
    Get reservation statistics for a given period
    """
    today = date.today()
    if period == "week":
        start_date = today - timedelta(days=7)
    elif period == "month":
        start_date = today - timedelta(days=30)
    elif period == "year":
        start_date = today - timedelta(days=365)
    else:
        start_date = today - timedelta(days=7)  # Default to week
    
    # Get all reservations in the period
    reservations = session.exec(
        select(Reservation).where(Reservation.reservation_date >= start_date)
    ).all()
    
    # Total reservations
    total_reservations = len(reservations)
    
    # Reservations by date
    reservations_by_date = {}
    for res in reservations:
        date_str = res.reservation_date.isoformat()
        if date_str in reservations_by_date:
            reservations_by_date[date_str] += 1
        else:
            reservations_by_date[date_str] = 1
    
    # Reservations by table
    reservations_by_table = {}
    tables = session.exec(select(Table).where(Table.is_active == True)).all()
    
    # Create a table map with display names if available
    table_map = {}
    for table in tables:
        table_id = str(table.id)
        if hasattr(table, 'display_name') and table.display_name:
            table_map[table_id] = table.display_name
        elif table.type_id:
            # Try to get the type display name
            table_type = session.get(TableType, table.type_id)
            if table_type:
                table_map[table_id] = f"{table_type.display_name} №{table.table_number}"
            else:
                table_map[table_id] = f"Столик №{table.table_number}"
        else:
            table_map[table_id] = f"Столик №{table.table_number}"
    
    for res in reservations:
        table_id = str(res.table_id)
        table_name = table_map.get(table_id, table_id)
        if table_name in reservations_by_table:
            reservations_by_table[table_name] += 1
        else:
            reservations_by_table[table_name] = 1
    
    # Average guests per reservation
    total_guests = sum(r.guests_count for r in reservations)
    average_guests = total_guests / total_reservations if total_reservations > 0 else 0
    
    return {
        "total_reservations": total_reservations,
        "reservations_by_date": reservations_by_date,
        "reservations_by_table": reservations_by_table,
        "average_guests": round(average_guests, 1)
    }


def get_user_reservations(user_id: UUID, session: Session):
    """
    Get all reservations for a specific user
    """
    reservations = session.exec(
        select(Reservation).where(Reservation.user_id == user_id)
    ).all()
    
    # Prepare enhanced reservations with table data
    enhanced_reservations = []
    for reservation in reservations:
        # Create a reservation dict
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
            "status": reservation.status
        }
        
        # Load the table
        table = session.get(Table, reservation.table_id)
        if table:
            table_dict = {
                "id": str(table.id),
                "type_id": table.type_id,
                "table_number": table.table_number,
                "width": table.width,
                "height": table.height
            }
            
            # Load the table type if available
            if table.type_id:
                table_type = session.get(TableType, table.type_id)
                if table_type:
                    table_dict["table_type"] = {
                        "id": table_type.id,
                        "name": table_type.name,
                        "display_name": table_type.display_name,
                        "default_width": table_type.default_width,
                        "default_height": table_type.default_height,
                        "default_max_guests": table_type.default_max_guests,
                        "color_code": table_type.color_code
                    }
            
            reservation_dict["table"] = table_dict
        
        enhanced_reservations.append(reservation_dict)
    
    return enhanced_reservations


def get_reservation_by_id(reservation_id: UUID, session: Session):
    """
    Get a specific reservation by ID
    """
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Create a reservation dictionary
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
        "status": reservation.status
    }
    
    # Load the table
    table = session.get(Table, reservation.table_id)
    if table:
        table_dict = {
            "id": str(table.id),
            "type_id": table.type_id,
            "table_number": table.table_number,
            "width": table.width,
            "height": table.height
        }
        
        # Load the table type if available
        if table.type_id:
            table_type = session.get(TableType, table.type_id)
            if table_type:
                table_dict["table_type"] = {
                    "id": table_type.id,
                    "name": table_type.name,
                    "display_name": table_type.display_name,
                    "default_width": table_type.default_width,
                    "default_height": table_type.default_height,
                    "default_max_guests": table_type.default_max_guests,
                    "color_code": table_type.color_code
                }
        
        reservation_dict["table"] = table_dict
    
    return reservation_dict


def update_reservation(reservation_id: UUID, updated_data: ReservationCreate, session: Session):
    """
    Update an existing reservation
    """
    # First, check if the reservation exists
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )

    # Validate date
    today = date.today()
    max_date = today + timedelta(days=MAX_DAYS_ADVANCE)
    
    if updated_data.reservation_date < today:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя бронировать на прошедшую дату"
        )
    
    if updated_data.reservation_date > max_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Бронирование возможно только до {max_date}"
        )
    
    # For same-day reservations, check if time is after the current hour
    if updated_data.reservation_date == today:
        now = datetime.now()
        current_hour = now.hour
        
        if updated_data.reservation_time.hour <= current_hour:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Бронирование возможно только на время позже текущего часа"
            )
    
    # Check if the new table exists and is active
    table = session.exec(
        select(Table).where(
            and_(
                Table.id == updated_data.table_id,
                Table.is_active == True
            )
        )
    ).first()
    
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Столик не найден или неактивен"
        )
    
    # Check if table has enough capacity
    if updated_data.guests_count > table.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Столик вмещает максимум {table.max_guests} гостей"
        )
    
    # Check minimum guests requirement (at least half of maximum capacity)
    min_required_guests = table.max_guests // 2
    if updated_data.guests_count < min_required_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Минимальное количество гостей для этого столика - {min_required_guests}"
        )
    
    # Check availability based on table type
    is_banquet_hall = table.type_id == BANQUET_HALL_TYPE_ID
    
    if is_banquet_hall:
        # For banquet halls, check if any other reservation exists for that day
        existing_reservation = session.exec(
            select(Reservation).where(
                and_(
                    Reservation.table_id == updated_data.table_id,
                    Reservation.reservation_date == updated_data.reservation_date,
                    Reservation.id != reservation_id
                )
            )
        ).first()
        
        if existing_reservation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Банкетный зал уже забронирован на эту дату"
            )
    else:
        # For regular tables, check specific time slot availability
        existing_reservation = session.exec(
            select(Reservation).where(
                and_(
                    Reservation.table_id == updated_data.table_id,
                    Reservation.reservation_date == updated_data.reservation_date,
                    Reservation.reservation_time == updated_data.reservation_time,
                    Reservation.id != reservation_id
                )
            )
        ).first()
        
        if existing_reservation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Столик уже занят в это время"
            )
    
    # Update the reservation
    reservation.table_id = updated_data.table_id
    reservation.reservation_date = updated_data.reservation_date
    reservation.reservation_time = updated_data.reservation_time
    reservation.guests_count = updated_data.guests_count
    reservation.first_name = updated_data.first_name
    reservation.last_name = updated_data.last_name
    reservation.phone = updated_data.phone
    
    session.add(reservation)
    session.commit()
    session.refresh(reservation)
    
    # Create a dictionary representation of the updated reservation with table information
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
        "status": reservation.status
    }
    
    # Add table information to the response
    updated_table = session.get(Table, reservation.table_id)
    if updated_table:
        table_dict = {
            "id": str(updated_table.id),
            "type_id": updated_table.type_id,
            "table_number": updated_table.table_number,
            "width": updated_table.width,
            "height": updated_table.height
        }
        
        # Add table type information if available
        if updated_table.type_id:
            table_type = session.get(TableType, updated_table.type_id)
            if table_type:
                table_dict["table_type"] = {
                    "id": table_type.id,
                    "name": table_type.name,
                    "display_name": table_type.display_name,
                    "default_width": table_type.default_width,
                    "default_height": table_type.default_height,
                    "default_max_guests": table_type.default_max_guests,
                    "color_code": table_type.color_code
                }
        
        reservation_dict["table"] = table_dict
    
    return reservation_dict


def update_reservation_status(reservation_id: UUID, status: str, session: Session):
    """
    Update only the status of an existing reservation
    """
    # First, check if the reservation exists
    reservation = session.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Бронирование не найдено"
        )
    
    # Update just the status
    reservation.status = status
    
    session.add(reservation)
    session.commit()
    session.refresh(reservation)
    
    # Create a dictionary representation of the updated reservation
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
        "status": reservation.status
    }
    
    # Add table information to the response
    table = session.get(Table, reservation.table_id)
    if table:
        table_dict = {
            "id": str(table.id),
            "type_id": table.type_id,
            "table_number": table.table_number,
            "width": table.width,
            "height": table.height
        }
        
        # Add table type information if available
        if table.type_id:
            table_type = session.get(TableType, table.type_id)
            if table_type:
                table_dict["table_type"] = {
                    "id": table_type.id,
                    "name": table_type.name,
                    "display_name": table_type.display_name,
                    "default_width": table_type.default_width,
                    "default_height": table_type.default_height,
                    "default_max_guests": table_type.default_max_guests,
                    "color_code": table_type.color_code
                }
        
        reservation_dict["table"] = table_dict
    
    return reservation_dict 