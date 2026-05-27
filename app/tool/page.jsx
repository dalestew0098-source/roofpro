"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

const KEY = "roofpro:data:v2";

const STATUSES = {
  draft:    { label: "DRAFT",    color: "#94A3B8", bg: "#1E2530" },
  sent:     { label: "SENT",     color: "#F59E0B", bg: "#1C1A0F" },
  accepted: { label: "ACCEPTED", color: "#22C55E", bg: "#0D1F12" },
  paid:     { label: "PAID",     color: "#22C55E", bg: "#0D1F12" },
  declined: { label: "DECLINED", color: "#EF4444", bg: "#1F0D0D" },
};

const PITCH_FACTORS = [
  { label: "Flat  1/12",  value: 1.003 },
  { label: "Low   3/12",  value: 1.031 },
  { label: "Std   4/12",  value: 1.054 },
  { label: "Med   6/12",  value: 1.118 },
  { label: "Steep 8/12",  value: 1.202 },
  { label: "V.Steep 10/12", value: 1.302 },
  { label: "Extreme 12/12", value: 1.414 },
];

const MATERIALS = [
  { label: "3-Tab Shingles",       costPer100: 90  },
  { label: "Architectural Shingles", costPer100: 130 },
  { label: "Premium Shingles",     costPer100: 200 },
  { label: "Metal Roofing",        costPer100: 350 },
  { label: "TPO Membrane",         costPer100: 280 },
  { label: "Cedar Shake",          costPer100: 420 },
];

const TEMPLATES = [
  { label: "Shingle Replace", items: [
    { desc: "Architectural Shingles", qty: 1, cost: 130, markup: 35, isMaterial: true },
    { desc: "Tear-off & Disposal",    qty: 1, cost: 150, markup: 0,  isMaterial: false },
    { desc: "Installation Labour",    qty: 1, cost: 280, markup: 0,  isMaterial: false },
    { desc: "Underlayment",           qty: 1, cost: 45,  markup: 30, isMaterial: true },
    { desc: "Ridge Cap & Starter",    qty: 1, cost: 65,  markup: 30, isMaterial: true },
  ]},
  { label: "Flat / TPO", items: [
    { desc: "TPO Membrane",        qty: 1, cost: 280, markup: 35, isMaterial: true },
    { desc: "Tear-off & Disposal", qty: 1, cost: 120, markup: 0,  isMaterial: false },
    { desc: "Installation Labour", qty: 1, cost: 240, markup: 0,  isMaterial: false },
    { desc: "Insulation Board",    qty: 1, cost: 90,  markup: 30, isMaterial: true },
  ]},
  { label: "Repair", items: [
    { desc: "Site Visit & Diagnostic", qty: 1, cost: 95, markup: 0,  isMaterial: false },
    { desc: "Materials",               qty: 1, cost: 80, markup: 35, isMaterial: true },
    { desc: "Repair Labour",           qty: 2, cost: 95, markup: 0,  isMaterial: false },
  ]},
  { label: "Metal Roof", items: [
    { desc: "Metal Panels",        qty: 1, cost: 350, markup: 35, isMaterial: true },
    { desc: "Tear-off & Disposal", qty: 1, cost: 150, markup: 0,  isMaterial: false },
    { desc: "Installation Labour", qty: 1, cost: 380, markup: 0,  isMaterial: false },
    { desc: "Flashing & Trim",     qty: 1, cost: 120, markup: 30, isMaterial: true },
  ]},
];

const DEFAULT_SETTINGS = {
  bizName: "", ownerName: "", email: "", phone: "", address: "",
  taxRate: 0, taxLabel: "Tax", currency: "$",
  terms: "50% deposit required before work begins. Balance due on completion.",
  defaultMarkup: 35, licenseNum: "", insuranceNum: "",
  warranty: "5-year workmanship warranty",
};

const blankDoc = (type, counters, settings) => ({
  id: Date.now().toString(), type,
  number: (type === "quote" ? "EST-" : "INV-") + String((counters[type] || 0) + 1).padStart(4, "0"),
  clientName: "", clientEmail: "", clientAddress: "", jobAddress: "",
  date: new Date().toISOString().slice(0, 10),
  sqft: "", pitchFactor: "1.054",
  items: [{ id: "i" + Date.now(), desc: "", qty: 1, cost: "", markup: settings.defaultMarkup || 35, isMaterial: false }],
  notes: "", taxRate: settings.taxRate, status: "draft",
  warranty: settings.warranty || "5-year workmanship warranty",
});

const itemRate = (it) => {
  if (it.isMaterial && it.cost !== "" && it.cost !== undefined)
    return Number(it.cost) * (1 + (Number(it.markup) || 0) / 100);
  return Number(it.rate ?? it.cost ?? 0);
};

