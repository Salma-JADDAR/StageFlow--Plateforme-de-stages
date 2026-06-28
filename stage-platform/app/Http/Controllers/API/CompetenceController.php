<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Competence;
use Illuminate\Http\Request;

class CompetenceController extends Controller
{
    public function index()
    {
        return response()->json(Competence::all());
    }

    // 🔥 AJOUTE CETTE MÉTHODE
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nom' => 'required|string|max:255',
                'categorie' => 'required|string|max:255'
            ]);

            $competence = Competence::create([
                'nom' => $request->nom,
                'categorie' => $request->categorie
            ]);

            return response()->json($competence, 201);
        } catch (\Exception $e) {
            \Log::error('Erreur création compétence: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔥 AJOUTE CETTE MÉTHODE (optionnelle, pour mise à jour)
    public function update(Request $request, $id)
    {
        try {
            $competence = Competence::findOrFail($id);
            $competence->update($request->only(['nom', 'categorie']));
            return response()->json($competence);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔥 AJOUTE CETTE MÉTHODE (optionnelle, pour suppression)
    public function destroy($id)
    {
        try {
            $competence = Competence::findOrFail($id);
            $competence->delete();
            return response()->json(['message' => 'Compétence supprimée']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    



    public function getMesCompetences()
    {
        try {
            $etudiant = auth()->user()->etudiant;
            
            if (!$etudiant) {
                return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
            }
            
            $competences = $etudiant->competences()->withPivot('niveau')->get();
            
            return response()->json($competences);
        } catch (\Exception $e) {
            \Log::error('Erreur getMesCompetences: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // Assurez-vous que ces méthodes existent aussi
    public function ajouterAuProfile(Request $request)
    {
        $request->validate([
            'competence_id' => 'required|exists:competences,idCompetence',
            'niveau' => 'required|in:débutant,intermédiaire,avancé,expert'
        ]);
        
        $etudiant = auth()->user()->etudiant;
        $etudiant->competences()->syncWithoutDetaching([
            $request->competence_id => ['niveau' => $request->niveau]
        ]);
        
        return response()->json(['message' => 'Compétence ajoutée']);
    }

    public function supprimerDuProfile($competenceId)
    {
        $etudiant = auth()->user()->etudiant;
        $etudiant->competences()->detach($competenceId);
        return response()->json(['message' => 'Compétence supprimée']);
    }
}