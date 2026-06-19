import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Timer, Play, Pause, RotateCcw, Plus, ClipboardList, LayoutDashboard,
  BarChart3, ChevronLeft, Trash2, Download, CheckCircle2, Circle, CircleDot,
  Clock, AlertTriangle, Settings, X, Calendar, Target, TrendingUp,
  Package, Wrench, Zap, Share2, Copy, Check, Send, Mail, MessageCircle,
  BellOff, Flame, Star, Trophy, Award, Volume2, VolumeX, Crown, Rocket, Moon, Sun
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from "recharts";

/* ============================ Paleta Kahoot ============================ */
const PURP_BG = "linear-gradient(165deg,#0B1F3A 0%,#102A4A 55%,#15375E 100%)";
const HEAD_BG = "linear-gradient(180deg,rgba(6,15,30,.55),rgba(6,15,30,.25))";
const INK = "var(--ink)";
const K = { red: "#CC3A52", blue: "#2E6FB0", gold: "#C9A24B", green: "#2F8F6B", purple: "#173A63", magenta: "#38618F", lime: "#6FA98C", yellow: "#C9A24B", orange: "#C98A3C" };
const PARTY = ["#CC3A52", "#2E6FB0", "#C9A24B", "#2F8F6B", "#38618F", "#3FA9A9", "#C98A3C", "#6FA98C"];

const STATUS = {
  green: { label: "En curso", color: "#1F7A52", soft: "#E3F2EB", shape: "■" },
  amber: { label: "Atención", color: "#B07D1E", soft: "#FBF1DA", shape: "●" },
  red: { label: "Crítico", color: "#BB3046", soft: "#FBE4E8", shape: "▲" },
};
const DTYPES = ["Informe", "Acta / Checklist", "Matriz de riesgos", "Plan de acción", "Certificado", "Evidencia"];

/* ============================ Utilidades ============================ */
const uid = () => Math.random().toString(36).slice(2, 9);
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const fmtCOP = (n) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const fmtDate = (iso) => { if (!iso) return "—"; const d = new Date(iso + "T00:00:00"); return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }); };
const daysUntil = (iso) => { if (!iso) return 999; return Math.ceil((new Date(iso + "T23:59:59") - new Date()) / 86400000); };
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const reducedMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };

const orderProgress = (o) => {
  const a = o.activities || [];
  const est = a.reduce((s, x) => s + (x.estimatedPomodoros || 0), 0);
  const done = a.reduce((s, x) => s + (x.completedPomodoros || 0), 0);
  return est > 0 ? Math.min(100, Math.round((done / est) * 100)) : 0;
};
const orderPoms = (o) => {
  const a = o.activities || [];
  return { est: a.reduce((s, x) => s + (x.estimatedPomodoros || 0), 0), done: a.reduce((s, x) => s + (x.completedPomodoros || 0), 0) };
};
const allDeliverables = (o) => (o.activities || []).flatMap((a) => a.deliverables || []);
const orderStatus = (o) => {
  if (o.status === "completed") return "green";
  const p = orderProgress(o), d = daysUntil(o.endDate);
  if (d < 0) return "red";
  if (d <= 2 && p < 70) return "red";
  if (p < 40 && d <= 3) return "red";
  if (p < 50 && d <= 5) return "amber";
  if (d <= 5 && p < 70) return "amber";
  return "green";
};
const levelOf = (pts) => Math.floor((pts || 0) / 100) + 1;

/* ============================ Frases motivacionales por desempeño ============================ */
const PHRASES = {
  // Vas bien: ánimo y motivación
  bien: [
    "¡Imparable! Estás en tu mejor versión.",
    "Esto es enfoque de élite. Sigue así.",
    "Cada bloque te acerca a SafeTech Predict.",
    "Tu disciplina de hoy es tu libertad de mañana.",
    "¡La racha está encendida! No la sueltes.",
    "Así se construye un experto: un pomodoro a la vez.",
    "Estás demostrando de qué estás hecho.",
    "Foco total. El mundo se aparta de quien sabe a dónde va.",
  ],
  // Vas más o menos: avanzar / inspirar a la acción
  medio: [
    "Vas en camino, no aflojes ahora.",
    "Un pomodoro más y tomas vuelo.",
    "Hecho es mejor que perfecto. Sigue avanzando.",
    "No necesitas ser rápido, solo no detenerte.",
    "Sube una marcha: el siguiente bloque es tuyo.",
    "El impulso se construye paso a paso.",
    "Pequeños avances, gran resultado. Sigue sumando.",
    "Ya arrancaste, que es lo más difícil. Dale.",
  ],
  // Vas mal: estoicas duras / choque de realidad
  mal: [
    "La disciplina no negocia. Vuelve al ruedo.",
    "No esperes ganas: actúa, y las ganas llegarán.",
    "Las excusas no entregan informes. El trabajo sí.",
    "El tiempo perdido no regresa. Recupéralo con foco.",
    "Domina la tarea o la tarea te dominará a ti.",
    "Nadie vendrá a hacerlo por ti. Solo tú.",
    "Cae siete veces, levántate ocho. De pie.",
    "El que controla su atención, controla su vida.",
    "Sufre hoy la disciplina o sufre mañana el arrepentimiento.",
  ],
};
const pickPhrase = (tier) => { const a = PHRASES[tier] || PHRASES.medio; return a[Math.floor(Math.random() * a.length)]; };

const downloadJSON = (filename, obj) => {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ============================ Motor de sonido (Web Audio) ============================ */
let SOUND = true;
let _ac = null;
function ac() {
  try {
    if (!_ac) { const C = window.AudioContext || window.webkitAudioContext; _ac = new C(); }
    if (_ac.state === "suspended") _ac.resume();
    return _ac;
  } catch (e) { return null; }
}
function tone(freq, start, dur, type = "sine", gain = 0.18) {
  if (!SOUND) return;
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  o.connect(g); g.connect(c.destination);
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.start(t); o.stop(t + dur + 0.03);
}
const sReward = () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.085, 0.18, "triangle", 0.2)); };
const sLevelUp = () => { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, i * 0.1, 0.22, "triangle", 0.2)); };
const sPenalty = () => { tone(196, 0, 0.22, "sawtooth", 0.22); tone(146, 0.13, 0.3, "sawtooth", 0.2); };
const sTick = () => tone(900, 0, 0.05, "square", 0.12);
const sStart = () => { tone(440, 0, 0.06, "sine", 0.15); tone(660, 0.06, 0.09, "sine", 0.15); };
const sClick = () => tone(560, 0, 0.04, "sine", 0.07);

/* ============================ Persistencia ============================ */
const KEY = "safetech:data:v1";
async function loadData() {
  try { const r = await window.storage.get(KEY); if (r && r.value) return JSON.parse(r.value); } catch (e) {}
  return null;
}
async function saveData(data) { try { await window.storage.set(KEY, JSON.stringify(data)); } catch (e) { console.error(e); } }

const seed = () => ({
  settings: { work: 25, short: 5, long: 15, longEvery: 4, focusOnStart: true, sound: true, dailyGoal: 8, theme: "day" },
  game: { points: 120, streak: 2, bestStreak: 5 },
  sessions: [
    { id: uid(), date: addDays(-1), duration: 25, orderId: "OS-2026-001" },
    { id: uid(), date: addDays(-1), duration: 25, orderId: "OS-2026-001" },
    { id: uid(), date: todayISO(), duration: 25, orderId: "OS-2026-001" },
    { id: uid(), date: todayISO(), duration: 25, orderId: "OS-2026-003" },
  ],
  orders: [
    {
      id: "OS-2026-001", number: "OS-2026-001", type: "OS", client: "Manufacturas ABC S.A.S.",
      scope: "Auditoría de seguridad en maquinaria — prensas y aire comprimido",
      resource: "Javier (100%) · Termocámara · Multímetro",
      value: 6500000, start: addDays(-5), endDate: addDays(8), status: "in_progress",
      activities: [
        { id: uid(), name: "Inspección física", desc: "Guardas, LOTO, puesta a cero", estimatedPomodoros: 8, completedPomodoros: 7,
          deliverables: [
            { id: uid(), name: "Checklist de inspección", type: "Acta / Checklist", status: "completed", due: addDays(-2) },
            { id: uid(), name: "Acta de hallazgos", type: "Informe", status: "in_progress", due: addDays(2) },
          ] },
        { id: uid(), name: "Análisis de riesgos", desc: "Matriz ISO 12100", estimatedPomodoros: 6, completedPomodoros: 2,
          deliverables: [{ id: uid(), name: "Matriz de riesgos", type: "Matriz de riesgos", status: "pending", due: addDays(5) }] },
        { id: uid(), name: "Informe ejecutivo", desc: "Documento final + plan de acción", estimatedPomodoros: 10, completedPomodoros: 0,
          deliverables: [{ id: uid(), name: "Informe técnico", type: "Informe", status: "pending", due: addDays(8) }] },
      ],
    },
    {
      id: "OT-2026-002", number: "OT-2026-002", type: "OT", client: "Industrias DEF Ltda.",
      scope: "Evaluación de riesgo eléctrico y energías peligrosas",
      resource: "Javier (80%)", value: 4800000, start: addDays(-1), endDate: addDays(4), status: "in_progress",
      activities: [
        { id: uid(), name: "Levantamiento en planta", desc: "Tableros y motores", estimatedPomodoros: 5, completedPomodoros: 1,
          deliverables: [{ id: uid(), name: "Registro fotográfico", type: "Evidencia", status: "pending", due: addDays(2) }] },
        { id: uid(), name: "Evaluación de controles", desc: "IEC 60204-1", estimatedPomodoros: 6, completedPomodoros: 0,
          deliverables: [{ id: uid(), name: "Recomendaciones", type: "Plan de acción", status: "pending", due: addDays(4) }] },
      ],
    },
    {
      id: "OS-2026-003", number: "OS-2026-003", type: "OS", client: "Química GHI S.A.",
      scope: "Auditoría de seguridad de procesos químicos",
      resource: "Javier (100%)", value: 3200000, start: addDays(-12), endDate: addDays(1), status: "in_progress",
      activities: [
        { id: uid(), name: "Inspección de proceso", desc: "Líneas y válvulas", estimatedPomodoros: 8, completedPomodoros: 1,
          deliverables: [{ id: uid(), name: "Certificado de auditoría", type: "Certificado", status: "pending", due: addDays(1) }] },
      ],
    },
  ],
});

