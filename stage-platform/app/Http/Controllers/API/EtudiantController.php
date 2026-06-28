<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Etudiant;
use App\Models\OffreStage;
use App\Models\Candidature;
use \App\Models\Notification;
use App\Http\Requests\ProfileRequest;
use App\Http\Resources\EtudiantResource;
use App\Http\Resources\OffreStageResource;
use App\Http\Resources\CandidatureResource;
use App\Services\RecommendationService;
use Illuminate\Http\Request;

class EtudiantController extends Controller
{
 protected $recommendationService;

    public function __construct(RecommendationService $recommendationService){
        $this->recommendationService = $recommendationService;
    }


public function updateProfile(Request $request)
{
    $etudiant = auth()->user()->etudiant;
    
    \Log::info(' Données reçues pour updateProfile:', $request->all());
    
    $validated = $request->validate([
        'telephone' => 'nullable|string|max:20',
        'ville' => 'nullable|string|max:255',
        'description' => 'nullable|string',
        'photo' => 'nullable|string|max:500', 
        'cv' => 'nullable|string|max:500',
        'formation_id' => 'nullable|exists:formations,idFormation',
        'competences' => 'nullable|array',
        'competences.*.id' => 'exists:competences,idCompetence',
        'competences.*.niveau' => 'in:débutant,intermédiaire,avancé,expert'
    ]);
    
 
    
    \Log::info(' Données validées (sans nettoyage):', $validated);
   
    $etudiant->update([
        'telephone' => $validated['telephone'] ?? $etudiant->telephone,
        'ville' => $validated['ville'] ?? $etudiant->ville,
        'description' => $validated['description'] ?? $etudiant->description,
        'photo' => $validated['photo'] ?? $etudiant->photo, 
        'cv' => $validated['cv'] ?? $etudiant->cv,
        'formation_id' => $validated['formation_id'] ?? $etudiant->formation_id
    ]);
    
    \Log::info('👤 Étudiant après mise à jour:', $etudiant->fresh()->toArray());
    
    if (isset($validated['competences'])) {
        $competencesData = [];
        foreach ($validated['competences'] as $comp) {
            $competencesData[$comp['id']] = ['niveau' => $comp['niveau']];
        }
        $etudiant->competences()->sync($competencesData);
    }
    
    return response()->json([
        'success' => true,
        'data' => $etudiant->fresh()->load('competences')
    ]);
}
    public function getAllOffres(Request $request){
        $offres = OffreStage::where('statut', 'publiée')
            ->when($request->ville, fn($q) => $q->where('ville', $request->ville))
            ->when($request->mot_cle, function($q) use ($request) {
                $q->where('titre', 'LIKE', "%{$request->mot_cle}%")
                  ->orWhere('description', 'LIKE', "%{$request->mot_cle}%");
            })
            ->paginate(10);
        return OffreStageResource::collection($offres);
    }

    public function showOffre($id){
        $offre = OffreStage::findOrFail($id);
        return new OffreStageResource($offre);
    }

