<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'kod_peperiksaan', 'nama_peperiksaan', 'tahun_akademik', 'status', 'tarikh_mula', 'tarikh_tamat'];
    protected $casts = ['tarikh_mula' => 'date', 'tarikh_tamat' => 'date'];
}
