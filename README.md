# Restaurant Reservation System

A web application for restaurant table booking and management.

## Features

- Visual table selection and booking
- Admin panel for restaurant layout management
- User authentication and role-based access
- Menu management

## Technology Stack

- **Frontend**: Next.js (React), TailwindCSS, DND-kit
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT

## Setup and Running

### Environment Variables

Before running the application, create a `.env` file in the root directory with the following variables:

```
# Database credentials
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=restaurant

# Backend settings
DATABASE_URL=postgresql://postgres:postgres@db:5432/restaurant
SECRET_KEY=your_secret_key_here_change_it_in_production
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:3000

# Frontend settings
NEXT_PUBLIC_API_URL=http://localhost:8000

# Admin user (optional, defaults will be used if not provided)
ADMIN_EMAIL=admin@restaurant.com
ADMIN_PASSWORD=adminpassword
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

### Using Docker Compose

1. Make sure you have Docker and Docker Compose installed.
2. Create the `.env` file as described above.
3. Run the application:

```bash
docker-compose up -d
```

4. The application should be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Manual Setup

#### Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create an admin user:
```bash
# Either create a default admin
python create_default_admin.py

# Or create a custom admin (interactive)
python create_admin.py
```

5. Run the server:
```bash
uvicorn main:app --reload
```

#### Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Default Admin User

When running with Docker, a default admin user is automatically created if none exists:
- Email: admin@restaurant.com
- Password: adminpassword

**Important**: For security reasons, change the default admin password immediately after first login. 