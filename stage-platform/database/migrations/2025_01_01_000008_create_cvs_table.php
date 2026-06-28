<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('cvs', function (Blueprint $table) {
            $table->id('idCV');
            $table->foreignId('etudiant_id')->constrained('etudiants', 'idEtudiant')->onDelete('cascade')->unique();
            $table->string('nomFichier');
            $table->string('cheminFichier');
            $table->date('dateUpload')->useCurrent();
            $table->double('taille'); // en Ko
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('cvs');
    }
};