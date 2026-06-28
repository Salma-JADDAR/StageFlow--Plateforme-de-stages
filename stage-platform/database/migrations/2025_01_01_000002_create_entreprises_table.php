<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->id('idEntreprise');
            $table->string('nom');
            $table->text('description');
            $table->string('adresse');
            $table->string('ville');
            $table->string('siteWeb')->nullable();
            $table->string('logo')->nullable();
            $table->string('emailContact');
            $table->string('telephone');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('entreprises');
    }
};