@extends('layouts.app')

@section('title', 'Profil — e-Mumtaz')

@section('content')
    <div class="page-heading"><div><p class="eyebrow">Akaun pengguna</p><h1>Profil saya</h1><p class="muted">Semak maklumat akaun dan keselamatan akses anda.</p></div><a class="button button-primary" href="{{ route('password.change') }}">Tukar kata laluan</a></div>
    <section class="content-card"><dl class="profile-details"><div><dt>Nama</dt><dd>{{ $user->name }}</dd></div><div><dt>Email</dt><dd>{{ $user->email }}</dd></div><div><dt>Peranan</dt><dd>{{ $user->role }}</dd></div><div><dt>Status</dt><dd>{{ $user->status }}</dd></div><div><dt>Kod sekolah</dt><dd>{{ $user->kod_sekolah ?: '—' }}</dd></div><div><dt>Zon</dt><dd>{{ $user->zon ?: '—' }}</dd></div></dl></section>
@endsection
