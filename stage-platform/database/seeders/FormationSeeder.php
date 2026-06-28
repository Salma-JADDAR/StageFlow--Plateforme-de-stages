<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Formation;

class FormationSeeder extends Seeder{
    public function run(){
        $formations = [
            ['diplome' => 'Licence en Informatique', 'etablissement' => 'Faculté des Sciences Semlalia', 'niveau' => 'Bac+3', 'anneeDebut' => 2020, 'anneeFin' => 2023],
            ['diplome' => 'Master Data Science', 'etablissement' => 'École Nationale des Sciences Appliquées', 'niveau' => 'Bac+5', 'anneeDebut' => 2023, 'anneeFin' => 2025],
            ['diplome' => 'BTS Développement Web', 'etablissement' => 'ISTA Marrakech', 'niveau' => 'Bac+2', 'anneeDebut' => 2021, 'anneeFin' => 2023],
            ['diplome' => 'Doctorat en IA', 'etablissement' => 'Université Cadi Ayyad', 'niveau' => 'Bac+8', 'anneeDebut' => 2018, 'anneeFin' => 2023],
            ['diplome' => 'Cycle Ingénieur Génie Logiciel', 'etablissement' => 'EMI Rabat', 'niveau' => 'Bac+5', 'anneeDebut' => 2019, 'anneeFin' => 2024],
        ];
        foreach ($formations as $f) {
            Formation::create($f);
        }
    }
}