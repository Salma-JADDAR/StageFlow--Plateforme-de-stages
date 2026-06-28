<?php

namespace Database\Seeders;

use App\Models\OffreStage;
use App\Models\Competence;
use Illuminate\Database\Seeder;

class OffreCompetenceSeeder extends Seeder
{
    public function run()
    {
        $offres = OffreStage::all();
        $competences = Competence::all();

        foreach ($offres as $offre) {
            $randComps = $competences->random(rand(3, 6));
            foreach ($randComps as $comp) {
                $offre->competences()->attach($comp->idCompetence, [
                    'priorite' => rand(1, 2)
                ]);
            }
        }
    }
}