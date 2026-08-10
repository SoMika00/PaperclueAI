"""Stripe subscription billing.

- POST /billing/checkout  → hosted Stripe Checkout (subscription mode) with
  promotion codes enabled; returns the redirect URL.
- POST /billing/portal    → Stripe customer portal (manage / cancel).
- GET  /billing/status    → the caller's entitlement state.
- POST /billing/webhook   → Stripe → us; the source of truth for status.
  Unauthenticated (verified by Stripe signature), so it is registered WITHOUT
  the JWT guard in main.py.

Works identically for test and live — only the STRIPE_* env values differ.
"""
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from ..auth import get_current_user
from ..config import settings
from ..db import get_db
from ..models import Subscription, now

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_PRICE = {
    "monthly": settings.stripe_price_monthly,
    "annual": settings.stripe_price_annual,
}
PRICE_PLAN = {v: k for k, v in PLAN_PRICE.items() if v}
ACTIVE = {"active", "trialing"}


def _require_stripe():
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Billing is not configured")
    stripe.api_key = settings.stripe_secret_key


def _row(db, user_id: str) -> Subscription:
    row = db.get(Subscription, user_id)
    if not row:
        row = Subscription(user_id=user_id, status="none")
        db.add(row)
        db.commit()
    return row


def _public(row: Subscription) -> dict:
    return {
        "active": row.status in ACTIVE,
        "status": row.status,
        "plan": row.plan,
        "current_period_end": row.current_period_end.isoformat() if row.current_period_end else None,
        "has_customer": bool(row.stripe_customer_id),
    }


@router.get("/status")
def status(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    return _public(_row(db, current_user["user_id"]))


class CheckoutBody(BaseModel):
    plan: str = "monthly"  # monthly | annual


@router.post("/checkout")
def checkout(body: CheckoutBody, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_stripe()
    price = PLAN_PRICE.get(body.plan)
    if not price:
        raise HTTPException(400, "Unknown or unconfigured plan")

    uid = current_user["user_id"]
    email = (current_user.get("claims") or {}).get("email")
    row = _row(db, uid)

    # Reuse (or create) the Stripe customer, tagged with the Supabase user id so
    # webhook events map back to this row.
    if not row.stripe_customer_id:
        customer = stripe.Customer.create(email=email, metadata={"user_id": uid})
        row.stripe_customer_id = customer.id
        db.commit()

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=row.stripe_customer_id,
        line_items=[{"price": price, "quantity": 1}],
        allow_promotion_codes=True,  # ← the promo-code field on Stripe's page
        # A 100%-off promo (e.g. the demo code) then needs no card at all.
        payment_method_collection="if_required",
        client_reference_id=uid,
        subscription_data={"metadata": {"user_id": uid}},
        success_url=f"{settings.app_url}/upgrade?checkout=success",
        cancel_url=f"{settings.app_url}/upgrade?checkout=cancel",
    )
    return {"url": session.url}


@router.post("/portal")
def portal(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_stripe()
    row = _row(db, current_user["user_id"])
    if not row.stripe_customer_id:
        raise HTTPException(400, "No billing account yet")
    session = stripe.billing_portal.Session.create(
        customer=row.stripe_customer_id,
        return_url=f"{settings.app_url}/upgrade",
    )
    return {"url": session.url}


def _apply_subscription(db, sub: dict):
    """Persist a Stripe subscription object onto the matching local row."""
    customer_id = sub.get("customer")
    uid = (sub.get("metadata") or {}).get("user_id")
    row = None
    if uid:
        row = db.get(Subscription, uid)
    if not row and customer_id:
        row = db.query(Subscription).filter(Subscription.stripe_customer_id == customer_id).first()
    if not row:
        return
    row.stripe_subscription_id = sub.get("id")
    row.stripe_customer_id = customer_id or row.stripe_customer_id
    row.status = sub.get("status") or row.status
    try:
        price_id = sub["items"]["data"][0]["price"]["id"]
        row.plan = PRICE_PLAN.get(price_id, row.plan)
    except Exception:
        pass
    end = sub.get("current_period_end")
    if end:
        row.current_period_end = datetime.fromtimestamp(end, tz=timezone.utc)
    row.updated_at = now()
    db.commit()


@router.post("/webhook")
async def webhook(request: Request, db=Depends(get_db)):
    if not settings.stripe_secret_key:
        raise HTTPException(503, "Billing is not configured")
    stripe.api_key = settings.stripe_secret_key
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except Exception:
        raise HTTPException(400, "Invalid signature")

    kind = event["type"]
    obj = event["data"]["object"]

    if kind == "checkout.session.completed":
        sub_id = obj.get("subscription")
        if sub_id:
            # StripeObject is dict-like; _apply_subscription reads it via .get()/[].
            _apply_subscription(db, stripe.Subscription.retrieve(sub_id))
    elif kind in ("customer.subscription.created", "customer.subscription.updated",
                  "customer.subscription.deleted"):
        if kind == "customer.subscription.deleted":
            obj["status"] = "canceled"
        _apply_subscription(db, obj)

    return {"received": True}
