<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('recommendations', function (Blueprint $table) {
            $table->id('idRecommendation');
            $table->foreignId('etudiant_id')->constrained('etudiants', 'idEtudiant')->onDelete('cascade');
            $table->foreignId('offre_id')->constrained('offres_stage', 'idOffre')->onDelete('cascade');
            $table->float('scoreMatching'); // 0-100
            $table->date('dateGeneration')->useCurrent();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('recommendations');
    }
};