import { useState, useEffect, useCallback, useMemo } from "react";

const KEY = "roofpro:data:v1";
const STATUSES = {
  draft: { label: "Draft", color: "#6B7280", bg: "#F3F4F6" },
  sent: { label: "Sent", color: "#92400E", bg: "#FEF3C7" },
  accepted: { label: "Accepted", color: "#065F46", bg: "#D1FAE5" },
  paid: { label: "Paid", color: "#065F46", bg: "#D1FAE5" },
  declined: { label: "Declined", color: "#991B1B", bg: "#FEE2E2" },
};

const PITCH_FACTORS = [
  { label: "Flat (1/12)", value: 1.003 },
  { label: "Low (3/12)", value: 1.031 },
  { label: "Standard (4/12)", value: 1.054 },
  { label: "Medium (6/12)", value: 1.118 },
  { label: "Steep (8/12)", value: 1.202 },
  { label: "Very Steep (10/12)", value: 1.302 },
  { label: "Extreme (12/12)", value: 1.414 },
];

const MATERIALS = [
  { label: "3-Tab Shingles", costPer100: 90, unit: "sq" },
  { label: "Architectural Shingles", costPer100: 130, unit: "sq" },
  { label: "Premium Shingles", costPer100: 200, unit: "sq" },
  { label: "Metal Roofing", costPer100: 350, unit: "sq" },
  { label: "Flat Membrane (TPO)", costPer100: 280, unit: "sq" },
  { label: "Cedar Shake", costPer100: 420, unit: "sq" },
];

const ROOF_TEMPLATES = [
  {
    label: "Shingle Replace",
    items: [
      { desc: "Architectural Shingles (material)", qty: 1, cost: 130, markup: 35, isMaterial: true },
      { desc: "Tear-off & Disposal", qty: 1, cost: 150, markup: 0, isMaterial: false },
      { desc: "Labour – Installation", qty: 1, cost: 280, markup: 0, isMaterial: false },
      { desc: "Underlayment", qty: 1, cost: 45, markup: 30, isMaterial: true },
      { desc: "Ridge Cap & Starter Strip", qty: 1, cost: 65, markup: 30, isMaterial: true },
    ],
  },
  {
    label: "Flat Roof",
    items: [
      { desc: "TPO Membrane (material)", qty: 1, cost: 280, markup: 35, isMaterial: true },
      { desc: "Tear-off & Disposal", qty: 1, cost: 120, markup: 0, isMaterial: false },
      { desc: "Labour – Installation", qty: 1, cost: 240, markup: 0, isMaterial: false },
      { desc: "Insulation Board", qty: 1, cost: 90, markup: 30, isMaterial: true },
    ],
  },
  {
    label: "Repair / Patch",
    items: [
      { desc: "Diagnostic & Site Visit", qty: 1, cost: 95, markup: 0, isMaterial: false },
      { desc: "Materials", qty: 1, cost: 80, markup: 35, isMaterial: true },
      { desc: "Labour – Repair", qty: 2, cost: 95, markup: 0, isMaterial: false },
    ],
  },
  {
    label: "Metal Roof",
    items: [
      { desc: "Metal Panels (material)", qty: 1, cost: 350, markup: 35, isMaterial: true },
      { desc: "Tear-off & Disposal", qty: 1, cost: 150, markup: 0, isMaterial: false },
      { desc: "Labour – Installation", qty: 1, cost: 380, markup: 0, isMaterial: false },
      { desc: "Flashing & Trim", qty: 1, cost: 120, markup: 30, isMaterial: true },
    ],
  },
];

const DEFAULT_SETTINGS = {
  bizName: "", ownerName: "", email: "", phone: "", address: "",
  taxRate: 0, taxLabel: "Tax", currency: "$",
  terms: "50% deposit required before work begins. Balance due on completion.",
  accent: "#B45309", defaultMarkup: 35, licenseNum: "", insuranceNum: "",
};

const blankDoc = (type, counters, settings) => ({
  id: Date.now().toString(), type,
  number: (type === "quote" ? "RQ-" : "RI-") + String((counters[type] || 0) + 1).padStart(4, "0"),
  clientName: "", clientEmail: "", clientAddress: "", jobAddress: "",
  date: new Date().toISOString().slice(0, 10),
  sqft: "", pitchFactor: "1.054",
  items: [{ id: "i" + Date.now(), desc: "", qty: 1, cost: "", markup: settings.defaultMarkup || 35, isMaterial: false }],
  notes: "", taxRate: settings.taxRate, status: "draft",
  warranty: "5 year workmanship warranty",
});

