<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\OffreStage;
use App\Models\Candidature;
use App\Models\Notification;
use App\Http\Requests\OffreStageRequest;
use App\Http\Resources\OffreStageResource;
use App\Http\Resources\CandidatureResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RecruteurController extends Controller{
    private function getEntrepriseId(){
        return auth()->user()->recruteur->entreprise_id;
    }

public function mesOffres(){
    
    $offres = OffreStage::where('entreprise_id', $this->getEntrepriseId())
        ->with('entreprise', 'competences') 
        ->get();
    return OffreStageResource::collection($offres);
}

 
    public function publierOffre(OffreStageRequest $request){
        $offre = OffreStage::create(array_merge(
            $request->validated(),
            [
                'entreprise_id' => $this->getEntrepriseId(), 
                'statut' => 'en_attente'
            ]
        ));
        
        if ($request->has('competences')) {
            $offre->competences()->sync($request->competences);
        }
        
        $this->notifierAdminNouvelleOffre($offre);
        
        return response()->json([
            'message' => 'Offre soumise avec succès. En attente de validation.',
            'offre' => new OffreStageResource($offre)
        ], 201);
    }

    public function modifierOffre(OffreStageRequest $request, $id){
        $offre = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->withTrashed() 
            ->findOrFail($id);
        
        if ($offre->statut === 'publiée') {
            return response()->json([
                'error' => 'Une offre déjà publiée ne peut pas être modifiée. Archivez-la d\'abord.'
            ], 400);
        }
        
        if ($offre->statut === 'refusée') {
            return response()->json([
                'error' => 'Une offre refusée ne peut pas être modifiée. Contactez l\'administrateur.'
            ], 400);
        }
        
        if ($request->has('statut') && count($request->all()) === 1) {
            $offre->update(['statut' => $request->statut]);
        } else {
            $offre->update($request->validated());
        }
        
        if ($request->has('competences')) {
            $offre->competences()->sync($request->competences);
        }
        
        return new OffreStageResource($offre);
    }

 public function changerStatut(Request $request, $id){
        $request->validate([
            'statut' => 'required|in:publiée,archivée,en_attente'
        ]);
        
        $offre = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->withTrashed()
            ->findOrFail($id);
        
        if ($offre->statut === 'refusée') {
            return response()->json([
                'error' => 'Une offre refusée ne peut pas être modifiée. Contactez l\'administrateur.'
            ], 400);
        }
        
        $offre->update(['statut' => $request->statut]);
        
        return response()->json([
            'message' => 'Statut mis à jour avec succès',
            'statut' => $offre->statut
        ]);
    }
public function supprimerOffre($id){
    try {
   
        $offre = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->withTrashed()
            ->findOrFail($id);
      
        if ($offre->trashed()) {
            return response()->json([
                'success' => false,
                'message' => 'Cette offre est déjà supprimée.',
                'code' => 'ALREADY_DELETED'
            ], 400);
        }
       
        if ($offre->statut === 'publiée') {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de supprimer une offre déjà publiée. Archivez-la d\'abord.',
                'code' => 'PUBLISHED_CANNOT_DELETE'
            ], 400);
        }
      
        $offre->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Offre supprimée avec succès',
            'offre' => new OffreStageResource($offre)
        ]);
        
    } catch (\Exception $e) {
        Log::error('Erreur suppression offre: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Erreur lors de la suppression: ' . $e->getMessage()
        ], 500);
    }
}    
    public function restaurerOffre($id){
        $offre = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->onlyTrashed()
            ->findOrFail($id);
        
        $offre->restore();
        
        return response()->json([
            'message' => 'Offre restaurée avec succès',
            'offre' => new OffreStageResource($offre)
        ]);
    }

    // 🔥 AJOUTER : Supprimer définitivement
    public function supprimerDefinitivement($id)
    {
        $offre = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->onlyTrashed()
            ->findOrFail($id);
        
        $offre->forceDelete();
        
        return response()->json([
            'message' => 'Offre supprimée définitivement'
        ]);
    }

 public function consulterCandidatures()
{
    $offresIds = OffreStage::where('entreprise_id', $this->getEntrepriseId())
        ->withTrashed()
        ->pluck('idOffre');
    
    $candidatures = Candidature::whereIn('offre_id', $offresIds)
        ->with([
            'etudiant.user',
            'etudiant.formations',
            'etudiant.competences',
            'offre.entreprise',
            'offre.competences'
        ])
        ->get();
    
    return CandidatureResource::collection($candidatures);
}
  public function accepterCandidature($id)
    {
        $candidature = $this->getCandidatureForRecruteur($id);
        $candidature->update(['statut' => 'acceptée']);
        $this->notifierEtudiantCandidature($candidature, 'acceptée');
        return new CandidatureResource($candidature);
    }

      public function refuserCandidature($id)
    {
        $candidature = $this->getCandidatureForRecruteur($id);
        $candidature->update(['statut' => 'refusée']);
        $this->notifierEtudiantCandidature($candidature, 'refusée');
        return new CandidatureResource($candidature);
    }

       private function getCandidatureForRecruteur($id)
    {
        $offresIds = OffreStage::where('entreprise_id', $this->getEntrepriseId())
            ->withTrashed()
            ->pluck('idOffre');
        return Candidature::whereIn('offre_id', $offresIds)->findOrFail($id);
    }

    public function getEntreprise()
    {
        $recruteur = auth()->user()->recruteur;
        $entreprise = $recruteur->entreprise;
        
        if (!$entreprise) {
            return response()->json(['error' => 'Entreprise non trouvée'], 404);
        }
        
        $logoUrl = null;
        if ($entreprise->logo) {
            if (filter_var($entreprise->logo, FILTER_VALIDATE_URL)) {
                $logoUrl = $entreprise->logo;
            } else {
                $logoUrl = asset('storage/' . $entreprise->logo);
            }
        }
        
        return response()->json([
            'idEntreprise' => $entreprise->idEntreprise,
            'nom' => $entreprise->nom,
            'logo' => $logoUrl,
            'description' => $entreprise->description,
            'adresse' => $entreprise->adresse,
            'ville' => $entreprise->ville,
            'siteWeb' => $entreprise->siteWeb,
            'emailContact' => $entreprise->emailContact,
            'telephone' => $entreprise->telephone,
        ]);
    }

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

    public function getProfile()
    {
        try {
            $user = auth()->user();
            $recruteur = $user->recruteur;
            
            if (!$recruteur) {
                return response()->json(['error' => 'Profil recruteur non trouvé'], 404);
            }
            
            $entreprise = $recruteur->entreprise;
            
            return response()->json([
                'id' => $recruteur->idRecruteur,
                'user_id' => $recruteur->user_id,
                'entreprise_id' => $recruteur->entreprise_id,
                'poste' => $recruteur->poste,
                'entreprise_nom' => $entreprise ? $entreprise->nom : null,
                'entreprise' => $entreprise,
                'created_at' => $recruteur->created_at,
                'updated_at' => $recruteur->updated_at
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur getProfile recruteur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {
            $recruteur = auth()->user()->recruteur;
            
            if (!$recruteur) {
                return response()->json(['error' => 'Profil recruteur non trouvé'], 404);
            }
            
            $validated = $request->validate([
                'poste' => 'nullable|string|max:255',
                'entreprise_id' => 'nullable|exists:entreprises,idEntreprise'
            ]);
            
            $recruteur->update($validated);
            
            $user = auth()->user();
            if ($request->has('nom') || $request->has('prenom') || $request->has('email')) {
                $user->update($request->only(['nom', 'prenom', 'email']));
            }
            
            return response()->json([
                'message' => 'Profil recruteur mis à jour',
                'recruteur' => $recruteur
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur updateProfile recruteur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔥 MÉTHODE DE NOTIFICATION (À IMPLÉMENTER)
private function notifierAdminNouvelleOffre($offre)
{
    try {
        // Récupérer tous les administrateurs
        $admins = \App\Models\User::where('role', 'admin')->get();
        
        // Créer une notification pour chaque admin
        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type' => 'nouvelle_offre',
                'titre' => '📢 Nouvelle offre en attente',
                'message' => "L'offre '{$offre->titre}' a été soumise par l'entreprise et attend votre validation.",
                'lien' => "/admin/offres/{$offre->idOffre}",
                'est_lu' => false,
            ]);
        }
        
        Log::info("Notification envoyée aux admins pour l'offre: " . $offre->idOffre);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la notification admin: ' . $e->getMessage());
    }
}

  private function notifierEtudiantCandidature($candidature, $statut)
{
    try {
        $etudiant = $candidature->etudiant;
        $offre = $candidature->offre;
        
        $message = $statut === 'acceptée' 
            ? "🎉 Votre candidature pour l'offre '{$offre->titre}' a été acceptée !"
            : "💪 Votre candidature pour l'offre '{$offre->titre}' a été refusée. Continuez vos recherches !";
        
        \App\Models\Notification::create([
            'user_id' => $etudiant->user_id,
            'type' => 'candidature_' . $statut,
            'titre' => $statut === 'acceptée' ? '✅ Candidature acceptée' : '❌ Candidature refusée',
            'message' => $message,
            'lien' => "/mes-candidatures/{$candidature->idCandidature}",
            'est_lu' => false,
        ]);
        
        Log::info("Notification envoyée à l'étudiant pour la candidature: " . $candidature->idCandidature);
    } catch (\Exception $e) {
        Log::error('Erreur lors de la notification étudiant: ' . $e->getMessage());
    }
}
}