const calcSqs = (sqft, pf) =>
  sqft ? ((Number(sqft) * Number(pf || 1)) / 100).toFixed(1) : null;

// ── Colour tokens ──────────────────────────────────────────────
const C = {
  bg:      "#111418",
  surface: "#181C22",
  border:  "#252B35",
  border2: "#2E3545",
  muted:   "#5A6478",
  soft:    "#8796AA",
  text:    "#D0D8E4",
  bright:  "#EEF2F8",
  accent:  "#E07B2A",   // construction orange
  accentDim: "#3A2010",
  green:   "#22C55E",
  greenDim: "#0D1F12",
  red:     "#EF4444",
  mono:    "'IBM Plex Mono', 'Courier New', monospace",
  sans:    "'DM Sans', system-ui, sans-serif",
  display: "'Barlow Condensed', sans-serif",
};

export default function RoofPro() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [docs, setDocs]         = useState([]);
  const [clients, setClients]   = useState([]);
  const [counters, setCounters] = useState({ quote: 0, invoice: 0 });
  const [loaded, setLoaded]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [view, setView]         = useState("list");
  const [editing, setEditing]   = useState(null);
  const [markupMode, setMarkupMode] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage?.getItem(KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setSettings({ ...DEFAULT_SETTINGS, ...(d.settings || {}) });
        setDocs(d.docs || []);
        setClients(d.clients || []);
        setCounters(d.counters || { quote: 0, invoice: 0 });
        if (!d.settings?.bizName) setView("settings");
      } else { setView("settings"); }
    } catch { setView("settings"); }
    finally { setLoaded(true); }
  }, []);

  const persist = useCallback((s, d, c, cl) => {
    setSaving(true);
    try { window.localStorage?.setItem(KEY, JSON.stringify({ settings: s, docs: d, counters: c, clients: cl })); }
    catch (e) { console.error(e); }
    finally { setTimeout(() => setSaving(false), 500); }
  }, []);

  useEffect(() => { if (loaded) persist(settings, docs, counters, clients); },
    [settings, docs, counters, clients, loaded, persist]);

  const cur = settings.currency || "$";
  const money = (n) => cur + (Number(n) || 0).toFixed(2);

  const totalsOf = (doc) => {
    const sub = (doc.items || []).reduce((a, it) => a + (Number(it.qty) || 0) * itemRate(it), 0);
    const tax = sub * (Number(doc.taxRate) || 0) / 100;
    return { sub, tax, total: sub + tax };
  };

  const stats = useMemo(() => {
    let outstanding = 0, won = 0;
    docs.forEach(d => {
      const { total } = totalsOf(d);
      if (d.status === "sent") outstanding += total;
      if (["accepted", "paid"].includes(d.status)) won += total;
    });
    return { outstanding, won };
  }, [docs]);

  const newDoc  = (type) => { setEditing(blankDoc(type, counters, settings)); setView("edit"); setMarkupMode(false); setCalcOpen(false); };
  const editDoc = (doc)  => { setEditing(JSON.parse(JSON.stringify(doc))); setView("edit"); setMarkupMode(false); setCalcOpen(false); };

  const upsertClient = (e) => {
    const name = e.clientName?.trim(); if (!name) return;
    const rec = { name, email: e.clientEmail || "", address: e.clientAddress || "" };
    const idx = clients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) setClients([rec, ...clients]);
    else setClients(clients.map((c, i) => i === idx ? rec : c));
  };

  const saveDoc = () => {
    if (!editing.clientName?.trim()) { alert("Client name required."); return; }
    const exists = docs.some(d => d.id === editing.id);
    if (exists) { setDocs(docs.map(d => d.id === editing.id ? editing : d)); }
    else { setDocs([editing, ...docs]); setCounters({ ...counters, [editing.type]: (counters[editing.type] || 0) + 1 }); }
    upsertClient(editing); setView("list"); setEditing(null);
  };

  const duplicateDoc = (doc) => {
    const pfx = doc.type === "quote" ? "EST-" : "INV-";
    const copy = { ...JSON.parse(JSON.stringify(doc)), id: Date.now().toString(),
      number: pfx + String((counters[doc.type] || 0) + 1).padStart(4, "0"),
      date: new Date().toISOString().slice(0, 10), status: "draft",
      items: doc.items?.map(it => ({ ...it, id: "i" + Date.now() + Math.random() })),
    };
    setEditing(copy); setView("edit");
  };

  const applyClient   = (c) => setEditing(e => ({ ...e, clientName: c.name, clientEmail: c.email, clientAddress: c.address }));
  const applyTemplate = (tpl) => { setEditing(e => ({ ...e, items: tpl.items.map(it => ({ ...it, id: "i" + Date.now() + Math.random() })) })); setMarkupMode(true); };
  const deleteDoc     = (id) => { if (!window.confirm("Delete document?")) return; setDocs(docs.filter(d => d.id !== id)); setView("list"); };
  const updItem       = (i, f, v) => setEditing({ ...editing, items: editing.items.map((it, idx) => idx === i ? { ...it, [f]: v } : it) });
  const addItem       = () => setEditing({ ...editing, items: [...editing.items, { id: "i" + Date.now(), desc: "", qty: 1, cost: "", markup: settings.defaultMarkup || 35, isMaterial: false }] });
  const rmItem        = (i) => setEditing({ ...editing, items: editing.items.filter((_, idx) => idx !== i) });

  if (!loaded) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.mono, color: C.muted, fontSize: 13, letterSpacing: "0.1em" }}>
      LOADING...
    </div>
  );

  return (
    <div style={{ fontFamily: C.sans, background: C.bg, minHeight: "100vh", color: C.text, maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input,textarea,select,button { font-family: inherit; }
        input:focus,textarea:focus,select:focus { outline: none; border-color: ${C.accent} !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: ${C.surface}; }
        ::-webkit-scrollbar-thumb { background: ${C.border2}; }
        @media print {
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* ── TOP BAR ── */}
      {view !== "preview" && (
        <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", height: 52, background: C.surface, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 10L7 2L13 10H1Z" fill="white"/></svg>
            </div>
            <div>
              <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 16, letterSpacing: "0.08em", color: C.bright, textTransform: "uppercase", lineHeight: 1 }}>
                {settings.bizName || "ROOFPRO"}
              </div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginTop: 1 }}>
                {saving ? "SAVING..." : "SAVED"}
              </div>
            </div>
          </div>
          <button onClick={() => setView("settings")} style={{ background: "none", border: `1px solid ${C.border2}`, color: C.soft, width: 34, height: 34, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="7" cy="7" r="2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.93 2.93l1.41 1.41M9.66 9.66l1.41 1.41M2.93 11.07l1.41-1.41M9.66 4.34l1.41-1.41"/></svg>
          </button>
        </div>
      )}

      {/* ── SETTINGS ── */}
      {view === "settings" && (
        <div style={{ padding: 18 }}>
          <SectionHead label="BUSINESS DETAILS" />
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Printed on every estimate and invoice.</p>
          {[
            ["bizName",      "COMPANY NAME",         "Summit Roofing Co."],
            ["ownerName",    "OWNER / CONTACT",       "Mike Johnson"],
            ["email",        "EMAIL",                 "you@roofing.com"],
            ["phone",        "PHONE",                 "(555) 123-4567"],
            ["address",      "BUSINESS ADDRESS",      "123 Main St, City, State"],
            ["licenseNum",   "LICENSE NUMBER",         "ROC-123456"],
            ["insuranceNum", "INSURANCE POLICY #",    "POL-789012"],
          ].map(([k, label, ph]) => (
            <FField key={k} label={label}>
              <FInput value={settings[k] || ""} placeholder={ph} onChange={v => setSettings({ ...settings, [k]: v })} />
            </FField>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <FField label="TAX LABEL" style={{ flex: 2 }}>
              <FInput value={settings.taxLabel} placeholder="Tax" onChange={v => setSettings({ ...settings, taxLabel: v })} />
            </FField>
            <FField label="TAX %" style={{ flex: 1 }}>
              <FInput value={settings.taxRate} placeholder="0" numeric onChange={v => setSettings({ ...settings, taxRate: v })} />
            </FField>
          </div>
          <FField label="DEFAULT MARKUP %">
            <FInput value={settings.defaultMarkup} placeholder="35" numeric onChange={v => setSettings({ ...settings, defaultMarkup: v })} />
          </FField>
          <FField label="DEFAULT WARRANTY">
            <FInput value={settings.warranty || ""} placeholder="5-year workmanship warranty" onChange={v => setSettings({ ...settings, warranty: v })} />
          </FField>
          <FField label="PAYMENT TERMS">
            <textarea value={settings.terms} rows={2}
              onChange={e => setSettings({ ...settings, terms: e.target.value })}
              style={{ ...inputStyle, resize: "vertical", height: 72 }} />
          </FField>
          <AccentBtn onClick={() => setView("list")} style={{ marginTop: 8 }}>
            {settings.bizName ? "SAVE & CLOSE" : "SAVE & CONTINUE"}
          </AccentBtn>
        </div>
      )}

      {/* ── LIST ── */}
      {view === "list" && (
        <div style={{ padding: 18 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 18, border: `1px solid ${C.border}` }}>
            {[
              { label: "OUTSTANDING", value: money(stats.outstanding), sub: "AWAITING PAYMENT" },
              { label: "WON",         value: money(stats.won),         sub: "ACCEPTED / PAID"  },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface, padding: "14px 16px" }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 22, color: C.bright, letterSpacing: "0.02em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginTop: 4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
            <AccentBtn onClick={() => newDoc("quote")}>+ ESTIMATE</AccentBtn>
            <GhostBtn onClick={() => newDoc("invoice")}>+ INVOICE</GhostBtn>
          </div>

          {/* Doc list */}
          {docs.length === 0 ? (
            <div style={{ border: `1px dashed ${C.border}`, padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>NO DOCUMENTS YET</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>Create your first estimate above.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {docs.map(d => {
                const { total } = totalsOf(d);
                const st = STATUSES[d.status] || STATUSES.draft;
                return (
                  <div key={d.id} onClick={() => editDoc(d)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, letterSpacing: "0.08em" }}>{d.number}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 500, letterSpacing: "0.1em", color: st.color, background: st.bg, padding: "2px 6px" }}>{st.label}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.bright, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {d.clientName || "Untitled"}
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: "0.05em" }}>
                        {d.type === "invoice" ? "INVOICE" : "ESTIMATE"} · {d.date}
                        {d.sqft && ` · ${d.sqft} SQFT`}
                      </div>
                    </div>
                    <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 18, color: C.bright, letterSpacing: "0.02em", flexShrink: 0 }}>
                      {money(total)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EDITOR ── */}
      {view === "edit" && editing && (
        <div style={{ padding: 18 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => { setView("list"); setEditing(null); }}
              style={{ background: "none", border: "none", color: C.soft, cursor: "pointer", fontFamily: C.mono, fontSize: 11, letterSpacing: "0.1em", padding: 0 }}>
              BACK
            </button>
            <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>{editing.number}</span>
          </div>

          <SectionHead label={editing.type === "invoice" ? "INVOICE" : "ESTIMATE"} />

          {/* Saved clients */}
          {clients.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Label>SAVED CLIENTS</Label>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {clients.map(c => (
                  <button key={c.name} onClick={() => applyClient(c)}
                    style={{ background: editing.clientName?.toLowerCase() === c.name.toLowerCase() ? C.accentDim : C.surface,
                      border: `1px solid ${editing.clientName?.toLowerCase() === c.name.toLowerCase() ? C.accent : C.border2}`,
                      color: editing.clientName?.toLowerCase() === c.name.toLowerCase() ? C.accent : C.soft,
                      fontFamily: C.mono, fontSize: 10, letterSpacing: "0.08em", padding: "6px 10px",
                      cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                    {c.name.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Client fields */}
          <FField label="CLIENT NAME">
            <FInput value={editing.clientName} placeholder="Robert Williams" onChange={v => setEditing({ ...editing, clientName: v })} />
          </FField>
          <div style={{ display: "flex", gap: 10 }}>
            <FField label="EMAIL" style={{ flex: 1 }}>
              <FInput value={editing.clientEmail} placeholder="client@email.com" onChange={v => setEditing({ ...editing, clientEmail: v })} />
            </FField>
            <FField label="DATE" style={{ flex: 1 }}>
              <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} style={inputStyle} />
            </FField>
          </div>
          <FField label="JOB ADDRESS">
            <FInput value={editing.jobAddress} placeholder="Property address" onChange={v => setEditing({ ...editing, jobAddress: v })} />
          </FField>

          {/* Roof Calculator */}
          <div style={{ border: `1px solid ${C.border}`, marginBottom: 18 }}>
            <button onClick={() => setCalcOpen(o => !o)}
              style={{ width: "100%", background: C.surface, border: "none", cursor: "pointer", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: C.mono, fontSize: 10, color: C.accent, letterSpacing: "0.15em" }}>ROOF CALCULATOR</span>
              <span style={{ fontFamily: C.mono, fontSize: 14, color: C.muted }}>{calcOpen ? "−" : "+"}</span>
            </button>
            {calcOpen && (
              <div style={{ padding: "14px", borderTop: `1px solid ${C.border}`, background: C.bg }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <FField label="FOOTPRINT SQFT" style={{ flex: 1 }}>
                    <FInput value={editing.sqft} placeholder="2000" numeric onChange={v => setEditing({ ...editing, sqft: v })} />
                  </FField>
                  <FField label="PITCH" style={{ flex: 1 }}>
                    <select value={editing.pitchFactor} onChange={e => setEditing({ ...editing, pitchFactor: e.target.value })} style={{ ...inputStyle, fontFamily: C.mono, fontSize: 11 }}>
                      {PITCH_FACTORS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </FField>
                </div>
                {editing.sqft && (() => {
                  const actualSqft = Math.round(Number(editing.sqft) * Number(editing.pitchFactor || 1));
                  const sqs = Number(calcSqs(editing.sqft, editing.pitchFactor));
                  return (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 14 }}>
                        {[
                          ["ACTUAL ROOF AREA", `${actualSqft} SQFT`],
                          ["SQUARES NEEDED",   `${sqs} SQ`],
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: C.surface, padding: "10px 12px" }}>
                            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.1em", marginBottom: 4 }}>{k}</div>
                            <div style={{ fontFamily: C.display, fontWeight: 800, fontSize: 18, color: C.accent, letterSpacing: "0.04em" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.12em", marginBottom: 8 }}>MATERIAL COST ESTIMATES (WITH {settings.defaultMarkup || 35}% MARKUP)</div>
                      {MATERIALS.map(m => (
                        <div key={m.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.soft }}>{m.label}</span>
                          <span style={{ fontFamily: C.mono, fontSize: 11, color: C.bright, fontWeight: 500 }}>
                            ${(sqs * m.costPer100 * (1 + (Number(settings.defaultMarkup) || 35) / 100)).toFixed(0)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Templates */}
          <div style={{ marginBottom: 16 }}>
            <Label>QUICK-FILL TEMPLATES</Label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {TEMPLATES.map(tpl => (
                <button key={tpl.label} onClick={() => applyTemplate(tpl)}
                  style={{ background: C.surface, border: `1px solid ${C.border2}`, color: C.soft, fontFamily: C.mono, fontSize: 10, letterSpacing: "0.08em", padding: "9px 10px", cursor: "pointer", textAlign: "left" }}>
                  {tpl.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <Label style={{ marginBottom: 0 }}>LINE ITEMS</Label>
            <button onClick={() => setMarkupMode(m => !m)}
              style={{ background: markupMode ? C.accentDim : "none", border: `1px solid ${markupMode ? C.accent : C.border2}`, color: markupMode ? C.accent : C.muted, fontFamily: C.mono, fontSize: 9, letterSpacing: "0.1em", padding: "5px 10px", cursor: "pointer" }}>
              {markupMode ? "MARKUP: ON" : "MARKUP: OFF"}
            </button>
          </div>

          {editing.items.map((it, i) => (
            <div key={it.id} style={{ border: `1px solid ${C.border}`, marginBottom: 8, background: C.surface }}>
              <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 8, alignItems: "center" }}>
                <input value={it.desc} placeholder="Description of work or materials"
                  onChange={e => updItem(i, "desc", e.target.value)}
                  style={{ ...inputStyle, flex: 1, background: "transparent", border: "none", padding: "0", fontSize: 13 }} />
                {markupMode && (
                  <button onClick={() => updItem(i, "isMaterial", !it.isMaterial)}
                    style={{ background: it.isMaterial ? "#0D1829" : "none", border: `1px solid ${it.isMaterial ? "#3B82F6" : C.border2}`, color: it.isMaterial ? "#60A5FA" : C.muted, fontFamily: C.mono, fontSize: 9, letterSpacing: "0.08em", padding: "4px 8px", cursor: "pointer", flexShrink: 0 }}>
                    {it.isMaterial ? "MATL" : "LBOR"}
                  </button>
                )}
              </div>
              <div style={{ padding: "10px 12px", display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.muted }}>QTY</span>
                  <input value={it.qty} inputMode="decimal" onChange={e => updItem(i, "qty", e.target.value.replace(/[^0-9.]/g, ""))}
                    style={{ ...inputStyle, width: 50, textAlign: "center", padding: "6px 4px", fontFamily: C.mono, fontSize: 12 }} />
                </div>
                <span style={{ color: C.muted, fontSize: 12, flexShrink: 0 }}>x</span>
                {markupMode && it.isMaterial ? (
                  <>
                    <div style={{ flex: 1, minWidth: 60 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 3 }}>COST</div>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: C.mono, fontSize: 11, color: C.muted }}>{cur}</span>
                        <input value={it.cost} inputMode="decimal" placeholder="0.00"
                          onChange={e => updItem(i, "cost", e.target.value.replace(/[^0-9.]/g, ""))}
                          style={{ ...inputStyle, paddingLeft: 22, fontFamily: C.mono, fontSize: 12 }} />
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 3 }}>MARK%</div>
                      <input value={it.markup ?? settings.defaultMarkup} inputMode="decimal"
                        onChange={e => updItem(i, "markup", e.target.value.replace(/[^0-9.]/g, ""))}
                        style={{ ...inputStyle, width: 56, textAlign: "center", fontFamily: C.mono, fontSize: 12 }} />
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 3 }}>SELL</div>
                      <div style={{ fontFamily: C.mono, fontSize: 13, color: C.green, fontWeight: 500 }}>
                        {money((Number(it.cost) || 0) * (1 + (Number(it.markup ?? settings.defaultMarkup) || 0) / 100) * (Number(it.qty) || 0))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 3 }}>RATE</div>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontFamily: C.mono, fontSize: 11, color: C.muted }}>{cur}</span>
                        <input value={it.cost} inputMode="decimal" placeholder="0.00"
                          onChange={e => updItem(i, "cost", e.target.value.replace(/[^0-9.]/g, ""))}
                          style={{ ...inputStyle, paddingLeft: 22, fontFamily: C.mono, fontSize: 12 }} />
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, marginBottom: 3 }}>TOTAL</div>
                      <div style={{ fontFamily: C.mono, fontSize: 13, color: C.bright, fontWeight: 500 }}>
                        {money((Number(it.qty) || 0) * itemRate(it))}
                      </div>
                    </div>
                  </>
                )}
                {editing.items.length > 1 && (
                  <button onClick={() => rmItem(i)} style={{ background: "none", border: `1px solid ${C.border}`, color: C.muted, width: 28, height: 28, cursor: "pointer", flexShrink: 0, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                )}
              </div>
            </div>
          ))}

          <button onClick={addItem} style={{ width: "100%", background: "none", border: `1px dashed ${C.border2}`, color: C.muted, fontFamily: C.mono, fontSize: 10, letterSpacing: "0.12em", padding: "10px", cursor: "pointer", marginBottom: 16 }}>
            + ADD LINE ITEM
          </button>

          {/* Totals */}
          {(() => {
            const t = totalsOf(editing);
            const mCost = editing.items.reduce((a, it) => a + (it.isMaterial ? (Number(it.cost) || 0) * (Number(it.qty) || 0) : 0), 0);
            const mSell = editing.items.reduce((a, it) => a + (it.isMaterial ? (Number(it.qty) || 0) * itemRate(it) : 0), 0);
            const margin = mSell - mCost;
            return (
              <div style={{ border: `1px solid ${C.border}`, background: C.surface, marginBottom: 18 }}>
                <TRow k="SUBTOTAL" v={money(t.sub)} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>
                    {settings.taxLabel}
                    <input value={editing.taxRate} inputMode="decimal"
                      onChange={e => setEditing({ ...editing, taxRate: e.target.value.replace(/[^0-9.]/g, "") })}
                      style={{ ...inputStyle, width: 50, padding: "4px 6px", textAlign: "center", fontFamily: C.mono, fontSize: 11 }} />%
                  </span>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text }}>{money(t.tax)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "14px", alignItems: "baseline" }}>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: "0.1em" }}>TOTAL</span>
                  <span style={{ fontFamily: C.display, fontWeight: 800, fontSize: 26, color: C.accent, letterSpacing: "0.04em" }}>{money(t.total)}</span>
                </div>
                {markupMode && margin > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px", background: C.greenDim }}>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.green, letterSpacing: "0.08em" }}>
                      MATERIALS MARGIN: {money(margin)} ({mCost > 0 ? Math.round((margin / mCost) * 100) : 0}% ON COST)
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <FField label="WARRANTY">
            <FInput value={editing.warranty || ""} placeholder="5-year workmanship warranty" onChange={v => setEditing({ ...editing, warranty: v })} />
          </FField>
          <FField label="NOTES">
            <textarea value={editing.notes} rows={2} placeholder="Additional notes for the client…"
              onChange={e => setEditing({ ...editing, notes: e.target.value })}
              style={{ ...inputStyle, resize: "vertical" }} />
          </FField>

          {/* Status */}
          <div style={{ marginBottom: 20 }}>
            <Label>STATUS</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(editing.type === "quote" ? ["draft","sent","accepted","declined"] : ["draft","sent","paid"]).map(s => {
                const st = STATUSES[s];
                const active = editing.status === s;
                return (
                  <button key={s} onClick={() => setEditing({ ...editing, status: s })}
                    style={{ background: active ? st.bg : "none", border: `1px solid ${active ? st.color : C.border2}`, color: active ? st.color : C.muted, fontFamily: C.mono, fontSize: 9, letterSpacing: "0.12em", padding: "7px 12px", cursor: "pointer" }}>
                    {st.label}
                  </button>
                );
              })}
            </div>
          </div>

          {docs.some(d => d.id === editing.id) && (
            <button onClick={() => duplicateDoc(editing)}
              style={{ width: "100%", background: "none", border: `1px solid ${C.border2}`, color: C.muted, fontFamily: C.mono, fontSize: 10, letterSpacing: "0.12em", padding: "10px", cursor: "pointer", marginBottom: 10 }}>
              DUPLICATE DOCUMENT
            </button>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 8 }}>
            <button onClick={() => deleteDoc(editing.id)}
              style={{ background: "none", border: `1px solid #3F1515`, color: C.red, fontFamily: C.mono, fontSize: 10, letterSpacing: "0.1em", padding: "0 14px", cursor: "pointer", height: 44 }}>
              DEL
            </button>
            <GhostBtn onClick={saveDoc}>SAVE</GhostBtn>
            <AccentBtn onClick={() => { saveDoc(); setEditing(editing); setView("preview"); }}>PREVIEW</AccentBtn>
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {view === "preview" && editing && (
        <div>
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 18px", height: 52, background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setView("edit")} style={{ background: "none", border: "none", color: C.soft, cursor: "pointer", fontFamily: C.mono, fontSize: 11, letterSpacing: "0.1em", padding: 0 }}>
              BACK
            </button>
            <AccentBtn onClick={() => window.print()} style={{ width: "auto", padding: "0 20px", height: 36, fontSize: 11 }}>
              SAVE AS PDF
            </AccentBtn>
          </div>
          <PrintDoc doc={editing} settings={settings} money={money} totalsOf={totalsOf} itemRate={itemRate} />
          <p className="no-print" style={{ textAlign: "center", fontFamily: C.mono, fontSize: 10, color: C.muted, padding: "16px 20px 28px", letterSpacing: "0.08em" }}>
            FILE › PRINT › SAVE AS PDF
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Print Document ── */
function PrintDoc({ doc, settings, money, totalsOf, itemRate }) {
  const t = totalsOf(doc);
  const title = doc.type === "invoice" ? "INVOICE" : "ESTIMATE";
  const cur = settings.currency || "$";
  return (
    <div className="sheet" style={{ background: "#fff", margin: 16, padding: "32px 28px", fontFamily: "'DM Sans', system-ui, sans-serif", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottom: "2px solid #1a1a1a" }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: "0.06em", color: "#1a1a1a", textTransform: "uppercase" }}>
            {settings.bizName || "Your Company"}
          </div>
          <div style={{ fontSize: 11, color: "#666", marginTop: 6, lineHeight: 1.8, fontFamily: "'IBM Plex Mono', monospace" }}>
            {settings.ownerName    && <div>{settings.ownerName}</div>}
            {settings.address      && <div>{settings.address}</div>}
            {settings.phone        && <div>{settings.phone}</div>}
            {settings.email        && <div>{settings.email}</div>}
            {settings.licenseNum   && <div>LIC: {settings.licenseNum}</div>}
            {settings.insuranceNum && <div>INS: {settings.insuranceNum}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "0.1em", color: "#E07B2A" }}>{title}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: "#444", marginTop: 4 }}>{doc.number}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888", marginTop: 2 }}>{doc.date}</div>
        </div>
      </div>

      {/* Client + Job */}
      <div style={{ display: "grid", gridTemplateColumns: doc.jobAddress ? "1fr 1fr" : "1fr", gap: 16, marginBottom: 24 }}>
        <div style={{ border: "1px solid #e0e0e0", padding: "12px 14px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>{doc.type === "quote" ? "PREPARED FOR" : "BILL TO"}</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.clientName}</div>
          {doc.clientEmail   && <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{doc.clientEmail}</div>}
          {doc.clientAddress && <div style={{ fontSize: 11, color: "#666" }}>{doc.clientAddress}</div>}
        </div>
        {doc.jobAddress && (
          <div style={{ border: "1px solid #e0e0e0", padding: "12px 14px", background: "#FAFAF8" }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 6 }}>JOB ADDRESS</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{doc.jobAddress}</div>
            {doc.sqft && <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#E07B2A", marginTop: 4 }}>{doc.sqft} SQFT · {calcSqs(doc.sqft, doc.pitchFactor)} SQUARES</div>}
          </div>
        )}
      </div>

      {/* Items table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
        <thead>
          <tr style={{ background: "#1a1a1a" }}>
            {["DESCRIPTION", "QTY", "RATE", "AMOUNT"].map((h, i) => (
              <th key={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.12em", color: "#fff", padding: "9px 10px", textAlign: i === 0 ? "left" : "right", fontWeight: 500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {doc.items.filter(it => it.desc || it.cost).map((it, idx) => {
            const rate = itemRate(it);
            const amt  = (Number(it.qty) || 0) * rate;
            return (
              <tr key={it.id} style={{ borderBottom: "1px solid #eee", background: idx % 2 === 0 ? "#fff" : "#FAFAF9" }}>
                <td style={{ fontSize: 12, padding: "10px", color: "#1a1a1a" }}>{it.desc || "—"}</td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "10px", textAlign: "right", color: "#444" }}>{it.qty}</td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "10px", textAlign: "right", color: "#444" }}>{money(rate)}</td>
                <td style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, padding: "10px", textAlign: "right", fontWeight: 600, color: "#1a1a1a" }}>{money(amt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ width: 240, border: "1px solid #e0e0e0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eee" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#888", letterSpacing: "0.08em" }}>SUBTOTAL</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{money(t.sub)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "2px solid #1a1a1a" }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#888", letterSpacing: "0.08em" }}>{settings.taxLabel?.toUpperCase()} ({doc.taxRate || 0}%)</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11 }}>{money(t.tax)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px", background: "#1a1a1a" }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.1em", color: "#fff" }}>TOTAL</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.04em", color: "#E07B2A" }}>{money(t.total)}</span>
          </div>
        </div>
      </div>

      {doc.warranty && (
        <div style={{ border: "1px solid #d4edda", background: "#f8fff9", padding: "10px 14px", marginBottom: 16 }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#2d6a4f", letterSpacing: "0.08em" }}>WARRANTY: {doc.warranty.toUpperCase()}</span>
        </div>
      )}
      {doc.notes    && <div style={{ marginBottom: 14 }}><PrintLabel>NOTES</PrintLabel><div style={{ fontSize: 12, color: "#444" }}>{doc.notes}</div></div>}
      {settings.terms && <div style={{ marginBottom: 24 }}><PrintLabel>TERMS</PrintLabel><div style={{ fontSize: 11, color: "#666" }}>{settings.terms}</div></div>}

      {/* Signatures */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginTop: 40 }}>
        {[settings.bizName || "Contractor", doc.clientName || "Client"].map(name => (
          <div key={name}>
            <div style={{ height: 40, borderBottom: "1.5px solid #1a1a1a", marginBottom: 6 }} />
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#888", letterSpacing: "0.08em" }}>{name.toUpperCase()} · SIGNATURE & DATE</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Small components ── */
const SectionHead = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <div style={{ width: 3, height: 18, background: C.accent, flexShrink: 0 }} />
    <span style={{ fontFamily: C.display, fontWeight: 800, fontSize: 14, letterSpacing: "0.14em", color: C.bright, textTransform: "uppercase" }}>{label}</span>
  </div>
);
const Label = ({ children, style }) => (
  <div style={{ fontFamily: C.mono, fontSize: 9, color: C.muted, letterSpacing: "0.15em", marginBottom: 6, ...style }}>{children}</div>
);
const PrintLabel = ({ children }) => (
  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.15em", color: "#999", textTransform: "uppercase", marginBottom: 5 }}>{children}</div>
);
const FField = ({ label, children, style }) => (
  <div style={{ marginBottom: 14, ...style }}>
    <Label>{label}</Label>
    {children}
  </div>
);
const FInput = ({ value, placeholder, onChange, numeric }) => (
  <input value={value} placeholder={placeholder}
    inputMode={numeric ? "decimal" : "text"}
    onChange={e => onChange(numeric ? e.target.value.replace(/[^0-9.]/g, "") : e.target.value)}
    style={inputStyle} />
);
const TRow = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.muted, letterSpacing: "0.08em" }}>{k}</span>
    <span style={{ fontFamily: C.mono, fontSize: 11, color: C.text }}>{v}</span>
  </div>
);
const AccentBtn = ({ children, onClick, style }) => (
  <button onClick={onClick} style={{ width: "100%", background: C.accent, border: "none", color: "#fff", fontFamily: C.display, fontWeight: 800, fontSize: 13, letterSpacing: "0.14em", padding: "12px", cursor: "pointer", height: 44, ...style }}>
    {children}
  </button>
);
const GhostBtn = ({ children, onClick }) => (
  <button onClick={onClick} style={{ width: "100%", background: "none", border: `1px solid ${C.border2}`, color: C.soft, fontFamily: C.display, fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", padding: "12px", cursor: "pointer", height: 44 }}>
    {children}
  </button>
);

const inputStyle = {
  width: "100%", background: C.surface, border: `1px solid ${C.border2}`, color: C.bright,
  padding: "10px 12px", fontSize: 14, fontFamily: C.sans, outline: "none",
};
