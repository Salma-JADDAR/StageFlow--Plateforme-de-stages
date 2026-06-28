<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
    public function up(){
        Schema::table('offres_stage', function (Blueprint $table) {
            $table->boolean('remote')->default(false)->after('ville');
            $table->decimal('salaire', 10, 2)->nullable()->after('duree');
            
        });
    }

    public function down(){
        Schema::table('offres_stage', function (Blueprint $table) {
            $table->dropColumn(['remote', 'salaire']);
        });
    }
};