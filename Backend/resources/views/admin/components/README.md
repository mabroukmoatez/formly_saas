# Not Found Component Usage Guide

## Overview
The `not-found` component is a reusable Blade component that displays a user-friendly message when no data is found. It includes proper translations and customizable options.

## Basic Usage

### Include the Component
```blade
@include('admin.components.not-found', ['type' => 'courses'])
```

## Parameters

### Required Parameters
- **`type`** (string): The type of data being displayed. Available types:
  - `courses` - For course listings
  - `students` - For student listings  
  - `instructors` - For instructor listings
  - `orders` - For order listings
  - `data` - Generic data (default)

### Optional Parameters
- **`message`** (string): Custom message to override the default title
- **`showClearFilters`** (boolean): Show "Clear filters" button (default: false)
- **`showRefresh`** (boolean): Show "Refresh" button (default: false)
- **`icon`** (string): Custom icon class (default: based on type)
- **`size`** (string): Component size - `small`, `medium`, `large` (default: large)
- **`backUrl`** (string): URL for "Go back" button

## Usage Examples

### 1. Basic Course Not Found
```blade
@if($courses->count() == 0)
    @include('admin.components.not-found', ['type' => 'courses'])
@endif
```

### 2. With Clear Filters Button
```blade
@include('admin.components.not-found', [
    'type' => 'courses',
    'showClearFilters' => request()->hasAny(['search', 'price', 'category'])
])
```

### 3. Custom Message
```blade
@include('admin.components.not-found', [
    'type' => 'courses',
    'message' => 'No published courses found',
    'showClearFilters' => true
])
```

### 4. Small Size with Refresh
```blade
@include('admin.components.not-found', [
    'type' => 'data',
    'size' => 'small',
    'showRefresh' => true
])
```

### 5. With Back Button
```blade
@include('admin.components.not-found', [
    'type' => 'students',
    'backUrl' => route('admin.dashboard'),
    'showClearFilters' => true
])
```

## Translations

The component uses the following translation keys (already added to `fr.json`):

- `No Results Found` → "Aucun résultat trouvé"
- `No courses found` → "Aucun cours trouvé"
- `No data available` → "Aucune donnée disponible"
- `Try adjusting your search or filter criteria` → "Essayez d'ajuster vos critères de recherche ou de filtrage"
- `Clear filters` → "Effacer les filtres"
- `Reset search` → "Réinitialiser la recherche"
- `Nothing to show here` → "Rien à afficher ici"
- `The search did not return any results` → "La recherche n'a retourné aucun résultat"
- `No items match your current filters` → "Aucun élément ne correspond à vos filtres actuels"
- `Start a new search` → "Commencer une nouvelle recherche"
- `Go back` → "Retour"
- `Refresh` → "Actualiser"

## Styling

The component includes:
- Responsive design
- Smooth animations (floating icon)
- Hover effects on buttons
- Gradient background
- Consistent color scheme
- FontAwesome icons

## Integration Examples

### In Course Index
```blade
@if($courses->count() > 0)
    @foreach($courses as $course)
        <!-- Course cards -->
    @endforeach
@else
    <div class="col-12">
        @include('admin.components.not-found', [
            'type' => 'courses',
            'showClearFilters' => request()->hasAny(['search', 'price', 'category', 'instructor']),
            'size' => 'large'
        ])
    </div>
@endif
```

### In Student Management
```blade
@if($students->count() == 0)
    @include('admin.components.not-found', [
        'type' => 'students',
        'showClearFilters' => request()->has('search'),
        'backUrl' => route('admin.students.index')
    ])
@endif
```

### In Instructor List
```blade
@if($instructors->isEmpty())
    @include('admin.components.not-found', [
        'type' => 'instructors',
        'message' => 'No approved instructors found',
        'showRefresh' => true
    ])
@endif
```

## Customization

To add new types, modify the `$configs` array in the component:

```php
$configs = [
    'new_type' => [
        'title' => __('No new items found'),
        'subtitle' => __('Try adjusting your criteria'),
        'icon' => 'fas fa-new-icon',
        'suggestions' => [
            __('Try different keywords'),
            __('Check your filters'),
            __('Contact support')
        ]
    ]
];
```
