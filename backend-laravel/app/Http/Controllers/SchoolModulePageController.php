<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class SchoolModulePageController extends Controller
{
    private const MODULES = ['TAKWIM', 'KEHADIRAN_HARIAN', 'AMAL_KHAIR', 'JADUAL_WAKTU', 'RPH_AI', 'AKSES_IBU_BAPA', 'PELAPORAN_PBD', 'PENILAIAN_UPKK', 'KHALIFAH_MUDA', 'PERCUBAAN_PSRA', 'PERCUBAAN_UPKK'];

    public function index(Request $request): View
    {
        $user = $request->user();
        $schools = $user->role === 'OWNER' ? School::where('status', 'AKTIF')->orderBy('nama_sekolah')->get() : School::where('kod_sekolah', $user->kod_sekolah)->get();
        $selected = $request->query('school', $schools->first()?->kod_sekolah);
        $access = DB::table('school_module_access')->where('kod_sekolah', $selected)->pluck('enabled', 'module_key');
        return view('admin.school-modules', ['schools' => $schools, 'selected' => $selected, 'modules' => self::MODULES, 'access' => $access]);
    }

    public function store(Request $request)
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'exists:schools,kod_sekolah'], 'module_key' => ['required', 'in:'.implode(',', self::MODULES)], 'enabled' => ['required', 'boolean']]);
        abort_unless(in_array($request->user()->role, ['OWNER', 'ADMIN_SEKOLAH'], true), 403);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $id = DB::table('school_module_access')->where(['kod_sekolah' => $data['kod_sekolah'], 'module_key' => $data['module_key']])->value('id') ?? (string) Str::uuid();
        DB::table('school_module_access')->updateOrInsert(['id' => $id], [...$data, 'enabled_at' => $data['enabled'] ? now() : null, 'enabled_by' => $request->user()->id, 'updated_at' => now(), 'created_at' => now()]);
        return redirect()->route('admin.school-modules', ['school' => $data['kod_sekolah']])->with('status', 'Akses modul berjaya dikemas kini.');
    }
}
