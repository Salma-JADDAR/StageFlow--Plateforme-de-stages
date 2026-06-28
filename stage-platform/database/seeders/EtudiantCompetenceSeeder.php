<?php

namespace Database\Seeders;

use App\Models\Etudiant;
use App\Models\Competence;
use Illuminate\Database\Seeder;

class EtudiantCompetenceSeeder extends Seeder
{
    public function run()
    {
        $etudiants = Etudiant::all();
        $competences = Competence::all();

        foreach ($etudiants as $etudiant) {
            $randComps = $competences->random(rand(2, 5));
            foreach ($randComps as $comp) {
                $etudiant->competences()->attach($comp->idCompetence, [
                    'niveau' => collect(['débutant', 'intermédiaire', 'avancé', 'expert'])->random()
                ]);
            }
        }
    }
}