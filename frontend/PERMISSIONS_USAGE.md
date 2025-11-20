# Guide d'utilisation du système de permissions

Ce guide explique comment utiliser le système de gestion des rôles et permissions dans le frontend.

## Vue d'ensemble

Le système de permissions permet de :
- **Masquer/afficher des éléments du sidebar** selon les rôles et permissions de l'utilisateur
- **Protéger les boutons et actions** avec des messages de non-autorisation
- **Vérifier les permissions** dans n'importe quel composant

## Composants disponibles

### 1. Hook `usePermissions`

Hook principal pour vérifier les permissions dans vos composants.

```tsx
import { usePermissions } from '../hooks/usePermissions';

function MyComponent() {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    isOrganizationAdmin 
  } = usePermissions();

  // Vérifier une permission unique
  if (hasPermission('organization_manage_users')) {
    // L'utilisateur peut gérer les utilisateurs
  }

  // Vérifier au moins une permission parmi plusieurs
  if (hasAnyPermission(['organization_view_users', 'organization_manage_users'])) {
    // L'utilisateur peut voir ou gérer les utilisateurs
  }

  // Vérifier toutes les permissions
  if (hasAllPermissions(['organization_view_users', 'organization_assign_roles'])) {
    // L'utilisateur a toutes les permissions requises
  }

  // Vérifier si l'utilisateur est Organization Admin
  if (isOrganizationAdmin()) {
    // L'utilisateur est admin de l'organisation
  }
}
```

### 2. Composant `PermissionGuard`

Protège n'importe quel contenu basé sur les permissions.

```tsx
import { PermissionGuard } from '../components/ui/PermissionGuard';

// Masquer le contenu si non autorisé (par défaut)
<PermissionGuard permission="organization_manage_users">
  <Button>Créer un utilisateur</Button>
</PermissionGuard>

// Afficher un message si non autorisé
<PermissionGuard 
  permission="organization_manage_users"
  showMessage={true}
>
  <Button>Créer un utilisateur</Button>
</PermissionGuard>

// Vérifier plusieurs permissions (au moins une)
<PermissionGuard 
  anyPermission={['organization_view_users', 'organization_manage_users']}
>
  <UserList />
</PermissionGuard>

// Vérifier toutes les permissions
<PermissionGuard 
  allPermissions={['organization_view_users', 'organization_assign_roles']}
>
  <UserManagementPanel />
</PermissionGuard>
```

### 3. Composant `ButtonWithPermission`

Bouton avec vérification de permissions intégrée.

```tsx
import { ButtonWithPermission } from '../components/ui/ButtonWithPermission';

// Bouton masqué si non autorisé (par défaut)
<ButtonWithPermission 
  permission="organization_manage_users"
  onClick={handleCreateUser}
>
  Créer un utilisateur
</ButtonWithPermission>

// Bouton qui affiche un message si non autorisé
<ButtonWithPermission 
  permission="organization_manage_users"
  showMessage={true}
  onClick={handleCreateUser}
>
  Créer un utilisateur
</ButtonWithPermission>

// Bouton désactivé si non autorisé
<ButtonWithPermission 
  permission="organization_manage_users"
  showDisabled={true}
  disabledTooltip="Vous n'avez pas la permission de créer des utilisateurs"
  onClick={handleCreateUser}
>
  Créer un utilisateur
</ButtonWithPermission>
```

### 4. Composant `UnauthorizedMessage`

Affiche un message de non-autorisation stylisé.

```tsx
import { UnauthorizedMessage } from '../components/ui/UnauthorizedMessage';

<UnauthorizedMessage 
  message="Message personnalisé"
  size="md" // 'sm' | 'md' | 'lg'
  variant="inline" // 'inline' | 'block'
/>
```

## Permissions disponibles

### User Management (Gestion des utilisateurs)
- `organization_manage_users` - Créer, modifier et supprimer les utilisateurs
- `organization_view_users` - Voir la liste des utilisateurs
- `organization_assign_roles` - Assigner des rôles aux utilisateurs

### Content Management (Gestion du contenu)
- `organization_create_content` - Créer du nouveau contenu
- `organization_edit_content` - Modifier le contenu existant
- `organization_delete_content` - Supprimer du contenu
- `organization_publish_content` - Publier et dépublier du contenu
- `organization_view_content` - Voir le contenu

