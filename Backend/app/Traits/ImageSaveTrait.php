<?php


namespace App\Traits;


use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use File;
use Intervention\Image\Facades\Image;
use Vimeo\Vimeo;

trait ImageSaveTrait
{
    private function saveImage($destination, $attribute , $width = NULL, $height = NULL): string
    {
        if (!File::isDirectory(base_path().'/public/uploads/'.$destination)){
            File::makeDirectory(base_path().'/public/uploads/'.$destination, 0777, true, true);
        }

        // Validate file upload
        if (!$attribute->isValid()) {
            throw new \Exception('File upload failed: ' . $attribute->getErrorMessage());
        }

        if ($attribute->extension() == 'svg'){
            $file_name = time().Str::random(10).'.'.$attribute->extension();
            $path = 'uploads/'. $destination .'/' .$file_name;
            $uploadPath = public_path('uploads/' . $destination . '/');
            
            $moved = $attribute->move($uploadPath, $file_name);
            if (!$moved || !File::exists($uploadPath . $file_name)) {
                throw new \Exception('Failed to move SVG file to destination directory');
            }
            return $path;
        }

        try {
            $img = Image::make($attribute);
            if ($width != null && $height != null && is_int($width) && is_int($height)) {
                $img->resize($width, $height, function ($constraint) {
                    $constraint->aspectRatio();
                });
            }

            $returnPath = 'uploads/'. $destination .'/' . time().'-'. Str::random(10) . '.' . $attribute->extension();
            $savePath = base_path().'/public/'.$returnPath;
            $img->save($savePath);
            
            // Verify the file was saved
            if (!File::exists($savePath)) {
                throw new \Exception('Failed to save image file');
            }
            
            return $returnPath;
        } catch (\Exception $e) {
            Log::error('Image save error: ' . $e->getMessage(), [
                'file_name' => $attribute->getClientOriginalName(),
                'destination' => $destination,
                'exception' => $e
            ]);
            throw $e;
        }
    }

    private function updateImage($destination, $new_attribute, $old_attribute , $width = NULL, $height = NULL): string
    {
        if (!File::isDirectory(base_path().'/public/uploads/'.$destination)){
            File::makeDirectory(base_path().'/public/uploads/'.$destination, 0777, true, true);
        }

        // Validate file upload
        if (!$new_attribute->isValid()) {
            throw new \Exception('File upload failed: ' . $new_attribute->getErrorMessage());
        }

        if ($new_attribute->extension() == 'svg'){
            $file_name = time().Str::random(10).'.'.$new_attribute->extension();
            $path = 'uploads/'. $destination .'/' .$file_name;
            $uploadPath = public_path('uploads/' . $destination . '/');
            
            $moved = $new_attribute->move($uploadPath, $file_name);
            if (!$moved || !File::exists($uploadPath . $file_name)) {
                throw new \Exception('Failed to move SVG file to destination directory');
            }
            
            // Only delete old file if new file was successfully saved
            if ($old_attribute && File::exists($old_attribute)) {
                File::delete($old_attribute);
            }
            return $path;
        }

        try {
            $img = Image::make($new_attribute);
            if ($width != null && $height != null && is_int($width) && is_int($height)) {
                $img->resize($width, $height, function ($constraint) {
                    $constraint->aspectRatio();
                });
            }

            $returnPath = 'uploads/'. $destination .'/' . time().'-'. Str::random(10) . '.' . $new_attribute->extension();
            $savePath = base_path().'/public/'.$returnPath;
            $img->save($savePath);
            
            // Verify the file was saved
            if (!File::exists($savePath)) {
                throw new \Exception('Failed to save image file');
            }
            
            // Only delete old file if new file was successfully saved
            if ($old_attribute && File::exists($old_attribute)) {
                File::delete($old_attribute);
            }
            
            return $returnPath;
        } catch (\Exception $e) {
            Log::error('Image update error: ' . $e->getMessage(), [
                'file_name' => $new_attribute->getClientOriginalName(),
                'destination' => $destination,
                'exception' => $e
            ]);
            throw $e;
        }
    }

    /*
     * uploadFile not used
     */
    private function uploadFile($destination, $attribute)
    {
        if (!File::isDirectory(base_path().'/public/uploads/'.$destination)){
            File::makeDirectory(base_path().'/public/uploads/'.$destination, 0777, true, true);
        }

        $file_name = time().Str::random(10).'.'.$attribute->extension();
        $path = 'uploads/'. $destination .'/' .$file_name;

        try {
            if (env('STORAGE_DRIVER') == 's3' ) {
                $data['is_uploaded'] = Storage::disk('s3')->put($path, $attribute);
            }else if(env('STORAGE_DRIVER') == 'wasabi' ) {
                $data['is_uploaded'] = Storage::disk('wasabi')->put($path, $attribute);
            }else if(env('STORAGE_DRIVER') == 'vultr' ) {
                $data['is_uploaded'] = Storage::disk('vultr')->put($path, $attribute);
            } else {
                $attribute->move(public_path('uploads/' . $destination .'/'), $file_name);
            }
        } catch (\Exception $e) {
            Log::error('File upload error in uploadFile: ' . $e->getMessage());
        }

        return $path;
    }

