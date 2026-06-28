<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFeedbackToRecommendationsTable extends Migration{
    public function up(){
        Schema::table('recommendations', function (Blueprint $table) {
            $table->boolean('feedback')->nullable()->after('scoreMatching');
            $table->timestamp('feedback_date')->nullable()->after('feedback');
        });
    }

    public function down(){
        Schema::table('recommendations', function (Blueprint $table) {
            $table->dropColumn(['feedback', 'feedback_date']);
        });
    }
}