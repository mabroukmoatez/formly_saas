<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Session extends Model
{
    use HasFactory;

    protected $table = 'sessions_training';
    protected $primaryKey = 'id';
    protected $appends = ['image_url', 'video_url', 'has_image', 'has_video', 'media_status'];
    
    protected $casts = [
        'tags' => 'array',
        'learning_outcomes' => 'array',
        'price' => 'decimal:2',
        'price_ht' => 'decimal:2',
        'vat_percentage' => 'decimal:2',
        'old_price' => 'decimal:2',
        'is_featured' => 'boolean',
        'drip_content' => 'boolean',
        'intro_video_check' => 'boolean',
        'is_subscription_enable' => 'boolean',
        'private_mode' => 'boolean',
        'session_start_date' => 'date',
        'session_end_date' => 'date',
        'max_participants' => 'integer',
        'current_participants' => 'integer',
    ];

    protected $fillable = [
        'uuid',
        'user_id',
        'session_type',
        'instructor_id',
        'organization_id',
        'category_id',
        'subcategory_id',
        'session_language_id',
        'difficulty_level_id',
        'title',
        'subtitle',
        'description',
        'description_footer',
        'feature_details',
        'price',
        'price_ht',
        'vat_percentage',
        'currency',
        'old_price',
        'duration',
        'duration_days',
        'session_start_date',
        'session_end_date',
        'session_start_time',
        'session_end_time',
        'max_participants',
        'current_participants',
        'target_audience',
        'prerequisites',
        'tags',
        'learning_outcomes',
        'methods',
        'specifics',
        'learner_accessibility',
        'image',
        'video',
        'slug',
        'is_featured',
        'status',
        'drip_content',
        'access_period',
        'intro_video_check',
        'youtube_video_id',
        'is_subscription_enable',
        'private_mode',
        'meta_title',
        'meta_description',
        'meta_keywords',
        'og_image',
    ];

    public function getImageUrlAttribute()
    {
        if ($this->image) {
            return asset($this->image);
        }
        return null;
    }

    public function getVideoUrlAttribute()
    {
        if ($this->video) {
            return asset($this->video);
        }
        return null;
    }

    public function getHasImageAttribute()
    {
        return !empty($this->image);
    }

    public function getHasVideoAttribute()
    {
        return !empty($this->video);
    }

    public function getMediaStatusAttribute()
    {
        return [
            'has_image' => $this->has_image,
            'has_video' => $this->has_video,
            'intro_video_check' => $this->intro_video_check,
            'youtube_video_id' => $this->youtube_video_id
        ];
    }
   
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function instructor()
    {
        return $this->belongsTo(Instructor::class, 'instructor_id');
    }

    public function organization()
    {
        return $this->belongsTo(Organization::class, 'organization_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class, 'subcategory_id');
    }

    public function language()
    {
        return $this->belongsTo(Course_language::class, 'session_language_id');
    }

    public function difficultyLevel()
    {
        return $this->belongsTo(Difficulty_level::class, 'difficulty_level_id');
    }

    public function key_points()
    {
        return $this->hasMany(SessionKeyPoint::class, 'session_id');
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'session_tags', 'session_id', 'tag_id');
    }

    public function notices()
    {
        return $this->hasMany(SessionNoticeBoard::class, 'session_id');
    }

    public function participants()
    {
        return $this->hasMany(SessionParticipant::class, 'session_id');
    }

    public function sessionInstances()
    {
        return $this->hasMany(SessionInstance::class, 'session_uuid', 'uuid')->orderBy('start_date')->orderBy('start_time');
    }

    public function studentCertificate()
    {
        return $this->hasOne(SessionCertificate::class, 'session_id')->where('user_id', auth()->id());
    }

    public function orderItems()
    {
        return $this->hasMany(SessionOrderItem::class, 'session_id');
    }

    public function reviews()
    {
        return $this->hasMany(SessionReview::class, 'session_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }
  
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', 1);
    }
   
    public function scopeUpcoming($query)
    {
        return $query->where('status', STATUS_UPCOMING_APPROVED);
    }

    public function getImagePathAttribute()
    {
        if ($this->image) {
            return $this->image;
        } else {
            return 'uploads/default/session.jpg';
        }
    }

    public function certificate()
    {
        return $this->hasOne(SessionCertificateTemplate::class, 'session_id');
    }

    // Session-specific relationships
    public function sections()
    {
        return $this->hasMany(SessionSection::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function chapters()
    {
        return $this->hasMany(SessionChapter::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function modules()
    {
        return $this->hasMany(SessionModule::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function objectives()
    {
        return $this->hasMany(SessionObjective::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function additionalFees()
    {
        return $this->hasMany(SessionAdditionalFee::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function documents()
    {
        return $this->hasMany(SessionDocument::class, 'session_uuid', 'uuid');
    }

    public function questionnaires()
    {
        return $this->hasMany(SessionQuestionnaire::class, 'session_uuid', 'uuid');
    }

    public function workflowActions()
    {
        return $this->hasMany(SessionWorkflowAction::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function workflow()
    {
        return $this->hasMany(SessionWorkflowAction::class, 'session_uuid', 'uuid')->orderBy('order_index');
    }

    public function trainers()
    {
        return $this->belongsToMany(Trainer::class, 'session_trainers', 'session_uuid', 'trainer_id', 'uuid', 'uuid')
                    ->withPivot('permissions', 'assigned_at');
    }

    protected static function booted()
    {
        self::creating(function ($model){
            $authUser = auth()->user();
            $model->uuid = Str::uuid()->toString();
            $model->user_id = $authUser->id;
            $model->instructor_id = $authUser->instructor ? $authUser->instructor->id : null;
            $model->organization_id = $authUser->organization ? $authUser->organization->id : null;
        });
    }
}

