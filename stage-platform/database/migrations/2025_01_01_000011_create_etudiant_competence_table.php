<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('etudiant_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('etudiant_id')->constrained('etudiants', 'idEtudiant')->onDelete('cascade');
            $table->foreignId('competence_id')->constrained('competences', 'idCompetence')->onDelete('cascade');
            $table->enum('niveau', ['débutant', 'intermédiaire', 'avancé', 'expert']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('etudiant_competence');
    }
};