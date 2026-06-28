<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\EtudiantController;
use App\Http\Controllers\API\RecruteurController;
use App\Http\Controllers\API\AdminController;
use App\Http\Controllers\API\OffreStageController;
use App\Http\Controllers\API\CandidatureController;
use App\Http\Controllers\API\RecommendationController;
use App\Http\Controllers\API\CVController;
use App\Http\Controllers\API\FormationController;
use App\Http\Controllers\API\CompetenceController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\EntrepriseController;
use App\Http\Controllers\API\UploadController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/offres', [OffreStageController::class, 'index']);
Route::get('/offres/{id}', [OffreStageController::class, 'show']);

Route::post('/upload/photo', [UploadController::class, 'photo']);
Route::post('/upload/cv', [UploadController::class, 'cv']);
Route::post('/upload/logo', [UploadController::class, 'logo']);

Route::get('/formations', [FormationController::class, 'index']);
Route::get('/competences', [CompetenceController::class, 'index']);
Route::get('/entreprises', [EntrepriseController::class, 'index']);
Route::post('/entreprises', [EntrepriseController::class, 'storePublic']);

Route::get('/test', function() {
    return response()->json(['message' => 'API OK']);
});


Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);


    Route::post('/formations', [FormationController::class, 'store']);
    Route::put('/formations/{id}', [FormationController::class, 'update']);
    Route::delete('/formations/{id}', [FormationController::class, 'destroy']);

   
    Route::post('/competences', [CompetenceController::class, 'store']);
    Route::put('/competences/{id}', [CompetenceController::class, 'update']);
    Route::delete('/competences/{id}', [CompetenceController::class, 'destroy']);


    Route::middleware('role:etudiant')->group(function () {
        Route::get('/etudiant/profile', [EtudiantController::class, 'profile']);
        Route::put('/etudiant/profile', [EtudiantController::class, 'updateProfile']);
        Route::get('/etudiant/offres', [EtudiantController::class, 'getAllOffres']);
        Route::get('/etudiant/offres/{id}', [EtudiantController::class, 'showOffre']);
        Route::post('/etudiant/offres/{offreId}/postuler', [EtudiantController::class, 'postuler']);
        Route::get('/etudiant/mes-candidatures', [EtudiantController::class, 'mesCandidatures']);
        Route::delete('/etudiant/candidatures/{id}', [EtudiantController::class, 'annulerCandidature']);
        Route::get('/etudiant/recommendations', [EtudiantController::class, 'getRecommendations']);
        Route::post('/etudiant/recommendations/refresh', [RecommendationController::class, 'refreshForEtudiant']);
        Route::post('/etudiant/recommendations/{id}/feedback', [RecommendationController::class, 'sendFeedback']);
        
        Route::get('/etudiant/competences', [CompetenceController::class, 'getMesCompetences']);
        Route::post('/etudiant/competences', [CompetenceController::class, 'ajouterAuProfile']);
        Route::delete('/etudiant/competences/{competenceId}', [CompetenceController::class, 'supprimerDuProfile']);

        Route::get('/etudiant/cv-info', [CVController::class, 'getInfo']);
        Route::get('/etudiant/cv', [CVController::class, 'download']);
        Route::post('/etudiant/cv', [CVController::class, 'upload']);
        Route::delete('/etudiant/cv', [CVController::class, 'delete']);
          Route::post('/etudiant/cv/upload', [CVController::class, 'upload']);
    Route::get('/etudiant/cv/download', [CVController::class, 'download']);
    Route::delete('/etudiant/cv/delete', [CVController::class, 'delete']);
    });

    Route::middleware('role:recruteur')->group(function () {
       
        Route::get('/recruteur/offres', [RecruteurController::class, 'mesOffres']);
        Route::post('/recruteur/offres', [RecruteurController::class, 'publierOffre']);
        Route::put('/recruteur/offres/{id}', [RecruteurController::class, 'modifierOffre']);
        Route::patch('/recruteur/offres/{id}/statut', [RecruteurController::class, 'changerStatut']);
        Route::delete('/recruteur/offres/{id}', [RecruteurController::class, 'supprimerOffre']);
        
     
        Route::get('/recruteur/offres/supprimees', [RecruteurController::class, 'mesOffresSupprimees']);
        Route::put('/recruteur/offres/{id}/restaurer', [RecruteurController::class, 'restaurerOffre']);
        Route::delete('/recruteur/offres/{id}/definitif', [RecruteurController::class, 'supprimerDefinitivement']);
        
        
        Route::get('/recruteur/candidatures', [RecruteurController::class, 'consulterCandidatures']);
        Route::put('/recruteur/candidatures/{id}/accepter', [RecruteurController::class, 'accepterCandidature']);
        Route::put('/recruteur/candidatures/{id}/refuser', [RecruteurController::class, 'refuserCandidature']);
     
        Route::get('/recruteur/entreprise', [RecruteurController::class, 'getEntreprise']);
        Route::put('/recruteur/entreprise', [RecruteurController::class, 'updateEntreprise']);
        
     
        Route::get('/recruteur/profile', [RecruteurController::class, 'getProfile']);
        Route::put('/recruteur/profile', [RecruteurController::class, 'updateProfile']);
    });


    Route::middleware('role:admin')->group(function () {
     
        Route::get('/admin/users', [AdminController::class, 'consulterUtilisateurs']);
        Route::delete('/admin/users/{id}/desactiver', [AdminController::class, 'desactiverUtilisateur']);
        Route::put('/admin/users/{id}/activer', [AdminController::class, 'activerUtilisateur']);
        Route::delete('/admin/users/{id}', [AdminController::class, 'supprimerUtilisateur']);
        
    
        Route::get('/admin/offres', [AdminController::class, 'consulterOffres']);
        Route::put('/admin/offres/{id}/valider', [AdminController::class, 'validerOffre']);
        Route::put('/admin/offres/{id}/rejeter', [AdminController::class, 'rejeterOffre']);
        Route::put('/admin/offres/{id}/reactiver', [AdminController::class, 'reactiverOffre']);
        Route::put('/admin/offres/{id}/archiver', [AdminController::class, 'archiverOffre']);
        Route::delete('/admin/offres/{id}', [AdminController::class, 'supprimerOffre']);
        
      
        Route::get('/admin/administrateurs', [AdminController::class, 'listerAdministrateurs']);
        Route::post('/admin/administrateurs', [AdminController::class, 'ajouterAdministrateur']);
        Route::delete('/admin/administrateurs/{id}', [AdminController::class, 'supprimerAdministrateur']);
        
        
    });


    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);

    Route::put('/user', [AuthController::class, 'update']);
    Route::get('/formations-predefinies', [FormationController::class, 'getPredefinedFormations']);
});