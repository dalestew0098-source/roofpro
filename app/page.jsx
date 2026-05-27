export default function Home() {
  const html = `export default function Home() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RoofPro — Free Roofing Estimate Generator for Contractors</title>
  <meta name="description" content="Free roofing estimate and invoice generator built for roofing contractors. Roof calculator, pitch factor, markup tool, PDF quotes. No sign up. Works on your phone."/>
  <meta name="keywords" content="roofing estimate generator, roofing quote app, free roofing invoice, roofing contractor software, roof estimate template"/>
  <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  <style>
    :root {
      --bg:      #111418;
      --surface: #181C22;
      --border:  #252B35;
      --border2: #2E3545;
      --muted:   #5A6478;
      --soft:    #8796AA;
      --text:    #D0D8E4;
      --bright:  #EEF2F8;
      --accent:  #E07B2A;
      --accent-dim: #3A2010;
      --green:   #22C55E;
      --mono:    'IBM Plex Mono', 'Courier New', monospace;
      --sans:    'DM Sans', system-ui, sans-serif;
      --display: 'Barlow Condensed', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { font-family: var(--sans); background: var(--bg); color: var(--text); overflow-x: hidden; }

    /* NAV */
    nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      display: flex; justify-content: space-between; align-items: center;
      padding: 0 24px; height: 52px;
      background: rgba(17,20,24,0.95); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .nav-logo {
      display: flex; align-items: center; gap: 10px;
    }
    .nav-icon {
      width: 26px; height: 26px; background: var(--accent);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .nav-wordmark {
      font-family: var(--display); font-weight: 800; font-size: 16px;
      letter-spacing: 0.12em; color: var(--bright); text-transform: uppercase;
    }
    .nav-cta {
      background: var(--accent); color: #fff; border: none;
      font-family: var(--display); font-weight: 800; font-size: 12px;
      letter-spacing: 0.14em; padding: 0 18px; height: 34px;
      cursor: pointer; text-decoration: none; text-transform: uppercase;
      display: inline-flex; align-items: center;
    }

    /* HERO */
    .hero {
      min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
      padding: 100px 24px 80px; position: relative; overflow: hidden;
    }
    .hero-grid {
      position: absolute; inset: 0; z-index: 0; opacity: 0.025;
      background-image: linear-gradient(var(--bright) 1px, transparent 1px),
                        linear-gradient(90deg, var(--bright) 1px, transparent 1px);
      background-size: 48px 48px;
    }
    .hero-glow {
      position: absolute; right: -10%; top: 20%; width: 500px; height: 500px;
      background: radial-gradient(circle, #E07B2A0D 0%, transparent 70%); z-index: 0;
    }
    .hero-content { position: relative; z-index: 1; max-width: 680px; }
    .hero-tag {
      display: inline-flex; align-items: center; gap: 8px;
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em;
      color: var(--accent); border: 1px solid var(--accent-dim);
      background: var(--accent-dim); padding: 5px 12px; margin-bottom: 24px;
      text-transform: uppercase;
    }
    .hero-tag::before { content: ""; width: 6px; height: 6px; background: var(--accent); display: block; }
    h1 {
      font-family: var(--display); font-weight: 900;
      font-size: clamp(52px, 11vw, 96px); line-height: 0.92;
      letter-spacing: -0.01em; text-transform: uppercase;
      color: var(--bright); margin-bottom: 24px;
    }
    h1 em { color: var(--accent); font-style: normal; display: block; }
    .hero-sub {
      font-size: clamp(15px, 2vw, 18px); color: var(--soft); line-height: 1.65;
      max-width: 500px; margin-bottom: 36px; font-weight: 400;
    }
    .hero-sub strong { color: var(--text); font-weight: 600; }
    .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 40px; }
    .btn-primary {
      background: var(--accent); color: #fff; border: none;
      font-family: var(--display); font-weight: 800; font-size: 14px;
      letter-spacing: 0.14em; text-transform: uppercase;
      padding: 0 28px; height: 48px; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center;
    }
    .btn-ghost {
      background: none; color: var(--soft); border: 1px solid var(--border2);
      font-family: var(--display); font-weight: 700; font-size: 14px;
      letter-spacing: 0.14em; text-transform: uppercase;
      padding: 0 28px; height: 48px; cursor: pointer; text-decoration: none;
      display: inline-flex; align-items: center;
    }
    .proof-row {
      display: flex; align-items: center; gap: 0; flex-wrap: wrap;
      border: 1px solid var(--border); background: var(--surface);
    }
    .proof-item {
      font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em;
      color: var(--muted); padding: 10px 16px; border-right: 1px solid var(--border);
      display: flex; align-items: center; gap: 7px; white-space: nowrap;
    }
    .proof-item::before { content: ""; width: 5px; height: 5px; background: var(--green); flex-shrink: 0; }
    .proof-item:last-child { border-right: none; }

    /* TICKER */
    .ticker { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 0; overflow: hidden; white-space: nowrap; height: 38px; display: flex; align-items: center; }
    .ticker-inner { display: inline-flex; gap: 0; animation: ticker 30s linear infinite; }
    .ticker-item { font-family: var(--mono); font-weight: 500; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding: 0 28px; border-right: 1px solid var(--border); height: 38px; display: flex; align-items: center; }
    .ticker-item.accent { color: var(--accent); }
    @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }

    /* SECTIONS */
    section { padding: 80px 24px; }
    .container { max-width: 960px; margin: 0 auto; }
    .sec-label {
      font-family: var(--mono); font-size: 9px; letter-spacing: 0.22em;
      color: var(--accent); text-transform: uppercase; margin-bottom: 14px;
      display: flex; align-items: center; gap: 10px;
    }
    .sec-label::before { content: ""; width: 20px; height: 2px; background: var(--accent); }
    h2 {
      font-family: var(--display); font-weight: 900;
      font-size: clamp(38px, 6vw, 64px); line-height: 0.95;
      letter-spacing: -0.01em; text-transform: uppercase;
      color: var(--bright); margin-bottom: 16px;
    }
    h2 em { color: var(--accent); font-style: normal; }
    .sec-sub { font-size: 16px; color: var(--muted); line-height: 1.6; max-width: 500px; margin-bottom: 48px; }

    /* PROBLEM */
    .problem { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .problem-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 40px; }
    .problem-item { background: var(--surface); padding: 28px 22px; }
    .problem-num { font-family: var(--mono); font-size: 9px; color: var(--accent); letter-spacing: 0.15em; margin-bottom: 14px; }
    .problem-title { font-family: var(--display); font-weight: 700; font-size: 16px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--bright); margin-bottom: 8px; }
    .problem-desc { font-size: 13px; color: var(--muted); line-height: 1.55; }

    /* FEATURES */
    .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 8px; }
    .feature-card { background: var(--bg); padding: 28px 24px; transition: background 0.2s; }
    .feature-card:hover { background: var(--surface); }
    .feature-num { font-family: var(--mono); font-size: 9px; color: var(--accent); letter-spacing: 0.15em; margin-bottom: 16px; }
    .feature-title { font-family: var(--display); font-weight: 800; font-size: 18px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--bright); margin-bottom: 10px; }
    .feature-desc { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 16px; }
    .feature-tag { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--accent); border: 1px solid var(--accent-dim); background: var(--accent-dim); padding: 4px 10px; text-transform: uppercase; display: inline-block; }

    /* HOW */
    .how { background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 40px; }
    .step { background: var(--bg); padding: 28px 22px; }
    .step-num { font-family: var(--display); font-weight: 900; font-size: 52px; color: var(--border2); line-height: 1; margin-bottom: 16px; letter-spacing: -0.02em; }
    .step-title { font-family: var(--display); font-weight: 800; font-size: 16px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--bright); margin-bottom: 8px; }
    .step-desc { font-size: 13px; color: var(--muted); line-height: 1.55; }

    /* SPECS */
    .specs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-top: 40px; }
    .spec-card { background: var(--surface); padding: 20px 16px; }
    .spec-value { font-family: var(--display); font-weight: 900; font-size: 32px; color: var(--accent); letter-spacing: 0.02em; line-height: 1; margin-bottom: 6px; }
    .spec-label { font-family: var(--mono); font-size: 9px; color: var(--muted); letter-spacing: 0.14em; text-transform: uppercase; }

    /* COMPARE */
    .compare-table { width: 100%; border-collapse: collapse; margin-top: 40px; border: 1px solid var(--border); }
    .compare-table th { font-family: var(--mono); font-weight: 500; font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase; padding: 14px 16px; text-align: left; background: var(--surface); border-bottom: 1px solid var(--border); color: var(--muted); }
    .compare-table th.hl { color: var(--accent); background: var(--accent-dim); }
    .compare-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--border); color: var(--text); }
    .compare-table td.hl { background: #1A1208; }
    .compare-table tr:last-child td { border-bottom: none; }
    .check { font-family: var(--mono); color: var(--green); font-size: 12px; }
    .cross { font-family: var(--mono); color: var(--border2); font-size: 12px; }

    /* FAQ */
    .faq-list { margin-top: 40px; display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
    .faq-item { background: var(--surface); }
    .faq-q { width: 100%; text-align: left; background: none; border: none; color: var(--text); font-family: var(--sans); font-weight: 600; font-size: 14px; padding: 18px 20px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .faq-q::after { content: "+"; font-family: var(--mono); color: var(--accent); font-size: 18px; flex-shrink: 0; }
    .faq-q.open::after { content: "−"; }
    .faq-a { display: none; padding: 0 20px 18px; font-size: 13px; color: var(--muted); line-height: 1.7; }
    .faq-a.open { display: block; }

    /* CTA */
    .cta-section { background: var(--accent); padding: 72px 24px; }
    .cta-section h2 { color: #fff; }
    .cta-section p { color: rgba(255,255,255,0.75); font-size: 17px; margin: 12px 0 32px; line-height: 1.6; }
    .btn-white { background: #fff; color: var(--accent); font-family: var(--display); font-weight: 900; font-size: 14px; letter-spacing: 0.14em; text-transform: uppercase; padding: 0 36px; height: 52px; text-decoration: none; display: inline-flex; align-items: center; border: none; cursor: pointer; }
    .cta-meta { font-family: var(--mono); font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 0.12em; margin-top: 18px; }

    /* FOOTER */
    footer { background: var(--bg); border-top: 1px solid var(--border); padding: 28px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .footer-brand { font-family: var(--display); font-weight: 800; font-size: 14px; letter-spacing: 0.1em; color: var(--muted); text-transform: uppercase; }
    .footer-meta { font-family: var(--mono); font-size: 9px; color: var(--border2); letter-spacing: 0.1em; text-transform: uppercase; }

    @media(max-width:600px) {
      .hero { padding: 90px 18px 60px; }
      section { padding: 56px 18px; }
      .steps { grid-template-columns: 1fr; }
      .compare-table { font-size: 12px; }
      .compare-table th, .compare-table td { padding: 10px 12px; }
      .proof-row { flex-wrap: nowrap; overflow-x: auto; }
    }
  </style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-logo">
    <div class="nav-icon">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M0 10L6 1L12 10H0Z" fill="white"/></svg>
    </div>
    <span class="nav-wordmark">RoofPro</span>
  </div>
  <a href="https://roofpro-mauve.vercel.app/tool" class="nav-cta">Open App</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-glow"></div>
  <div class="hero-content">
    <div class="hero-tag">Built for roofing contractors</div>
    <h1>Win more jobs.<br/><em>Send faster estimates.</em></h1>
    <p class="hero-sub">
      <strong>RoofPro</strong> is a free roofing estimate and invoice generator. Enter your sqft, pick your pitch, tap a template — professional PDF in 30 seconds. No account. No ads.
    </p>
    <div class="hero-actions">
      <a href="https://roofpro-mauve.vercel.app/tool" class="btn-primary">Create your first estimate</a>
      <a href="#how" class="btn-ghost">See how it works</a>
    </div>
    <div class="proof-row">
      <div class="proof-item">100% FREE</div>
      <div class="proof-item">NO ACCOUNT</div>
      <div class="proof-item">WORKS ON PHONE</div>
      <div class="proof-item">PDF IN ONE TAP</div>
    </div>
  </div>
</section>

<!-- TICKER -->
<div class="ticker">
  <div class="ticker-inner">
    <div class="ticker-item">SHINGLE ESTIMATES</div>
    <div class="ticker-item accent">ROOF CALCULATOR</div>
    <div class="ticker-item">PITCH FACTOR</div>
    <div class="ticker-item accent">MARKUP TOOL</div>
    <div class="ticker-item">PDF INVOICES</div>
    <div class="ticker-item accent">WARRANTY BUILDER</div>
    <div class="ticker-item">SAVED CLIENTS</div>
    <div class="ticker-item accent">FREE FOREVER</div>
    <div class="ticker-item">SHINGLE ESTIMATES</div>
    <div class="ticker-item accent">ROOF CALCULATOR</div>
    <div class="ticker-item">PITCH FACTOR</div>
    <div class="ticker-item accent">MARKUP TOOL</div>
    <div class="ticker-item">PDF INVOICES</div>
    <div class="ticker-item accent">WARRANTY BUILDER</div>
    <div class="ticker-item">SAVED CLIENTS</div>
    <div class="ticker-item accent">FREE FOREVER</div>
  </div>
</div>

<!-- PROBLEM -->
<section class="problem">
  <div class="container">
    <div class="sec-label">The problem</div>
    <h2>Every roofer<br/>knows <em>this pain</em></h2>
    <p class="sec-sub">Generic tools were not built for roofing. You waste time on things that should take seconds.</p>
    <div class="problem-grid">
      <div class="problem-item">
        <div class="problem-num">01 / PROBLEM</div>
        <div class="problem-title">Hand-writing on site</div>
        <div class="problem-desc">Scribbled on paper or texted from notes. Looks unprofessional. Clients do not trust it.</div>
      </div>
      <div class="problem-item">
        <div class="problem-num">02 / PROBLEM</div>
        <div class="problem-title">Slow quotes lose jobs</div>
        <div class="problem-desc">The roofer who sends a clean PDF first usually wins. Every hour you wait costs you money.</div>
      </div>
      <div class="problem-item">
        <div class="problem-num">03 / PROBLEM</div>
        <div class="problem-title">Manual sqft math</div>
        <div class="problem-desc">Calculating squares by hand, guessing pitch factor, forgetting waste. Easy to get wrong.</div>
      </div>
      <div class="problem-item">
        <div class="problem-num">04 / PROBLEM</div>
        <div class="problem-title">Underpricing materials</div>
        <div class="problem-desc">No markup calculator means you guess your margin and often leave money on the table.</div>
      </div>
    </div>
  </div>
</section>

<!-- FEATURES -->
<section>
  <div class="container">
    <div class="sec-label">What you get</div>
    <h2>Built for <em>roofers</em>,<br/>not everyone</h2>
    <p class="sec-sub">Every feature exists because a roofing contractor needs it specifically.</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-num">01 / FEATURE</div>
        <div class="feature-title">Roof Calculator</div>
        <div class="feature-desc">Enter footprint sqft and roof pitch. Actual roof area and squares needed calculate instantly. Material cost estimates for 6 types shown automatically.</div>
        <span class="feature-tag">No more manual math</span>
      </div>
      <div class="feature-card">
        <div class="feature-num">02 / FEATURE</div>
        <div class="feature-title">Pitch Factor</div>
        <div class="feature-desc">7 pitch options from flat to extreme 12/12. The calculator applies the correct multiplier so your material quantities are always accurate.</div>
        <span class="feature-tag">Flat to 12/12</span>
      </div>
      <div class="feature-card">
        <div class="feature-num">03 / FEATURE</div>
        <div class="feature-title">Markup Mode</div>
        <div class="feature-desc">Enter your cost price, set your markup percent. Sell price and exact materials margin calculate in real time on every line item.</div>
        <span class="feature-tag">Never underprice again</span>
      </div>
      <div class="feature-card">
        <div class="feature-num">04 / FEATURE</div>
        <div class="feature-title">Templates</div>
        <div class="feature-desc">Shingle Replace, Flat/TPO, Repair, and Metal Roof templates fill in all line items instantly. Start a complete estimate in under 10 seconds.</div>
        <span class="feature-tag">Saves 5 min per quote</span>
      </div>
      <div class="feature-card">
        <div class="feature-num">05 / FEATURE</div>
        <div class="feature-title">Professional PDF</div>
        <div class="feature-desc">Branded estimate with your license number, insurance, warranty, and signature lines. Looks like a real trade document. One tap to save and send.</div>
        <span class="feature-tag">Looks legit</span>
      </div>
      <div class="feature-card">
        <div class="feature-num">06 / FEATURE</div>
        <div class="feature-title">Saved Clients</div>
        <div class="feature-desc">Every client is stored automatically. Tap their name and all details autofill. Repeat jobs take seconds from start to sent PDF.</div>
        <span class="feature-tag">Repeat jobs 10x faster</span>
      </div>
    </div>
  </div>
</section>

<!-- HOW -->
<section class="how" id="how">
  <div class="container">
    <div class="sec-label">How it works</div>
    <h2>Estimate sent<br/>in <em>30 seconds</em></h2>
    <div class="steps">
      <div class="step">
        <div class="step-num">01</div>
        <div class="step-title">Enter the sqft</div>
        <div class="step-desc">Type the building footprint and select the roof pitch. Area, squares, and material costs calculate instantly.</div>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <div class="step-title">Pick a template</div>
        <div class="step-desc">Choose Shingle Replace, Flat/TPO, Repair, or Metal. All line items populate immediately with standard rates.</div>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-title">Set your markup</div>
        <div class="step-desc">Toggle markup mode, enter your material cost, set your percent. Sell price and margin show in real time.</div>
      </div>
      <div class="step">
        <div class="step-num">04</div>
        <div class="step-title">Send the PDF</div>
        <div class="step-desc">Tap Preview then Save as PDF. A professional branded estimate in your client's hands before you leave the site.</div>
      </div>
    </div>
  </div>
</section>

<!-- SPECS -->
<section>
  <div class="container">
    <div class="sec-label">By the numbers</div>
    <h2>Built to work<br/>on the <em>job site</em></h2>
    <div class="specs-grid">
      <div class="spec-card"><div class="spec-value">30s</div><div class="spec-label">Estimate time</div></div>
      <div class="spec-card"><div class="spec-value">7</div><div class="spec-label">Pitch options</div></div>
      <div class="spec-card"><div class="spec-value">6</div><div class="spec-label">Material types</div></div>
      <div class="spec-card"><div class="spec-value">4</div><div class="spec-label">Job templates</div></div>
      <div class="spec-card"><div class="spec-value">$0</div><div class="spec-label">Cost forever</div></div>
      <div class="spec-card"><div class="spec-value">0</div><div class="spec-label">Sign-ups needed</div></div>
    </div>
  </div>
</section>

<!-- COMPARE -->
<section style="background: var(--surface); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);">
  <div class="container">
    <div class="sec-label">Comparison</div>
    <h2>Why not just<br/>use <em>Excel?</em></h2>
    <div style="overflow-x:auto">
      <table class="compare-table">
        <thead>
          <tr>
            <th>Feature</th>
            <th class="hl">RoofPro</th>
            <th>Excel / Word</th>
            <th>Generic apps</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Works on your phone</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="check">YES</span></td></tr>
          <tr><td>Roof sqft calculator</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="cross">NO</span></td></tr>
          <tr><td>Pitch factor built in</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="cross">NO</span></td></tr>
          <tr><td>Materials markup calculator</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="cross">NO</span></td></tr>
          <tr><td>Roofing job templates</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="cross">NO</span></td></tr>
          <tr><td>License and insurance on PDF</td><td class="hl"><span class="check">YES</span></td><td><span class="cross">NO</span></td><td><span class="cross">NO</span></td></tr>
          <tr><td>Free forever</td><td class="hl"><span class="check">YES</span></td><td><span class="check">YES</span></td><td><span class="cross">NO</span></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<!-- FAQ -->
<section>
  <div class="container">
    <div class="sec-label">FAQ</div>
    <h2>Questions<br/><em>answered</em></h2>
    <div class="faq-list">
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Is it really free?</button><div class="faq-a">Yes, completely free. No credit card, no trial period, no ads. Unlimited estimates and invoices at no cost, permanently.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Do I need to create an account?</button><div class="faq-a">No account needed. Enter your business details once and start estimating immediately. All data saves automatically in your browser.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Does it work on iPhone and Android?</button><div class="faq-a">Yes. It runs in any mobile browser — Safari, Chrome, Firefox. No app store download needed. Open the URL and use it immediately.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">How does the roof calculator work?</button><div class="faq-a">Enter your building footprint in sqft and select the roof pitch. RoofPro multiplies by the pitch factor to get actual roof surface area, then divides by 100 to get squares. It also shows material cost estimates for 6 types using your default markup.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">How do I send the estimate to my client?</button><div class="faq-a">Tap Preview, then Save as PDF in your browser print dialog. The PDF includes your business details, license and insurance numbers, line items, totals, warranty, and signature lines.</div></div>
      <div class="faq-item"><button class="faq-q" onclick="toggleFaq(this)">Where does my data go?</button><div class="faq-a">Your data stays on your device in your browser's local storage. Nothing is transmitted to a server. Your client information and estimates are completely private to you.</div></div>
    </div>
  </div>
</section>

<!-- CTA -->
<div class="cta-section">
  <div class="container">
    <div class="sec-label" style="color: rgba(255,255,255,0.6);">Get started</div>
    <h2>Your next estimate<br/>takes <em style="color:#fff; -webkit-text-stroke: 1px rgba(255,255,255,0.3);">30 seconds</em></h2>
    <p>Free. No account. Works on your phone right now.</p>
    <a href="https://roofpro-mauve.vercel.app/tool" class="btn-white">Open RoofPro</a>
    <div class="cta-meta">No sign up required · No credit card · No ads · Free forever</div>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <div class="footer-brand">RoofPro</div>
  <div class="footer-meta">Free roofing estimate generator · Built for contractors</div>
</footer>

<script>
  function toggleFaq(btn) {
    const a = btn.nextElementSibling, open = btn.classList.contains('open');
    document.querySelectorAll('.faq-q').forEach(b => { b.classList.remove('open'); b.nextElementSibling.classList.remove('open'); });
    if (!open) { btn.classList.add('open'); a.classList.add('open'); }
  }
</script>
</body>
</html>
`;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
`;
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
