from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.db import init_db
from app.errors import DomainError
from app.routers.leads import router as leads_router
from app.schemas import ErrorBody, ErrorDetail, ErrorEnvelope


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    if settings.seed_on_start:
        from app.seed import seed_db

        seed_db()
    yield


def create_app() -> FastAPI:
    application = FastAPI(
        title="LeadFlow API",
        version="1.0.0",
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(DomainError)
    async def handle_domain_error(_request: Request, exc: DomainError) -> JSONResponse:
        details = [ErrorDetail(field=exc.field, message=exc.message)] if exc.field else []
        envelope = ErrorEnvelope(
            error=ErrorBody(
                code=exc.code,
                message=exc.message,
                details=details,
            )
        )
        return JSONResponse(status_code=exc.status_code, content=envelope.model_dump())

    @application.exception_handler(RequestValidationError)
    async def handle_validation_error(
        _request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details: list[ErrorDetail] = []
        for err in exc.errors():
            ignored = ("body", "query", "path")
            loc = [str(part) for part in err.get("loc", []) if part not in ignored]
            field_name = ".".join(loc) if loc else "request"
            raw_msg = str(err.get("msg", "Invalid value."))
            clean_msg = raw_msg.removeprefix("Value error, ")
            details.append(ErrorDetail(field=field_name, message=clean_msg))

        top_message = details[0].message if details else "Request validation failed."
        envelope = ErrorEnvelope(
            error=ErrorBody(
                code="VALIDATION_ERROR",
                message=top_message,
                details=details,
            )
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=envelope.model_dump(),
        )

    @application.exception_handler(Exception)
    async def handle_unexpected_error(_request: Request, _exc: Exception) -> JSONResponse:
        envelope = ErrorEnvelope(
            error=ErrorBody(
                code="INTERNAL_ERROR",
                message="An unexpected server error occurred.",
                details=[],
            )
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=envelope.model_dump(),
        )

    @application.get("/api/v1/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(leads_router)
    return application


app = create_app()
