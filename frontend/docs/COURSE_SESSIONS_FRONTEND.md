# Guide Frontend: Sessions de Formation (Course Sessions)

## 📋 Vue d'ensemble

Ce document explique la nouvelle architecture pour la gestion des sessions de formation dans le frontend React.

### ⚠️ IMPORTANT: Changement d'Architecture

L'ancienne implémentation (`SessionCreationContext`, `sessionCreation.ts`) est **DÉPRÉCIÉE**.

**AVANT (FAUX):**
```
Session ≈ Cours (entité complète avec titre, description, modules, chapitres, etc.)
```

**MAINTENANT (CORRECT):**
```
Course (Cours) → CourseSession (Session) → SessionSlot (Séance)
```

### Architecture Correcte

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CENTRE DE FORMATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COURS (Course)                    SESSIONS (CourseSession)                 │
│  ═══════════════                   ═════════════════════════                │
│  • Le modèle/template              • Instance planifiée d'un cours          │
│  • Contenu pédagogique             • Dates de début/fin                     │
│  • Objectifs                       • Lieu ou lien visio                     │
│  • Modules/Chapitres               • Formateurs assignés                    │
│  • Prix de base                    • Prix spécifique (optionnel)            │
│  • Durée théorique                 • Participants inscrits                  │
│                                                                              │
│         ↓                                    ↓                               │
│         │                                    │                               │
│         │    1 cours → N sessions            │                               │
│         └──────────────────→                 │                               │
│                                              ↓                               │
│                                                                              │
│                              SÉANCES (SessionSlot)                          │
│                              ════════════════════                           │
│                              • Créneaux individuels                         │
│                              • Date et heure spécifiques                    │
│                              • Émargement/Présence                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Exemple Concret

```
📚 Cours: "Excel Avancé" (template)
   ├── Durée: 3 jours
   ├── Prix: 1500€ HT
   ├── Objectifs: 5 objectifs pédagogiques
   └── Modules: 8 modules
   
   └── 📅 Session 1: "Excel Avancé - Janvier 2025"
       ├── Dates: 15-17 janvier 2025
       ├── Lieu: Paris - Salle A
       ├── Formateur: Jean Dupont
       ├── Participants: 8/12
       └── Séances:
           ├── Jour 1: 15/01 - 09:00 à 17:00
           ├── Jour 2: 16/01 - 09:00 à 17:00
           └── Jour 3: 17/01 - 09:00 à 17:00
   
   └── 📅 Session 2: "Excel Avancé - Mars 2025"
       ├── Dates: 10-12 mars 2025
       ├── Mode: Distanciel (Teams)
       ├── Formateur: Marie Martin
       └── Participants: 5/10
```

---

## 🗂️ Nouveaux Fichiers

### Services API

| Fichier | Description |
|---------|-------------|
| `src/services/courseSession.ts` | Service API pour les sessions de cours |
| `src/services/courseSession.types.ts` | Types TypeScript |

### Contexte

| Fichier | Description |
|---------|-------------|
| `src/contexts/CourseSessionContext.tsx` | Contexte React pour création/édition |

### Écrans

| Fichier | Description |
|---------|-------------|
| `src/screens/CourseSessionCreation/CourseSessionCreation.tsx` | Écran de création de session |

---

## 🔗 Endpoints API

### Base URL
```
/api/admin/organization/course-sessions
```

### Endpoints Principaux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/courses/available` | Liste des cours disponibles |
| `GET` | `/course-sessions` | Liste des sessions |
| `GET` | `/course-sessions/{uuid}` | Détails d'une session |
| `POST` | `/course-sessions` | Créer une session |
| `PUT` | `/course-sessions/{uuid}` | Modifier une session |
| `DELETE` | `/course-sessions/{uuid}` | Supprimer une session |
| `POST` | `/course-sessions/{uuid}/cancel` | Annuler une session |

