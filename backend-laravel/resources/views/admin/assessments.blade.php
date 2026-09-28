@extends('layouts.app')
@section('title',$title.' — e-Mumtaz')
@section('content')
<h1>{{ $title }}</h1><p class="muted">Input markah per kertas melalui backend self-hosted Laravel.</p>
<div class="card"><form method="POST" action="{{ $kind === 'psra' ? route('admin.assessments.psra.store') : route('admin.assessments.upkk.store') }}">@csrf
<label>Sekolah <input name="kod_sekolah" placeholder="Kod sekolah" required></label>
<label>Tahun akademik <input name="tahun_akademik" type="number" value="{{ date('Y') }}" required></label>
<label>Kelas <select name="class_id" required><option value="">Pilih kelas</option>@foreach($classes as $class)<option value="{{ $class->id }}">{{ $class->kod_sekolah }} — {{ $class->nama_kelas }}</option>@endforeach</select></label>
<label>Murid <select name="student_id" required><option value="">Pilih murid</option>@foreach($students as $student)<option value="{{ $student->id }}">{{ $student->nama }} — {{ $student->mykid }}</option>@endforeach</select></label>
@if($kind === 'psra')<label>Sesi <select name="sesi"><option>1</option><option>2</option></select></label>@endif
<label>Kertas <select name="paper_code" required>@foreach($papers as $paper)<option>{{ $paper }}</option>@endforeach</select></label>
<label>Markah <input name="markah" type="number" min="0" max="100" step="1" required></label><button>Simpan markah</button></form></div>
@endsection
