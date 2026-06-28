<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
    public function up(){
        Schema::create('candidatures', function (Blueprint $table) {
            $table->id('idCandidature');
            $table->foreignId('etudiant_id')->constrained('etudiants', 'idEtudiant')->onDelete('cascade');
            $table->foreignId('offre_id')->constrained('offres_stage', 'idOffre')->onDelete('cascade');
            $table->date('dateCandidature')->useCurrent();
            $table->enum('statut', ['en_attente', 'acceptée', 'refusée'])->default('en_attente');
            $table->text('lettreMotivation');
            $table->timestamps();
        });
    }

    public function down(){
        Schema::dropIfExists('candidatures');
    }
};