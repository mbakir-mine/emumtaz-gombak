<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TakwimPageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()
            ->filter(fn (object $school): bool => $user->canAccessSchool($school->kod_sekolah));
        $query = DB::table('takwim_events')->where('status', 'AKTIF');
        if (! in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true)) {
            $query->where('kod_sekolah', $user->kod_sekolah);
        }

        return view('takwim.index', [
            'events' => $query->orderBy('tarikh_mula')->get(),
            'schools' => $schools,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tahun_akademik' => ['required', 'integer'],
            'kod_sekolah' => ['nullable', 'string', 'max:40'],
            'kategori' => ['required', 'string', 'max:40'],
            'tajuk' => ['required', 'string', 'max:255'],
            'tarikh_mula' => ['required', 'date'],
            'tarikh_tamat' => ['required', 'date', 'after_or_equal:tarikh_mula'],
            'keterangan' => ['nullable', 'string'],
        ]);
        $user = $request->user();
        $school = $data['kod_sekolah'] ?? null;
        if ($school) {
            abort_unless($user->canAccessSchool($school), 403);
        } else {
            abort_unless(in_array($user->role, ['OWNER', 'ADMIN_DAERAH'], true), 403);
        }
        DB::table('takwim_events')->insert([
            ...$data,
            'id' => (string) Str::uuid(),
            'scope' => $school ? 'SEKOLAH' : 'DAERAH',
            'status' => 'AKTIF',
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return back()->with('status', 'Acara takwim berjaya ditambah.');
    }
}
