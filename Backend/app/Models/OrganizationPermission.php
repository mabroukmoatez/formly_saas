<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrganizationPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'category',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public static function getCategories()
    {
        return [
            'user_management' => 'User Management',
            'content_management' => 'Content Management',
            'course_management' => 'Course Management',
            'student_management' => 'Student Management',
            'financial_management' => 'Financial Management',
            'settings' => 'Settings',
            'reports' => 'Reports',
            'support' => 'Support'
        ];
    }
}
