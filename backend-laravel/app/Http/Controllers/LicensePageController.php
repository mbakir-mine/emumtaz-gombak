<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class LicensePageController extends Controller
{
    public function index(Request $request): View
    {
        $query = DB::table('school_licenses')->orderBy('kod_sekolah');
        $user = $request->user();
        if ($user->role === 'ADMIN_ZON') $query->whereIn('kod_sekolah', School::where('zon', $user->zon)->pluck('kod_sekolah'));
        elseif (!in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $user->kod_sekolah);
        return view('admin.licenses', ['licenses' => $query->get(), 'schools' => $user->role === 'OWNER' ? School::where('status', 'AKTIF')->orderBy('nama_sekolah')->get() : collect()]);
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->role === 'OWNER', 403);
        $data = $request->validate(['kod_sekolah' => ['required', 'exists:schools,kod_sekolah'], 'plan_code' => ['required', 'in:PERCUBAAN,ASAS,PRO,PREMIER'], 'status' => ['required', 'in:PERCUBAAN,AKTIF,DIGANTUNG,TAMAT'], 'starts_on' => ['required', 'date'], 'ends_on' => ['nullable', 'date', 'after_or_equal:starts_on'], 'notes' => ['nullable', 'max:1000']]);
        $id = DB::table('school_licenses')->where('kod_sekolah', $data['kod_sekolah'])->value('id') ?? (string) Str::uuid();
        DB::table('school_licenses')->updateOrInsert(['id' => $id], [...$data, 'updated_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]);
        return redirect()->route('admin.licenses')->with('status', 'Lesen sekolah berjaya disimpan.');
    }
}
