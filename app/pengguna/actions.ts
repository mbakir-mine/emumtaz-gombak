'use server';

import { refresh, revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { navItems } from '@/lib/access';
import { sendActivationEmail } from '@/lib/activationEmail';
import {
  ensureTemporaryAuthLogin,
  provisionAuthUser,
  temporaryUserPassword,
  type AuthProvisionProfile,
} from '@/lib/authProvisioning';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];
const allowedNavKeys = navItems.filter((item) => !item.hidden && item.key !== 'dashboard').map((item) => item.key);

export type UserStatusActionState = {
  ok: boolean;
  message: string;
};

function cleanStatus(value: FormDataEntryValue | null) {
  return String(value ?? '').trim().toUpperCase();
}

type UserForProvision = AuthProvisionProfile & {
  status: string;
};

async function prepareActivationUpdate(user: UserForProvision, targetStatus: string) {
  const updates: { status: string; auth_user_id?: string; must_change_password?: boolean } = { status: targetStatus };

  if (targetStatus !== 'AKTIF') return { ok: true as const, updates, message: '' };

  const provision = await provisionAuthUser(user);
  if (!provision.ok) return provision;

  updates.auth_user_id = provision.authUserId;
  if (user.status !== 'AKTIF' || provision.created || !user.auth_user_id) {
    updates.must_change_password = true;
  }

  return {
    ok: true as const,
    updates,
    message: provision.created
      ? ` Akaun login dicipta. Password sementara: ${temporaryUserPassword}.`
      : ` ${provision.message}`,
  };
}

async function activationEmailMessage(user: UserForProvision, shouldSend: boolean) {
  if (!shouldSend) return '';

  const email = await sendActivationEmail(user);
  return ` ${email.message}`;
}

export async function updateUserStatusOnly(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = cleanStatus(formData.get('status'));

  if (!id || !allowedStatuses.includes(status)) {
    return { ok: false, message: 'Status tidak sah.' };
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,auth_user_id')
    .eq('id', id)
    .maybeSingle();

  if (!user || user.role === 'OWNER') {
    return { ok: false, message: 'Pengguna tidak boleh dikemaskini.' };
  }

  const typedUser = user as UserForProvision;
  const shouldSendEmail = status === 'AKTIF' && typedUser.status !== 'AKTIF';
  const activation = await prepareActivationUpdate(typedUser, status);
  if (!activation.ok) {
    return { ok: false, message: activation.message };
  }

  const { error } = await supabase.from('app_users').update(activation.updates).eq('id', id);

  if (error) {
    return { ok: false, message: `Gagal kemaskini status: ${error.message}` };
  }

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
  const emailMessage = await activationEmailMessage(typedUser, shouldSendEmail);
  return { ok: true, message: `Status pengguna dikemaskini kepada ${status}.${activation.message}${emailMessage}` };
}

export async function bulkUpdateUserStatusOnly(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const status = cleanStatus(formData.get('status'));
  const ids = formData
    .getAll('user_ids')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!allowedStatuses.includes(status)) {
    return { ok: false, message: 'Sila pilih status yang sah.' };
  }

  if (ids.length === 0) {
    return { ok: false, message: 'Tiada pengguna dipilih untuk dikemaskini.' };
  }

  const { data: users } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,auth_user_id')
    .in('id', ids)
    .neq('role', 'OWNER');

  const safeUsers = (users ?? []) as UserForProvision[];
  if (safeUsers.length === 0) {
    return { ok: false, message: 'Tiada pengguna yang boleh dikemaskini.' };
  }

  if (status === 'AKTIF') {
    let createdCount = 0;
    let linkedCount = 0;
    let emailedCount = 0;
    let emailWarning = '';

    for (const user of safeUsers) {
      const shouldSendEmail = user.status !== 'AKTIF';
      const activation = await prepareActivationUpdate(user, status);
      if (!activation.ok) {
        return { ok: false, message: activation.message };
      }

      if (activation.updates.auth_user_id && user.auth_user_id !== activation.updates.auth_user_id) {
        if (activation.message.includes('dicipta')) createdCount += 1;
        else linkedCount += 1;
      }

      const { error } = await supabase.from('app_users').update(activation.updates).eq('id', user.id);
      if (error) {
        return { ok: false, message: `Gagal kemaskini ${user.email}: ${error.message}` };
      }

      if (shouldSendEmail) {
        const email = await sendActivationEmail(user);
        if (email.ok) emailedCount += 1;
        else emailWarning = email.message;
      }
    }

    revalidatePath('/pengguna');
    revalidatePath('/guru');
    revalidatePath('/');
    return {
      ok: true,
      message:
        `${safeUsers.length} status pengguna berjaya dikemaskini kepada AKTIF. ` +
        `${createdCount} akaun login dicipta, ${linkedCount} akaun login sedia ada dipautkan. ` +
        `Password sementara akaun baru: ${temporaryUserPassword}. ` +
        `${emailedCount} email aktivasi dihantar.` +
        (emailWarning ? ` ${emailWarning}` : ''),
    };
  }

  const safeIds = safeUsers.map((user) => user.id);
  const { error } = await supabase.from('app_users').update({ status }).in('id', safeIds);

  if (error) {
    return { ok: false, message: `Gagal kemaskini status: ${error.message}` };
  }

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
  return { ok: true, message: `${safeIds.length} status pengguna berjaya dikemaskini kepada ${status}.` };
}

