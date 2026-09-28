<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mark extends Model
{
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['id', 'exam_id', 'student_id', 'kod_sekolah', 'class_id', 'kod_subjek', 'markah', 'entered_by'];
    protected $casts = ['markah' => 'decimal:2'];
}
