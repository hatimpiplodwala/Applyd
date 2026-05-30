import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.deps import get_db
from app.schemas import (
    Application,
    ApplicationCreate,
    ApplicationUpdate,
    DuplicateCheck,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["applications"])

TABLE = "applications"


@router.get("", response_model=list[Application])
def list_applications(
    limit: int = Query(default=500, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
    db=Depends(get_db),
):
    client, user = db
    res = (
        client.table(TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("date_applied", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    return res.data or []


@router.post("", response_model=Application, status_code=status.HTTP_201_CREATED)
def create_application(payload: ApplicationCreate, db=Depends(get_db)):
    client, user = db
    body = payload.model_dump(mode="json")
    body["user_id"] = user.id
    res = client.table(TABLE).insert(body).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create application")
    logger.info("create app=%s user=%s", res.data[0]["id"], user.id)
    return res.data[0]


@router.patch("/{app_id}", response_model=Application)
def update_application(
    app_id: str, payload: ApplicationUpdate, db=Depends(get_db)
):
    client, user = db
    body = payload.model_dump(mode="json", exclude_unset=True)
    if not body:
        raise HTTPException(status_code=400, detail="No fields to update")

    res = (
        client.table(TABLE)
        .update(body)
        .eq("id", app_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    logger.info("update app=%s user=%s fields=%s", app_id, user.id, sorted(body.keys()))
    return res.data[0]


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(app_id: str, db=Depends(get_db)):
    client, user = db
    res = (
        client.table(TABLE)
        .delete()
        .eq("id", app_id)
        .eq("user_id", user.id)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Application not found")
    logger.info("delete app=%s user=%s", app_id, user.id)
    return None


@router.get("/duplicate-check", response_model=DuplicateCheck)
def duplicate_check(
    company: str = Query(min_length=1),
    role: str = Query(min_length=1),
    exclude_id: str | None = Query(default=None),
    db=Depends(get_db),
):
    client, user = db
    # Only existence matters, so fetch at most one row instead of counting all
    # matches (count="exact" makes PostgREST scan/count the full match set).
    query = (
        client.table(TABLE)
        .select("id")
        .eq("user_id", user.id)
        .ilike("company", company)
        .ilike("role", role)
        .limit(1)
    )
    if exclude_id:
        query = query.neq("id", exclude_id)
    res = query.execute()
    return DuplicateCheck(exists=bool(res.data))
