<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class TimetablePageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $schools = DB::table('schools')->where('status', 'AKTIF')->get()
            ->filter(fn (object $school): bool => $user->canAccessSchool($school->kod_sekolah));
        $school = $request->string('kod_sekolah')->toString() ?: $schools->first()?->kod_sekolah;
        $slots = DB::table('timetable_slots')->where('kod_sekolah', $school)->where('status', 'AKTIF')->orderBy('susunan')->orderBy('hari')->get();
        $entries = DB::table('timetable_entries')->where('kod_sekolah', $school)->where('status', 'AKTIF')->count();

        return view('timetable.index', compact('schools', 'school', 'slots', 'entries'));
    }

    public function generateSlots(Request $request): RedirectResponse
    {
        app(TimetableController::class)->generateSlots($request);

        return redirect()->route('timetable.index', ['kod_sekolah' => $request->string('kod_sekolah')->toString()])->with('status', 'Slot waktu berjaya dijana.');
    }
}