### Séances (Slots)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/course-sessions/{uuid}/slots` | Liste des séances |
| `POST` | `/course-sessions/{uuid}/slots` | Créer une séance |
| `POST` | `/course-sessions/{uuid}/generate-slots` | Générer automatiquement |
| `PUT` | `/course-sessions/{uuid}/slots/{slotUuid}` | Modifier une séance |
| `DELETE` | `/course-sessions/{uuid}/slots/{slotUuid}` | Supprimer une séance |

### Participants

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/course-sessions/{uuid}/participants` | Liste des participants |
| `POST` | `/course-sessions/{uuid}/participants` | Ajouter un participant |
| `DELETE` | `/course-sessions/{uuid}/participants/{participantUuid}` | Retirer un participant |

### Planning

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/course-sessions/planning` | Vue planning avec stats et événements |

---

## 📊 Types TypeScript

### Types Principaux

```typescript
import type {
  CourseSession,
  CourseSessionListItem,
  AvailableCourse,
  SessionSlot,
  SessionParticipant,
  CreateCourseSessionData,
  SessionStatus,
  SessionType,
  DeliveryMode,
} from '@/services/courseSession.types';
```

### Enums et Constantes

```typescript
// Statuts de session
type SessionStatus = 
  | 'draft'        // Brouillon
  | 'planned'      // Planifiée
  | 'open'         // Inscriptions ouvertes
  | 'confirmed'    // Confirmée
  | 'in_progress'  // En cours
  | 'completed'    // Terminée
  | 'cancelled'    // Annulée
  | 'postponed';   // Reportée

// Types de session
type SessionType = 'intra' | 'inter' | 'individual';

// Modes de délivrance
type DeliveryMode = 'presentiel' | 'distanciel' | 'hybrid' | 'e-learning';
```

### Constantes de Labels

```typescript
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  SESSION_TYPE_LABELS,
  DELIVERY_MODE_LABELS,
} from '@/services/courseSession.types';

// Exemple d'utilisation
SESSION_STATUS_LABELS['open'] // "Inscriptions ouvertes"
SESSION_STATUS_COLORS['open'] // "#10b981" (vert)
```

---

## 🪝 Utilisation du Contexte

### Provider

Envelopper le composant avec `CourseSessionProvider`:

```tsx
import { CourseSessionProvider } from '@/contexts/CourseSessionContext';

function App() {
  return (
    <CourseSessionProvider>
      <CourseSessionCreation />
    </CourseSessionProvider>
  );
}
```

### Hook

```tsx
import { useCourseSession } from '@/contexts/CourseSessionContext';

function MyComponent() {
  const {
    // État
    formData,
    currentSession,
    sessionUuid,
    availableCourses,
    slots,
    participants,
    trainers,
    currentStep,
    isLoading,
    isSaving,
    error,
    
    // Actions Form
    updateFormField,
    updateMultipleFields,
    resetForm,
    
    // Navigation
    setCurrentStep,
    nextStep,
    previousStep,
    
    // Cours
    loadAvailableCourses,
    selectCourse,
    
    // Session CRUD
    createSession,
    updateSession,
    loadSession,
    deleteSession,
    cancelSession,
    
    // Séances
    loadSlots,
    createSlot,
    updateSlot,
    deleteSlot,
    generateSlots,
    
    // Participants
    loadParticipants,
    addParticipant,
    updateParticipant,
    removeParticipant,
    
    // Formateurs
    loadTrainers,
    assignTrainer,
    removeTrainer,
  } = useCourseSession();
  
  // ...
}
```

---

## 🚀 Flux de Création

### Étape 1: Sélection du Cours

```tsx
const { availableCourses, selectCourse, loadAvailableCourses } = useCourseSession();

useEffect(() => {
  loadAvailableCourses();
}, []);

const handleSelectCourse = (course: AvailableCourse) => {
  selectCourse(course);
  // Le formData.course_uuid et formData.selectedCourse sont mis à jour
};
```

### Étape 2: Configuration de la Session

