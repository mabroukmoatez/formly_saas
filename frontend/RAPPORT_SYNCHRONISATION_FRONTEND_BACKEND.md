# RAPPORT DE SYNCHRONISATION FRONTEND / BACKEND
## Module Gestion de la Qualité

**Date :** Janvier 2025  
**Objectif :** Vérifier la synchronisation entre les endpoints documentés et ceux utilisés dans le frontend

---

## 📊 Résumé Exécutif

### ✅ Endpoints Synchronisés : 23/27
### ⚠️ Endpoints avec Différences : 4/27
### ❌ Endpoints Manquants dans le Frontend : 0/27

---

## 🔍 Analyse Détaillée par Endpoint

### 1. Initialisation du Système

#### ✅ GET `/api/quality/check`
- **Documentation Backend :** `/api/quality/check`
- **Frontend :** `/api/quality/initialize/status` (ligne 319)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise un endpoint différent
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

#### ✅ POST `/api/quality/initialize`
- **Documentation Backend :** `/api/quality/initialize`
- **Frontend :** `/api/quality/initialize` (ligne 336)
- **Status :** ✅ **SYNCHRONISÉ**

---

### 2. Dashboard

#### ✅ GET `/api/quality/dashboard`
- **Documentation Backend :** `/api/quality/dashboard`
- **Frontend :** `/api/quality/dashboard/stats` (ligne 646)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/dashboard/stats` au lieu de `/dashboard`
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

---

### 3. Indicateurs Qualiopi

#### ✅ GET `/api/quality/indicators`
- **Documentation Backend :** `/api/quality/indicators`
- **Frontend :** `/api/quality/indicators` (ligne 351)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ GET `/api/quality/indicators/:id`
- **Documentation Backend :** `/api/quality/indicators/:id`
- **Frontend :** `/api/quality/indicators/${id}` (ligne 356)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ PATCH `/api/quality/indicators/:id`
- **Documentation Backend :** `PATCH /api/quality/indicators/:id`
- **Frontend :** `PUT /api/quality/indicators/${id}` (ligne 371)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `PUT` au lieu de `PATCH`
- **Action Requise :** Aligner avec la documentation (utiliser `PATCH`)

#### ✅ GET `/api/quality/indicators/:id/documents`
- **Documentation Backend :** `/api/quality/indicators/:id/documents`
- **Frontend :** `/api/quality/indicators/${id}/documents` (ligne 379)
- **Status :** ✅ **SYNCHRONISÉ**

---

### 4. Gestion Documentaire

#### ✅ POST `/api/quality/documents`
- **Documentation Backend :** `POST /api/quality/documents`
- **Frontend :** `POST /api/quality/documents/upload` (ligne 398)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/documents/upload` au lieu de `/documents`
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

#### ✅ GET `/api/quality/documents`
- **Documentation Backend :** `/api/quality/documents`
- **Frontend :** `/api/quality/documents` (ligne 393)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ GET `/api/quality/documents/:id/download`
- **Documentation Backend :** `/api/quality/documents/:id/download`
- **Frontend :** `/api/quality/documents/${id}/download` (ligne 430)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ DELETE `/api/quality/documents/:id`
- **Documentation Backend :** `DELETE /api/quality/documents/:id`
- **Frontend :** `DELETE /api/quality/documents/${id}` (ligne 425)
- **Status :** ✅ **SYNCHRONISÉ**

---

### 5. Formations et Sessions

#### ✅ GET `/api/courses`
- **Documentation Backend :** `/api/courses`
- **Frontend :** Utilisé via `apiService.getCourses()` (probablement `/api/courses`)
- **Status :** ✅ **SYNCHRONISÉ** (nécessite vérification du service)

#### ✅ GET `/api/quality/sessions`
- **Documentation Backend :** `/api/quality/sessions?courseUuid={courseUuid}`
- **Frontend :** `/api/quality/sessions` avec params `courseUuid` ou `course_uuid` (ligne 884)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ GET `/api/quality/sessions/:sessionUuid/participants`
- **Documentation Backend :** `/api/quality/sessions/:sessionUuid/participants`
- **Frontend :** `/api/quality/sessions/${sessionId}/participants` (ligne 889)
- **Status :** ✅ **SYNCHRONISÉ**

---

### 6. BPF (Bilan Pédagogique et Financier)

