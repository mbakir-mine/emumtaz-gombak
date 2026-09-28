<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->unsignedInteger('tahun_akademik'); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete(); $table->string('status')->default('AKTIF'); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['student_id', 'tahun_akademik']);
        });
        Schema::create('student_transfer_logs', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->string('mykid'); $table->string('nama_murid'); $table->string('from_kod_sekolah')->nullable(); $table->string('to_kod_sekolah'); $table->uuid('from_class_id')->nullable(); $table->foreignUuid('to_class_id')->constrained('classes'); $table->string('transfer_type')->default('DALAM_DAERAH'); $table->foreignUuid('confirmed_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('confirmed_at'); $table->index('student_id');
        });
        Schema::create('subject_component_mark_settings', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->unsignedInteger('tahun_akademik'); $table->string('kod_peperiksaan'); $table->unsignedTinyInteger('tahun'); $table->string('kod_subjek'); $table->string('kod_komponen'); $table->decimal('markah_penuh', 6, 2); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->unique(['tahun_akademik', 'kod_peperiksaan', 'tahun', 'kod_subjek', 'kod_komponen'], 'component_setting_context_unique');
        });
        Schema::create('school_subject_mark_settings', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->string('kod_peperiksaan'); $table->unsignedTinyInteger('tahun'); $table->string('kod_subjek'); $table->decimal('markah_penuh', 7, 2); $table->string('status')->default('AKTIF'); $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete(); $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps(); $table->unique(['kod_sekolah', 'tahun_akademik', 'kod_peperiksaan', 'tahun', 'kod_subjek'], 'school_subject_setting_unique');
        });
        Schema::create('school_subject_component_mark_settings', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->string('kod_peperiksaan'); $table->unsignedTinyInteger('tahun'); $table->string('kod_subjek'); $table->string('kod_komponen'); $table->decimal('markah_penuh', 7, 2); $table->string('status')->default('AKTIF'); $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete(); $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps(); $table->unique(['kod_sekolah', 'tahun_akademik', 'kod_peperiksaan', 'tahun', 'kod_subjek', 'kod_komponen'], 'school_component_setting_unique');
        });
    }

    public function down(): void
    {
        foreach (['school_subject_component_mark_settings', 'school_subject_mark_settings', 'subject_component_mark_settings', 'student_transfer_logs', 'student_enrollments'] as $table) Schema::dropIfExists($table);
    }
};
