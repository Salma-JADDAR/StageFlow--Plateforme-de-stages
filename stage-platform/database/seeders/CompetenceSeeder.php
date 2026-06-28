<?php

namespace Database\Seeders;

use App\Models\Competence;
use Illuminate\Database\Seeder;

class CompetenceSeeder extends Seeder
{
    public function run()
    {
        $competences = [
            ['nom' => 'PHP', 'categorie' => 'Langage'],
            ['nom' => 'Laravel', 'categorie' => 'Framework'],
            ['nom' => 'React', 'categorie' => 'Framework'],
            ['nom' => 'MySQL', 'categorie' => 'Base de données'],
            ['nom' => 'JavaScript', 'categorie' => 'Langage'],
            ['nom' => 'Python', 'categorie' => 'Langage'],
            ['nom' => 'Java', 'categorie' => 'Langage'],
            ['nom' => 'Git', 'categorie' => 'Outils'],
            ['nom' => 'UML', 'categorie' => 'Méthodologie'],
        ];
        foreach ($competences as $c) {
            Competence::create($c);
        }
    }
}