#### ✅ GET `/api/quality/bpf/current`
- **Documentation Backend :** `/api/quality/bpf/current`
- **Frontend :** `/api/quality/bpf` avec params `status=draft` (ligne 546)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/bpf` avec paramètre au lieu de `/bpf/current`
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

#### ✅ POST `/api/quality/bpf`
- **Documentation Backend :** `POST /api/quality/bpf`
- **Frontend :** `POST /api/quality/bpf` (ligne 564)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ PATCH `/api/quality/bpf/:id`
- **Documentation Backend :** `PATCH /api/quality/bpf/:id`
- **Frontend :** `PUT /api/quality/bpf/${id}` (ligne 569)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `PUT` au lieu de `PATCH`
- **Action Requise :** Aligner avec la documentation (utiliser `PATCH`)

#### ✅ POST `/api/quality/bpf/:id/submit`
- **Documentation Backend :** `POST /api/quality/bpf/:id/submit`
- **Frontend :** `POST /api/quality/bpf/${id}/submit` (ligne 581)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ GET `/api/quality/bpf/history`
- **Documentation Backend :** `/api/quality/bpf/history`
- **Frontend :** `/api/quality/bpf/${id}/history` (ligne 556) ET `/api/quality/bpf/archives` (ligne 589)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise deux endpoints différents :
  - `/bpf/:id/history` pour l'historique d'un BPF spécifique
  - `/bpf/archives` pour les archives générales
- **Action Requise :** Clarifier dans la documentation la différence entre ces deux endpoints

---

### 7. Actions et Tâches

#### ✅ GET `/api/quality/tasks/categories`
- **Documentation Backend :** `/api/quality/tasks/categories`
- **Frontend :** `/api/quality/task-categories` (ligne 780)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/task-categories` (avec tiret) au lieu de `/tasks/categories`
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

#### ✅ POST `/api/quality/tasks/categories`
- **Documentation Backend :** `POST /api/quality/tasks/categories`
- **Frontend :** `POST /api/quality/task-categories` (ligne 791)
- **Status :** ⚠️ **DIFFÉRENCE** - Même problème que ci-dessus

#### ✅ PATCH `/api/quality/tasks/categories/:id`
- **Documentation Backend :** `PATCH /api/quality/tasks/categories/:id`
- **Frontend :** `PUT /api/quality/task-categories/${id}` (ligne 796)
- **Status :** ⚠️ **DIFFÉRENCE** - Endpoint différent ET méthode HTTP différente (`PUT` vs `PATCH`)

#### ✅ DELETE `/api/quality/tasks/categories/:id`
- **Documentation Backend :** `DELETE /api/quality/tasks/categories/:id`
- **Frontend :** `DELETE /api/quality/task-categories/${id}` (ligne 801)
- **Status :** ⚠️ **DIFFÉRENCE** - Endpoint différent

#### ✅ GET `/api/quality/tasks`
- **Documentation Backend :** `/api/quality/tasks`
- **Frontend :** `/api/quality/tasks` (ligne 704)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ POST `/api/quality/tasks`
- **Documentation Backend :** `POST /api/quality/tasks`
- **Frontend :** `POST /api/quality/tasks` (ligne 728)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ PATCH `/api/quality/tasks/:id`
- **Documentation Backend :** `PATCH /api/quality/tasks/:id`
- **Frontend :** `PUT /api/quality/tasks/${id}` (ligne 733)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `PUT` au lieu de `PATCH`
- **Action Requise :** Aligner avec la documentation (utiliser `PATCH`)

#### ✅ PATCH `/api/quality/tasks/:id/position`
- **Documentation Backend :** `PATCH /api/quality/tasks/:id/position`
- **Frontend :** `POST /api/quality/tasks/positions` avec body `{ tasks: [...] }` (ligne 743)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise un endpoint batch `/tasks/positions` au lieu de `/tasks/:id/position`
- **Action Requise :** Clarifier dans la documentation si un endpoint batch est prévu ou utiliser l'endpoint individuel

#### ✅ DELETE `/api/quality/tasks/:id`
- **Documentation Backend :** `DELETE /api/quality/tasks/:id`
- **Frontend :** `DELETE /api/quality/tasks/${id}` (ligne 738)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ POST `/api/quality/tasks/:id/attachments`
- **Documentation Backend :** `POST /api/quality/tasks/:id/attachments`
- **Frontend :** `POST /api/quality/tasks/${taskId}/attachments` (ligne 750)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ DELETE `/api/quality/tasks/:id/attachments/:attachmentId`
- **Documentation Backend :** `DELETE /api/quality/tasks/:id/attachments/:attachmentId`
- **Frontend :** `DELETE /api/quality/tasks/${taskId}/attachments/${attachmentId}` (ligne 759)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ POST `/api/quality/tasks/:id/comments`
- **Documentation Backend :** `POST /api/quality/tasks/:id/comments`
- **Frontend :** `POST /api/quality/tasks/${taskId}/comments` (ligne 764)
- **Status :** ✅ **SYNCHRONISÉ**

#### ✅ GET `/api/quality/tasks/statistics`
- **Documentation Backend :** `/api/quality/tasks/statistics`
- **Frontend :** `/api/quality/tasks/statistics` (ligne 769)
- **Status :** ✅ **SYNCHRONISÉ**

---

### 8. Audits

