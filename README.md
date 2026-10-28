# Invoxa - Invoice & Quotation Management SaaS Platform

> **Quote. Invoice. Get Paid.**  
> A multi-tenant cloud-based SaaS platform engineered for freelancers, consultants, contractors, retail shops, and SMEs in Bahrain, GCC, and international markets.

---

## 🌟 Key Features

1. **Multi-Tenant Data Isolation**
   - Single-database, multi-tenant architecture with logical data segregation per business.
   - Global Entity Framework Core query filters automatically scope every query by `TenantId`.
   - Automatic `TenantId` injection on saving to eliminate cross-tenant leakage.

2. **Customer & Client Management**
   - Full CRUD operations with search and history tracking.
   - Native support for Commercial Registration (**CR Number**) and **VAT Number**.

3. **Quotation & Proposal Engine**
   - Create multi-line quotations with discounts and configurable VAT (default 10% for Bahrain).
   - Instant conversion: **Convert accepted quotations into formal Tax Invoices with 1 click**.
   - Quotation duplication for rapid proposal drafting.
   - Vector-crisp PDF generation powered by **QuestPDF**.

4. **Invoice & Billing Lifecycle**
   - Automated sequential numbering format: `INV-2026-000001`.
   - Real-time status transitions: `Pending`, `Partially Paid`, `Paid`, `Overdue`, `Cancelled`.
   - Custom notes, payment instructions (IBAN, BenefitPay phone number), and terms.
   - Downloadable official Tax Invoice PDFs.

5. **Payment Tracking & GCC Settlements**
   - Record partial and full customer settlements.
   - Tracks **BenefitPay**, Bank Wire Transfers, Cash, Credit Cards, and Online Gateways.
   - Real-time balance reconciliation against invoice totals.

6. **Executive Dashboard & Reporting**
   - Today's sales, monthly revenue, annual run-rate, and total outstanding debt.
   - Count badges for paid, pending, and overdue invoices.
   - Top customer ranking by revenue and invoice frequency.

---

## 🏗️ Architecture Overview

```
Invoxa/
├── backend/
│   ├── Invoxa.sln
│   ├── Dockerfile
│   ├── database/
│   │   ├── schema.sql                 # PostgreSQL DDL with indexes & foreign keys
│   │   └── seed.sql                   # Realistic demo tenant & transactions
│   └── src/
│       ├── Invoxa.Domain/             # Entities, Enums, BaseTenantEntity
│       ├── Invoxa.Application/        # DTOs, Service interfaces, Business logic
│       ├── Invoxa.Infrastructure/     # AppDbContext, QuestPDF, JWT Token service
│       └── Invoxa.API/                # REST Controllers, Middlewares, Swagger
│
├── frontend/                          # React 18 + Material UI + Vite
│   ├── src/
│   │   ├── api/                       # Axios client with JWT interceptor
│   │   ├── components/                # Layout, StatusChip, CurrencyText
│   │   ├── context/                   # AuthContext (Auth & Multi-tenancy)
│   │   ├── pages/                     # Dashboard, Customers, Quotations, Invoices, Payments, Login
│   │   └── theme/                     # Material UI custom theme
│
├── docker-compose.yml                 # PostgreSQL + API container stack
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [.NET 8 SDK or .NET 9 SDK](https://dotnet.microsoft.com/)
- [Node.js (v18+)](https://nodejs.org/) & `npm`
- [PostgreSQL 15+](https://www.postgresql.org/) or [Docker](https://www.docker.com/)

---

### Option 1: Quickstart with Docker Compose

To spin up the PostgreSQL database and backend container simultaneously:

```bash
docker-compose up -d
```
The database will automatically initialize using `backend/database/schema.sql` and `backend/database/seed.sql`.

---

### Option 2: Running Locally

#### 1. Setup PostgreSQL Database
Run the scripts in your PostgreSQL instance:
```bash
psql -U postgres -d invoxa_db -f backend/database/schema.sql
psql -U postgres -d invoxa_db -f backend/database/seed.sql
```

#### 2. Run Backend API
```bash
cd backend/src/Invoxa.API
dotnet run
```
- Swagger UI will be available at: **`http://localhost:5000/swagger`** or **`https://localhost:7001/swagger`**

#### 3. Run Frontend (React + MUI)
```bash
cd frontend
npm install
npm run dev
```
- Frontend application will be available at: **`http://localhost:5173`**

---

## 🔑 Demo Login Credentials (From Seed Data)

| Field | Value |
| :--- | :--- |
| **Email** | `admin@invoxa.com` |
| **Password** | `Admin@123456` |
| **Organization** | Apex Technologies W.L.L. (Manama, Bahrain) |
| **Currency** | Bahraini Dinar (`BHD` - 3 Decimals, e.g. `125.500 BHD`) |
| **VAT Rate** | 10.00% |

*(You can also click the **"Auto-fill Seed Demo Account"** button on the Login page to test immediately)*

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new business tenant & admin user |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/dashboard/metrics` | Retrieve financial summary & KPI metrics |
| `GET` | `/api/customers` | List customers (supports `?search=` filter) |
| `POST` | `/api/customers` | Create new customer (with CR / VAT) |
| `GET` | `/api/quotations` | List quotations (supports `?status=` filter) |
| `POST` | `/api/quotations` | Create quotation with dynamic line items |
| `POST` | `/api/quotations/{id}/convert-to-invoice` | Convert proposal to Tax Invoice |
| `GET` | `/api/quotations/{id}/pdf` | Stream QuestPDF generated quotation PDF |
| `GET` | `/api/invoices` | List invoices |
| `POST` | `/api/invoices` | Create direct invoice |
| `GET` | `/api/invoices/{id}/pdf` | Stream QuestPDF generated invoice PDF |
| `GET` | `/api/payments` | List payment settlements |
| `POST` | `/api/payments` | Record payment (BenefitPay, Bank, Cash, Card) |

---

## 🇧🇭 Regional & GCC Highlights
- **Bahraini Dinar Precision**: Full support for 3-decimal formatting throughout the calculations, database storage (`decimal(18,4)`), and UI (`CurrencyText`).
- **BenefitPay Compatibility**: Dedicated payment method option with Reference / Transaction ID tracking for Bahrain's national payment network.
- **Statutory Requirements**: Dedicated fields for Commercial Registration (`CR Number`) and Tax ID (`VAT Number`) on both tenant companies and customer records.
