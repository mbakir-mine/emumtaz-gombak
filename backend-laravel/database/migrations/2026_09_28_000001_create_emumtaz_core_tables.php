<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah', 32)->unique();
            $table->string('nama_sekolah');
            $table->string('kategori', 32)->default('KAFAI');
            $table->string('daerah', 100)->nullable()->index();
            $table->string('zon', 32)->nullable()->index();
            $table->string('status', 20)->default('AKTIF')->index();
            $table->timestamps();
        });

        Schema::create('classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('school_id')->nullable()->constrained('schools')->nullOnDelete();
            $table->string('kod_sekolah', 32)->index();
            $table->unsignedSmallInteger('tahun_akademik')->index();
            $table->unsignedTinyInteger('tahun')->nullable();
            $table->string('nama_kelas');
            $table->string('sesi', 20)->nullable();
            $table->string('status', 20)->default('AKTIF')->index();
            $table->timestamps();
            $table->unique(['kod_sekolah', 'tahun_akademik', 'tahun', 'nama_kelas']);
        });

        Schema::create('students', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah', 32)->index();
            $table->uuid('class_id')->nullable()->index();
            $table->string('mykid', 32)->unique();
            $table->string('nama');
            $table->string('jantina', 20)->nullable();
            $table->string('status', 20)->default('AKTIF')->index();
            $table->unsignedSmallInteger('tahun_akademik')->nullable()->index();
            $table->timestamps();
            $table->index(['kod_sekolah', 'status']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 80)->index();
            $table->string('table_name', 100)->nullable();
            $table->string('record_id', 100)->nullable();
            $table->string('kod_sekolah', 32)->nullable()->index();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        Schema::create('subjects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_subjek', 64)->unique();
            $table->string('nama_subjek');
            $table->decimal('markah_penuh', 6, 2)->default(100);
            $table->boolean('dikira_purata')->default(true);
            $table->unsignedSmallInteger('susunan')->default(999);
            $table->string('status', 20)->default('AKTIF')->index();
            $table->timestamps();
        });

        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_peperiksaan', 64);
            $table->string('nama_peperiksaan');
            $table->unsignedSmallInteger('tahun_akademik')->index();
            $table->string('status', 20)->default('DIBUKA')->index();
            $table->date('tarikh_mula')->nullable();
            $table->date('tarikh_tamat')->nullable();
            $table->timestamps();
            $table->unique(['kod_peperiksaan', 'tahun_akademik']);
        });

        Schema::create('teacher_class_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'class_id']);
        });

        Schema::create('teacher_subject_assignments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('kod_subjek', 64);
            $table->string('assignment_label')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'class_id', 'kod_subjek']);
            $table->index('kod_subjek');
        });

        Schema::create('marks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('kod_sekolah', 32)->index();
            $table->foreignUuid('class_id')->constrained('classes');
            $table->string('kod_subjek', 64)->index();
            $table->decimal('markah', 6, 2)->nullable();
            $table->foreignUuid('entered_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['exam_id', 'student_id', 'kod_subjek']);
        });

        Schema::create('grade_scales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama_gred', 64)->unique();
            $table->decimal('markah_min', 6, 2);
            $table->decimal('markah_max', 6, 2);
            $table->string('label_prestasi')->nullable();
            $table->unsignedSmallInteger('susunan')->default(999);
            $table->timestamps();
        });

        Schema::create('daily_attendance', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('kod_sekolah', 32)->index();
            $table->date('attendance_date')->index();
            $table->string('status', 20)->default('HADIR');
            $table->string('catatan')->nullable();
            $table->foreignUuid('recorded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['student_id', 'attendance_date']);
        });

        Schema::create('pbd_assessments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah', 32)->index();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->unsignedSmallInteger('tahun_akademik')->index();
            $table->string('kod_subjek', 64)->index();
            $table->foreignUuid('teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('tarikh');
            $table->string('tajuk')->default('Penilaian PBD');
            $table->string('instrumen')->default('Pemerhatian');
            $table->decimal('markah_penuh', 6, 2)->default(100);
            $table->string('status', 20)->default('AKTIF')->index();
            $table->timestamps();
            $table->unique(['class_id', 'kod_subjek', 'tarikh', 'tajuk', 'instrumen'], 'pbd_assessment_unique');
        });

        Schema::create('pbd_marks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('assessment_id')->constrained('pbd_assessments')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->decimal('markah', 6, 2)->nullable();
            $table->unsignedTinyInteger('tahap_penguasaan')->nullable();
            $table->text('catatan')->nullable();
            $table->timestamps();
            $table->unique(['assessment_id', 'student_id']);
        });

        Schema::create('parent_access_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('kod_sekolah', 32)->index();
            $table->string('code_hash', 128);
            $table->timestamp('expires_at')->index();
            $table->unsignedTinyInteger('failed_attempts')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->string('status', 20)->default('AKTIF')->index();
            $table->foreignUuid('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('parent_access_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('access_code_id')->constrained('parent_access_codes')->cascadeOnDelete();
            $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete();
            $table->string('kod_sekolah', 32)->index();
            $table->string('token_hash', 128)->unique();
            $table->timestamp('expires_at')->index();
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('daily_attendance');
        Schema::dropIfExists('pbd_marks');
        Schema::dropIfExists('pbd_assessments');
        Schema::dropIfExists('parent_access_sessions');
        Schema::dropIfExists('parent_access_codes');
        Schema::dropIfExists('grade_scales');
        Schema::dropIfExists('marks');
        Schema::dropIfExists('teacher_subject_assignments');
        Schema::dropIfExists('teacher_class_assignments');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('subjects');
        Schema::dropIfExists('students');
        Schema::dropIfExists('classes');
        Schema::dropIfExists('schools');
    }
};
