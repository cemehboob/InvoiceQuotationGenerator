-- =========================================================================
-- Invoxa - Invoice & Quotation Management Platform
-- PostgreSQL Relational Database Schema (Multi-Tenant Architecture)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL,
    trade_license_or_cr VARCHAR(100),
    vat_number VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    logo_url TEXT,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'BHD',
    currency_decimals INT NOT NULL DEFAULT 3,
    default_vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    subscription_plan INT NOT NULL DEFAULT 1, -- 1: Free, 2: Basic, 3: Professional, 4: Business
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash TEXT NOT NULL,
    role INT NOT NULL DEFAULT 3, -- 1: Admin, 2: Manager, 3: Staff
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    vat_number VARCHAR(100),
    cr_number VARCHAR(100),
    notes TEXT,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers(tenant_id, name);

-- 4. Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    quotation_no VARCHAR(50) NOT NULL,
    quotation_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status INT NOT NULL DEFAULT 1, -- 1: Draft, 2: Sent, 3: Accepted, 4: Rejected, 5: Expired
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    tax_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    terms_and_conditions TEXT,
    notes TEXT,
    converted_to_invoice_id UUID,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ,
    CONSTRAINT uq_quotations_tenant_no UNIQUE (tenant_id, quotation_no)
);

CREATE INDEX IF NOT EXISTS idx_quotations_tenant_status ON quotations(tenant_id, status);

-- 5. Quotation Items Table
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    line_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ
);

-- 6. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    invoice_no VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status INT NOT NULL DEFAULT 1, -- 1: Pending, 2: PartiallyPaid, 3: Paid, 4: Overdue, 5: Cancelled
    subtotal NUMERIC(18, 4) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    tax_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(18, 4) NOT NULL DEFAULT 0,
    qr_code_payload TEXT,
    terms_and_conditions TEXT,
    notes TEXT,
    pdf_url TEXT,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ,
    CONSTRAINT uq_invoices_tenant_no UNIQUE (tenant_id, invoice_no)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_date ON invoices(tenant_id, invoice_date);

-- 7. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 1,
    unit_price NUMERIC(18, 4) NOT NULL DEFAULT 0,
    discount_percent NUMERIC(5, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    line_total NUMERIC(18, 4) NOT NULL DEFAULT 0,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ
);

-- 8. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(18, 4) NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method INT NOT NULL DEFAULT 2, -- 1: Cash, 2: BankTransfer, 3: BenefitPay, 4: CreditCard, 5: OnlinePayment
    reference_no VARCHAR(100),
    notes TEXT,
    created_at_utc TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at_utc TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_invoice ON payments(tenant_id, invoice_id);
