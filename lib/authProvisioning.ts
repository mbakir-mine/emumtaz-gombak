import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const temporaryUserPassword = process.env.EMUMTAZ_TEMP_USER_PASSWORD || 'Emumtaz@12345678';

export type AuthProvisionProfile = {
  id: string;
  email: string;
  nama: string;
  role: string;
  kod_sekolah?: string | null;
  zon?: string | null;
  auth_user_id?: string | null;
};

type SupabaseAdminClient = any;

export type AuthProvisionResult =
  | {
      ok: true;
      authUserId: string;
      created: boolean;
      message: string;
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

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: temporaryUserPassword,
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
      message: `Akaun login berjaya dicipta. Password sementara: ${temporaryUserPassword}.`,
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
        message: 'Akaun Auth sedia ada dipautkan. Gunakan password sedia ada atau reset password jika perlu.',
      };
    }
  }

  return {
    ok: false,
    message: `Gagal cipta akaun login Auth untuk ${email}: ${error?.message ?? 'Ralat tidak diketahui.'}`,
  };
}

async function updateAuthPassword(admin: SupabaseAdminClient, authUserId: string, profile: AuthProvisionProfile) {
  return await admin.auth.admin.updateUserById(authUserId, {
    password: temporaryUserPassword,
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
      password: temporaryUserPassword,
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
    const { error } = await updateAuthPassword(admin, authUserId, profile);

    if (error) {
      return {
        ok: false,
        message: `Gagal reset password sementara untuk ${email}: ${error.message}`,
      };
    }
  }

  return {
    ok: true,
    authUserId,
    created,
    message: `Akaun login ${created ? 'dicipta' : 'disediakan semula'}. Password sementara: ${temporaryUserPassword}.`,
  };
}
