<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subject_grade_rules', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->unsignedTinyInteger('tahun'); $table->string('kod_subjek'); $table->string('gred'); $table->decimal('markah_min', 6, 2); $table->decimal('markah_max', 6, 2); $table->string('label_prestasi')->nullable(); $table->unsignedInteger('susunan')->default(999); $table->timestamps(); $table->unique(['tahun', 'kod_subjek', 'gred']);
        });
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('key')->primary(); $table->text('value')->nullable(); $table->string('description')->nullable(); $table->timestamp('updated_at'); $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings'); Schema::dropIfExists('subject_grade_rules');
    }
};
