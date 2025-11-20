# Vérification BPF (Bilan Pédagogique et Financier)

## Résumé Exécutif

⚠️ **Statut : PARTIELLEMENT CONNECTÉ** - 70/100

**Problèmes identifiés :**
1. ❌ **Pas de récupération automatique des données commerciales** (formations, sessions, apprenants)
2. ✅ **Endpoints corrects** mais manque d'intégration avec données commerciales
3. ✅ **Sauvegarde fonctionnelle** mais pourrait être améliorée
4. ⚠️ **Pas de pré-remplissage automatique** depuis les données commerciales

---

## 1. Analyse de la Logique BPF

### ✅ Points Positifs

1. **Structure du formulaire complète**
   - Sections A à H bien définies
   - Calculs automatiques des totaux
   - Gestion des états (draft, submitted, approved)
   - Historique des modifications

2. **Endpoints API corrects**
   - `GET /api/quality/bpf` - Liste des BPF
   - `GET /api/quality/bpf/{id}` - Détails d'un BPF
   - `POST /api/quality/bpf` - Création
   - `PUT /api/quality/bpf/{id}` - Mise à jour
   - `POST /api/quality/bpf/{id}/submit` - Soumission
   - `GET /api/quality/bpf/{id}/history` - Historique
   - `GET /api/quality/bpf/archives` - Archives
   - `GET /api/quality/bpf/{id}/export` - Export PDF/Excel
   - `DELETE /api/quality/bpf/{id}` - Suppression

3. **Sauvegarde fonctionnelle**
   - `updateQualityBPF` et `createQualityBPF` sont bien implémentés
   - Gestion des erreurs en place

### ❌ Problèmes Identifiés

1. **Pas de récupération des données commerciales**
   - Le BPF devrait récupérer automatiquement :
     - **Formations** (courses) pour les sections F (formations dispensées)
     - **Sessions** pour calculer les heures et nombres d'apprenants
     - **Apprenants** pour les statistiques par type de formation
     - **Financements** pour la section C (origine des produits)
     - **Formateurs** pour la section E (personnel)

2. **Pré-remplissage manuel uniquement**
   - L'utilisateur doit saisir manuellement toutes les données
   - Pas d'import automatique depuis les données commerciales

3. **Pas de validation croisée**
   - Pas de vérification que les données BPF correspondent aux données commerciales
   - Pas d'alerte si les totaux ne correspondent pas

---

## 2. Données Commerciales Nécessaires

### Section C - Bilan Financier
**Besoin :** Récupérer les financements par type
- Contrats d'apprentissage
- Contrats de professionnalisation
- CPF (Compte Personnel de Formation)
- Financements publics
- Financements privés

**Endpoint nécessaire :** 
```
GET /api/commercial/financements?year={year}&from={date}&to={date}
```

### Section E - Personnel
**Besoin :** Récupérer les formateurs et leurs heures
- Formateurs internes
- Formateurs externes
- Nombre d'heures par formateur

**Endpoint nécessaire :**
```
GET /api/commercial/formateurs?year={year}&from={date}&to={date}
```

### Section F - Formations Dispensées
**Besoin :** Récupérer les formations et sessions
- Liste des formations dispensées
- Nombre d'apprenants par formation
- Nombre d'heures par formation
- Type de formation (présentiel, distanciel, mixte)
- Niveau de formation (RNCP, etc.)

**Endpoints nécessaires :**
```
GET /api/commercial/courses?year={year}&from={date}&to={date}
GET /api/commercial/sessions?year={year}&from={date}&to={date}&course_uuid={uuid}
GET /api/commercial/learners?session_id={id}&year={year}
```

### Section G - Synthèse
**Besoin :** Calculer automatiquement les totaux
- Total nombre d'apprenants
- Total heures de formation

**Calcul automatique possible** depuis les données des sections F

---

## 3. Endpoints Actuels

### ✅ Endpoints BPF (Corrects)

