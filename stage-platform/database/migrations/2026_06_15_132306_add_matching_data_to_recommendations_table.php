<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration{
    
    public function up(): void{
        Schema::table('recommendations', function (Blueprint $table) {
          
            if (!Schema::hasColumn('recommendations', 'matching_data')) {
                $table->json('matching_data')->nullable()->after('scoreMatching');
            }
        });
    }

  
    public function down(): void{
        Schema::table('recommendations', function (Blueprint $table) {
            if (Schema::hasColumn('recommendations', 'matching_data')) {
                $table->dropColumn('matching_data');
            }
        });
    }
};