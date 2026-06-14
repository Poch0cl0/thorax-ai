from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permisos import ADMIN_ROLE, DOCTOR_ROLE
from app.dependencies import require_roles
from app.models.dato_clinico import DatoClinico
from app.schemas.dato_clinico import DatoClinicoCreate, DatoClinicoRead, DatoClinicoUpdate

router = APIRouter(prefix="/datos-clinicos", tags=["datos-clinicos"])


@router.get("", response_model=list[DatoClinicoRead], dependencies=[Depends(require_roles(ADMIN_ROLE, DOCTOR_ROLE))])
async def list_clinical_data(
    paciente_id: int | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[DatoClinico]:
    query = select(DatoClinico)
    if paciente_id is not None:
        query = query.where(DatoClinico.paciente_id == paciente_id)
    result = await db.execute(query.order_by(DatoClinico.id.desc()))
    return list(result.scalars().all())


@router.post("", response_model=DatoClinicoRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles(ADMIN_ROLE, DOCTOR_ROLE))])
async def create_clinical_data(payload: DatoClinicoCreate, db: AsyncSession = Depends(get_db)) -> DatoClinico:
    item = DatoClinico(**payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{clinical_data_id}", response_model=DatoClinicoRead, dependencies=[Depends(require_roles(ADMIN_ROLE, DOCTOR_ROLE))])
async def get_clinical_data(clinical_data_id: int, db: AsyncSession = Depends(get_db)) -> DatoClinico:
    item = await db.get(DatoClinico, clinical_data_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinical data not found")
    return item


@router.patch("/{clinical_data_id}", response_model=DatoClinicoRead, dependencies=[Depends(require_roles(ADMIN_ROLE, DOCTOR_ROLE))])
async def update_clinical_data(clinical_data_id: int, payload: DatoClinicoUpdate, db: AsyncSession = Depends(get_db)) -> DatoClinico:
    item = await db.get(DatoClinico, clinical_data_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Clinical data not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await db.commit()
    await db.refresh(item)
    return item
