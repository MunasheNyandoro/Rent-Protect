import { useState, useEffect, useMemo } from "react";
import {
  Plus, X, Check, ChevronLeft, Home, FileText, Settings as Cog,
  AlertTriangle, Download, Trash2, UserPlus, Building2, Clock
} from "lucide-react";

const KEY = "rentbook:data";
const EMPTY = { version: 1, properties: [], units: [], leases: [], payments: [] };

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function ymNow() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function ymLabel(ym) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`;
}
function ymRange(start, end, cap = 24) {
  const out = [];
  let [y, m] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    if (out.length > 400) break;
  }
  return out.slice(-cap);
}
const fmt = (n, cur) => `${cur === "USD" ? "US$" : "ZWG"} ${Number(n).toFixed(2)}`;

/* ================================================================= */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&display=swap');

.rb {
  --page:#DCE2E6; --sheet:#FCFBF8; --ink:#23245A; --soft:#6A6D93;
  --rule:#B9BECE; --green:#1D6B4E; --red:#9E3327; --amber:#B5761A;
  font-family:'Archivo',system-ui,sans-serif; background:var(--page);
  color:var(--ink); min-height:100%; padding:0 0 78px; font-feature-settings:"tnum" 1;
}
.rb-wrap{max-width:560px;margin:0 auto;padding:16px 12px 0;}

.rb-top{display:flex;align-items:center;gap:10px;margin-bottom:14px;min-height:32px;}
.rb-top h1{margin:0;font-size:19px;font-weight:600;letter-spacing:-0.015em;flex:1;}
.rb-top p{margin:2px 0 0;font-size:12.5px;color:var(--soft);font-weight:400;}
.rb-back{background:none;border:none;color:var(--ink);cursor:pointer;padding:4px;display:flex;}

.card{background:var(--sheet);border:1px solid var(--rule);box-shadow:3px 3px 0 rgba(35,36,90,.10);margin-bottom:12px;}
.card-h{padding:13px 15px;border-bottom:2px solid var(--ink);}
.card-h h2{margin:0;font-size:15px;font-weight:600;}
.card-h p{margin:2px 0 0;font-size:12px;color:var(--soft);}

.unit-row{display:flex;align-items:center;gap:11px;padding:13px 15px;border-bottom:1px solid var(--rule);cursor:pointer;background:none;border-left:none;border-right:none;border-top:none;width:100%;text-align:left;font-family:inherit;color:inherit;}
.unit-row:last-child{border-bottom:none;}
.unit-row:hover{background:rgba(35,36,90,.035);}
.unit-row:focus-visible{outline:2px solid var(--ink);outline-offset:-2px;}
.unit-main{flex:1;min-width:0;}
.unit-name{font-size:14.5px;font-weight:500;}
.unit-sub{font-size:12px;color:var(--soft);margin-top:2px;}
.pill{font-size:11px;font-weight:600;padding:3px 8px;border:1.5px solid currentColor;white-space:nowrap;}
.pill[data-s="clear"]{color:var(--green);}
.pill[data-s="due"]{color:var(--amber);}
.pill[data-s="behind"]{color:var(--red);}
.pill[data-s="wait"]{color:var(--soft);}

.led{display:grid;grid-template-columns:1fr auto 58px;gap:10px;align-items:center;padding:12px 15px;border-bottom:1px solid var(--rule);}
.led:last-child{border-bottom:none;}
.led[data-live="true"]{background:rgba(181,118,26,.055);}
.led-p{font-size:14px;font-weight:500;}
.led-m{font-size:11.5px;color:var(--soft);line-height:1.5;margin-top:2px;}
.led-a{font-size:15px;font-weight:600;text-align:right;white-space:nowrap;}
.led-a small{display:block;font-size:11px;font-weight:400;color:var(--amber);margin-top:2px;}
.gut{display:flex;gap:4px;justify-content:flex-end;}
.slot{width:24px;height:28px;border:1px solid var(--rule);display:grid;place-items:center;background:rgba(255,255,255,.6);}
.slot[data-on="true"]{background:var(--ink);border-color:var(--ink);color:var(--sheet);}
.cap{font-size:9px;color:var(--soft);text-align:center;margin-top:3px;}

.stamp{display:inline-block;margin-top:4px;font-size:10px;font-weight:600;border:1.5px solid currentColor;padding:1px 5px;transform:rotate(-3deg);opacity:.85;}
.stamp[data-k="ok"]{color:var(--green);}
.stamp[data-k="wait"]{color:var(--amber);}
.stamp[data-k="fx"]{color:var(--soft);}

.btn{font-family:inherit;font-size:13px;font-weight:500;padding:8px 13px;border-radius:2px;cursor:pointer;border:1px solid var(--ink);background:var(--ink);color:var(--sheet);display:inline-flex;align-items:center;justify-content:center;gap:6px;}
.btn[data-v="quiet"]{background:transparent;color:var(--ink);}
.btn[data-v="danger"]{background:transparent;color:var(--red);border-color:var(--red);}
.btn[data-v="big"]{width:100%;padding:14px;font-size:15px;font-weight:600;}
.btn:focus-visible{outline:2px solid var(--ink);outline-offset:2px;}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.row-btns{display:flex;gap:7px;margin-top:8px;flex-wrap:wrap;}

.pad{padding:15px;}
.f{margin-bottom:12px;}
.f label{display:block;font-size:12px;color:var(--soft);margin-bottom:4px;}
.f input,.f select{font-family:inherit;font-size:15px;width:100%;box-sizing:border-box;padding:9px 10px;border:1px solid var(--rule);background:#fff;color:var(--ink);border-radius:2px;}
.f input:focus,.f select:focus{outline:2px solid var(--ink);outline-offset:-1px;}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}

.scrim{position:fixed;inset:0;background:rgba(35,36,90,.45);display:flex;align-items:flex-end;justify-content:center;z-index:50;}
.sheetm{background:var(--sheet);border-top:2px solid var(--ink);width:100%;max-width:560px;max-height:92vh;overflow-y:auto;}
.sheetm-h{padding:15px 15px 0;}
.sheetm-h h3{margin:0 0 3px;font-size:17px;font-weight:600;}
.sheetm-h p{margin:0;font-size:12.5px;color:var(--soft);}

.sign{border:1px solid var(--ink);padding:16px;text-align:center;margin-bottom:12px;background:rgba(255,255,255,.7);}
.sign h4{margin:0 0 3px;font-size:15px;font-weight:600;}
.sign p{margin:0 0 12px;font-size:12.5px;color:var(--soft);line-height:1.5;}
.sign[data-done="true"]{background:var(--ink);color:var(--sheet);border-color:var(--ink);}
.sign[data-done="true"] p{color:rgba(252,251,248,.75);}

.tabs{position:fixed;bottom:0;left:0;right:0;background:var(--sheet);border-top:1px solid var(--rule);display:flex;z-index:30;}
.tabs-in{max-width:560px;margin:0 auto;display:flex;width:100%;}
.tab{flex:1;background:none;border:none;font-family:inherit;padding:10px 4px 12px;cursor:pointer;color:var(--soft);display:flex;flex-direction:column;align-items:center;gap:3px;font-size:11px;}
.tab[data-on="true"]{color:var(--ink);font-weight:600;}
.tab:focus-visible{outline:2px solid var(--ink);outline-offset:-2px;}

.empty{padding:30px 20px;text-align:center;}
.empty h3{margin:0 0 6px;font-size:15px;font-weight:600;}
.empty p{margin:0 0 16px;font-size:13px;color:var(--soft);line-height:1.55;}

.note{font-size:11.5px;color:var(--soft);line-height:1.6;padding:0 3px;margin-bottom:14px;}
.warn{border-left:3px solid var(--amber);padding:10px 12px;background:rgba(181,118,26,.07);font-size:12px;line-height:1.55;margin-bottom:12px;}

.stmt{background:#fff;border:1px solid var(--ink);padding:20px;font-size:13px;line-height:1.6;}
.stmt h3{margin:0 0 3px;font-size:16px;font-weight:600;}
.stmt .sub{color:var(--soft);font-size:12px;margin-bottom:14px;}
.stmt table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12.5px;}
.stmt th{text-align:left;border-bottom:1.5px solid var(--ink);padding:5px 4px;font-weight:600;}
.stmt td{border-bottom:1px solid var(--rule);padding:5px 4px;}
.stmt td.r{text-align:right;}
.stmt .foot{font-size:11px;color:var(--soft);margin-top:14px;line-height:1.6;}
`;

