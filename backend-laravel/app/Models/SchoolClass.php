<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    protected $table = 'classes';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'school_id', 'kod_sekolah', 'tahun_akademik', 'tahun', 'nama_kelas', 'sesi', 'status'];

    public function school()
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
