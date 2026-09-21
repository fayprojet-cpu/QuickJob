const PRIMARY_COLOR = '#FF5722';

interface PasswordResetEmailContent {
  subject: string;
  html: string;
  text: string;
}

const COPY = {
  fr: {
    subject: 'Réinitialise ton mot de passe QuickJob',
    preheader: 'Ce lien expire dans 30 minutes.',
    title: 'Réinitialisation de mot de passe',
    body: "Tu as demandé à réinitialiser le mot de passe de ton compte QuickJob. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.",
    button: 'Réinitialiser mon mot de passe',
    fallback: "Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :",
    expiry: 'Ce lien expire dans 30 minutes.',
    ignore: "Si tu n'es pas à l'origine de cette demande, ignore simplement cet email — ton mot de passe ne changera pas.",
    footer: 'QuickJob — la plateforme universelle du travail temporaire.',
  },
  en: {
    subject: 'Reset your QuickJob password',
    preheader: 'This link expires in 30 minutes.',
    title: 'Password reset',
    body: 'You requested to reset the password for your QuickJob account. Click the button below to choose a new password.',
    button: 'Reset my password',
    fallback: "If the button doesn't work, copy this link into your browser:",
    expiry: 'This link expires in 30 minutes.',
    ignore: "If you didn't request this, you can safely ignore this email — your password won't change.",
    footer: 'QuickJob — the universal platform for temporary work.',
  },
} as const;

export function buildPasswordResetEmail(resetUrl: string, locale: string): PasswordResetEmailContent {
  const t = locale.startsWith('fr') ? COPY.fr : COPY.en;

  const html = `<!doctype html>
<html lang="${locale.startsWith('fr') ? 'fr' : 'en'}">
  <body style="margin:0;padding:0;background-color:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none;font-size:1px;color:#F5F5F5;">${t.preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F5;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${PRIMARY_COLOR};padding:24px 32px;">
                <span style="color:#FFFFFF;font-size:20px;font-weight:800;">Quick<span style="opacity:.85;">Job</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:20px;color:#1A1A1A;">${t.title}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#444444;">${t.body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius:8px;background-color:${PRIMARY_COLOR};">
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${t.button}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 4px;font-size:12px;color:#888888;">${t.fallback}</p>
                <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:${PRIMARY_COLOR};">${resetUrl}</p>
                <p style="margin:0 0 4px;font-size:12px;color:#888888;">${t.expiry}</p>
                <p style="margin:0;font-size:12px;color:#888888;">${t.ignore}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#FAFAFA;border-top:1px solid #EEEEEE;">
                <p style="margin:0;font-size:11px;color:#AAAAAA;">${t.footer}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${t.title}\n\n${t.body}\n\n${resetUrl}\n\n${t.expiry}\n${t.ignore}`;

  return { subject: t.subject, html, text };
}
