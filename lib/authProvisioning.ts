import { createClient } from '@supabase/supabase-js';
import { randomBytes, randomInt } from 'node:crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type AuthProvisionProfile = {
  id: string;
  email: string;
  nama: string;
  role: string;
  kod_sekolah?: string | null;
  zon?: string | null;
  auth_user_id?: string | null;
};

type SupabaseAdminClient = NonNullable<ReturnType<typeof createSupabaseAdmin>>;

export type AuthProvisionResult =
  | {
      ok: true;
      authUserId: string;
      created: boolean;
      message: string;
      temporaryPassword?: string;
    }
  | {
      ok: false;
      message: string;
    };

export type AuthPasswordResetResult =
  | {
      ok: true;
      authUserId: string;
      created: boolean;
      temporaryPassword: string;
    }
  | {
      ok: false;
      message: string;
    };

export function hasAuthProvisioningEnv() {
  return Boolean(supabaseUrl && supabaseServiceRoleKey);
}

function missingServiceRoleMessage() {
  return (
    'SUPABASE_SERVICE_ROLE_KEY belum ditetapkan pada server. ' +
    'Tambah key ini di Vercel Environment Variables untuk Production/Preview/Development, kemudian redeploy.'
  );
}

function createSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) return null;

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function generateTemporaryPassword() {
  return `Em@${randomInt(100000, 1000000)}${randomBytes(3).toString('hex')}`;
}

export async function verifyOwnerAccessToken(accessToken: string) {
  if (!accessToken) return false;
  const admin = createSupabaseAdmin();
  if (!admin) return false;

  const { data: authData, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !authData.user) return false;

  const { data: linkedOwner, error: linkedError } = await admin
    .from('app_users')
    .select('id')
    .eq('auth_user_id', authData.user.id)
    .eq('role', 'OWNER')
    .eq('status', 'AKTIF')
    .maybeSingle();
  if (!linkedError && linkedOwner) return true;

  if (!authData.user.email) return false;
  const { data: emailOwner, error: emailError } = await admin
    .from('app_users')
    .select('id')
    .ilike('email', authData.user.email)
    .eq('role', 'OWNER')
    .eq('status', 'AKTIF')
    .maybeSingle();

  return !emailError && Boolean(emailOwner);
}

async function findAuthUserByEmail(admin: SupabaseAdminClient, email: string) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      return { user: null, error };
    }

    const user = data.users.find((item: { email?: string | null }) => item.email?.toLowerCase() === normalizedEmail);
    if (user) return { user, error: null };
    if (data.users.length < 100) break;
  }

  return { user: null, error: null };
}

function isAlreadyRegisteredError(message: string) {
  const clean = message.toLowerCase();
  return clean.includes('already') || clean.includes('registered') || clean.includes('exists');
}

export async function provisionAuthUser(profile: AuthProvisionProfile): Promise<AuthProvisionResult> {
  const email = profile.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: 'Email pengguna tidak lengkap.' };
  }

  if (profile.auth_user_id) {
    return {
      ok: true,
      authUserId: profile.auth_user_id,
      created: false,
      message: 'Akaun Auth pengguna telah dipautkan sebelum ini.',
    };
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: missingServiceRoleMessage(),
    };
  }

  const temporaryPassword = generateTemporaryPassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      nama: profile.nama,
      role: profile.role,
      kod_sekolah: profile.kod_sekolah ?? null,
      zon: profile.zon ?? null,
    },
  });

  if (!error && data.user) {
    return {
      ok: true,
      authUserId: data.user.id,
      created: true,
      temporaryPassword,
      message: `Akaun login berjaya dicipta. Kata laluan sementara: ${temporaryPassword}.`,
    };
  }

  if (error && isAlreadyRegisteredError(error.message)) {
    const existing = await findAuthUserByEmail(admin, email);

    if (existing.error) {
      return {
        ok: false,
        message: `Akaun Auth sedia ada gagal disemak: ${existing.error.message}`,
      };
    }

    if (existing.user) {
      return {
        ok: true,
        authUserId: existing.user.id,
        created: false,
        message: 'Akaun Auth sedia ada dipautkan. Gunakan kata laluan sedia ada atau lakukan pemulihan jika perlu.',
      };
    }
  }

  return {
    ok: false,
    message: `Gagal cipta akaun login Auth untuk ${email}: ${error?.message ?? 'Ralat tidak diketahui.'}`,
  };
}

async function updateAuthPassword(
  admin: SupabaseAdminClient,
  authUserId: string,
  profile: AuthProvisionProfile,
  temporaryPassword: string,
) {
  return await admin.auth.admin.updateUserById(authUserId, {
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      nama: profile.nama,
      role: profile.role,
      kod_sekolah: profile.kod_sekolah ?? null,
      zon: profile.zon ?? null,
    },
  });
}

