<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('takwim_events')) {
            return;
        }

        Schema::create('takwim_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedInteger('tahun_akademik');
            $table->string('kod_sekolah')->nullable();
            $table->string('scope')->default('SEKOLAH');
            $table->string('kategori');
            $table->string('tajuk');
            $table->date('tarikh_mula');
            $table->date('tarikh_tamat');
            $table->text('keterangan')->nullable();
            $table->string('warna')->nullable();
            $table->string('status')->default('AKTIF');
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['kod_sekolah', 'tahun_akademik', 'tarikh_mula']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('takwim_events');
    }
};