/* ============================ Resúmenes para compartir ============================ */
const DOT = { green: "🟢", amber: "🟡", red: "🔴" };
function buildOrderSummary(o) {
  const st = o.status === "completed" ? "green" : orderStatus(o);
  const p = orderProgress(o); const { done, est } = orderPoms(o);
  const dels = allDeliverables(o); const dd = dels.filter((d) => d.status === "completed").length;
  const days = daysUntil(o.endDate);
  const dueTxt = o.status === "completed" ? "Finalizada" : days < 0 ? `vencida hace ${-days} d` : days === 0 ? "vence hoy" : `${days} días restantes`;
  const acts = o.activities.map((a) => `• ${a.name} — ${a.estimatedPomodoros ? Math.min(100, Math.round((a.completedPomodoros / a.estimatedPomodoros) * 100)) : 0}%`).join("\n");
  return `🔧 *SafeTech — Estado de orden*\n\n📋 ${o.number} (${o.type || "OS"}) · ${o.client}\n${DOT[st]} ${o.status === "completed" ? "Finalizada" : STATUS[st].label} · ${p}% de avance\n\n⏱️ Pomodoros: ${done}/${est}\n📦 Entregables: ${dd}/${dels.length} completados\n📅 ${fmtDate(o.endDate)} (${dueTxt})\n💰 Valor: ${fmtCOP(o.value)}\n\n*Actividades*\n${acts || "—"}\n\n— Generado con SafeTech Gestión`;
}
function buildDailySummary(orders, sessions, game) {
  const today = sessions.filter((s) => s.date === todayISO()).length;
  const counts = { green: 0, amber: 0, red: 0 };
  orders.forEach((o) => { if (o.status !== "completed") counts[orderStatus(o)]++; });
  const alerts = orders.filter((o) => o.status !== "completed" && orderStatus(o) !== "green")
    .sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate))
    .map((o) => { const d = daysUntil(o.endDate); const t = d < 0 ? `vencida ${-d}d` : d === 0 ? "vence hoy" : `${d} días`; return `${DOT[orderStatus(o)]} ${o.client} — ${t}`; }).join("\n");
  const g = game ? `\n🏆 Nivel ${levelOf(game.points)} · ${game.points} pts · racha 🔥${game.streak}` : "";
  return `📊 *Resumen del día — ${new Date().toLocaleDateString("es-CO", { day: "numeric", month: "long" })}*\n\n⏱️ ${today} pomodoros (${(today * 25 / 60).toFixed(1)} h de enfoque)${g}\n\n🚦 Portafolio:  🟢 ${counts.green}   🟡 ${counts.amber}   🔴 ${counts.red}\n${alerts ? `\n*Atención*\n${alerts}` : "\nSin alertas activas ✅"}\n\n— SafeTech Gestión`;
}
function buildWeeklySummary(orders, sessions, game) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(-(6 - i)));
  const week = days.reduce((s, d) => s + sessions.filter((x) => x.date === d).length, 0);
  const active = orders.filter((o) => o.status !== "completed").length;
  const avg = orders.length ? Math.round(orders.reduce((s, o) => s + orderProgress(o), 0) / orders.length) : 0;
  const totalValue = orders.reduce((s, o) => s + (o.value || 0), 0);
  const lines = orders.map((o) => `${DOT[o.status === "completed" ? "green" : orderStatus(o)]} ${o.number} — ${orderProgress(o)}%`).join("\n");
  const g = game ? `\n🏆 Nivel ${levelOf(game.points)} · ${game.points} pts · mejor racha 🔥${game.bestStreak}` : "";
  return `📈 *Resumen semanal — SafeTech*\n\n⏱️ ${week} pomodoros · ${(week * 25 / 60).toFixed(1)} h de enfoque${g}\n📋 ${active} órdenes activas · avance medio ${avg}%\n💰 Portafolio: ${fmtCOP(totalValue)}\n\n*Avance por orden*\n${lines || "—"}\n\n— SafeTech Gestión`;
}

/* ============================ Estilos globales y piezas ============================ */
function GlobalStyles() {
  return (<style>{`
    .k-app{font-family:"ui-rounded","SF Pro Rounded","Hiragino Maru Gothic ProN",system-ui,"Segoe UI",sans-serif;}
    .theme-day{--card:#FFFFFF;--ink:#0E2138;--soft:#EEF3F9;--track:#D8E2EF;}
    .theme-night{--card:#15181D;--ink:#B7BEC8;--soft:#1C2027;--track:#2A2F38;filter:brightness(.78) saturate(.5);}
    .surface{background:var(--card);}
    .k-input{width:100%;border-radius:.75rem;border:2px solid var(--track);background:var(--soft);padding:.625rem .75rem;font-size:.875rem;font-weight:600;color:var(--ink);outline:none;}
    .k-input:focus{border-color:#2E6FB0;}
    .k-input::placeholder{color:#7C8A9C;opacity:.85;}
    .k-btn{transition:transform .08s ease, box-shadow .08s ease; box-shadow:0 5px 0 rgba(0,0,0,.28);}
    .k-btn:active{transform:translateY(4px); box-shadow:0 1px 0 rgba(0,0,0,.28);}
    .k-card{box-shadow:0 6px 0 rgba(8,20,40,.10);}
    .anim-up{animation:kUp .42s ease both;}
    .anim-pop{animation:kPop .5s cubic-bezier(.2,.9,.3,1.25) both;}
    .anim-celeb{animation:kCeleb .55s cubic-bezier(.2,.9,.3,1.3) both;}
    .anim-pulse-big{animation:kPulse 1s ease-in-out infinite;}
    .anim-flame{animation:kFlame 1.1s ease-in-out infinite;}
    @keyframes kUp{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes kPop{0%{transform:scale(.7);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
    @keyframes kCeleb{0%{transform:scale(.55);opacity:0}55%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}
    @keyframes kPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
    @keyframes kFlame{0%,100%{transform:scale(1) rotate(-5deg)}50%{transform:scale(1.18) rotate(5deg)}}
    @keyframes kFloat{0%{transform:translate(-50%,0) scale(1);opacity:1}100%{transform:translate(-50%,-95px) scale(1.35);opacity:0}}
    @keyframes kConfetti{0%{transform:translateY(-12vh) rotate(0)}100%{transform:translateY(115vh) rotate(720deg)}}
    @keyframes kFlash{0%{opacity:0}25%{opacity:.55}100%{opacity:0}}
    @keyframes kShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(10px)}45%{transform:translateX(-8px)}60%{transform:translateX(8px)}75%{transform:translateX(-4px)}}
    .anim-shake{animation:kShake .55s both;}
    @media (prefers-reduced-motion: reduce){.anim-up,.anim-pop,.anim-celeb,.anim-pulse-big,.anim-flame,.anim-shake{animation:none !important;}}
  `}</style>);
}

