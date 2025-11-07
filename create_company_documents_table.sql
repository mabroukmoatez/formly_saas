-- Table: company_documents
-- Purpose: Store documents related to companies (contracts, conventions, invoices, etc.)

CREATE TABLE IF NOT EXISTS `company_documents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `organization_id` BIGINT UNSIGNED NOT NULL,
  `uploaded_by` BIGINT UNSIGNED NULL,

  -- Document info
  `name` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50) NULL COMMENT 'contract, convention, invoice, quote, other',
  `mime_type` VARCHAR(100) NULL,
  `file_size` BIGINT NULL COMMENT 'Size in bytes',

  -- Metadata
  `description` TEXT NULL,
  `document_date` DATE NULL COMMENT 'Date du document (facture, contrat, etc.)',
  `reference_number` VARCHAR(100) NULL COMMENT 'Numéro de référence (facture, contrat)',
  `expiry_date` DATE NULL COMMENT 'Date d\'expiration (pour contrats)',

  -- Visibility
  `is_shared` BOOLEAN DEFAULT FALSE COMMENT 'Shared with company portal',
  `is_archived` BOOLEAN DEFAULT FALSE,

  -- Timestamps
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `company_documents_uuid_unique` (`uuid`),
  KEY `company_documents_company_id_index` (`company_id`),
  KEY `company_documents_organization_id_index` (`organization_id`),
  KEY `company_documents_uploaded_by_index` (`uploaded_by`),
  KEY `company_documents_file_type_index` (`file_type`),
  KEY `company_documents_created_at_index` (`created_at`),

  CONSTRAINT `company_documents_company_id_foreign`
    FOREIGN KEY (`company_id`)
    REFERENCES `companies` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `company_documents_organization_id_foreign`
    FOREIGN KEY (`organization_id`)
    REFERENCES `organizations` (`id`)
    ON DELETE CASCADE,

  CONSTRAINT `company_documents_uploaded_by_foreign`
    FOREIGN KEY (`uploaded_by`)
    REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
