<?php

namespace App\Services;

use App\Models\Etudiant;
use App\Models\OffreStage;
use App\Models\Recommendation;

class RecommendationService
{
    public function calculerScore(Etudiant $etudiant, OffreStage $offre): float
    {
        $compEtudiant = $etudiant->competences->pluck('idCompetence')->toArray();
        $compOffre = $offre->competences->pluck('idCompetence')->toArray();
        
        if (empty($compOffre)) return 0;
        
        $intersection = array_intersect($compEtudiant, $compOffre);
        $union = array_unique(array_merge($compEtudiant, $compOffre));
        $score = (count($intersection) / max(1, count($union))) * 100;

        // Bonus si ville correspond
        if ($etudiant->ville && $offre->ville === $etudiant->ville) {
            $score *= 1.05;
        }
        
        return min(100, round($score, 2));
    }

 public function getRecommendationsForEtudiant(Etudiant $etudiant, $limit = 10)
{
    $offres = OffreStage::where('statut', 'publiée')->with('competences')->get();
    $scores = [];
    
    foreach ($offres as $offre) {
        $score = $this->calculerScore($etudiant, $offre);
        if ($score > 30) {
            // Calculer les compétences matching
            $compEtudiant = $etudiant->competences;
            $compOffre = $offre->competences;
            
            $matchingCompetences = [];
            $missingCompetences = [];
            
            foreach ($compOffre as $offreComp) {
                $etudiantComp = $compEtudiant->firstWhere('idCompetence', $offreComp->idCompetence);
                if ($etudiantComp) {
                    $matchingCompetences[] = [
                        'nom' => $offreComp->nom,
                        'niveau_etudiant' => $etudiantComp->pivot->niveau,
                        'score' => 100
                    ];
                } else {
                    $missingCompetences[] = [
                        'nom' => $offreComp->nom,
                        'score' => 0
                    ];
                }
            }
            
            $scores[] = [
                'id' => $offre->idOffre,
                'offre' => $offre,
                'offre_competences' => $compOffre,
                'matching_competences' => $matchingCompetences,
                'missing_competences' => $missingCompetences,
                'score' => $score
            ];
        }
    }
    
    usort($scores, fn($a, $b) => $b['score'] <=> $a['score']);
    $scores = array_slice($scores, 0, $limit);
    
    // Sauvegarde en base
    foreach ($scores as $item) {
        Recommendation::updateOrCreate(
            ['etudiant_id' => $etudiant->idEtudiant, 'offre_id' => $item['offre']->idOffre],
            [
                'scoreMatching' => $item['score'], 
                'dateGeneration' => now(),
                'matching_data' => json_encode([
                    'matching_competences' => $item['matching_competences'],
                    'missing_competences' => $item['missing_competences']
                ])
            ]
        );
    }
    
    return $scores;
}

    public function refreshRecommendationsForEtudiant(Etudiant $etudiant)
    {
        Recommendation::where('etudiant_id', $etudiant->idEtudiant)->delete();
        return $this->getRecommendationsForEtudiant($etudiant);
    }
}