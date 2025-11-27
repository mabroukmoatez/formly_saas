# Backend Requirements: User Update - Status Field

## Problem
The frontend is receiving a **422 Unprocessable Content** error when updating a user via `PUT /api/organization/users/{id}`. The backend validation requires the `status` field, but it's not being sent in the request payload.

## Current Error
```
PUT http://localhost:8000/api/organization/users/112
Status: 422 Unprocessable Content

Response:
{
    "success": false,
    "message": "Validation failed",
    "errors": {
        "status": [
            "This field is required."
        ]
    }
}
```

## Expected Request Payload
The frontend should send the following payload when updating a user:

```json
{
    "name": "Apprenant Demo",
    "email": "info@orgaz.net",
    "role_id": 11,
    "status": 1,  // REQUIRED - This field is missing
    "phone": "",
    "address": ""
}
```

## Backend Validation Requirements

### Current Backend Validation (Expected)
The backend validation rule for the `status` field should be:

**Laravel Validation Rule:**
```php
'status' => 'required|integer|in:0,1',  // or whatever values are valid
```

### Questions for Backend Team

1. **Is `status` really required for updates?**
   - If yes, the backend should accept the current user's status value
   - If no, the validation rule should be `'status' => 'sometimes|integer|in:0,1'`

2. **What are the valid status values?**
   - Typically: `0` (inactive) and `1` (active)
   - Confirm the exact values expected

3. **Should the backend use the existing status if not provided?**
   - If the frontend doesn't send `status`, should the backend:
     - Keep the existing status (recommended)
     - Use a default value
     - Return an error (current behavior)

## Recommended Backend Solution

### Option 1: Make status optional (Recommended)
If the status shouldn't change unless explicitly provided:

```php
// In the UserController update method
$validated = $request->validate([
    'name' => 'sometimes|string|max:255',
    'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
    'role_id' => 'sometimes|integer|exists:organization_roles,id',
    'status' => 'sometimes|integer|in:0,1',  // Optional - only update if provided
    'phone' => 'nullable|string|max:255',
    'address' => 'nullable|string|max:500',
]);

// Only update status if provided
if ($request->has('status')) {
    $user->status = $validated['status'];
}
```

### Option 2: Always require status
If status must always be provided:

```php
// In the UserController update method
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'email' => 'required|email|max:255|unique:users,email,' . $user->id,
    'role_id' => 'required|integer|exists:organization_roles,id',
    'status' => 'required|integer|in:0,1',  // Required
    'phone' => 'nullable|string|max:255',
    'address' => 'nullable|string|max:500',
]);

$user->update($validated);
```

### Option 3: Use existing status as default
If status should default to current value when not provided:

```php
// In the UserController update method
$validated = $request->validate([
    'name' => 'sometimes|string|max:255',
    'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
    'role_id' => 'sometimes|integer|exists:organization_roles,id',
    'status' => 'sometimes|integer|in:0,1',
    'phone' => 'nullable|string|max:255',
    'address' => 'nullable|string|max:500',
]);

// Merge with existing status if not provided
if (!isset($validated['status'])) {
    $validated['status'] = $user->status;
}

$user->update($validated);
```

## Frontend Fix Applied

The frontend has been updated to always include the `status` field in the update request:

```typescript
const userStatus = selectedUser.status !== undefined && selectedUser.status !== null 
  ? selectedUser.status 
  : 1;

const userData: any = {
  name: formData.name,
  email: formData.email,
  role_id: parseInt(formData.role_id),
  status: userStatus, // Always included
  phone: formData.phone || undefined,
  address: formData.address || undefined,
};
```

## Testing

After backend fix, test with:

1. **Update user with status = 1 (active)**
   ```json
   {
       "name": "Test User",
       "email": "test@example.com",
       "role_id": 9,
       "status": 1,
       "phone": "",
       "address": ""
   }
   ```

2. **Update user with status = 0 (inactive)**
   ```json
   {
       "name": "Test User",
       "email": "test@example.com",
       "role_id": 9,
       "status": 0,
       "phone": "",
       "address": ""
   }
   ```

## Files to Check

1. **Backend Controller:** `app/Http/Controllers/Organization/UserController.php`
   - Method: `update(Request $request, $id)`
   - Check validation rules

2. **Backend Request Validation:** If using Form Requests
   - `app/Http/Requests/UpdateUserRequest.php`
   - Check validation rules

3. **Database Schema:** Verify `status` column exists
   - Table: `users`
   - Column: `status` (integer, nullable or not?)

## Recommendation

**Option 1 is recommended** - Make `status` optional (`sometimes`) so that:
- Frontend can update other fields without worrying about status
- Status only changes when explicitly provided
- More flexible API design

If status must always be provided, ensure the frontend always sends it (which has been fixed).

