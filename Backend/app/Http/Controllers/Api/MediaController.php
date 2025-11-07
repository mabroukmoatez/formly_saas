<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MediaService;
use Illuminate\Http\Request;

class MediaController extends Controller
{
    protected $mediaService;

    public function __construct(MediaService $mediaService)
    {
        $this->mediaService = $mediaService;
    }

    /**
     * Serve protected media file (requires authentication)
     * 
     * @param Request $request
     * @param string $path
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function serve(Request $request, string $path)
    {
        return $this->mediaService->serveProtectedFile($request, $path, false);
    }

    /**
     * Serve signed media file (URL signature validation)
     * 
     * @param Request $request
     * @param string $path
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function serveSignedFile(Request $request, string $path)
    {
        // Signature is already validated by middleware
        return $this->mediaService->serveProtectedFile($request, $path, true);
    }

    /**
     * Get file information
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getFileInfo(Request $request)
    {
        $request->validate([
            'path' => 'required|string'
        ]);

        try {
            $info = $this->mediaService->getFileInfo($request->path);
            
            return response()->json([
                'success' => true,
                'data' => $info
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], $e->getCode() ?: 500);
        }
    }
}

