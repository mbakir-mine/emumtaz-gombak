@extends('layouts.app')
@section('title','Dashboard — e-Mumtaz')
@section('content')
        <h1>Dashboard e-Mumtaz</h1>
        <p>Selamat datang, {{ auth()->user()->name }}.</p>
        <p>Peranan: {{ auth()->user()->role }}</p>
        <section class="stats">
            <h2>Ringkasan</h2>
            <div class="card stat"><span>Sekolah</span><strong>{{ $stats['schools'] }}</strong></div>
            <div class="card stat"><span>Kelas</span><strong>{{ $stats['classes'] }}</strong></div>
            <div class="card stat"><span>Murid</span><strong>{{ $stats['students'] }}</strong></div>
            <div class="card stat"><span>Markah</span><strong>{{ $stats['marks'] }}</strong></div>
        </section>
@endsection
