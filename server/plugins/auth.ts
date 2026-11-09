import {
  createToolkitAuthPlugin,
  renderAuthResetPasswordPage,
} from "@agent-native/toolkit/app/auth/server";
import type { ResetPasswordPageProps } from "@agent-native/core/shared/auth-page-types";
import { LAUNCH_LOGIN_HTML } from "../auth-page";

/**
 * The sign-in / create-account page is Launch's own document
 * (server/auth-page.ts) — our design, our layout, our motion, talking
 * to the framework's auth endpoints. The backend is untouched.
 *
 * The reset-password page still uses the framework renderer below,
 * dressed in Launch's tokens so it follows the system theme exactly
 * like the sign-in page: paper + white card + ink submit in light,
 * near-black + flat dark card + paper submit in dark. Orange is an
 * accent only (focus ring), never the surface. (Aashi's point 3 —
 * every surface set in both themes — 2026-11-07.)
 */
const LAUNCH_AUTH_STYLE = `<style>
  /* Launch dressing for the standalone reset page — light first */
  body { background: #fdfcfa !important; color: #211f1c !important; }
  .card {
    background: #ffffff !important;
    border: 1px solid #ebe9e5 !important;
    border-radius: 16px !important;
    box-shadow: 0 24px 60px rgba(30, 20, 10, 0.10) !important;
  }
  .card h1 { color: #211f1c !important; }
  .subtitle, .card label { color: #7a756c !important; }
  input {
    border-radius: 10px !important;
    border-color: #e3ded4 !important;
    background: #ffffff !important;
    color: #211f1c !important;
  }
  input::placeholder { color: #a8a29e !important; }
  input:focus {
    border-color: #ff8a3d !important;
    outline: none !important;
    box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.18) !important;
  }
  .btn-primary, button[type="submit"] {
    background: #211f1c !important;
    color: #ffffff !important;
    border-radius: 999px !important;
  }
  .btn-primary:hover, button[type="submit"]:hover { background: #3a372f !important; }
  .back { color: #7a756c !important; }
  .back:hover { color: #211f1c !important; }
  @media (prefers-color-scheme: dark) {
    body { background: #0a0b0d !important; color: #e5e5e5 !important; }
    body.has-marketing {
      --auth-marketing-left-bg: #17110d;
      --auth-marketing-right-bg: #0a0b0d;
      --auth-marketing-badge-bg: rgba(255, 77, 0, 0.16);
      --auth-marketing-border: rgba(255, 170, 110, 0.28);
      --auth-wave-bg: #0a0b0d;
      --auth-wave-fg: #ff8a3d;
    }
    .auth-marketing-visual {
      background:
        radial-gradient(52rem 26rem at 18% 112%, rgba(255, 77, 0, 0.3), transparent 62%),
        radial-gradient(30rem 16rem at 92% -10%, rgba(255, 194, 77, 0.12), transparent 60%),
        linear-gradient(165deg, #16141d 0%, #0a0b0d 70%) !important;
    }
    .card {
      background: #131518 !important;
      border: 1px solid rgba(255, 255, 255, 0.10) !important;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55) !important;
    }
    .card h1 { color: #ffffff !important; }
    .subtitle, .card label { color: #888888 !important; }
    input {
      border-color: rgba(255, 255, 255, 0.16) !important;
      background: transparent !important;
      color: #e5e5e5 !important;
    }
    input::placeholder { color: #555555 !important; }
    input:focus {
      border-color: #ff8a3d !important;
      box-shadow: 0 0 0 3px rgba(255, 77, 0, 0.25) !important;
    }
    .btn-primary, button[type="submit"] {
      background: #f5f3ef !important;
      color: #211f1c !important;
    }
    .btn-primary:hover, button[type="submit"]:hover { background: #ffffff !important; }
    .tab.active { color: #ffb27a !important; border-color: #ff4d00 !important; }
    .auth-page a { color: #ff9a52 !important; }
    .app-status-badge {
      background: rgba(255, 77, 0, 0.16) !important;
      color: #ffb27a !important;
      border-color: rgba(255, 170, 110, 0.35) !important;
    }
    .back { color: #888888 !important; }
    .back:hover { color: #bbbbbb !important; }
  }
</style>`;

function dressAuthHtml(markup: string): string {
  // renderResetPasswordPage returns page MARKUP that the framework
  // embeds in its own document shell — so the dressing rides at the end
  // of the markup itself (browsers apply a <style> element wherever it
  // appears, and coming after the shell's stylesheet it wins on equal
  // specificity, plus !important where the shell hardcodes values).
  return (
    markup
      .split("/agent-native-icon-dark.svg")
      .join("/launch-mark.svg")
      .split("/agent-native-icon-light.svg")
      .join("/launch-mark.svg") + LAUNCH_AUTH_STYLE
  );
}

export default createToolkitAuthPlugin({
  // The public website lives at /home (the framework does not route the
  // SPA at "/" — with rootAuth on, "/" serves the sign-in page, and a
  // Vercel routing patch sends the bare domain to /home).
  workspaceAppPublicPaths: ["/home"],
  rootAuth: true,
  // Our own sign-in document (see header note).
  loginHtml: LAUNCH_LOGIN_HTML,
  // Branding copy for framework-rendered auth surfaces (reset page).
  marketing: {
    appName: "Launch",
    tagline: "Launch day, on one runway.",
    description:
      "One board where you and your agent draft, lock, adapt and publish every launch post — and nothing goes live without your approval.",
    features: [
      "Lock what's final — even the agent can't change it",
      "The agent adapts every other post around your lock",
      "Nothing publishes without your approval",
    ],
  },
  renderResetPasswordPage: (props: ResetPasswordPageProps) =>
    dressAuthHtml(renderAuthResetPasswordPage(props)),
});
