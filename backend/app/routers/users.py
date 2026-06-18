from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_data: schemas.UserUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    current_user.name = profile_data.name
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Verify current password
    if not auth.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    # Hash new password and save
    current_user.password_hash = auth.get_password_hash(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
