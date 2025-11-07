# Formly LMS Platform

A comprehensive Learning Management System (LMS) built with Laravel, featuring organization management, white-labeling, certificate generation, and multi-tenant capabilities.

## 🚀 Features

- **Multi-Organization Support**: Manage multiple organizations with individual branding
- **White-Labeling**: Custom domains, logos, colors, and branding for each organization
- **Certificate Management**: Create and manage certificates with live preview
- **User Management**: Role-based access control for instructors, students, and organizations
- **Course Management**: Complete course creation and management system
- **Live Classes**: Integrated live class functionality
- **Payment Integration**: Multiple payment gateway support
- **Responsive Design**: Mobile-friendly interface

## 📋 System Requirements

- **PHP**: 8.1 or higher
- **MySQL**: 5.7 or higher
- **Web Server**: Apache/Nginx
- **Composer**: Latest version
- **Node.js**: 16+ (for asset compilation)

## 🛠️ Manual Installation Guide

### Step 1: Download and Extract

1. Download the Formly LMS platform files
2. Extract to your web server directory (e.g., `C:\wamp64\www\formly.fr\`)

### Step 2: Database Setup

#### Method 1: Automatic Import (Recommended) 🚀

Use the automated database import script:

1. **Via Command Line**:
   ```bash
   php install_database.php
   ```

2. **Via Web Browser**:
   - Open: `http://localhost/form.fr/install_database.php`
   - Follow the on-screen instructions
   - The script will automatically:
     - Check for `base.sql` file
     - Read database configuration from `.env`
     - Create the database if it doesn't exist
     - Import all SQL statements
     - Verify the import

**Note:** Make sure your `.env` file is configured with correct database credentials before running the script.

#### Method 2: Manual Import

1. **Create Database**:
   ```sql
   CREATE DATABASE formly_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Import Database**:
   - Use phpMyAdmin or MySQL command line
   - Import the `base.sql` file into your database
   ```bash
   mysql -u root -p formly_lms < base.sql
   ```

### Step 3: Environment Configuration

1. **Copy Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Configure `.env` File**:
   ```env
   APP_NAME="Formly LMS"
   APP_ENV=local
   APP_KEY=base64:YOUR_APP_KEY_HERE
   APP_DEBUG=true
   APP_URL=http://localhost/formly.fr

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=formly_lms
   DB_USERNAME=root
   DB_PASSWORD=

   BROADCAST_DRIVER=log
   CACHE_DRIVER=file
   FILESYSTEM_DISK=local
   QUEUE_CONNECTION=sync
   SESSION_DRIVER=file
   SESSION_LIFETIME=120

   MEMCACHED_HOST=127.0.0.1

   REDIS_HOST=127.0.0.1
   REDIS_PASSWORD=null
   REDIS_PORT=6379

   MAIL_MAILER=smtp
   MAIL_HOST=mailhog
   MAIL_PORT=1025
   MAIL_USERNAME=null
   MAIL_PASSWORD=null
   MAIL_ENCRYPTION=null
   MAIL_FROM_ADDRESS="hello@example.com"
   MAIL_FROM_NAME="${APP_NAME}"

   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET=
   AWS_USE_PATH_STYLE_ENDPOINT=false

   PUSHER_APP_ID=
   PUSHER_APP_KEY=
   PUSHER_APP_SECRET=
   PUSHER_HOST=
   PUSHER_PORT=443
   PUSHER_SCHEME=https
   PUSHER_APP_CLUSTER=mt1

   VITE_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
   VITE_PUSHER_HOST="${PUSHER_HOST}"
   VITE_PUSHER_PORT="${PUSHER_PORT}"
   VITE_PUSHER_SCHEME="${PUSHER_SCHEME}"
   VITE_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"
   ```

3. **Generate Application Key**:
   ```bash
   php artisan key:generate
   ```

### Step 4: Install Dependencies

1. **Install PHP Dependencies**:
   ```bash
   composer install
   ```

2. **Install Node.js Dependencies**:
   ```bash
   npm install
   ```

3. **Compile Assets**:
   ```bash
   npm run dev
   ```

### Step 5: Set Permissions

1. **Set Directory Permissions** (Linux/Mac):
   ```bash
   chmod -R 755 storage bootstrap/cache
   chown -R www-data:www-data storage bootstrap/cache
   ```

2. **Windows**: Ensure the web server has read/write access to:
   - `storage/` directory
   - `bootstrap/cache/` directory
   - `public/uploads/` directory

### Step 6: Database Configuration

1. **Run Migrations** (if needed):
   ```bash
   php artisan migrate
   ```

2. **Seed Database** (optional):
   ```bash
   php artisan db:seed
   ```

## 🌐 Organization Subdomain Setup (Localhost)

### Method 1: Simple Localhost Access (Recommended)

1. **Access Organization Branded Pages**:
   ```
   http://localhost/formly.fr/org/{subdomain}/login
   http://localhost/formly.fr/org/{subdomain}/dashboard
   ```

2. **Example URLs**:
   ```
   http://localhost/formly.fr/org/hamdi/login
   http://localhost/formly.fr/org/hamdi/dashboard
   ```

### Method 2: Subdomain Configuration (Advanced)

1. **Configure Apache Virtual Host**:
   ```apache
   <VirtualHost *:80>
       ServerName formly.fr
       ServerAlias *.formly.fr
       DocumentRoot "C:/wamp64/www/formly.fr/public"
       
       <Directory "C:/wamp64/www/formly.fr/public">
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

2. **Update Windows Hosts File** (`C:\Windows\System32\drivers\etc\hosts`):
   ```
   127.0.0.1 formly.fr
   127.0.0.1 hamdi.formly.fr
   127.0.0.1 yourorg.formly.fr
   ```

3. **Access via Subdomain**:
   ```
   http://hamdi.formly.fr
   http://yourorg.formly.fr
   ```

## 🔧 Organization Configuration

### Setting Up Organization Branding

1. **Access Admin Panel**:
   ```
   http://localhost/formly.fr/admin
   ```

2. **Create Organization**:
   - Go to Organizations → Add Organization
   - Fill in organization details
   - Set custom subdomain (e.g., "hamdi")
   - Enable whitelabeling

3. **Configure Branding**:
   - Upload organization logo
   - Set primary, secondary, and accent colors
   - Customize login page background
   - Set organization name and tagline

### Default Login Credentials

- **Admin**: Check the database `users` table for admin credentials
- **Organization**: Use the credentials created during organization setup

## 📁 Directory Structure

```
formly.fr/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Admin/
│   │   │   ├── Organization/
│   │   │   └── ...
│   │   └── Middleware/
│   ├── Models/
│   └── ...
├── database/
│   ├── migrations/
│   └── seeders/
├── public/
│   ├── uploads/
│   └── ...
├── resources/
│   ├── views/
│   │   ├── admin/
│   │   ├── organization/
│   │   └── ...
│   └── ...
├── routes/
│   ├── web.php
│   ├── admin.php
│   ├── organization.php
│   └── ...
└── ...
```

## 🎯 Key Features Usage

### Organization Management
- **Dashboard**: `http://localhost/formly.fr/organization/dashboard`
- **Settings**: `http://localhost/formly.fr/organization/settings`
- **User Management**: `http://localhost/formly.fr/organization/user-management`
- **Certificate Management**: `http://localhost/formly.fr/organization/certificate-management`

### Admin Panel
- **Dashboard**: `http://localhost/formly.fr/admin/dashboard`
- **Organizations**: `http://localhost/formly.fr/admin/organizations`
- **Users**: `http://localhost/formly.fr/admin/users`
- **Settings**: `http://localhost/formly.fr/admin/settings`

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default admin and user passwords
2. **Environment Security**: Set `APP_DEBUG=false` in production
3. **File Permissions**: Ensure proper file permissions on sensitive directories
4. **Database Security**: Use strong database passwords and limit access

## 🐛 Troubleshooting

### Common Issues

1. **Logo Not Displaying**:
   - Check file permissions on `public/uploads/` directory
   - Verify logo file exists and is accessible
   - Clear browser cache

2. **Organization Branding Not Working**:
   - Ensure `whitelabel_enabled = 1` in database
   - Check organization status is approved
   - Verify middleware is applied correctly

3. **Database Connection Issues**:
   - Verify database credentials in `.env`
   - Ensure database exists and is accessible
   - Check MySQL service is running

4. **Permission Errors**:
   - Set proper file permissions
   - Ensure web server has access to directories
   - Check SELinux settings (if applicable)

## 📞 Support

For technical support and documentation:
- Check the application logs in `storage/logs/`
- Review the database for any missing data
- Ensure all dependencies are properly installed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Formly LMS Platform** - Empowering education through technology.