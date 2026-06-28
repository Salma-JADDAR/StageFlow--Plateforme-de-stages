<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CandidatureResource extends JsonResource{
    public function toArray($request){
        return [
            'idCandidature' => $this->idCandidature,
            'statut' => $this->statut,
            'lettreMotivation' => $this->lettreMotivation,
            'dateCandidature' => $this->dateCandidature,
            'created_at' => $this->created_at,
            
            'etudiant' => $this->whenLoaded('etudiant', function() {
                return [
                    'idEtudiant' => $this->etudiant->idEtudiant,
                    'telephone' => $this->etudiant->telephone,
                    'ville' => $this->etudiant->ville,
                    'description' => $this->etudiant->description,
                    'photo' => $this->etudiant->photo,
                    'user' => [
                        'id' => $this->etudiant->user->id,
                        'nom' => $this->etudiant->user->nom,
                        'prenom' => $this->etudiant->user->prenom,
                        'email' => $this->etudiant->user->email,
                        'created_at' => $this->etudiant->user->created_at,
                    ],
                    'formations' => $this->etudiant->formations->map(function($formation) {
                        return [
                            'idFormation' => $formation->idFormation,
                            'diplome' => $formation->diplome,
                            'etablissement' => $formation->etablissement,
                            'niveau' => $formation->niveau,
                            'anneeDebut' => $formation->anneeDebut,
                            'anneeFin' => $formation->anneeFin,
                        ];
                    }),
                    'competences' => $this->etudiant->competences->map(function($competence) {
                        return [
                            'idCompetence' => $competence->idCompetence,
                            'nom' => $competence->nom,
                            'categorie' => $competence->categorie,
                            'pivot' => [
                                'niveau' => $competence->pivot->niveau ?? 'débutant'
                            ]
                        ];
                    }),
                ];
            }),
            
            'offre' => $this->whenLoaded('offre', function() {
                return [
                    'idOffre' => $this->offre->idOffre,
                    'titre' => $this->offre->titre,
                    'description' => $this->offre->description,
                    'ville' => $this->offre->ville,
                    'duree' => $this->offre->duree,
                    'typeStage' => $this->offre->typeStage,
                    'dateLimite' => $this->offre->dateLimite,
                    'datePublication' => $this->offre->datePublication,
                    'statut' => $this->offre->statut,
                    'entreprise' => $this->whenLoaded('offre.entreprise', function() {
                        return [
                            'idEntreprise' => $this->offre->entreprise->idEntreprise,
                            'nom' => $this->offre->entreprise->nom,
                            'emailContact' => $this->offre->entreprise->emailContact,
                            'telephone' => $this->offre->entreprise->telephone,
                            'ville' => $this->offre->entreprise->ville,
                            'siteWeb' => $this->offre->entreprise->siteWeb,
                            'created_at' => $this->offre->entreprise->created_at,
                        ];
                    }),
                    'competences' => $this->offre->competences->map(function($competence) {
                        return [
                            'idCompetence' => $competence->idCompetence,
                            'nom' => $competence->nom,
                        ];
                    }),
                ];
            }),
        ];
    }
}