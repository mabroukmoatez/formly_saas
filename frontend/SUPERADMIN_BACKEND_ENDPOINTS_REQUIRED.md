# SuperAdmin Backend Endpoints - Required Implementation

This document lists all the API endpoints that need to be implemented in the backend for the SuperAdmin pages to function properly.

## ✅ Already Implemented (Based on existing working pages)

These endpoints are already working:
- `/api/superadmin/dashboard` - GET
- `/api/superadmin/organizations` - GET, POST, PUT, DELETE
- `/api/superadmin/plans` - GET, POST, PUT, DELETE
- `/api/superadmin/subscriptions` - GET
- `/api/superadmin/instances` - GET
- `/api/superadmin/coupons` - GET, POST, PUT, DELETE
- `/api/superadmin/audit-logs` - GET
- `/api/superadmin/roles` - GET, POST, PUT, DELETE
- `/api/superadmin/system/settings` - GET, PUT
- `/api/superadmin/courses` - GET, POST (approve/reject)
- `/api/superadmin/support-tickets` - GET, POST (close/assign)
- `/api/superadmin/quality-articles` - GET, POST, PUT, DELETE
- `/api/superadmin/news` - GET, POST, PUT, DELETE
- `/api/superadmin/simulator/margin` - POST
- `/api/superadmin/aws/costs` - GET, POST (import)

---

## ❌ NOT YET IMPLEMENTED - Required Endpoints

### 1. Users Management

**Endpoint:** `GET /api/superadmin/users`
- **Status:** ❌ Returns `{"success":false,"message":"Not implemented yet"}`
- **Query Parameters:**
  - `search` (optional): Search term for users
  - `role` (optional): Filter by role (student, instructor, admin, superadmin)
  - `organization_id` (optional): Filter by organization
  - `per_page` (optional): Number of items per page (default: 25)
  - `page` (optional): Page number (default: 1)
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "organization": {
        "id": 1,
        "organization_name": "Acme Corp"
      },
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 25,
    "total": 250
  }
}
```

**Additional Endpoints:**
- `GET /api/superadmin/users/{id}` - Get user details
- `POST /api/superadmin/users` - Create user
- `PUT /api/superadmin/users/{id}` - Update user
- `DELETE /api/superadmin/users/{id}` - Delete user
- `POST /api/superadmin/users/{id}/suspend` - Suspend user
- `POST /api/superadmin/users/{id}/activate` - Activate user
- `POST /api/superadmin/users/{id}/reset-password` - Reset password
- `GET /api/superadmin/users/{id}/activity` - Get user activity
- `POST /api/superadmin/users/bulk-action` - Bulk actions

**Students Endpoint:**
- `GET /api/superadmin/users/students` - Get all students
  - Query params: `search`, `per_page`, `page`
  - Returns same format as users but filtered for students

**Instructors Endpoint:**
- `GET /api/superadmin/users/instructors` - Get all instructors
  - Query params: `search`, `per_page`, `page`
  - Returns same format as users but filtered for instructors

---

### 2. Categories Management

**Endpoint:** `GET /api/superadmin/categories`
- **Query Parameters:**
  - `search` (optional): Search term
  - `parent_id` (optional): Filter by parent category
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Technology",
      "slug": "technology",
      "parent": null,
      "courses_count": 15,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 25,
    "total": 120
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/categories` - Create category
- `PUT /api/superadmin/categories/{id}` - Update category
- `DELETE /api/superadmin/categories/{id}` - Delete category

---

### 3. Tags Management

**Endpoint:** `GET /api/superadmin/tags`
- **Query Parameters:**
  - `search` (optional): Search term
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "JavaScript",
      "slug": "javascript",
      "courses_count": 8,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 25,
    "total": 65
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/tags` - Create tag
- `PUT /api/superadmin/tags/{id}` - Update tag
- `DELETE /api/superadmin/tags/{id}` - Delete tag

---

### 4. Course Languages Management

**Endpoint:** `GET /api/superadmin/course-languages`
- **Query Parameters:**
  - `search` (optional): Search term
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "English",
      "code": "en",
      "courses_count": 45,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 2,
    "per_page": 25,
    "total": 30
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/course-languages` - Create language
- `PUT /api/superadmin/course-languages/{id}` - Update language
- `DELETE /api/superadmin/course-languages/{id}` - Delete language

