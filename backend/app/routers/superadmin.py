"""Platform-wide superadmin surface: cross-institution user list, account
suspension via the Supabase Admin API (no local status column), a read-only
view of the existing Subscription table, and promo codes managed directly
through Stripe's own Coupon/PromotionCode API (no local promo table --
Stripe is already the source of truth for /billing/checkout's
allow_promotion_codes)."""
import httpx
import stripe
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from ..models import BlogPost, Subscription

router = APIRouter()


def _require_superadmin(db, user_id: str) -> None:
    row = db.execute(
        text("select role from profiles where id = :uid"),
        {"uid": user_id},
    ).mappings().first()
    if not row or row["role"] != "platform_admin":
        raise HTTPException(403, "Superadmin only")


def _require_stripe():
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Billing is not configured")
    stripe.api_key = settings.stripe_secret_key


@router.get("/superadmin/overview")
def overview(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    total_users = db.execute(text("select count(*) from profiles")).scalar() or 0
    total_institutions = db.execute(text("select count(*) from institutions")).scalar() or 0
    active_subscriptions = (
        db.query(Subscription).filter(Subscription.status.in_(["active", "trialing"])).count()
    )
    total_blog_posts = db.query(BlogPost).count()
    balance = None
    if settings.stripe_secret_key:
        try:
            stripe.api_key = settings.stripe_secret_key
            b = stripe.Balance.retrieve()
            balance = sum(a["amount"] for a in b.get("available", [])) / 100
        except Exception:
            balance = None
    return {
        "total_users": total_users,
        "total_institutions": total_institutions,
        "active_subscriptions": active_subscriptions,
        "total_blog_posts": total_blog_posts,
        "stripe_balance": balance,
    }


async def _suspended_ids() -> set[str]:
    """One call to Supabase's own user list, so per-row suspend state reflects
    reality without a local status column or an N+1 Admin API call per row."""
    if not settings.supabase_service_role_key or not settings.supabase_url:
        return set()
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{settings.supabase_url}/auth/v1/admin/users",
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                },
                params={"per_page": 1000},
            )
        if resp.status_code >= 400:
            return set()
        data = resp.json()
        users = data.get("users", data if isinstance(data, list) else [])
        return {u["id"] for u in users if u.get("banned_until")}
    except Exception:
        return set()


