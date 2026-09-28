<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ChangePasswordController;
use App\Http\Controllers\UserAdminController;
use Illuminate\Support\Facades\Route;

Route::middleware('web')->group(function (): void {
    Route::post('/auth/login', [AuthenticatedSessionController::class, 'apiLogin'])->name('api.auth.login');
    Route::get('/auth/session', [AuthenticatedSessionController::class, 'apiSession'])->name('api.auth.session');
    Route::post('/auth/logout', [AuthenticatedSessionController::class, 'apiLogout'])->name('api.auth.logout');
    Route::post('/auth/change-password', [ChangePasswordController::class, 'apiStore'])->middleware('auth');
    Route::post('/auth/profile', [AuthenticatedSessionController::class, 'apiProfile'])->middleware('auth');
    Route::middleware('auth')->group(function (): void {
        Route::get('/admin/users', [UserAdminController::class, 'apiIndex']);
        Route::post('/admin/users', [UserAdminController::class, 'apiCreate']);
        Route::patch('/admin/users/{userId}/status', [UserAdminController::class, 'apiStatus']);
        Route::patch('/admin/users/{userId}', [UserAdminController::class, 'apiUpdate']);
        Route::post('/admin/users/{userId}/activate', [UserAdminController::class, 'apiActivate']);
        Route::post('/admin/users/{userId}/reset-password', [UserAdminController::class, 'apiResetPassword']);
        Route::delete('/admin/users/{userId}', [UserAdminController::class, 'apiDelete']);
    });
});