| Endpoint | Méthode | Statut | Description |
|----------|---------|--------|-------------|
| `/api/quality/bpf` | GET | ✅ | Liste des BPF |
| `/api/quality/bpf` | POST | ✅ | Créer un BPF |
| `/api/quality/bpf/{id}` | GET | ✅ | Détails d'un BPF |
| `/api/quality/bpf/{id}` | PUT | ✅ | Mettre à jour un BPF |
| `/api/quality/bpf/{id}` | DELETE | ✅ | Supprimer un BPF |
| `/api/quality/bpf/{id}/submit` | POST | ✅ | Soumettre un BPF |
| `/api/quality/bpf/{id}/history` | GET | ✅ | Historique |
| `/api/quality/bpf/archives` | GET | ✅ | Archives |
| `/api/quality/bpf/{id}/export` | GET | ✅ | Export PDF/Excel |

### ❌ Endpoints Manquants pour Données Commerciales

| Endpoint | Méthode | Statut | Description |
|----------|---------|--------|-------------|
| `/api/commercial/financements` | GET | ❌ | Financements par type |
| `/api/commercial/formateurs` | GET | ❌ | Formateurs et heures |
| `/api/commercial/courses` | GET | ⚠️ | Existe mais pas utilisé |
| `/api/commercial/sessions` | GET | ⚠️ | Existe mais pas utilisé |
| `/api/commercial/learners` | GET | ⚠️ | Existe mais pas utilisé |

---

## 4. Fonctionnalité de Sauvegarde

### ✅ Sauvegarde Actuelle

**Code actuel dans BPFFormPage.tsx :**
```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    if (id) {
      // Update existing BPF
      const response = await updateQualityBPF(parseInt(id), {
        data: bpfData
      });
      if (response.success) {
        success('BPF enregistré avec succès');
      }
    } else {
      // Create new BPF
      const response = await createQualityBPF({
        year: currentYear,
        data: bpfData
      });
      if (response.success) {
        success('BPF créé avec succès');
        navigate(`/quality/bpf/${response.data.id}/edit`);
      }
    }
  } catch (err: any) {
    showError('Erreur', err.message || 'Une erreur est survenue');
  } finally {
    setSaving(false);
  }
};
```

**✅ Points positifs :**
- Gestion création/mise à jour
- Gestion des erreurs
- Messages de succès/erreur
- Redirection après création

**⚠️ Points à améliorer :**
- Pas de sauvegarde automatique (debounce)
- Pas de validation avant sauvegarde
- Pas de confirmation avant quitter avec modifications non sauvegardées

---

## 5. Recommandations pour Atteindre 100%

### 1. Ajouter la Récupération des Données Commerciales

**Dans BPFFormPage.tsx, ajouter :**
```typescript
import { apiService } from '../../services/api';
import { getQualitySessions } from '../../services/qualityManagement';

// Récupérer les formations
const loadCommercialData = async () => {
  try {
    // 1. Récupérer les formations
    const coursesResponse = await apiService.getCourses({ 
      per_page: 100,
      status: 1, // Actives
      // Filtrer par période fiscale
    });
    
    // 2. Pour chaque formation, récupérer les sessions
    const courses = coursesResponse.data?.courses?.data || [];
    for (const course of courses) {
      const sessionsResponse = await getQualitySessions({
        courseUuid: course.uuid,
        limit: 100
      });
      
      // 3. Calculer les statistiques
      const totalLearners = sessionsResponse.data?.sessions?.reduce((sum, session) => {
        return sum + (session.learners_count || 0);
      }, 0) || 0;
      
      const totalHours = sessionsResponse.data?.sessions?.reduce((sum, session) => {
        return sum + (session.duration_hours || 0);
      }, 0) || 0;
      
      // 4. Pré-remplir les champs BPF correspondants
      // (selon le type de formation, niveau, etc.)
    }
    
    // 5. Récupérer les financements
    // TODO: Créer endpoint /api/commercial/financements
    
    // 6. Récupérer les formateurs
    // TODO: Créer endpoint /api/commercial/formateurs
  } catch (err) {
    console.error('Error loading commercial data:', err);
  }
};
```

