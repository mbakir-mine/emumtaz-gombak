<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auth_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at');
            $table->uuid('actor_auth_user_id')->nullable();
            $table->string('actor_email')->nullable();
            $table->foreignUuid('actor_profile_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable();
            $table->string('actor_role')->nullable();
            $table->string('kod_sekolah')->nullable();
            $table->string('event_type');
            $table->string('session_id');
            $table->unique(['session_id', 'event_type']);
            $table->index(['actor_auth_user_id', 'created_at']);
        });

        Schema::create('auth_login_failure_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at');
            $table->char('identifier_hash', 64);
            $table->char('network_hash', 64)->nullable();
            $table->string('device_family')->default('UNKNOWN');
            $table->index(['identifier_hash', 'created_at']);
        });

        Schema::create('parent_access_events', function (Blueprint $table) {
            $table->id();
            $table->string('kod_sekolah')->nullable();
            $table->foreignUuid('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->string('event_type');
            $table->char('identifier_hash', 64);
            $table->char('network_hash', 64)->nullable();
            $table->timestamp('created_at');
            $table->index(['identifier_hash', 'created_at']);
        });

        Schema::create('security_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('created_at');
            $table->uuid('actor_auth_user_id')->nullable();
            $table->string('actor_email')->nullable();
            $table->foreignUuid('actor_profile_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action');
            $table->string('table_name');
            $table->string('record_id')->nullable();
            $table->string('kod_sekolah')->nullable();
            $table->json('changed_fields')->nullable();
            $table->index(['actor_auth_user_id', 'created_at']);
            $table->index(['kod_sekolah', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_audit_logs');
        Schema::dropIfExists('parent_access_events');
        Schema::dropIfExists('auth_login_failure_logs');
        Schema::dropIfExists('auth_activity_logs');
    }
};
