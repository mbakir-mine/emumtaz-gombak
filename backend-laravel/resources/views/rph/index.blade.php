@extends('layouts.app')

@section('title', 'RPH — e-Mumtaz')

@section('content')
    <div class="page-heading"><div><p class="eyebrow">Pengajaran dan pembelajaran</p><h1>Rancangan Pengajaran Harian</h1><p class="muted">Semak rekod RPH mengikut sekolah dan tarikh.</p></div></div>
    <section class="content-card"><p class="eyebrow">Rekod RPH</p><h2>Senarai terkini</h2><table><thead><tr><th>Tarikh</th><th>Tajuk</th><th>Sekolah</th><th>Status</th></tr></thead><tbody>@forelse($records as $record)<tr><td>{{ $record->tarikh }}</td><td>{{ $record->tajuk }}</td><td>{{ $record->kod_sekolah }}</td><td>{{ $record->status }}</td></tr>@empty<tr><td colspan="4">Tiada rekod RPH.</td></tr>@endforelse</tbody></table></section>
    <section class="content-card"><p class="muted">Borang RPH dan aliran hantar/semak menggunakan API Laravel yang sama di <code>/api/rph</code> dan <code>/api/rph/weekly/transition</code>.</p></section>
@endsection
