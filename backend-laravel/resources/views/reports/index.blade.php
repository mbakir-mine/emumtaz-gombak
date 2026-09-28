@extends('layouts.app')

@section('title', 'Laporan & Analisis — e-Mumtaz')

@section('content')
    <div class="page-heading">
        <div>
            <p class="eyebrow">Laporan dan analisis</p>
            <h1>Laporan</h1>
            <p class="muted">Pilih laporan untuk melihat prestasi berdasarkan sekolah, kelas, murid atau subjek.</p>
        </div>
    </div>

    <section class="stats-grid" aria-label="Ringkasan laporan">
        <article class="stat-card"><span>Sekolah dalam skop</span><strong>{{ number_format($schoolCount) }}</strong><small>Sekolah aktif</small></article>
        <article class="stat-card"><span>Murid aktif</span><strong>{{ number_format($studentCount) }}</strong><small>Rekod semasa</small></article>
        <article class="stat-card stat-card-accent"><span>Markah direkodkan</span><strong>{{ number_format($markCount) }}</strong><small>Semua peperiksaan</small></article>
    </section>

    <section class="content-card">
        <p class="eyebrow">Jenis laporan</p>
        <h2>Laporan akademik</h2>
        <div class="quick-link-grid report-grid">
            <a href="{{ url('/api/reports/schools') }}"><strong>Ringkasan sekolah</strong><span>Perbandingan pencapaian dan purata setiap sekolah.</span></a>
            <a href="{{ url('/api/reports/subjects') }}"><strong>Ringkasan subjek</strong><span>Analisis markah mengikut mata pelajaran.</span></a>
            <a href="{{ url('/api/reports/individual') }}"><strong>Laporan individu</strong><span>Semak pencapaian setiap murid.</span></a>
            <a href="{{ route('admin.assessments.psra') }}"><strong>Laporan PSRA</strong><span>Masuk ke pengurusan dan laporan percubaan PSRA.</span></a>
            <a href="{{ route('admin.assessments.upkk') }}"><strong>Laporan UPKK</strong><span>Masuk ke pengurusan dan laporan percubaan UPKK.</span></a>
            <a href="{{ route('report.verify', ['token' => 'demo']) }}"><strong>Pengesahan laporan</strong><span>Semak laporan menggunakan nombor rujukan awam.</span></a>
        </div>
    </section>

    <section class="content-card">
        <p class="eyebrow">Peperiksaan tersedia</p>
        @if($exams->isEmpty())
            <p class="muted">Belum ada peperiksaan aktif.</p>
        @else
            <table><thead><tr><th>Kod</th><th>Peperiksaan</th><th>Tahun akademik</th><th>Status</th></tr></thead><tbody>
                @foreach($exams as $exam)
                    <tr><td>{{ $exam->kod_peperiksaan }}</td><td>{{ $exam->nama_peperiksaan }}</td><td>{{ $exam->tahun_akademik }}</td><td>{{ $exam->status }}</td></tr>
                @endforeach
            </tbody></table>
        @endif
    </section>
@endsection
