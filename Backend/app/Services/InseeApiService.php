<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class InseeApiService
{
    protected $baseUrl = 'https://api.insee.fr/entreprises/sirene/V3';
    protected $token;
    
    public function __construct()
    {
        // L'API INSEE nécessite un token OAuth2
        // Pour le moment, on utilise l'API publique (limitée)
        $this->token = config('services.insee.token');
    }

    /**
     * Rechercher une entreprise par SIRET (14 chiffres)
     * 
     * @param string $siret
     * @return array|null
     */
    public function searchBySiret($siret)
    {
        // Nettoyer le SIRET (enlever espaces)
        $siret = preg_replace('/\s+/', '', $siret);
        
        if (strlen($siret) !== 14) {
            throw new \Exception('Le SIRET doit contenir 14 chiffres');
        }

        // Cache pour éviter trop de requêtes
        $cacheKey = "insee_siret_{$siret}";
        
        return Cache::remember($cacheKey, 3600, function () use ($siret) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders($this->getHeaders())
                    ->get("{$this->baseUrl}/siret/{$siret}");

                if ($response->successful()) {
                    $data = $response->json();
                    return $this->formatEtablissementData($data['etablissement'] ?? null);
                }

                if ($response->status() === 404) {
                    return null; // SIRET non trouvé
                }

                Log::error('INSEE API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return null;

            } catch (\Exception $e) {
                Log::error('INSEE API Exception: ' . $e->getMessage());
                return null;
            }
        });
    }

    /**
     * Rechercher une entreprise par SIREN (9 chiffres)
     * 
     * @param string $siren
     * @return array|null
     */
    public function searchBySiren($siren)
    {
        // Nettoyer le SIREN
        $siren = preg_replace('/\s+/', '', $siren);
        
        if (strlen($siren) !== 9) {
            throw new \Exception('Le SIREN doit contenir 9 chiffres');
        }

        $cacheKey = "insee_siren_{$siren}";
        
        return Cache::remember($cacheKey, 3600, function () use ($siren) {
            try {
                $response = Http::timeout(10)
                    ->withHeaders($this->getHeaders())
                    ->get("{$this->baseUrl}/siren/{$siren}");

                if ($response->successful()) {
                    $data = $response->json();
                    return $this->formatUniteLegaleData($data['uniteLegale'] ?? null);
                }

                if ($response->status() === 404) {
                    return null;
                }

                Log::error('INSEE API Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return null;

            } catch (\Exception $e) {
                Log::error('INSEE API Exception: ' . $e->getMessage());
                return null;
            }
        });
    }

    /**
     * Rechercher des entreprises par nom
     * 
     * @param string $name
     * @param int $limit
     * @return array
     */
    public function searchByName($name, $limit = 10)
    {
        $cacheKey = "insee_name_" . md5($name) . "_{$limit}";
        
        return Cache::remember($cacheKey, 1800, function () use ($name, $limit) {
            try {
                // Recherche dans les établissements
                $response = Http::timeout(10)
                    ->withHeaders($this->getHeaders())
                    ->get("{$this->baseUrl}/siret", [
                        'q' => "denominationUniteLegale:{$name}*",
                        'nombre' => $limit
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    $etablissements = $data['etablissements'] ?? [];
                    
                    $results = [];
                    foreach ($etablissements as $etab) {
                        $formatted = $this->formatEtablissementData($etab);
                        if ($formatted) {
                            $results[] = $formatted;
                        }
                    }
                    
                    return $results;
                }

                Log::error('INSEE Search Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);

                return [];

            } catch (\Exception $e) {
                Log::error('INSEE Search Exception: ' . $e->getMessage());
                return [];
            }
        });
    }

    /**
     * Formater les données d'un établissement
     */
    protected function formatEtablissementData($data)
    {
        if (!$data) {
            return null;
        }

        $uniteLegale = $data['uniteLegale'] ?? [];
        $adresseEtablissement = $data['adresseEtablissement'] ?? [];
        $periodesEtablissement = $data['periodesEtablissement'][0] ?? [];

        // Construire l'adresse
        $address = trim(implode(' ', array_filter([
            $adresseEtablissement['numeroVoieEtablissement'] ?? '',
            $adresseEtablissement['indiceRepetitionEtablissement'] ?? '',
            $adresseEtablissement['typeVoieEtablissement'] ?? '',
            $adresseEtablissement['libelleVoieEtablissement'] ?? '',
        ])));

        // Complément d'adresse
        $addressComplement = trim(implode(' ', array_filter([
            $adresseEtablissement['complementAdresseEtablissement'] ?? '',
            $adresseEtablissement['distributionSpecialeEtablissement'] ?? '',
        ])));

        if ($addressComplement) {
            $address = $addressComplement . ($address ? ', ' . $address : '');
        }

        // Déterminer le nom de l'entreprise
        $companyName = null;
        if (!empty($uniteLegale['denominationUniteLegale'])) {
            $companyName = $uniteLegale['denominationUniteLegale'];
        } elseif (!empty($uniteLegale['prenomUsuelUniteLegale']) && !empty($uniteLegale['nomUniteLegale'])) {
            $companyName = trim($uniteLegale['prenomUsuelUniteLegale'] . ' ' . $uniteLegale['nomUniteLegale']);
        }

        // TVA Intracommunautaire
        $siren = $data['siren'] ?? '';
        $tvaNumber = $this->calculateTvaNumber($siren);

        return [
            'siret' => $data['siret'] ?? null,
            'siren' => $siren,
            'company_name' => $companyName,
            'enseigne' => $periodesEtablissement['enseigne1Etablissement'] ?? null,
            'address' => $address ?: null,
            'postal_code' => $adresseEtablissement['codePostalEtablissement'] ?? null,
            'city' => $adresseEtablissement['libelleCommuneEtablissement'] ?? null,
            'country' => 'France',
            'tva_number' => $tvaNumber,
            'legal_form' => $uniteLegale['categorieJuridiqueUniteLegale'] ?? null,
            'activity_code' => $periodesEtablissement['activitePrincipaleEtablissement'] ?? null,
            'activity_label' => $periodesEtablissement['activitePrincipaleEtablissement'] ?? null, // Simplified
            'is_active' => ($data['etatAdministratifEtablissement'] ?? '') === 'A',
            'creation_date' => $data['dateCreationEtablissement'] ?? null,
        ];
    }

    /**
     * Formater les données d'une unité légale
     */
    protected function formatUniteLegaleData($data)
    {
        if (!$data) {
            return null;
        }

        $periodesUniteLegale = $data['periodesUniteLegale'][0] ?? [];

        $companyName = null;
        if (!empty($data['denominationUniteLegale'])) {
            $companyName = $data['denominationUniteLegale'];
        } elseif (!empty($data['prenomUsuelUniteLegale']) && !empty($data['nomUniteLegale'])) {
            $companyName = trim($data['prenomUsuelUniteLegale'] . ' ' . $data['nomUniteLegale']);
        }

        $tvaNumber = $this->calculateTvaNumber($data['siren'] ?? '');

        return [
            'siren' => $data['siren'] ?? null,
            'company_name' => $companyName,
            'tva_number' => $tvaNumber,
            'legal_form' => $periodesUniteLegale['categorieJuridiqueUniteLegale'] ?? null,
            'activity_code' => $periodesUniteLegale['activitePrincipaleUniteLegale'] ?? null,
            'is_active' => ($data['etatAdministratifUniteLegale'] ?? '') === 'A',
            'creation_date' => $data['dateCreationUniteLegale'] ?? null,
        ];
    }

    /**
     * Calculer le numéro de TVA intracommunautaire
     * Format: FR + clé (2 chiffres) + SIREN (9 chiffres)
     */
    protected function calculateTvaNumber($siren)
    {
        if (strlen($siren) !== 9) {
            return null;
        }

        $key = (12 + 3 * ($siren % 97)) % 97;
        return 'FR' . str_pad($key, 2, '0', STR_PAD_LEFT) . $siren;
    }

    /**
     * Obtenir les headers pour l'API
     */
    protected function getHeaders()
    {
        $headers = [
            'Accept' => 'application/json',
        ];

        // Si on a un token d'authentification
        if ($this->token) {
            $headers['Authorization'] = 'Bearer ' . $this->token;
        }

        return $headers;
    }

    /**
     * Vérifier si un SIRET est valide (algorithme de Luhn)
     */
    public static function isValidSiret($siret)
    {
        $siret = preg_replace('/\s+/', '', $siret);
        
        if (strlen($siret) !== 14 || !ctype_digit($siret)) {
            return false;
        }

        // Algorithme de Luhn
        $sum = 0;
        for ($i = 0; $i < 14; $i++) {
            $digit = (int)$siret[$i];
            if ($i % 2 === 0) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            $sum += $digit;
        }

        return $sum % 10 === 0;
    }

    /**
     * Vérifier si un SIREN est valide
     */
    public static function isValidSiren($siren)
    {
        $siren = preg_replace('/\s+/', '', $siren);
        
        if (strlen($siren) !== 9 || !ctype_digit($siren)) {
            return false;
        }

        // Algorithme de Luhn pour SIREN
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $digit = (int)$siren[$i];
            if ($i % 2 === 1) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit -= 9;
                }
            }
            $sum += $digit;
        }

        return $sum % 10 === 0;
    }
}

