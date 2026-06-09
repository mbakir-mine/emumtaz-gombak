import { temporaryUserPassword } from './authProvisioning';

type ActivationEmailProfile = {
  email: string;
  nama: string;
  role: string;
  kod_sekolah?: string | null;
  zon?: string | null;
};

function appLoginUrl() {
  const explicitUrl = process.env.EMUMTAZ_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';
  const baseUrl = (explicitUrl || vercelUrl).replace(/\/$/, '');
  return baseUrl ? `${baseUrl}/login` : '';
}

function accessLabel(profile: ActivationEmailProfile) {
  if (profile.kod_sekolah) return profile.kod_sekolah;
  if (profile.zon) return `Zon ${profile.zon}`;
  return 'Daerah Gombak';
}

function emailText(profile: ActivationEmailProfile) {
  const loginUrl = appLoginUrl();

  return [
    `Assalamualaikum ${profile.nama},`,
    '',
    'Akaun e-Mumtaz Gombak anda telah diaktifkan.',
    '',
    `Email login: ${profile.email}`,
    `Password sementara: ${temporaryUserPassword}`,
    `Peranan: ${profile.role}`,
    `Akses: ${accessLabel(profile)}`,
    loginUrl ? `Pautan login: ${loginUrl}` : '',
    '',
    'Sila login menggunakan password sementara ini. Selepas login pertama, sistem akan meminta anda menukar password.',
    '',
    'Terima kasih.',
    'e-Mumtaz Gombak',
  ]
    .filter(Boolean)
    .join('\n');
}

function emailHtml(profile: ActivationEmailProfile) {
  const loginUrl = appLoginUrl();

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0b1b2b;">
      <h2 style="margin: 0 0 12px;">Akaun e-Mumtaz Gombak Diaktifkan</h2>
      <p>Assalamualaikum <strong>${profile.nama}</strong>,</p>
      <p>Akaun e-Mumtaz Gombak anda telah diaktifkan.</p>
      <table style="border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 6px 14px 6px 0; color: #52637a;">Email login</td>
          <td style="padding: 6px 0;"><strong>${profile.email}</strong></td>
        </tr>
        <tr>
          <td style="padding: 6px 14px 6px 0; color: #52637a;">Password sementara</td>
          <td style="padding: 6px 0;"><strong>${temporaryUserPassword}</strong></td>
        </tr>
        <tr>
          <td style="padding: 6px 14px 6px 0; color: #52637a;">Peranan</td>
          <td style="padding: 6px 0;">${profile.role}</td>
        </tr>
        <tr>
          <td style="padding: 6px 14px 6px 0; color: #52637a;">Akses</td>
          <td style="padding: 6px 0;">${accessLabel(profile)}</td>
        </tr>
      </table>
      ${
        loginUrl
          ? `<p><a href="${loginUrl}" style="display: inline-block; padding: 10px 16px; background: #08743b; color: #fff; text-decoration: none; border-radius: 8px;">Login e-Mumtaz</a></p>`
          : ''
      }
      <p>Sila login menggunakan password sementara ini. Selepas login pertama, sistem akan meminta anda menukar password.</p>
      <p>Terima kasih.<br />e-Mumtaz Gombak</p>
    </div>
  `;
}

export async function sendActivationEmail(profile: ActivationEmailProfile) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMUMTAZ_EMAIL_FROM;

  if (!apiKey || !from) {
    return {
      ok: false,
      message: 'Email aktivasi tidak dihantar kerana RESEND_API_KEY atau EMUMTAZ_EMAIL_FROM belum ditetapkan.',
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [profile.email],
      subject: 'Akaun e-Mumtaz Gombak telah diaktifkan',
      text: emailText(profile),
      html: emailHtml(profile),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      ok: false,
      message: `Email aktivasi gagal dihantar: ${detail}`,
    };
  }

  return { ok: true, message: 'Email aktivasi telah dihantar kepada pengguna.' };
}
