<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class ReportPageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()
            ->filter(fn (object $school): bool => $user->canAccessSchool($school->kod_sekolah));
        $schoolCodes = $schools->pluck('kod_sekolah');

        return view('reports.index', [
            'schoolCount' => $schools->count(),
            'studentCount' => DB::table('students')->whereIn('kod_sekolah', $schoolCodes)->where('status', 'AKTIF')->count(),
            'markCount' => DB::table('marks')->whereIn('kod_sekolah', $schoolCodes)->count(),
            'exams' => DB::table('exams')->where('status', '!=', 'DIBATALKAN')->orderByDesc('tahun_akademik')->orderBy('nama_peperiksaan')->get(),
        ]);
    }
}
