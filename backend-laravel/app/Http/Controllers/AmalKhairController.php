<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AmalKhairController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        return response()->json(['data' => DB::table('amal_khair_categories')->where('status', 'AKTIF')->orderBy('nama_kategori')->get()]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('amal_khair_records as r')->leftJoin('amal_khair_categories as c', 'c.id', '=', 'r.category_id')->leftJoin('students as s', 's.id', '=', 'r.student_id')->select('r.*', 'c.nama_kategori as kategori', 's.nama_murid')->where('r.status', 'AKTIF')->latest('r.recorded_at');
        if (! $request->user()->roleIsAdministrative()) $query->where('r.kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->limit(5000)->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'uuid', 'exists:students,id'], 'category_id' => ['required', 'uuid'], 'mata' => ['required', 'integer', 'min:1', 'max:100'], 'catatan' => ['nullable', 'string', 'max:2000'],
        ]);
        $student = DB::table('students')->where('id', $data['student_id'])->first();
        abort_unless($student && $request->user()->canAccessSchool($student->kod_sekolah), 403);
        abort_unless(DB::table('amal_khair_categories')->where(['id' => $data['category_id'], 'status' => 'AKTIF'])->exists(), 422, 'Kategori Amal Khair tidak sah.');
        $id = (string) Str::uuid();
        DB::table('amal_khair_records')->insert(['id' => $id, 'student_id' => $student->id, 'kod_sekolah' => $student->kod_sekolah, 'class_id' => $student->class_id, 'category_id' => $data['category_id'], 'mata' => $data['mata'], 'catatan' => $data['catatan'] ?? null, 'recorded_by' => $request->user()->id, 'recorded_at' => now(), 'status' => 'AKTIF', 'created_at' => now()]);
        return response()->json(['data' => ['id' => $id]], 201);
    }
}
