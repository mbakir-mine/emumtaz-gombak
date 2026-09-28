<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class School extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'kod_sekolah', 'nama_sekolah', 'kategori', 'daerah', 'zon', 'status'];
}
