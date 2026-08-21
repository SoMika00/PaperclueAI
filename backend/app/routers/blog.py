"""Blog: public read endpoints for the marketing site, admin-gated CRUD for
platform admins. Posts are Markdown; a slug is generated once at creation
and never changes afterward, so published links never break."""
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..db import get_db
from ..models import BlogPost, now
from .superadmin import _require_superadmin

router = APIRouter()


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug or "post"


def _unique_slug(db, title: str) -> str:
    base = _slugify(title)
    slug = base
    n = 2
    while db.query(BlogPost).filter(BlogPost.slug == slug).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


def _public(post: BlogPost) -> dict:
    return {
        "id": post.id,
        "slug": post.slug,
        "title": post.title,
        "excerpt": post.excerpt,
        "content": post.content,
        "author": post.author,
        "category": post.category,
        "read_time": post.read_time,
        "image": post.image,
        "featured": post.featured,
        "tags": post.tags or [],
        "published": post.published,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }


@router.get("/blog/posts")
def list_public_posts(
    q: str = "", category: str = "", tag: str = "", limit: int = 20, offset: int = 0,
    db=Depends(get_db),
):
    query = db.query(BlogPost).filter(BlogPost.published.is_(True))
    if q:
        query = query.filter(BlogPost.title.ilike(f"%{q}%"))
    if category:
        query = query.filter(BlogPost.category == category)
    posts = query.order_by(BlogPost.created_at.desc()).offset(offset).limit(limit).all()
    if tag:
        posts = [p for p in posts if tag in (p.tags or [])]
    return [_public(p) for p in posts]


@router.get("/blog/posts/{slug}")
def get_public_post(slug: str, db=Depends(get_db)):
    post = db.query(BlogPost).filter(BlogPost.slug == slug, BlogPost.published.is_(True)).first()
    if not post:
        raise HTTPException(404, "Post not found")
    return _public(post)


@router.get("/superadmin/blog/posts")
def list_all_posts(current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    posts = db.query(BlogPost).order_by(BlogPost.created_at.desc()).all()
    return [_public(p) for p in posts]


@router.get("/superadmin/blog/posts/{post_id}")
def get_post_for_edit(post_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    return _public(post)


class BlogPostBody(BaseModel):
    title: str
    excerpt: str = ""
    content: str = ""
    author: str = ""
    category: str = ""
    read_time: str = ""
    image: str | None = None
    featured: bool = False
    tags: list[str] = []
    published: bool = False


@router.post("/superadmin/blog/posts")
def create_post(
    body: BlogPostBody, current_user: dict = Depends(get_current_user), db=Depends(get_db)
):
    _require_superadmin(db, current_user["user_id"])
    post = BlogPost(
        slug=_unique_slug(db, body.title),
        title=body.title,
        excerpt=body.excerpt,
        content=body.content,
        author=body.author,
        category=body.category,
        read_time=body.read_time,
        image=body.image,
        featured=body.featured,
        tags=body.tags,
        published=body.published,
        created_by=current_user["user_id"],
    )
    db.add(post)
    db.commit()
    return _public(post)


@router.put("/superadmin/blog/posts/{post_id}")
def update_post(
    post_id: str, body: BlogPostBody,
    current_user: dict = Depends(get_current_user), db=Depends(get_db),
):
    _require_superadmin(db, current_user["user_id"])
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    post.title = body.title
    post.excerpt = body.excerpt
    post.content = body.content
    post.author = body.author
    post.category = body.category
    post.read_time = body.read_time
    post.image = body.image
    post.featured = body.featured
    post.tags = body.tags
    post.published = body.published
    post.updated_at = now()
    db.commit()
    return _public(post)


@router.delete("/superadmin/blog/posts/{post_id}")
def delete_post(post_id: str, current_user: dict = Depends(get_current_user), db=Depends(get_db)):
    _require_superadmin(db, current_user["user_id"])
    post = db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    db.delete(post)
    db.commit()
    return {"deleted": post_id}
