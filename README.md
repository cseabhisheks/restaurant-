# Ember & Oak — Restaurant POS & Order Management

Web POS for restaurants/cafés: menu management, dine-in/takeaway orders, server-verified billing, payment recording, order workflow, and a daily sales dashboard.

**Live demo:** _<add Vercel URL>_ · **API:** _<add API URL>_

## Tech stack
Next.js 14 (App Router, JS) · Node.js + Express · MongoDB (Mongoose) · JWT auth · Zod validation

## Features
- JWT login, roles **Admin** / **Staff** (bcrypt-hashed passwords, login rate limiting, Helmet, CORS allow-list)
- Menu CRUD, search + category filter, *sold-out* toggle, soft **deactivate** (history stays intact)
- POS: multi-item cart, quantity edit/remove, dine-in (table required) / takeaway, unique order numbers `ORD-YYMMDD-NNN` (atomic daily counter)
- Billing: subtotal → discount (% or flat) → configurable tax → total, **always computed on the server**
- Workflow: Pending → Preparing → Ready → Completed (+ Cancelled), with timeline
- Payments: Cash / UPI / Card record with status; no gateway
- Dashboard: sales, order counts, 7-day trend, top sellers, recent orders
- Print-friendly bill, order search by number/status, pagination

## Business rules (enforced in the API)
| Rule | Behaviour |
|---|---|
| Totals | Client totals ignored; server re-prices from DB menu prices |
| Unavailable / deactivated items | `409 ITEM_UNAVAILABLE` |
| Menu & settings changes | Admin only (`403`) |
| Discounts > 20% of subtotal | Admin only |
| Order edit | Only while Pending and unpaid |
| Completing an order | Requires payment recorded |
| Cancel | Only Pending/Preparing and unpaid |
| Status skipping / going backwards | `409 INVALID_TRANSITION` |

Errors always look like `{ "success": false, "error": { "code", "message", "details" } }`.

## Local setup
```bash
# 1. API
cd server && cp .env.example .env     # fill MONGODB_URI and JWT_SECRET
npm install
npm run seed                          # demo users + 20 menu items
npm run dev                           # http://localhost:5000
npm test                              # billing + status-transition tests

# 2. Web
cd ../client && cp .env.example .env.local
npm install && npm run dev            # http://localhost:3000
```

### Environment variables
| Where | Name | Purpose |
|---|---|---|
| server | `MONGODB_URI` | MongoDB connection string (Atlas free tier works) |
| server | `JWT_SECRET`, `JWT_EXPIRES_IN` | token signing |
| server | `CLIENT_ORIGIN` | comma-separated allowed web origins |
| server | `TZ` | timezone for "today" in reports (e.g. `Asia/Kolkata`) |
| client | `NEXT_PUBLIC_API_URL` | e.g. `https://your-api.onrender.com/api` |

## Demo credentials (test data only)
- Admin: `admin@urstech.demo` / `Admin@123`
- Staff: `staff@urstech.demo` / `Staff@123`

## Deployment
- **API → Render/Railway:** root `server`, build `npm install`, start `npm start`, set env vars. (The Express app also exports cleanly for Vercel serverless.)
- **Web → Vercel:** root `client`, set `NEXT_PUBLIC_API_URL`. Then set the API's `CLIENT_ORIGIN` to the Vercel URL.
- Run `npm run seed` once against the production database (seed **wipes** users/menu).

## API
`POST /api/auth/login` · `GET /api/auth/me` · `GET/POST /api/menu` · `PUT/DELETE /api/menu/:id` · `GET /api/menu/categories` ·
`POST/GET /api/orders` · `GET/PUT /api/orders/:id` · `PATCH /api/orders/:id/status` · `POST /api/orders/:id/payment` ·
`GET /api/reports/daily-sales?date=YYYY-MM-DD` · `GET/PUT /api/settings`

Design decisions: `DELETE /menu/:id` is a soft delete; `PUT /orders/:id` added for editing pending orders; `/settings` added for configurable tax.
