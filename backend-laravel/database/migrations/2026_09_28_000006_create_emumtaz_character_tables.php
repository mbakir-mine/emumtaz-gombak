<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('khalifah_muda_components', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('key')->unique(); $table->string('label'); $table->string('domain')->default('Umum'); $table->string('kind'); $table->decimal('points', 6, 2)->default(0); $table->integer('sort_order')->default(0); $table->string('status')->default('AKTIF'); $table->timestamps();
        });
        Schema::create('khalifah_muda_records', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->foreignUuid('student_id')->nullable()->constrained('students')->cascadeOnDelete(); $table->date('record_date'); $table->string('record_scope'); $table->string('record_kind'); $table->string('domain'); $table->string('indicator_key'); $table->string('indicator_label'); $table->decimal('points', 6, 2)->default(0); $table->text('catatan')->nullable(); $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete(); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->index(['kod_sekolah', 'class_id', 'record_date']);
        });
        Schema::create('sahsiah_ihab_assessments', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->unsignedTinyInteger('bulan'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->boolean('m1_confirmed')->default(false); $table->boolean('m2_confirmed')->default(false); $table->unsignedSmallInteger('m3_raw'); $table->decimal('m3_percent', 5, 1); $table->unsignedTinyInteger('m4'); $table->unsignedTinyInteger('m5'); $table->unsignedTinyInteger('m6'); $table->decimal('total_score', 6, 1); $table->string('grade'); $table->unsignedTinyInteger('band'); $table->string('status')->default('DRAF'); $table->text('catatan')->nullable(); $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete(); $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('submitted_at')->nullable(); $table->timestamp('verified_at')->nullable(); $table->timestamps(); $table->unique(['kod_sekolah', 'tahun_akademik', 'bulan', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sahsiah_ihab_assessments'); Schema::dropIfExists('khalifah_muda_records'); Schema::dropIfExists('khalifah_muda_components');
    }
};
