// The "secret URL" for the admin panel. This only keeps the panel from
// being casually stumbled upon (and it's excluded from robots.txt) — it is
// NOT the security boundary. The real protection is the login form behind
// it. Change this to anything you like; just keep it in sync with the
// Disallow rule in client/public/robots.txt.
export const ADMIN_PATH = "/panel-ba2026";
