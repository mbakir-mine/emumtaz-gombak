<!doctype html>
<html lang="ms">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tukar Password — e-Mumtaz</title></head>
<body>
    <main>
        <h1>Tukar Password</h1>
        <form method="POST" action="{{ route('password.change.store') }}">
            @csrf
            <label>Password semasa <input name="current_password" type="password" required></label>
            @error('current_password')<p>{{ $message }}</p>@enderror
            <label>Password baharu <input name="password" type="password" required></label>
            @error('password')<p>{{ $message }}</p>@enderror
            <label>Sahkan password <input name="password_confirmation" type="password" required></label>
            <button type="submit">Simpan</button>
        </form>
    </main>
</body>
</html>