### 2. Créer les Endpoints Backend Manquants

**GET /api/commercial/financements**
```json
{
  "success": true,
  "data": {
    "financements": [
      {
        "type": "apprentissage",
        "amount": 50000,
        "count": 10
      },
      {
        "type": "cpf",
        "amount": 30000,
        "count": 25
      }
    ],
    "total": 80000,
    "period": {
      "from": "2024-01-01",
      "to": "2024-12-31"
    }
  }
}
```

**GET /api/commercial/formateurs**
```json
{
  "success": true,
  "data": {
    "formateurs": [
      {
        "id": 1,
        "name": "Jean Dupont",
        "type": "interne",
        "hours": 120,
        "sessions_count": 5
      },
      {
        "id": 2,
        "name": "Marie Martin",
        "type": "externe",
        "hours": 80,
        "sessions_count": 3
      }
    ],
    "total_internes": 120,
    "total_externes": 80,
    "total_hours": 200
  }
}
```

### 3. Ajouter la Sauvegarde Automatique

```typescript
// Sauvegarde automatique toutes les 30 secondes
useEffect(() => {
  const autoSaveInterval = setInterval(() => {
    if (id && Object.keys(bpfData).length > 0) {
      handleAutoSave();
    }
  }, 30000); // 30 secondes
  
  return () => clearInterval(autoSaveInterval);
}, [bpfData, id]);
```

### 4. Ajouter la Validation

```typescript
const validateBPF = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validation Section A
  if (!bpfData.declarationNumber || bpfData.declarationNumber.length !== 11) {
    errors.push('Le numéro de déclaration doit contenir 11 caractères');
  }
  
  // Validation Section B
  if (!bpfData.fiscalYearFrom || !bpfData.fiscalYearTo) {
    errors.push('Les dates de l\'exercice comptable sont requises');
  }
  
  // Validation Section C
  const cLTotal = calculateTotal(['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'c11']);
  if (cLTotal === 0) {
    errors.push('Le total de la section C ne peut pas être zéro');
  }
  
  // ... autres validations
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

---

## 6. Checklist pour Atteindre 100%

### Backend
- [ ] Créer endpoint `/api/commercial/financements`
- [ ] Créer endpoint `/api/commercial/formateurs`
- [ ] Ajouter filtres par période dans `/api/commercial/courses`
- [ ] Ajouter statistiques dans `/api/commercial/sessions` (nombre apprenants, heures)
- [ ] Ajouter agrégations dans `/api/commercial/learners` (par type, par niveau)

### Frontend
- [ ] Ajouter `loadCommercialData()` dans `BPFFormPage.tsx`
- [ ] Pré-remplir Section C depuis financements
- [ ] Pré-remplir Section E depuis formateurs
- [ ] Pré-remplir Section F depuis formations/sessions
- [ ] Ajouter bouton "Importer depuis données commerciales"
- [ ] Ajouter validation avant sauvegarde
- [ ] Ajouter sauvegarde automatique (debounce)
- [ ] Ajouter confirmation avant quitter avec modifications

---

## 7. Conclusion

**Score actuel : 70/100**

**Points forts :**
- ✅ Structure complète du formulaire
- ✅ Endpoints BPF corrects
- ✅ Sauvegarde fonctionnelle
- ✅ Gestion des états et historique

**Points à améliorer :**
- ❌ Intégration avec données commerciales (0%)
- ⚠️ Pré-remplissage automatique (0%)
- ⚠️ Validation (30%)
- ⚠️ Sauvegarde automatique (0%)

**Pour atteindre 100% :**
1. Créer les endpoints backend pour données commerciales
2. Implémenter la récupération et pré-remplissage automatique
3. Ajouter la validation complète
4. Ajouter la sauvegarde automatique

**Temps estimé :** 2-3 jours de développement

