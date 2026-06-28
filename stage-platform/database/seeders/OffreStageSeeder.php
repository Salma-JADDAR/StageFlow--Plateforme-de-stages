<?php

namespace Database\Seeders;

use App\Models\OffreStage;
use Illuminate\Database\Seeder;

class OffreStageSeeder extends Seeder
{
    public function run()
    {
        OffreStage::factory(30)->create();
    }
}