export async function ensureTemporaryAuthLogin(profile: AuthProvisionProfile): Promise<AuthProvisionResult> {
  const email = profile.email.trim().toLowerCase();
  if (!email) {
    return { ok: false, message: 'Email pengguna tidak lengkap.' };
  }

  const admin = createSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      message: missingServiceRoleMessage(),
    };
  }

  let authUserId = profile.auth_user_id ?? '';
  let created = false;
  const temporaryPassword = generateTemporaryPassword();

  if (!authUserId) {
    const existing = await findAuthUserByEmail(admin, email);
    if (existing.error) {
      return { ok: false, message: `Akaun Auth gagal disemak: ${existing.error.message}` };
    }

    authUserId = existing.user?.id ?? '';
  }

  if (!authUserId) {
    const createdUser = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        nama: profile.nama,
        role: profile.role,
        kod_sekolah: profile.kod_sekolah ?? null,
        zon: profile.zon ?? null,
      },
    });

    if (createdUser.error || !createdUser.data.user) {
      return {
        ok: false,
        message: `Gagal cipta akaun login Auth untuk ${email}: ${createdUser.error?.message ?? 'Ralat tidak diketahui.'}`,
      };
    }

    authUserId = createdUser.data.user.id;
    created = true;
  } else {
    const { error } = await updateAuthPassword(admin, authUserId, profile, temporaryPassword);

    if (error) {
      return {
        ok: false,
        message: `Gagal menetapkan kata laluan sementara untuk ${email}: ${error.message}`,
      };
    }
  }

  return {
    ok: true,
    authUserId,
    created,
    temporaryPassword,
    message: `Akaun login ${created ? 'dicipta' : 'disediakan semula'}. Kata laluan sementara: ${temporaryPassword}.`,
  };
}

export async function resetAuthUserPassword(profile: AuthProvisionProfile): Promise<AuthPasswordResetResult> {
  const email = profile.email.trim().toLowerCase();
  if (!email) return { ok: false, message: 'Email pengguna tidak lengkap.' };

  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false, message: missingServiceRoleMessage() };

  let authUserId = profile.auth_user_id ?? '';
  let created = false;

  if (authUserId) {
    const { data, error } = await admin.auth.admin.getUserById(authUserId);
    if (error || !data.user) authUserId = '';
  }

  if (!authUserId) {
    const existing = await findAuthUserByEmail(admin, email);
    if (existing.error) {
      return { ok: false, message: `Akaun Auth gagal disemak: ${existing.error.message}` };
    }
    authUserId = existing.user?.id ?? '';
  }

  const temporaryPassword = generateTemporaryPassword();
  const metadata = {
    nama: profile.nama,
    role: profile.role,
    kod_sekolah: profile.kod_sekolah ?? null,
    zon: profile.zon ?? null,
  };

  if (authUserId) {
    const { error } = await admin.auth.admin.updateUserById(authUserId, {
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return { ok: false, message: `Gagal menetapkan kata laluan sementara: ${error.message}` };
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error || !data.user) {
      return { ok: false, message: `Gagal mencipta akaun Auth: ${error?.message ?? 'Ralat tidak diketahui.'}` };
    }
    authUserId = data.user.id;
    created = true;
  }

  const { error: profileError } = await admin
    .from('app_users')
    .update({ auth_user_id: authUserId, must_change_password: true })
    .eq('id', profile.id);
  if (profileError) {
    if (created) await admin.auth.admin.deleteUser(authUserId);
    return { ok: false, message: `Kata laluan Auth dikemaskini tetapi profil gagal dipautkan: ${profileError.message}` };
  }

  return { ok: true, authUserId, created, temporaryPassword };
}

export async function createPendingSelfRegisteredAuthUser(
  profile: AuthProvisionProfile,
  password: string,
): Promise<AuthProvisionResult> {
  const email = profile.email.trim().toLowerCase();
  if (!email) return { ok: false, message: 'Email pengguna tidak lengkap.' };
  if (password.length < 8) return { ok: false, message: 'Password mesti sekurang-kurangnya 8 aksara.' };

  const admin = createSupabaseAdmin();
  if (!admin) return { ok: false, message: missingServiceRoleMessage() };

  const existing = await findAuthUserByEmail(admin, email);
  if (existing.error) {
    return { ok: false, message: `Akaun Auth gagal disemak: ${existing.error.message}` };
  }
  if (existing.user) {
    return {
      ok: false,
      message: 'Email ini sudah mempunyai akaun login. Sila kembali ke Login atau gunakan Lupa Kata Laluan.',
    };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      nama: profile.nama,
      role: profile.role,
      kod_sekolah: profile.kod_sekolah ?? null,
      zon: profile.zon ?? null,
    },
  });

  if (error || !data.user) {
    return { ok: false, message: `Gagal mencipta akaun login: ${error?.message ?? 'Ralat tidak diketahui.'}` };
  }

  return {
    ok: true,
    authUserId: data.user.id,
    created: true,
    message: 'Akaun login berjaya dicipta dan menunggu pengesahan Admin.',
  };
}
