const EMAIL_FROM =
  process.env.EMAIL_FROM || "no-reply@blueprint.local";
const EMAIL_LOG_ONLY = process.env.EMAIL_LOG_ONLY === "true";
const MS_TENANT_ID = process.env.MS_TENANT_ID;
const MS_CLIENT_ID = process.env.MS_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MS_CLIENT_SECRET;
const MS_SENDER_USER = process.env.MS_SENDER_USER || EMAIL_FROM;
const MS_GRAPH_SCOPE = process.env.MS_GRAPH_SCOPE || "https://graph.microsoft.com/.default";
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost:3000";
const EMAIL_CONFIRM_PATH =
  process.env.EMAIL_CONFIRM_PATH || "/confirm-email";
const PASSWORD_RESET_PATH =
  process.env.PASSWORD_RESET_PATH || "/reset-password";

const hasMicrosoftGraphConfig =
  Boolean(MS_TENANT_ID) && Boolean(MS_CLIENT_ID) && Boolean(MS_CLIENT_SECRET) && Boolean(MS_SENDER_USER);

let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");

const normalizePath = (value) => {
  if (!value) return "";
  return value.startsWith("/") ? value : `/${value}`;
};

const buildAppUrl = (pathName, token) => {
  const base = normalizeBaseUrl(PUBLIC_URL);
  const path = normalizePath(pathName);
  return `${base}${path}?token=${encodeURIComponent(token)}`;
};

const logEmailForTesting = ({ to, subject, text, html, reason }) => {
  console.log("[EMAIL TEST LOG]", {
    reason,
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
};

const getMicrosoftTokenEndpoint = () =>
  `https://login.microsoftonline.com/${encodeURIComponent(MS_TENANT_ID)}/oauth2/v2.0/token`;

const getMicrosoftGraphAccessToken = async () => {
  const now = Date.now();
  if (accessTokenCache.token && accessTokenCache.expiresAt - now > 30000) {
    return accessTokenCache.token;
  }

  const body = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    client_secret: MS_CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: MS_GRAPH_SCOPE,
  });

  const tokenResponse = await fetch(getMicrosoftTokenEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const tokenData = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenData?.access_token) {
    const error = new Error("Failed to retrieve Microsoft Graph access token");
    error.code = "EGRAPH_TOKEN";
    error.responseCode = tokenResponse.status;
    error.response = tokenData;
    throw error;
  }

  const expiresInSeconds = Number(tokenData.expires_in || 3600);
  accessTokenCache = {
    token: tokenData.access_token,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return accessTokenCache.token;
};

const sendViaMicrosoftGraph = async ({ to, subject, text, html }) => {
  const accessToken = await getMicrosoftGraphAccessToken();
  const graphEndpoint = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(MS_SENDER_USER)}/sendMail`;

  const response = await fetch(graphEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject,
        body: {
          contentType: html ? "HTML" : "Text",
          content: html || text,
        },
        toRecipients: [
          {
            emailAddress: {
              address: to,
            },
          },
        ],
      },
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    let errorPayload = null;
    try {
      errorPayload = await response.json();
    } catch {
      errorPayload = await response.text();
    }

    const error = new Error("Microsoft Graph sendMail failed");
    error.code = "EGRAPH_SEND";
    error.responseCode = response.status;
    error.response = errorPayload;
    throw error;
  }

  console.log("[EMAIL SENT][GRAPH]", {
    provider: "microsoft-graph",
    sender: MS_SENDER_USER,
    to,
    subject,
    responseCode: response.status,
  });

  return {
    sent: true,
    skipped: false,
    provider: "microsoft-graph",
    responseCode: response.status,
  };
};

export const isEmailServiceConfigured = () =>
  hasMicrosoftGraphConfig || EMAIL_LOG_ONLY;

export const sendEmail = async ({ to, subject, text, html }) => {
  if (EMAIL_LOG_ONLY) {
    logEmailForTesting({
      to,
      subject,
      text,
      html,
      reason: "EMAIL_LOG_ONLY enabled",
    });

    return {
      sent: false,
      skipped: true,
      logged: true,
      reason: "Csak email naplózás mód van bekapcsolva",
    };
  }

  if (hasMicrosoftGraphConfig) {
    try {
      return await sendViaMicrosoftGraph({ to, subject, text, html });
    } catch (error) {
      console.error("[EMAIL SEND ERROR][GRAPH]", {
        message: error?.message,
        code: error?.code,
        response: error?.response,
        responseCode: error?.responseCode,
        to,
        subject,
      });
      throw error;
    }
  }

  logEmailForTesting({
    to,
    subject,
    text,
    html,
    reason: "Az email szolgáltatás nincs beállítva a Microsoft Graphhoz",
  });

  return {
    sent: false,
    skipped: true,
    logged: true,
    reason: "Az email szolgáltatás nincs beállítva a Microsoft Graphhoz",
  };
};

export const sendEmailConfirmationEmail = async ({ email, name, token }) => {
  const confirmationUrl = buildAppUrl(EMAIL_CONFIRM_PATH, token);
  const subject = "Email cím megerősítése";
  const text = `Szia ${name || ""}!\n\nErősítsd meg az email címed: ${confirmationUrl}\n\nA link 24 óráig érvényes.`;
  const html = `<p>Szia ${name || ""}!</p><p>Erősítsd meg az email címed:</p><p><a href=\"${confirmationUrl}\">Email megerősítése</a></p><p>A link 24 óráig érvényes.</p>`;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

export const sendPasswordResetEmail = async ({ email, name, token }) => {
  const resetUrl = buildAppUrl(PASSWORD_RESET_PATH, token);
  const subject = "Jelszó visszaállítás";
  const text = `Szia ${name || ""}!\n\nÚj jelszó beállítása: ${resetUrl}\n\nA link 1 óráig érvényes.`;
  const html = `<p>Szia ${name || ""}!</p><p>Új jelszó beállítása:</p><p><a href=\"${resetUrl}\">Jelszó visszaállítása</a></p><p>A link 1 óráig érvényes.</p>`;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};