   public function postuler(Request $request, $offreId){
    $request->validate([
        'lettreMotivation' => 'required|string'
    ]);

    $etudiant = auth()->user()->etudiant;

    $exists = Candidature::where('etudiant_id', $etudiant->idEtudiant)
        ->where('offre_id', $offreId)
        ->exists();
    if ($exists) {
        return response()->json(['message' => 'Vous avez déjà postulé à cette offre'], 400);
    }

    $candidature = Candidature::create([
        'etudiant_id' => $etudiant->idEtudiant,
        'offre_id' => $offreId,
        'lettreMotivation' => $request->lettreMotivation,
        'statut' => 'en_attente'
    ]);

    $score = $this->recommendationService->calculerScore($etudiant, OffreStage::find($offreId));
    
    \App\Models\Recommendation::updateOrCreate(
        ['etudiant_id' => $etudiant->idEtudiant, 'offre_id' => $offreId],
        ['scoreMatching' => $score, 'dateGeneration' => now()]
    );

   
    $this->notifierRecruteurNouvelleCandidature($candidature);

    return new CandidatureResource($candidature);
}


private function notifierRecruteurNouvelleCandidature($candidature){
    try {
        $offre = $candidature->offre;
        $entreprise = $offre->entreprise;
        $etudiant = $candidature->etudiant;
      
        $recruteurs = \App\Models\Recruteur::where('entreprise_id', $entreprise->idEntreprise)->get();
        
        foreach ($recruteurs as $recruteur) {
            \App\Models\Notification::create([
                'user_id' => $recruteur->user_id,
                'type' => 'nouvelle_candidature',
                'titre' => '📩 Nouvelle candidature',
                'message' => "{$etudiant->user->prenom} {$etudiant->user->nom} a postulé à votre offre '{$offre->titre}'",
                'lien' => "/candidatures-reçues",
                'est_lu' => false,
                'icone' => 'fas fa-user-plus'
            ]);
        }
        
        \Log::info("Notification envoyée aux recruteurs pour la candidature: " . $candidature->idCandidature);
    } catch (\Exception $e) {
        \Log::error('Erreur notification nouvelle candidature: ' . $e->getMessage());
    }
}

 

public function mesCandidatures(){
    try {
        $etudiant = auth()->user()->etudiant;
        
        if (!$etudiant) {
            return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
        }
        
        $candidatures = Candidature::where('etudiant_id', $etudiant->idEtudiant)
            ->with(['offre', 'offre.entreprise'])
            ->orderBy('created_at', 'desc')
            ->get();
        
      
        $candidaturesData = $candidatures->map(function($candidature) {
            return [
                'idCandidature' => $candidature->idCandidature,
                'statut' => $candidature->statut ?? 'en_attente',
                'created_at' => $candidature->created_at,
                'dateCandidature' => $candidature->created_at,
                'offre' => [
                    'idOffre' => $candidature->offre->idOffre ?? null,
                    'titre' => $candidature->offre->titre ?? 'Offre',
                    'ville' => $candidature->offre->ville ?? 'Non spécifiée',
                    'typeStage' => $candidature->offre->typeStage ?? 'Stage',
                    'entreprise' => [
                        'nom' => $candidature->offre->entreprise->nom ?? 'Entreprise'
                    ]
                ]
            ];
        });
        
        return response()->json([
            'data' => $candidaturesData,
            'total' => $candidatures->count()
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Erreur mesCandidatures: ' . $e->getMessage());
        return response()->json(['error' => $e->getMessage()], 500);
    }
}

    public function suivreCandidature($id){
        $candidature = Candidature::where('etudiant_id', auth()->user()->etudiant->idEtudiant)
            ->findOrFail($id);
        return new CandidatureResource($candidature);
    }

  
public function profile(){
    $etudiant = auth()->user()->etudiant;
    $data = $etudiant->toArray();
    if ($etudiant->photo) {
        $data['photo_url'] = asset('storage/' . $etudiant->photo);
    } else {
        $data['photo_url'] = null;
    }
    return response()->json($data);
}
public function annulerCandidature($id){
    $candidature = Candidature::where('etudiant_id', auth()->user()->etudiant->idEtudiant)
        ->where('idCandidature', $id)
        ->firstOrFail();
    
    if ($candidature->statut !== 'en_attente') {
        return response()->json(['message' => 'Cette candidature ne peut pas être annulée'], 400);
    }
    
    $candidature->delete();
    return response()->json(['message' => 'Candidature annulée']);
}
    public function getRecommendations(){
        try {
            $etudiant = auth()->user()->etudiant;
            
            if (!$etudiant) {
                return response()->json(['error' => 'Profil étudiant non trouvé'], 404);
            }
            
            $recommendations = $this->recommendationService->getRecommendationsForEtudiant($etudiant);
            
            return response()->json($recommendations);
        } catch (\Exception $e) {
            \Log::error('Erreur getRecommendations: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}