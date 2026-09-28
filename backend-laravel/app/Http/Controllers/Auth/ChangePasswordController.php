<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class ChangePasswordController extends Controller
{
    public function apiStore(Request $request)
    {
        $data = $request->validate(['current_password' => ['required', 'string'], 'password' => ['required', 'string', 'min:8', 'confirmed']]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) return response()->json(['message' => 'Password semasa tidak sah.'], 422);
        $user->forceFill(['password' => $data['password'], 'must_change_password' => false])->save();
        return response()->json(['ok' => true]);
    }
    public function create(): View
    {
        return view('auth.change-password');
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate(['current_password' => ['required', 'string'], 'password' => ['required', 'string', 'min:8', 'confirmed']]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Password semasa tidak sah.']);
        }
        $user->forceFill(['password' => $data['password'], 'must_change_password' => false])->save();
        return redirect('/dashboard')->with('status', 'Password berjaya dikemaskini.');
    }
}
