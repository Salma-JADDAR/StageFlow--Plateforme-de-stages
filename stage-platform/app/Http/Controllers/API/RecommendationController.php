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

 
    public function sendFeedback(Request $request, $id){
        try {
            $request->validate([
                'pertinent' => 'required|boolean'
            ]);

            $recommendation = Recommendation::findOrFail($id);
          
            if ($recommendation->etudiant_id !== auth()->user()->etudiant->idEtudiant) {
                return response()->json(['error' => 'Non autorisé'], 403);
            }
           
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