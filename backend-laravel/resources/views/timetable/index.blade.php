@extends('layouts.app')

@section('title', 'Jadual Waktu — e-Mumtaz')

@section('content')
    <div class="page-heading"><div><p class="eyebrow">Pengurusan akademik</p><h1>Jadual waktu</h1><p class="muted">Sediakan slot waktu dan pantau entri jadual sekolah.</p></div></div>
    <section class="content-card"><form method="GET" action="{{ route('timetable.index') }}" class="form-grid"><label>Sekolah<select name="kod_sekolah" onchange="this.form.submit()">@foreach($schools as $item)<option value="{{ $item->kod_sekolah }}" @selected($school === $item->kod_sekolah)>{{ $item->kod_sekolah }} — {{ $item->nama_sekolah }}</option>@endforeach</select></label><div><p class="muted">Entri jadual aktif: <strong>{{ $entries }}</strong></p><button type="submit" formaction="{{ route('timetable.generate') }}" formmethod="POST">Jana slot standard</button>@csrf</div></form></section>
    <section class="content-card"><p class="eyebrow">Slot waktu</p><h2>{{ $school ?: 'Tiada sekolah' }}</h2><table><thead><tr><th>Hari</th><th>Susunan</th><th>Label</th><th>Masa</th></tr></thead><tbody>@forelse($slots as $slot)<tr><td>{{ $slot->hari }}</td><td>{{ $slot->susunan }}</td><td>{{ $slot->label }}</td><td>{{ substr($slot->waktu_mula, 0, 5) }} — {{ substr($slot->waktu_tamat, 0, 5) }}</td></tr>@empty<tr><td colspan="4">Belum ada slot. Klik “Jana slot standard”.</td></tr>@endforelse</tbody></table></section>
@endsection
