<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Notifications\Notifiable;

#[Fillable(['id', 'name', 'email', 'password', 'role', 'status', 'kod_sekolah', 'zon', 'daerah', 'allowed_nav', 'must_change_password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements CanResetPasswordContract
{
    use CanResetPassword;
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    public $incrementing = false;
    protected $keyType = 'string';

    public const OWNER = 'OWNER';
    public const DISTRICT_ADMIN = 'ADMIN_DAERAH';
    public const ZONE_ADMIN = 'ADMIN_ZON';
    public const SCHOOL_ADMIN = 'ADMIN_SEKOLAH';
    public const CLASS_TEACHER = 'GURU_KELAS';
    public const SUBJECT_TEACHER = 'GURU_SUBJEK';
    public const GURU_SUBJEK = self::SUBJECT_TEACHER;

    public function isActive(): bool
    {
        return $this->status === 'AKTIF';
    }

    public function roleIsAdministrative(): bool
    {
        return in_array($this->role, [self::OWNER, self::DISTRICT_ADMIN, self::ZONE_ADMIN, self::SCHOOL_ADMIN], true);
    }

    public function canAccessSchool(?string $schoolCode): bool
    {
        if (! $this->isActive() || ! $schoolCode) {
            return false;
        }

        if (in_array($this->role, [self::OWNER, self::DISTRICT_ADMIN], true)) {
            return true;
        }

        if ($this->role === self::ZONE_ADMIN) {
            return (bool) School::query()
                ->where('kod_sekolah', $schoolCode)
                ->where('zon', $this->zon)
                ->where('status', 'AKTIF')
                ->exists();
        }

        return $this->kod_sekolah === $schoolCode;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'allowed_nav' => 'array',
            'must_change_password' => 'boolean',
        ];
    }
}
