# Ajustement Facture Actions API Backend

## Vue d'ensemble

Ce document décrit les ajustements nécessaires pour l'API des factures afin de supporter les nouvelles fonctionnalités d'export PDF groupé et de relance multiple implémentées dans le frontend.

## Endpoints concernés

### 1. Export PDF groupé (Optionnel - actuellement géré côté frontend)

**Endpoint proposé :**
```
POST /api/organization/commercial/invoices/export-pdf-bulk
```

**Description :**
Permet d'exporter plusieurs factures en un seul fichier PDF groupé.

**Body (JSON) :**
```json
{
  "invoice_ids": ["1", "2", "3"]
}
```

**Réponse :**
- Type : `application/pdf` (Blob)
- Un fichier PDF contenant toutes les factures sélectionnées

**Note :** Actuellement, le frontend génère un PDF par facture individuellement. Cette fonctionnalité est optionnelle mais recommandée pour améliorer l'expérience utilisateur.

---

### 2. Relance multiple par email (Déjà supporté)

**Endpoint existant :**
```
POST /api/organization/commercial/invoices/{id}/send-email
```

**Description :**
L'endpoint existant supporte déjà l'envoi d'email pour une facture. Pour la relance multiple, le frontend appelle cet endpoint en boucle pour chaque facture sélectionnée.

**Body (JSON) :**
```json
{
  "email": "client@example.com",
  "cc": ["cc1@example.com"],
  "bcc": ["bcc1@example.com"],
  "subject": "Facture FAC-2025-001",
  "message": "Message personnalisé"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": null,
  "message": "Email envoyé avec succès"
}
```

**Note :** L'implémentation actuelle fonctionne déjà. Si vous souhaitez optimiser, vous pouvez créer un endpoint pour l'envoi groupé :

**Endpoint proposé (Optionnel) :**
```
POST /api/organization/commercial/invoices/send-email-bulk
```

**Body (JSON) :**
```json
{
  "invoice_ids": ["1", "2", "3"],
  "email": "client@example.com",
  "cc": ["cc1@example.com"],
  "bcc": ["bcc1@example.com"],
  "subject": "Relance factures",
  "message": "Message personnalisé"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "sent": 3,
    "failed": 0,
    "failed_ids": []
  },
  "message": "3 email(s) envoyé(s) avec succès"
}
```

---

## Implémentation actuelle (Frontend)

### Export PDF
Le frontend utilise actuellement l'endpoint existant `GET /api/organization/commercial/invoices/{id}/pdf` en boucle pour chaque facture sélectionnée. Chaque PDF est téléchargé individuellement.

**Code actuel :**
```typescript
for (const id of invoiceIds) {
  const blob = await commercialService.generateInvoicePdf(id);
  // Télécharger chaque PDF individuellement
}
```

### Relance par email
Le frontend utilise l'endpoint existant `POST /api/organization/commercial/invoices/{id}/send-email` en boucle pour chaque facture sélectionnée.

**Code actuel :**
```typescript
for (const id of invoiceIds) {
  await commercialService.sendInvoiceEmail(id, emailData);
}
```

---

## Recommandations d'optimisation

### 1. Export PDF groupé (Recommandé)

**Avantages :**
- Un seul fichier PDF au lieu de plusieurs
- Meilleure expérience utilisateur
- Réduction du nombre de requêtes HTTP

**Implémentation suggérée :**
```php
// Exemple en PHP/Laravel
public function exportPdfBulk(Request $request)
{
    $invoiceIds = $request->input('invoice_ids');
    
    // Valider les IDs
    $invoices = Invoice::whereIn('id', $invoiceIds)
        ->where('organization_id', auth()->user()->organization_id)
        ->get();
    
    if ($invoices->isEmpty()) {
        return response()->json([
            'success' => false,
            'message' => 'Aucune facture trouvée'
        ], 404);
    }
    
    // Générer un PDF groupé
    $pdf = PDF::loadView('invoices.bulk', ['invoices' => $invoices]);
    
    return $pdf->download('factures_' . date('Y-m-d') . '.pdf');
}
```

### 2. Relance multiple optimisée (Optionnel)

**Avantages :**
- Une seule requête HTTP au lieu de plusieurs
- Meilleure gestion des erreurs
- Rapport détaillé des envois réussis/échoués

**Implémentation suggérée :**
```php
// Exemple en PHP/Laravel
public function sendEmailBulk(Request $request)
{
    $invoiceIds = $request->input('invoice_ids');
    $emailData = $request->only(['email', 'cc', 'bcc', 'subject', 'message']);
    
    $results = [
        'sent' => 0,
        'failed' => 0,
        'failed_ids' => []
    ];
    
    foreach ($invoiceIds as $invoiceId) {
        try {
            $invoice = Invoice::findOrFail($invoiceId);
            
            // Envoyer l'email
            Mail::to($emailData['email'])
                ->cc($emailData['cc'] ?? [])
                ->bcc($emailData['bcc'] ?? [])
                ->send(new InvoiceEmail($invoice, $emailData));
            
            $results['sent']++;
        } catch (\Exception $e) {
            $results['failed']++;
            $results['failed_ids'][] = $invoiceId;
        }
    }
    
    return response()->json([
        'success' => true,
        'data' => $results,
        'message' => "{$results['sent']} email(s) envoyé(s) avec succès"
    ]);
}
```

