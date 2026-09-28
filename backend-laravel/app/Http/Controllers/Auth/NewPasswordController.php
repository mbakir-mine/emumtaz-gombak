<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\View\View;

class NewPasswordController extends Controller
{
    public function apiStore(Request $request)
    {
        $data = $request->validate(['token' => ['required'], 'email' => ['required', 'email'], 'password' => ['required', 'confirmed', 'min:8']]);
        $status = Password::reset($data, function ($user, $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60), 'must_change_password' => false])->save();
            event(new PasswordReset($user));
        });
        return $status === Password::PASSWORD_RESET ? response()->json(['ok' => true]) : response()->json(['message' => __($status)], 422);
    }
    public function create(Request $request): View
    {
        return view('auth.reset-password', ['token' => $request->route('token'), 'email' => $request->email]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate(['token' => ['required'], 'email' => ['required', 'email'], 'password' => ['required', 'confirmed', 'min:12']]);
        $status = Password::reset($request->only('email', 'password', 'password_confirmation', 'token'), function ($user, $password): void {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60), 'must_change_password' => false])->save();
            event(new PasswordReset($user));
        });
        return $status === Password::PASSWORD_RESET ? redirect()->route('login')->with('status', 'Password berjaya ditetapkan.') : back()->withErrors(['email' => __($status)]);
    }
}
