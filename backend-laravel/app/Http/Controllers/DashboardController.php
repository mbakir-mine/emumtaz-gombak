<?php

namespace App\Http\Controllers;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function counts(): \Illuminate\Http\JsonResponse
    {
        $user = request()->user();
        $codes = null;
        if ($user->role === \App\Models\User::ZONE_ADMIN) $codes = School::query()->where('zon', $user->zon)->where('status', 'AKTIF')->pluck('kod_sekolah');
        elseif (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) $codes = collect([$user->kod_sekolah]);
        $scope = static fn ($query) => $codes === null ? $query : $query->whereIn('kod_sekolah', $codes);
        $schools = $scope(School::query()->where('status', 'AKTIF'))->get(['kod_sekolah', 'kategori']);
        $students = $scope(Student::query()->where('status', 'AKTIF'))->get(['jantina']);
        $classes = $scope(SchoolClass::query()->where('status', 'AKTIF'))->get(['tahun']);
        $categories = $schools->groupBy('kategori')->map->count();
        $years = $classes->groupBy('tahun')->map->count();
        return response()->json(['data' => ['schools' => $schools->count(), 'users' => DB::table('users')->count(), 'subjects' => DB::table('subjects')->where('status', 'AKTIF')->count(), 'exams' => DB::table('exams')->count(), 'classes' => $classes->count(), 'students' => $students->count(), 'marks' => $scope(DB::table('marks'))->count(), 'schoolCategories' => $categories, 'studentGender' => ['lelaki' => $students->where('jantina', 'L')->count(), 'perempuan' => $students->where('jantina', 'P')->count()], 'classesByYear' => $years]]);
    }

    public function __invoke(): View
    {
        $user = request()->user();
        $schoolCodes = null;
        if ($user->role === \App\Models\User::ZONE_ADMIN) {
            $schoolCodes = School::query()->where('zon', $user->zon)->where('status', 'AKTIF')->pluck('kod_sekolah');
        } elseif (! in_array($user->role, [\App\Models\User::OWNER, \App\Models\User::DISTRICT_ADMIN], true)) {
            $schoolCodes = collect([$user->kod_sekolah]);
        }

        $scope = static function ($query) use ($schoolCodes) {
            return $schoolCodes === null ? $query : $query->whereIn('kod_sekolah', $schoolCodes);
        };
        return view('dashboard', [
            'stats' => [
                'schools' => $scope(School::query()->where('status', 'AKTIF'))->count(),
                'classes' => $scope(SchoolClass::query()->where('status', 'AKTIF'))->count(),
                'students' => $scope(Student::query()->where('status', 'AKTIF'))->count(),
                'marks' => $scope(DB::table('marks'))->count(),
            ],
        ]);
    }
}
