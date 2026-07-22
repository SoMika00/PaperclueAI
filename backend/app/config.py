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
    storage_dir: str = "/data/pdfs"
    tenant_id: str = "demo-university"
    embedding_provider: str = "openai"
    embed_model: str = "text-embedding-3-small"
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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
