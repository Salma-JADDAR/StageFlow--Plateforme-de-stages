<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\OffreStage;
use App\Models\Candidature;
use App\Models\Recommendation;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\OffreStageResource;

class AdminController extends Controller
{
  
    public function consulterUtilisateurs()
    {
        try {
        
            $users = User::orderBy('created_at', 'desc')->paginate(12);
            
            $formattedUsers = $users->map(function($user) {
                return [
                    'id' => $user->id,
                    'nom' => $user->nom ?? '',
                    'prenom' => $user->prenom ?? '',
                    'email' => $user->email ?? '',
                    'role' => $user->role ?? 'etudiant',
                    'dateCreation' => $user->created_at ?? now(),
                    'dernierAcces' => $user->dernierAcces ?? null,
                    'ville' => $user->ville ?? null,
                    'telephone' => $user->telephone ?? null,
                    'is_active' => $user->is_active ?? true,
                ];
            });
            
            return response()->json([
                'data' => $formattedUsers,
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'total' => $users->total(),
                'per_page' => $users->perPage(),
            ]);
            
        } catch (\Exception $e) {
            Log::error('Erreur consulterUtilisateurs: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }


    public function consulterOffres()
    {
        try {
        
            $offres = OffreStage::with('entreprise')
                ->orderBy('created_at', 'desc')
                ->paginate(12);
            
            return response()->json([
                'data' => $offres->map(function($offre) {
                    return [
                        'idOffre' => $offre->idOffre,
                        'titre' => $offre->titre,
                        'description' => $offre->description,
                        'ville' => $offre->ville,
                        'duree' => $offre->duree,
                        'typeStage' => $offre->typeStage,
                        'datePublication' => $offre->datePublication,
                        'dateLimite' => $offre->dateLimite,
                        'statut' => $offre->statut,
                        'motif_rejet' => $offre->motif_rejet ?? null,
                        'created_at' => $offre->created_at,
                        'entreprise' => $offre->entreprise ? [
                            'nom' => $offre->entreprise->nom,
                        ] : null,
                    ];
                }),
                'current_page' => $offres->currentPage(),
                'last_page' => $offres->lastPage(),
                'total' => $offres->total(),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur consulterOffres: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function listerAdministrateurs()
    {
        try {
           
            $admins = User::where('role', 'admin')
                ->orderBy('created_at', 'desc')
                ->paginate(20);
            
            $formattedAdmins = $admins->map(function($admin) {
                return [
                    'id' => $admin->id,
                    'nom' => $admin->nom ?? '',
                    'prenom' => $admin->prenom ?? '',
                    'email' => $admin->email ?? '',
                    'role' => $admin->role,
                    'dateCreation' => $admin->created_at,
                ];
            });
            
            return response()->json([
                'data' => $formattedAdmins,
                'current_page' => $admins->currentPage(),
                'last_page' => $admins->lastPage(),
                'total' => $admins->total(),
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur listerAdministrateurs: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

   
    public function desactiverUtilisateur($id){
        try {
            $user = User::findOrFail($id);
            
            $user->is_active = !$user->is_active;
            $user->save();
            
            if (!$user->is_active) {
                $user->tokens()->delete();
            }
            
            $status = $user->is_active ? 'activé' : 'désactivé';
            return response()->json([
                'message' => "Utilisateur {$status} avec succès",
                'is_active' => $user->is_active
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur desactiverUtilisateur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function activerUtilisateur($id){
        try {
            $user = User::findOrFail($id);
            $user->is_active = true;
            $user->save();
            
            return response()->json([
                'message' => 'Utilisateur activé avec succès',
                'is_active' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur activerUtilisateur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function supprimerUtilisateur($id){
        try {
            $user = User::findOrFail($id);
            $user->delete();
            return response()->json(['message' => 'Utilisateur supprimé']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function validerOffre($id){
        try {
            $offre = OffreStage::findOrFail($id);
            
            if ($offre->statut !== 'en_attente') {
                return response()->json([
                    'error' => 'Seules les offres en attente peuvent être validées'
                ], 400);
            }
            
            $offre->update([
                'statut' => 'publiée',
                'dateValidation' => now()
            ]);
            
            
            $this->notifierRecruteurOffreValidee($offre);
            
            return response()->json([
                'message' => 'Offre validée avec succès',
                'offre' => new OffreStageResource($offre)
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur validerOffre: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function rejeterOffre(Request $request, $id){
        try {
            $offre = OffreStage::findOrFail($id);
            
            if ($offre->statut !== 'en_attente') {
                return response()->json([
                    'error' => 'Seules les offres en attente peuvent être rejetées'
                ], 400);
            }
            
            $offre->update([
                'statut' => 'refusée',
                'motif_rejet' => $request->raison ?? 'Non conforme',
                'dateRejet' => now()
            ]);
            
        
            $this->notifierRecruteurValidation($offre, 'refusée', $request->raison ?? 'Non conforme');
            
            return response()->json([
                'message' => 'Offre rejetée avec succès',
                'offre' => new OffreStageResource($offre)
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur rejeterOffre: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function reactiverOffre($id)
    {
        try {
            $offre = OffreStage::findOrFail($id);
            
            if ($offre->statut !== 'refusée') {
                return response()->json([
                    'error' => 'Seules les offres refusées peuvent être réactivées'
                ], 400);
            }
            
            $offre->update([
                'statut' => 'en_attente',
                'motif_rejet' => null,
                'dateRejet' => null
            ]);
            
            return response()->json([
                'message' => 'Offre réactivée avec succès',
                'offre' => new OffreStageResource($offre)
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur reactiverOffre: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function archiverOffre($id)
    {
        try {
            $offre = OffreStage::findOrFail($id);
            
            if ($offre->statut !== 'publiée') {
                return response()->json([
                    'error' => 'Seules les offres publiées peuvent être archivées'
                ], 400);
            }
            
            $offre->update(['statut' => 'archivée']);
            
            return response()->json([
                'message' => 'Offre archivée avec succès',
                'offre' => new OffreStageResource($offre)
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur archiverOffre: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function supprimerOffre($id)
    {
        try {
            $offre = OffreStage::findOrFail($id);
            
            if ($offre->statut === 'publiée') {
                return response()->json([
                    'error' => 'Impossible de supprimer une offre déjà publiée. Utilisez l\'archivage.'
                ], 400);
            }
            
            $offre->delete();
            return response()->json(['message' => 'Offre supprimée']);
        } catch (\Exception $e) {
            Log::error('Erreur supprimerOffre: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function genererRapport()
    {
        try {
            $stats = [
                'users_count' => User::count(),
                'offres_count' => OffreStage::count(),
                'candidatures_count' => Candidature::count(),
                'match_moyen' => Recommendation::avg('scoreMatching') ?? 0,
                'offres_en_attente' => OffreStage::where('statut', 'en_attente')->count()
            ];
            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Erreur genererRapport: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function ajouterAdministrateur(Request $request)
    {
        try {
            $request->validate([
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $user = User::create([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'email' => $request->email,
                'password' => bcrypt($request->password),
                'role' => 'admin',
                'is_active' => true,
            ]);

            return response()->json([
                'message' => 'Administrateur ajouté avec succès',
                'user' => $user
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur ajouterAdministrateur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function supprimerAdministrateur($id)
    {
        try {
            $user = User::findOrFail($id);
            
            if ($user->id === auth()->id()) {
                return response()->json(['error' => 'Vous ne pouvez pas supprimer votre propre compte'], 400);
            }

            if ($user->role !== 'admin') {
                return response()->json(['error' => 'Cet utilisateur n\'est pas un administrateur'], 400);
            }

            $user->delete();

            return response()->json(['message' => 'Administrateur supprimé avec succès']);
        } catch (\Exception $e) {
            Log::error('Erreur supprimerAdministrateur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    // 🔥 NOTIFICATION RECRUTEUR
    private function notifierRecruteurOffreValidee($offre)
    {
        try {
            $recruteurs = \App\Models\Recruteur::where('entreprise_id', $offre->entreprise_id)->get();
            
            foreach ($recruteurs as $recruteur) {
                \App\Models\Notification::create([
                    'user_id' => $recruteur->user_id,
                    'type' => 'offre_validee',
                    'titre' => '✅ Offre validée',
                    'message' => "Votre offre '{$offre->titre}' a été validée et est maintenant publiée",
                    'lien' => "/gestion-offres",
                    'est_lu' => false,
                    'icone' => 'fas fa-check-circle'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur notification offre validée: ' . $e->getMessage());
        }
    }
}