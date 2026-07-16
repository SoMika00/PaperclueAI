"""Institution admin panel: manage teachers/students in your own institution.
No access to their manuscripts, scores, or content — membership management only."""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from sqlalchemy import text

router = APIRouter()

MANAGEABLE_ROLES = {"teacher", "student"}
ASSIGNABLE_ROLES = {"teacher", "student"}


def _require_admin(db, user_id: str) -> dict:
    row = db.execute(
        text("select role, institution_id from profiles where id = :uid"),
        {"uid": user_id},
    ).mappings().first()
    if not row or row["role"] != "institution_admin" or not row["institution_id"]:
        raise HTTPException(403, "Admins only")
    return {"institution_id": row["institution_id"]}


@router.get("/admin/members")
def list_members(db=Depends(get_db), current_user: dict = Depends(get_current_user)):
    ctx = _require_admin(db, current_user["user_id"])
    rows = db.execute(
        text("""
            select id, full_name, email, role
            from profiles
            where institution_id = :iid and role in ('teacher', 'student')
            order by role, full_name
        """),
        {"iid": ctx["institution_id"]},
    ).mappings().all()
    return [dict(r) for r in rows]


class UpdateMemberBody(BaseModel):
    full_name: str | None = None
    role: str | None = None  # teacher | student


@router.patch("/admin/members/{member_id}")
def update_member(member_id: str, body: UpdateMemberBody, db=Depends(get_db),
                   current_user: dict = Depends(get_current_user)):
    ctx = _require_admin(db, current_user["user_id"])

    target = db.execute(
        text("select role, institution_id from profiles where id = :mid"),
        {"mid": member_id},
    ).mappings().first()
    if not target or target["institution_id"] != ctx["institution_id"] or target["role"] not in MANAGEABLE_ROLES:
        raise HTTPException(404, "Member not found in your institution")

    if body.role is not None and body.role not in ASSIGNABLE_ROLES:
        raise HTTPException(400, f"role must be one of {ASSIGNABLE_ROLES}")

    updates, params = [], {"mid": member_id}
    if body.full_name is not None:
        updates.append("full_name = :full_name")
        params["full_name"] = body.full_name
    if body.role is not None:
        updates.append("role = :role")
        params["role"] = body.role
    if not updates:
        raise HTTPException(400, "Nothing to update")

    db.execute(text(f"update profiles set {', '.join(updates)} where id = :mid"), params)
    db.commit()
    return {"updated": member_id}


@router.post("/admin/members/{member_id}/exclude")
def exclude_member(member_id: str, db=Depends(get_db),
                    current_user: dict = Depends(get_current_user)):
    """Removes the person from the institution (role -> individual). Reversible
    only by re-inviting them; this endpoint never touches their content."""
    ctx = _require_admin(db, current_user["user_id"])
    target = db.execute(
        text("select role, institution_id from profiles where id = :mid"),
        {"mid": member_id},
    ).mappings().first()
    if not target or target["institution_id"] != ctx["institution_id"] or target["role"] not in MANAGEABLE_ROLES:
        raise HTTPException(404, "Member not found in your institution")

    db.execute(
        text("update profiles set role = 'individual', institution_id = null where id = :mid"),
        {"mid": member_id},
    )
    db.commit()
    return {"excluded": member_id}


class UpdateEmailBody(BaseModel):
    email: str


@router.patch("/admin/members/{member_id}/email")
async def update_member_email(member_id: str, body: UpdateEmailBody, db=Depends(get_db),
                               current_user: dict = Depends(get_current_user)):
    """The only operation needing the Supabase Admin API, since profiles never
    stores the login email itself. Requires SUPABASE_SERVICE_ROLE_KEY, backend-only."""
    ctx = _require_admin(db, current_user["user_id"])
    target = db.execute(
        text("select role, institution_id from profiles where id = :mid"),
        {"mid": member_id},
    ).mappings().first()
    if not target or target["institution_id"] != ctx["institution_id"] or target["role"] not in MANAGEABLE_ROLES:
        raise HTTPException(404, "Member not found in your institution")

    if not settings.supabase_service_role_key:
        raise HTTPException(500, "Email changes are not configured on this server")

    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{settings.supabase_url}/auth/v1/admin/users/{member_id}",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
            json={"email": body.email},
        )
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, f"Could not update email: {resp.text[:200]}")

    db.execute(text("update profiles set email = :email where id = :mid"),
              {"email": body.email, "mid": member_id})
    db.commit()
    return {"updated": member_id, "email": body.email}
