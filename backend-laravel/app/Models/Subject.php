<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'kod_subjek', 'nama_subjek', 'markah_penuh', 'dikira_purata', 'susunan', 'status'];
    protected $casts = ['markah_penuh' => 'decimal:2', 'dikira_purata' => 'boolean'];
}
