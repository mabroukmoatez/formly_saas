<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCourseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isDraft = (bool) $this->input('isDraft', false);

        return [
            'title' => $isDraft ? ['nullable', 'string', 'max:255'] : ['required', 'string', 'min:3', 'max:255'],
            'description' => $isDraft ? ['nullable', 'string'] : ['required', 'string', 'min:10'],
            'category_id' => $isDraft ? ['nullable', 'integer', 'exists:categories,id'] : ['required', 'integer', 'exists:categories,id'],
            'price' => $isDraft ? ['nullable', 'numeric', 'min:0'] : ['required', 'numeric', 'min:0'],
            'currency' => $isDraft ? ['nullable', 'string', 'size:3'] : ['required', 'string', 'size:3'],
            'isPublished' => ['nullable', 'boolean'],
            'isDraft' => ['nullable', 'boolean'],
            // Additional fields for comprehensive course creation
            'subtitle' => ['nullable', 'string', 'max:1000'],
            'course_type' => ['nullable', 'integer', 'in:1,2'],
            'subcategory_id' => ['nullable', 'integer', 'exists:subcategories,id'],
            'price_ht' => ['nullable', 'numeric', 'min:0'],
            'vat_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'old_price' => ['nullable', 'numeric', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:0'],
            'duration_days' => ['nullable', 'integer', 'min:0'],
            'target_audience' => ['nullable', 'string', 'max:1000'],
            'prerequisites' => ['nullable', 'string', 'max:1000'],
            'learningOutcomes' => ['nullable', 'array'],
            'learningOutcomes.*' => ['string', 'max:500'],
            'methods' => ['nullable', 'string', 'max:2000'],
            'specifics' => ['nullable', 'string', 'max:2000'],
            'course_language_id' => ['nullable', 'integer', 'exists:course_languages,id'],
            'difficulty_level_id' => ['nullable', 'integer', 'exists:difficulty_levels,id'],
            'learner_accessibility' => ['nullable', 'integer', 'in:1,2'],
            'access_period' => ['nullable', 'integer', 'min:0'],
            'drip_content' => ['nullable', 'boolean'],
            'intro_video_check' => ['nullable', 'boolean'],
            'youtube_video_id' => ['nullable', 'string', 'max:255'],
            'is_subscription_enable' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:50'],
            'image' => ['nullable', 'image', 'mimes:jpg,png,jpeg,gif,svg', 'max:2048'],
            'video' => ['nullable', 'file', 'mimes:mp4,avi,mov,wmv', 'max:102400'],
            'og_image' => ['nullable', 'image', 'mimes:jpg,png,jpeg,gif,svg', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [];
    }
}