function KBtn({ color = "#ffffff", textColor = "#fff", onClick, children, className = "", disabled, sound = true }) {
  return (
    <button onClick={(e) => { if (sound) sClick(); onClick && onClick(e); }} disabled={disabled}
      className={`k-btn rounded-2xl font-extrabold ${className}`}
      style={{ background: color, color: textColor, boxShadow: disabled ? "none" : undefined, opacity: disabled ? 0.45 : 1 }}>
      {children}
    </button>
  );
}
function ProgressBar({ value, color = "#173A63", track = "var(--track)", height = 12 }) {
  return (
    <div style={{ height, background: track }} className="w-full overflow-hidden rounded-full">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color, transition: "width .6s cubic-bezier(.2,.9,.3,1)" }} />
    </div>
  );
}
function StatusChip({ status }) {
  const s = STATUS[status];
  return <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold" style={{ background: s.soft, color: s.color }}><span>{s.shape}</span>{s.label}</span>;
}
function TypeBadge({ type }) {
  const ot = type === "OT";
  return <span className="rounded-md px-1.5 py-0.5 text-[10px] font-extrabold text-white" style={{ background: ot ? K.magenta : K.blue }}>{ot ? "OT" : "OS"}</span>;
}
function Stat({ icon: Icon, label, value, sub, accent = "#173A63" }) {
  return (
    <div className="k-card rounded-2xl surface p-4">
      <div className="flex items-center gap-1.5" style={{ color: accent }}><Icon className="h-4 w-4" /><span className="text-[11px] font-extrabold uppercase tracking-wide">{label}</span></div>
      <div className="mt-1.5 text-2xl font-black tabular-nums" style={{ color: INK }}>{value}</div>
      {sub && <div className="text-xs font-bold" style={{ color: "#6B7A8D" }}>{sub}</div>}
    </div>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-4" style={{ background: "rgba(6,14,28,.62)", zIndex: 70 }} onClick={onClose}>
      <div className="anim-up k-app w-full max-w-md rounded-t-3xl surface p-5 sm:rounded-3xl" style={{ color: INK }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5" style={{ color: "#7C8A9C" }}><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
const Field = ({ label, children }) => (<label className="block"><span className="mb-1 block text-xs font-extrabold" style={{ color: "#5B6B7E" }}>{label}</span>{children}</label>);
const inputCls = "k-input";

/* Efectos: confeti, flash, floater, celebración */
function Confetti({ fire }) {
  const [pieces, setPieces] = useState([]);
  useEffect(() => {
    if (!fire || reducedMotion()) return;
    const arr = Array.from({ length: 64 }, (_, i) => ({
      id: i + "-" + fire, left: Math.random() * 100, delay: Math.random() * 0.25,
      dur: 1.8 + Math.random() * 1.3, color: PARTY[i % PARTY.length], size: 7 + Math.random() * 8, rot: Math.random() * 360,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 3300);
    return () => clearTimeout(t);
  }, [fire]);
  if (!pieces.length) return null;
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 90 }}>
      {pieces.map((p) => (
        <span key={p.id} style={{ position: "absolute", left: p.left + "%", top: "-5%", width: p.size, height: p.size * 0.55, background: p.color, transform: `rotate(${p.rot}deg)`, animation: `kConfetti ${p.dur}s ${p.delay}s linear forwards`, borderRadius: 2 }} />
      ))}
    </div>
  );
}
function ScreenFlash({ flash }) {
  if (!flash) return null;
  return <div key={flash.n} className="pointer-events-none fixed inset-0" style={{ background: flash.color, zIndex: 88, animation: "kFlash .8s ease forwards" }} />;
}
function Floater({ floater }) {
  if (!floater) return null;
  return <div key={floater.n} className="pointer-events-none fixed left-1/2 font-black" style={{ top: "32%", zIndex: 92, color: floater.color, fontSize: 56, textShadow: "0 3px 0 rgba(0,0,0,.25)", animation: "kFloat 1.15s ease forwards" }}>{floater.text}</div>;
}
function Celebration({ celeb, onClose }) {
  if (!celeb) return null;
  return (
    <div className="k-app fixed inset-0 flex flex-col items-center justify-center px-8 text-center text-white" style={{ background: celeb.color, zIndex: 95 }} onClick={onClose}>
      <div className="anim-celeb" style={{ fontSize: 84 }}>{celeb.emoji}</div>
      <div className="anim-celeb mt-3 text-3xl font-black" style={{ textShadow: "0 3px 0 rgba(0,0,0,.25)" }}>{celeb.title}</div>
      {celeb.subtitle && <div className="anim-up mt-2 text-lg font-bold opacity-90">{celeb.subtitle}</div>}
      <KBtn color="#ffffff" textColor={celeb.color} className="anim-up mt-8 px-8 py-3 text-base" onClick={onClose}>¡Seguir!</KBtn>
    </div>
  );
}

/* Anillo del temporizador */
function Ring({ pct, color, size = 280, stroke = 16, track = "var(--track)", children, urgent }) {
  const R = size / 2 - stroke, C = 2 * Math.PI * R;
  return (
    <div className={`relative ${urgent ? "anim-pulse-big" : ""}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/* Pantalla de enfoque (estilo juego) */
function FocusOverlay({ mode, modeMeta, secs, running, cycle, settings, game, ctxOrder, ctxAct, onToggle, onReset, onExit }) {
  const mm = modeMeta[mode];
  const total = mm.dur * 60; const pct = total ? ((total - secs) / total) * 100 : 0;
  const urgent = running && mode === "work" && secs <= 5 && secs > 0;
  const ringColor = urgent ? K.red : "#FFFFFF";
  return (
    <div className="k-app fixed inset-0 flex flex-col items-center justify-center px-6 text-white" style={{ background: "linear-gradient(165deg,#081A33,#0B1F3A)", zIndex: 60 }}>
      <button onClick={onExit} className="absolute right-5 top-5 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: "rgba(255,255,255,.12)" }}>Salir <X className="h-3.5 w-3.5" /></button>
      <div className="mb-5 flex items-center gap-4">
        <span className="flex items-center gap-1 text-sm font-black"><Flame className="h-4 w-4" style={{ color: K.orange }} /> {game.streak}</span>
        <span className="flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4" style={{ color: K.yellow }} /> {game.points}</span>
      </div>
      <Ring pct={pct} color={ringColor} size={300} stroke={18} track="rgba(255,255,255,.16)" urgent={urgent}>
        <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: urgent ? K.red : mm.tint }}>{mm.label}</span>
        <span className="font-black tabular-nums" style={{ fontSize: 64 }}>{mmss(secs)}</span>
      </Ring>
      <div className="mt-5 text-center">
        {ctxOrder && ctxAct ? (
          <>
            <div className="text-sm font-extrabold">{ctxAct.name}</div>
            <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs opacity-80">{ctxOrder.type && <TypeBadge type={ctxOrder.type} />} {ctxOrder.number} · {ctxOrder.client}</div>
          </>
        ) : <div className="text-sm opacity-70">Sesión sin asignar</div>}
      </div>
      <div className="mt-9 flex items-center gap-5">
        <KBtn color="rgba(255,255,255,.16)" className="p-4" onClick={onReset}><RotateCcw className="h-5 w-5" /></KBtn>
        <KBtn color={mm.color} className="p-6" sound={false} onClick={onToggle}>{running ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-0.5" />}</KBtn>
      </div>
      <div className="mt-10 flex max-w-xs items-center gap-2 rounded-full px-4 py-2 text-center text-[11px]" style={{ background: "rgba(255,255,255,.08)" }}>
        <BellOff className="h-4 w-4 shrink-0" /><span>Activa “No molestar” para silenciar las notificaciones del teléfono</span>
      </div>
    </div>
  );
}

/* ============================ App ============================ */
export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState({ work: 25, short: 5, long: 15, longEvery: 4, focusOnStart: true, sound: true, dailyGoal: 8, theme: "day" });
  const [game, setGame] = useState({ points: 0, streak: 0, bestStreak: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [shareData, setShareData] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  // Timer
  const [mode, setMode] = useState("work");
  const [secs, setSecs] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [ctxOrder, setCtxOrder] = useState(null);
  const [ctxAct, setCtxAct] = useState(null);

  // Feedback transitorio
  const [toast, setToast] = useState("");
  const [burst, setBurst] = useState(0);
  const [screenFlash, setScreenFlash] = useState(null);
  const [floater, setFloater] = useState(null);
  const [celeb, setCeleb] = useState(null);
  const [shaking, setShaking] = useState(false);

  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await loadData();
      const d = data || seed();
      setOrders(d.orders); setSessions(d.sessions);
      const st = { work: 25, short: 5, long: 15, longEvery: 4, focusOnStart: true, sound: true, dailyGoal: 8, theme: "day", ...d.settings };
      setSettings(st); SOUND = st.sound !== false;
      setGame({ points: 0, streak: 0, bestStreak: 0, ...(d.game || {}) });
      setSecs((st.work || 25) * 60);
      if (!data) await saveData(d);
      loaded.current = true; setLoading(false);
    })();
  }, []);

  useEffect(() => { if (loaded.current) saveData({ settings, game, orders, sessions }); }, [orders, sessions, settings, game]);
  useEffect(() => { SOUND = settings.sound !== false; }, [settings.sound]);

  // Reloj
  useEffect(() => {
    if (!running) return;
    if (secs <= 0) { handleComplete(); return; }
    const id = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [running, secs]);

  // Tic de urgencia en los últimos 5s del enfoque
  useEffect(() => { if (running && mode === "work" && secs > 0 && secs <= 5) sTick(); }, [secs]);

  // Auto modo enfoque al iniciar
  useEffect(() => { if (running && mode === "work" && settings.focusOnStart) setFocusMode(true); }, [running]);

  // Wake Lock
  useEffect(() => {
    let lock = null;
    const acquire = async () => { try { if ("wakeLock" in navigator && running) lock = await navigator.wakeLock.request("screen"); } catch (e) {} };
    const onVis = () => { if (document.visibilityState === "visible" && running) acquire(); };
    if (running) acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); try { lock && lock.release(); } catch (e) {} };
  }, [running]);

  const modeMeta = {
    work: { label: "Enfoque", color: K.green, tint: "#C9F5BD", dur: settings.work },
    short: { label: "Descanso", color: K.blue, tint: "#BBD9FF", dur: settings.short },
    long: { label: "Descanso largo", color: K.magenta, tint: "#F3C2E4", dur: settings.long },
  };

  const fireConfetti = () => { if (!reducedMotion()) setBurst((b) => b + 1); };
  const showCeleb = (c, dur = 3600) => { setCeleb({ ...c, n: Date.now() }); setTimeout(() => setCeleb(null), dur); };

  function handleComplete() {
    setRunning(false);
    if (mode === "work") {
      setSessions((p) => [...p, { id: uid(), date: todayISO(), duration: settings.work, orderId: ctxOrder?.id || null }]);

      let activityCompleted = false;
      if (ctxOrder && ctxAct) {
        const liveO = orders.find((o) => o.id === ctxOrder.id);
        const a = liveO && liveO.activities.find((x) => x.id === ctxAct.id);
        if (a && (a.completedPomodoros || 0) + 1 >= a.estimatedPomodoros && (a.completedPomodoros || 0) < a.estimatedPomodoros) activityCompleted = true;
        setOrders((prev) => prev.map((o) => o.id !== ctxOrder.id ? o : {
          ...o, activities: o.activities.map((x) => x.id !== ctxAct.id ? x : { ...x, completedPomodoros: (x.completedPomodoros || 0) + 1 }),
        }));
      }

      const g = game;
      const newStreak = g.streak + 1;
      let pts = 10, milestone = null;
      if (activityCompleted) { pts += 50; milestone = "activity"; }
      else if (newStreak % settings.longEvery === 0) { pts += 20; milestone = "streak"; }
      const oldLevel = levelOf(g.points);
      const newPoints = g.points + pts;
      const leveled = levelOf(newPoints) > oldLevel;
      setGame({ points: newPoints, streak: newStreak, bestStreak: Math.max(g.bestStreak, newStreak) });

      const tier = (activityCompleted || newStreak >= 3) ? "bien" : "medio";
      const phrase = pickPhrase(tier);

      sReward(); fireConfetti();
      setScreenFlash({ color: "rgba(38,137,12,.85)", n: Date.now() });
      setFloater({ text: `+${pts}`, color: K.yellow, n: Date.now() });

      if (leveled) { showCeleb({ emoji: "🚀", title: `¡NIVEL ${levelOf(newPoints)}!`, subtitle: phrase, color: K.purple }); sLevelUp(); }
      else if (milestone === "activity") { showCeleb({ emoji: "🏆", title: "¡ACTIVIDAD COMPLETADA!", subtitle: phrase, color: K.blue }); sLevelUp(); }
      else if (milestone === "streak") { showCeleb({ emoji: "🔥", title: `¡RACHA x${newStreak}!`, subtitle: phrase, color: K.orange }); sLevelUp(); }
      else { showCeleb({ emoji: "💪", title: `+${pts} puntos`, subtitle: phrase, color: K.green }, 2600); }

      const nextCycle = cycle + 1; setCycle(nextCycle);
      const isLong = nextCycle % settings.longEvery === 0;
      setMode(isLong ? "long" : "short"); setSecs((isLong ? settings.long : settings.short) * 60);
    } else {
      tone(660, 0, 0.12, "sine", 0.14);
      setMode("work"); setSecs(settings.work * 60);
      setToast("Descanso terminado. ¡A enfocar!");
    }
    setTimeout(() => setToast(""), 3500);
  }

  function handleReset() {
    const total = modeMeta[mode].dur * 60;
    const elapsed = total - secs;
    if (running && mode === "work" && elapsed >= 60) {
      setRunning(false);
      setGame((g) => ({ ...g, points: Math.max(0, g.points - 5), streak: 0 }));
      sPenalty();
      setScreenFlash({ color: "rgba(226,27,60,.8)", n: Date.now() });
      setFloater({ text: "-5", color: "#FFD0D8", n: Date.now() });
      setShaking(true); setTimeout(() => setShaking(false), 560);
      showCeleb({ emoji: "💢", title: "RACHA PERDIDA", subtitle: pickPhrase("mal"), color: K.red }, 3400);
      setSecs(total);
    } else { setRunning(false); setSecs(total); }
  }

  function startPomodoroFor(order, act) {
    setCtxOrder(order); setCtxAct(act);
    setMode("work"); setSecs(settings.work * 60); setRunning(false);
    setView("pomodoro");
  }

  const selected = orders.find((o) => o.id === selectedId);
  const night = settings.theme === "night";
  const addOrder = (o) => setOrders((p) => [{ ...o, id: o.number || uid(), activities: [], status: "in_progress" }, ...p]);
  const removeOrder = (id) => { setOrders((p) => p.filter((o) => o.id !== id)); setView("orders"); };
  const toggleComplete = (id) => setOrders((p) => p.map((o) => o.id === id ? { ...o, status: o.status === "completed" ? "in_progress" : "completed" } : o));
  const addActivity = (orderId, act) => setOrders((p) => p.map((o) => o.id !== orderId ? o : { ...o, activities: [...o.activities, { ...act, id: uid(), completedPomodoros: 0, deliverables: [] }] }));
  const removeActivity = (orderId, actId) => setOrders((p) => p.map((o) => o.id !== orderId ? o : { ...o, activities: o.activities.filter((a) => a.id !== actId) }));
  const addDeliverable = (orderId, actId, del) => setOrders((p) => p.map((o) => o.id !== orderId ? o : { ...o, activities: o.activities.map((a) => a.id !== actId ? a : { ...a, deliverables: [...(a.deliverables || []), { ...del, id: uid(), status: "pending" }] }) }));
  const cycleDeliverable = (orderId, actId, delId) => {
    const next = { pending: "in_progress", in_progress: "completed", completed: "pending" };
    setOrders((p) => p.map((o) => o.id !== orderId ? o : { ...o, activities: o.activities.map((a) => a.id !== actId ? a : { ...a, deliverables: a.deliverables.map((d) => d.id !== delId ? d : { ...d, status: next[d.status] }) }) }));
  };

  if (loading) {
    return (<div className="k-app theme-day flex h-screen items-center justify-center" style={{ background: PURP_BG }}>
      <div className="flex items-center gap-2 text-sm font-bold text-white/80"><Clock className="h-4 w-4 animate-spin" /> Cargando…</div>
    </div>);
  }

  const navItems = [
    { k: "dashboard", icon: LayoutDashboard, label: "Inicio" },
    { k: "orders", icon: ClipboardList, label: "Órdenes" },
    { k: "pomodoro", icon: Timer, label: "Pomodoro" },
    { k: "metrics", icon: BarChart3, label: "Métricas" },
  ];

  return (
    <div className={`k-app ${night ? "theme-night" : "theme-day"} mx-auto flex h-screen max-w-md flex-col`} style={{ background: PURP_BG }}>
      <GlobalStyles />

      {/* Cabecera con estado de jugador */}
      <header className="flex items-center justify-between px-4 py-3 text-white" style={{ background: HEAD_BG, backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: K.yellow }}><Wrench className="h-5 w-5" style={{ color: K.purple }} /></div>
          <div>
            <div className="text-sm font-black leading-none">SafeTech</div>
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">Nivel {levelOf(game.points)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {running && <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black tabular-nums" style={{ background: "rgba(255,255,255,.15)" }}><span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: K.lime }} /> {mmss(secs)}</span>}
          <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black" style={{ background: "rgba(255,255,255,.15)" }}><Star className="h-3.5 w-3.5" style={{ color: K.yellow }} /> {game.points}</span>
          <button onClick={() => setSettings((s) => ({ ...s, sound: !s.sound }))} className="rounded-full p-1.5" style={{ background: "rgba(255,255,255,.12)" }}>
            {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 opacity-60" />}
          </button>
          <button onClick={() => { sClick(); setSettings((s) => ({ ...s, theme: s.theme === "night" ? "day" : "night" })); }} className="rounded-full p-1.5" style={{ background: "rgba(255,255,255,.12)" }} aria-label="Cambiar modo día o noche">
            {night ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className={`flex-1 overflow-y-auto px-4 pb-28 pt-4 ${shaking ? "anim-shake" : ""}`}>
        {view === "dashboard" && <Dashboard orders={orders} sessions={sessions} game={game} settings={settings} onShare={setShareData} onOpen={(id) => { setSelectedId(id); setView("order"); }} />}
        {view === "orders" && <OrdersView orders={orders} onOpen={(id) => { setSelectedId(id); setView("order"); }} onAdd={addOrder} />}
        {view === "order" && selected && (
          <OrderDetail order={selected} onBack={() => setView("orders")}
            onAddActivity={addActivity} onRemoveActivity={removeActivity} onAddDeliverable={addDeliverable}
            onCycleDeliverable={cycleDeliverable} onToggleComplete={toggleComplete} onRemoveOrder={removeOrder}
            onStartPomodoro={startPomodoroFor} onShare={setShareData} />
        )}
        {view === "pomodoro" && (
          <Pomodoro mode={mode} modeMeta={modeMeta} secs={secs} running={running} cycle={cycle}
            settings={settings} setSettings={setSettings} game={game} ctxOrder={ctxOrder} ctxAct={ctxAct} orders={orders}
            onToggle={() => { if (!running) sStart(); setRunning((r) => !r); }} onReset={handleReset}
            onSetMode={(m) => { setRunning(false); setMode(m); setSecs(modeMeta[m].dur * 60); }}
            onPickCtx={(o, a) => { setCtxOrder(o); setCtxAct(a); }} onEnterFocus={() => setFocusMode(true)}
            todayCount={sessions.filter((s) => s.date === todayISO()).length} />
        )}
        {view === "metrics" && <Metrics orders={orders} sessions={sessions} game={game} onShare={setShareData} />}
      </main>

      {/* Toast */}
      {toast && view !== "pomodoro" && (
        <div className="fixed bottom-28 left-1/2 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-center text-sm font-extrabold text-white" style={{ background: "#11233B", zIndex: 50 }}>{toast}</div>
      )}

      {/* Efectos */}
      <ScreenFlash flash={screenFlash} />
      <Confetti fire={burst} />
      <Floater floater={floater} />
      <Celebration celeb={celeb} onClose={() => setCeleb(null)} />

      {shareData && <ShareSheet payload={shareData} onClose={() => setShareData(null)} />}
      {focusMode && (
        <FocusOverlay mode={mode} modeMeta={modeMeta} secs={secs} running={running} cycle={cycle} settings={settings} game={game}
          ctxOrder={ctxOrder} ctxAct={ctxAct} onToggle={() => { if (!running) sStart(); setRunning((r) => !r); }} onReset={handleReset} onExit={() => setFocusMode(false)} />
      )}

      {/* Navegación */}
      <nav className="fixed bottom-0 left-1/2 flex w-full max-w-md -translate-x-1/2 items-center justify-around px-3 py-2" style={{ background: "rgba(6,15,30,.55)", backdropFilter: "blur(10px)", zIndex: 40 }}>
        {navItems.map((t) => {
          const active = view === t.k || (t.k === "orders" && view === "order");
          return (
            <button key={t.k} onClick={() => { sClick(); setView(t.k); }} className="relative flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-extrabold transition"
              style={{ color: active ? K.yellow : "rgba(255,255,255,.65)", transform: active ? "scale(1.08)" : "scale(1)" }}>
              <t.icon className="h-5 w-5" />{t.label}
              {t.k === "pomodoro" && running && <span className="absolute right-2 top-0 h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: K.lime }} />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/* ============================ Dashboard (hogar de jugador) ============================ */
function Dashboard({ orders, sessions, game, settings, onOpen, onShare }) {
  const today = sessions.filter((s) => s.date === todayISO()).length;
  const totalPoms = sessions.length;
  const lvl = levelOf(game.points);
  const xp = game.points % 100;
  const goal = settings.dailyGoal || 8;
  const counts = { green: 0, amber: 0, red: 0 };
  orders.forEach((o) => { counts[orderStatus(o)]++; });
  const alerts = orders.filter((o) => o.status !== "completed" && orderStatus(o) !== "green").sort((a, b) => daysUntil(a.endDate) - daysUntil(b.endDate));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const moodTier = (game.streak >= 4 || today >= goal) ? "bien" : (game.streak >= 1 || today >= 1) ? "medio" : "mal";
  const moodPhrase = useMemo(() => pickPhrase(moodTier), [moodTier]);
  const moodFace = moodTier === "bien" ? "🔥" : moodTier === "medio" ? "💡" : "🗿";

  const badges = [
    { emoji: "🌱", name: "Primer paso", on: totalPoms >= 1 },
    { emoji: "🔥", name: "En racha", on: game.bestStreak >= 4 },
    { emoji: "⚡", name: "Imparable", on: game.bestStreak >= 8 },
    { emoji: "🏃", name: "Maratón", on: today >= 10 },
    { emoji: "⭐", name: "Nivel 5", on: lvl >= 5 },
    { emoji: "🏆", name: "Cerrador", on: orders.some((o) => o.status === "completed") },
    { emoji: "💯", name: "Centurión", on: totalPoms >= 100 },
  ];

  return (
    <div className="space-y-4 text-white">
      <div className="anim-up"><h1 className="text-2xl font-black leading-tight">{greet}, Javier 👋</h1>
        <p className="text-sm font-bold opacity-70">{new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p></div>

      {/* Frase del momento según el desempeño */}
      <div className="anim-pop flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: moodTier === "mal" ? "rgba(226,27,60,.22)" : "rgba(255,255,255,.12)", border: moodTier === "mal" ? "1px solid rgba(255,120,140,.55)" : "1px solid rgba(255,255,255,.18)" }}>
        <span style={{ fontSize: 26 }}>{moodFace}</span>
        <p className="text-sm font-extrabold leading-snug">{moodPhrase}</p>
      </div>

      {/* Tarjeta de jugador */}
      <div className="anim-pop k-card rounded-3xl p-5" style={{ background: "linear-gradient(135deg,#16365F,#38618F)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black" style={{ background: "rgba(255,255,255,.18)" }}><Crown className="h-7 w-7" style={{ color: K.yellow }} /></div>
            <div><div className="text-xs font-bold uppercase tracking-widest opacity-80">Nivel</div><div className="text-3xl font-black leading-none">{lvl}</div></div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 text-2xl font-black"><Star className="h-5 w-5" style={{ color: K.yellow }} />{game.points}</div>
            <div className="flex items-center justify-end gap-1 text-sm font-extrabold"><Flame className={`h-4 w-4 ${game.streak > 0 ? "anim-flame" : ""}`} style={{ color: K.orange }} /> racha {game.streak}</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-[11px] font-bold opacity-80"><span>Progreso al nivel {lvl + 1}</span><span>{xp}/100</span></div>
          <ProgressBar value={xp} color={K.yellow} track="rgba(255,255,255,.22)" height={10} />
        </div>
      </div>

      {/* Meta diaria + pomodoros */}
      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Timer} label="Pomodoros hoy" value={`${today}/${goal}`} sub={`${(today * 25 / 60).toFixed(1)} h de enfoque`} accent={K.green} />
        <div className="k-card rounded-2xl surface p-4">
          <div className="flex items-center gap-1.5" style={{ color: K.magenta }}><Target className="h-4 w-4" /><span className="text-[11px] font-extrabold uppercase tracking-wide">Meta diaria</span></div>
          <div className="mt-2"><ProgressBar value={Math.min(100, Math.round((today / goal) * 100))} color={today >= goal ? K.green : K.magenta} /></div>
          <div className="mt-1.5 text-xs font-bold" style={{ color: today >= goal ? K.green : "#6B7A8D" }}>{today >= goal ? "¡Meta cumplida! 🎉" : `Faltan ${goal - today}`}</div>
        </div>
      </div>

      {/* Portafolio (tiles tipo Kahoot) */}
      <div className="anim-up">
        <div className="mb-2 text-sm font-black opacity-90">Estado del portafolio</div>
        <div className="grid grid-cols-3 gap-2">
          {[["green", K.green], ["amber", K.gold], ["red", K.red]].map(([k, c]) => (
            <div key={k} className="k-card rounded-2xl py-3 text-center text-white" style={{ background: c }}>
              <div className="text-2xl font-black tabular-nums">{counts[k]}</div>
              <div className="text-xs font-extrabold">{STATUS[k].shape} {STATUS[k].label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alertas */}
      <div>
        <div className="mb-2 flex items-center gap-2 text-sm font-black"><AlertTriangle className="h-4 w-4" style={{ color: K.yellow }} /> Requieren atención</div>
        {alerts.length === 0 ? (
          <div className="rounded-2xl p-4 text-center text-sm font-bold text-white/70" style={{ background: "rgba(255,255,255,.08)" }}>Todo bajo control ✅</div>
        ) : (
          <div className="space-y-2">
            {alerts.map((o, i) => {
              const d = daysUntil(o.endDate);
              return (
                <button key={o.id} onClick={() => { sClick(); onOpen(o.id); }} className="anim-pop k-card flex w-full items-center gap-3 rounded-2xl surface p-3 text-left" style={{ animationDelay: i * 0.05 + "s" }}>
                  <span className="h-9 w-2 rounded-full" style={{ background: STATUS[orderStatus(o)].color }} />
                  <div className="min-w-0 flex-1"><div className="truncate text-sm font-black" style={{ color: INK }}>{o.client}</div><div className="text-xs font-bold" style={{ color: "#6B7A8D" }}>{o.number} · {orderProgress(o)}%</div></div>
                  <div className="shrink-0 text-right text-xs font-black" style={{ color: d < 0 ? K.red : d <= 2 ? K.gold : "#6B7A8D" }}>{d < 0 ? `Vencida` : d === 0 ? "Hoy" : `${d}d`}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Logros */}
      <div className="anim-up">
        <div className="mb-2 text-sm font-black opacity-90">Logros</div>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((b) => (
            <div key={b.name} className="k-card rounded-2xl surface p-2 text-center" style={{ opacity: b.on ? 1 : 0.45, filter: b.on ? "none" : "grayscale(1)" }}>
              <div className="text-2xl">{b.emoji}</div>
              <div className="mt-0.5 text-[9px] font-extrabold leading-tight" style={{ color: INK }}>{b.name}</div>
            </div>
          ))}
        </div>
      </div>

      <KBtn color={INK} className="w-full py-3 text-sm" onClick={() => onShare({ title: "Enviar resumen del día", subject: "Resumen del día — SafeTech", text: buildDailySummary(orders, sessions, game) })}>
        <span className="flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /> Compartir resumen del día</span>
      </KBtn>
    </div>
  );
}

/* ============================ Órdenes ============================ */
function OrdersView({ orders, onOpen, onAdd }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4 text-white">
      <div className="anim-up flex items-center justify-between">
        <h1 className="text-2xl font-black">Órdenes</h1>
        <KBtn color={K.yellow} textColor={K.purple} className="px-3 py-2 text-sm" onClick={() => setOpen(true)}><span className="flex items-center gap-1"><Plus className="h-4 w-4" /> Nueva</span></KBtn>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl p-8 text-center text-sm font-bold text-white/70" style={{ background: "rgba(255,255,255,.08)" }}>Crea tu primera orden para empezar.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o, i) => {
            const st = orderStatus(o), p = orderProgress(o), { done, est } = orderPoms(o), d = daysUntil(o.endDate);
            return (
              <button key={o.id} onClick={() => { sClick(); onOpen(o.id); }} className="anim-pop k-card flex w-full overflow-hidden rounded-2xl surface text-left" style={{ animationDelay: i * 0.05 + "s" }}>
                <span className="w-2 shrink-0" style={{ background: STATUS[st].color }} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5"><span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#7C8A9C" }}>{o.number}</span>{o.type && <TypeBadge type={o.type} />}</div>
                      <div className="truncate text-base font-black" style={{ color: INK }}>{o.client}</div>
                    </div>
                    <StatusChip status={o.status === "completed" ? "green" : st} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-semibold" style={{ color: "#6B7A8D" }}>{o.scope}</p>
                  <div className="mt-3"><ProgressBar value={p} color={STATUS[st].color} /></div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold" style={{ color: "#6B7A8D" }}>
                    <span>{done}/{est} pomodoros · {p}%</span>
                    <span style={{ color: d < 0 ? K.red : "#6B7A8D" }}>{o.status === "completed" ? "Finalizada" : d < 0 ? "Vencida" : `${d}d`}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {open && <OrderForm onClose={() => setOpen(false)} onSave={(o) => { onAdd(o); setOpen(false); }} />}
    </div>
  );
}

function OrderForm({ onClose, onSave }) {
  const [f, setF] = useState({ type: "OS", number: "", client: "", scope: "", resource: "", value: "", start: todayISO(), endDate: addDays(14) });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const valid = f.number && f.client;
  return (
    <Modal title="Nueva orden" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Tipo de orden">
          <div className="flex gap-1.5 rounded-xl p-1" style={{ background: "var(--soft)" }}>
            {[["OS", "Servicio"], ["OT", "Trabajo"]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setF({ ...f, type: k })} className="flex-1 rounded-lg py-2 text-xs font-extrabold transition"
                style={{ background: f.type === k ? "#fff" : "transparent", color: f.type === k ? INK : "#7C8A9C", boxShadow: f.type === k ? "0 2px 6px rgba(0,0,0,.08)" : "none" }}>{k} · {l}</button>
            ))}
          </div>
        </Field>
        <Field label="Nº de orden"><input className={inputCls} placeholder={f.type === "OT" ? "OT-2026-004" : "OS-2026-004"} value={f.number} onChange={set("number")} /></Field>
        <Field label="Empresa / cliente"><input className={inputCls} placeholder="Empresa S.A.S." value={f.client} onChange={set("client")} /></Field>
        <Field label="Alcance"><textarea className={inputCls} rows={2} placeholder="Auditoría de seguridad en maquinaria…" value={f.scope} onChange={set("scope")} /></Field>
        <Field label="Recurso a gestionar"><input className={inputCls} placeholder="Javier (100%) · equipos" value={f.resource} onChange={set("resource")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valor (COP)"><input className={inputCls} type="number" placeholder="5000000" value={f.value} onChange={set("value")} /></Field>
          <Field label="Fecha límite"><input className={inputCls} type="date" value={f.endDate} onChange={set("endDate")} /></Field>
        </div>
        <KBtn color={K.green} disabled={!valid} className="mt-1 w-full py-3 text-sm" onClick={() => onSave({ ...f, value: Number(f.value) || 0 })}>Crear orden</KBtn>
      </div>
    </Modal>
  );
}

function OrderDetail({ order, onBack, onAddActivity, onRemoveActivity, onAddDeliverable, onCycleDeliverable, onToggleComplete, onRemoveOrder, onStartPomodoro, onShare }) {
  const [actOpen, setActOpen] = useState(false);
  const [delFor, setDelFor] = useState(null);
  const [expanded, setExpanded] = useState({});
  const st = order.status === "completed" ? "green" : orderStatus(order);
  const p = orderProgress(order); const { done, est } = orderPoms(order);
  const dels = allDeliverables(order); const delDone = dels.filter((d) => d.status === "completed").length;
  const d = daysUntil(order.endDate);

  const orderExport = { ...order, metrics: { progress: p, pomodoros: { done, est }, deliverables: { done: delDone, total: dels.length }, daysRemaining: d }, exportedAt: new Date().toISOString() };
  const exportThis = () => downloadJSON(`${order.number}.json`, orderExport);
  const shareThis = () => onShare({ title: "Enviar estado de la orden", subject: `Estado ${order.number} — ${order.client}`, text: buildOrderSummary(order), attachName: `${order.number}.json`, attachObj: orderExport });

  return (
    <div className="space-y-4 text-white">
      <button onClick={() => { sClick(); onBack(); }} className="flex items-center gap-1 text-sm font-bold opacity-80"><ChevronLeft className="h-4 w-4" /> Órdenes</button>

      <div className="anim-up k-card overflow-hidden rounded-3xl surface" style={{ color: INK }}>
        <div className="h-2" style={{ background: STATUS[st].color }} />
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div><div className="flex items-center gap-1.5"><span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#7C8A9C" }}>{order.number}</span>{order.type && <TypeBadge type={order.type} />}</div>
              <h2 className="text-lg font-black leading-tight">{order.client}</h2></div>
            <StatusChip status={st} />
          </div>
          <p className="mt-2 text-sm font-semibold" style={{ color: "#5B6B7E" }}>{order.scope}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold" style={{ color: "#6B7A8D" }}>
            <div className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" /> {order.resource || "—"}</div>
            <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {fmtDate(order.endDate)}</div>
            <div className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> {fmtCOP(order.value)}</div>
            <div className="flex items-center gap-1.5" style={{ color: d < 0 ? K.red : "#6B7A8D" }}><Clock className="h-3.5 w-3.5" /> {order.status === "completed" ? "Finalizada" : d < 0 ? `Vencida ${-d}d` : `${d}d`}</div>
          </div>
          <div className="mt-4"><div className="mb-1 flex justify-between text-xs font-bold" style={{ color: "#6B7A8D" }}><span>Avance general</span><span className="tabular-nums">{p}%</span></div><ProgressBar value={p} color={STATUS[st].color} /></div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-xl py-2" style={{ background: "var(--soft)" }}><div className="text-base font-black tabular-nums">{done}/{est}</div><div className="font-bold" style={{ color: "#6B7A8D" }}>Pomodoros</div></div>
            <div className="rounded-xl py-2" style={{ background: "var(--soft)" }}><div className="text-base font-black tabular-nums">{delDone}/{dels.length}</div><div className="font-bold" style={{ color: "#6B7A8D" }}>Entregables</div></div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between"><h3 className="text-sm font-black">Actividades</h3>
        <button onClick={() => { sClick(); setActOpen(true); }} className="flex items-center gap-1 text-sm font-extrabold" style={{ color: K.yellow }}><Plus className="h-4 w-4" /> Actividad</button></div>

      <div className="space-y-3">
        {order.activities.length === 0 && <div className="rounded-2xl p-5 text-center text-sm font-bold text-white/70" style={{ background: "rgba(255,255,255,.08)" }}>Agrega actividades y estima pomodoros.</div>}
        {order.activities.map((a, i) => {
          const ap = a.estimatedPomodoros ? Math.min(100, Math.round((a.completedPomodoros / a.estimatedPomodoros) * 100)) : 0;
          const isExp = expanded[a.id]; const adels = a.deliverables || [];
          const doneAct = a.completedPomodoros >= a.estimatedPomodoros;
          return (
            <div key={a.id} className="anim-pop k-card rounded-2xl surface p-4" style={{ color: INK, animationDelay: i * 0.05 + "s" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><div className="flex items-center gap-1.5 font-black">{doneAct && <span>✅</span>}{a.name}</div>{a.desc && <div className="text-xs font-semibold" style={{ color: "#6B7A8D" }}>{a.desc}</div>}</div>
                <button onClick={() => onRemoveActivity(order.id, a.id)} style={{ color: "var(--track)" }}><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-3"><ProgressBar value={ap} color={doneAct ? K.green : K.purple} /></div>
              <div className="mt-2 flex items-center justify-between text-xs font-bold" style={{ color: "#6B7A8D" }}>
                <span className="tabular-nums">{a.completedPomodoros}/{a.estimatedPomodoros} pomodoros</span>
                <KBtn color={K.green} className="px-3 py-1 text-xs" onClick={() => onStartPomodoro(order, a)}><span className="flex items-center gap-1"><Play className="h-3 w-3" /> Iniciar</span></KBtn>
              </div>
              <button onClick={() => setExpanded({ ...expanded, [a.id]: !isExp })} className="mt-3 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold" style={{ background: "var(--soft)", color: "#5B6B7E" }}>
                <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> {adels.length} entregable{adels.length !== 1 ? "s" : ""}</span><span style={{ color: "#7C8A9C" }}>{isExp ? "Ocultar" : "Ver"}</span>
              </button>
              {isExp && (
                <div className="mt-2 space-y-1.5">
                  {adels.map((dv) => {
                    const map = { completed: { i: CheckCircle2, c: K.green }, in_progress: { i: CircleDot, c: K.gold }, pending: { i: Circle, c: "var(--track)" } };
                    const m = map[dv.status];
                    return (
                      <div key={dv.id} className="flex items-center gap-2 py-1">
                        <button onClick={() => { sClick(); onCycleDeliverable(order.id, a.id, dv.id); }}><m.i className="h-5 w-5" style={{ color: m.c }} /></button>
                        <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold" style={{ color: dv.status === "completed" ? "#9FB0C4" : INK, textDecoration: dv.status === "completed" ? "line-through" : "none" }}>{dv.name}</div>
                          <div className="text-[11px] font-semibold" style={{ color: "#8E9DB2" }}>{dv.type} · vence {fmtDate(dv.due)}</div></div>
                      </div>
                    );
                  })}
                  <button onClick={() => setDelFor(a.id)} className="flex items-center gap-1 pt-1 text-xs font-extrabold" style={{ color: K.purple }}><Plus className="h-3.5 w-3.5" /> Entregable</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-2 pt-1">
        <KBtn color={K.blue} className="w-full py-3 text-sm" onClick={shareThis}><span className="flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /> Compartir / enviar estado</span></KBtn>
        <KBtn color="#ffffff" textColor={INK} className="w-full py-3 text-sm" onClick={exportThis}><span className="flex items-center justify-center gap-2"><Download className="h-4 w-4" /> Exportar orden (JSON)</span></KBtn>
        <KBtn color={order.status === "completed" ? K.gold : K.green} className="w-full py-3 text-sm" onClick={() => onToggleComplete(order.id)}><span className="flex items-center justify-center gap-2"><CheckCircle2 className="h-4 w-4" /> {order.status === "completed" ? "Reabrir orden" : "Marcar como finalizada"}</span></KBtn>
        <button onClick={() => onRemoveOrder(order.id)} className="w-full py-2 text-xs font-extrabold" style={{ color: "#FFB3BE" }}>Eliminar orden</button>
      </div>

      {actOpen && <ActivityForm onClose={() => setActOpen(false)} onSave={(a) => { onAddActivity(order.id, a); setActOpen(false); }} />}
      {delFor && <DeliverableForm onClose={() => setDelFor(null)} onSave={(dv) => { onAddDeliverable(order.id, delFor, dv); setDelFor(null); }} />}
    </div>
  );
}

function ActivityForm({ onClose, onSave }) {
  const [f, setF] = useState({ name: "", desc: "", estimatedPomodoros: 4 });
  return (
    <Modal title="Nueva actividad" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre"><input className={inputCls} placeholder="Inspección física" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Descripción"><input className={inputCls} placeholder="Guardas, LOTO, puesta a cero" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} /></Field>
        <Field label="Pomodoros estimados"><input className={inputCls} type="number" min={1} value={f.estimatedPomodoros} onChange={(e) => setF({ ...f, estimatedPomodoros: Number(e.target.value) })} /></Field>
        <KBtn color={K.green} disabled={!f.name} className="mt-1 w-full py-3 text-sm" onClick={() => onSave(f)}>Agregar</KBtn>
      </div>
    </Modal>
  );
}
function DeliverableForm({ onClose, onSave }) {
  const [f, setF] = useState({ name: "", type: DTYPES[0], due: addDays(7) });
  return (
    <Modal title="Nuevo entregable" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Nombre"><input className={inputCls} placeholder="Acta de hallazgos" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Tipo"><select className={inputCls} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{DTYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Fecha de entrega"><input className={inputCls} type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} /></Field>
        <KBtn color={K.green} disabled={!f.name} className="mt-1 w-full py-3 text-sm" onClick={() => onSave(f)}>Agregar</KBtn>
      </div>
    </Modal>
  );
}

/* ============================ Pomodoro (estilo concurso) ============================ */
function Pomodoro({ mode, modeMeta, secs, running, cycle, settings, setSettings, game, ctxOrder, ctxAct, orders, onToggle, onReset, onSetMode, onPickCtx, onEnterFocus, todayCount }) {
  const [setOpen, setSetOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const mm = modeMeta[mode];
  const total = mm.dur * 60; const pct = total ? ((total - secs) / total) * 100 : 0;
  const urgent = running && mode === "work" && secs <= 5 && secs > 0;

  return (
    <div className="space-y-5 text-white">
      <div className="anim-up flex items-center justify-between">
        <h1 className="text-2xl font-black">Pomodoro</h1>
        <button onClick={() => { sClick(); setSetOpen(true); }} className="rounded-full p-2" style={{ background: "rgba(255,255,255,.12)" }}><Settings className="h-5 w-5" /></button>
      </div>

      {/* Estado de juego */}
      <div className="flex items-center justify-center gap-5">
        <span className="flex items-center gap-1 text-sm font-black"><Flame className={`h-4 w-4 ${game.streak > 0 ? "anim-flame" : ""}`} style={{ color: K.orange }} /> Racha {game.streak}</span>
        <span className="flex items-center gap-1 text-sm font-black"><Star className="h-4 w-4" style={{ color: K.yellow }} /> {game.points} pts</span>
      </div>

      {/* Modo */}
      <div className="flex gap-1.5 rounded-full p-1" style={{ background: "rgba(255,255,255,.15)" }}>
        {[["work", "Enfoque"], ["short", "Descanso"], ["long", "Largo"]].map(([k, l]) => (
          <button key={k} onClick={() => { sClick(); onSetMode(k); }} className="flex-1 rounded-full py-2 text-xs font-extrabold transition"
            style={{ background: mode === k ? "#fff" : "transparent", color: mode === k ? K.purple : "rgba(255,255,255,.8)" }}>{l}</button>
        ))}
      </div>

      {/* Anillo */}
      <div className="flex flex-col items-center">
        <Ring pct={pct} color={urgent ? K.red : "#FFFFFF"} size={290} stroke={18} track="rgba(255,255,255,.16)" urgent={urgent}>
          <span className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: urgent ? K.red : mm.tint }}>{mm.label}</span>
          <span className="font-black tabular-nums" style={{ fontSize: 60 }}>{mmss(secs)}</span>
          <span className="mt-1 text-xs font-bold opacity-70">Ciclo {cycle % settings.longEvery}/{settings.longEvery}</span>
        </Ring>
        <div className="mt-5 flex items-center gap-4">
          <KBtn color="rgba(255,255,255,.16)" className="p-4" onClick={onReset}><RotateCcw className="h-5 w-5" /></KBtn>
          <KBtn color={mm.color} className="p-6" sound={false} onClick={() => { if (!running && !ctxAct) { sClick(); setPendingStart(true); setPickOpen(true); } else { onToggle(); } }}>
            {running ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 translate-x-0.5" />}
          </KBtn>
          <KBtn color="rgba(255,255,255,.16)" className="p-4" onClick={onEnterFocus}><BellOff className="h-5 w-5" /></KBtn>
        </div>
      </div>

      {running && <KBtn color={INK} className="w-full py-2.5 text-sm" onClick={onEnterFocus}><span className="flex items-center justify-center gap-2"><BellOff className="h-4 w-4" /> Entrar en modo enfoque</span></KBtn>}

      {/* Enfocado en */}
      <button onClick={() => { sClick(); setPickOpen(true); }} className="k-card w-full rounded-2xl surface p-4 text-left" style={{ color: INK }}>
        <div className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: "#7C8A9C" }}>Enfocado en</div>
        {ctxOrder && ctxAct ? (
          <div className="mt-1"><div className="text-sm font-black">{ctxAct.name}</div><div className="mt-0.5 flex items-center gap-1.5 text-xs font-bold" style={{ color: "#6B7A8D" }}>{ctxOrder.type && <TypeBadge type={ctxOrder.type} />} {ctxOrder.number} · {ctxOrder.client}</div></div>
        ) : <div className="mt-1 text-sm font-semibold" style={{ color: "#7C8A9C" }}>Sin asignar — toca para elegir orden y actividad</div>}
      </button>

      <div className="flex items-start gap-2 rounded-2xl p-3 text-[11px] font-semibold leading-relaxed text-white/80" style={{ background: "rgba(255,255,255,.08)" }}>
        <BellOff className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Para silenciar el teléfono, activa <b>No molestar</b> (Android) o un <b>Modo de concentración</b> (iOS). Una app web no puede apagar las notificaciones del sistema.</span>
      </div>

      <div className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,.12)" }}>
        <div className="flex items-center justify-center gap-2 font-black"><Zap className="h-4 w-4" style={{ color: K.yellow }} /> {todayCount} pomodoros completados hoy</div>
      </div>

      {setOpen && <SettingsModal settings={settings} setSettings={setSettings} onClose={() => setSetOpen(false)} />}
      {pickOpen && <ContextPicker orders={orders} onClose={() => { setPickOpen(false); setPendingStart(false); }} onPick={(o, a) => { onPickCtx(o, a); setPickOpen(false); if (pendingStart) { setPendingStart(false); onToggle(); } }} />}
    </div>
  );
}

function ContextPicker({ orders, onClose, onPick }) {
  const active = orders.filter((o) => o.status !== "completed");
  return (
    <Modal title="Asignar a una orden" onClose={onClose}>
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {active.length === 0 && <p className="text-sm font-semibold" style={{ color: "#7C8A9C" }}>No hay órdenes activas.</p>}
        {active.map((o) => (
          <div key={o.id}>
            <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold" style={{ color: "#5B6B7E" }}>{o.type && <TypeBadge type={o.type} />} {o.number} · {o.client}</div>
            <div className="space-y-1">
              {o.activities.length === 0 && <div className="px-2 text-xs font-semibold" style={{ color: "#B6C6D8" }}>Sin actividades</div>}
              {o.activities.map((a) => (
                <button key={a.id} onClick={() => { sClick(); onPick(o, a); }} className="flex w-full items-center justify-between rounded-xl border-2 border-slate-200 px-3 py-2.5 text-left text-sm font-bold" style={{ color: INK }}>
                  <span>{a.name}</span><span className="text-xs font-extrabold tabular-nums" style={{ color: "#7C8A9C" }}>{a.completedPomodoros}/{a.estimatedPomodoros}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function SettingsModal({ settings, setSettings, onClose }) {
  const [f, setF] = useState(settings);
  const row = (k, label) => (<Field label={label}><input className={inputCls} type="number" min={1} value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></Field>);
  const toggle = (k, label) => (
    <label className="flex items-center justify-between rounded-xl px-3 py-2.5" style={{ background: "var(--soft)" }}>
      <span className="text-xs font-extrabold" style={{ color: "#5B6B7E" }}>{label}</span>
      <button type="button" onClick={() => setF({ ...f, [k]: !f[k] })} className="relative h-6 w-11 rounded-full transition" style={{ background: f[k] ? K.green : "var(--track)" }}>
        <span className={`block h-5 w-5 translate-y-0.5 rounded-full surface shadow transition-transform ${f[k] ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
  return (
    <Modal title="Ajustes" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">{row("work", "Enfoque (min)")}{row("short", "Descanso (min)")}{row("long", "Descanso largo")}{row("longEvery", "Largo cada N")}{row("dailyGoal", "Meta diaria")}</div>
      <div className="mt-3 space-y-2">{toggle("focusOnStart", "Modo enfoque al iniciar")}{toggle("sound", "Sonidos")}</div>
      <KBtn color={K.green} className="mt-4 w-full py-3 text-sm" onClick={() => { setSettings(f); onClose(); }}>Guardar</KBtn>
    </Modal>
  );
}

/* ============================ Métricas ============================ */
function Metrics({ orders, sessions, game, onShare }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(-(6 - i)));
  const data = days.map((d) => ({ day: new Date(d + "T00:00:00").toLocaleDateString("es-CO", { weekday: "short" }), pomodoros: sessions.filter((s) => s.date === d).length }));
  const maxIdx = data.reduce((mi, d, i, arr) => (d.pomodoros > arr[mi].pomodoros ? i : mi), 0);
  const weekTotal = data.reduce((s, d) => s + d.pomodoros, 0);
  const active = orders.filter((o) => o.status !== "completed").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const avgProgress = orders.length ? Math.round(orders.reduce((s, o) => s + orderProgress(o), 0) / orders.length) : 0;
  const totalValue = orders.reduce((s, o) => s + (o.value || 0), 0);
  const byOrder = orders.map((o) => ({ name: o.number, p: orderProgress(o), st: orderStatus(o) }));

  const exportObj = { exportedAt: new Date().toISOString(), summary: { weekPomodoros: weekTotal, activeOrders: active, completedOrders: completed, avgProgress, portfolioValue: totalValue, game }, weeklySeries: data, orders, sessions };
  const exportAll = () => downloadJSON(`safetech-export-${todayISO()}.json`, exportObj);
  const shareWeek = () => onShare({ title: "Enviar resumen semanal", subject: "Resumen semanal — SafeTech", text: buildWeeklySummary(orders, sessions, game), attachName: `safetech-export-${todayISO()}.json`, attachObj: exportObj });

  return (
    <div className="space-y-4 text-white">
      <h1 className="anim-up text-2xl font-black">Métricas</h1>

      {/* Tarjeta de logro */}
      <div className="anim-pop k-card rounded-3xl p-4" style={{ background: "linear-gradient(135deg,#2E6FB0,#3FA9A9)" }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><div className="flex items-center justify-center gap-1 text-2xl font-black"><Star className="h-5 w-5" style={{ color: K.yellow }} />{game.points}</div><div className="text-[11px] font-bold opacity-80">Puntos</div></div>
          <div><div className="text-2xl font-black">Nv {levelOf(game.points)}</div><div className="text-[11px] font-bold opacity-80">Nivel</div></div>
          <div><div className="flex items-center justify-center gap-1 text-2xl font-black"><Flame className="h-5 w-5" style={{ color: K.orange }} />{game.bestStreak}</div><div className="text-[11px] font-bold opacity-80">Mejor racha</div></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={Timer} label="Pomodoros (7d)" value={weekTotal} sub={`${(weekTotal * 25 / 60).toFixed(1)} h`} accent={K.green} />
        <Stat icon={ClipboardList} label="Órdenes activas" value={active} sub={`${completed} finalizadas`} accent={K.blue} />
        <Stat icon={Target} label="Avance medio" value={`${avgProgress}%`} accent={K.magenta} />
        <Stat icon={TrendingUp} label="Valor portafolio" value={fmtCOP(totalValue)} accent={K.gold} />
      </div>

      <div className="k-card rounded-2xl surface p-4" style={{ color: INK }}>
        <div className="mb-3 text-sm font-black">Productividad — últimos 7 días</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--soft)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#7C8A9C", fontWeight: 700 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#7C8A9C" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "var(--soft)" }} contentStyle={{ borderRadius: 14, border: "2px solid var(--soft)", fontSize: 12, fontWeight: 700 }} />
            <Bar dataKey="pomodoros" radius={[8, 8, 0, 0]}>{data.map((_, i) => <Cell key={i} fill={i === maxIdx ? K.magenta : "var(--track)"} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="k-card rounded-2xl surface p-4" style={{ color: INK }}>
        <div className="mb-3 text-sm font-black">Avance por orden</div>
        <div className="space-y-3">
          {byOrder.length === 0 && <p className="text-sm font-semibold" style={{ color: "#7C8A9C" }}>Sin órdenes.</p>}
          {byOrder.map((o) => (<div key={o.name}><div className="mb-1 flex justify-between text-xs font-bold" style={{ color: "#5B6B7E" }}><span>{o.name}</span><span className="tabular-nums">{o.p}%</span></div><ProgressBar value={o.p} color={STATUS[o.st].color} /></div>))}
        </div>
      </div>

      <KBtn color={K.blue} className="w-full py-3 text-sm" onClick={shareWeek}><span className="flex items-center justify-center gap-2"><Share2 className="h-4 w-4" /> Compartir resumen semanal</span></KBtn>
      <KBtn color={INK} className="w-full py-3 text-sm" onClick={exportAll}><span className="flex items-center justify-center gap-2"><Download className="h-4 w-4" /> Exportar todo (JSON)</span></KBtn>
      <p className="pb-2 text-center text-xs font-semibold text-white/60">Incluye órdenes, sesiones, puntos y racha — listo para Python / Pandas.</p>
    </div>
  );
}

/* ============================ Compartir ============================ */
function ShareSheet({ payload, onClose }) {
  const { title, text, subject, attachName, attachObj } = payload;
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch { try { const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.focus(); ta.select(); document.execCommand("copy"); document.body.removeChild(ta); setCopied(true); } catch (e) {} }
    setTimeout(() => setCopied(false), 2000);
  };
  const plain = text.replace(/\*/g, "");
  const channels = [
    { href: `https://wa.me/?text=${encodeURIComponent(text)}`, icon: MessageCircle, label: "WhatsApp", c: K.green },
    { href: `https://t.me/share/url?url=${encodeURIComponent(" ")}&text=${encodeURIComponent(text)}`, icon: Send, label: "Telegram", c: K.blue },
    { href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plain)}`, icon: Mail, label: "Correo", c: "#5B6B7E" },
  ];
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        <div className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-xl p-3 text-xs font-semibold leading-relaxed" style={{ background: "var(--soft)", color: "#2A3A52" }}>{text}</div>
        <KBtn color="var(--card)" textColor={INK} className="w-full border-2 border-slate-300 py-2.5 text-sm" sound={false} onClick={copy}>
          <span className="flex items-center justify-center gap-2">{copied ? <><Check className="h-4 w-4" style={{ color: K.green }} /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar resumen</>}</span>
        </KBtn>
        <div className="grid grid-cols-3 gap-2">
          {channels.map((ch) => (
            <a key={ch.label} href={ch.href} target="_blank" rel="noopener noreferrer" onClick={() => sClick()} className="k-btn flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-extrabold text-white" style={{ background: ch.c }}>
              <ch.icon className="h-5 w-5" /> {ch.label}
            </a>
          ))}
        </div>
        <p className="text-center text-[11px] font-semibold" style={{ color: "#7C8A9C" }}>Si el botón no abre la app, usa “Copiar” y pega el mensaje.</p>
        {attachObj && (
          <div className="rounded-xl p-3" style={{ background: "var(--soft)" }}>
            <KBtn color="#ffffff" textColor={K.blue} className="w-full border-2 py-2 text-xs" sound={false} onClick={() => downloadJSON(attachName, attachObj)}>
              <span className="flex items-center justify-center gap-2"><Download className="h-4 w-4" /> Descargar datos para adjuntar (JSON)</span>
            </KBtn>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed" style={{ color: "#5B6B86" }}>El correo se abre con el resumen. Para enviar el informe o el repositorio de datos, descárgalos y adjúntalos antes de enviar.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
