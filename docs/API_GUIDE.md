# iReside API Documentation

This document provides an overview of the iReside API. For a complete machine-readable specification, see [openapi.json](./openapi.json).

## Authentication
Most endpoints require a valid Supabase authentication session. Include the Supabase JWT in the `Authorization` header when making requests.

---

## 🤖 iRis AI Assistant

### `POST /api/iris/chat`
Interact with the AI concierge.
- **Request Body**:
  - `message`: (string) User query.
  - `conversationHistory`: (array) Previous messages in the session.
- **Returns**: AI response string, metadata (model/tokens), and a `hasDataCard` flag.

---

## 📊 Landlord Analytics

### `POST /api/landlord/statistics/insights`
Generate AI-driven analysis of property performance.
- **Request Body**: Date range and an array of KPI objects (title, value, change, etc.).
- **Returns**: A map of insights keyed by KPI title, and the source (`ai` or `fallback`).

### `GET /api/landlord/statistics/report`
Fetch the history of exported reports.
- **Returns**: Array of export metadata (format, range, date).

### `POST /api/landlord/statistics/report`
Generate and record a new portfolio report.
- **Formats**: `csv` or `pdf`.
- **Mode**: `Simplified` or `Detailed`.

---

## 📝 Walk-in Applications & Leases

### `POST /api/landlord/applications/walk-in`
Create a new walk-in application.
- **Request Body**: `status`, `applicant_name`, `applicant_phone`, etc.

### `PATCH /api/landlord/applications/walk-in`
Update an existing walk-in application.
- **Request Body**: `id`, updated fields.

### `POST /api/landlord/lease/finalize`
Finalize a lease and automatically provision a tenant account.
- **Request Body**: `application_id`, `unit_id`, lease terms, signatures.
- **Returns**: Newly created lease and the temporary password for the generated tenant account.

---

## 💬 Messaging System

### `GET /api/messages/conversations`
Retrieve all conversations for the authenticated user with latest message snippets.

### `POST /api/messages/conversations`
Start a new conversation or find an existing direct one.
- **Request Body**: `participantIds` (array of user IDs).

### `GET /api/messages/conversations/{id}`
Fetch messages for a specific conversation.
- **Query Params**: `limit` (default 100).

### `POST /api/messages/conversations/{id}`
Send a message.
- **Request Body**: `content`, `type` (text/image/file/system), and optional `metadata`.

### `GET /api/messages/users`
Search for profiles to message.
- **Query Params**: `q` (min 2 chars).

---

## 🛠️ Internal Utility

### `GET /api/iris/redact`
*(Internal)* Proxies requests to redaction services for PII protection.
