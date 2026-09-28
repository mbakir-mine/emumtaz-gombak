@if(in_array(auth()->user()->role, ['OWNER','ADMIN_DAERAH']))
<div class="card"><h2>Tambah sekolah</h2><form method="POST" action="{{ route('admin.schools.store') }}">@csrf <input name="kod_sekolah" placeholder="Kod sekolah" required> <input name="nama_sekolah" placeholder="Nama sekolah" required> <input name="daerah" placeholder="Daerah"> <select name="zon"><option value="">Zon</option><option>BARAT</option><option>TIMUR</option><option>TENGAH</option></select> <button>Tambah</button></form></div>
@endif
