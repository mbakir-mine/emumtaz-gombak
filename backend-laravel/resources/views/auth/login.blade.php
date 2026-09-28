<!doctype html>
<html lang="ms">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Log Masuk — e-Mumtaz</title>
</head>
<body>
    <main>
        <h1>e-Mumtaz</h1>
        <form method="POST" action="{{ route('login.store') }}">
            @csrf
            <label for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required autofocus>
            @error('email')<p>{{ $message }}</p>@enderror
            <label for="password">Password</label>
            <input id="password" name="password" type="password" required>
            @error('password')<p>{{ $message }}</p>@enderror
            <label><input type="checkbox" name="remember" value="1"> Ingat saya</label>
            <button type="submit">Log masuk</button>
        </form>
        <p><a href="{{ route('password.request') }}">Lupa password?</a></p>
    </main>
</body>
</html>
