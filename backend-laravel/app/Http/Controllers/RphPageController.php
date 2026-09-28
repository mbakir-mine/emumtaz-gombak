<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class RphPageController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $query = DB::table('rph_records')->where('status', '!=', 'DIBUANG')->latest('tarikh')->limit(200);
        if (! $user->roleIsAdministrative()) {
            $query->where('kod_sekolah', $user->kod_sekolah);
        }

        return view('rph.index', ['records' => $query->get()]);
    }
}