---

### 5. Difficulty Levels Management

**Endpoint:** `GET /api/superadmin/difficulty-levels`
- **Query Parameters:**
  - `search` (optional): Search term
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Beginner",
      "level": 1,
      "courses_count": 20,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 25,
    "total": 5
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/difficulty-levels` - Create difficulty level
- `PUT /api/superadmin/difficulty-levels/{id}` - Update difficulty level
- `DELETE /api/superadmin/difficulty-levels/{id}` - Delete difficulty level

---

### 6. Certificates Management

**Endpoint:** `GET /api/superadmin/certificates`
- **Query Parameters:**
  - `search` (optional): Search term
  - `type` (optional): Filter by type (template, issued)
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Course Completion Certificate",
      "type": "template",
      "issued_count": 150,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 25,
    "total": 70
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/certificates` - Create certificate template
- `PUT /api/superadmin/certificates/{id}` - Update certificate
- `DELETE /api/superadmin/certificates/{id}` - Delete certificate

---

### 7. Payouts Management

**Endpoint:** `GET /api/superadmin/payouts`
- **Query Parameters:**
  - `status` (optional): Filter by status (pending, completed, rejected)
  - `organization_id` (optional): Filter by organization
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "instructor": {
        "id": 5,
        "name": "Jane Smith"
      },
      "amount": 1250.50,
      "currency": "EUR",
      "status": "pending",
      "created_at": "2024-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 25,
    "total": 120
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/payouts/{id}/process` - Process a payout

---

### 8. Promotions Management

**Endpoint:** `GET /api/superadmin/promotions`
- **Query Parameters:**
  - `status` (optional): Filter by status (active, scheduled, ended)
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Summer Sale",
      "discount_percentage": 20,
      "start_date": "2024-06-01T00:00:00Z",
      "end_date": "2024-08-31T23:59:59Z",
      "status": "active",
      "created_at": "2024-05-15T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 2,
    "per_page": 25,
    "total": 35
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/promotions` - Create promotion
- `PUT /api/superadmin/promotions/{id}` - Update promotion
- `DELETE /api/superadmin/promotions/{id}` - Delete promotion

---

### 9. Blogs Management

**Endpoint:** `GET /api/superadmin/blogs`
- **Query Parameters:**
  - `search` (optional): Search term
  - `status` (optional): Filter by status (published, draft)
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Getting Started with Online Learning",
      "slug": "getting-started-online-learning",
      "status": "published",
      "author": {
        "id": 1,
        "name": "Admin User"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 25,
    "total": 245
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/blogs` - Create blog post
- `PUT /api/superadmin/blogs/{id}` - Update blog post
- `DELETE /api/superadmin/blogs/{id}` - Delete blog post

---

### 10. Email Templates Management (SuperAdmin)

**Endpoint:** `GET /api/superadmin/email-templates`
- **Query Parameters:**
  - `search` (optional): Search term
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Welcome Email",
      "subject": "Welcome to our platform",
      "type": "system",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 3,
    "per_page": 25,
    "total": 65
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/email-templates` - Create email template
- `PUT /api/superadmin/email-templates/{id}` - Update email template
- `DELETE /api/superadmin/email-templates/{id}` - Delete email template

---

### 11. Notifications Management

**Endpoint:** `GET /api/superadmin/notifications`
- **Query Parameters:**
  - `type` (optional): Filter by type (email, push, sms)
  - `per_page` (optional): Number of items per page
  - `page` (optional): Page number
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "email",
      "title": "New Course Available",
      "message": "A new course has been added",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 25,
    "total": 120
  }
}
```

**Additional Endpoints:**
- `POST /api/superadmin/notifications/send` - Send notification

---

### 12. Analytics

**Endpoint:** `GET /api/superadmin/analytics`
- **Query Parameters:**
  - `period` (optional): Time period (24h, 7d, 30d, 90d, 1y)
  - `organization_id` (optional): Filter by organization
- **Response Format:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "new": 50,
      "active": 750
    },
    "courses": {
      "total": 200,
      "published": 180,
      "draft": 20
    },
    "revenue": {
      "total": 50000,
      "currency": "EUR"
    }
  }
}
```

