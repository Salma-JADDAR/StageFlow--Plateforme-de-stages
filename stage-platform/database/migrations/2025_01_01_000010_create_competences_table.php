<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('competences', function (Blueprint $table) {
            $table->id('idCompetence');
            $table->string('nom');
            $table->string('categorie');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('competences');
    }
};