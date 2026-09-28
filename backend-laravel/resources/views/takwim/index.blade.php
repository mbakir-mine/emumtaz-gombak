@extends('layouts.app')

@section('title', 'Takwim — e-Mumtaz')

@section('content')
    <div class="page-heading"><div><p class="eyebrow">Pengurusan akademik</p><h1>Takwim</h1><p class="muted">Urus acara sekolah dan tarikh penting akademik.</p></div></div>
    <section class="content-card">
        <p class="eyebrow">Tambah acara</p><h2>Acara baharu</h2>
        <form method="POST" action="{{ route('takwim.store') }}" class="form-grid">
            @csrf
            <label>Tahun akademik<input type="number" name="tahun_akademik" value="{{ old('tahun_akademik', date('Y')) }}" required></label>
            <label>Sekolah<select name="kod_sekolah"><option value="">Semua sekolah / daerah</option>@foreach($schools as $school)<option value="{{ $school->kod_sekolah }}">{{ $school->kod_sekolah }} — {{ $school->nama_sekolah }}</option>@endforeach</select></label>
            <label>Kategori<input name="kategori" value="{{ old('kategori', 'AKADEMIK') }}" required></label>
            <label>Tajuk<input name="tajuk" value="{{ old('tajuk') }}" required></label>
            <label>Tarikh mula<input type="date" name="tarikh_mula" value="{{ old('tarikh_mula') }}" required></label>
            <label>Tarikh tamat<input type="date" name="tarikh_tamat" value="{{ old('tarikh_tamat') }}" required></label>
            <label class="full">Keterangan<textarea name="keterangan" rows="3">{{ old('keterangan') }}</textarea></label>
            <button type="submit">Simpan acara</button>
        </form>
        @error('tarikh_tamat')<p class="error">{{ $message }}</p>@enderror
        @error('tajuk')<p class="error">{{ $message }}</p>@enderror
    </section>
    <section class="content-card"><p class="eyebrow">Senarai acara</p><h2>Acara aktif</h2><table><thead><tr><th>Tarikh</th><th>Tajuk</th><th>Kategori</th><th>Sekolah</th></tr></thead><tbody>@forelse($events as $event)<tr><td>{{ $event->tarikh_mula }} — {{ $event->tarikh_tamat }}</td><td>{{ $event->tajuk }}</td><td>{{ $event->kategori }}</td><td>{{ $event->kod_sekolah ?: 'Daerah' }}</td></tr>@empty<tr><td colspan="4">Tiada acara aktif.</td></tr>@endforelse</tbody></table></section>
@endsection