export async function updateUserStatus(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  const role = String(formData.get('role') ?? '').trim().toUpperCase();
  const zon = String(formData.get('zon') ?? '').trim().toUpperCase();
  const allowedNav = formData
    .getAll('allowed_nav')
    .map((value) => String(value))
    .filter((value) => allowedNavKeys.includes(value));

  if (!id || !allowedStatuses.includes(status) || !allowedRoles.includes(role)) {
    return { ok: false, message: 'Role atau status tidak sah.' };
  }

  if (role === 'ADMIN_ZON' && !allowedZones.includes(zon)) {
    return { ok: false, message: 'Sila pilih zon untuk Admin Zon.' };
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,auth_user_id')
    .eq('id', id)
    .maybeSingle();

  if (user?.role === 'OWNER') {
    return { ok: false, message: 'Akaun Pentadbir Utama tidak boleh diubah.' };
  }

  const updates: {
    role: string;
    status: string;
    zon?: string | null;
    kod_sekolah?: string | null;
    allowed_nav?: string[] | null;
    auth_user_id?: string;
    must_change_password?: boolean;
  } = { role, status };

  if (role === 'ADMIN_DAERAH') {
    updates.kod_sekolah = null;
    updates.zon = null;
  }

  if (role === 'ADMIN_ZON') {
    updates.kod_sekolah = null;
    updates.zon = zon;
  }

  updates.allowed_nav = allowedNav;

  let activationMessage = '';
  let activationUser: UserForProvision | null = null;
  const shouldSendEmail = status === 'AKTIF' && user?.status !== 'AKTIF';
  if (status === 'AKTIF' && user) {
    activationUser = {
      ...(user as UserForProvision),
      role,
      zon: role === 'ADMIN_ZON' ? zon : null,
      kod_sekolah: role === 'ADMIN_DAERAH' || role === 'ADMIN_ZON' ? null : user.kod_sekolah,
    };
    const activation = await prepareActivationUpdate(
      activationUser,
      status,
    );
    if (!activation.ok) {
      return { ok: false, message: activation.message };
    }
    if (activation.updates.auth_user_id) {
      updates.auth_user_id = activation.updates.auth_user_id;
    }
    if (typeof activation.updates.must_change_password === 'boolean') {
      updates.must_change_password = activation.updates.must_change_password;
    }
    activationMessage = activation.message;
  }

  const { error } = await supabase.from('app_users').update(updates).eq('id', id);

  if (error) {
    return { ok: false, message: `Gagal simpan pengguna: ${error.message}` };
  }

  revalidatePath('/pengguna');
  revalidatePath(`/pengguna/${id}`);
  revalidatePath('/guru');
  revalidatePath('/');
  const emailMessage = activationUser ? await activationEmailMessage(activationUser, shouldSendEmail) : '';
  refresh();
  return { ok: true, message: `Profil pengguna berjaya dikemaskini.${activationMessage}${emailMessage}` };
}

export async function ensureUserLogin(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const id = String(formData.get('id') ?? '').trim();
  if (!id) {
    return { ok: false, message: 'Pengguna tidak sah.' };
  }

  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id,email,nama,role,kod_sekolah,zon,status,auth_user_id')
    .eq('id', id)
    .maybeSingle();

  if (userError) {
    return { ok: false, message: `Gagal semak pengguna: ${userError.message}` };
  }

  if (!user || user.role === 'OWNER') {
    return { ok: false, message: 'Pengguna tidak boleh dikemaskini.' };
  }

  if (user.status !== 'AKTIF') {
    return { ok: false, message: 'Aktifkan pengguna dahulu sebelum sediakan login.' };
  }

  const login = await ensureTemporaryAuthLogin(user as UserForProvision);
  if (!login.ok) {
    return { ok: false, message: login.message };
  }

  const { error } = await supabase
    .from('app_users')
    .update({
      auth_user_id: login.authUserId,
      must_change_password: true,
    })
    .eq('id', id);

  if (error) {
    return { ok: false, message: `Login berjaya disediakan, tetapi profil gagal dipautkan: ${error.message}` };
  }

  revalidatePath('/pengguna');
  revalidatePath(`/pengguna/${id}`);
  revalidatePath('/guru');
  revalidatePath('/');
  const email = await sendActivationEmail(user as UserForProvision);
  return { ok: true, message: `${login.message} ${email.message}` };
}

export async function deleteUserProfile(formData: FormData) {
  if (!supabase) {
    return;
  }

  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    return;
  }

  const { data: user } = await supabase.from('app_users').select('role').eq('id', id).maybeSingle();

  if (user?.role === 'OWNER') {
    return;
  }

  await supabase.from('app_users').delete().eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
  redirect('/pengguna');
}
