export const passwordResetTemplate = (params: {
  firstName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string; text: string } => {
  const { firstName, resetUrl, expiresInMinutes } = params;

  return {
    subject: 'Reset your AutoMinutes password',
    text: `Hi ${firstName},\n\nWe received a request to reset your AutoMinutes password. Click the link below to choose a new one:\n\n${resetUrl}\n\nThis link expires in ${expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email - your password won't be changed.`,
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
                  We received a request to reset your AutoMinutes password. Click the button below to choose a new one.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 24px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: bold;">Reset password</a>
                </td>
              </tr>
              <tr>
                <td style="font-size: 13px; color: #71717a;">
                  This link expires in ${expiresInMinutes} minutes. If you didn't request this, you can safely ignore this email - your password won't be changed.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  };
};

export const googleAccountNoticeTemplate = (params: {
  firstName: string;
}): { subject: string; html: string; text: string } => {
  const { firstName } = params;

  return {
    subject: 'AutoMinutes password reset request',
    text: `Hi ${firstName},\n\nSomeone requested a password reset for this email address, but your AutoMinutes account uses Google Sign-In and doesn't have a password. Continue signing in with Google instead.\n\nIf this wasn't you, no action is needed.`,
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
                  Someone requested a password reset for this email address, but your AutoMinutes account uses <strong>Google Sign-In</strong> and doesn't have a password. Continue signing in with Google instead.
                </td>
              </tr>
              <tr>
                <td style="padding-top: 16px; font-size: 13px; color: #71717a;">
                  If this wasn't you, no action is needed.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  };
};
