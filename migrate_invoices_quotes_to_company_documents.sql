-- Migration des factures et devis existants vers company_documents
-- Ce script crée des liens entre les invoices/quotes existants et les entreprises

-- ===================================================================
-- ÉTAPE 1: Créer des documents pour les FACTURES (Invoices)
-- ===================================================================

INSERT INTO company_documents (
    uuid,
    company_id,
    organization_id,
    uploaded_by,
    name,
    original_filename,
    file_path,
    file_type,
    mime_type,
    file_size,
    description,
    document_date,
    reference_number,
    expiry_date,
    is_shared,
    is_archived,
    created_at,
    updated_at
)
SELECT
    UUID() as uuid,
    c.id as company_id,
    i.organization_id,
    NULL as uploaded_by,
    CONCAT('Facture ', i.invoice_number) as name,
    CONCAT('facture_', i.invoice_number, '.pdf') as original_filename,
    CONCAT('legacy/invoices/', i.id, '/invoice.pdf') as file_path,
    'invoice' as file_type,
    'application/pdf' as mime_type,
    0 as file_size,
    CONCAT('Facture générée depuis le système - Montant: ', i.total, ' €') as description,
    i.issue_date as document_date,
    i.invoice_number as reference_number,
    i.due_date as expiry_date,
    true as is_shared,
    CASE
        WHEN i.status = 'cancelled' THEN true
        ELSE false
    END as is_archived,
    i.created_at,
    i.updated_at
FROM invoices i
INNER JOIN clients cl ON i.client_id = cl.id
INNER JOIN companies c ON (
    -- Matcher par nom de l'entreprise (approximatif)
    LOWER(TRIM(cl.company_name)) = LOWER(TRIM(c.name))
    AND cl.organization_id = c.organization_id
)
WHERE i.organization_id IS NOT NULL
  AND cl.company_name IS NOT NULL
  AND cl.company_name != ''
  -- Éviter les doublons
  AND NOT EXISTS (
      SELECT 1 FROM company_documents cd
      WHERE cd.reference_number = i.invoice_number
        AND cd.file_type = 'invoice'
        AND cd.company_id = c.id
  );

-- ===================================================================
-- ÉTAPE 2: Créer des documents pour les DEVIS (Quotes)
-- ===================================================================

INSERT INTO company_documents (
    uuid,
    company_id,
    organization_id,
    uploaded_by,
    name,
    original_filename,
    file_path,
    file_type,
    mime_type,
    file_size,
    description,
    document_date,
    reference_number,
    expiry_date,
    is_shared,
    is_archived,
    created_at,
    updated_at
)
SELECT
    UUID() as uuid,
    c.id as company_id,
    q.organization_id,
    NULL as uploaded_by,
    CONCAT('Devis ', q.quote_number) as name,
    CONCAT('devis_', q.quote_number, '.pdf') as original_filename,
    CONCAT('legacy/quotes/', q.id, '/quote.pdf') as file_path,
    'quote' as file_type,
    'application/pdf' as mime_type,
    0 as file_size,
    CONCAT('Devis généré depuis le système - Montant: ', q.total, ' €, Statut: ', q.status) as description,
    q.issue_date as document_date,
    q.quote_number as reference_number,
    q.expiry_date as expiry_date,
    true as is_shared,
    CASE
        WHEN q.status IN ('cancelled', 'rejected') THEN true
        ELSE false
    END as is_archived,
    q.created_at,
    q.updated_at
FROM quotes q
INNER JOIN clients cl ON q.client_id = cl.id
INNER JOIN companies c ON (
    -- Matcher par nom de l'entreprise (approximatif)
    LOWER(TRIM(cl.company_name)) = LOWER(TRIM(c.name))
    AND cl.organization_id = c.organization_id
)
WHERE q.organization_id IS NOT NULL
  AND cl.company_name IS NOT NULL
  AND cl.company_name != ''
  -- Éviter les doublons
  AND NOT EXISTS (
      SELECT 1 FROM company_documents cd
      WHERE cd.reference_number = q.quote_number
        AND cd.file_type = 'quote'
        AND cd.company_id = c.id
  );

-- ===================================================================
-- ÉTAPE 3: Vérification
-- ===================================================================

-- Compter les factures migrées
SELECT
    'Factures migrées' as type,
    COUNT(*) as count
FROM company_documents
WHERE file_type = 'invoice'
  AND file_path LIKE 'legacy/invoices/%'

UNION ALL

-- Compter les devis migrés
SELECT
    'Devis migrés' as type,
    COUNT(*) as count
FROM company_documents
WHERE file_type = 'quote'
  AND file_path LIKE 'legacy/quotes/%'

UNION ALL

-- Compter les factures NON migrées (pas de match company)
SELECT
    'Factures NON migrées (pas de match)' as type,
    COUNT(DISTINCT i.id) as count
FROM invoices i
INNER JOIN clients cl ON i.client_id = cl.id
LEFT JOIN companies c ON (
    LOWER(TRIM(cl.company_name)) = LOWER(TRIM(c.name))
    AND cl.organization_id = c.organization_id
)
WHERE c.id IS NULL
  AND cl.company_name IS NOT NULL
  AND cl.company_name != ''

UNION ALL

-- Compter les devis NON migrés (pas de match company)
SELECT
    'Devis NON migrés (pas de match)' as type,
    COUNT(DISTINCT q.id) as count
FROM quotes q
INNER JOIN clients cl ON q.client_id = cl.id
LEFT JOIN companies c ON (
    LOWER(TRIM(cl.company_name)) = LOWER(TRIM(c.name))
    AND cl.organization_id = c.organization_id
)
WHERE c.id IS NULL
  AND cl.company_name IS NOT NULL
  AND cl.company_name != '';

-- ===================================================================
-- ÉTAPE 4: Liste des entreprises avec leurs documents
-- ===================================================================

SELECT
    c.name as entreprise,
    c.siret,
    COUNT(cd.id) as nombre_documents,
    SUM(CASE WHEN cd.file_type = 'invoice' THEN 1 ELSE 0 END) as factures,
    SUM(CASE WHEN cd.file_type = 'quote' THEN 1 ELSE 0 END) as devis
FROM companies c
LEFT JOIN company_documents cd ON c.id = cd.company_id
GROUP BY c.id, c.name, c.siret
HAVING nombre_documents > 0
ORDER BY nombre_documents DESC
LIMIT 50;
