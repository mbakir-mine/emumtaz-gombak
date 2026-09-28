<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TimetableController extends Controller
{
    public function slots(Request $request): JsonResponse
    {
        $query = DB::table('timetable_slots')->where('status', 'AKTIF')->orderBy('kod_sekolah')->orderBy('susunan')->orderBy('waktu_mula');
        if (! in_array($request->user()->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function entries(Request $request): JsonResponse
    {
        $query = DB::table('timetable_entries')->where('status', 'AKTIF')->orderBy('kod_sekolah');
        if (! in_array($request->user()->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function requirements(Request $request): JsonResponse
    {
        $query = DB::table('timetable_requirements')->where('status', 'AKTIF')->orderBy('kod_sekolah')->orderBy('class_id');
        if (! in_array($request->user()->role, ['OWNER', 'ADMIN_DAERAH'], true)) $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function generateAuto(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'tahun_akademik' => ['required', 'integer', 'between:2000,2100']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $classes = DB::table('classes')->where(['kod_sekolah' => $data['kod_sekolah'], 'tahun_akademik' => $data['tahun_akademik'], 'status' => 'AKTIF'])->orderBy('tahun')->orderBy('nama_kelas')->get(['id']);
        $slots = DB::table('timetable_slots')->where(['kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->where('label', 'not like', '%REHAT%')->orderBy('susunan')->get(['id']);
        abort_if($classes->isEmpty() || $slots->isEmpty(), 422, 'Kelas atau slot mengajar belum tersedia.');
        $requirements = DB::table('timetable_requirements')->where(['kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->whereIn('class_id', $classes->pluck('id'))->where('bil_slot_seminggu', '>', 0)->get();
        abort_if($requirements->isEmpty(), 422, 'Belum ada tetapan subjek kelas.');
        $usedClass = []; $usedTeacher = []; $rows = [];
        foreach ($requirements as $requirement) {
            $placed = 0;
            foreach ($slots as $slot) {
                $classKey = $requirement->class_id.'|'.$slot->id; $teacherKey = ($requirement->teacher_id ?? '').'|'.$slot->id;
                if (isset($usedClass[$classKey]) || ($requirement->teacher_id && isset($usedTeacher[$teacherKey]))) continue;
                $usedClass[$classKey] = true; if ($requirement->teacher_id) $usedTeacher[$teacherKey] = true;
                $rows[] = ['id' => (string) Str::uuid(), 'slot_id' => $slot->id, 'class_id' => $requirement->class_id, 'kod_sekolah' => $data['kod_sekolah'], 'kod_subjek' => $requirement->kod_subjek, 'kod_komponen' => $requirement->kod_komponen, 'assignment_label' => $requirement->assignment_label, 'nama_paparan' => $requirement->nama_paparan, 'teacher_id' => $requirement->teacher_id, 'bilik' => null, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()];
                if (++$placed >= (int) $requirement->bil_slot_seminggu) break;
            }
        }
        DB::transaction(function () use ($data, $classes, $rows): void { DB::table('timetable_entries')->where(['kod_sekolah' => $data['kod_sekolah']])->whereIn('class_id', $classes->pluck('id'))->delete(); if ($rows) DB::table('timetable_entries')->insert($rows); });
        return response()->json(['ok' => true, 'entries' => count($rows)]);
    }

    public function saveEntry(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'class_id' => ['required', 'uuid', 'exists:classes,id'], 'slot_id' => ['required', 'uuid', 'exists:timetable_slots,id'], 'kod_subjek' => ['required', 'string', 'max:64'], 'kod_komponen' => ['nullable', 'string', 'max:64'], 'assignment_label' => ['nullable', 'string', 'max:120'], 'nama_paparan' => ['nullable', 'string', 'max:180'], 'teacher_id' => ['nullable', 'uuid', 'exists:users,id'], 'bilik' => ['nullable', 'string', 'max:80']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $class = DB::table('classes')->where(['id' => $data['class_id'], 'kod_sekolah' => $data['kod_sekolah']])->exists();
        abort_unless($class, 422, 'Kelas tidak sepadan dengan sekolah.');
        $id = DB::table('timetable_entries')->where(['slot_id' => $data['slot_id'], 'class_id' => $data['class_id']])->value('id') ?: (string) Str::uuid();
        DB::table('timetable_entries')->updateOrInsert(['slot_id' => $data['slot_id'], 'class_id' => $data['class_id']], ['id' => $id, ...$data, 'status' => 'AKTIF', 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['ok' => true, 'id' => $id]);
    }

    public function generateSlots(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
        $slots = [['07:30','08:00','Masa 1'],['08:00','08:30','Masa 2'],['08:30','09:00','Masa 3'],['09:00','09:30','Masa 4'],['09:30','10:00','Masa 5'],['10:00','10:30','Rehat'],['10:30','11:00','Masa 6'],['11:00','11:30','Masa 7'],['11:30','12:00','Masa 8'],['12:00','12:30','Masa 9']];
        $count = 0;
        foreach ($days as $day) foreach ($slots as $index => [$start, $end, $label]) {
            $exists = DB::table('timetable_slots')->where(['kod_sekolah' => $data['kod_sekolah'], 'hari' => $day, 'waktu_mula' => $start, 'waktu_tamat' => $end])->exists();
            if (!$exists) { DB::table('timetable_slots')->insert(['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'hari' => $day, 'waktu_mula' => $start, 'waktu_tamat' => $end, 'label' => $label, 'susunan' => $index + 1, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]); $count++; }
        }
        return response()->json(['data' => ['created' => $count]]);
    }

    public function updateSlots(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'rows' => ['required', 'array', 'min:1'], 'rows.*.susunan' => ['required', 'integer', 'min:1'], 'rows.*.label' => ['required', 'string', 'max:80'], 'rows.*.waktu_mula' => ['required', 'date_format:H:i'], 'rows.*.waktu_tamat' => ['required', 'date_format:H:i']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        foreach ($data['rows'] as $row) DB::table('timetable_slots')->where(['kod_sekolah' => $data['kod_sekolah'], 'susunan' => $row['susunan'], 'status' => 'AKTIF'])->update(['label' => $row['label'], 'waktu_mula' => $row['waktu_mula'], 'waktu_tamat' => $row['waktu_tamat'], 'updated_at' => now()]);
        return response()->json(['ok' => true]);
    }

    public function addSlot(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40']]); abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $last = DB::table('timetable_slots')->where(['kod_sekolah' => $data['kod_sekolah'], 'status' => 'AKTIF'])->orderByDesc('susunan')->first();
        $order = ($last->susunan ?? 0) + 1; $start = $last?->waktu_tamat ?? '07:30'; [$h, $m] = array_map('intval', explode(':', substr($start, 0, 5))); $end = sprintf('%02d:%02d', intdiv($h * 60 + $m + 30, 60), ($h * 60 + $m + 30) % 60);
        foreach (['ISNIN','SELASA','RABU','KHAMIS','JUMAAT'] as $day) DB::table('timetable_slots')->insert(['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'hari' => $day, 'waktu_mula' => $start, 'waktu_tamat' => $end, 'label' => 'Masa '.$order, 'susunan' => $order, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['ok' => true, 'susunan' => $order]);
    }

    public function deleteSlot(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'susunan' => ['required', 'integer', 'min:1']]); abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        DB::table('timetable_slots')->where(['kod_sekolah' => $data['kod_sekolah'], 'susunan' => $data['susunan']])->update(['status' => 'DIBUANG', 'updated_at' => now()]); return response()->json(['ok' => true]);
    }

    public function saveRequirement(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'class_id' => ['required', 'uuid'], 'kod_subjek' => ['required', 'string', 'max:40'], 'kod_komponen' => ['nullable', 'string', 'max:40'], 'assignment_label' => ['nullable', 'string', 'max:120'], 'nama_paparan' => ['nullable', 'string', 'max:180'], 'teacher_id' => ['required', 'uuid'], 'bil_slot_seminggu' => ['required', 'integer', 'between:1,40'], 'boleh_gabung' => ['boolean']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        $id = DB::table('timetable_requirements')->where(['class_id' => $data['class_id'], 'kod_subjek' => $data['kod_subjek']])->value('id') ?? (string) Str::uuid();
        DB::table('timetable_requirements')->updateOrInsert(['id' => $id], [...$data, 'status' => 'AKTIF', 'updated_at' => now(), 'created_at' => now()]);
        return response()->json(['data' => ['id' => $id]]);
    }

    public function saveRequirements(Request $request): JsonResponse
    {
        $data = $request->validate(['kod_sekolah' => ['required', 'string', 'max:40'], 'class_id' => ['required', 'uuid'], 'rows' => ['array'], 'rows.*.kod_subjek' => ['required', 'string', 'max:40'], 'rows.*.kod_komponen' => ['nullable', 'string', 'max:40'], 'rows.*.assignment_label' => ['nullable', 'string', 'max:120'], 'rows.*.nama_paparan' => ['nullable', 'string', 'max:180'], 'rows.*.teacher_id' => ['required', 'uuid'], 'rows.*.bil_slot_seminggu' => ['required', 'integer', 'between:1,40'], 'rows.*.boleh_gabung' => ['boolean']]);
        abort_unless($request->user()->canAccessSchool($data['kod_sekolah']), 403);
        DB::table('timetable_requirements')->where(['kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id']])->update(['status' => 'DIBUANG', 'updated_at' => now()]);
        foreach ($data['rows'] ?? [] as $row) DB::table('timetable_requirements')->insert(['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'class_id' => $data['class_id'], ...$row, 'status' => 'AKTIF', 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['ok' => true]);
    }
}
