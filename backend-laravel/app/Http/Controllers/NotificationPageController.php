<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class NotificationPageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $notifications = DB::table('user_notifications as n')->leftJoin('user_notification_reads as r', fn ($join) => $join->on('r.notification_id', '=', 'n.id')->where('r.user_id', $user->id))->select('n.*', DB::raw('r.read_at is not null as is_read'))->where(fn ($query) => $query->whereNull('n.kod_sekolah')->orWhere('n.kod_sekolah', $user->kod_sekolah))->latest('n.created_at')->limit(100)->get()->filter(function ($notification) use ($user): bool {
            $roles = json_decode((string) $notification->target_roles, true);
            return $user->role === 'OWNER' || !is_array($roles) || in_array($user->role, $roles, true);
        });
        return view('admin.notifications', compact('notifications'));
    }

    public function read(Request $request, string $id)
    {
        abort_unless(DB::table('user_notifications')->where('id', $id)->exists(), 404);
        DB::table('user_notification_reads')->upsert([['notification_id' => $id, 'user_id' => $request->user()->id, 'read_at' => now()]], ['notification_id', 'user_id'], ['read_at']);
        return redirect()->route('admin.notifications')->with('status', 'Notifikasi ditanda sebagai dibaca.');
    }
}
