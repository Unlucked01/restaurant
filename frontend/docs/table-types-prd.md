# Product Requirements Document: Table Type and ID Association

## Overview
Currently, there is a disconnect between table types in the layout editor and the table IDs used for reservations. This document outlines the requirements for modifying the backend to maintain a consistent relationship between table types, their visual representation, and their IDs.

## Current Implementation
The backend currently returns table data in the following format:
```json
{
  "tables": [
    {
      "type": "circular",
      "max_guests": 2,
      "x": 545,
      "y": 25,
      "rotation": 0,
      "id": "some-uuid"
    },
    {
      "type": "vip",
      "max_guests": 8,
      "x": 20,
      "y": 430,
      "rotation": 0,
      "id": "60e95cda-78fa-463e-b417-dbb376903621"
    }
  ]
}
```

When saving a layout, tables have types and IDs, but these IDs are not consistently mapped to types when retrieving reservations or when displaying table names in the UI.

## Requirements

### 1. Table Type Registration
The backend should maintain a registry of table types with their visual characteristics:

- Create a `table_types` table with:
  - `id` (PK)
  - `name` (e.g., "circular", "rectangular", "vip")
  - `display_name` (e.g., "Круглый столик", "Прямоугольный столик", "VIP-столик")
  - `default_width`
  - `default_height`
  - `default_max_guests`
  - `color_code` (for frontend styling)
  - `created_at`, `updated_at`

### 2. Table ID Persistence
- When a table is created in the layout editor, it should receive a permanent UUID that:
  - Persists across layout edits
  - Is used consistently in reservations
  - Has a stable relationship with its type

### 3. Table Naming Convention
- Implement a naming convention for tables based on their type and location:
  - E.g., "VIP-столик №1", "Столик у окна №2"

### 4. API Modifications

#### 4.1 GET `/api/layout` Response
Enhance the layout endpoint to include display names:
```json
{
  "tables": [
    {
      "id": "table-1",
      "type": "circular",
      "type_id": 1,
      "display_name": "Столик у окна №1",
      "max_guests": 2,
      "x": 545,
      "y": 25,
      "rotation": 0,
      "width": 60,
      "height": 60
    }
  ]
}
```

#### 4.2 POST `/api/layout/save` Endpoint
Modify the save endpoint to maintain existing table IDs:
- Existing tables should keep their IDs
- New tables should receive permanent IDs
- Deleted tables should be marked as inactive, not removed

#### 4.3 GET `/api/reservations` Response
Enhance reservation endpoints to include table type information:
```json
{
  "id": "reservation-uuid",
  "table_id": "table-1",
  "table_type": "circular",
  "table_display_name": "Столик у окна №1",
  "reservation_date": "2023-05-10",
  "reservation_time": "19:00",
  "guests_count": 2,
  "status": "confirmed"
}
```

### 5. Table Assignment Features
- Add an admin interface to assign human-readable names to tables
- Allow linking tables to zones (e.g., "у окна", "в центре", "у бара")
- Enable automatic naming based on table type and zone

## Implementation Timeline
1. Database schema updates (Days 1-2)
2. Backend API modifications (Days 3-5)
3. Admin interface for table management (Days 6-8)
4. Integration testing with frontend (Days 9-10)

## Success Metrics
- Table IDs remain consistent across layout edits
- Table types are correctly represented in the UI
- All reservations correctly display table names
- Admins can easily manage table names and assignments

## Technical Considerations
- Migration plan for existing tables and reservations
- Backward compatibility for existing API consumers
- Error handling for table reassignment
- Performance impact of additional table metadata queries 