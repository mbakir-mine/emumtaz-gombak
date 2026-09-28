@extends('layouts.app')

@section('title', 'Dashboard — e-Mumtaz')

@section('content')
    <div class="page-heading">
        <div>
            <p class="eyebrow">Ringkasan sistem</p>
            <h1>Dashboard</h1>
            <p class="muted">Selamat datang, {{ auth()->user()->name }}. Berikut ialah ringkasan data yang berada dalam skop akses anda.</p>
        </div>
        <a class="button button-primary" href="{{ route('admin.schools') }}">Urus sekolah</a>
    </div>

    <section class="dashboard-hero" aria-label="Ringkasan akses">
        <div>
            <p class="eyebrow">e-Mumtaz</p>
            <h2>Pengurusan sekolah yang lebih tersusun</h2>
            <p>Semak sekolah, kelas, murid dan pemarkahan daripada satu tempat.</p>
        </div>
        <div class="hero-badge">
            <span>Peranan aktif</span>
            <strong>{{ str_replace('_', ' ', strtoupper(auth()->user()->role)) }}</strong>
        </div>
    </section>

    <section class="stats-grid" aria-label="Statistik utama">
        <article class="stat-card"><span>Jumlah sekolah</span><strong>{{ number_format($stats['schools']) }}</strong><small>Sekolah aktif</small></article>
        <article class="stat-card"><span>Jumlah kelas</span><strong>{{ number_format($stats['classes']) }}</strong><small>Kelas aktif</small></article>
        <article class="stat-card"><span>Jumlah murid</span><strong>{{ number_format($stats['students']) }}</strong><small>Murid aktif</small></article>
        <article class="stat-card stat-card-accent"><span>Rekod markah</span><strong>{{ number_format($stats['marks']) }}</strong><small>Markah tersimpan</small></article>
    </section>

    <section class="content-card quick-links">
        <div>
            <p class="eyebrow">Akses pantas</p>
            <h2>Terus ke modul utama</h2>
        </div>
        <div class="quick-link-grid">
            <a href="{{ route('admin.schools') }}"><strong>Sekolah</strong><span>Urus maklumat sekolah</span></a>
            <a href="{{ route('admin.classes') }}"><strong>Kelas</strong><span>Urus kelas dan tahun</span></a>
            <a href="{{ route('admin.students') }}"><strong>Murid</strong><span>Semak rekod murid</span></a>
            <a href="{{ route('admin.assessments.psra') }}"><strong>Pemarkahan</strong><span>Masukkan dan semak markah</span></a>
        </div>
    </section>
@endsection
