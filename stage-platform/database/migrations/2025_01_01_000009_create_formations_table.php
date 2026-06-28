<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('formations', function (Blueprint $table) {
            $table->id('idFormation');
            $table->foreignId('etudiant_id')->nullable()->constrained('etudiants', 'idEtudiant')->onDelete('cascade');
            $table->string('diplome');
            $table->string('etablissement');
            $table->string('niveau');
            $table->integer('anneeDebut');
            $table->integer('anneeFin');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('formations');
    }
};