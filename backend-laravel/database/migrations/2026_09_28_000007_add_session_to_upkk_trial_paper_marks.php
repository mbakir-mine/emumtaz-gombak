<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('upkk_trial_paper_marks', function (Blueprint $table): void {
            $table->unsignedTinyInteger('sesi')->default(1)->after('tahun_akademik');
        });
        Schema::table('upkk_trial_paper_marks', function (Blueprint $table): void {
            $table->dropUnique('upkk_trial_paper_marks_tahun_akademik_student_id_paper_code_unique');
            $table->unique(['tahun_akademik', 'student_id', 'sesi', 'paper_code']);
        });
    }

    public function down(): void
    {
        Schema::table('upkk_trial_paper_marks', function (Blueprint $table): void {
            $table->dropUnique('upkk_trial_paper_marks_tahun_akademik_student_id_sesi_paper_code_unique');
            $table->unique(['tahun_akademik', 'student_id', 'paper_code']);
            $table->dropColumn('sesi');
        });
    }
};
