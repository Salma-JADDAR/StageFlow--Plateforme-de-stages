<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\OffreStage;
use App\Http\Resources\OffreStageResource;
use Illuminate\Http\Request;

class OffreStageController extends Controller{
public function index(Request $request){
    $query = OffreStage::where('statut', 'publiée')
        ->with('entreprise', 'competences');

    if ($request->filled('keyword')) {
        $keyword = $request->keyword;
        $query->where(function($q) use ($keyword) {
            $q->where('titre', 'LIKE', "%{$keyword}%")
              ->orWhere('description', 'LIKE', "%{$keyword}%")
              ->orWhereHas('entreprise', function($sub) use ($keyword) {
                  $sub->where('nom', 'LIKE', "%{$keyword}%");
              });
        });
    }

    if ($request->filled('location')) {
        $query->where('ville', 'LIKE', "%{$request->location}%");
    }

    if ($request->filled('type')) {
        $query->where('typeStage', $request->type);
    }

    if ($request->filled('duration')) {
        $duration = $request->duration;
        if ($duration === '6+ mois') {
            $query->where('duree', '>=', 6);
        } else {
            $parts = explode('-', $duration);
            if (count($parts) == 2) {
                $min = (int)$parts[0];
                $max = (int)str_replace(' mois', '', $parts[1]);
                $query->whereBetween('duree', [$min, $max]);
            }
        }
    }

    if ($request->filled('industry')) {
        $query->whereHas('entreprise', function($q) use ($request) {
            $q->where('secteur', 'LIKE', "%{$request->industry}%");
        });
    }

    if ($request->filled('remote') && $request->remote == 'true') {
        $query->where('remote', true);
    }

   
    if ($request->filled('salary') && is_numeric($request->salary)) {
        $query->where('salaire', '>=', $request->salary);
    }

    $offres = $query->orderBy('created_at', 'desc')->paginate(30);
    
    return OffreStageResource::collection($offres);
}

   public function show($id){
    $offre = OffreStage::with('entreprise', 'competences')->findOrFail($id);
    return new OffreStageResource($offre);
}
}