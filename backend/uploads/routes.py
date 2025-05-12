import os
import shutil
from uuid import uuid4
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from utils.security import get_current_user
from db.models import User

router = APIRouter()

# Define uploads directory
UPLOADS_DIR = os.path.join("frontend", "public", "uploads")

# Create directory if not exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Base URL for absolute image paths
BASE_URL = "http://localhost:8000"

@router.post("/images")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload an image file.
    Returns the URL to access the image.
    """
    # Check if the file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )
        
    # Generate unique filename
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid4()}.{file_extension}"
    
    # Save the file
    file_path = os.path.join(UPLOADS_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )
    finally:
        await file.close()
    
    # Return the absolute URL to access the image
    return JSONResponse({
        "url": f"{BASE_URL}/uploads/{unique_filename}", 
        "filename": unique_filename
    }) 