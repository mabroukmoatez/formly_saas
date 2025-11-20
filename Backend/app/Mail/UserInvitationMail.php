<?php

namespace App\Mail;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $organization;
    public $setupUrl;
    public $logoUrl;
    public $primaryColor;
    public $secondaryColor;
    public $accentColor;

    /**
     * Create a new message instance.
     *
     * @param User $user
     * @param Organization $organization
     * @param string $setupUrl
     * @return void
     */
    public function __construct(User $user, Organization $organization, string $setupUrl)
    {
        $this->user = $user;
        $this->organization = $organization;
        $this->setupUrl = $setupUrl;
        
        // Get organization logo URL
        if ($organization->organization_logo) {
            $logoPath = $organization->organization_logo;
            if (substr($logoPath, 0, 8) !== 'uploads/') {
                $logoPath = 'uploads/' . ltrim($logoPath, '/');
            }
            $this->logoUrl = url($logoPath);
        } else {
            // Fallback to app logo
            $logoPath = get_option('app_logo', 'uploads/setting/1760365812-xBNKMC39wy.png');
            if (file_exists(public_path($logoPath))) {
                $this->logoUrl = asset($logoPath);
            } else {
                $this->logoUrl = asset('uploads/setting/1760365812-xBNKMC39wy.png');
            }
        }
        
        // Get organization colors with fallbacks
        $this->primaryColor = $organization->primary_color ?? '#007bff';
        $this->secondaryColor = $organization->secondary_color ?? '#6c757d';
        $this->accentColor = $organization->accent_color ?? '#28a745';
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $appName = get_option('app_name', config('app.name', 'Formly'));
        $fromEmail = get_option('MAIL_FROM_ADDRESS', config('mail.from.address', 'noreply@formly.fr'));
        $organizationName = $this->organization->organization_name ?? $appName;
        
        return $this->from($fromEmail, $appName)
            ->subject("Invitation à rejoindre {$organizationName}")
            ->view('emails.user-invitation')
            ->with([
                'user' => $this->user,
                'organization' => $this->organization,
                'setupUrl' => $this->setupUrl,
                'logoUrl' => $this->logoUrl,
                'primaryColor' => $this->primaryColor,
                'secondaryColor' => $this->secondaryColor,
                'accentColor' => $this->accentColor,
            ]);
    }
}
