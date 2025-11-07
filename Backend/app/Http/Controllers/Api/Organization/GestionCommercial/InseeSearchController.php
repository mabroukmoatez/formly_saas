<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Services\InseeApiService;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InseeSearchController extends Controller
{
    use ApiStatusTrait;

    protected $inseeService;

    public function __construct(InseeApiService $inseeService)
    {
        $this->inseeService = $inseeService;
    }

    /**
     * Rechercher une entreprise par SIRET
     * GET /api/organization/commercial/insee/search-siret?siret=12345678901234
     */
    public function searchBySiret(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'siret' => 'required|string|min:14|max:14',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
        }

        $siret = $request->siret;

        // Valider le format SIRET
        if (!InseeApiService::isValidSiret($siret)) {
            return $this->failed([], 'Le numéro SIRET est invalide (vérification de la clé)');
        }

        try {
            $result = $this->inseeService->searchBySiret($siret);

            if (!$result) {
                return $this->failed([], 'Aucune entreprise trouvée avec ce SIRET', 404);
            }

            if (!$result['is_active']) {
                return $this->success($result, 'Entreprise trouvée mais inactive (fermée)');
            }

            return $this->success($result, 'Entreprise trouvée avec succès');

        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la recherche: ' . $e->getMessage());
        }
    }

    /**
     * Rechercher une entreprise par SIREN
     * GET /api/organization/commercial/insee/search-siren?siren=123456789
     */
    public function searchBySiren(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'siren' => 'required|string|min:9|max:9',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
        }

        $siren = $request->siren;

        // Valider le format SIREN
        if (!InseeApiService::isValidSiren($siren)) {
            return $this->failed([], 'Le numéro SIREN est invalide (vérification de la clé)');
        }

        try {
            $result = $this->inseeService->searchBySiren($siren);

            if (!$result) {
                return $this->failed([], 'Aucune entreprise trouvée avec ce SIREN', 404);
            }

            return $this->success($result, 'Entreprise trouvée avec succès');

        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la recherche: ' . $e->getMessage());
        }
    }

    /**
     * Rechercher des entreprises par nom
     * GET /api/organization/commercial/insee/search-name?name=Société&limit=10
     */
    public function searchByName(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|min:3',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
        }

        $name = $request->name;
        $limit = $request->limit ?? 10;

        try {
            $results = $this->inseeService->searchByName($name, $limit);

            if (empty($results)) {
                return $this->success([], 'Aucune entreprise trouvée avec ce nom');
            }

            return $this->success([
                'results' => $results,
                'count' => count($results),
            ], 'Entreprises trouvées avec succès');

        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la recherche: ' . $e->getMessage());
        }
    }

    /**
     * Recherche unifiée (SIRET, SIREN ou Nom)
     * GET /api/organization/commercial/insee/search?q=12345678901234
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:3',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée: ' . $validator->errors()->first());
        }

        $query = trim($request->q);
        $cleanQuery = preg_replace('/\s+/', '', $query);

        try {
            // Si c'est un SIRET (14 chiffres)
            if (strlen($cleanQuery) === 14 && ctype_digit($cleanQuery)) {
                if (InseeApiService::isValidSiret($cleanQuery)) {
                    $result = $this->inseeService->searchBySiret($cleanQuery);
                    
                    if ($result) {
                        return $this->success([
                            'type' => 'siret',
                            'result' => $result
                        ], 'Entreprise trouvée par SIRET');
                    }
                }
                return $this->failed([], 'SIRET invalide ou entreprise non trouvée');
            }

            // Si c'est un SIREN (9 chiffres)
            if (strlen($cleanQuery) === 9 && ctype_digit($cleanQuery)) {
                if (InseeApiService::isValidSiren($cleanQuery)) {
                    $result = $this->inseeService->searchBySiren($cleanQuery);
                    
                    if ($result) {
                        return $this->success([
                            'type' => 'siren',
                            'result' => $result
                        ], 'Entreprise trouvée par SIREN');
                    }
                }
                return $this->failed([], 'SIREN invalide ou entreprise non trouvée');
            }

            // Sinon, recherche par nom
            $results = $this->inseeService->searchByName($query, 10);
            
            return $this->success([
                'type' => 'name',
                'results' => $results,
                'count' => count($results)
            ], count($results) > 0 ? 'Entreprises trouvées par nom' : 'Aucune entreprise trouvée');

        } catch (\Exception $e) {
            return $this->failed([], 'Erreur lors de la recherche: ' . $e->getMessage());
        }
    }

    /**
     * Valider un SIRET
     * GET /api/organization/commercial/insee/validate-siret?siret=12345678901234
     */
    public function validateSiret(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'siret' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée');
        }

        $siret = preg_replace('/\s+/', '', $request->siret);
        $isValid = InseeApiService::isValidSiret($siret);

        return $this->success([
            'siret' => $request->siret,
            'is_valid' => $isValid,
            'formatted' => $this->formatSiret($siret),
        ], $isValid ? 'SIRET valide' : 'SIRET invalide');
    }

    /**
     * Valider un SIREN
     * GET /api/organization/commercial/insee/validate-siren?siren=123456789
     */
    public function validateSiren(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'siren' => 'required|string',
        ]);

        if ($validator->fails()) {
            return $this->failed(['errors' => $validator->errors()], 'Validation échouée');
        }

        $siren = preg_replace('/\s+/', '', $request->siren);
        $isValid = InseeApiService::isValidSiren($siren);

        return $this->success([
            'siren' => $request->siren,
            'is_valid' => $isValid,
            'formatted' => $this->formatSiren($siren),
        ], $isValid ? 'SIREN valide' : 'SIREN invalide');
    }

    /**
     * Formater un SIRET pour l'affichage (XXX XXX XXX XXXXX)
     */
    protected function formatSiret($siret)
    {
        if (strlen($siret) !== 14) {
            return $siret;
        }

        return substr($siret, 0, 3) . ' ' . 
               substr($siret, 3, 3) . ' ' . 
               substr($siret, 6, 3) . ' ' . 
               substr($siret, 9, 5);
    }

    /**
     * Formater un SIREN pour l'affichage (XXX XXX XXX)
     */
    protected function formatSiren($siren)
    {
        if (strlen($siren) !== 9) {
            return $siren;
        }

        return substr($siren, 0, 3) . ' ' . 
               substr($siren, 3, 3) . ' ' . 
               substr($siren, 6, 3);
    }
}

