@extends('layouts.app')
@section('title','Kelas — e-Mumtaz')
@section('content')<h1>Kelas</h1>@include('admin._class-form')<div class="card"><table><thead><tr><th>Sekolah</th><th>Tahun akademik</th><th>Tahun</th><th>Nama kelas</th><th>Status</th></tr></thead><tbody>@forelse($classes as $class)<tr><td>{{ $class->kod_sekolah }}</td><td>{{ $class->tahun_akademik }}</td><td>{{ $class->tahun }}</td><td>{{ $class->nama_kelas }}</td><td>{{ $class->status }}</td></tr>@empty<tr><td colspan="5">Tiada rekod.</td></tr>@endforelse</tbody></table></div>@endsection
