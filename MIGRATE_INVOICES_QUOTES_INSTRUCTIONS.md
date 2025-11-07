# Migration des Factures et Devis vers Company Documents

Ce document explique comment migrer les factures et devis existants vers le nouveau système de documents des entreprises.

## Contexte

Les factures (`invoices`) et devis (`quotes`) existants dans votre base de données sont actuellement liés à des `clients` via `client_id`. Les clients ont un champ `company_name` (texte libre).

Le script `migrate_invoices_quotes_to_company_documents.sql` crée des liens entre ces documents et la table `companies` en matchant `clients.company_name` avec `companies.name`.

## Fonctionnement du Script

### Étape 1: Migration des Factures

- Trouve toutes les `invoices` dont le client a un `company_name`
- Matche avec la table `companies` par nom (case-insensitive)
- Crée des enregistrements dans `company_documents` avec:
  - `file_type` = 'invoice'
  - `reference_number` = numéro de facture
  - `document_date` = date d'émission
  - `expiry_date` = date d'échéance
  - `name` = "Facture [numéro]"
  - `file_path` = "legacy/invoices/{id}/invoice.pdf"

### Étape 2: Migration des Devis

- Trouve tous les `quotes` dont le client a un `company_name`
- Matche avec la table `companies` par nom (case-insensitive)
- Crée des enregistrements dans `company_documents` avec:
  - `file_type` = 'quote'
  - `reference_number` = numéro de devis
  - `document_date` = date d'émission
  - `expiry_date` = date d'expiration
  - `name` = "Devis [numéro]"
  - `file_path` = "legacy/quotes/{id}/quote.pdf"

### Étape 3: Vérification

Le script affiche des statistiques:
- Nombre de factures migrées
- Nombre de devis migrés
- Nombre de factures NON migrées (pas de match)
- Nombre de devis NON migrés (pas de match)

### Étape 4: Liste des Entreprises

Affiche les 50 entreprises avec le plus de documents migrés.

## Comment Exécuter

### Option A: Via phpMyAdmin/MySQL Workbench

1. Ouvrez phpMyAdmin ou MySQL Workbench
2. Sélectionnez la base de données `formly_saas`
3. Ouvrez l'onglet "SQL"
4. Copiez-collez le contenu de `migrate_invoices_quotes_to_company_documents.sql`
5. Exécutez la requête

### Option B: Via ligne de commande

```bash
mysql -u root -p formly_saas < migrate_invoices_quotes_to_company_documents.sql
```

### Option C: Via Laravel Tinker

```bash
php artisan tinker
```

Puis dans tinker, copiez section par section (INSERT INTO, puis SELECT pour vérification).

## ⚠️ Important: Fichiers Physiques

**Le script crée des enregistrements en base de données mais ne crée PAS les fichiers physiques.**

Les chemins créés (`legacy/invoices/...`, `legacy/quotes/...`) sont des **placeholders**.

### Si vous avez les PDFs générés

Si votre système génère des PDFs pour les factures/devis et les stocke quelque part:

1. Localisez où ces PDFs sont stockés
2. Copiez-les vers `storage/app/public/legacy/invoices/` et `storage/app/public/legacy/quotes/`
3. Organisez-les par ID: `storage/app/public/legacy/invoices/{invoice_id}/invoice.pdf`

### Si vous n'avez pas les PDFs

Si les factures/devis ne sont que dans la DB (pas de PDFs générés):

**Option 1**: Générer les PDFs après coup
- Créez un script pour regénérer les PDFs à partir des données DB
- Stockez-les dans le bon chemin

**Option 2**: Marquer comme archivés
```sql
UPDATE company_documents
SET is_archived = true
WHERE file_path LIKE 'legacy/%';
```

**Option 3**: Supprimer les enregistrements migrés
```sql
DELETE FROM company_documents
WHERE file_path LIKE 'legacy/%';
```

## Matching Client → Company

Le script matche par **nom exact** (insensible à la casse et aux espaces).

### Exemples de Match

✅ Match:
- `clients.company_name` = "ACME Corp"
- `companies.name` = "acme corp"

✅ Match:
- `clients.company_name` = "  ABC Company  "
- `companies.name` = "ABC Company"

❌ Pas de match:
- `clients.company_name` = "ACME Corporation"
- `companies.name` = "ACME Corp"

### Améliorer le Matching

Si beaucoup de factures/devis ne matchent pas, vous pouvez:

1. **Améliorer les noms dans `companies`** avant d'exécuter le script:
```sql
-- Exemple: standardiser "Corp" en "Corporation"
UPDATE companies
SET name = REPLACE(name, ' Corp', ' Corporation')
WHERE name LIKE '% Corp';
```

2. **Ou créer un mapping manuel** dans une table temporaire:
```sql
CREATE TEMPORARY TABLE client_company_mapping (
    client_id INT,
    company_id INT
);

INSERT INTO client_company_mapping VALUES
(123, 456), -- client_id 123 → company_id 456
(789, 101);

-- Puis utiliser cette table dans le script au lieu du match par nom
```

## Vérification Après Migration

### 1. Compter les documents

```sql
SELECT
    file_type,
    COUNT(*) as total,
    SUM(CASE WHEN is_archived THEN 1 ELSE 0 END) as archived
FROM company_documents
GROUP BY file_type;
```

### 2. Voir les entreprises avec le plus de documents

```sql
SELECT
    c.name,
    COUNT(cd.id) as docs_count,
    SUM(CASE WHEN cd.file_type = 'invoice' THEN 1 ELSE 0 END) as invoices,
    SUM(CASE WHEN cd.file_type = 'quote' THEN 1 ELSE 0 END) as quotes
FROM companies c
JOIN company_documents cd ON c.id = cd.company_id
GROUP BY c.id, c.name
ORDER BY docs_count DESC
LIMIT 10;
```

### 3. Tester dans l'interface

1. Accédez à `http://localhost:5173/edufirma/entreprises`
2. Cliquez sur une entreprise qui devrait avoir des docs
3. Allez dans l'onglet "Documents"
4. Vérifiez que les factures et devis apparaissent

## Rollback

Si vous voulez annuler la migration:

```sql
-- Supprimer TOUS les documents legacy
DELETE FROM company_documents
WHERE file_path LIKE 'legacy/%';

-- Ou supprimer uniquement les invoices
DELETE FROM company_documents
WHERE file_type = 'invoice' AND file_path LIKE 'legacy/invoices/%';

-- Ou supprimer uniquement les quotes
DELETE FROM company_documents
WHERE file_type = 'quote' AND file_path LIKE 'legacy/quotes/%';
```

## Support

En cas de problème:
1. Vérifiez les logs MySQL pour les erreurs
2. Vérifiez que la table `company_documents` existe (cf. `COMPANY_DOCUMENTS_SETUP.md`)
3. Vérifiez que les noms dans `companies` correspondent aux `company_name` dans `clients`
