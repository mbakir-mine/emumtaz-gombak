<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class ReportVerificationPageController extends Controller
{
    public function show(string $token): View
    {
        $verification = DB::table('report_verifications')->where('token', $token)->whereNull('revoked_at')->first();
        return view('reports.verify', ['verification' => $verification]);
    }
}