@router.get("/superadmin/users")
async def list_users(
    q: str = "", role: str = "", limit: int = 50, offset: int = 0,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    _require_superadmin(db, current_user["user_id"])
    where, params = [], {"limit": limit, "offset": offset}
    if q:
        where.append("(p.email ilike :q or p.full_name ilike :q)")
        params["q"] = f"%{q}%"
    if role:
        where.append("p.role = :role")
        params["role"] = role
    where_sql = f"where {' and '.join(where)}" if where else ""
    rows = db.execute(
        text(
            f"""
            select p.id, p.full_name, p.email, p.role, p.institution_id, p.created_at,
                   s.status as sub_status, s.plan as sub_plan, s.current_period_end
            from profiles p
            left join subscriptions s on s.user_id = p.id
            {where_sql}
            order by p.created_at desc
            limit :limit offset :offset
            """
        ),
        params,
    ).mappings().all()
    suspended = await _suspended_ids()
    return [{**dict(r), "suspended": r["id"] in suspended} for r in rows]


async def _set_suspended(user_id: str, ban_duration: str) -> dict:
    if not settings.supabase_service_role_key or not settings.supabase_url:
        raise HTTPException(500, "Supabase admin access is not configured on this server")
    async with httpx.AsyncClient() as client:
        resp = await client.put(
            f"{settings.supabase_url}/auth/v1/admin/users/{user_id}",
            headers={
                "apikey": settings.supabase_service_role_key,
                "Authorization": f"Bearer {settings.supabase_service_role_key}",
            },
            json={"ban_duration": ban_duration},
        )
    if resp.status_code >= 400:
        raise HTTPException(resp.status_code, f"Could not update account status: {resp.text[:200]}")
    return {"user_id": user_id, "suspended": ban_duration != "none"}


@router.post("/superadmin/users/{user_id}/suspend")
async def suspend_user(user_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    return await _set_suspended(user_id, "876000h")  # Supabase's own convention for "indefinite"


@router.post("/superadmin/users/{user_id}/reactivate")
async def reactivate_user(user_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    return await _set_suspended(user_id, "none")


@router.get("/superadmin/subscriptions/overview")
def subscriptions_overview(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    by_status = dict(db.execute(text("select status, count(*) from subscriptions group by status")).all())
    by_plan = dict(
        db.execute(text("select coalesce(plan,'none'), count(*) from subscriptions group by plan")).all()
    )
    balance = None
    if settings.stripe_secret_key:
        try:
            stripe.api_key = settings.stripe_secret_key
            b = stripe.Balance.retrieve()
            balance = sum(a["amount"] for a in b.get("available", [])) / 100
        except Exception:
            balance = None
    return {"by_status": by_status, "by_plan": by_plan, "stripe_balance": balance}


@router.get("/superadmin/subscriptions/recent")
def subscriptions_recent(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    rows = db.execute(
        text(
            """
            select s.user_id, s.status, s.plan, s.current_period_end, s.updated_at,
                   p.email, p.full_name
            from subscriptions s
            left join profiles p on p.id = s.user_id
            order by s.updated_at desc
            limit 20
            """
        )
    ).mappings().all()
    return [dict(r) for r in rows]


def _promo_public(promo) -> dict:
    coupon = promo.get("coupon") or {}
    return {
        "id": promo["id"],
        "code": promo["code"],
        "active": promo["active"],
        "percent_off": coupon.get("percent_off"),
        "amount_off": coupon.get("amount_off"),
        "currency": coupon.get("currency"),
        "duration": coupon.get("duration"),
        "max_redemptions": promo.get("max_redemptions"),
        "times_redeemed": promo.get("times_redeemed"),
        "expires_at": promo.get("expires_at"),
        "created": promo.get("created"),
    }


@router.get("/superadmin/promo-codes")
def list_promo_codes(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    _require_stripe()
    codes = stripe.PromotionCode.list(limit=100, expand=["data.coupon"])
    return [_promo_public(c) for c in codes.data]


class PromoCodeCreate(BaseModel):
    code: str
    percent_off: float | None = None
    amount_off: int | None = None  # in cents, mutually exclusive with percent_off
    currency: str = "usd"
    duration: str = "once"  # once | repeating | forever
    duration_in_months: int | None = None
    max_redemptions: int | None = None
    expires_at: int | None = None  # unix timestamp


@router.post("/superadmin/promo-codes")
def create_promo_code(
    body: PromoCodeCreate, current_user: dict = Depends(get_current_user), db=Depends(get_db)
):
    _require_superadmin(db, current_user["user_id"])
    _require_stripe()
    if not body.percent_off and not body.amount_off:
        raise HTTPException(400, "Provide percent_off or amount_off")
    coupon_kwargs = {"duration": body.duration}
    if body.percent_off:
        coupon_kwargs["percent_off"] = body.percent_off
    else:
        coupon_kwargs["amount_off"] = body.amount_off
        coupon_kwargs["currency"] = body.currency
    if body.duration == "repeating":
        coupon_kwargs["duration_in_months"] = body.duration_in_months
    coupon = stripe.Coupon.create(**coupon_kwargs)
    promo_kwargs = {"coupon": coupon.id, "code": body.code}
    if body.max_redemptions:
        promo_kwargs["max_redemptions"] = body.max_redemptions
    if body.expires_at:
        promo_kwargs["expires_at"] = body.expires_at
    promo = stripe.PromotionCode.create(**promo_kwargs)
    return _promo_public(promo)


class PromoCodeUpdate(BaseModel):
    active: bool


@router.patch("/superadmin/promo-codes/{promo_id}")
def update_promo_code(
    promo_id: str, body: PromoCodeUpdate,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    _require_superadmin(db, current_user["user_id"])
    _require_stripe()
    promo = stripe.PromotionCode.modify(promo_id, active=body.active)
    return _promo_public(promo)
