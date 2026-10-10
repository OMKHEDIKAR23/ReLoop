from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.waste import router as waste_router

app = FastAPI(title="ReLoop API")

# Allow the local React frontend to communicate with FastAPI.
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

app.include_router(waste_router)


@app.get("/")
def root():
    return {"message": "ReLoop backend is running"}


@app.get("/health")
def health():
    return {"status": "ok"} 