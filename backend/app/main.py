"""FastAPI application for Glass Backend."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import APP_NAME, CORS_ORIGINS, API_V1_PREFIX, DEBUG
from core.database import connect_to_mongodb, close_mongodb_connection
from api import auth, conversations, users, leaderboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    await connect_to_mongodb()
    yield
    # Shutdown
    await close_mongodb_connection()


app = FastAPI(
    title=APP_NAME,
    description="LLM Council API with MongoDB and JWT Authentication",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else "/docs",
    redoc_url="/redoc" if DEBUG else "/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if DEBUG else "An unexpected error occurred"
        }
    )


# Include Routers
app.include_router(
    auth.router,
    prefix=f"{API_V1_PREFIX}/auth",
    tags=["Authentication"]
)

app.include_router(
    conversations.router,
    prefix=f"{API_V1_PREFIX}/ml",
    tags=["Conversations"]
)

app.include_router(
    users.router,
    prefix=f"{API_V1_PREFIX}/users",
    tags=["Users"]
)

app.include_router(
    leaderboard.router,
    prefix=f"{API_V1_PREFIX}",
    tags=["Leaderboard"]
)


# Root Endpoint
@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": "0.1.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": APP_NAME,
        "version": "0.1.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
