<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_module_access', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->string('module_key');
            $table->boolean('enabled')->default(false); $table->timestamp('enabled_at')->nullable();
            $table->foreignUuid('enabled_by')->nullable()->constrained('users')->nullOnDelete(); $table->text('catatan')->nullable(); $table->timestamps();
            $table->unique(['kod_sekolah', 'module_key']);
        });
        Schema::create('amal_khair_categories', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('nama_kategori')->unique(); $table->unsignedInteger('mata_default')->default(5); $table->string('status')->default('AKTIF'); $table->timestamp('created_at');
        });
        Schema::create('amal_khair_records', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete(); $table->foreignUuid('category_id')->nullable()->constrained('amal_khair_categories')->nullOnDelete(); $table->unsignedInteger('mata')->default(1); $table->text('catatan')->nullable(); $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('recorded_at'); $table->string('status')->default('AKTIF'); $table->timestamp('created_at'); $table->index(['kod_sekolah', 'recorded_at']);
        });
        Schema::create('timetable_slots', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->string('hari'); $table->time('waktu_mula'); $table->time('waktu_tamat'); $table->string('label')->nullable(); $table->unsignedInteger('susunan')->default(999); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->unique(['kod_sekolah', 'hari', 'waktu_mula', 'waktu_tamat']);
        });
        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('slot_id')->constrained('timetable_slots')->cascadeOnDelete(); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->string('kod_sekolah'); $table->string('kod_subjek')->nullable(); $table->foreignUuid('teacher_id')->nullable()->constrained('users')->nullOnDelete(); $table->string('kod_komponen')->nullable(); $table->string('assignment_label')->nullable(); $table->string('nama_paparan')->nullable(); $table->string('bilik')->nullable(); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->unique(['slot_id', 'class_id']);
        });
        Schema::create('timetable_requirements', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->string('kod_subjek'); $table->string('kod_komponen')->nullable(); $table->string('assignment_label')->nullable(); $table->string('nama_paparan')->nullable(); $table->foreignUuid('teacher_id')->nullable()->constrained('users')->nullOnDelete(); $table->unsignedInteger('bil_slot_seminggu')->default(1); $table->boolean('boleh_gabung')->default(false); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->index(['kod_sekolah', 'class_id']);
        });
        Schema::create('rph_records', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->nullable()->constrained('classes')->nullOnDelete(); $table->foreignUuid('teacher_id')->nullable()->constrained('users')->nullOnDelete(); $table->string('kod_subjek')->nullable(); $table->date('tarikh'); $table->text('tajuk'); $table->text('standard_pembelajaran')->nullable(); $table->text('objektif')->nullable(); $table->text('aktiviti')->nullable(); $table->text('bbm')->nullable(); $table->text('pentaksiran')->nullable(); $table->text('refleksi')->nullable(); $table->text('ai_prompt')->nullable(); $table->string('status')->default('DRAF'); $table->timestamps(); $table->index(['kod_sekolah', 'tarikh']);
        });
        Schema::create('subject_components', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_subjek'); $table->string('kod_komponen'); $table->string('nama_komponen'); $table->decimal('markah_penuh', 8, 2); $table->unsignedInteger('susunan')->default(999); $table->string('status')->default('AKTIF'); $table->timestamps(); $table->unique(['kod_subjek', 'kod_komponen']);
        });
        Schema::create('mark_components', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->string('kod_sekolah'); $table->foreignUuid('class_id')->constrained('classes'); $table->string('kod_subjek'); $table->string('kod_komponen'); $table->decimal('markah', 8, 2)->nullable(); $table->foreignUuid('entered_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('updated_at'); $table->unique(['exam_id', 'student_id', 'kod_subjek', 'kod_komponen']);
        });
        Schema::create('teacher_subject_component_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete(); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->string('kod_subjek'); $table->string('kod_komponen'); $table->timestamp('created_at'); $table->unique(['user_id', 'class_id', 'kod_subjek', 'kod_komponen']);
        });
        Schema::create('takwim_events', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->unsignedInteger('tahun_akademik'); $table->string('kod_sekolah')->nullable(); $table->string('scope')->default('SEKOLAH'); $table->string('kategori'); $table->string('tajuk'); $table->date('tarikh_mula'); $table->date('tarikh_tamat'); $table->text('keterangan')->nullable(); $table->string('warna')->nullable(); $table->string('status')->default('AKTIF'); $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps(); $table->index(['kod_sekolah', 'tahun_akademik', 'tarikh_mula']);
        });
    }

    public function down(): void
    {
        foreach (['takwim_events', 'teacher_subject_component_assignments', 'mark_components', 'subject_components', 'rph_records', 'timetable_requirements', 'timetable_entries', 'timetable_slots', 'amal_khair_records', 'amal_khair_categories', 'school_module_access'] as $table) Schema::dropIfExists($table);
    }
};
