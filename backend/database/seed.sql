-- =========================================================================
-- Invoxa - Seed Data (Demo Organization: Apex Solutions W.L.L - Manama, Bahrain)
-- =========================================================================

-- 1. Insert Demo Tenant
INSERT INTO tenants (id, company_name, trade_license_or_cr, vat_number, phone, email, address, currency_code, currency_decimals, default_vat_rate, subscription_plan, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Apex Technologies W.L.L.',
    'CR-984321-01',
    '200019283700002',
    '+973 1722 3344',
    'billing@apextech.bh',
    'Diplomatic Area, Building 402, Road 1705, Manama, Kingdom of Bahrain',
    'BHD',
    3,
    10.00,
    3, -- Professional
    TRUE
) ON CONFLICT (id) DO NOTHING;

-- 2. Insert Admin User (Password: Admin@123456)
-- Hash generated for: Admin@123456
INSERT INTO users (id, tenant_id, full_name, email, password_hash, role, is_active)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Ahmed Al-Hassan',
    'admin@invoxa.com',
    '$2a$11$zwsCYieC7zvrqODR.1d.1OB8JMezkPTC1PXtNGjpWv/bj.DMy8xrS',
    1, -- Admin
    TRUE
) ON CONFLICT DO NOTHING;

-- 3. Insert Customers
INSERT INTO customers (id, tenant_id, name, contact_person, email, phone, address, vat_number, cr_number)
VALUES 
(
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    'Gulf Logistics & Trading Co.',
    'Mohammed Yousif',
    'finance@gulflogistics.bh',
    '+973 3940 1122',
    'Hidd Industrial Area, Kingdom of Bahrain',
    '200055443300002',
    'CR-120485-02'
),
(
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    'Manama Coffee Roasters',
    'Fatima Khalil',
    'orders@manamacoffee.bh',
    '+973 3611 7788',
    'Block 338, Adliya, Bahrain',
    '200088776600002',
    'CR-904812-01'
),
(
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Red Sea Consulting Group',
    'Dr. Tariq Mansoor',
    'accounts@redseaconsult.com',
    '+973 1755 8899',
    'Seef District, Almoayyed Tower, Bahrain',
    NULL,
    'CR-765432-01'
) ON CONFLICT (id) DO NOTHING;

-- 4. Insert Quotation
INSERT INTO quotations (id, tenant_id, customer_id, quotation_no, quotation_date, expiry_date, status, subtotal, discount_amount, tax_rate, tax_amount, total_amount, terms_and_conditions, notes)
VALUES (
    '44444444-4444-4444-4444-444444444441',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    'QT-2026-000001',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    3, -- Accepted
    450.0000,
    0.0000,
    10.00,
    45.0000,
    495.0000,
    'Validity: 30 days from issuance date. Payment terms: 50% upfront, 50% upon delivery.',
    'Includes 3 months of priority post-implementation support.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO quotation_items (id, quotation_id, description, quantity, unit_price, discount_percent, tax_rate, line_total)
VALUES 
(
    uuid_generate_v4(),
    '44444444-4444-4444-4444-444444444441',
    'Enterprise Network Infrastructure Setup & Security Audit',
    1,
    300.0000,
    0,
    10.00,
    330.0000
),
(
    uuid_generate_v4(),
    '44444444-4444-4444-4444-444444444441',
    'Managed Firewall Hardware Appliance & Cloud Sync',
    1,
    150.0000,
    0,
    10.00,
    165.0000
) ON CONFLICT DO NOTHING;

-- 5. Insert Invoices
INSERT INTO invoices (id, tenant_id, customer_id, quotation_id, invoice_no, invoice_date, due_date, status, subtotal, discount_amount, tax_rate, tax_amount, total_amount, paid_amount, balance_amount, terms_and_conditions)
VALUES 
(
    '55555555-5555-5555-5555-555555555551',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333331',
    '44444444-4444-4444-4444-444444444441',
    'INV-2026-000001',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '9 days',
    2, -- PartiallyPaid
    450.0000,
    0.0000,
    10.00,
    45.0000,
    495.0000,
    200.0000,
    295.0000,
    'Please send payment via BenefitPay to IBAN BH98BBKU00001234567890 or Bank Transfer.'
),
(
    '55555555-5555-5555-5555-555555555552',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333332',
    NULL,
    'INV-2026-000002',
    CURRENT_DATE - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '13 days',
    1, -- Pending
    120.0000,
    0.0000,
    10.00,
    12.0000,
    132.0000,
    0.0000,
    132.0000,
    'Net 14 days payment.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, discount_percent, tax_rate, line_total)
VALUES 
(
    uuid_generate_v4(),
    '55555555-5555-5555-5555-555555555551',
    'Enterprise Network Infrastructure Setup & Security Audit',
    1,
    300.0000,
    0,
    10.00,
    330.0000
),
(
    uuid_generate_v4(),
    '55555555-5555-5555-5555-555555555551',
    'Managed Firewall Hardware Appliance & Cloud Sync',
    1,
    150.0000,
    0,
    10.00,
    165.0000
),
(
    uuid_generate_v4(),
    '55555555-5555-5555-5555-555555555552',
    'POS System Maintenance & Cloud Backup Support (Monthly)',
    1,
    120.0000,
    0,
    10.00,
    132.0000
) ON CONFLICT DO NOTHING;

-- 6. Insert Payment for Invoice 1
INSERT INTO payments (id, tenant_id, invoice_id, amount, payment_date, payment_method, reference_no, notes)
VALUES (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555551',
    200.0000,
    CURRENT_DATE - INTERVAL '2 days',
    3, -- BenefitPay
    'BP-99882211',
    'Advance 50% deposit received via BenefitPay'
) ON CONFLICT (id) DO NOTHING;