### Course Management (Gestion des cours)
- `organization_manage_courses` - Créer, modifier et supprimer des cours
- `organization_view_courses` - Voir la liste des cours
- `organization_approve_courses` - Approuver ou rejeter des cours

### Session Management (Gestion des sessions)
- `organization_manage_sessions` - Créer, modifier et supprimer des sessions
- `organization_view_sessions` - Voir la liste des sessions
- `organization_manage_participants` - Gérer les participants

### Student Management (Gestion des étudiants)
- `organization_manage_students` - Gérer les inscriptions et la progression
- `organization_view_students` - Voir la liste et les détails des étudiants

### Financial Management (Gestion financière)
- `organization_view_finances` - Voir les rapports financiers
- `organization_manage_payments` - Traiter et gérer les paiements

### Settings (Paramètres)
- `organization_manage_settings` - Gérer les paramètres de l'organisation
- `organization_manage_branding` - Gérer le branding et l'apparence
- `organization_manage_roles` - Créer et gérer les rôles

### Reports (Rapports)
- `organization_view_reports` - Voir les rapports et analyses
- `organization_export_data` - Exporter les données

### Support
- `organization_manage_support` - Gérer les tickets de support
- `organization_view_support` - Voir les tickets de support

## Exemples d'utilisation

### Exemple 1 : Masquer un élément du sidebar

Les sidebars sont automatiquement filtrés selon les permissions. Aucune action supplémentaire n'est nécessaire.

### Exemple 2 : Protéger un bouton de création

```tsx
import { ButtonWithPermission } from '../components/ui/ButtonWithPermission';

function UserManagementPage() {
  return (
    <div>
      <h1>Gestion des utilisateurs</h1>
      
      <ButtonWithPermission 
        permission="organization_manage_users"
        onClick={handleCreateUser}
      >
        Créer un utilisateur
      </ButtonWithPermission>
    </div>
  );
}
```

### Exemple 3 : Afficher un message si non autorisé

```tsx
import { PermissionGuard } from '../components/ui/PermissionGuard';

function UserManagementPage() {
  return (
    <div>
      <PermissionGuard 
        permission="organization_manage_users"
        showMessage={true}
      >
        <Button onClick={handleCreateUser}>
          Créer un utilisateur
        </Button>
      </PermissionGuard>
    </div>
  );
}
```

### Exemple 4 : Bouton désactivé avec tooltip

```tsx
import { ButtonWithPermission } from '../components/ui/ButtonWithPermission';

function UserManagementPage() {
  return (
    <div>
      <ButtonWithPermission 
        permission="organization_manage_users"
        showDisabled={true}
        disabledTooltip="Contactez votre administrateur pour obtenir cette permission"
        onClick={handleCreateUser}
      >
        Créer un utilisateur
      </ButtonWithPermission>
    </div>
  );
}
```

### Exemple 5 : Vérification conditionnelle dans un composant

```tsx
import { usePermissions } from '../hooks/usePermissions';

function UserList() {
  const { hasPermission } = usePermissions();
  const canManageUsers = hasPermission('organization_manage_users');

  return (
    <div>
      <h1>Liste des utilisateurs</h1>
      
      {canManageUsers && (
        <Button onClick={handleCreateUser}>
          Créer un utilisateur
        </Button>
      )}
      
      <UserTable />
    </div>
  );
}
```

## Notes importantes

1. **Organization Admin** : Les utilisateurs avec le rôle "Organization Admin" ont automatiquement toutes les permissions.

2. **Permissions cumulatives** : Si un utilisateur a plusieurs rôles, les permissions sont cumulatives (union de toutes les permissions).

3. **Performance** : Les vérifications de permissions sont effectuées côté client. Assurez-vous que le backend valide également les permissions pour la sécurité.

4. **Sidebar automatique** : Les éléments du sidebar sont automatiquement filtrés selon les permissions. Vous n'avez pas besoin de modifier manuellement les sidebars.

5. **Messages traduits** : Les messages de non-autorisation sont automatiquement traduits selon la langue de l'utilisateur.

## Support

Pour toute question ou problème concernant les permissions :
- Consultez la documentation des rôles utilisateur
- Vérifiez que les permissions sont correctement assignées dans le backend
- Contactez l'équipe de développement

