# Glass Backend - LLM Council API

A FastAPI backend for the LLM Council application with MongoDB integration and JWT authentication.

## Features

- **3-Stage Council Process**: Collect responses → Peer rankings → Arbiter synthesis
- **MongoDB Storage**: Persistent conversation and user data
- **JWT Authentication**: Secure access and refresh token system
- **OpenRouter Integration**: Multi-model AI orchestration

## Project Structure

```
glass/backend/
├── app/                    # Application core
│   ├── main.py            # FastAPI app, routes, middleware
│   └── config.py          # All configuration
├── api/                   # Route handlers
│   ├── auth.py           # Auth routes (login, register, refresh, logout)
│   ├── conversations.py  # Council/conversation routes
│   └── users.py          # User profile routes
├── services/             # Business logic
│   ├── auth_service.py   # Auth operations
│   ├── conversation_service.py  # Conversation CRUD
│   └── council_service.py      # Council orchestration
├── ai/                   # AI layer
│   ├── openrouter.py    # OpenRouter client
│   ├── council.py       # Council stages
│   └── config.py        # AI model config
├── models/              # MongoDB models
│   ├── user.py         # User model
│   ├── conversation.py # Conversation model
│   └── message.py      # Message model
├── core/               # Core utilities
│   ├── database.py    # MongoDB connection
│   ├── security.py    # JWT, password hashing
│   └── dependencies.py # FastAPI dependencies
├── schemas/           # Pydantic schemas
│   ├── auth.py       # Auth request/response
│   ├── conversation.py # Conversation schemas
│   └── user.py       # User schemas
├── .env.example      # Environment template
├── pyproject.toml    # Project dependencies
└── README.md         # This file
```

## Setup

### 1. Install Dependencies

Using uv:

```bash
cd glass/backend
uv sync
```

Or with pip:

```bash
pip install -e .
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:

- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `JWT_SECRET_KEY`: Secret key for JWT tokens (generate a secure random string)

### 3. Start MongoDB

Make sure MongoDB is running on `mongodb://localhost:27017` (or update `MONGODB_URL`).

Using Docker:

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --port 8000

# Or using Python
python -m app.main
```

## API Documentation

Once running, access the interactive API docs:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint                | Description            |
| ------ | ----------------------- | ---------------------- |
| POST   | `/auth/register`        | Register a new user    |
| POST   | `/auth/login`           | Login and get tokens   |
| POST   | `/auth/refresh`         | Refresh access token   |
| POST   | `/auth/logout`          | Logout current session |
| POST   | `/auth/logout/all`      | Logout all sessions    |
| POST   | `/auth/password/change` | Change password        |
| GET    | `/auth/status`          | Get auth status        |

### Conversations (`/api/v1/ml`)

| Method | Endpoint                          | Description         |
| ------ | --------------------------------- | ------------------- |
| GET    | `/ml/health`                      | Health check        |
| GET    | `/ml/conversations`               | List conversations  |
| POST   | `/ml/conversations`               | Create conversation |
| GET    | `/ml/conversations/{id}`          | Get conversation    |
| DELETE | `/ml/conversations/{id}`          | Delete conversation |
| POST   | `/ml/conversations/{id}/messages` | Stream message      |

### Users (`/api/v1/users`)

| Method | Endpoint    | Description      |
| ------ | ----------- | ---------------- |
| GET    | `/users/me` | Get current user |
| PATCH  | `/users/me` | Update profile   |

## Development

### Running Tests

```bash
pytest
```

### Leaderboard Backfill

To populate leaderboard collections from the `glass.conversations.json` file:

```bash
# From the backend directory (using uv)
uv run python scripts/backfill_leaderboard_from_json.py

# Or with custom file path
uv run python scripts/backfill_leaderboard_from_json.py --json-file path/to/conversations.json

# To clear existing data before backfilling
uv run python scripts/backfill_leaderboard_from_json.py --clear
```

**Note:** Make sure dependencies are installed first with `uv sync`.

### Port

The backend runs on port **8000**

## License

MIT
