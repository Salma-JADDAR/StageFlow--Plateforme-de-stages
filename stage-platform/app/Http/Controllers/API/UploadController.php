<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller{
  
    public function photo(Request $request){
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', 
        ]);

        $file = $request->file('photo');
        $path = $file->store('photos', 'public'); 

        $url = asset('storage/' . $path);

        return response()->json([
            'url' => $url,
            'message' => 'Photo téléchargée avec succès'
        ], 200);
    }

  
    public function cv(Request $request){
        $request->validate([
            'cv' => 'required|file|mimes:pdf,doc,docx|max:5120', 
        ]);

        $file = $request->file('cv');
        $path = $file->store('cvs', 'public'); 

        $url = asset('storage/' . $path);

        return response()->json([
            'url' => $url,
            'message' => 'CV téléchargé avec succès'
        ], 200);
    }

public function logo(Request $request){
    try {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $file = $request->file('logo');
        $path = $file->store('logos', 'public');
        $url = asset('storage/' . $path);

        return response()->json(['url' => $url], 200);
    } catch (\Exception $e) {
        \Log::error('Erreur upload logo: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}
}