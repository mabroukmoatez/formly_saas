<?php

namespace App\Mail;

use App\Models\Organization;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrganizationWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $organization;
    public $user;
    public $subdomainUrl;
    public $logoUrl;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct(Organization $organization, $user, $subdomainUrl)
    {
        $this->organization = $organization;
        $this->user = $user;
        $this->subdomainUrl = $subdomainUrl;
        
        // Try to get logo from settings, fallback to default
        $logoPath = get_option('app_logo', 'uploads/setting/1760365812-xBNKMC39wy.png');
        if (file_exists(public_path($logoPath))) {
            $this->logoUrl = asset($logoPath);
        } else {
            // Fallback to the provided logo URL
            $this->logoUrl = asset('uploads/setting/1760365812-xBNKMC39wy.png');
        }
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $appName = get_option('app_name', 'Formly');
        $fromEmail = get_option('MAIL_FROM_ADDRESS', config('mail.from.address', 'noreply@formly.fr'));
        
        return $this->from($fromEmail, $appName)
            ->subject('Bienvenue sur ' . $appName . ' - Votre organisation a été créée avec succès')
            ->view('mail.organization-welcome')
            ->with([
                'organization' => $this->organization,
                'user' => $this->user,
                'subdomainUrl' => $this->subdomainUrl,
                'logoUrl' => $this->logoUrl,
                'appName' => $appName,
            ]);
    }
}
