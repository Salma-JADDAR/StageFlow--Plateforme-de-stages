<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\RecommendationService;
use App\Models\Etudiant;
use App\Models\Recommendation;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    protected $recommendationService;

    public function __construct(RecommendationService $recommendationService)
    {
        $this->recommendationService = $recommendationService;
    }

    public function refreshForEtudiant($etudiantId){
        try {
            $etudiant = Etudiant::findOrFail($etudiantId);
            $this->recommendationService->refreshRecommendationsForEtudiant($etudiant);
            return response()->json(['message' => 'Recommandations mises à jour']);
        } catch (\Exception $e) {
            \Log::error('Erreur refreshForEtudiant: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Ajouter un feedback sur une recommandation
     */
    public function sendFeedback(Request $request, $id)
    {
        try {
            $request->validate([
                'pertinent' => 'required|boolean'
            ]);

            $recommendation = Recommendation::findOrFail($id);
            
            // Vérifier que la recommandation appartient à l'étudiant connecté
            if ($recommendation->etudiant_id !== auth()->user()->etudiant->idEtudiant) {
                return response()->json(['error' => 'Non autorisé'], 403);
            }
            
            // Ajouter le feedback (vous pouvez ajouter une colonne 'feedback' dans la table recommendations)
            $recommendation->update([
                'feedback' => $request->pertinent,
                'feedback_date' => now()
            ]);
            
            return response()->json(['message' => 'Feedback enregistré']);
        } catch (\Exception $e) {
            \Log::error('Erreur sendFeedback: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}