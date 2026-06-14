from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CitaBase(BaseModel):
    paciente_id: int
    medico_id: int | None = None
    disponibilidad_id: int | None = None
    fecha_cita: datetime
    motivo_consulta: str | None = None
    observaciones: str | None = None


class CitaCreate(CitaBase):
    pass


class CitaUpdate(BaseModel):
    medico_id: int | None = None
    disponibilidad_id: int | None = None
    fecha_cita: datetime | None = None
    estado: str | None = None
    motivo_consulta: str | None = None
    observaciones: str | None = None


class CitaRead(CitaBase):
    id: int
    estado: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
