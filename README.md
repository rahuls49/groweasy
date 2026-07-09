# GrowEasy AI-Powered CSV Importer

An intelligent CSV importer that uses **Google Gemini AI** to map any CSV format into GrowEasy CRM records — regardless of column names or structure.

## Features

- 🤖 **AI Field Mapping** — Gemini 1.5 Flash intelligently maps columns from any CSV source (Facebook Ads, Google Ads, Excel, etc.)
- 📂 **Drag & Drop Upload** — with file type validation and size display
- 👁️ **CSV Preview** — scrollable table with sticky headers before any AI processing
- ⚡ **Batch Processing** — AI processes rows in configurable batches with retry logic
- 📊 **Rich Results** — imported records, skipped records, and success rate stats
- 🌙 **Dark Mode UI** — glassmorphism design with smooth animations

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend  | Bun, Express 5, TypeScript |
| AI       | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Parsing  | csv-parse (backend), papaparse (frontend preview) |

## Project Structure

```
groweasy-assignment/
├── backend/
│   ├── src/
│   │   ├── config/        # Env validation (Zod)
│   │   ├── middleware/    # Global error handler
│   │   ├── routes/        # /api/import, /api/health
│   │   ├── services/      # AI service, import orchestration
│   │   ├── types/         # CRM TypeScript types
│   │   └── utils/         # CSV parser, chunk helper
│   ├── index.ts           # Server entry point
│   └── .env.example       # Environment variable template
└── frontend/
    ├── app/
    │   ├── components/    # StepIndicator, UploadZone, PreviewTable, ResultTable, LoadingOverlay
    │   ├── types/         # CRM types (mirrored from backend)
    │   ├── globals.css    # Design system
    │   ├── layout.tsx
    │   └── page.tsx       # 4-step state machine
    └── .env.local.example
```

## Setup & Running Locally

### Prerequisites
- [Bun](https://bun.sh) installed
- Google Gemini API key ([get one free](https://aistudio.google.com/app/apikey))
- MongoDB running locally (optional — backend is stateless, no DB required)

### Backend

```bash
cd backend

# Copy and fill in your API key
cp .env.example .env
# Edit .env → set GEMINI_API_KEY=your_key_here

# Install dependencies
bun install

# Start dev server (hot reload)
bun run dev
# → running on http://localhost:4000
```

### Frontend

```bash
cd frontend

# Copy env file
cp .env.local.example .env.local

# Install dependencies
bun install

# Start dev server
bun run dev
# → running on http://localhost:3000
```

## API Reference

### `GET /api/health`
Liveness check.

```json
{ "success": true, "status": "ok", "timestamp": "..." }
```

### `POST /api/import`
Upload a CSV file for AI extraction.

**Request:** `multipart/form-data` with field `file` (CSV)

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "leads.csv",
    "totalRows": 50,
    "importedCount": 48,
    "skippedCount": 2,
    "records": [ { "name": "...", "email": "...", ... } ],
    "skippedRecords": [ { "rowIndex": 5, "reason": "No email or phone", "rawData": {} } ]
  }
}
```

## CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `name` | Full name |
| `email` | Primary email |
| `country_code` | Dialing code e.g. +91 |
| `mobile_without_country_code` | Phone without country code |
| `company` | Company name |
| `city`, `state`, `country` | Location |
| `lead_owner` | Assigned sales rep |
| `crm_status` | `GOOD_LEAD_FOLLOW_UP` \| `DID_NOT_CONNECT` \| `BAD_LEAD` \| `SALE_DONE` |
| `data_source` | `leads_on_demand` \| `meridian_tower` \| `eden_park` \| `varah_swamy` \| `sarjapur_plots` |
| `crm_note` | Notes, extra contacts, remarks |
| `created_at` | Lead creation date |
| `possession_time` | Property possession timeline |
| `description` | Additional context |

## Environment Variables

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | **required** | Google Gemini API key |
| `PORT` | `4000` | Server port |
| `AI_BATCH_SIZE` | `20` | Rows per AI batch |
| `AI_MAX_RETRIES` | `3` | Max retries per batch |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed frontend origin |

### Frontend (`.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | Backend API base URL |
