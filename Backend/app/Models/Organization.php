<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Organization extends Model
{
    use HasFactory;
    use SoftDeletes;
    protected $table = 'organizations';
    protected $fillable = [
        'user_id',
        'country_id',
        'province_id',
        'state_id',
        'city_id',
        'first_name',
        'last_name',
        'professional_title',
        'phone_number',
        'postal_code',
        'address',
        'about_me',
        'social_link',
        'slug',
        'gender',
        'cv_file',
        'cv_filename',
        'level_id',
        'lat',
        'long',
        'auto_content_approval',
        'status',
        // Whitelabeling fields
        'organization_logo',
        'organization_favicon',
        'login_background_image',
        'login_template',
        'primary_color',
        'secondary_color',
        'accent_color',
        'custom_domain',
        'organization_name',
        'organization_tagline',
        'organization_description',
        'footer_text',
        'custom_css',
        'whitelabel_enabled',
        'subscription_plan',
        'max_users',
        'max_courses',
        'max_certificates',
        // Organization Administrative Settings (added)
        'siret',
        'tva_number',
        'naf_code',
        'rcs',
        'nda',
        'declaration_region',
        'nda_attribution_date',
        'uai_number',
        'legal_name',
        'city',
        'country',
        'phone',
        'fax',
        'address_complement',
        'director_name',
        'training_license_number',
        'qualiopi_certification_date',
        'welcome_booklet_path',
        'internal_regulations_path',
        'cgv_path',
        'logo_path',
        'qualiopi_certificate_path',
        // Company/Commercial fields
        'company_name',
        'website',
        'email',
        'phone_fixed',
        'phone_mobile',
        'zip_code',
        'vat_number',
        'siren',
        'ape_code',
        'capital',
        'legal_form',
        // Email configuration fields
        'email_sender',
        'email_bcc',
        'email_api_key',
        'email_config_type',
        'email_api_provider',
        'email_smtp_host',
        'email_smtp_port',
        'email_smtp_username',
        'email_smtp_password',
        'email_smtp_encryption',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function ranking_level()
    {
        return $this->belongsTo(RankingLevel::class, 'level_id');
    }

    public function getFullNameAttribute($value)
    {
        return $this->first_name.' '.$this->last_name;
    }

    public function courses()
    {
        return $this->hasMany(Course::class, 'organization_id');
    }

    public function publishedCourses()
    {
        return $this->hasMany(Course::class, 'organization_id')->where('status', 1);
    }

    public function pendingCourses()
    {
        return $this->hasMany(Course::class, 'organization_id')->where('status', 2);
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class, 'owner_user_id', 'user_id');
    }
   
    public function orders()
    {
        return $this->hasManyThrough(Order::class, Enrollment::class, 'owner_user_id', 'id', 'user_id', 'order_id');
    }

    public function country()
    {
        return $this->belongsTo(Country::class, 'country_id');
    }

    public function state()
    {
        return $this->belongsTo(State::class, 'state_id');
    }

    public function certificates()
    {
        return $this->hasMany(Instructor_certificate::class, 'organization_id');
    }

    public function awards()
    {
        return $this->hasMany(Instructor_awards::class, 'organization_id');
    }


    public function getNameAttribute()
    {
        return $this->first_name .' '. $this->last_name;
    }

    public function scopePending($query)
    {
        return $query->where('status', 0);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 1);
    }

    public function scopeBlocked($query)
    {
        return $query->where('status', 2);
    }

    public function scopeConsultationAvailable($query)
    {
        return $query->where('consultation_available', 1);
    }

    public function skills()
    {
        return $this->belongsToMany(Skill::class);
    }

    // Whitelabeling methods
    public function getLogoUrlAttribute()
    {
        if ($this->organization_logo) {
            // Ensure the path starts with uploads/
            $logoPath = $this->organization_logo;
            if (substr($logoPath, 0, 8) !== 'uploads/') {
                $logoPath = 'uploads/' . ltrim($logoPath, '/');
            }
            // Use asset() helper which handles URLs correctly
            return asset($logoPath);
        }
        return null; // Return null instead of default logo
    }

    public function getFaviconUrlAttribute()
    {
        if ($this->organization_favicon) {
            return asset($this->organization_favicon);
        }
        return asset('uploads/default/favicon.ico');
    }

    public function getLoginBackgroundImageUrlAttribute()
    {
        if ($this->login_background_image) {
            // Ensure the path starts with uploads/
            $bgPath = $this->login_background_image;
            if (substr($bgPath, 0, 8) !== 'uploads/') {
                $bgPath = 'uploads/' . ltrim($bgPath, '/');
            }
            // Use asset() helper which handles URLs correctly
            return asset($bgPath);
        }
        return null; // No default background image
    }

    public function isWhitelabelEnabled()
    {
        return $this->whitelabel_enabled == 1;
    }

    public function canCreateUsers()
    {
        $currentUsers = $this->organizationUsers()->count();
        
        return $currentUsers < $this->max_users;
    }

    public function canCreateCertificates()
    {
        $currentCertificates = $this->certificates()->count();
        return $currentCertificates < $this->max_certificates;
    }

    public function canCreateCourses()
    {
        $currentCourses = $this->courses()->count();
        return $currentCourses < $this->max_courses;
    }

    public function organizationUsers()
    {
        // Get all users belonging to this organization
        // This includes: organization owner, and users with organization_id
        return User::where(function($query) {
            $query->where('id', $this->user_id) // Organization owner
                  ->orWhere('organization_id', $this->id); // Users associated with this organization
        });
    }

    // Commercial Management Relationships
    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function quotes()
    {
        return $this->hasMany(Quote::class);
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(BankAccount::class);
    }

    public function defaultBankAccount()
    {
        return $this->hasOne(BankAccount::class)->where('is_default', true);
    }

    public function paymentConditionTemplates()
    {
        return $this->hasMany(PaymentConditionTemplate::class);
    }

    protected static function boot()
    {
        parent::boot();
        self::creating(function($model){
            $model->uuid =  Str::uuid()->toString();
        });
    }

    // Super Admin Relations
    public function superAdminInstance()
    {
        return $this->belongsTo(\App\Models\SuperAdmin\Instance::class, 'super_admin_instance_id');
    }

    public function superAdminPlan()
    {
        return $this->belongsTo(\App\Models\SuperAdmin\Plan::class, 'super_admin_plan_id');
    }

    public function superAdminSubscription()
    {
        return $this->belongsTo(\App\Models\SuperAdmin\Subscription::class, 'super_admin_subscription_id');
    }

    /**
     * Alias for superAdminSubscription for backward compatibility
     */
    public function subscription()
    {
        return $this->superAdminSubscription();
    }

    public function paymentGateways()
    {
        return $this->hasMany(\App\Models\SuperAdmin\OrganizationPaymentGateway::class);
    }

    public function smtpSettings()
    {
        return $this->hasMany(\App\Models\SuperAdmin\OrganizationSmtpSetting::class);
    }

    // White Label Relationships
    public function promotionalBanners()
    {
        return $this->hasMany(PromotionalBanner::class);
    }

    public function libraryTemplates()
    {
        return $this->hasMany(LibraryTemplate::class);
    }

    // Note: subscription() method already exists above (line 321-324)
    // Using organizationSubscription() as alias for white label subscription
    public function organizationSubscription()
    {
        return $this->hasOne(OrganizationSubscription::class);
    }

    public function activePromotionalBanners()
    {
        return $this->hasMany(PromotionalBanner::class)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    public function customDocuments()
    {
        return $this->hasMany(OrganizationCustomDocument::class);
    }

}