/* ================================================================= */

export default function RentBook() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [tab, setTab] = useState("portfolio");
  const [openUnit, setOpenUnit] = useState(null);
  const [modal, setModal] = useState(null);
  const [stmtLease, setStmtLease] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(KEY, false);
        if (r && r.value) setData({ ...EMPTY, ...JSON.parse(r.value) });
      } catch (e) {
        // no data yet — first run
      }
      setLoading(false);
    })();
  }, []);

  async function save(next) {
    setData(next);
    try {
      const r = await window.storage.set(KEY, JSON.stringify(next), false);
      if (!r) setFailed(true);
      else setFailed(false);
    } catch (e) {
      setFailed(true);
    }
  }

  const leaseOf = (unitId) => data.leases.find((l) => l.unitId === unitId && l.active);

  function ledger(lease) {
    if (!lease) return { rows: [], owed: 0, cur: "USD" };
    const months = ymRange(lease.startMonth, ymNow());
    const pays = data.payments.filter((p) => p.leaseId === lease.id);
    let owed = 0;
    const rows = months.map((ym) => {
      const mine = pays.filter((p) => p.period === ym);
      const same = mine.filter((p) => p.currency === lease.currency && !p.rejected);
      const paid = same.reduce((s, p) => s + Number(p.amount), 0);
      const gap = Number(lease.rent) - paid;
      if (gap > 0) owed += gap;
      return { ym, charged: Number(lease.rent), paid, gap, pays: mine };
    }).reverse();
    return { rows, owed, cur: lease.currency };
  }

  function statusOf(unitId) {
    const lease = leaseOf(unitId);
    if (!lease) return { s: "wait", t: "No tenant" };
    const { rows, owed, cur } = ledger(lease);
    const cur0 = rows[0];
    if (cur0 && cur0.pays.some((p) => !p.tenantSigned || !p.landlordSigned))
      return { s: "wait", t: "Needs a signature" };
    if (owed <= 0.005) return { s: "clear", t: "Up to date" };
    if (owed <= Number(lease.rent) + 0.005) return { s: "due", t: `${fmt(owed, cur)} due` };
    return { s: "behind", t: `${fmt(owed, cur)} behind` };
  }

  /* ---------------- actions ---------------- */

  function addProperty(f) {
    save({ ...data, properties: [...data.properties, { id: uid("prop"), ...f }] });
    setModal(null);
  }
  function addUnit(f) {
    save({ ...data, units: [...data.units, { id: uid("unit"), ...f }] });
    setModal(null);
  }
  function addLease(f) {
    const next = data.leases.map((l) =>
      l.unitId === f.unitId ? { ...l, active: false } : l);
    save({ ...data, leases: [...next, { id: uid("lease"), active: true, ...f }] });
    setModal(null);
  }
  function addPayment(f) {
    save({ ...data, payments: [...data.payments, { id: uid("pay"), createdAt: Date.now(), ...f }] });
    setModal(null);
  }
  function signPayment(id, who) {
    save({
      ...data,
      payments: data.payments.map((p) =>
        p.id === id
          ? { ...p, [who]: true, signedAt: p.landlordSigned || p.tenantSigned ? Date.now() : p.signedAt }
          : p),
    });
  }
  function rejectPayment(id) {
    save({ ...data, payments: data.payments.map((p) => p.id === id ? { ...p, rejected: true } : p) });
  }

  async function exportAll() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rent-book-${ymNow()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function wipe() {
    try { await window.storage.delete(KEY, false); } catch (e) { /* nothing stored */ }
    setData(EMPTY);
    setModal(null);
    setOpenUnit(null);
  }

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <div className="rb">
        <style>{CSS}</style>
        <div className="rb-wrap"><p className="note">Opening the rent book…</p></div>
      </div>
    );
  }

  const unit = openUnit ? data.units.find((u) => u.id === openUnit) : null;
  const lease = unit ? leaseOf(unit.id) : null;
  const led = ledger(lease);

  return (
    <div className="rb">
      <style>{CSS}</style>
      <div className="rb-wrap">
        {failed && (
          <div className="warn">
            <b>Not saved.</b> The last change could not be written to storage. Export your data
            before closing this.
          </div>
        )}

        {stmtLease ? (
          <StatementView
            lease={stmtLease}
            data={data}
            ledger={ledger(stmtLease)}
            onBack={() => setStmtLease(null)}
          />
        ) : unit ? (
          <UnitView
            unit={unit}
            lease={lease}
            led={led}
            property={data.properties.find((p) => p.id === unit.propertyId)}
            onBack={() => setOpenUnit(null)}
            onRecord={() => setModal({ t: "payment", unit, lease })}
            onAddTenant={() => setModal({ t: "lease", unitId: unit.id })}
            onSign={signPayment}
            onReject={rejectPayment}
            onStatement={() => setStmtLease(lease)}
          />
        ) : tab === "portfolio" ? (
          <Portfolio
            data={data}
            statusOf={statusOf}
            leaseOf={leaseOf}
            onOpen={setOpenUnit}
            onAddProperty={() => setModal({ t: "property" })}
            onAddUnit={(pid) => setModal({ t: "unit", propertyId: pid })}
          />
        ) : tab === "statements" ? (
          <Statements data={data} onPick={setStmtLease} />
        ) : (
          <SettingsView data={data} onExport={exportAll} onWipe={() => setModal({ t: "wipe" })} />
        )}
      </div>

      {!stmtLease && !unit && (
        <nav className="tabs">
          <div className="tabs-in">
            {[["portfolio", Home, "Rent book"],
              ["statements", FileText, "Statements"],
              ["settings", Cog, "Settings"]].map(([k, Icon, label]) => (
              <button key={k} className="tab" data-on={tab === k} onClick={() => setTab(k)}>
                <Icon size={19} strokeWidth={tab === k ? 2.4 : 1.8} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {modal && (
        <Modal
          modal={modal}
          data={data}
          onClose={() => setModal(null)}
          onProperty={addProperty}
          onUnit={addUnit}
          onLease={addLease}
          onPayment={addPayment}
          onWipe={wipe}
        />
      )}
    </div>
  );
}

/* ================================================================= */

function Portfolio({ data, statusOf, leaseOf, onOpen, onAddProperty, onAddUnit }) {
  return (
    <>
      <div className="rb-top">
        <div style={{ flex: 1 }}>
          <h1>Rent book</h1>
          <p>{data.units.length} unit{data.units.length === 1 ? "" : "s"} across {data.properties.length} propert{data.properties.length === 1 ? "y" : "ies"}</p>
        </div>
      </div>

      {data.properties.length === 0 ? (
        <div className="card">
          <div className="empty">
            <h3>Start with a property</h3>
            <p>Add the house or block first, then the rooms or cottages you let out inside it.
              A four-room house is one property and four units.</p>
            <button className="btn" onClick={onAddProperty}>
              <Building2 size={15} /> Add a property
            </button>
          </div>
        </div>
      ) : (
        <>
          {data.properties.map((prop) => {
            const units = data.units.filter((u) => u.propertyId === prop.id);
            return (
              <div className="card" key={prop.id}>
                <div className="card-h">
                  <h2>{prop.name}</h2>
                  <p>{[prop.suburb, prop.standNumber].filter(Boolean).join(" · ") || "No address recorded"}</p>
                </div>
                {units.map((u) => {
                  const st = statusOf(u.id);
                  const l = leaseOf(u.id);
                  return (
                    <button className="unit-row" key={u.id} onClick={() => onOpen(u.id)}>
                      <div className="unit-main">
                        <div className="unit-name">{u.label}</div>
                        <div className="unit-sub">{l ? l.tenantName : "Vacant"}</div>
                      </div>
                      <span className="pill" data-s={st.s}>{st.t}</span>
                    </button>
                  );
                })}
                <div className="pad">
                  <button className="btn" data-v="quiet" onClick={() => onAddUnit(prop.id)}>
                    <Plus size={14} /> Add a unit
                  </button>
                </div>
              </div>
            );
          })}
          <button className="btn" data-v="quiet" onClick={onAddProperty} style={{ marginBottom: 16 }}>
            <Building2 size={14} /> Add another property
          </button>
        </>
      )}

      <p className="note">
        Keep the paper rent book going alongside this while you are testing. If anything here
        breaks, your tenant still has their proof.
      </p>
    </>
  );
}

/* ================================================================= */

function UnitView({ unit, lease, led, property, onBack, onRecord, onAddTenant, onSign, onReject, onStatement }) {
  return (
    <>
      <div className="rb-top">
        <button className="rb-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>
        <div style={{ flex: 1 }}>
          <h1>{unit.label}</h1>
          <p>{property ? property.name : ""}{lease ? ` · ${lease.tenantName}` : ""}</p>
        </div>
      </div>

      {!lease ? (
        <div className="card">
          <div className="empty">
            <h3>No tenant on this unit</h3>
            <p>Add the tenant and the rent, and the months will start appearing here.</p>
            <button className="btn" onClick={onAddTenant}><UserPlus size={15} /> Add a tenant</button>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-h">
              <h2>{fmt(lease.rent, lease.currency)} monthly, due the {lease.dueDay}</h2>
              <p>
                {led.owed > 0.005
                  ? `${fmt(led.owed, lease.currency)} outstanding`
                  : "Nothing outstanding"}
                {lease.tenantPhone ? ` · ${lease.tenantPhone}` : ""}
              </p>
            </div>

            {led.rows.map((row) => {
              const pending = row.pays.some((p) => !p.rejected && (!p.tenantSigned || !p.landlordSigned));
              const live = row.gap > 0.005 || pending;
              const signed = row.pays.length > 0 &&
                row.pays.every((p) => p.rejected || (p.tenantSigned && p.landlordSigned));
              return (
                <div className="led" key={row.ym} data-live={live}>
                  <div>
                    <div className="led-p">{ymLabel(row.ym)}</div>
                    {row.pays.length === 0 && <div className="led-m">Nothing recorded</div>}
                    {row.pays.map((p) => (
                      <div className="led-m" key={p.id}>
                        {fmt(p.amount, p.currency)} · {p.method}
                        {p.ref ? ` · ${p.ref}` : ""}{p.paidOn ? ` · ${p.paidOn}` : ""}
                        {p.currency !== lease.currency && (
                          <><br /><span className="stamp" data-k="fx">Different currency — not netted</span></>
                        )}
                        {p.rejected && (
                          <><br /><span className="stamp" data-k="fx">Withdrawn</span></>
                        )}
                        {!p.rejected && p.tenantSigned && p.landlordSigned && (
                          <><br /><span className="stamp" data-k="ok">Both signed</span></>
                        )}
                        {!p.rejected && (!p.tenantSigned || !p.landlordSigned) && (
                          <>
                            <br />
                            <span className="stamp" data-k="wait">
                              <Clock size={9} style={{ verticalAlign: -1, marginRight: 3 }} />
                              {p.tenantSigned ? "Waiting on you" : "Waiting on tenant"}
                            </span>
                            <div className="row-btns">
                              <button className="btn" onClick={() =>
                                onSign(p.id, p.tenantSigned ? "landlordSigned" : "tenantSigned")}>
                                <Check size={13} strokeWidth={3} />
                                {p.tenantSigned ? "Sign as landlord" : "Tenant signs here"}
                              </button>
                              <button className="btn" data-v="danger" onClick={() => onReject(p.id)}>
                                <X size={13} /> Withdraw
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="led-a">
                    {fmt(row.charged, lease.currency)}
                    {row.gap > 0.005 && <small>{fmt(row.gap, lease.currency)} short</small>}
                  </div>
                  <div>
                    <div className="gut">
                      <div className="slot" data-on={signed}>
                        {signed && <Check size={14} strokeWidth={3} />}
                      </div>
                      <div className="slot" data-on={signed}>
                        {signed && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="cap">tenant / you</div>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="btn" data-v="big" onClick={onRecord} style={{ marginBottom: 10 }}>
            <Plus size={17} /> Record a payment
          </button>
          <button className="btn" data-v="quiet" onClick={onStatement} style={{ width: "100%", marginBottom: 18 }}>
            <FileText size={14} /> Make a statement for this tenant
          </button>
        </>
      )}
    </>
  );
}

/* ================================================================= */

function Statements({ data, onPick }) {
  const active = data.leases.filter((l) => l.active);
  return (
    <>
      <div className="rb-top"><div style={{ flex: 1 }}>
        <h1>Statements</h1>
        <p>Proof of residence and rent record</p>
      </div></div>

      <p className="note">
        A signed lease with a payment record is accepted as proof of residence for bank KYC and
        school enrolment. It saves your tenant an affidavit and a trip to a Commissioner of Oaths.
      </p>

      {active.length === 0 ? (
        <div className="card"><div className="empty">
          <h3>No tenants yet</h3>
          <p>Add a tenant to a unit and you can produce a statement for them here.</p>
        </div></div>
      ) : (
        <div className="card">
          {active.map((l) => {
            const u = data.units.find((x) => x.id === l.unitId);
            const p = u ? data.properties.find((x) => x.id === u.propertyId) : null;
            return (
              <button className="unit-row" key={l.id} onClick={() => onPick(l)}>
                <div className="unit-main">
                  <div className="unit-name">{l.tenantName}</div>
                  <div className="unit-sub">{u ? u.label : ""}{p ? ` · ${p.name}` : ""}</div>
                </div>
                <FileText size={17} color="#6A6D93" />
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatementView({ lease, data, ledger, onBack }) {
  const unit = data.units.find((u) => u.id === lease.unitId);
  const prop = unit ? data.properties.find((p) => p.id === unit.propertyId) : null;
  const paidRows = ledger.rows.filter((r) => r.pays.length > 0).slice().reverse();
  const total = paidRows.reduce((s, r) => s + r.paid, 0);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <div className="rb-top">
        <button className="rb-back" onClick={onBack} aria-label="Back"><ChevronLeft size={22} /></button>
        <div style={{ flex: 1 }}><h1>Statement</h1><p>{lease.tenantName}</p></div>
      </div>

      <div className="stmt">
        <h3>Statement of residence and rent paid</h3>
        <div className="sub">Issued {today}</div>

        <div><b>Tenant:</b> {lease.tenantName}{lease.tenantPhone ? ` (${lease.tenantPhone})` : ""}</div>
        <div><b>Address:</b> {[unit && unit.label, prop && prop.name, prop && prop.suburb]
          .filter(Boolean).join(", ")}</div>
        {prop && prop.standNumber && <div><b>Stand:</b> {prop.standNumber}</div>}
        <div><b>Occupying since:</b> {ymLabel(lease.startMonth)}</div>
        <div><b>Monthly rent:</b> {fmt(lease.rent, lease.currency)}</div>

        <table>
          <thead>
            <tr><th>Month</th><th className="r">Charged</th><th className="r">Paid</th><th>Signed</th></tr>
          </thead>
          <tbody>
            {paidRows.map((r) => {
              const signed = r.pays.every((p) => p.rejected || (p.tenantSigned && p.landlordSigned));
              return (
                <tr key={r.ym}>
                  <td>{ymLabel(r.ym)}</td>
                  <td className="r">{fmt(r.charged, lease.currency)}</td>
                  <td className="r">{fmt(r.paid, lease.currency)}</td>
                  <td>{signed ? "both parties" : "incomplete"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div><b>Total recorded as paid:</b> {fmt(total, lease.currency)}</div>
        {ledger.owed > 0.005 && (
          <div><b>Outstanding:</b> {fmt(ledger.owed, lease.currency)}</div>
        )}

        <div className="foot">
          Every entry above was recorded and separately confirmed by both the tenant and the
          landlord at the time of payment. Entries marked incomplete carry only one signature and
          should be read as a claim rather than an agreed record.
        </div>
      </div>

      <div className="row-btns" style={{ marginTop: 12, marginBottom: 20 }}>
        <button className="btn" onClick={() => { try { window.print(); } catch (e) { /* blocked */ } }}>
          Print or save as PDF
        </button>
      </div>
      <p className="note">
        If printing is blocked, a screenshot works. This is a pilot document — no institution has
        agreed to accept it yet, so find that out before you promise a tenant it will work.
      </p>
    </>
  );
}

/* ================================================================= */

function SettingsView({ data, onExport, onWipe }) {
  const n = data.payments.length;
  return (
    <>
      <div className="rb-top"><div style={{ flex: 1 }}>
        <h1>Settings</h1>
        <p>{n} payment{n === 1 ? "" : "s"} recorded</p>
      </div></div>

      <div className="warn">
        <b>This is a pilot.</b> Data lives on this device only. Export it regularly, and keep the
        paper rent book running alongside so no tenant ever depends on this app for their proof.
      </div>

      <div className="card"><div className="pad">
        <button className="btn" data-v="quiet" onClick={onExport} style={{ width: "100%", marginBottom: 10 }}>
          <Download size={14} /> Export everything as a file
        </button>
        <button className="btn" data-v="danger" onClick={onWipe} style={{ width: "100%" }}>
          <Trash2 size={14} /> Erase all data
        </button>
      </div></div>

      <p className="note">
        Before you record a real tenant, ask them. A tenant who would rather not be in an app
        should be able to carry on exactly as before, with no conversation and no consequence.
      </p>
    </>
  );
}

/* ================================================================= */

function Modal({ modal, data, onClose, onProperty, onUnit, onLease, onPayment, onWipe }) {
  const [f, setF] = useState(() => {
    if (modal.t === "property") return { name: "", suburb: "", standNumber: "" };
    if (modal.t === "unit") return { propertyId: modal.propertyId, label: "" };
    if (modal.t === "lease") return {
      unitId: modal.unitId, tenantName: "", tenantPhone: "", rent: "",
      currency: "USD", dueDay: "5", startMonth: ymNow(),
    };
    if (modal.t === "payment") return {
      leaseId: modal.lease.id, period: ymNow(), amount: String(modal.lease.rent),
      currency: modal.lease.currency, method: "Cash", ref: "", paidOn: "",
      landlordSigned: false, tenantSigned: false,
    };
    return {};
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const periods = modal.t === "payment"
    ? ymRange(modal.lease.startMonth, ymNow(), 24).reverse() : [];

  if (modal.t === "wipe") {
    return (
      <div className="scrim" onClick={onClose}>
        <div className="sheetm" onClick={(e) => e.stopPropagation()}>
          <div className="sheetm-h">
            <h3>Erase everything?</h3>
            <p>Every property, tenant and payment on this device. This cannot be undone.</p>
          </div>
          <div className="pad">
            <button className="btn" data-v="danger" onClick={onWipe} style={{ width: "100%", marginBottom: 8 }}>
              Yes, erase it all
            </button>
            <button className="btn" data-v="quiet" onClick={onClose} style={{ width: "100%" }}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const ready =
    modal.t === "property" ? f.name.trim() :
    modal.t === "unit" ? f.label.trim() :
    modal.t === "lease" ? f.tenantName.trim() && parseFloat(f.rent) > 0 :
    parseFloat(f.amount) > 0 && f.landlordSigned && f.tenantSigned;

  function submit() {
    if (modal.t === "property") onProperty(f);
    else if (modal.t === "unit") onUnit(f);
    else if (modal.t === "lease") onLease({ ...f, rent: parseFloat(f.rent) });
    else onPayment({ ...f, amount: parseFloat(f.amount) });
  }

  const titles = {
    property: ["Add a property", "The house, block or stand"],
    unit: ["Add a unit", "A room, a cottage, the main house"],
    lease: ["Add a tenant", "Who lives here and what they pay"],
    payment: ["Record a payment", "Both of you sign before it is saved"],
  };

  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheetm" onClick={(e) => e.stopPropagation()}>
        <div className="sheetm-h">
          <h3>{titles[modal.t][0]}</h3>
          <p>{titles[modal.t][1]}</p>
        </div>
        <div className="pad">

          {modal.t === "property" && (<>
            <div className="f"><label htmlFor="pn">Property name</label>
              <input id="pn" value={f.name} onChange={set("name")} placeholder="14 Jason Moyo Street" /></div>
            <div className="f2">
              <div className="f"><label htmlFor="ps">Suburb</label>
                <input id="ps" value={f.suburb} onChange={set("suburb")} placeholder="Famona" /></div>
              <div className="f"><label htmlFor="pst">Stand number</label>
                <input id="pst" value={f.standNumber} onChange={set("standNumber")} placeholder="Stand 4417" /></div>
            </div>
          </>)}

          {modal.t === "unit" && (
            <div className="f"><label htmlFor="ul">What is this unit called?</label>
              <input id="ul" value={f.label} onChange={set("label")} placeholder="Room 2, or Cottage" /></div>
          )}

          {modal.t === "lease" && (<>
            <div className="f"><label htmlFor="tn">Tenant name</label>
              <input id="tn" value={f.tenantName} onChange={set("tenantName")} placeholder="Tanaka Moyo" /></div>
            <div className="f"><label htmlFor="tp">Phone number</label>
              <input id="tp" value={f.tenantPhone} onChange={set("tenantPhone")} placeholder="077 123 4567" /></div>
            <div className="f2">
              <div className="f"><label htmlFor="rt">Monthly rent</label>
                <input id="rt" inputMode="decimal" value={f.rent} onChange={set("rent")} placeholder="120" /></div>
              <div className="f"><label htmlFor="cu">Currency</label>
                <select id="cu" value={f.currency} onChange={set("currency")}>
                  <option value="USD">US dollars</option><option value="ZWG">ZiG</option>
                </select></div>
            </div>
            <div className="f2">
              <div className="f"><label htmlFor="dd">Due day of month</label>
                <input id="dd" inputMode="numeric" value={f.dueDay} onChange={set("dueDay")} /></div>
              <div className="f"><label htmlFor="sm">Occupying since</label>
                <input id="sm" type="month" value={f.startMonth} onChange={set("startMonth")} /></div>
            </div>
          </>)}

          {modal.t === "payment" && (<>
            <div className="f2">
              <div className="f"><label htmlFor="am">Amount</label>
                <input id="am" inputMode="decimal" value={f.amount} onChange={set("amount")} /></div>
              <div className="f"><label htmlFor="cur">Currency</label>
                <select id="cur" value={f.currency} onChange={set("currency")}>
                  <option value="USD">US dollars</option><option value="ZWG">ZiG</option>
                </select></div>
            </div>
            {f.currency !== modal.lease.currency && (
              <div className="warn">
                The rent is set in {modal.lease.currency === "USD" ? "US dollars" : "ZiG"}. This
                payment will be recorded but not counted against the balance — the two currencies
                are never mixed.
              </div>
            )}
            <div className="f"><label htmlFor="pe">Which month is this for?</label>
              <select id="pe" value={f.period} onChange={set("period")}>
                {periods.map((p) => <option key={p} value={p}>{ymLabel(p)}</option>)}
              </select></div>
            <div className="f2">
              <div className="f"><label htmlFor="me">How it was paid</label>
                <select id="me" value={f.method} onChange={set("method")}>
                  {["Cash", "EcoCash", "InnBucks", "OneMoney", "ZIPIT", "Bank transfer"]
                    .map((m) => <option key={m}>{m}</option>)}
                </select></div>
              <div className="f"><label htmlFor="po">Date paid</label>
                <input id="po" value={f.paidOn} onChange={set("paidOn")} placeholder="4 Sep" /></div>
            </div>
            {f.method !== "Cash" && (
              <div className="f"><label htmlFor="rf">Transaction reference</label>
                <input id="rf" value={f.ref} onChange={set("ref")} placeholder="MP260904.1102.K44821" /></div>
            )}

            <div className="sign" data-done={f.landlordSigned}>
              <h4>{f.landlordSigned ? "You have signed" : "You sign first"}</h4>
              <p>{f.landlordSigned
                ? "Now hand the phone to your tenant."
                : "Confirming you received this money."}</p>
              {!f.landlordSigned && (
                <button className="btn" onClick={() => setF({ ...f, landlordSigned: true })}>
                  <Check size={14} strokeWidth={3} /> I received this
                </button>
              )}
            </div>

            {f.landlordSigned && (
              <div className="sign" data-done={f.tenantSigned}>
                <h4>{f.tenantSigned
                  ? `${modal.lease.tenantName} has signed`
                  : `Hand the phone to ${modal.lease.tenantName}`}</h4>
                <p>{f.tenantSigned
                  ? "Both signatures captured. Save it."
                  : "Only they should press this. It is their record too."}</p>
                {!f.tenantSigned && (
                  <button className="btn" onClick={() => setF({ ...f, tenantSigned: true })}>
                    <Check size={14} strokeWidth={3} /> I paid this
                  </button>
                )}
              </div>
            )}
          </>)}

          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <button className="btn" data-v="quiet" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button className="btn" onClick={submit} disabled={!ready} style={{ flex: 2 }}>
              {modal.t === "payment" ? "Save to the rent book" : "Save"}
            </button>
          </div>
          {modal.t === "payment" && !ready && parseFloat(f.amount) > 0 && (
            <p className="note" style={{ marginTop: 10, marginBottom: 0 }}>
              Both signatures are needed. That is the whole point — an entry only one person
              agreed to is not worth having.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
