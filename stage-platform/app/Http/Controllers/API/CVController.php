<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\CV;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CVController extends Controller{
    public function getInfo(){
        try {
            $etudiant = auth()->user()->etudiant;
            
            if (!$etudiant) {
                return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
            }
            
            $cv = $etudiant->cv;
            
            if (!$cv) {
                return response()->json(['error' => 'CV non trouvé'], 404);
            }
            
            // 🔥 AJOUTEZ CES INFORMATIONS SUPPLÉMENTAIRES
            return response()->json([
                'id' => $cv->idCV,
                'nomFichier' => $cv->nomFichier,
                'cheminFichier' => $cv->cheminFichier,
                'taille' => $cv->taille,
                'dateUpload' => $cv->created_at,
                'updated_at' => $cv->updated_at,
                'url' => asset('storage/' . $cv->cheminFichier)
            ]);
        } catch (\Exception $e) {
            \Log::error('Erreur getInfo CV: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

public function download(){
    try {
        $etudiant = auth()->user()->etudiant;
        
        if (!$etudiant) {
            return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
        }
        
        $cv = $etudiant->cv;
        
        if (!$cv) {
            return response()->json(['error' => 'CV non trouvé'], 404);
        }
        
     
        $url = asset('storage/' . $cv->cheminFichier);
        
        return response()->json([
            'url' => $url,
            'nomFichier' => $cv->nomFichier
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Erreur download CV: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function upload(Request $request)
    {
        try {
            $request->validate([
                'cv' => 'required|file|mimes:pdf,doc,docx|max:5120'
            ]);

            $etudiant = auth()->user()->etudiant;
            
            if (!$etudiant) {
                return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
            }
            
            $file = $request->file('cv');
            
            // 🔥 Supprimer l'ancien fichier physique MAIS garder l'enregistrement
            if ($etudiant->cv) {
                // Supprimer le fichier physique
                if (Storage::disk('public')->exists($etudiant->cv->cheminFichier)) {
                    Storage::disk('public')->delete($etudiant->cv->cheminFichier);
                }
                // 🔥 UPDATE au lieu de DELETE + CREATE
                // On va mettre à jour l'enregistrement existant
                $cv = $etudiant->cv;
            } else {
                // Créer un nouvel enregistrement
                $cv = new CV();
                $cv->etudiant_id = $etudiant->idEtudiant;
            }
            
            // Sauvegarder le nouveau fichier avec un nom unique
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $uniqueName = time() . '_' . uniqid() . '.' . $extension;
            $path = $file->storeAs('cvs', $uniqueName, 'public');
            
            // Mettre à jour les champs
            $cv->nomFichier = $originalName;
            $cv->cheminFichier = $path;
            $cv->taille = round($file->getSize() / 1024, 2);
            $cv->save();
            
            return response()->json([
                'message' => 'CV téléchargé avec succès',
                'cv' => $cv
            ], 201);
            
        } catch (\Exception $e) {
            \Log::error('Erreur upload CV: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function delete()
    {
        try {
            $etudiant = auth()->user()->etudiant;
            
            if (!$etudiant) {
                return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
            }
            
            $cv = $etudiant->cv;
            
            if ($cv) {
                // Supprimer le fichier physique
                if (Storage::disk('public')->exists($cv->cheminFichier)) {
                    Storage::disk('public')->delete($cv->cheminFichier);
                }
                // Supprimer l'enregistrement
                $cv->delete();
            }
            
            return response()->json(['message' => 'CV supprimé avec succès']);
        } catch (\Exception $e) {
            \Log::error('Erreur delete CV: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}