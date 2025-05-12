import os
import sys
from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import database
from db.database import create_db_and_tables
from db.models import User

# Import routers - use relative imports
from auth.services import get_current_user
from layout.routes import router as layout_router
from reservations.routes import router as reservations_router
from menu.routes import router as menu_router
from uploads.routes import router as uploads_router

# Create a router for auth since we don't have routes.py
from fastapi import APIRouter, Depends, HTTPException
from schemas.user import UserRegister, UserLogin, Token, UserRead
from sqlmodel import Session, select
from db.database import get_session
from auth.services import register_user, login_user
from utils.security import get_current_user, oauth2_scheme

from db.init_table_types import init_table_types

auth_router = APIRouter()

@auth_router.post("/register", response_model=Token)
def register(user_data: UserRegister, session: Session = Depends(get_session)):
    return register_user(user_data, session)

@auth_router.post("/login", response_model=Token)
def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login and get access token (JSON body)."""
    return login_user(user_data, session)

@auth_router.post("/login/oauth", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """
    OAuth2 compatible token login, get an access token for future requests.
    
    This endpoint is used by the Swagger UI for authentication.
    - Use your email as the username
    - Paste the token from the response into the Authorize button (with Bearer prefix)
    """
    user_data = UserLogin(email=form_data.username, password=form_data.password)
    return login_user(user_data, session)

@auth_router.get("/me", response_model=UserRead)
async def get_me(token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)):
    """Get the current logged in user."""
    try:
        user = await get_current_user(token, session)
        return user
    except Exception as e:
        print(f"Error in /auth/me endpoint: {e}")
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

app = FastAPI(
    title="Restaurant Reservation API",
    description="API for restaurant table booking and management",
    version="1.0.0",
    openapi_tags=[
        {"name": "Authentication", "description": "Authentication operations"},
        {"name": "Layout", "description": "Layout management operations"},
        {"name": "Reservations", "description": "Reservation operations"},
        {"name": "Menu", "description": "Menu management operations"},
        {"name": "Uploads", "description": "File upload operations"}
    ],
    swagger_ui_parameters={"persistAuthorization": True}
)

# Configure CORS - Fix to allow any origin temporarily
allowed_origins = ["http://localhost:3000", "http://frontend:3000", "http://0.0.0.0:3000", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(layout_router, prefix="/layout", tags=["Layout"])
app.include_router(reservations_router, prefix="/reserve", tags=["Reservations"])
app.include_router(menu_router, prefix="/menu", tags=["Menu"])
app.include_router(uploads_router, prefix="/uploads", tags=["Uploads"])

# Mount the uploads directory as a static files location
app.mount("/uploads", StaticFiles(directory=os.path.join("frontend", "public", "uploads")), name="uploads")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to Restaurant Reservation API"}

# Initialize the database at startup
@app.on_event("startup")
def on_startup():
    logger.info("Initializing database...")
    create_db_and_tables()
    init_table_types()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 