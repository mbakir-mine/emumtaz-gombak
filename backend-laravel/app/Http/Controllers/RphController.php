<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class RphController extends Controller
{
    public function topics(Request $request): JsonResponse
    {
        return response()->json(['data' => DB::table('rph_topic_bank')->where('status', 'AKTIF')->orderBy('kod_subjek')->orderBy('susunan')->get()]);
    }

    public function weekly(Request $request, string $kind): JsonResponse
    {
        $tables = ['submissions' => 'rph_weekly_submissions', 'items' => 'rph_weekly_submission_items', 'reviews' => 'rph_weekly_reviews'];
        abort_unless(isset($tables[$kind]), 404);
        $query = DB::table($tables[$kind])->latest('created_at');
        if (! $request->user()->roleIsAdministrative() && $kind !== 'reviews') $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->limit($kind === 'items' ? 5000 : 1000)->get()]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('rph_records')->where('status', '!=', 'DIBUANG')->latest('tarikh')->limit(500);
        if (! $request->user()->roleIsAdministrative()) $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function transitionWeekly(Request $request): JsonResponse
    {
        $data = $request->validate(['submission_id' => ['nullable', 'uuid'], 'kod_sekolah' => ['required', 'string', 'max:32'], 'week_start' => ['required', 'date'], 'next_action' => ['required', 'in:HANTAR,MULA_SEMAK,PEMBETULAN,SAH'], 'note' => ['nullable', 'string', 'max:2000']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        if ($data['next_action'] === 'PEMBETULAN' && strlen(trim((string) ($data['note'] ?? ''))) < 5) abort(422, 'Sebab pembetulan sekurang-kurangnya 5 aksara diperlukan.');
        $submission = !empty($data['submission_id']) ? DB::table('rph_weekly_submissions')->where(['id' => $data['submission_id'], 'kod_sekolah' => $data['kod_sekolah']])->first() : null;
        abort_unless($data['next_action'] === 'HANTAR' || $submission, 422, 'Penghantaran untuk disemak tidak ditemui.');
        $administrative = $request->user()->roleIsAdministrative();
        if ($data['next_action'] !== 'HANTAR') abort_unless($administrative, 403, 'Hanya pentadbir boleh menyemak RPH.');
        if ($submission && !$administrative) abort_unless($submission->teacher_id === $request->user()->id, 403, 'RPH ini bukan milik guru semasa.');
        $now = now(); $statusMap = ['HANTAR' => 'DIHANTAR', 'MULA_SEMAK' => 'DALAM_SEMAKAN', 'PEMBETULAN' => 'PEMBETULAN', 'SAH' => 'DISAHKAN'];
        if (!$submission) { $id = (string) Str::uuid(); DB::table('rph_weekly_submissions')->insert(['id' => $id, 'kod_sekolah' => $data['kod_sekolah'], 'teacher_id' => $request->user()->id, 'week_start' => $data['week_start'], 'status' => 'DIHANTAR', 'teacher_note' => $data['note'] ?? null, 'submitted_at' => $now, 'submitted_by' => $request->user()->id, 'created_at' => $now, 'updated_at' => $now]); $submission = DB::table('rph_weekly_submissions')->where('id', $id)->first(); }
        else { $updates = ['status' => $statusMap[$data['next_action']], 'updated_at' => $now]; if ($data['next_action'] === 'HANTAR') $updates += ['submitted_at' => $now, 'submitted_by' => $request->user()->id]; if ($data['next_action'] === 'MULA_SEMAK') $updates += ['review_started_at' => $now, 'review_started_by' => $request->user()->id]; if ($data['next_action'] === 'PEMBETULAN') $updates += ['correction_requested_at' => $now, 'correction_requested_by' => $request->user()->id, 'reviewer_note' => $data['note'] ?? null]; if ($data['next_action'] === 'SAH') $updates += ['verified_at' => $now, 'verified_by' => $request->user()->id]; DB::table('rph_weekly_submissions')->where('id', $submission->id)->update($updates); }
        DB::table('rph_weekly_reviews')->insert(['id' => (string) Str::uuid(), 'submission_id' => $submission->id, 'actor_id' => $request->user()->id, 'action' => $data['next_action'], 'comment' => $data['note'] ?? null, 'created_at' => $now]);
        return response()->json(['data' => DB::table('rph_weekly_submissions')->where('id', $submission->id)->first()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'], 'kod_sekolah' => ['required', 'string', 'max:40'], 'class_id' => ['nullable', 'uuid'], 'teacher_id' => ['nullable', 'uuid'], 'kod_subjek' => ['nullable', 'string', 'max:40'], 'tarikh' => ['required', 'date'], 'tajuk' => ['required', 'string'], 'standard_pembelajaran' => ['nullable', 'string'], 'objektif' => ['nullable', 'string'], 'aktiviti' => ['nullable', 'string'], 'bbm' => ['nullable', 'string'], 'pentaksiran' => ['nullable', 'string'], 'refleksi' => ['nullable', 'string'], 'ai_prompt' => ['nullable', 'string'], 'status' => ['required', 'in:DRAF,SEDIA,SELESAI'],
        ]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $id = $data['id'] ?? (string) Str::uuid(); unset($data['id']);
        $existing = DB::table('rph_records')->where('id', $id)->first();
        if ($existing) abort_unless($existing->kod_sekolah === $data['kod_sekolah'], 403);
        $data['updated_at'] = now(); if (!$existing) $data['created_at'] = now();
        DB::table('rph_records')->updateOrInsert(['id' => $id], $data);
        return response()->json(['data' => ['id' => $id]], $existing ? 200 : 201);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:DRAF,SEDIA,SELESAI']]);
        $record = DB::table('rph_records')->where('id', $id)->first(); abort_unless($record, 404);
        abort_unless($request->user()->canAccessSchool($record->kod_sekolah), 403);
        DB::table('rph_records')->where('id', $id)->update(['status' => $data['status'], 'updated_at' => now()]);
        return response()->json(['data' => ['id' => $id, 'status' => $data['status']]]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $record = DB::table('rph_records')->where('id', $id)->first(); abort_unless($record, 404);
        abort_unless($request->user()->canAccessSchool($record->kod_sekolah), 403);
        DB::table('rph_records')->where('id', $id)->delete();
        return response()->json(['ok' => true]);
    }
}
