<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // Méthode 1: Pour MySQL
        DB::statement("ALTER TABLE offres_stage MODIFY COLUMN statut ENUM('publiée', 'archivée', 'en_attente', 'refusée') DEFAULT 'en_attente'");
        
      
    }

    public function down()
    {
        DB::statement("ALTER TABLE offres_stage MODIFY COLUMN statut ENUM('publiée', 'en_attente', 'refusée') DEFAULT 'en_attente'");
    }
};