const itemRate = (it) => {
  if (it.isMaterial && it.cost !== "" && it.cost !== undefined)
    return Number(it.cost) * (1 + (Number(it.markup) || 0) / 100);
  return Number(it.rate ?? it.cost ?? 0);
};

const calcSqs = (sqft, pitchFactor) => {
  if (!sqft) return null;
  const actualSqft = Number(sqft) * Number(pitchFactor || 1);
  return (actualSqft / 100).toFixed(1);
};

export default function RoofPro() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [docs, setDocs] = useState([]);
  const [clients, setClients] = useState([]);
  const [counters, setCounters] = useState({ quote: 0, invoice: 0 });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [markupMode, setMarkupMode] = useState(false);
  const [showCalc, setShowCalc] = useState(false);

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
    finally { setTimeout(() => setSaving(false), 400); }
  }, []);

  useEffect(() => { if (loaded) persist(settings, docs, counters, clients); },
    [settings, docs, counters, clients, loaded, persist]);

  const accent = settings.accent || "#B45309";
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

  const newDoc = (type) => { setEditing(blankDoc(type, counters, settings)); setView("edit"); setMarkupMode(false); };
  const editDoc = (doc) => { setEditing(JSON.parse(JSON.stringify(doc))); setView("edit"); setMarkupMode(false); };

  const upsertClient = (e) => {
    const name = e.clientName?.trim(); if (!name) return;
    const record = { name, email: e.clientEmail || "", address: e.clientAddress || "" };
    const idx = clients.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    if (idx === -1) setClients([record, ...clients]);
    else setClients(clients.map((c, i) => i === idx ? record : c));
  };

  const saveDoc = () => {
    if (!editing.clientName?.trim()) { alert("Add a client name first."); return; }
    const exists = docs.some(d => d.id === editing.id);
    if (exists) { setDocs(docs.map(d => d.id === editing.id ? editing : d)); }
    else { setDocs([editing, ...docs]); setCounters({ ...counters, [editing.type]: (counters[editing.type] || 0) + 1 }); }
    upsertClient(editing); setView("list"); setEditing(null);
  };

  const duplicateDoc = (doc) => {
    const prefix = doc.type === "quote" ? "RQ-" : "RI-";
    const copy = {
      ...JSON.parse(JSON.stringify(doc)), id: Date.now().toString(),
      number: prefix + String((counters[doc.type] || 0) + 1).padStart(4, "0"),
      date: new Date().toISOString().slice(0, 10), status: "draft",
      items: doc.items?.map(it => ({ ...it, id: "i" + Date.now() + Math.random() })),
    };
    setEditing(copy); setView("edit");
  };

  const applyClient = (c) => setEditing(e => ({ ...e, clientName: c.name, clientEmail: c.email, clientAddress: c.address }));
  const applyTemplate = (tpl) => {
    const items = tpl.items.map(it => ({ id: "i" + Date.now() + Math.random(), desc: it.desc, qty: it.qty, cost: it.cost, markup: it.markup, isMaterial: it.isMaterial }));
    setEditing(e => ({ ...e, items })); setMarkupMode(true);
  };
  const deleteDoc = (id) => { if (!window.confirm("Delete?")) return; setDocs(docs.filter(d => d.id !== id)); setView("list"); };
  const updItem = (i, field, val) => setEditing({ ...editing, items: editing.items.map((it, idx) => idx === i ? { ...it, [field]: val } : it) });
  const addItem = () => setEditing({ ...editing, items: [...editing.items, { id: "i" + Date.now(), desc: "", qty: 1, cost: "", markup: settings.defaultMarkup || 35, isMaterial: false }] });
  const rmItem = (i) => setEditing({ ...editing, items: editing.items.filter((_, idx) => idx !== i) });

  if (!loaded) return <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>;

  return (
    <div style={wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        input,textarea,select,button { font-family: inherit; }
        input:focus,textarea:focus,select:focus { outline: 2px solid ${accent}40; border-color: ${accent}; }
        .row:hover { background: #FFFFFA; }
        @media print {
          .no-print { display: none !important; }
          .sheet { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* TOP BAR */}
      {view !== "preview" && (
        <div className="no-print" style={topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ ...logoDot, background: accent }}>🏠</div>
            <div>
              <div style={{ fontFamily: brand, fontSize: 18, lineHeight: 1, color: "#1C1917" }}>
                {settings.bizName || "RoofPro"}
              </div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 1 }}>{saving ? "saving…" : "saved ✓"}</div>
            </div>
          </div>
          <button onClick={() => setView("settings")} style={iconBtn}>⚙</button>
        </div>
      )}

      {/* SETTINGS */}
      {view === "settings" && (
        <div style={pad}>
          <h2 style={pageTitle}>Business details</h2>
          <p style={subtle}>Appears on every estimate and invoice.</p>
          {[
            ["bizName", "Company name", "e.g. Summit Roofing Co."],
            ["ownerName", "Your name", "e.g. Mike Johnson"],
            ["email", "Email", "you@roofing.com"],
            ["phone", "Phone", "(555) 123-4567"],
            ["address", "Address", "123 Main St, City, State"],
            ["licenseNum", "License number (optional)", "ROC-123456"],
            ["insuranceNum", "Insurance / policy # (optional)", "POL-789012"],
          ].map(([k, label, ph]) => (
            <Field key={k} label={label}>
              <input value={settings[k]} placeholder={ph} onChange={e => setSettings({ ...settings, [k]: e.target.value })} style={input} />
            </Field>
          ))}
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Tax label" style={{ flex: 2 }}>
              <input value={settings.taxLabel} placeholder="Tax / VAT" onChange={e => setSettings({ ...settings, taxLabel: e.target.value })} style={input} />
            </Field>
            <Field label="Tax %" style={{ flex: 1 }}>
              <input value={settings.taxRate} inputMode="decimal" onChange={e => setSettings({ ...settings, taxRate: e.target.value.replace(/[^0-9.]/g, "") })} style={input} />
            </Field>
          </div>
          <Field label="Default markup %">
            <input value={settings.defaultMarkup} inputMode="decimal" onChange={e => setSettings({ ...settings, defaultMarkup: e.target.value.replace(/[^0-9.]/g, "") })} style={input} placeholder="35" />
          </Field>
          <Field label="Default warranty">
            <input value={settings.warranty || ""} onChange={e => setSettings({ ...settings, warranty: e.target.value })} style={input} placeholder="e.g. 5 year workmanship warranty" />
          </Field>
          <Field label="Default payment terms">
            <textarea value={settings.terms} rows={2} onChange={e => setSettings({ ...settings, terms: e.target.value })} style={{ ...input, resize: "vertical" }} />
          </Field>
          <Field label="Accent color">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["#B45309", "#1C4ED8", "#065F46", "#7C2D12", "#1E40AF", "#4C1D95", "#881337"].map(c => (
                <button key={c} onClick={() => setSettings({ ...settings, accent: c })}
                  style={{ width: 32, height: 32, borderRadius: 8, background: c, border: settings.accent === c ? "3px solid #111" : "3px solid transparent", cursor: "pointer" }} />
              ))}
            </div>
          </Field>
          <button onClick={() => setView("list")} style={{ ...primaryBtn, background: accent, marginTop: 8 }}>
            {settings.bizName ? "Done" : "Save & continue"}
          </button>
        </div>
      )}

      {/* LIST */}
      {view === "list" && (
        <div style={pad}>
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <Stat label="Outstanding" value={money(stats.outstanding)} hint="quotes sent" accent="#92400E" />
            <Stat label="Won" value={money(stats.won)} hint="accepted / paid" accent="#065F46" />
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button onClick={() => newDoc("quote")} style={{ ...primaryBtn, background: accent, flex: 1, fontSize: 14 }}>+ New estimate</button>
            <button onClick={() => newDoc("invoice")} style={{ ...outlineBtn, borderColor: accent, color: accent, flex: 1, fontSize: 14 }}>+ Invoice</button>
          </div>
          {docs.length === 0 ? (
            <div style={empty}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
              No estimates yet.<br />Create your first one above.
            </div>
          ) : (
            <div>{docs.map(d => {
              const { total } = totalsOf(d);
              const st = STATUSES[d.status] || STATUSES.draft;
              return (
                <div key={d.id} className="row" style={listRow} onClick={() => editDoc(d)}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#A8A29E" }}>{d.number}</span>
                      <span style={{ ...badge, color: st.color, background: st.bg }}>{st.label}</span>
                      {d.sqft && <span style={{ ...badge, color: "#1C4ED8", background: "#EFF6FF" }}>{d.sqft} sqft</span>}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 15, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#1C1917" }}>
                      {d.clientName || "Untitled"}
                    </div>
                    <div style={{ fontSize: 12, color: "#A8A29E" }}>
                      {d.type === "invoice" ? "Invoice" : "Estimate"} · {d.date}
                      {d.jobAddress && ` · ${d.jobAddress.split(",")[0]}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: "#1C1917" }}>{money(total)}</div>
                </div>
              );
            })}</div>
          )}
        </div>
      )}

      {/* EDITOR */}
      {view === "edit" && editing && (
        <div style={pad}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <button onClick={() => { setView("list"); setEditing(null); }} style={backBtn}>← Back</button>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#A8A29E" }}>{editing.number}</span>
          </div>
          <h2 style={pageTitle}>{editing.type === "invoice" ? "Invoice" : "Estimate"} for…</h2>

          {/* Saved clients */}
          {clients.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...sectionLabel, marginBottom: 6 }}>Saved clients</div>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {clients.map(c => (
                  <button key={c.name} onClick={() => applyClient(c)}
                    style={{ ...chip, whiteSpace: "nowrap", flexShrink: 0, ...(editing.clientName?.toLowerCase() === c.name.toLowerCase() ? { background: accent + "15", color: accent, borderColor: accent } : {}) }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label="Client name">
            <input value={editing.clientName} placeholder="e.g. Robert Williams" onChange={e => setEditing({ ...editing, clientName: e.target.value })} style={input} />
          </Field>
          <div style={{ display: "flex", gap: 12 }}>
            <Field label="Client email" style={{ flex: 1 }}>
              <input value={editing.clientEmail} onChange={e => setEditing({ ...editing, clientEmail: e.target.value })} style={input} />
            </Field>
            <Field label="Date" style={{ flex: 1 }}>
              <input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} style={input} />
            </Field>
          </div>
          <Field label="Job address">
            <input value={editing.jobAddress} placeholder="Property being roofed" onChange={e => setEditing({ ...editing, jobAddress: e.target.value })} style={input} />
          </Field>

          {/* ROOF CALCULATOR */}
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <button onClick={() => setShowCalc(s => !s)}
              style={{ background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", padding: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...sectionLabel, marginBottom: 0, color: "#92400E" }}>🏠 Roof calculator</span>
                <span style={{ color: "#92400E", fontSize: 18 }}>{showCalc ? "−" : "+"}</span>
              </div>
            </button>
            {showCalc && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                  <Field label="Footprint sqft" style={{ flex: 1 }}>
                    <input value={editing.sqft} inputMode="decimal" placeholder="e.g. 2000"
                      onChange={e => setEditing({ ...editing, sqft: e.target.value.replace(/[^0-9.]/g, "") })}
                      style={input} />
                  </Field>
                  <Field label="Roof pitch" style={{ flex: 1 }}>
                    <select value={editing.pitchFactor} onChange={e => setEditing({ ...editing, pitchFactor: e.target.value })} style={{ ...input, cursor: "pointer" }}>
                      {PITCH_FACTORS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </Field>
                </div>
                {editing.sqft && (
                  <div style={{ background: "#fff", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#78716C" }}>Actual roof area</span>
                      <strong>{Math.round(Number(editing.sqft) * Number(editing.pitchFactor || 1))} sqft</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ color: "#78716C" }}>Squares needed</span>
                      <strong style={{ color: accent }}>{calcSqs(editing.sqft, editing.pitchFactor)} squares</strong>
                    </div>
                    <div style={{ ...sectionLabel, marginBottom: 6 }}>Quick material cost (per square):</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {MATERIALS.map(m => {
                        const sqs = Number(calcSqs(editing.sqft, editing.pitchFactor));
                        const total = (sqs * m.costPer100 * (1 + (Number(settings.defaultMarkup) || 35) / 100)).toFixed(0);
                        return (
                          <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: "1px solid #F5F5F4" }}>
                            <span style={{ color: "#78716C" }}>{m.label}</span>
                            <span style={{ fontWeight: 600 }}>${total}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Templates */}
          <div style={{ ...sectionLabel, marginTop: 4 }}>Quick-fill templates</div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
            {ROOF_TEMPLATES.map(tpl => (
              <button key={tpl.label} onClick={() => applyTemplate(tpl)}
                style={{ ...chip, flexShrink: 0, whiteSpace: "nowrap", background: "#FFFBEB", borderColor: accent, color: accent }}>
                {tpl.label}
              </button>
            ))}
          </div>

          {/* Line items */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={sectionLabel}>Line items</div>
            <button onClick={() => setMarkupMode(m => !m)}
              style={{ ...chip, fontSize: 11, padding: "4px 10px", background: markupMode ? accent + "15" : "#fff", color: markupMode ? accent : "#6B7280", borderColor: markupMode ? accent : "#E7E5E4" }}>
              {markupMode ? "✓ Markup ON" : "Markup mode"}
            </button>
          </div>

          {markupMode && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#92400E" }}>
              <strong>Markup mode:</strong> Enter your cost price for materials + markup %. Labour uses rate directly.
            </div>
          )}

          {editing.items.map((it, i) => (
            <div key={it.id} style={itemCard}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input value={it.desc} placeholder="Description of work / materials"
                  onChange={e => updItem(i, "desc", e.target.value)} style={{ ...input, flex: 1 }} />
                {markupMode && (
                  <button onClick={() => updItem(i, "isMaterial", !it.isMaterial)}
                    style={{ ...chip, fontSize: 11, padding: "6px 10px", flexShrink: 0, background: it.isMaterial ? "#DBEAFE" : "#F5F5F4", color: it.isMaterial ? "#1D4ED8" : "#6B7280", borderColor: it.isMaterial ? "#93C5FD" : "#E7E5E4" }}>
                    {it.isMaterial ? "Material" : "Labour"}
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <input value={it.qty} inputMode="decimal" placeholder="Qty"
                  onChange={e => updItem(i, "qty", e.target.value.replace(/[^0-9.]/g, ""))}
                  style={{ ...input, width: 52, textAlign: "center", padding: "8px 6px" }} />
                <span style={{ color: "#A8A29E" }}>×</span>
                {markupMode && it.isMaterial ? (
                  <>
                    <div style={{ position: "relative", flex: 1, minWidth: 70 }}>
                      <span style={curPrefix}>{cur}</span>
                      <input value={it.cost} inputMode="decimal" placeholder="Cost"
                        onChange={e => updItem(i, "cost", e.target.value.replace(/[^0-9.]/g, ""))}
                        style={{ ...input, paddingLeft: 22, padding: "8px 8px 8px 22px" }} />
                    </div>
                    <span style={{ color: "#A8A29E", fontSize: 12 }}>+</span>
                    <div style={{ position: "relative", width: 64 }}>
                      <input value={it.markup ?? settings.defaultMarkup} inputMode="decimal" placeholder="%"
                        onChange={e => updItem(i, "markup", e.target.value.replace(/[^0-9.]/g, ""))}
                        style={{ ...input, paddingRight: 20, padding: "8px 20px 8px 8px", textAlign: "right" }} />
                      <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", color: "#A8A29E", fontSize: 12 }}>%</span>
                    </div>
                    <span style={{ fontSize: 12, color: "#065F46", fontWeight: 700, minWidth: 60, textAlign: "right" }}>
                      = {money((Number(it.cost) || 0) * (1 + (Number(it.markup ?? settings.defaultMarkup) || 0) / 100) * (Number(it.qty) || 0))}
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{ position: "relative", flex: 1 }}>
                      <span style={curPrefix}>{cur}</span>
                      <input value={it.cost} inputMode="decimal" placeholder="Rate"
                        onChange={e => updItem(i, "cost", e.target.value.replace(/[^0-9.]/g, ""))}
                        style={{ ...input, paddingLeft: 22, padding: "8px 8px 8px 22px" }} />
                    </div>
                    <span style={{ width: 68, textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                      {money((Number(it.qty) || 0) * itemRate(it))}
                    </span>
                  </>
                )}
                {editing.items.length > 1 && <button onClick={() => rmItem(i)} style={delBtn}>×</button>}
              </div>
            </div>
          ))}
          <button onClick={addItem} style={{ ...outlineBtn, borderColor: "#E7E5E4", color: "#44403C", width: "100%", marginTop: 4 }}>
            + Add line
          </button>

          {/* Totals */}
          <div style={totalsBox}>
            {(() => {
              const t = totalsOf(editing);
              const mCost = editing.items.reduce((a, it) => a + (it.isMaterial ? (Number(it.cost) || 0) * (Number(it.qty) || 0) : 0), 0);
              const mSell = editing.items.reduce((a, it) => a + (it.isMaterial ? (Number(it.qty) || 0) * itemRate(it) : 0), 0);
              const profit = mSell - mCost;
              return (
                <>
                  <Row k="Subtotal" v={money(t.sub)} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#78716C", fontSize: 14 }}>
                      {settings.taxLabel}
                      <input value={editing.taxRate} inputMode="decimal"
                        onChange={e => setEditing({ ...editing, taxRate: e.target.value.replace(/[^0-9.]/g, "") })}
                        style={{ ...input, width: 50, padding: "4px 6px", textAlign: "center" }} />%
                    </span>
                    <span>{money(t.tax)}</span>
                  </div>
                  <div style={{ height: 1, background: "#E7E5E4", margin: "6px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
                    <span>Total</span><span style={{ color: accent }}>{money(t.total)}</span>
                  </div>
                  {markupMode && profit > 0 && (
                    <div style={{ marginTop: 10, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#166534" }}>
                      💰 Materials margin: {money(profit)} ({mCost > 0 ? Math.round((profit / mCost) * 100) : 0}% on cost)
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <Field label="Warranty" style={{ marginTop: 16 }}>
            <input value={editing.warranty || ""} onChange={e => setEditing({ ...editing, warranty: e.target.value })} style={input} placeholder="e.g. 5 year workmanship warranty" />
          </Field>
          <Field label="Notes">
            <textarea value={editing.notes} rows={2} placeholder="Any additional notes for the client…"
              onChange={e => setEditing({ ...editing, notes: e.target.value })} style={{ ...input, resize: "vertical" }} />
          </Field>

          <div style={{ ...sectionLabel, marginTop: 14 }}>Status</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
            {(editing.type === "quote" ? ["draft", "sent", "accepted", "declined"] : ["draft", "sent", "paid"]).map(s => (
              <button key={s} onClick={() => setEditing({ ...editing, status: s })}
                style={{ ...chip, ...(editing.status === s ? { background: STATUSES[s].bg, color: STATUSES[s].color, borderColor: STATUSES[s].color } : {}) }}>
                {STATUSES[s].label}
              </button>
            ))}
          </div>

          {docs.some(d => d.id === editing.id) && (
            <button onClick={() => duplicateDoc(editing)} style={{ ...outlineBtn, borderColor: "#E7E5E4", color: "#44403C", width: "100%", marginBottom: 10 }}>
              ⧉ Duplicate estimate
            </button>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => deleteDoc(editing.id)} style={{ ...outlineBtn, borderColor: "#FCA5A5", color: "#DC2626" }}>Delete</button>
            <button onClick={saveDoc} style={{ ...outlineBtn, borderColor: accent, color: accent, flex: 1 }}>Save</button>
            <button onClick={() => { saveDoc(); setEditing(editing); setView("preview"); }}
              style={{ ...primaryBtn, background: accent, flex: 1 }}>Preview / PDF</button>
          </div>
        </div>
      )}

      {/* PREVIEW */}
      {view === "preview" && editing && (
        <div>
          <div className="no-print" style={{ ...topbar, justifyContent: "space-between" }}>
            <button onClick={() => setView("edit")} style={backBtn}>← Edit</button>
            <button onClick={() => window.print()} style={{ ...primaryBtn, background: accent, width: "auto", padding: "10px 18px" }}>
              ⬇ Save as PDF
            </button>
          </div>
          <RoofSheet doc={editing} settings={settings} accent={accent} money={money} totalsOf={totalsOf} brand={brand} itemRate={itemRate} />
          <p className="no-print" style={{ textAlign: "center", color: "#A8A29E", fontSize: 12, padding: "8px 20px 24px" }}>
            In the print dialog, choose "Save as PDF".
          </p>
        </div>
      )}
    </div>
  );
}

/* ===== PDF Sheet ===== */
function RoofSheet({ doc, settings, accent, money, totalsOf, brand, itemRate }) {
  const t = totalsOf(doc);
  const title = doc.type === "invoice" ? "INVOICE" : "ROOFING ESTIMATE";
  return (
    <div className="sheet" style={sheet}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: brand, fontSize: 24, color: "#1C1917", lineHeight: 1 }}>{settings.bizName || "Your Company"}</div>
          <div style={{ fontSize: 12, color: "#78716C", marginTop: 6, lineHeight: 1.7 }}>
            {settings.ownerName && <div>{settings.ownerName}</div>}
            {settings.address && <div>{settings.address}</div>}
            {settings.phone && <div>{settings.phone}</div>}
            {settings.email && <div>{settings.email}</div>}
            {settings.licenseNum && <div>License: {settings.licenseNum}</div>}
            {settings.insuranceNum && <div>Insurance: {settings.insuranceNum}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: "0.06em", color: accent, textTransform: "uppercase" }}>{title}</div>
          <div style={{ fontFamily: "monospace", fontSize: 13, color: "#44403C", marginTop: 4 }}>{doc.number}</div>
          <div style={{ fontSize: 12, color: "#78716C", marginTop: 2 }}>{doc.date}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#FAFAF9", borderRadius: 10, padding: "14px 16px" }}>
          <div style={noteLabel}>Prepared for</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1C1917" }}>{doc.clientName}</div>
          {doc.clientEmail && <div style={{ fontSize: 12, color: "#78716C" }}>{doc.clientEmail}</div>}
          {doc.clientAddress && <div style={{ fontSize: 12, color: "#78716C" }}>{doc.clientAddress}</div>}
        </div>
        {doc.jobAddress && (
          <div style={{ flex: 1, background: "#FFFBEB", borderRadius: 10, padding: "14px 16px" }}>
            <div style={noteLabel}>Job address</div>
            <div style={{ fontSize: 13, color: "#1C1917", fontWeight: 600 }}>{doc.jobAddress}</div>
            {doc.sqft && (
              <div style={{ fontSize: 12, color: "#92400E", marginTop: 4 }}>
                {doc.sqft} sqft · {calcSqs(doc.sqft, doc.pitchFactor)} squares
              </div>
            )}
          </div>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${accent}` }}>
            <th style={th}>Description</th>
            <th style={{ ...th, textAlign: "center", width: 40 }}>Qty</th>
            <th style={{ ...th, textAlign: "right", width: 80 }}>Rate</th>
            <th style={{ ...th, textAlign: "right", width: 90 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.filter(it => it.desc || it.cost).map(it => {
            const rate = itemRate(it);
            const amt = (Number(it.qty) || 0) * rate;
            return (
              <tr key={it.id} style={{ borderBottom: "1px solid #F5F5F4" }}>
                <td style={td}>{it.desc || "—"}</td>
                <td style={{ ...td, textAlign: "center" }}>{it.qty}</td>
                <td style={{ ...td, textAlign: "right" }}>{money(rate)}</td>
                <td style={{ ...td, textAlign: "right", fontWeight: 600 }}>{money(amt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
        <div style={{ width: 240 }}>
          <Row k="Subtotal" v={money(t.sub)} />
          <Row k={`${settings.taxLabel} (${doc.taxRate || 0}%)`} v={money(t.tax)} />
          <div style={{ height: 2, background: "#1C1917", margin: "8px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 18 }}>
            <span>Total</span><span style={{ color: accent }}>{money(t.total)}</span>
          </div>
        </div>
      </div>

      {doc.warranty && (
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#166534" }}>
          ✓ {doc.warranty}
        </div>
      )}
      {doc.notes && <div style={{ marginBottom: 16 }}><div style={noteLabel}>Notes</div><div style={{ fontSize: 13, color: "#44403C" }}>{doc.notes}</div></div>}
      {settings.terms && <div style={{ marginBottom: 24 }}><div style={noteLabel}>Terms</div><div style={{ fontSize: 12, color: "#78716C" }}>{settings.terms}</div></div>}

      <div style={{ display: "flex", gap: 24, marginTop: 32 }}>
        {[settings.bizName || "Contractor", doc.clientName || "Client"].map(name => (
          <div key={name} style={{ flex: 1 }}>
            <div style={{ borderTop: "1.5px solid #1C1917", paddingTop: 6 }}>
              <div style={{ fontSize: 11, color: "#78716C" }}>{name}</div>
              <div style={{ fontSize: 11, color: "#A8A29E", marginTop: 2 }}>Signature & Date</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 32, fontSize: 11, color: "#A8A29E" }}>Thank you for your business.</div>
    </div>
  );
}

const Field = ({ label, children, style }) => (
  <div style={{ marginBottom: 14, ...style }}>
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#44403C", marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);
const Row = ({ k, v }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14, color: "#44403C" }}>
    <span>{k}</span><span>{v}</span>
  </div>
);
const Stat = ({ label, value, hint, accent }) => (
  <div style={{ flex: 1, background: "#fff", border: "1px solid #E7E5E4", borderRadius: 14, padding: "14px 16px" }}>
    <div style={{ fontSize: 11, color: "#A8A29E", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: accent, margin: "4px 0 1px" }}>{value}</div>
    <div style={{ fontSize: 11, color: "#A8A29E" }}>{hint}</div>
  </div>
);

const brand = "'DM Serif Display', serif";
const wrap = { fontFamily: "'DM Sans', system-ui, sans-serif", background: "#FAFAF9", minHeight: "100vh", color: "#1C1917", maxWidth: 560, margin: "0 auto" };
const topbar = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#fff", borderBottom: "1px solid #E7E5E4", position: "sticky", top: 0, zIndex: 10 };
const logoDot = { width: 36, height: 36, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 };
const pad = { padding: "18px" };
const pageTitle = { fontFamily: "'DM Serif Display', serif", fontSize: 24, margin: "0 0 4px", color: "#1C1917", fontWeight: 400 };
const subtle = { fontSize: 13, color: "#A8A29E", margin: "0 0 18px" };
const sectionLabel = { fontSize: 11, fontWeight: 700, color: "#44403C", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" };
const input = { width: "100%", border: "1.5px solid #E7E5E4", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "#fff", color: "#1C1917" };
const primaryBtn = { width: "100%", color: "#fff", border: "none", borderRadius: 11, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer" };
const outlineBtn = { background: "#fff", border: "1.5px solid", borderRadius: 11, padding: "12px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer" };
const iconBtn = { background: "#F5F5F4", border: "none", borderRadius: 9, width: 38, height: 38, fontSize: 18, cursor: "pointer" };
const backBtn = { background: "none", border: "none", color: "#78716C", fontSize: 14, cursor: "pointer", padding: 0, fontWeight: 600 };
const listRow = { display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", background: "#fff", border: "1px solid #E7E5E4", borderRadius: 12, marginBottom: 8, cursor: "pointer" };
const badge = { fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, letterSpacing: "0.03em" };
const empty = { textAlign: "center", color: "#A8A29E", fontSize: 14, padding: "50px 20px", lineHeight: 1.6 };
const itemCard = { background: "#fff", border: "1px solid #E7E5E4", borderRadius: 12, padding: "12px", marginBottom: 8 };
const curPrefix = { position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#A8A29E", fontSize: 14 };
const delBtn = { background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 8, width: 30, height: 30, fontSize: 18, cursor: "pointer", flexShrink: 0 };
const totalsBox = { background: "#fff", border: "1px solid #E7E5E4", borderRadius: 12, padding: "12px 16px", marginTop: 12 };
const chip = { background: "#fff", border: "1.5px solid #E7E5E4", color: "#78716C", borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const sheet = { background: "#fff", maxWidth: 520, margin: "16px", padding: "32px 28px", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,.08)", fontFamily: "'DM Sans', system-ui, sans-serif" };
const th = { textAlign: "left", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#A8A29E", padding: "0 0 8px", fontWeight: 700 };
const td = { fontSize: 13, color: "#1C1917", padding: "10px 0", verticalAlign: "top" };
const noteLabel = { fontSize: 10, letterSpacing: "0.12em", color: "#A8A29E", textTransform: "uppercase", marginBottom: 4 };

