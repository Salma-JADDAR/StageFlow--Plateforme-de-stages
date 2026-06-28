<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('offre_competence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offre_id')->constrained('offres_stage', 'idOffre')->onDelete('cascade');
            $table->foreignId('competence_id')->constrained('competences', 'idCompetence')->onDelete('cascade');
            $table->integer('priorite')->default(1); // 1 = obligatoire, 2 = souhaitée
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('offre_competence');
    }
};