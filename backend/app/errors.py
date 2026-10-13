from __future__ import annotations


class DomainError(Exception):
    """Base class for domain errors mapped to HTTP responses in main.py."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "BAD_REQUEST",
        status_code: int = 400,
        field: str | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.field = field


class NotFoundError(DomainError):
    def __init__(self, message: str = "Resource not found.") -> None:
        super().__init__(message, code="NOT_FOUND", status_code=404)


class ValidationDomainError(DomainError):
    def __init__(self, message: str, field: str | None = None) -> None:
        super().__init__(message, code="VALIDATION_ERROR", status_code=422, field=field)
