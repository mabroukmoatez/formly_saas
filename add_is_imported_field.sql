-- Migration to add is_imported field and document_path to quotes and invoices tables
-- This allows tracking whether a document was imported from PDF or manually created
-- and storing the uploaded PDF file path

-- Add is_imported and imported_document_path columns to quotes table
ALTER TABLE `quotes`
ADD COLUMN `is_imported` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=manually created, 1=imported from PDF' AFTER `signed_document_path`,
ADD COLUMN `imported_document_path` VARCHAR(255) NULL COMMENT 'Path to the uploaded PDF file' AFTER `is_imported`;

-- Add is_imported and imported_document_path columns to invoices table
ALTER TABLE `invoices`
ADD COLUMN `is_imported` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0=manually created, 1=imported from PDF' AFTER `terms`,
ADD COLUMN `imported_document_path` VARCHAR(255) NULL COMMENT 'Path to the uploaded PDF file' AFTER `is_imported`;

-- Update existing quotes that were imported (have 'Devis importé' in designation)
UPDATE `quotes` q
INNER JOIN `quote_items` qi ON q.id = qi.quote_id
SET q.is_imported = 1
WHERE qi.designation LIKE '%Devis importé%' OR qi.description LIKE '%Devis importé depuis le fichier%';

-- Update existing invoices that were imported (have 'Facture importée' in designation)
UPDATE `invoices` i
INNER JOIN `invoice_items` ii ON i.id = ii.invoice_id
SET i.is_imported = 1
WHERE ii.designation LIKE '%Facture importée%' OR ii.description LIKE '%Facture importée depuis le fichier%';
