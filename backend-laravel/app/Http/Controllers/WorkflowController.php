<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WorkflowController extends Controller
{
    public function securityLogs(Request $request): JsonResponse
    {
        abort_unless($request->user()->roleIsAdministrative(), 403);
        $limit = min(max((int) $request->integer('limit', 200), 1), 500);
        return response()->json(['data' => DB::table('security_audit_logs')->latest('created_at')->limit($limit)->get()]);
    }

    public function activityLogs(Request $request): JsonResponse
    {
        abort_unless($request->user()->roleIsAdministrative(), 403);
        $limit = min(max((int) $request->integer('limit', 200), 1), 500);
        return response()->json(['data' => DB::table('auth_activity_logs')->latest('created_at')->limit($limit)->get()]);
    }

    public function loginFailureLogs(Request $request): JsonResponse
    {
        abort_unless($request->user()->roleIsAdministrative(), 403);
        $limit = min(max((int) $request->integer('limit', 200), 1), 500);
        return response()->json(['data' => DB::table('auth_login_failure_logs')->latest('created_at')->limit($limit)->get()]);
    }

    public function markWorkflows(Request $request): JsonResponse
    {
        $query = DB::table('mark_submission_workflows')->latest('updated_at')->limit(1000);
        if (! $request->user()->roleIsAdministrative()) $query->where('kod_sekolah', $request->user()->kod_sekolah);
        return response()->json(['data' => $query->get()]);
    }

    public function auditExport(Request $request)
    {
        abort_unless($request->user()->role === \App\Models\User::OWNER, 403);
        $rows = [['jenis','masa','tindakan','email_pelaku','peranan','kod_sekolah','jadual','id_rekod']];
        foreach (DB::table('auth_activity_logs')->latest('created_at')->limit(500)->get() as $row) $rows[] = ['SESI', $row->created_at, $row->event_type, $row->actor_email, $row->actor_role, $row->kod_sekolah, '', ''];
        foreach (DB::table('auth_login_failure_logs')->latest('created_at')->limit(500)->get() as $row) $rows[] = ['SESI', $row->created_at, 'LOGIN_FAILED', 'HASH:'.substr((string) $row->identifier_hash, 0, 12), $row->device_family, '', '', ''];
        foreach (DB::table('security_audit_logs')->latest('created_at')->limit(500)->get() as $row) $rows[] = ['DATA', $row->created_at, $row->action, $row->actor_email ?? '', '', $row->kod_sekolah ?? '', $row->table_name ?? '', $row->record_id ?? ''];
        $csv = implode("\r\n", array_map(fn ($row) => implode(',', array_map(fn ($value) => '"'.str_replace('"', '""', (string) $value).'"', $row)), $rows))."\r\n";
        return response($csv, 200, ['Content-Type' => 'text/csv; charset=utf-8', 'Content-Disposition' => 'attachment; filename="audit-emumtaz-'.now()->format('Y-m-d').'.csv"', 'Cache-Control' => 'private, no-store']);
    }

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = DB::table('user_notifications as n')
            ->leftJoin('user_notification_reads as r', fn ($join) => $join->on('r.notification_id', '=', 'n.id')->where('r.user_id', $user->id))
            ->select('n.*', DB::raw('r.read_at is not null as is_read'))
            ->latest('n.created_at')->limit(50);
        if (! $user->roleIsAdministrative()) {
            $query->where(fn ($scope) => $scope->whereNull('n.kod_sekolah')->orWhere('n.kod_sekolah', $user->kod_sekolah));
        }
        return response()->json(['data' => $query->get()]);
    }

    public function markNotificationRead(Request $request, string $notificationId): JsonResponse
    {
        $user = $request->user();
        $notification = DB::table('user_notifications')->where('id', $notificationId)->first();
        abort_unless($notification, 404, 'Notifikasi tidak ditemui.');
        abort_unless($user->roleIsAdministrative() || ! $notification->kod_sekolah || $notification->kod_sekolah === $user->kod_sekolah, 403);
        DB::table('user_notification_reads')->upsert([['notification_id' => $notificationId, 'user_id' => $user->id, 'read_at' => now()]], ['notification_id', 'user_id'], ['read_at']);
        return response()->json(['ok' => true]);
    }

    public function transitionMarkWorkflow(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kod_sekolah' => ['required', 'string', 'max:40'], 'exam_id' => ['required', 'uuid', 'exists:exams,id'],
            'class_id' => ['required', 'uuid', 'exists:classes,id'], 'kod_subjek' => ['required', 'string', 'max:40'],
            'status' => ['required', 'in:DRAF,DIHANTAR,DISAHKAN,DIKUNCI,PEMBETULAN'], 'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        $user = $request->user();
        abort_unless($user->canAccessSchool($data['kod_sekolah']), 403);
        abort_unless(in_array($data['status'], ['DRAF', 'DIHANTAR'], true) || $user->roleIsAdministrative(), 403, 'Hanya pentadbir boleh mengesahkan atau mengunci markah.');
        abort_unless(DB::table('classes')->where('id', $data['class_id'])->where('kod_sekolah', $data['kod_sekolah'])->exists(), 422, 'Kelas tidak sepadan dengan sekolah.');
        $existing = DB::table('mark_submission_workflows')->where(['kod_sekolah' => $data['kod_sekolah'], 'exam_id' => $data['exam_id'], 'class_id' => $data['class_id'], 'kod_subjek' => $data['kod_subjek']])->first();
        $now = now();
        $id = $existing?->id ?? (string) Str::uuid();
        $payload = ['id' => $id, ...$data, 'updated_by' => $user->id, 'updated_at' => $now];
        if (! $existing) $payload['created_at'] = $now;
        DB::table('mark_submission_workflows')->upsert([$payload], ['id'], array_keys($payload));
        if (in_array($data['status'], ['DIHANTAR', 'DISAHKAN', 'DIKUNCI', 'PEMBETULAN'], true)) {
            DB::table('user_notifications')->insert(['id' => (string) Str::uuid(), 'kod_sekolah' => $data['kod_sekolah'], 'target_roles' => json_encode(['OWNER', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK']), 'type' => 'MARK_'.$data['status'], 'title' => 'Status markah dikemas kini', 'message' => 'Status markah untuk '.$data['kod_subjek'].' telah ditukar kepada '.$data['status'].'.', 'link' => '/pengesahan-markah', 'created_at' => $now, 'updated_at' => $now]);
        }
        return response()->json(['data' => DB::table('mark_submission_workflows')->where('id', $id)->first()], 201);
    }

    public function issueReportVerification(Request $request): JsonResponse
    {
        $data = $request->validate(['report_type' => ['required', 'string', 'min:2', 'max:80'], 'scope_label' => ['required', 'string', 'min:2', 'max:240'], 'snapshot_hash' => ['required', 'regex:/^[a-f0-9]{64}$/']]);
        $user = $request->user();
        $record = ['id' => (string) Str::uuid(), 'token' => (string) Str::uuid(), 'reference_number' => 'EMTZ-'.now()->format('Ymd').'-'.strtoupper(Str::random(10)), ...$data, 'kod_sekolah' => $user->kod_sekolah, 'issued_by' => $user->id, 'issued_at' => now()];
        DB::table('report_verifications')->insert($record);
        return response()->json(['data' => $record], 201);
    }

    public function verifyReport(string $token): JsonResponse
    {
        $record = DB::table('report_verifications')->where('token', $token)->whereNull('revoked_at')->first();
        abort_unless($record, 404, 'Laporan tidak sah atau telah dibatalkan.');
        return response()->json(['valid' => true, 'data' => $record]);
    }
}
