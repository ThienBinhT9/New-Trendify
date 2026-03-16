import dayjs, { ManipulateType } from "dayjs";

import { Request } from "express";

export function getDeviceInfo(req: Request) {
  const deviceId = req.headers["x-device-id"];
  const userAgent = req.headers["user-agent"];
  const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  return { deviceId, userAgent, ipAddress };
}

const toCamelCase = (str: string): string => {
  return str.replace(/([-_][a-z])/g, (group) =>
    group.toUpperCase().replace("-", "").replace("_", ""),
  );
};

const toSnakeCase = (str: string): string => {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToCamelCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertToCamelCase(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      return {
        ...result,
        [camelKey]: convertToCamelCase(obj[key]),
      };
    }, {}) as T;
  }
  return obj as T;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const convertToSnakeCase = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((v) => convertToSnakeCase(v)) as unknown as T;
  } else if (obj !== null && obj !== undefined && typeof obj === "object") {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      return {
        ...result,
        [snakeKey]: convertToSnakeCase(obj[key]),
      };
    }, {}) as T;
  }
  return obj as T;
};

export function deepMerge(target: any, source: any) {
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

export function addTime(date = null, amount: number, unit: ManipulateType): Date {
  const baseDate = date ? dayjs(date) : dayjs();
  return baseDate.add(amount, unit).toDate();
}

export function renderVerifyEmail(params: {
  verifyUrl: string;
  appName?: string;
  supportEmail?: string;
}) {
  const { verifyUrl, appName = "Trendify", supportEmail = "support@yourapp.com" } = params;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Verify your email</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding:40px 0;">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
                
                <!-- HEADER -->
                <tr>
                  <td style="padding:24px 32px;background:#111827;color:#ffffff;">
                    <h1 style="margin:0;font-size:20px;">${appName}</h1>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:32px;color:#111827;">
                    <h2 style="margin-top:0;">Verify your email address</h2>

                    <p style="font-size:14px;line-height:1.6;">
                      Thanks for signing up for <strong>${appName}</strong>.
                      Please confirm your email address by clicking the button below.
                    </p>

                    <!-- BUTTON -->
                    <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                      <tr>
                        <td align="center">
                          <a
                            href="${verifyUrl}"
                            target="_blank"
                            style="
                              display:inline-block;
                              padding:12px 24px;
                              background:#2563eb;
                              color:#ffffff;
                              text-decoration:none;
                              border-radius:6px;
                              font-size:14px;
                              font-weight:bold;
                            "
                          >
                            Verify Email
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="font-size:13px;color:#6b7280;line-height:1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>

                    <p style="font-size:12px;word-break:break-all;color:#2563eb;">
                      ${verifyUrl}
                    </p>

                    <p style="font-size:13px;color:#6b7280;margin-top:32px;">
                      If you didn’t request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td style="padding:24px 32px;background:#f9fafb;font-size:12px;color:#6b7280;">
                    Need help? Contact us at
                    <a href="mailto:${supportEmail}" style="color:#2563eb;text-decoration:none;">
                      ${supportEmail}
                    </a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export const templeteResetPassword = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
  </head>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI',
        Roboto, Helvetica, Arial, sans-serif;
    "
  >
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 40px 16px">
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="
              max-width: 520px;
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
              overflow: hidden;
            "
          >
            <!-- Header -->
            <tr>
              <td
                style="
                  padding: 24px;
                  background-color: #111827;
                  color: #ffffff;
                  text-align: center;
                "
              >
                <h1 style="margin: 0; font-size: 20px; font-weight: 600">
                  Password Reset
                </h1>
              </td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding: 32px">
                <p style="margin: 0 0 16px; font-size: 15px; color: #111827">
                  Hi,
                </p>

                <p
                  style="
                    margin: 0 0 16px;
                    font-size: 15px;
                    color: #374151;
                    line-height: 1.6;
                  "
                >
                  We received a request to reset your password. Click the button
                  below to create a new one. This link is valid for
                  <strong>15 minutes</strong>.
                </p>

                <!-- Button -->
                <div style="text-align: center; margin: 32px 0">
                  <a
                    href="{{RESET_URL}}"
                    style="
                      display: inline-block;
                      padding: 14px 24px;
                      background-color: #2563eb;
                      color: #ffffff;
                      text-decoration: none;
                      font-size: 15px;
                      font-weight: 600;
                      border-radius: 6px;
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <p
                  style="
                    margin: 0 0 16px;
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.6;
                  "
                >
                  If you didn’t request a password reset, you can safely ignore
                  this email. Your password will remain unchanged.
                </p>

                <p
                  style="
                    margin: 24px 0 0;
                    font-size: 13px;
                    color: #9ca3af;
                  "
                >
                  If the button doesn’t work, copy and paste this URL into your
                  browser:
                </p>

                <p
                  style="
                    word-break: break-all;
                    font-size: 13px;
                    color: #2563eb;
                  "
                >
                  {{RESET_URL}}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td
                style="
                  padding: 20px;
                  background-color: #f9fafb;
                  text-align: center;
                  font-size: 12px;
                  color: #9ca3af;
                "
              >
                © {{YEAR}} Your Company. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
