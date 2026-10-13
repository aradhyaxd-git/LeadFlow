from __future__ import annotations

from fastapi import FastAPI


def create_app() -> FastAPI:
    application = FastAPI(title="LeadFlow API", version="1.0.0")

    @application.get("/api/v1/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()
