<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;

class ProfilePageController extends Controller
{
    public function index(Request $request): View
    {
        return view('profile.index', ['user' => $request->user()]);
    }
}
