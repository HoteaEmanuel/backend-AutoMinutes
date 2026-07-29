export const existingAccountNoticeTemplate = (params: {
  firstName: string;
}): { subject: string; html: string; text: string } => {
  const { firstName } = params;

  return {
    subject: 'AutoMinutes sign-up attempt',
    text: `Hi ${firstName},\n\nSomeone tried to sign up for AutoMinutes using this email address, but you already have an account. If this was you, log in instead. If you don't recognize this, you can safely ignore this email.`,
    html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
              <tr>
                <td style="font-size: 16px; color: #18181b;">
                  Hi ${firstName},
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 14px; color: #52525b;">
                  Someone tried to sign up for AutoMinutes using this email address, but you already have an account. If this was you, log in instead.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 13px; color: #71717a;">
                  If you don't recognize this, you can safely ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  };
};

export const verificationCodeTemplate = (params: {
  firstName: string;
  code: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } => {
  const { firstName, code, expiresInMinutes } = params;

  return {
    subject: `Your AutoMinutes code: ${code}`,
    text: `Hi ${firstName},\n\nYour AutoMinutes verification code is: ${code}\n\nThis code expires in ${expiresInMinutes} minutes. If you didn't sign up for AutoMinutes, you can ignore this email.`,
    html: `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f4f4f5; padding: 32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 32px;">
              <tr>
                <td style="font-size: 16px; color: #18181b;">
                  Hi ${firstName},
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 14px; color: #52525b;">
                  Your AutoMinutes verification code is:
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 24px 0;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b;">${code}</span>
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #71717a;">
                  This code expires in ${expiresInMinutes} minutes. If you didn't sign up for AutoMinutes, you can ignore this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  };
};