---

## Structure de réponse recommandée

### Export PDF groupé

**Succès :**
- Content-Type: `application/pdf`
- Body: Fichier PDF binaire
- Headers: `Content-Disposition: attachment; filename="factures_2025-01-15.pdf"`

**Erreur :**
```json
{
  "success": false,
  "error": "Validation error",
  "message": "Aucune facture trouvée pour les IDs fournis"
}
```

### Relance multiple (si implémenté)

**Succès :**
```json
{
  "success": true,
  "data": {
    "sent": 3,
    "failed": 0,
    "failed_ids": []
  },
  "message": "3 email(s) envoyé(s) avec succès"
}
```

**Erreur partielle :**
```json
{
  "success": true,
  "data": {
    "sent": 2,
    "failed": 1,
    "failed_ids": ["3"]
  },
  "message": "2 email(s) envoyé(s), 1 échec"
}
```

---

## Validation des paramètres

### Export PDF groupé

1. **invoice_ids :**
   - Doit être un tableau non vide
   - Maximum 50 factures par requête (recommandé)
   - Tous les IDs doivent appartenir à l'organisation de l'utilisateur

2. **Permissions :**
   - L'utilisateur doit avoir accès à toutes les factures demandées
   - Vérifier les permissions d'organisation

### Relance multiple

1. **invoice_ids :**
   - Doit être un tableau non vide
   - Maximum 50 factures par requête (recommandé)
   - Tous les IDs doivent appartenir à l'organisation de l'utilisateur

2. **email :**
   - Format email valide
   - Requis

3. **cc / bcc :**
   - Tableaux d'emails valides (optionnel)

4. **subject / message :**
   - Chaînes de caractères (optionnel)

---

## Tests à effectuer

### Export PDF groupé

1. **Test de base :**
   - Exporter 1 facture
   - Exporter 5 factures
   - Exporter 50 factures (limite)

2. **Test de validation :**
   - IDs invalides (erreur attendue)
   - IDs d'une autre organisation (erreur attendue)
   - Tableau vide (erreur attendue)

3. **Test de performance :**
   - Temps de génération pour 10 factures
   - Temps de génération pour 50 factures
   - Taille du fichier PDF généré

### Relance multiple

1. **Test de base :**
   - Envoyer à 1 facture
   - Envoyer à 5 factures
   - Envoyer à 50 factures (limite)

2. **Test de validation :**
   - Email invalide (erreur attendue)
   - IDs invalides (erreur attendue)
   - IDs d'une autre organisation (erreur attendue)

3. **Test d'erreurs partielles :**
   - Certaines factures sans email client (gérer gracieusement)
   - Certaines factures invalides (rapport d'erreur)

---

## Sécurité

1. **Authentification :**
   - Toutes les requêtes doivent être authentifiées
   - Vérifier le token JWT

2. **Autorisation :**
   - Vérifier que l'utilisateur a accès à l'organisation
   - Vérifier que toutes les factures appartiennent à l'organisation de l'utilisateur

3. **Rate Limiting :**
   - Limiter le nombre de requêtes par minute
   - Limiter le nombre de factures par requête (max 50 recommandé)

4. **Validation des données :**
   - Valider tous les paramètres d'entrée
   - Sanitizer les emails
   - Vérifier les formats de données

---

## Checklist d'implémentation

### Export PDF groupé (Optionnel)
- [ ] Créer l'endpoint `POST /api/organization/commercial/invoices/export-pdf-bulk`
- [ ] Valider les IDs de factures
- [ ] Vérifier les permissions
- [ ] Générer le PDF groupé
- [ ] Tester avec différentes quantités de factures
- [ ] Gérer les erreurs
- [ ] Documenter l'endpoint

### Relance multiple optimisée (Optionnel)
- [ ] Créer l'endpoint `POST /api/organization/commercial/invoices/send-email-bulk`
- [ ] Valider les IDs de factures
- [ ] Valider les données email
- [ ] Vérifier les permissions
- [ ] Envoyer les emails en boucle
- [ ] Gérer les erreurs partielles
- [ ] Retourner un rapport détaillé
- [ ] Tester avec différentes quantités de factures
- [ ] Documenter l'endpoint

### Améliorations générales
- [ ] Ajouter rate limiting
- [ ] Ajouter logging pour le suivi
- [ ] Optimiser les performances
- [ ] Ajouter des tests unitaires
- [ ] Ajouter des tests d'intégration
- [ ] Mettre à jour la documentation API

---

## Notes importantes

1. **Compatibilité :** Les endpoints existants doivent continuer à fonctionner pour maintenir la compatibilité avec les clients existants.

2. **Performance :** Pour l'export PDF groupé, considérer l'utilisation d'une queue (job queue) si le traitement prend trop de temps (> 5 secondes).

3. **Limites :** Implémenter des limites raisonnables pour éviter les abus :
   - Maximum 50 factures par requête
   - Maximum 10 requêtes par minute par utilisateur

4. **Logging :** Logger toutes les actions importantes pour le suivi et le debugging :
   - Export PDF groupé
   - Envois d'emails groupés
   - Erreurs

5. **Notifications :** Pour les opérations longues, considérer l'envoi d'une notification (email ou notification in-app) une fois l'opération terminée.

---

## Contact

Pour toute question concernant ces ajustements, contactez l'équipe frontend.







