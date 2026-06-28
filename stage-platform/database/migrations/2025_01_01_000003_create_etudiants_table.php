<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
    public function up(){
        Schema::create('etudiants', function (Blueprint $table) {
            $table->id('idEtudiant');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('photo')->nullable();
            $table->text('description')->nullable();
            $table->string('ville')->nullable();
            $table->string('telephone')->nullable();
            $table->timestamps();
        });
    }

    public function down(){
        Schema::dropIfExists('etudiants');
    }
};