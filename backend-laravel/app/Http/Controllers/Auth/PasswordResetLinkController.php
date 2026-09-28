<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\View\View;

class PasswordResetLinkController extends Controller
{
    public function apiStore(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink(['email' => strtolower($request->input('email'))]);
        return response()->json(['ok' => true, 'message' => 'Jika email tersebut berdaftar, pautan reset telah dihantar.']);
    }
    public function create(): View
    {
        return view('auth.forgot-password');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink(['email' => strtolower($request->input('email'))]);
        return back()->with('status', 'Jika email tersebut berdaftar, pautan reset telah dihantar.');
    }
}
