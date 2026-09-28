<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('upkk_amali_solat_marks', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->string('student_mykid'); $table->json('scores'); $table->decimal('jumlah', 6, 2)->default(0); $table->string('status')->default('DRAF'); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['tahun_akademik', 'student_mykid']);
        });
        Schema::create('upkk_pchi_marks', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->string('student_mykid'); $table->json('scores'); $table->decimal('jumlah', 6, 2)->default(0); $table->string('status')->default('DRAF'); $table->text('catatan')->nullable(); $table->timestamps(); $table->unique(['tahun_akademik', 'student_mykid']);
        });
        Schema::create('psra_trial_marks', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->unsignedTinyInteger('sesi'); $table->decimal('akhlak_sirah', 5, 2); $table->decimal('bahasa_arab', 5, 2); $table->decimal('jawi_imlak_khat', 5, 2); $table->decimal('tauhid_fekah', 5, 2); $table->decimal('tajwid', 5, 2); $table->foreignUuid('entered_by')->constrained('users'); $table->timestamps(); $table->unique(['tahun_akademik', 'student_id', 'sesi']);
        });
        Schema::create('psra_trial_paper_marks', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->unsignedTinyInteger('sesi'); $table->string('paper_code'); $table->decimal('markah', 5, 2); $table->foreignUuid('entered_by')->constrained('users'); $table->foreignUuid('updated_by')->constrained('users'); $table->timestamps(); $table->unique(['tahun_akademik', 'student_id', 'sesi', 'paper_code']);
        });
        Schema::create('upkk_trial_grade_settings', function (Blueprint $table) {
            $table->string('kod_sekolah')->primary(); $table->unsignedTinyInteger('grade_a_min')->default(85); $table->unsignedTinyInteger('grade_b_min')->default(65); $table->unsignedTinyInteger('grade_c_min')->default(45); $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamp('updated_at');
        });
        Schema::create('upkk_trial_paper_marks', function (Blueprint $table) {
            $table->uuid('id')->primary(); $table->string('kod_sekolah'); $table->unsignedInteger('tahun_akademik'); $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete(); $table->foreignUuid('student_id')->constrained('students')->cascadeOnDelete(); $table->string('paper_code'); $table->unsignedSmallInteger('markah'); $table->foreignUuid('entered_by')->constrained('users'); $table->foreignUuid('updated_by')->constrained('users'); $table->timestamps(); $table->unique(['tahun_akademik', 'student_id', 'paper_code']);
        });
    }

    public function down(): void
    {
        foreach (['upkk_trial_paper_marks', 'upkk_trial_grade_settings', 'psra_trial_paper_marks', 'psra_trial_marks', 'upkk_pchi_marks', 'upkk_amali_solat_marks'] as $table) Schema::dropIfExists($table);
    }
};
