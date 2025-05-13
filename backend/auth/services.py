from datetime import timedelta
from sqlmodel import Session, select
from fastapi import HTTPException, status
from db.models import User
from schemas.user import UserRegister, UserLogin, Token
from utils.security import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES


def register_user(user_data: UserRegister, session: Session):
    # Check if user with this email already exists
    db_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот email уже зарегистрирован"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


def login_user(user_data: UserLogin, session: Session):
    print(f"Login attempt for: {user_data.email}")
    
    # Verify user exists
    db_user = session.exec(select(User).where(User.email == user_data.email)).first()
    
    if not db_user:
        print(f"User not found: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"User found: {db_user.email}, role: {db_user.role}")
    
    # Verify password
    password_valid = verify_password(user_data.password, db_user.password_hash)
    print(f"Password valid: {password_valid}")
    
    if not password_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role},
        expires_delta=access_token_expires
    )
    
    print(f"Login successful for: {db_user.email}")
    return {"access_token": access_token, "token_type": "bearer"}


def get_current_user(user):
    return user 