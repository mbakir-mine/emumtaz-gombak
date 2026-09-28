<!doctype html>
<html lang="ms">
<head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'e-Mumtaz')</title>
    <style>
        :root{--ink:#073c32;--green:#0d6b55;--mint:#edf7f2;--gold:#f2c23e;--line:#d8e8e1}
        *{box-sizing:border-box}body{font-family:Inter,system-ui,sans-serif;background:#f3f8f5;color:var(--ink);margin:0}
        .shell{display:flex;min-height:100vh}.sidebar{width:235px;background:linear-gradient(180deg,#063a31,#052b25);color:#e8fff5;padding:22px 12px;flex:0 0 235px}
        .brand{display:flex;align-items:center;gap:10px;padding:0 10px 22px;border-bottom:1px solid #ffffff1c;font-weight:800}.brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--gold);color:#173c31;font-size:14px}
        .menu{margin-top:18px}.menu-section{margin:18px 10px 8px;color:#86d9bc;text-transform:uppercase;font-size:10px;letter-spacing:.12em;font-weight:800}.menu a{display:block;color:#eafff7;text-decoration:none;padding:11px 10px;border-radius:9px;font-weight:650;font-size:13px}.menu a:hover,.menu a.active{background:#0f654f}.menu .sub{padding-left:27px;color:#b7e8d5;font-size:12px}
        .logout{margin-top:24px;border:1px solid #ffffff25;border-radius:9px;padding:10px}.logout button{width:100%;background:transparent;color:#fff}
        .page{min-width:0;flex:1}.topbar{background:#fff;border-bottom:1px solid var(--line);padding:25px 36px;display:flex;justify-content:space-between;align-items:center}.topbar h1{margin:0;font-size:26px}.topbar p{margin:5px 0 0;color:#62746e;font-size:13px}.content{max-width:1400px;margin:0 auto;padding:28px 36px}.card,.content-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;margin:16px 0;box-shadow:0 4px 16px #073c3510}table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden}th,td{padding:12px;text-align:left;border-bottom:1px solid #e5eeeb}th{background:var(--mint)}button,.button{border:0;border-radius:7px;padding:9px 14px;background:var(--green);color:#fff;cursor:pointer;font-weight:650;text-decoration:none;display:inline-block}.button-primary{background:var(--green)}.muted{color:#60736e}.profile{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:12px}.mobile-toggle{display:none}.page-heading{display:flex;justify-content:space-between;gap:20px;align-items:end;margin-bottom:22px}.page-heading h1{margin:0 0 6px;font-size:30px}.eyebrow{margin:0 0 6px;color:var(--green);font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.dashboard-hero{display:flex;justify-content:space-between;gap:24px;align-items:center;background:linear-gradient(120deg,#075b46,#118364);color:#fff;border-radius:16px;padding:26px 30px;margin-bottom:20px}.dashboard-hero h2{margin:0 0 8px;font-size:24px}.dashboard-hero p{margin:0;color:#dbfff2}.dashboard-hero .eyebrow{color:#f2c23e}.hero-badge{background:#ffffff1f;border:1px solid #ffffff3b;border-radius:12px;padding:16px 20px;min-width:170px}.hero-badge span,.hero-badge strong{display:block}.hero-badge span{font-size:11px;color:#d9f6ec;margin-bottom:6px}.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.stat-card{background:#fff;border:1px solid var(--line);border-top:4px solid #14956f;border-radius:14px;padding:20px;box-shadow:0 4px 16px #073c3510}.stat-card span,.stat-card small{display:block;color:#60736e}.stat-card strong{display:block;font-size:32px;margin:12px 0 3px}.stat-card-accent{border-top-color:var(--gold);background:#fffaf0}.quick-links h2{margin:0}.quick-links{display:flex;justify-content:space-between;gap:28px;align-items:center}.quick-link-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;flex:1}.quick-link-grid a{border:1px solid var(--line);border-radius:10px;padding:13px;color:var(--ink);text-decoration:none}.quick-link-grid a:hover{border-color:var(--green);background:var(--mint)}.quick-link-grid strong,.quick-link-grid span{display:block}.quick-link-grid span{font-size:12px;color:#60736e;margin-top:5px}
        @media(max-width:900px){.sidebar{width:205px;flex-basis:205px}.content{padding:22px}.topbar{padding:20px 22px}.stats-grid{grid-template-columns:repeat(2,1fr)}.quick-links{display:block}.quick-link-grid{margin-top:16px}}
        @media(max-width:650px){.sidebar{width:70px;flex-basis:70px;padding:16px 7px}.brand{padding:0 5px 16px}.brand strong,.menu-section,.menu a span,.logout button span{display:none}.menu a{text-align:center}.menu .sub{padding-left:10px}.content{padding:16px}.topbar{padding:18px}.profile{display:none}.page-heading,.dashboard-hero{display:block}.page-heading .button{margin-top:14px}.dashboard-hero .hero-badge{margin-top:18px}.stats-grid{grid-template-columns:1fr}.quick-link-grid{grid-template-columns:1fr 1fr}}
    </style>
</head>
<body>
<div class="shell">
    <aside class="sidebar">
        <div class="brand"><span class="brand-mark">eM</span><strong>e-Mumtaz</strong></div>
        <nav class="menu">
            <a href="{{ route('dashboard') }}" class="{{ request()->routeIs('dashboard') ? 'active' : '' }}"><span>Dashboard</span>⌂</a>
            <a href="{{ route('admin.notifications') }}"><span>Notifikasi</span>◈</a>
            <div class="menu-section">Pengurusan</div>
            <a href="{{ route('admin.schools') }}"><span>Sekolah</span>⌄</a>
            <a class="sub" href="{{ route('admin.classes') }}"><span>Kelas</span>•</a>
            <a class="sub" href="{{ route('admin.students') }}"><span>Murid</span>•</a>
            <div class="menu-section">Akademik &amp; Pemarkahan</div>
            <a href="{{ route('admin.attendance') }}"><span>Kehadiran</span>⌄</a>
            <a href="{{ route('admin.assessments.psra') }}"><span>PSRA</span>•</a>
            <a href="{{ route('admin.assessments.upkk') }}"><span>UPKK</span>•</a>
            <div class="menu-section">Tetapan Sistem</div>
            <a href="{{ route('admin.school-modules') }}"><span>Modul Sekolah</span>⚙</a>
            <a href="{{ route('admin.users') }}"><span>Pengguna</span>•</a>
            <a href="{{ route('admin.licenses') }}"><span>Lesen</span>•</a>
        </nav>
        <form class="logout" method="POST" action="{{ route('logout') }}">@csrf<button type="submit"><span>Log keluar</span>↪</button></form>
    </aside>
    <div class="page">
        <header class="topbar"><div><h1>@yield('heading', 'Dashboard')</h1><p>Platform pengurusan dan analisis prestasi murid.</p></div><div class="profile">{{ auth()->user()->name ?? 'e-Mumtaz' }}<br><span class="muted">{{ auth()->user()->role ?? '' }}</span></div></header>
        <main class="content">@if(session('status'))<div class="card">{{ session('status') }}</div>@endif @yield('content')</main>
    </div>
</div>
</body>
</html>
