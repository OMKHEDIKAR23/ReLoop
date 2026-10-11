from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.waste import router as waste_router
from app.services.cedar_authorization import (
    check_authorization,
    get_authorization_status,
)

app = FastAPI(title="ReLoop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cedar_authorization_middleware(
    request: Request,
    call_next,
):
    """Check Cedar policies before protected API operations."""

    protected_operations = {
        ("POST", "/api/waste/analyze"): ("scan", "waste"),
        ("GET", "/api/waste/history"): (
            "view_history",
            "scan_history",
        ),
    }

    operation = (
        request.method,
        request.url.path,
    )

    if operation in protected_operations:
        action, resource = protected_operations[operation]

        try:
            authorization = check_authorization(
                action,
                resource,
            )
        except Exception:
            return JSONResponse(
                status_code=503,
                content={
                    "detail": (
                        "Cedar authorization is unavailable. "
                        "The request was not processed."
                    )
                },
            )

        if not authorization["allowed"]:
            return JSONResponse(
                status_code=403,
                content={
                    "detail": "Cedar denied this operation.",
                    "authorization": authorization,
                },
            )

    return await call_next(request)


app.include_router(waste_router)


@app.get("/")
def root():
    return {"message": "ReLoop backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/authorization/status")
def authorization_status():
    """Demonstrate Cedar authorization decisions."""

    try:
        return get_authorization_status()
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Cedar authorization check failed."
            },
        )