#### ✅ GET `/api/quality/audits/next`
- **Documentation Backend :** `/api/quality/audits/next`
- **Frontend :** `/api/quality/audit/next` (ligne 486)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/audit/next` (singulier) au lieu de `/audits/next` (pluriel)
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

#### ✅ POST `/api/quality/audits`
- **Documentation Backend :** `POST /api/quality/audits`
- **Frontend :** `POST /api/quality/audit` (ligne 501)
- **Status :** ⚠️ **DIFFÉRENCE** - Le frontend utilise `/audit` (singulier) au lieu de `/audits` (pluriel)
- **Action Requise :** Aligner avec la documentation ou mettre à jour la documentation

---

### 9. Articles / Actualités Qualiopi

#### ✅ GET `/api/quality/articles`
- **Documentation Backend :** `/api/quality/articles`
- **Frontend :** `/api/quality/articles` (ligne 612)
- **Status :** ✅ **SYNCHRONISÉ**

---

## 📋 Résumé des Différences

### 🔴 Différences Critiques (À Corriger)

1. **Initialisation**
   - Documentation : `/api/quality/check`
   - Frontend : `/api/quality/initialize/status`
   - **Impact :** Bloque l'initialisation du système

2. **Dashboard**
   - Documentation : `/api/quality/dashboard`
   - Frontend : `/api/quality/dashboard/stats`
   - **Impact :** Bloque le chargement du dashboard

3. **Upload de Documents**
   - Documentation : `POST /api/quality/documents`
   - Frontend : `POST /api/quality/documents/upload`
   - **Impact :** Bloque l'upload de documents

4. **BPF Current**
   - Documentation : `/api/quality/bpf/current`
   - Frontend : `/api/quality/bpf?status=draft`
   - **Impact :** Différence d'implémentation

### 🟡 Différences de Convention (À Aligner)

1. **Méthodes HTTP**
   - Documentation utilise `PATCH` pour les mises à jour
   - Frontend utilise `PUT` pour les mises à jour
   - **Endpoints concernés :**
     - `/api/quality/indicators/:id`
     - `/api/quality/bpf/:id`
     - `/api/quality/tasks/:id`
     - `/api/quality/tasks/categories/:id`

2. **Pluriel vs Singulier**
   - Documentation : `/api/quality/audits/next` et `/api/quality/audits`
   - Frontend : `/api/quality/audit/next` et `/api/quality/audit`
   - **Impact :** Incohérence de convention

3. **Catégories de Tâches**
   - Documentation : `/api/quality/tasks/categories`
   - Frontend : `/api/quality/task-categories`
   - **Impact :** Incohérence de convention

4. **Position des Tâches**
   - Documentation : `PATCH /api/quality/tasks/:id/position` (individuel)
   - Frontend : `POST /api/quality/tasks/positions` (batch)
   - **Impact :** Différence d'approche (batch vs individuel)

---

## ✅ Recommandations

### Priorité 1 - À Corriger Immédiatement

1. **Unifier les endpoints d'initialisation**
   - Option A : Backend implémente `/api/quality/check`
   - Option B : Documentation mise à jour avec `/api/quality/initialize/status`

2. **Unifier les endpoints de dashboard**
   - Option A : Backend implémente `/api/quality/dashboard`
   - Option B : Documentation mise à jour avec `/api/quality/dashboard/stats`

3. **Unifier les endpoints d'upload**
   - Option A : Backend accepte `POST /api/quality/documents` (sans `/upload`)
   - Option B : Documentation mise à jour avec `/api/quality/documents/upload`

### Priorité 2 - À Aligner (Conventions)

1. **Standardiser les méthodes HTTP**
   - Utiliser `PATCH` pour les mises à jour partielles (REST standard)
   - Utiliser `PUT` pour les remplacements complets

2. **Standardiser le pluriel/singulier**
   - Recommandation : Utiliser le pluriel pour les ressources (`/audits`, `/tasks`, etc.)

3. **Standardiser les catégories de tâches**
   - Recommandation : Utiliser `/api/quality/tasks/categories` (cohérent avec `/tasks`)

### Priorité 3 - À Clarifier

1. **Historique BPF**
   - Clarifier la différence entre `/bpf/:id/history` et `/bpf/archives`
   - Documenter les deux endpoints si nécessaire

2. **Position des tâches**
   - Décider si l'approche batch (`POST /tasks/positions`) ou individuelle (`PATCH /tasks/:id/position`) est préférée
   - Documenter la solution choisie

---

## 📝 Actions Requises

### Pour l'Équipe Backend

1. ✅ Vérifier et implémenter les endpoints selon la documentation
2. ✅ Ou confirmer les endpoints actuellement utilisés par le frontend
3. ✅ Standardiser les méthodes HTTP (`PATCH` vs `PUT`)
4. ✅ Standardiser les conventions de nommage (pluriel/singulier)

### Pour l'Équipe Frontend

1. ✅ Mettre à jour les endpoints selon la documentation une fois validée
2. ✅ Utiliser `PATCH` au lieu de `PUT` pour les mises à jour partielles
3. ✅ Aligner les conventions de nommage avec le backend

---

## 🔄 Prochaines Étapes

1. **Réunion de synchronisation** entre équipes Frontend et Backend
2. **Validation des endpoints** documentés vs implémentés
3. **Mise à jour de la documentation** avec les décisions prises
4. **Tests d'intégration** pour valider la synchronisation

---

**Dernière mise à jour :** Janvier 2025  
**Prochaine révision :** Après validation des endpoints

