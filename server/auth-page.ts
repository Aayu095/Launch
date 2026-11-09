/**
 * Launch's own sign-in / create-account page.
 *
 * The framework serves this document verbatim for /sign-in (the
 * `loginHtml` auth option) — the design, layout and motion are entirely
 * ours, in the same Runway system as the website. Only the backend is
 * the framework's: the inline script talks to the same
 * /_agent-native/auth/* endpoints the built-in page uses (register →
 * login, email-verification step with session probing, two-factor,
 * password reset, local-dev), replicated from the toolkit's AuthPage
 * behaviour. Do not change endpoint shapes without re-checking that
 * source.
 */
export const LAUNCH_LOGIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Launch — Sign in</title>
<link rel="icon" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
<style>
  :root {
    /* Base palette = the website's own tokens (app/global.css):
       --background #fdfcfa, --foreground hsl(30 8% 12%), --border hsl(40 12% 91%).
       Warmth lives in the dawn gradient only — surfaces stay near-neutral. */
    --paper: #fdfcfa;
    --ink: #211f1c;
    --ink-soft: #4c4843;
    --muted: #7a736c;
    --line: #ebe9e5;
    --signal: #ff4d00;
    --signal-dark: #e64400;
    --field: #ffffff;
    --ease: cubic-bezier(.22, 1, .36, 1);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { min-height: 100%; }
  body {
    font-family: ui-sans-system, system-ui, -apple-system, "Segoe UI", sans-serif;
    background: var(--paper);
    color: var(--ink);
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  body::before {
    content: ""; position: fixed; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(20, 16, 12, .06) 1px, transparent 1.15px);
    background-size: 22px 22px;
  }
  body::after {
    content: ""; position: fixed; inset: auto 0 0 0; height: 46vh; pointer-events: none;
    background: radial-gradient(58rem 20rem at 50% 118%, rgba(255, 77, 0, .09), rgba(255, 154, 61, .04) 55%, transparent 75%);
  }
  .mono { font-family: "JetBrains Mono", ui-monospace, monospace; }
  .top {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between;
    max-width: 1180px; margin: 0 auto; padding: 22px 32px 0;
  }
  .brand { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); }
  .brand span { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 20px; letter-spacing: -.01em; }
  .brand sup { color: var(--signal); font-size: 11px; }
  .back { font-size: 11px; letter-spacing: .14em; color: var(--muted); text-decoration: none; transition: color .25s; }
  .back:hover { color: var(--ink); }
  .wrap {
    position: relative; z-index: 2;
    display: grid; grid-template-columns: 1.04fr .96fr; gap: 72px; align-items: center;
    max-width: 1180px; margin: 0 auto; padding: 56px 32px 72px;
  }
  /* entrance motion — staggered rise, like the website reveals */
  @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  .rise { opacity: 0; animation: rise .8s var(--ease) forwards; }
  .d1 { animation-delay: .07s; } .d2 { animation-delay: .14s; } .d3 { animation-delay: .21s; } .d4 { animation-delay: .3s; } .d5 { animation-delay: .38s; }
  .eyebrow { font-size: 11px; letter-spacing: .18em; color: #d94800; font-weight: 600; }
  h1 {
    font-family: "Space Grotesk", sans-serif; font-weight: 600;
    font-size: clamp(31px, 3.3vw, 41px); line-height: 1.06; letter-spacing: -.015em; margin-top: 16px;
  }
  .dawn-text {
    background: linear-gradient(94deg, #ff5a1f, #ff8a3d 55%, #ffc24d);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .lede { margin-top: 16px; font-size: 14.5px; line-height: 1.6; color: var(--ink-soft); max-width: 38ch; }
  /* floating glass tiles — the website hero's own language, kept light */
  .tiles { position: relative; height: 168px; margin-top: 30px; }
  .tile {
    position: absolute; display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 14px; border-radius: 13px; white-space: nowrap;
    font-family: "JetBrains Mono", monospace; font-size: 10px; font-weight: 500; letter-spacing: .1em;
    background: linear-gradient(150deg, rgba(255, 255, 255, .96), rgba(255, 255, 255, .6));
    border: 1px solid rgba(20, 16, 12, .09); color: #4c4843;
    box-shadow: 0 14px 28px rgba(20, 16, 12, .08), inset 0 1px 0 rgba(255, 255, 255, .9);
    animation: drift 8s ease-in-out infinite alternate;
  }
  .tile i { width: 5px; height: 5px; border-radius: 999px; background: var(--signal); flex: none; }
  .tile.warm {
    background: linear-gradient(150deg, rgba(255, 138, 61, .18), rgba(255, 77, 0, .09));
    border-color: rgba(255, 122, 51, .4); color: #bc430a;
    box-shadow: 0 14px 28px rgba(255, 77, 0, .1), inset 0 1px 0 rgba(255, 255, 255, .55);
  }
  @keyframes drift {
    from { transform: rotate(var(--r, 0deg)) translateY(-4px); }
    to { transform: rotate(var(--r, 0deg)) translateY(5px); }
  }
  .rule {
    margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--line);
    display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    font-size: 9.5px; letter-spacing: .15em; color: var(--muted);
  }
  /* the auth card — light glass, the website's card language */
  .card {
    background: #ffffff;
    border: 1px solid #eae7e0; border-radius: 24px;
    box-shadow: 0 1px 2px rgba(20, 16, 12, .05), 0 16px 40px rgba(20, 16, 12, .07);
    padding: 34px 34px 28px;
  }
  .card h2 { font-family: "Space Grotesk", sans-serif; font-size: 23px; font-weight: 700; letter-spacing: -.01em; }
  .sub { margin-top: 6px; font-size: 14px; color: var(--muted); }
  .tabs { display: flex; gap: 4px; background: #f6f5f3; border: 1px solid #ebe9e5; border-radius: 999px; padding: 4px; margin: 24px 0 22px; }
  .tab {
    flex: 1; border: 0; background: transparent; cursor: pointer; border-radius: 999px;
    padding: 9px 10px; font-size: 14px; font-weight: 600; color: var(--ink-soft);
    transition: background .3s var(--ease), color .3s, box-shadow .3s;
  }
  .tab.active { background: var(--ink); color: #fff; box-shadow: 0 6px 16px rgba(20, 16, 12, .2); }
  .view[hidden] { display: none; }
  @keyframes viewIn { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
  .view { animation: viewIn .45s var(--ease); }
  label { display: block; font-family: "JetBrains Mono", monospace; font-size: 10.5px; font-weight: 600; letter-spacing: .13em; text-transform: uppercase; color: var(--muted); margin: 16px 0 7px; }
  label:first-child { margin-top: 0; }
  input {
    width: 100%; background: var(--field); border: 1.5px solid #ebe9e5; border-radius: 12px;
    padding: 12px 14px; font-size: 15px; color: var(--ink); font-family: inherit;
    transition: border-color .25s, box-shadow .25s;
  }
  input::placeholder { color: #a39c90; }
  input:focus { outline: none; border-color: var(--signal); box-shadow: 0 0 0 3.5px rgba(255, 77, 0, .16); }
  input.code { text-align: center; font-family: "JetBrains Mono", monospace; font-size: 22px; letter-spacing: .35em; padding-left: calc(14px + .175em); }
  .submit {
    width: 100%; margin-top: 22px; border: 0; cursor: pointer; border-radius: 999px;
    background: var(--ink); color: #fff; font-size: 15px; font-weight: 600; padding: 13px 18px;
    box-shadow: 0 12px 26px rgba(20, 16, 12, .18);
    transition: transform .25s var(--ease), background .25s, box-shadow .25s, opacity .25s;
  }
  .submit:hover { background: #33302c; transform: translateY(-1px); box-shadow: 0 16px 30px rgba(20, 16, 12, .24); }
  .submit:active { transform: scale(.99); }
  .submit[disabled] { opacity: .55; cursor: wait; transform: none; }
  .msg { display: none; margin-top: 16px; border-radius: 12px; padding: 11px 13px; font-size: 13.5px; line-height: 1.5; animation: viewIn .35s var(--ease); }
  .msg.show { display: block; }
  .msg.error { background: #fdeee8; border: 1px solid #f3c3ae; color: #93360f; }
  .msg.success { background: #edf6e9; border: 1px solid #c4dfb6; color: #39600f; }
  .row-right { margin-top: 14px; text-align: right; font-size: 13px; }
  .row-center { margin-top: 16px; text-align: center; font-size: 13px; display: flex; gap: 18px; justify-content: center; }
  .link { border: 0; background: none; cursor: pointer; font: inherit; color: var(--signal); font-weight: 600; padding: 0; transition: color .2s; }
  .link:hover { color: var(--signal-dark); text-decoration: underline; }
  .link[disabled] { color: var(--muted); cursor: default; text-decoration: none; }
  .steps { display: flex; gap: 8px; margin: 4px 0 20px; }
  .step { flex: 1; text-align: center; font-family: "JetBrains Mono", monospace; font-size: 9.5px; letter-spacing: .1em; padding: 8px 4px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); background: rgba(255, 255, 255, .5); }
  .step.done { background: var(--ink); border-color: var(--ink); color: #fff; }
  .step.now { border-color: var(--signal); color: var(--signal); background: rgba(255, 77, 0, .07); font-weight: 600; }
  .verify-panel { background: #f6f5f3; border: 1px solid var(--line); border-radius: 14px; padding: 16px; font-size: 14px; line-height: 1.6; color: var(--ink-soft); }
  .verify-panel .kicker { font-family: "JetBrains Mono", monospace; font-size: 10px; font-weight: 600; letter-spacing: .14em; color: var(--signal); margin-bottom: 8px; }
  .verify-panel strong { color: var(--ink); }
  .micro { margin-top: 18px; text-align: center; font-size: 9.5px; letter-spacing: .16em; color: #a39c90; }
  .localdev { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px dashed var(--line); }
  .localdev p { margin-top: 9px; font-size: 12px; color: var(--muted); text-align: center; }
  @media (max-width: 920px) {
    .wrap { grid-template-columns: 1fr; gap: 40px; padding-top: 36px; }
    .tiles { margin-top: 24px; height: 158px; }
    h1 { font-size: 31px; }
  }
  /* dark — follows the visitor's system, like the rest of the app */
  @media (prefers-color-scheme: dark) {
    /* dark base = the website's own dawn-zone stack (global.css):
       neutral near-black gradient, warmth only from the dawn glow */
    body { background: linear-gradient(180deg, #16141d 0%, #1a1214 58%, #231210 100%); color: #f5f3ef; }
    body::before { background-image: radial-gradient(rgba(255, 255, 255, .055) 1px, transparent 1.15px); }
    body::after { background: radial-gradient(58rem 20rem at 50% 118%, rgba(255, 77, 0, .17), rgba(255, 154, 61, .05) 55%, transparent 75%); }
    .brand { color: #f5f3ef; }
    .back { color: #8f8c85; }
    .back:hover { color: #f5f3ef; }
    .lede { color: #a9a49b; }
    .tile {
      background: linear-gradient(150deg, rgba(250, 250, 249, .97), rgba(228, 227, 225, .92));
      border-color: rgba(255, 255, 255, .35); color: #45413c;
      box-shadow: 0 16px 30px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .8);
    }
    .tile.warm {
      background: linear-gradient(150deg, #dd9250, #bd6c2f); border-color: rgba(255, 190, 120, .45); color: #fff7ea;
      box-shadow: 0 16px 30px rgba(0, 0, 0, .45), inset 0 1px 0 rgba(255, 255, 255, .3);
    }
    .rule { border-top-color: rgba(255, 255, 255, .09); color: #8f8c85; }
    .card {
      background: linear-gradient(165deg, #101114, #0a0b0d);
      border-color: rgba(255, 255, 255, .09);
      box-shadow: 0 26px 54px rgba(0, 0, 0, .55), inset 0 1px 0 rgba(255, 255, 255, .06);
    }
    .card h2 { color: #f5f3ef; }
    .sub { color: #98938b; }
    .tabs { background: rgba(255, 255, 255, .05); border-color: rgba(255, 255, 255, .08); }
    .tab { color: #a3a099; }
    .tab.active { background: #f5f3ef; color: #17181a; box-shadow: 0 6px 16px rgba(0, 0, 0, .45); }
    label { color: #98938b; }
    input { background: rgba(255, 255, 255, .045); border-color: rgba(255, 255, 255, .13); color: #f5f3ef; }
    input::placeholder { color: #6b6862; }
    .msg.error { background: rgba(255, 90, 30, .13); border-color: rgba(255, 120, 60, .38); color: #ffb59a; }
    .msg.success { background: rgba(120, 200, 90, .13); border-color: rgba(140, 220, 110, .32); color: #b7e39b; }
    .verify-panel { background: rgba(255, 255, 255, .04); border-color: rgba(255, 255, 255, .09); color: #c7c3bc; }
    .verify-panel strong { color: #f5f3ef; }
    .step { border-color: rgba(255, 255, 255, .12); color: #8f8c85; background: rgba(255, 255, 255, .03); }
    .step.done { background: #f5f3ef; border-color: #f5f3ef; color: #17181a; }
    .step.now { border-color: var(--signal); color: #ff9a52; background: rgba(255, 77, 0, .13); }
    .localdev { border-bottom-color: rgba(255, 255, 255, .1); }
    .localdev p { color: #8f8c85; }
    .micro { color: #6b6862; }
    .eyebrow { color: #ff7a33; }
    .submit { background: #f5f3ef; color: #17181a; box-shadow: 0 12px 26px rgba(0, 0, 0, .45); }
    .submit:hover { background: #ffffff; box-shadow: 0 16px 30px rgba(0, 0, 0, .5); }
  }
  @media (prefers-reduced-motion: reduce) {
    * { animation: none !important; transition: none !important; }
    .rise { opacity: 1; }
  }
</style>
</head>
<body>
<header class="top">
  <a class="brand" href="/home"><span>Launch<sup>®</sup></span></a>
  <a class="back mono" href="/home">← BACK TO SITE</a>
</header>
<main class="wrap">
  <section class="pitch">
    <p class="eyebrow mono rise">LAUNCH® — AGENT-NATIVE LAUNCH SYSTEM</p>
    <h1 class="rise d1">Launch day,<br />on one <span class="dawn-text">runway.</span></h1>
    <p class="lede rise d2">One board where you and your agent draft, lock, adapt and publish every launch post — nothing goes live without your approval.</p>
    <div class="tiles rise d3" aria-hidden="true">
      <span class="tile warm" style="--r:-5deg; left:1%; top:3%; animation-duration:7s"><i></i>X · T−0</span>
      <span class="tile" style="--r:3deg; left:30%; top:0; animation-duration:9s"><i></i>LOCKED</span>
      <span class="tile" style="--r:-2deg; left:57%; top:7%; animation-duration:8s"><i></i>PH · T+5M</span>
      <span class="tile warm" style="--r:4deg; right:1%; top:1%; animation-duration:10s"><i></i>ADAPT</span>
      <span class="tile" style="--r:2deg; left:10%; top:41%; animation-duration:8.5s"><i></i>COMMUNITY · T−15H</span>
      <span class="tile" style="--r:-3deg; left:48%; top:39%; animation-duration:7.5s"><i></i>REJECTED_MUTATION</span>
      <span class="tile" style="--r:5deg; right:5%; top:43%; animation-duration:9.5s"><i></i>A2A</span>
      <span class="tile warm" style="--r:2deg; left:38%; top:75%; animation-duration:8s"><i></i>APPROVE</span>
    </div>
    <div class="rule mono rise d4"><span>LOCK → ADAPT → APPROVE → PUBLISH</span><span>T−15H → T+1H · ONE BOARD</span></div>
  </section>
  <section class="authcol">
    <div class="card rise d2">
      <div class="localdev" id="local-dev-block" hidden>
        <button type="button" class="submit" id="local-dev-btn" style="margin-top:0">Continue as local dev</button>
        <p>Only works in local development on this computer.</p>
        <p class="msg" id="ld-msg"></p>
      </div>
      <h2 id="card-title">Welcome to Launch</h2>
      <p class="sub" id="card-sub">Sign in or create your account</p>
      <div class="tabs" id="tabs">
        <button type="button" class="tab active" id="tab-signup">Create account</button>
        <button type="button" class="tab" id="tab-login">Sign in</button>
      </div>
      <form class="view" id="signup-form" novalidate>
        <label for="s-email">Email</label>
        <input id="s-email" type="email" autocomplete="email" placeholder="you@example.com" required />
        <label for="s-pass">Password</label>
        <input id="s-pass" type="password" autocomplete="new-password" placeholder="At least 12 characters" required minlength="12" maxlength="128" />
        <label for="s-pass2">Confirm password</label>
        <input id="s-pass2" type="password" autocomplete="new-password" placeholder="Confirm password" required minlength="12" maxlength="128" />
        <button type="submit" class="submit" id="s-btn">Create account</button>
        <p class="msg" id="s-msg"></p>
      </form>
      <form class="view" id="login-form" hidden novalidate>
        <label for="l-email">Email</label>
        <input id="l-email" type="email" autocomplete="email" placeholder="you@example.com" required />
        <label for="l-pass">Password</label>
        <input id="l-pass" type="password" autocomplete="current-password" placeholder="Enter password" required />
        <button type="submit" class="submit" id="l-btn">Sign in</button>
        <p class="msg" id="l-msg"></p>
        <p class="row-right"><button type="button" class="link" id="forgot-link">Forgot password?</button></p>
      </form>
      <form class="view" id="forgot-form" hidden novalidate>
        <label for="f-email">Email</label>
        <input id="f-email" type="email" autocomplete="email" placeholder="you@example.com" required />
        <button type="submit" class="submit" id="f-btn">Send reset link</button>
        <p class="msg" id="f-msg"></p>
        <p class="row-center"><button type="button" class="link" id="back-to-login">Back to sign in</button></p>
      </form>
      <div class="view" id="verify-view" hidden>
        <div class="steps">
          <span class="step done">1 · ACCOUNT</span><span class="step now">2 · VERIFY</span><span class="step">3 · START</span>
        </div>
        <div class="verify-panel">
          <p class="kicker">VERIFICATION EMAIL SENT</p>
          <p>We sent a secure link to <strong id="verify-email"></strong>. Click it, return here, and this page will finish signing you in automatically.</p>
        </div>
        <button type="button" class="submit" id="verify-continue">Continue</button>
        <p class="msg" id="v-msg"></p>
        <p class="row-center">
          <button type="button" class="link" id="resend-verification">Resend email</button>
          <button type="button" class="link" id="back-to-signup">Back</button>
        </p>
      </div>
      <form class="view" id="twofa-form" hidden novalidate>
        <label for="two-factor-code">Authentication code</label>
        <input id="two-factor-code" class="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,8}" maxlength="8" placeholder="000000" required />
        <button type="submit" class="submit" id="t-btn">Verify code</button>
        <p class="msg" id="t-msg"></p>
        <p class="row-center"><button type="button" class="link" id="twofa-back">Back to sign in</button></p>
      </form>
    </div>
    <p class="micro mono rise d5">LOCKED MEANS LOCKED — NOTHING PUBLISHES WITHOUT YOUR APPROVAL</p>
  </section>
</main>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(window.location.search);

  function safePath(raw) {
    if (!raw) return null;
    if (raw.charAt(0) !== "/" || raw.charAt(1) === "/") return null;
    if (raw.indexOf("\\\\") !== -1) return null;
    return raw;
  }
  function resume() {
    return safePath(params.get("c")) || safePath(params.get("return")) || "/dashboard";
  }
  function goApp() { window.location.href = resume(); }
  function callbackURL() { return window.location.origin + resume(); }

  function api(path, opts) {
    opts = opts || {};
    opts.credentials = "include";
    return fetch(path, opts).then(function (res) {
      return res.json().then(function (data) {
        return { ok: res.ok, status: res.status, data: data || {} };
      }).catch(function () {
        return { ok: res.ok, status: res.status, data: {} };
      });
    });
  }
  function errText(data, fallback) {
    var c = data && (data.error != null ? data.error : data.message);
    if (typeof c !== "string" || !c.trim()) return fallback;
    var m = c.trim();
    if (/failed query|database|relation .* does not exist|column .* does not exist|syntax error|constraint|connection refused|econn|timeout|insert into|delete from/i.test(m)) return fallback;
    return m;
  }
  function setMsg(id, kind, text) {
    var el = $(id);
    if (!text) { el.className = "msg"; el.textContent = ""; return; }
    el.className = "msg show " + kind;
    el.textContent = text;
  }
  function busy(btn, on, busyText) {
    if (on) {
      btn.setAttribute("data-label", btn.textContent);
      btn.disabled = true;
      btn.textContent = busyText;
    } else {
      btn.disabled = false;
      btn.textContent = btn.getAttribute("data-label") || btn.textContent;
    }
  }
  function validEmail(e) {
    if (!e || e.indexOf(" ") !== -1) return false;
    var parts = e.split("@");
    return parts.length === 2 && parts[0].length > 0 && parts[1].indexOf(".") > 0;
  }
  function norm(e) { return (e || "").trim().toLowerCase(); }

  var TITLES = {
    signup: ["Welcome to Launch", "Sign in or create your account"],
    login: ["Welcome to Launch", "Sign in or create your account"],
    forgot: ["Reset your password", "We will email you a secure reset link."],
    verify: ["Check your email", "One more step to finish creating your account."],
    twofa: ["Two-factor authentication", "Enter the code from your authenticator app."]
  };
  var VIEWS = { signup: "signup-form", login: "login-form", forgot: "forgot-form", verify: "verify-view", twofa: "twofa-form" };
  var current = "signup";
  var probeTimer = null;

  function show(view) {
    current = view;
    for (var k in VIEWS) { $(VIEWS[k]).hidden = k !== view; }
    $("tabs").style.display = view === "signup" || view === "login" ? "flex" : "none";
    $("tab-signup").className = "tab" + (view === "signup" ? " active" : "");
    $("tab-login").className = "tab" + (view === "login" ? " active" : "");
    $("card-title").textContent = TITLES[view][0];
    $("card-sub").textContent = TITLES[view][1];
    if (view !== "verify") stopProbe();
  }
  $("tab-signup").addEventListener("click", function () { show("signup"); });
  $("tab-login").addEventListener("click", function () { show("login"); });
  $("forgot-link").addEventListener("click", function () {
    var e = norm($("l-email").value);
    if (e) $("f-email").value = e;
    setMsg("f-msg", "", "");
    show("forgot");
  });
  $("back-to-login").addEventListener("click", function () { show("login"); });
  $("twofa-back").addEventListener("click", function () { show("login"); });
  $("back-to-signup").addEventListener("click", function () { show("signup"); });

  /* ---------- sign up ---------- */
  var pendingEmail = "";
  var pendingPassword = "";
  var resendUntil = 0;

  $("signup-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = norm($("s-email").value);
    var pass = $("s-pass").value;
    var pass2 = $("s-pass2").value;
    if (!validEmail(email)) { setMsg("s-msg", "error", "Enter a valid email address."); return; }
    if (pass.length < 12) { setMsg("s-msg", "error", "Password must be at least 12 characters."); return; }
    if (pass !== pass2) { setMsg("s-msg", "error", "Passwords don't match."); return; }
    var btn = $("s-btn");
    busy(btn, true, "Creating account…");
    setMsg("s-msg", "", "");
    api("/_agent-native/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass, callbackURL: callbackURL() })
    }).then(function (r) {
      if (!r.ok) {
        busy(btn, false);
        setMsg("s-msg", "error", errText(r.data, "We couldn't create your account. Please try again."));
        return null;
      }
      return api("/_agent-native/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pass })
      });
    }).then(function (r) {
      if (!r) return;
      busy(btn, false);
      if (r.ok) {
        setMsg("s-msg", "success", "Account created — signing you in…");
        goApp();
        return;
      }
      var text = errText(r.data, "We couldn't create your account. Please try again.");
      if (r.status === 403 && /not verified|verification/i.test(text)) {
        enterVerify(email, pass);
        return;
      }
      setMsg("s-msg", "error", text);
    }).catch(function () {
      busy(btn, false);
      setMsg("s-msg", "error", "Network error — please try again.");
    });
  });

  /* ---------- email verification step ---------- */
  function enterVerify(email, pass) {
    pendingEmail = email;
    pendingPassword = pass || "";
    try { sessionStorage.setItem("launch.pendingEmail", email); } catch (e) {}
    $("verify-email").textContent = email;
    setMsg("v-msg", "", "");
    show("verify");
    startProbe();
  }
  function startProbe() {
    stopProbe();
    probeTimer = window.setInterval(probeSession, 2500);
  }
  function stopProbe() {
    if (probeTimer !== null) { window.clearInterval(probeTimer); probeTimer = null; }
  }
  function probeSession() {
    if (current !== "verify" || document.visibilityState === "hidden") return;
    api("/_agent-native/auth/session", { headers: { Accept: "application/json" }, cache: "no-store" }).then(function (r) {
      if (r.ok && typeof r.data.email === "string" && !r.data.error) { stopProbe(); goApp(); }
    }).catch(function () {});
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") probeSession();
  });
  window.addEventListener("focus", probeSession);

  $("verify-continue").addEventListener("click", function () {
    var btn = $("verify-continue");
    busy(btn, true, "Checking…");
    setMsg("v-msg", "success", "Checking verification…");
    api("/_agent-native/auth/session", { headers: { Accept: "application/json" }, cache: "no-store" }).then(function (r) {
      if (r.ok && typeof r.data.email === "string" && !r.data.error) { busy(btn, false); goApp(); return null; }
      var email = pendingEmail;
      try { email = email || sessionStorage.getItem("launch.pendingEmail") || ""; } catch (e) {}
      if (!email || !pendingPassword) {
        busy(btn, false);
        if (email) $("l-email").value = email;
        show("login");
        setMsg("l-msg", "success", "Email verified — enter your password to finish signing in.");
        return null;
      }
      return api("/_agent-native/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, password: pendingPassword })
      }).then(function (lr) {
        busy(btn, false);
        if (lr.ok) { goApp(); return; }
        var text = errText(lr.data, "We couldn't finish signing you in.");
        if (/not verified|verification/i.test(text)) {
          setMsg("v-msg", "error", "Still waiting for verification — click the link in your email, then press Continue again.");
        } else {
          if (email) $("l-email").value = email;
          show("login");
          setMsg("l-msg", "success", "Email verified — enter your password to finish signing in.");
        }
      });
    }).catch(function () {
      busy(btn, false);
      setMsg("v-msg", "error", "Network error — please try again.");
    });
  });

  $("resend-verification").addEventListener("click", function () {
    var now = Date.now();
    if (now < resendUntil) return;
    var email = pendingEmail;
    try { email = email || sessionStorage.getItem("launch.pendingEmail") || ""; } catch (e) {}
    if (!email) return;
    var btn = $("resend-verification");
    btn.disabled = true;
    api("/_agent-native/auth/ba/send-verification-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, callbackURL: callbackURL() })
    }).then(function (r) {
      if (r.ok) {
        setMsg("v-msg", "success", "Verification email sent.");
        resendUntil = Date.now() + 60000;
        tickResend(btn);
      } else {
        btn.disabled = false;
        setMsg("v-msg", "error", errText(r.data, "Couldn't resend the email. Please try again."));
      }
    }).catch(function () {
      btn.disabled = false;
      setMsg("v-msg", "error", "Network error — please try again.");
    });
  });
  function tickResend(btn) {
    var left = Math.ceil((resendUntil - Date.now()) / 1000);
    if (left <= 0) { btn.disabled = false; btn.textContent = "Resend email"; return; }
    btn.textContent = "Resend email (" + left + "s)";
    window.setTimeout(function () { tickResend(btn); }, 1000);
  }

  /* ---------- sign in ---------- */
  $("login-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = norm($("l-email").value);
    var pass = $("l-pass").value;
    if (!validEmail(email)) { setMsg("l-msg", "error", "Enter a valid email address."); return; }
    var btn = $("l-btn");
    busy(btn, true, "Signing in…");
    setMsg("l-msg", "", "");
    api("/_agent-native/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, password: pass })
    }).then(function (r) {
      busy(btn, false);
      if (r.ok) {
        if (r.data.twoFactorRedirect === true) { $("two-factor-code").value = ""; show("twofa"); return; }
        goApp();
        return;
      }
      setMsg("l-msg", "error", errText(r.data, "Invalid email or password."));
    }).catch(function () {
      busy(btn, false);
      setMsg("l-msg", "error", "Network error — please try again.");
    });
  });

  /* ---------- two factor ---------- */
  $("twofa-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var code = $("two-factor-code").value.trim();
    if (!/^[0-9]{6,8}$/.test(code)) { setMsg("t-msg", "error", "Enter the 6–8 digit code from your authenticator app."); return; }
    var btn = $("t-btn");
    busy(btn, true, "Verifying…");
    setMsg("t-msg", "", "");
    api("/_agent-native/auth/two-factor/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code })
    }).then(function (r) {
      busy(btn, false);
      if (r.ok && r.data.ok === true) { goApp(); return; }
      setMsg("t-msg", "error", errText(r.data, "That code didn't work. Please try again."));
    }).catch(function () {
      busy(btn, false);
      setMsg("t-msg", "error", "Network error — please try again.");
    });
  });

  /* ---------- forgot password ---------- */
  $("forgot-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = norm($("f-email").value);
    if (!validEmail(email)) { setMsg("f-msg", "error", "Enter a valid email address."); return; }
    var btn = $("f-btn");
    busy(btn, true, "Sending…");
    setMsg("f-msg", "", "");
    api("/_agent-native/auth/ba/request-password-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email })
    }).then(function (r) {
      busy(btn, false);
      if (r.ok) { setMsg("f-msg", "success", "Reset link sent — check your email."); return; }
      setMsg("f-msg", "error", errText(r.data, "Couldn't send the reset link. Please try again."));
    }).catch(function () {
      busy(btn, false);
      setMsg("f-msg", "error", "Network error — please try again.");
    });
  });

  /* ---------- local dev (this machine only) ---------- */
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    $("local-dev-block").hidden = false;
    $("local-dev-btn").addEventListener("click", function () {
      var btn = $("local-dev-btn");
      busy(btn, true, "Signing in…");
      api("/_agent-native/auth/local-dev", { method: "POST", headers: { Accept: "application/json" } }).then(function (r) {
        if (r.ok) { goApp(); return; }
        busy(btn, false);
        setMsg("ld-msg", "error", "Local dev sign-in failed on this machine.");
      }).catch(function () {
        busy(btn, false);
        setMsg("ld-msg", "error", "Local dev sign-in failed on this machine.");
      });
    });
  }

  /* ---------- boot: already signed in? verified return? ---------- */
  if (params.get("c") || params.get("return")) show("login");
  if (params.get("verified") === "1") {
    show("login");
    setMsg("l-msg", "success", "Email verified — finishing your sign in…");
    api("/_agent-native/auth/session", { headers: { Accept: "application/json" }, cache: "no-store" }).then(function (r) {
      if (r.ok && typeof r.data.email === "string" && !r.data.error) { goApp(); return; }
      setMsg("l-msg", "success", "Email verified — enter your password to finish signing in.");
    }).catch(function () {});
  } else {
    api("/_agent-native/auth/session", { headers: { Accept: "application/json" }, cache: "no-store" }).then(function (r) {
      if (r.ok && typeof r.data.email === "string" && !r.data.error) goApp();
    }).catch(function () {});
  }
})();
</script>
</body>
</html>
`;
