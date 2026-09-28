<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PbdAssessment extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'kod_sekolah', 'class_id', 'tahun_akademik', 'kod_subjek', 'teacher_id', 'tarikh', 'tajuk', 'instrumen', 'markah_penuh', 'status'];
    protected $casts = ['tarikh' => 'date', 'markah_penuh' => 'decimal:2'];
}
