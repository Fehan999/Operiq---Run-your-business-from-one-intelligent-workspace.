/*
 * Looks at a Postgres connection string the way a person debugging it would, without ever
 * printing the password. Used by the deploy step and by `npm run db:check`.
 */

const ENCODING_HINT =
  "If the password contains # / ? or %, those characters must be URL-encoded " +
  "(# is %23, / is %2F, ? is %3F, % is %25), or reset the password to letters and digits.";

export function inspectConnectionString(value) {
  const problems = [];

  if (!value) {
    return { url: null, summary: "not set", problems: ["The variable is empty or missing."] };
  }

  let candidate = value;
  if (candidate !== candidate.trim()) {
    problems.push("It starts or ends with a space or line break. Remove it.");
    candidate = candidate.trim();
  }
  if (/^["'].*["']$/.test(candidate)) {
    problems.push("It is wrapped in quotes. Paste the value without the quotes.");
    candidate = candidate.slice(1, -1);
  }
  if (/YOUR-PASSWORD/i.test(candidate)) {
    problems.push(
      "It still contains the [YOUR-PASSWORD] placeholder. Replace the whole thing, square " +
        "brackets too, with your database password.",
    );
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    problems.push(`It is not a valid connection string. ${ENCODING_HINT}`);
    return { url: null, summary: "unreadable", problems };
  }

  let password = url.password;
  try {
    password = decodeURIComponent(url.password);
  } catch {
    problems.push(`The password has a % that isn't valid URL encoding. ${ENCODING_HINT}`);
  }

  if (!password) {
    problems.push("There is no password in it.");
  } else if (password.startsWith("[") || password.endsWith("]")) {
    problems.push(
      "The password is wrapped in square brackets. When replacing [YOUR-PASSWORD], the " +
        "brackets have to go too.",
    );
  }

  if (url.hostname.endsWith(".pooler.supabase.com") && !url.username.includes(".")) {
    problems.push(
      'The Supabase pooler needs the username in the form "postgres.<project-ref>". ' +
        "Copy the string again from Supabase, Connect.",
    );
  }

  const port = url.port || "5432";
  const summary =
    `user "${url.username}", password of ${password.length} characters, ` +
    `host ${url.hostname}, port ${port}, database ${url.pathname.slice(1) || "(none)"}`;

  return { url: url.toString(), summary, problems };
}

/** Turns a Postgres or network error into a sentence about what to change. */
export function explainConnectionError(error) {
  const message = error?.message ?? String(error);

  if (error?.code === "28P01" || /password authentication failed/i.test(message)) {
    return (
      "Wrong password. Reset it in Supabase (Project Settings, Database), then paste the " +
      "new one into both DATABASE_URL and DIRECT_URL."
    );
  }
  if (/tenant or user not found/i.test(message)) {
    return (
      "Supabase doesn't recognise the username or host. Copy both strings again from " +
      "Supabase, Connect (username postgres.<project-ref>, host aws-…-<region>.pooler.supabase.com)."
    );
  }
  if (error?.code === "ENOTFOUND") {
    return "The host name doesn't exist. Check it for typos.";
  }
  if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT" || /timeout/i.test(message)) {
    return "The server didn't answer. Check the host and port, and that the Supabase project isn't paused.";
  }
  return null;
}
