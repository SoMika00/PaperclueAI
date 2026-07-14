from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    s2_api_key: str = ""
    claude_model_fast: str = "claude-sonnet-4-5"
    claude_model_smart: str = "claude-sonnet-4-5"
    database_url: str = "postgresql+psycopg2://paperclue:paperclue@postgres:5432/paperclue"
    qdrant_url: str = "http://qdrant:6333"
    storage_dir: str = "/data/pdfs"
    tenant_id: str = "demo-university"
    embed_model: str = "BAAI/bge-small-en-v1.5"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