---

### 13. Reports

**Endpoint:** `GET /api/superadmin/reports`
- **Query Parameters:**
  - `type` (optional): Report type (courses, users, revenue)
  - `start_date` (optional): Start date (ISO format)
  - `end_date` (optional): End date (ISO format)
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "courses",
      "name": "Course Report Q1 2024",
      "generated_at": "2024-04-01T00:00:00Z",
      "download_url": "/api/reports/download/1"
    }
  ]
}
```

**Additional Endpoints:**
- `POST /api/superadmin/reports/generate` - Generate new report

---

### 14. Features Management

**Endpoint:** `GET /api/superadmin/features`
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Video Streaming",
      "key": "video_streaming",
      "enabled": true,
      "description": "Enable video streaming functionality"
    }
  ]
}
```

**Additional Endpoints:**
- `POST /api/superadmin/features/{id}/toggle` - Toggle feature on/off
  - Body: `{ "enabled": true }`

---

### 15. Localization Management

**Endpoint:** `GET /api/superadmin/localization`
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "locale": "en",
      "name": "English",
      "enabled": true,
      "is_default": true
    }
  ]
}
```

**Additional Endpoints:**
- `PUT /api/superadmin/localization/{locale}` - Update localization settings
  - Body: `{ "enabled": true, "translations": {...} }`

---

### 16. Maintenance

**Endpoint:** `POST /api/superadmin/maintenance/{task}`
- **Tasks:**
  - `cache-clear` - Clear all system cache
  - `config-cache` - Cache configuration files
  - `route-cache` - Cache application routes
  - `view-cache` - Cache view templates
  - `backup` - Create system backup
- **Response Format:**
```json
{
  "success": true,
  "message": "Cache cleared successfully"
}
```

**Additional Endpoints:**
- `GET /api/superadmin/maintenance/health` - Get system health status
  - Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "cache": "operational",
    "storage": "available"
  }
}
```

---

### 17. Integrations Management

**Endpoint:** `GET /api/superadmin/integrations`
- **Response Format:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Stripe",
      "type": "payment",
      "is_connected": true,
      "description": "Payment gateway integration"
    }
  ]
}
```

**Additional Endpoints:**
- `GET /api/superadmin/integrations/{id}` - Get integration details
- `POST /api/superadmin/integrations` - Create integration
- `PUT /api/superadmin/integrations/{id}` - Update integration
- `DELETE /api/superadmin/integrations/{id}` - Delete integration
- `POST /api/superadmin/integrations/{id}/test` - Test integration
- `POST /api/superadmin/integrations/{id}/connect` - Connect integration

---

## 📝 General Notes

1. **Authentication:** All endpoints require SuperAdmin authentication
2. **Pagination:** All list endpoints should support pagination with `per_page` and `page` parameters
3. **Error Format:** All errors should follow this format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

4. **Success Format:** All successful responses should follow this format:
```json
{
  "success": true,
  "message": "Success message (optional)",
  "data": {...}
}
```

5. **Date Format:** Use ISO 8601 format for all dates (e.g., `2024-01-01T00:00:00Z`)

---

## 🎯 Priority Order for Implementation

1. **High Priority:**
   - Users Management (`/api/superadmin/users`)
   - Students (`/api/superadmin/users/students`)
   - Instructors (`/api/superadmin/users/instructors`)

2. **Medium Priority:**
   - Categories
   - Tags
   - Course Languages
   - Difficulty Levels
   - Certificates

3. **Low Priority:**
   - Payouts
   - Promotions
   - Blogs
   - Email Templates
   - Notifications
   - Analytics
   - Reports
   - Features
   - Localization
   - Integrations
   - Maintenance

---

## ✅ Testing

Once implemented, test each endpoint with:
- Valid requests
- Invalid requests (missing required fields)
- Unauthorized access (without SuperAdmin role)
- Pagination
- Search/filter functionality
- Error handling