```tsx
const { formData, updateFormField } = useCourseSession();

// Mettre à jour un champ
updateFormField('start_date', '2025-01-15');
updateFormField('session_type', 'inter');
updateFormField('delivery_mode', 'presentiel');

// Créer la session
const { createSession } = useCourseSession();
const sessionUuid = await createSession(); // Retourne l'UUID ou null
```

### Étape 3: Générer les Séances

```tsx
const { generateSlots, slots } = useCourseSession();

// Génération quotidienne
await generateSlots({
  pattern: 'daily',
  start_time: '09:00',
  end_time: '17:00',
  instance_type: 'presentiel',
});

// Génération hebdomadaire (Lun, Mar, Mer)
await generateSlots({
  pattern: 'weekly',
  days_of_week: [1, 2, 3],
  start_time: '09:00',
  end_time: '17:00',
  instance_type: 'distanciel',
});
```

### Étape 4: Ajouter des Participants

```tsx
const { addParticipant, participants, removeParticipant } = useCourseSession();

// Ajouter un participant
await addParticipant({
  user_id: 123,
  type: 'Entreprise',
  tarif: 1500,
  notes: 'Financé par OPCO',
});

// Retirer un participant
await removeParticipant(participantUuid);
```

---

## 🔄 Migration depuis l'Ancienne API

### Fichiers à Supprimer/Déprécier

| Fichier | Action |
|---------|--------|
| `src/contexts/SessionCreationContext.tsx` | ⚠️ DÉPRÉCIÉ |
| `src/services/sessionCreation.ts` | ⚠️ DÉPRÉCIÉ |
| `src/services/sessionCreation.types.ts` | ⚠️ DÉPRÉCIÉ |
| `src/screens/SessionCreation/` | ⚠️ DÉPRÉCIÉ |
| `src/components/SessionCreation/` | ⚠️ DÉPRÉCIÉ (sauf Step6Seances, Step7Participants) |

### Mapping des Concepts

| Ancien Concept | Nouveau Concept |
|----------------|-----------------|
| `SessionCreationFormData.title` | Hérité du cours via `course_uuid` |
| `SessionCreationFormData.description` | Hérité du cours |
| `SessionCreationFormData.modules` | N'existe plus - dans le cours |
| `SessionCreationFormData.chapters` | N'existe plus - dans le cours |
| `SessionInstance` | `SessionSlot` |
| `generateSessionInstances` | `generateSlots` |

### Composants Réutilisables

Les composants suivants peuvent être adaptés pour la nouvelle architecture:

1. **`Step6Seances.tsx`** → Adapter pour utiliser `generateSlots` du nouveau contexte
2. **`Step7Participants.tsx`** → Adapter pour utiliser `addParticipant` du nouveau contexte

---

## ❓ FAQ

### Pourquoi ce changement?

L'ancienne implémentation dupliquait les données du cours dans chaque session. La nouvelle architecture:
- ✅ Évite la duplication de données
- ✅ Permet de modifier le cours et que toutes les sessions héritent des changements
- ✅ Correspond à la logique métier d'un centre de formation
- ✅ Simplifie la maintenance

### Puis-je avoir une session sans cours?

Non. Une session DOIT être basée sur un cours. C'est la logique fondamentale. Si vous avez besoin d'une formation ponctuelle, créez d'abord le cours (même minimal), puis la session.

### Comment afficher le titre de la session?

Utilisez `display_title` qui retourne automatiquement:
- Le titre personnalisé de la session si défini
- Sinon, le titre du cours de base

```tsx
<h1>{session.display_title}</h1>
```

### Comment gérer le prix?

```tsx
// Le prix effectif prend en compte le prix personnalisé ou celui du cours
const effectivePrice = session.pricing.effective_price;

// Pour personnaliser
updateFormField('price_ht', 1200); // null = utiliser le prix du cours
```

---

## 📞 Support

Pour toute question, contactez l'équipe backend ou frontend.






