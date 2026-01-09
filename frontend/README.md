# Glass Frontend

Modern Next.js frontend for the Glass LLM Council platform.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: shadcn/ui (Vega style, Orange theme)
- **State Management**: RTK Query (Redux Toolkit)
- **Icons**: Tabler Icons
- **Font**: Noto Sans

## Features

- 🔐 **Authentication**: Login, registration, and session management
- 💬 **Chat Interface**: Real-time streaming responses from the LLM Council
- 📊 **3-Stage Display**: Visualize individual responses, peer rankings, and final synthesis
- 🌓 **Theme Support**: Light/dark mode with system preference detection
- 📱 **Responsive**: Mobile-first design with collapsible sidebar
- ⚡ **Real-time**: Server-Sent Events for streaming council responses

## Getting Started

### Prerequisites

- Node.js 18+
- Running Glass backend (default: http://localhost:8000)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes (login, register)
│   ├── (dashboard)/       # Protected routes
│   │   ├── home/          # Main dashboard
│   │   ├── chat/[id]/     # Chat interface
│   │   └── settings/      # User settings
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Root redirect
├── components/
│   ├── chat/              # Chat-related components
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessages.tsx
│   │   ├── Stage1Display.tsx
│   │   ├── Stage2Display.tsx
│   │   └── Stage3Display.tsx
│   ├── dashboard/         # Dashboard components
│   │   └── Sidebar.tsx
│   ├── providers/         # Context providers
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── store/             # Redux store
│   │   ├── api/           # RTK Query API slices
│   │   ├── slices/        # Redux slices
│   │   └── store.ts       # Store configuration
│   ├── types/             # TypeScript types
│   └── utils.ts           # Utility functions
└── public/                # Static assets
```

## API Integration

The frontend connects to the Glass backend API at `/api/v1/`:

- **Auth**: `/auth/login`, `/auth/register`, `/auth/refresh`
- **Users**: `/users/me`
- **Council**: `/ml/conversations`, `/ml/conversations/{id}/messages`

### RTK Query

API calls are managed through RTK Query with automatic:

- Token refresh on 401 responses
- Cache invalidation
- Request deduplication

## Development

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Theming

The app uses a warm orange color scheme from shadcn/ui Vega style:

- **Primary**: Orange (#ea580c)
- **Chart colors**: Orange gradient for stages
- **Radius**: Small (0.45rem)

Customize colors in `app/globals.css`.

## License

MIT
