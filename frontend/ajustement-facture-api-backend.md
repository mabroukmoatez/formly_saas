# Ajustement Facture API Backend

## Vue d'ensemble

Ce document décrit les ajustements nécessaires pour l'endpoint API des factures afin de supporter les nouveaux filtres implémentés dans le frontend.

## Endpoint concerné

```
GET /api/organization/commercial/invoices
```

## Paramètres de requête à ajouter

L'endpoint doit maintenant accepter les paramètres suivants en plus des paramètres existants :

### Paramètres existants (déjà supportés)
- `page` (number) : Numéro de page pour la pagination
- `per_page` (number) : Nombre d'éléments par page
- `search` (string) : Recherche textuelle (par client)
- `status` (string) : Statut de la facture

### Nouveaux paramètres à ajouter

#### 1. Filtrage par montant TTC

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `min_amount` | number | Montant minimum TTC (inclus) | `1000` |
| `max_amount` | number | Montant maximum TTC (inclus) | `5000` |

**Logique de filtrage :**
- Filtrer les factures où `total_ttc` (ou `total_amount`) est >= `min_amount` (si fourni)
- Filtrer les factures où `total_ttc` (ou `total_amount`) est <= `max_amount` (si fourni)
- Si les deux sont fournis, appliquer les deux conditions (AND)

**Exemple de requête :**
```
GET /api/organization/commercial/invoices?min_amount=1000&max_amount=5000
```

#### 2. Filtrage par période (date)

| Paramètre | Type | Format | Description | Exemple |
|-----------|------|--------|-------------|---------|
| `date_from` | string | `YYYY-MM-DD` | Date de début (inclus) | `2025-01-01` |
| `date_to` | string | `YYYY-MM-DD` | Date de fin (inclus) | `2025-12-31` |

**Logique de filtrage :**
- Filtrer les factures où `issue_date` est >= `date_from` (si fourni)
- Filtrer les factures où `issue_date` est <= `date_to` (si fourni)
- Si les deux sont fournis, appliquer les deux conditions (AND)
- Les dates doivent être comparées au format date (pas de comparaison de strings)

**Exemple de requête :**
```
GET /api/organization/commercial/invoices?date_from=2025-01-01&date_to=2025-12-31
```

#### 3. Filtrage par type de client

| Paramètre | Type | Valeurs possibles | Description |
|-----------|------|-------------------|-------------|
| `client_type` | string | `particulier`, `company` | Type de client associé à la facture |

**Logique de filtrage :**
- Filtrer les factures où le client associé a le type `client_type`
- Le type du client se trouve généralement dans `client.type` ou `invoice.client.type`
- Valeurs possibles :
  - `particulier` : Client particulier
  - `company` : Client entreprise

**Exemple de requête :**
```
GET /api/organization/commercial/invoices?client_type=company
```

## Exemple de requête complète

```
GET /api/organization/commercial/invoices?page=1&per_page=12&search=client&status=paid&min_amount=1000&max_amount=5000&date_from=2025-01-01&date_to=2025-12-31&client_type=company
```

## Structure de réponse

La structure de réponse reste identique à l'endpoint actuel :

```json
{
  "success": true,
  "data": {
    "invoices": {
      "data": [
        {
          "id": "1",
          "invoice_number": "FAC-2025-001",
          "issue_date": "2025-01-15",
          "total_ttc": 2500.00,
          "total_amount": 2500.00,
          "status": "paid",
          "client": {
            "id": "1",
            "type": "company",
            "company_name": "Entreprise XYZ"
          }
        }
      ],
      "total": 50,
      "per_page": 12,
      "current_page": 1,
      "last_page": 5
    }
  }
}
```

## Logique de filtrage combinée

Tous les filtres doivent être combinés avec une logique **AND** :
- Si plusieurs filtres sont fournis, une facture doit satisfaire **tous** les critères pour être incluse dans les résultats
- Les filtres sont optionnels : si un filtre n'est pas fourni, il ne doit pas être appliqué

**Exemple :**
- `min_amount=1000` + `date_from=2025-01-01` + `client_type=company`
- Résultat : Factures de type "company" avec montant >= 1000 et date >= 2025-01-01

## Validation des paramètres

### Validation recommandée

1. **Montants :**
   - `min_amount` et `max_amount` doivent être des nombres positifs
   - Si `min_amount` > `max_amount`, retourner une erreur 400

2. **Dates :**
   - Format doit être `YYYY-MM-DD`
   - `date_from` ne doit pas être supérieure à `date_to`
   - Dates invalides doivent retourner une erreur 400

