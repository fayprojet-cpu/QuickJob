const PRIMARY_COLOR = '#FF5722';

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const COPY = {
  fr: {
    subjectAccepted: (jobTitle: string) => `Ta candidature pour « ${jobTitle} » a été acceptée !`,
    subjectRejected: (jobTitle: string) => `Réponse à ta candidature pour « ${jobTitle} »`,
    preheaderAccepted: 'Bonne nouvelle pour ta candidature.',
    preheaderRejected: 'Le recruteur a répondu à ta candidature.',
    titleAccepted: 'Candidature acceptée',
    titleRejected: 'Candidature non retenue',
    bodyAccepted: (jobTitle: string) =>
      `Bonne nouvelle : ta candidature pour la mission « ${jobTitle} » a été acceptée par le recruteur.`,
    bodyRejected: (jobTitle: string) =>
      `Le recruteur a décidé de ne pas donner suite à ta candidature pour la mission « ${jobTitle} ». Ne te décourage pas, d'autres missions t'attendent.`,
    button: 'Voir mes candidatures',
    fallback: 'Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :',
    footer: 'QuickJob — la plateforme universelle du travail temporaire.',
  },
  en: {
    subjectAccepted: (jobTitle: string) => `Your application for "${jobTitle}" was accepted!`,
    subjectRejected: (jobTitle: string) => `Update on your application for "${jobTitle}"`,
    preheaderAccepted: 'Good news about your application.',
    preheaderRejected: 'The recruiter responded to your application.',
    titleAccepted: 'Application accepted',
    titleRejected: 'Application not selected',
    bodyAccepted: (jobTitle: string) =>
      `Good news: your application for the job "${jobTitle}" was accepted by the recruiter.`,
    bodyRejected: (jobTitle: string) =>
      `The recruiter decided not to move forward with your application for the job "${jobTitle}". Don't worry, more jobs are waiting for you.`,
    button: 'View my applications',
    fallback: "If the button doesn't work, copy this link into your browser:",
    footer: 'QuickJob — the universal platform for temporary work.',
  },
} as const;

export function buildApplicationDecisionEmail(
  jobTitle: string,
  accepted: boolean,
  url: string,
  locale: string,
): EmailContent {
  const t = locale.startsWith('fr') ? COPY.fr : COPY.en;
  const lang = locale.startsWith('fr') ? 'fr' : 'en';

  const title = accepted ? t.titleAccepted : t.titleRejected;
  const preheader = accepted ? t.preheaderAccepted : t.preheaderRejected;
  const body = accepted ? t.bodyAccepted(jobTitle) : t.bodyRejected(jobTitle);
  const subject = accepted ? t.subjectAccepted(jobTitle) : t.subjectRejected(jobTitle);

  const html = `<!doctype html>
<html lang="${lang}">
  <body style="margin:0;padding:0;background-color:#F5F5F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <span style="display:none;font-size:1px;color:#F5F5F5;">${preheader}</span>
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
                <h1 style="margin:0 0 16px;font-size:20px;color:#1A1A1A;">${title}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#444444;">${body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="border-radius:8px;background-color:${PRIMARY_COLOR};">
                      <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">${t.button}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 4px;font-size:12px;color:#888888;">${t.fallback}</p>
                <p style="margin:0;font-size:12px;word-break:break-all;color:${PRIMARY_COLOR};">${url}</p>
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

  const text = `${title}\n\n${body}\n\n${url}`;

  return { subject, html, text };
}
