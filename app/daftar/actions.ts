'use server';

import { createClient } from '@supabase/supabase-js';
import { createPendingSelfRegisteredAuthUser, type AuthProvisionProfile } from '@/lib/authProvisioning';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];

export type RegisterUserState = {
  ok: boolean;
  message: string;
};

function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export async function registerPendingUser(
  _previousState: RegisterUserState,
  formData: FormData,
): Promise<RegisterUserState> {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        'SUPABASE_SERVICE_ROLE_KEY belum ditetapkan pada server. Pendaftaran password memerlukan tetapan server.',
    };
  }

  const nama = readText(formData, 'nama').toUpperCase();
  const email = readText(formData, 'email').toLowerCase();
  const role = readText(formData, 'role').toUpperCase();
  const kodSekolah = readText(formData, 'kod_sekolah');
  const zon = readText(formData, 'zon').toUpperCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');

  if (!nama || !email || !role) {
    return { ok: false, message: 'Sila lengkapkan nama, email dan role.' };
  }
  if (!allowedRoles.includes(role)) {
    return { ok: false, message: 'Role tidak sah.' };
  }
  if (password.length < 8) {
    return { ok: false, message: 'Password mesti sekurang-kurangnya 8 aksara.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, message: 'Sahkan password tidak sama.' };
  }

  const needsSchool = !['ADMIN_DAERAH', 'ADMIN_ZON'].includes(role);
  const needsZone = role === 'ADMIN_ZON';
  if (needsSchool && !kodSekolah) return { ok: false, message: 'Sila pilih sekolah.' };
  if (needsZone && !allowedZones.includes(zon)) return { ok: false, message: 'Sila pilih zon yang sah.' };

  const { data: existingProfiles, error: existingError } = await admin
    .from('app_users')
    .select('id,status')
    .ilike('email', email);

  if (existingError) {
    return { ok: false, message: `Semakan profil pengguna gagal: ${existingError.message}` };
  }
  if ((existingProfiles ?? []).some((profile) => profile.status === 'AKTIF')) {
    return { ok: false, message: 'Email ini sudah mempunyai akaun aktif. Sila kembali ke Login.' };
  }
  if ((existingProfiles ?? []).some((profile) => profile.status === 'MENUNGGU')) {
    return { ok: true, message: 'Permohonan akaun ini sudah diterima dan sedang menunggu pengesahan Admin.' };
  }

  const profile: AuthProvisionProfile = {
    id: '',
    email,
    nama,
    role,
    kod_sekolah: needsSchool ? kodSekolah : null,
    zon: needsZone ? zon : null,
  };
  const auth = await createPendingSelfRegisteredAuthUser(profile, password);
  if (!auth.ok) return { ok: false, message: auth.message };

  const { error: insertError } = await admin.from('app_users').insert({
    email,
    nama,
    role,
    kod_sekolah: profile.kod_sekolah,
    zon: profile.zon,
    status: 'MENUNGGU',
    auth_user_id: auth.authUserId,
    must_change_password: false,
  });

  if (insertError) {
    await admin.auth.admin.deleteUser(auth.authUserId);
    return { ok: false, message: `Permohonan gagal disimpan: ${insertError.message}` };
  }

  return {
    ok: true,
    message: 'Pendaftaran berjaya dihantar. Akaun hanya boleh digunakan selepas Admin mengaktifkan status pengguna.',
  };
}
