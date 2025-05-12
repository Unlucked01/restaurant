from datetime import date, time
from typing import List, Optional, Dict
from uuid import UUID
from pydantic import BaseModel


class ReservationBase(BaseModel):
    reservation_date: date
    reservation_time: time
    guests_count: int
    first_name: str
    last_name: str
    phone: str


class ReservationCreate(ReservationBase):
    table_id: UUID


class TableInfo(BaseModel):
    id: UUID
    type_id: int
    table_number: int
    width: Optional[int] = None
    height: Optional[int] = None
    table_type: Optional[dict] = None  # Will store type info like name, display_name, etc.

    class Config:
        orm_mode = True


class ReservationRead(ReservationBase):
    id: UUID
    user_id: UUID
    table_id: UUID

    class Config:
        orm_mode = True


class ReservationEnhanced(ReservationRead):
    table: TableInfo

    class Config:
        orm_mode = True


class AvailabilityQuery(BaseModel):
    query_date: date
    query_time: Optional[time] = None


class TableAvailability(BaseModel):
    table_id: UUID
    type_id: int
    table_number: int
    available: bool
    available_times: Optional[List[time]] = None


class ReservationStats(BaseModel):
    total_reservations: int
    reservations_by_date: Dict[str, int]
    reservations_by_table: Dict[str, int]
    average_guests: float 