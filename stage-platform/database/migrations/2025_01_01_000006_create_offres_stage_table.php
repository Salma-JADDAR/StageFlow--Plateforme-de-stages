<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
    public function up(){
        Schema::create('offres_stage', function (Blueprint $table) {
            $table->id('idOffre');
            $table->foreignId('entreprise_id')->constrained('entreprises', 'idEntreprise')->onDelete('cascade');
            $table->string('titre');
            $table->text('description');
            $table->string('ville');
            $table->integer('duree'); // en mois
            $table->string('typeStage'); // ex: PFE, stage d'été
            $table->date('datePublication')->useCurrent();
            $table->date('dateLimite');
            $table->enum('statut', ['publiée', 'clôturée', 'annulée'])->default('publiée');
            $table->timestamps();
        });
    }

    public function down(){
        Schema::dropIfExists('offres_stage');
    }
};