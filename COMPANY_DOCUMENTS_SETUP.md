# Configuration de la table company_documents

Ce document explique comment configurer la gestion des documents pour les entreprises.

## 1. Créer la table dans la base de données

### Option A: Via MySQL/phpMyAdmin

1. Ouvrez phpMyAdmin ou votre client MySQL
2. Sélectionnez la base de données `formly_saas`
3. Allez dans l'onglet "SQL"
4. Copiez-collez tout le contenu du fichier `create_company_documents_table.sql`
5. Cliquez sur "Exécuter"

### Option B: Via ligne de commande

```bash
# Depuis le dossier racine du projet
mysql -u root -p formly_saas < create_company_documents_table.sql
```

### Option C: Via Laravel Tinker (si MySQL n'est pas accessible directement)

```bash
php artisan tinker
```

Puis dans tinker:
```php
DB::statement("
CREATE TABLE IF NOT EXISTS `company_documents` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `company_id` BIGINT UNSIGNED NOT NULL,
  `organization_id` BIGINT UNSIGNED NOT NULL,
  `uploaded_by` BIGINT UNSIGNED NULL,
  `name` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` VARCHAR(50) NULL COMMENT 'contract, convention, invoice, quote, other',
  `mime_type` VARCHAR(100) NULL,
  `file_size` BIGINT NULL COMMENT 'Size in bytes',
  `description` TEXT NULL,
  `document_date` DATE NULL COMMENT 'Date du document (facture, contrat, etc.)',
  `reference_number` VARCHAR(100) NULL COMMENT 'Numéro de référence (facture, contrat)',
  `expiry_date` DATE NULL COMMENT 'Date d\'expiration (pour contrats)',
  `is_shared` BOOLEAN DEFAULT FALSE COMMENT 'Shared with company portal',
  `is_archived` BOOLEAN DEFAULT FALSE,
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
");
```

## 2. Vérifier la création

Pour vérifier que la table a été créée correctement:

```sql
DESC company_documents;
```

Ou dans tinker:
```php
DB::select("DESC company_documents");
```

## 3. Tester la fonctionnalité

Une fois la table créée et le code déployé:

1. Accédez à la page des entreprises: `http://localhost:5173/edufirma/entreprises`
2. Cliquez sur une entreprise pour ouvrir le modal
3. Allez dans l'onglet "Documents"
4. Testez l'upload d'un document
5. Testez le téléchargement du document
6. Testez la suppression du document

## 4. Types de documents supportés

Les types de documents suivants sont disponibles:
- `contract` - Contrat
- `convention` - Convention
- `invoice` - Facture
- `quote` - Devis
- `other` - Autre

## 5. Stockage des fichiers

Les fichiers sont stockés dans:
```
storage/app/public/organizations/{organization_id}/companies/{company_id}/documents/
```

Assurez-vous que le dossier storage est accessible en écriture:
```bash
chmod -R 775 storage
```

Et que le lien symbolique est créé:
```bash
php artisan storage:link
```

## 6. Fonctionnalités implémentées

✅ Upload de documents (PDF, images, etc.)
✅ Liste des documents avec pagination
✅ Téléchargement de documents
✅ Suppression de documents (soft delete)
✅ Filtrage par type de document
✅ Métadonnées (date document, numéro référence, description)
✅ Traçabilité (qui a uploadé, quand)
✅ Affichage de la taille du fichier formatée

## 7. Limites

- Taille maximale de fichier: 10 MB
- Stockage local (peut être migré vers S3/cloud storage si nécessaire)
