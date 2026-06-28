<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\Request;

class EntrepriseController extends Controller{
    public function index(){
        return response()->json(Entreprise::all());
    }

public function storePublic(Request $request){
    $validated = $request->validate([
        'nom' => 'required|string|max:255',
        'emailContact' => 'required|email',
        'telephone' => 'required|string|max:20',
        'ville' => 'nullable|string|max:255',
        'adresse' => 'nullable|string',
        'siteWeb' => 'nullable|url',
        'description' => 'nullable|string',
        'logo' => 'nullable|string|max:255',
    ]);
    
    $entreprise = Entreprise::create($validated);
    return response()->json($entreprise, 201);
}
// RecruteurController.php
public function updateEntreprise(Request $request)
{
    $recruteur = auth()->user()->recruteur;
    $entreprise = $recruteur->entreprise;
    
    if (!$entreprise) {
        return response()->json(['error' => 'Entreprise non trouvée'], 404);
    }
    
    $validated = $request->validate([
        'nom' => 'sometimes|string|max:255',
        'description' => 'nullable|string',
        'adresse' => 'nullable|string',
        'ville' => 'nullable|string|max:255',
        'siteWeb' => 'nullable|url',
        'emailContact' => 'nullable|email',
        'telephone' => 'nullable|string|max:20',
        'logo' => 'nullable|string|max:255',
    ]);
    
    $entreprise->update($validated);
    
    return response()->json($entreprise);
}
}