    private function uploadFileWithDetails($destination, $attribute)
    {
        if (!File::isDirectory(base_path().'/public/uploads/'.$destination)){
            File::makeDirectory(base_path().'/public/uploads/'.$destination, 0777, true, true);
        }

        $data['is_uploaded'] = false;
        $data['error'] = null;

        if ($attribute == null || $attribute == '') {
            $data['error'] = 'No file provided';
            return $data;
        }

        // Validate file upload
        if (!$attribute->isValid()) {
            $data['error'] = 'File upload failed: ' . $attribute->getErrorMessage();
            return $data;
        }

        $data['original_filename'] = $attribute->getClientOriginalName();
        $file_name = time().Str::random(10).'.'.pathinfo($data['original_filename'], PATHINFO_EXTENSION);
        $data['path'] = 'uploads/'. $destination .'/' .$file_name;

        try {
            $storageDriver = env('STORAGE_DRIVER', 'local');
            
            if (in_array($storageDriver, ['s3', 'wasabi', 'vultr'])) {
                // For cloud storage, use Laravel's Storage facade which handles temporary files properly
                $data['is_uploaded'] = Storage::disk($storageDriver)->put($data['path'], $attribute);
                if ($data['is_uploaded']) {
                    $data['is_uploaded'] = true;
                } else {
                    $data['error'] = 'Failed to upload to cloud storage';
                }
            } else {
                // For local storage, use move() method which is safer than file_get_contents
                $uploadPath = public_path('uploads/' . $destination . '/');
                $moved = $attribute->move($uploadPath, $file_name);
                
                if ($moved && File::exists($uploadPath . $file_name)) {
                    $data['is_uploaded'] = true;
                } else {
                    $data['error'] = 'Failed to move file to destination directory';
                }
            }
        } catch (\Exception $e) {
            $data['error'] = 'File upload error: ' . $e->getMessage();
            Log::error('File upload error in uploadFileWithDetails: ' . $e->getMessage(), [
                'file_name' => $data['original_filename'],
                'destination' => $destination,
                'exception' => $e
            ]);
        }

        return $data;
    }
    
    private function uploadFontInLocal($destination, $attribute, $name)
    {
        if (!File::isDirectory(base_path().'/public/uploads/'.$destination)){
            File::makeDirectory(base_path().'/public/uploads/'.$destination, 0777, true, true);
        }

        $data['is_uploaded'] = false;

        if ($attribute == null || $attribute == '') {
            return $data;
        }

        $data['path'] = 'uploads/'. $destination .'/' .$name;

        try {
            $attribute->move(public_path('uploads/' . $destination .'/'), $name);
            $data['is_uploaded'] = true;
        } catch (\Exception $e) {
            Log::info($e->getMessage());
        }

        return $data;
    }


    private function deleteFile($path)
    {
        if ($path == null || $path == '') {
            return null;
        }

        try {
            if (env('STORAGE_DRIVER') == 's3') {
                Storage::disk('s3')->delete($path);
            } else {
                File::delete($path);
            }
        } catch (\Exception $e) {
            //
        }

        File::delete($path);
    }

    private function deleteVideoFile($path)
    {
        if ($path == null || $path == '') {
            return null;
        }

        try {
            if (env('STORAGE_DRIVER') == 's3') {
                Storage::disk('s3')->delete($path);
            } else {
                File::delete($path);
            }
        } catch (\Exception $e) {
            //
        }

        File::delete($path);

    }

    private function deleteVimeoVideoFile($file)
    {
        if ($file == null || $file == '') {
            return null;
        }

        try {
            $client = new Vimeo(env('VIMEO_CLIENT'), env('VIMEO_SECRET'),env('VIMEO_TOKEN_ACCESS'));
            $path = '/videos/' . $file;
            $client->request($path, [], 'DELETE');
        } catch (\Exception $e)  {
            //
        }
    }

    private function uploadVimeoVideoFile($title, $file)
    {
        $path = '';
        if ($file == null || $file == '') {
            return $path;
        }

        try {
            $client = new Vimeo(env('VIMEO_CLIENT'), env('VIMEO_SECRET'),env('VIMEO_TOKEN_ACCESS'));

            $uri = $client->upload($file, array(
                "name" => $title,
                "description" => "The description goes here."
            ));

            $response = $client->request($uri . '?fields=link');
            $response = $response['body']['link'];

            $str = $response;
            $vimeo_video_id = explode("https://vimeo.com/",$str);
            $path = null;
            if(count($vimeo_video_id))
            {
                $path = $vimeo_video_id[1];
            }
        } catch (\Exception $e) {
            //
        }

        return $path;

    }
}