3. **Type de client :**
   - Doit être soit `particulier` soit `company`
   - Valeurs invalides doivent retourner une erreur 400

## Exemple d'erreur de validation

```json
{
  "success": false,
  "error": "Validation error",
  "message": "min_amount (5000) cannot be greater than max_amount (1000)"
}
```

## Implémentation suggérée (pseudo-code)

```php
// Exemple en PHP/Laravel
public function getInvoices(Request $request)
{
    $query = Invoice::query();
    
    // Filtres existants
    if ($request->has('search')) {
        $query->whereHas('client', function($q) use ($request) {
            $q->where('company_name', 'like', '%' . $request->search . '%')
              ->orWhere('first_name', 'like', '%' . $request->search . '%')
              ->orWhere('last_name', 'like', '%' . $request->search . '%');
        });
    }
    
    if ($request->has('status')) {
        $query->where('status', $request->status);
    }
    
    // Nouveaux filtres
    
    // Filtrage par montant
    if ($request->has('min_amount')) {
        $query->where(function($q) use ($request) {
            $q->where('total_ttc', '>=', $request->min_amount)
              ->orWhere('total_amount', '>=', $request->min_amount);
        });
    }
    
    if ($request->has('max_amount')) {
        $query->where(function($q) use ($request) {
            $q->where('total_ttc', '<=', $request->max_amount)
              ->orWhere('total_amount', '<=', $request->max_amount);
        });
    }
    
    // Filtrage par date
    if ($request->has('date_from')) {
        $query->where('issue_date', '>=', $request->date_from);
    }
    
    if ($request->has('date_to')) {
        $query->where('issue_date', '<=', $request->date_to);
    }
    
    // Filtrage par type de client
    if ($request->has('client_type')) {
        $query->whereHas('client', function($q) use ($request) {
            $q->where('type', $request->client_type);
        });
    }
    
    // Pagination
    $perPage = $request->get('per_page', 12);
    $invoices = $query->paginate($perPage);
    
    return response()->json([
        'success' => true,
        'data' => [
            'invoices' => $invoices
        ]
    ]);
}
```

## Tests à effectuer

1. **Test de filtrage par montant :**
   - `min_amount` seul
   - `max_amount` seul
   - `min_amount` et `max_amount` combinés
   - Cas limite : `min_amount` = `max_amount`

2. **Test de filtrage par date :**
   - `date_from` seul
   - `date_to` seul
   - `date_from` et `date_to` combinés
   - Cas limite : même date pour `date_from` et `date_to`

3. **Test de filtrage par type :**
   - `client_type=particulier`
   - `client_type=company`
   - Type invalide (doit retourner erreur)

4. **Test de combinaison de filtres :**
   - Tous les filtres combinés
   - Filtres existants + nouveaux filtres

5. **Test de validation :**
   - `min_amount` > `max_amount` (erreur attendue)
   - `date_from` > `date_to` (erreur attendue)
   - Format de date invalide (erreur attendue)
   - Type de client invalide (erreur attendue)

## Notes importantes

1. **Compatibilité ascendante :** Tous les nouveaux paramètres sont optionnels. L'API doit continuer à fonctionner sans ces paramètres pour maintenir la compatibilité avec les clients existants.

2. **Performance :** Assurez-vous que les index de base de données sont appropriés pour les colonnes utilisées dans les filtres :
   - `total_ttc` / `total_amount`
   - `issue_date`
   - `client.type` (via relation)

3. **Ordre des filtres :** L'ordre d'application des filtres n'a pas d'importance car ils sont combinés avec AND.

4. **Format des montants :** Les montants sont envoyés comme nombres décimaux. Assurez-vous de gérer correctement les comparaisons de nombres décimaux dans votre base de données.

## Checklist d'implémentation

- [ ] Ajouter la validation pour `min_amount` et `max_amount`
- [ ] Ajouter la validation pour `date_from` et `date_to`
- [ ] Ajouter la validation pour `client_type`
- [ ] Implémenter le filtrage par montant TTC
- [ ] Implémenter le filtrage par période (dates)
- [ ] Implémenter le filtrage par type de client
- [ ] Tester tous les filtres individuellement
- [ ] Tester la combinaison de tous les filtres
- [ ] Tester les cas d'erreur de validation
- [ ] Vérifier les performances avec des jeux de données importants
- [ ] Mettre à jour la documentation API
- [ ] Ajouter des index de base de données si nécessaire

## Contact

Pour toute question concernant ces ajustements, contactez l'équipe frontend.







