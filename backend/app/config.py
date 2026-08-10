from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    s2_api_key: str = ""
    claude_model_fast: str = "claude-sonnet-4-5"
    claude_model_smart: str = "claude-sonnet-4-5"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    database_url: str = "postgresql+psycopg2://paperclue:paperclue@postgres:5432/paperclue"
    qdrant_url: str = "http://qdrant:6333"
    qdrant_api_key: str = ""  # required by Qdrant Cloud; empty for a local instance
    storage_dir: str = "/data/pdfs"
    tenant_id: str = "demo-university"
    # Default to the local fastembed model so semantic indexing works without
    # an external key (BAAI/bge-small-en-v1.5 → 384-dim). Set EMBEDDING_PROVIDER=
    # openai + OPENAI_API_KEY + EMBED_MODEL=text-embedding-3-small to use OpenAI.
    embedding_provider: str = "fastembed"
    embed_model: str = "BAAI/bge-small-en-v1.5"
    embed_dimensions: int = 384
    source_database_type: str = "postgres"
    source_database_url: str = ""
    source_database_host: str = ""
    source_database_port: str = ""
    source_database_name: str = ""
    source_database_user: str = ""
    source_database_password: str = ""
    source_database_ssl_mode: str = "prefer"
    source_database_ssl_ca: str = ""
    source_database_ssl_cert: str = ""
    source_database_ssl_key: str = ""
    source_database_trust_server_certificate: str = "false"
    connection_encryption_key: str = ""
    # Stripe billing. Works identically for test + live — only the key values
    # differ. Set STRIPE_SECRET_KEY (sk_test_… or sk_live_…), the webhook signing
    # secret, the two recurring price IDs, and APP_URL (frontend origin for the
    # post-checkout redirect). Empty secret key → billing endpoints return 503.
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_monthly: str = ""
    stripe_price_annual: str = ""
    app_url: str = "https://paperclue-beta.vercel.app"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
