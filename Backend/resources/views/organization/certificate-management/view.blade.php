<div class="certificate-preview" style="position: relative; width: 100%; max-width: 1030px; margin: 0 auto;">
    @if($certificate->image)
        <img src="{{ $certificate->image_url }}" alt="Certificate Background" style="width: 100%; height: auto; position: absolute; top: 0; left: 0; z-index: 1;">
    @else
        <img src="{{ asset('frontend/assets/img/certificate.jpg') }}" alt="Certificate Background" style="width: 100%; height: auto; position: absolute; top: 0; left: 0; z-index: 1;">
    @endif
    
    <div class="certificate-content" style="position: relative; z-index: 2; width: 100%; height: 734px;">
        
        <!-- Certificate Number -->
        @if($certificate->show_number == 'yes')
            <div style="position: absolute; left: {{ $certificate->number_x_position ?? 0 }}px; top: {{ $certificate->number_y_position ?? 20 }}px; font-size: {{ $certificate->number_font_size ?? 20 }}px; color: {{ $certificate->number_font_color ?? '#363234' }}; font-weight: bold;">
                Certificate #{{ $certificate->certificate_number }}
            </div>
        @endif
        
        <!-- Certificate Title -->
        @if($certificate->title)
            <div style="position: absolute; left: {{ $certificate->title_x_position ?? 0 }}px; top: {{ $certificate->title_y_position ?? 100 }}px; font-size: {{ $certificate->title_font_size ?? 30 }}px; color: {{ $certificate->title_font_color ?? '#363234' }}; font-weight: bold; text-align: center; width: 100%;">
                {{ $certificate->title }}
            </div>
        @endif
        
        <!-- Student Name -->
        @if($certificate->show_student_name == 'yes')
            <div style="position: absolute; left: {{ $certificate->student_name_x_position ?? 0 }}px; top: {{ $certificate->student_name_y_position ?? 200 }}px; font-size: {{ $certificate->student_name_font_size ?? 24 }}px; color: {{ $certificate->student_name_font_color ?? '#363234' }}; font-weight: bold; text-align: center; width: 100%;">
                {student_name}
            </div>
        @endif
        
        <!-- Certificate Body -->
        @if($certificate->body)
            <div style="position: absolute; left: {{ $certificate->body_x_position ?? 0 }}px; top: {{ $certificate->body_y_position ?? 300 }}px; font-size: {{ $certificate->body_font_size ?? 16 }}px; color: {{ $certificate->body_font_color ?? '#363234' }}; text-align: center; width: 100%; max-width: 800px; margin: 0 auto;">
                {{ $certificate->body }}
            </div>
        @endif
        
        <!-- Date -->
        @if($certificate->show_date == 'yes')
            <div style="position: absolute; left: {{ $certificate->date_x_position ?? 0 }}px; top: {{ $certificate->date_y_position ?? 400 }}px; font-size: {{ $certificate->date_font_size ?? 14 }}px; color: {{ $certificate->date_font_color ?? '#363234' }}; text-align: center; width: 100%;">
                {completion_date}
            </div>
        @endif
        
        <!-- Role 1 Signature -->
        @if($certificate->role_1_show == 'yes' && $certificate->role_1_title)
            <div style="position: absolute; left: {{ $certificate->role_1_x_position ?? 200 }}px; top: {{ $certificate->role_1_y_position ?? 600 }}px; text-align: center;">
                @if($certificate->role_1_signature)
                    <img src="{{ $certificate->role_1_signature_url }}" alt="Signature" style="max-width: 120px; max-height: 60px;">
                @endif
                <div style="font-size: {{ $certificate->role_1_font_size ?? 14 }}px; color: {{ $certificate->role_1_font_color ?? '#363234' }}; margin-top: 5px;">
                    {{ $certificate->role_1_title }}
                </div>
            </div>
        @endif
        
        <!-- Role 2 Signature -->
        @if($certificate->role_2_show == 'yes' && $certificate->role_2_title)
            <div style="position: absolute; left: {{ $certificate->role_2_x_position ?? 600 }}px; top: {{ $certificate->role_2_y_position ?? 600 }}px; text-align: center;">
                <div style="font-size: {{ $certificate->role_2_font_size ?? 14 }}px; color: {{ $certificate->role_2_font_color ?? '#363234' }};">
                    {{ $certificate->role_2_title }}
                </div>
            </div>
        @endif
        
    </div>
</div>
