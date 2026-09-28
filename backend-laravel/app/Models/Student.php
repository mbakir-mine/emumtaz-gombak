<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'kod_sekolah', 'class_id', 'mykid', 'nama', 'jantina', 'status', 'tahun_akademik'];

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }
}
