<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah')->unique();
            $table->string('plan_code')->default('ASAS');
            $table->string('status')->default('PERCUBAAN');
            $table->date('starts_on');
            $table->date('ends_on')->nullable();
            $table->unsignedInteger('max_students')->nullable();
            $table->unsignedInteger('max_users')->nullable();
            $table->string('notes', 1000)->nullable();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'ends_on']);
        });

        Schema::create('mark_submission_workflows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah');
            $table->foreignUuid('exam_id')->constrained('exams')->cascadeOnDelete();
            $table->foreignUuid('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('kod_subjek');
            $table->string('status')->default('DRAF');
            $table->string('notes', 1000)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('locked_at')->nullable();
            $table->foreignUuid('locked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('correction_requested_at')->nullable();
            $table->foreignUuid('correction_requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['kod_sekolah', 'exam_id', 'class_id', 'kod_subjek'], 'mark_workflow_scope_unique');
            $table->index(['status', 'updated_at']);
        });

        Schema::create('user_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah')->nullable();
            $table->json('target_roles')->nullable();
            $table->string('type');
            $table->string('title', 160);
            $table->string('message', 1000);
            $table->string('link', 500)->nullable();
            $table->timestamps();
            $table->index(['kod_sekolah', 'created_at']);
        });

        Schema::create('user_notification_reads', function (Blueprint $table) {
            $table->foreignUuid('notification_id')->constrained('user_notifications')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('read_at');
            $table->primary(['notification_id', 'user_id']);
        });

        Schema::create('report_verifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('token')->unique();
            $table->string('reference_number')->unique();
            $table->string('report_type', 80);
            $table->string('scope_label', 240);
            $table->char('snapshot_hash', 64);
            $table->string('kod_sekolah')->nullable();
            $table->foreignUuid('issued_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('issued_at');
            $table->timestamp('revoked_at')->nullable();
            $table->index('issued_at');
        });

        Schema::create('rph_topic_bank', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedTinyInteger('tahun');
            $table->string('kod_subjek');
            $table->string('nama_subjek');
            $table->text('tajuk');
            $table->unsignedInteger('susunan')->default(999);
            $table->string('status')->default('AKTIF');
            $table->timestamps();
            $table->unique(['tahun', 'kod_subjek', 'tajuk'], 'rph_topic_scope_unique');
            $table->index(['tahun', 'kod_subjek', 'status', 'susunan']);
        });

        Schema::create('rph_weekly_submissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('kod_sekolah');
            $table->foreignUuid('teacher_id')->constrained('users')->restrictOnDelete();
            $table->date('week_start');
            $table->string('status')->default('DRAF');
            $table->string('teacher_note', 1000)->nullable();
            $table->string('reviewer_note', 2000)->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignUuid('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('review_started_at')->nullable();
            $table->foreignUuid('review_started_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('correction_requested_at')->nullable();
            $table->foreignUuid('correction_requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->foreignUuid('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['kod_sekolah', 'teacher_id', 'week_start'], 'rph_weekly_scope_unique');
        });

        Schema::create('rph_weekly_submission_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('submission_id')->constrained('rph_weekly_submissions')->cascadeOnDelete();
            $table->uuid('rph_record_id');
            $table->json('content_snapshot');
            $table->timestamps();
            $table->unique(['submission_id', 'rph_record_id'], 'rph_weekly_item_unique');
        });

        Schema::create('rph_weekly_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('submission_id')->constrained('rph_weekly_submissions')->cascadeOnDelete();
            $table->foreignUuid('actor_id')->constrained('users')->restrictOnDelete();
            $table->string('action');
            $table->string('comment', 2000)->nullable();
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rph_weekly_reviews');
        Schema::dropIfExists('rph_weekly_submission_items');
        Schema::dropIfExists('rph_weekly_submissions');
        Schema::dropIfExists('rph_topic_bank');
        Schema::dropIfExists('report_verifications');
        Schema::dropIfExists('user_notification_reads');
        Schema::dropIfExists('user_notifications');
        Schema::dropIfExists('mark_submission_workflows');
        Schema::dropIfExists('school_licenses');
    }
};
