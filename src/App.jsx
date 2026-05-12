import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const BASE_CATEGORIES = [
  { name: "Petrol/Fuel",       icon: "⛽", color: "#f59e0b" },
  { name: "Shopping",          icon: "🛍️", color: "#8b5cf6" },
  { name: "Home Grocery",      icon: "🥦", color: "#10b981" },
  { name: "Crockery/Home Items",icon:"🏠", color: "#06b6d4" },
  { name: "Online Purchases",  icon: "📦", color: "#3b82f6" },
  { name: "Hometown Expenses", icon: "🏘️", color: "#f97316" },
  { name: "Food",              icon: "🍱", color: "#ec4899" },
  { name: "Bills",             icon: "📋", color: "#ef4444" },
  { name: "Travel",            icon: "✈️", color: "#84cc16" },
  { name: "Medical",           icon: "💊", color: "#14b8a6" },
  { name: "School_Fees",     icon: "🎬", color: "#a855f7" },
  { name: "Other",             icon: "📌", color: "#6b7280" },
];

const PAYMENT_METHODS = ["Cash","UPI","Credit Card","Debit Card","Bank Transfer","Other"];
const PAY_COLORS = ["#10b981","#6366f1","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt   = (n) => `₹${Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:0})}`;
const uid   = () => Date.now().toString(36) + Math.random().toString(36).substr(2,5);
const today = () => new Date().toISOString().split("T")[0];
const thisMonth = () => today().substring(0,7);
const thisYear  = () => today().substring(0,4);
const sum   = (arr) => arr.reduce((s,e) => s + Number(e.amount||0), 0);

const getMonthName = (yyyymm) => {
  const [y,m] = yyyymm.split("-");
  return new Date(y, m-1).toLocaleDateString("en-IN",{month:"short",year:"2-digit"});
};

const getLast6Months = () => {
  return Array.from({length:6},(_,i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5-i));
    return d.toISOString().substring(0,7);
  });
};

// ─── THEMES ───────────────────────────────────────────────────────────────────

const DARK = {
  bg:"#0d1117", surface:"#161b22", card:"#1c2333", border:"#2d3748",
  text:"#e6edf3", muted:"#8b949e", accent:"#10b981", accentBg:"rgba(16,185,129,0.12)",
  danger:"#f87171", dangerBg:"rgba(248,113,113,0.1)", warning:"#fbbf24",
  input:"#0d1117", hover:"rgba(255,255,255,0.05)", sidebar:"#0d1117",
  blue:"#60a5fa", purple:"#a78bfa", second:"#111827",
};
const LIGHT = {
  bg:"#f0f4f8", surface:"#ffffff", card:"#ffffff", border:"#e2e8f0",
  text:"#0f172a", muted:"#64748b", accent:"#059669", accentBg:"rgba(5,150,105,0.1)",
  danger:"#dc2626", dangerBg:"rgba(220,38,38,0.08)", warning:"#d97706",
  input:"#f8fafc", hover:"#f1f5f9", sidebar:"#0f172a",
  blue:"#2563eb", purple:"#7c3aed", second:"#f8fafc",
};

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────

function Card({ t, children, style={}, onClick, hover=false }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>hover&&setHov(true)}
      onMouseLeave={()=>setHov(false)}
      style={{
        background: t.card, border:`1px solid ${hov ? t.accent : t.border}`,
        borderRadius:12, padding:20, transition:"all 0.2s",
        cursor: onClick?"pointer":"default",
        boxShadow: hov ? `0 0 0 1px ${t.accent}22` : "none",
        ...style,
      }}
    >{children}</div>
  );
}

function Badge({ color="#6b7280", children }) {
  return (
    <span style={{
      background:`${color}20`, color,
      padding:"2px 8px", borderRadius:4,
      fontSize:11, fontWeight:600, whiteSpace:"nowrap",
      display:"inline-flex", alignItems:"center", gap:3,
    }}>{children}</span>
  );
}

function StatCard({ t, label, value, sub, color, icon }) {
  return (
    <Card t={t}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",marginBottom:10}}>{label}</div>
          <div style={{fontSize:26,fontWeight:700,color:color||t.text,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"-1px"}}>{value}</div>
          {sub&&<div style={{fontSize:12,color:t.muted,marginTop:5}}>{sub}</div>}
        </div>
        <div style={{fontSize:22,opacity:0.8}}>{icon}</div>
      </div>
    </Card>
  );
}

function Toggle({ value, onChange, t }) {
  return (
    <button onClick={()=>onChange(!value)} style={{
      width:48,height:26,borderRadius:13,border:"none",cursor:"pointer",
      background: value ? t.accent : t.border, position:"relative",transition:"background 0.3s",padding:0,
    }}>
      <div style={{
        width:20,height:20,borderRadius:"50%",background:"#fff",
        position:"absolute",top:3,left: value ? 25 : 3,transition:"left 0.25s",
      }}/>
    </button>
  );
}

function CTooltip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 14px",fontSize:12}}>
      {label && <p style={{color:t.muted,marginBottom:4}}>{label}</p>}
      {payload.map((p,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"space-between",gap:16,color:p.color||t.text}}>
          <span>{p.name||""}</span>
          <strong style={{fontFamily:"monospace"}}>{fmt(p.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function SectionHeader({ t, title, sub, action }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
      <div>
        <h1 style={{fontSize:22,fontWeight:700,color:t.text,fontFamily:"'Syne',sans-serif",letterSpacing:"-0.5px"}}>{title}</h1>
        {sub && <p style={{color:t.muted,fontSize:13,marginTop:3}}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryBtn({ t, onClick, children, style={} }) {
  return (
    <button onClick={onClick} style={{
      background:t.accent,color:"#fff",border:"none",
      padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:600,
      cursor:"pointer",display:"flex",alignItems:"center",gap:6,...style,
    }}>{children}</button>
  );
}

function GhostBtn({ t, onClick, children, style={}, danger=false }) {
  return (
    <button onClick={onClick} style={{
      background:"transparent",color:danger?t.danger:t.muted,
      border:`1px solid ${danger?t.danger:t.border}`,
      padding:"8px 16px",borderRadius:8,fontSize:13,fontWeight:500,
      cursor:"pointer",...style,
    }}>{children}</button>
  );
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function Sidebar({ t, page, setPage, darkMode, setDarkMode, open, setOpen }) {
  const nav = [
    {id:"dashboard", label:"Dashboard",    emoji:"◫"},
    {id:"add",       label:"Add Expense",  emoji:"+"},
    {id:"expenses",  label:"My Expenses",  emoji:"☰"},
    {id:"analytics", label:"Analytics",    emoji:"◑"},
    {id:"reports",   label:"Reports",      emoji:"▦"},
    {id:"settings",  label:"Settings",     emoji:"⚙"},
  ];
  return (
    <div style={{
      width: open ? 220 : 64, minHeight:"100vh",
      background:t.sidebar, borderRight:`1px solid #1a2235`,
      display:"flex", flexDirection:"column",
      position:"fixed", top:0, left:0, bottom:0,
      zIndex:200, overflow:"hidden", transition:"width 0.25s ease",
    }}>
      {/* Logo */}
      <div style={{padding:"18px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:34,height:34,borderRadius:10,flexShrink:0,
            background:"linear-gradient(135deg,#10b981,#059669)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,fontWeight:800,color:"#fff",
          }}>₹</div>
          {open && (
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#f0f6fc",fontFamily:"'Syne',sans-serif",lineHeight:1}}>ExpenseIQ</div>
              <div style={{fontSize:10,color:"#4b5563",marginTop:2}}>Personal Finance</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:"14px 8px",overflowY:"auto"}}>
        {nav.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={()=>setPage(item.id)} style={{
              display:"flex",alignItems:"center",gap:10,
              width:"100%",padding:"10px 10px",
              background: active ? "rgba(16,185,129,0.12)" : "transparent",
              border:"none",borderRadius:8,marginBottom:2,
              color: active ? "#10b981" : "#6b7280",
              fontSize:13,fontWeight: active ? 600 : 400,
              cursor:"pointer",textAlign:"left",
              borderLeft:`2px solid ${active?"#10b981":"transparent"}`,
              transition:"all 0.15s",
            }}>
              <span style={{fontSize:16,width:22,textAlign:"center",flexShrink:0}}>{item.emoji}</span>
              {open && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{padding:"10px 8px",borderTop:"1px solid rgba(255,255,255,0.05)",flexShrink:0}}>
        <button onClick={()=>setDarkMode(!darkMode)} style={{
          display:"flex",alignItems:"center",gap:10,
          width:"100%",padding:"8px 10px",background:"transparent",
          border:"none",borderRadius:8,color:"#6b7280",fontSize:12,cursor:"pointer",
        }}>
          <span style={{fontSize:14,width:22,textAlign:"center"}}>{darkMode?"☀️":"🌙"}</span>
          {open && <span>{darkMode?"Light Mode":"Dark Mode"}</span>}
        </button>
        <button onClick={()=>setOpen(!open)} style={{
          display:"flex",alignItems:"center",gap:10,
          width:"100%",padding:"8px 10px",background:"transparent",
          border:"none",borderRadius:8,color:"#6b7280",fontSize:12,cursor:"pointer",
        }}>
          <span style={{fontSize:12,width:22,textAlign:"center"}}>{open?"◄":"►"}</span>
          {open && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ t, expenses, categories, setPage, openEdit, deleteExpense }) {
  const td = today(), tm = thisMonth(), ty = thisYear();

  const todayExp  = useMemo(()=>expenses.filter(e=>e.date===td),[expenses,td]);
  const monthExp  = useMemo(()=>expenses.filter(e=>e.date?.startsWith(tm)),[expenses,tm]);
  const yearExp   = useMemo(()=>expenses.filter(e=>e.date?.startsWith(ty)),[expenses,ty]);

  const todayTotal = sum(todayExp);
  const monthTotal = sum(monthExp);
  const yearTotal  = sum(yearExp);
  const dayOfMonth = new Date().getDate();
  const avgDaily   = dayOfMonth > 0 ? monthTotal / dayOfMonth : 0;

  const monthly6 = useMemo(()=> getLast6Months().map(m=>({
    name: getMonthName(m),
    total: sum(expenses.filter(e=>e.date?.startsWith(m))),
  })),[expenses]);

  const catPie = useMemo(()=>{
    const map = {};
    monthExp.forEach(e=>{ map[e.category]=(map[e.category]||0)+Number(e.amount||0); });
    return Object.entries(map)
      .filter(([,v])=>v>0)
      .sort((a,b)=>b[1]-a[1])
      .map(([name,value])=>({
        name, value,
        color: categories.find(c=>c.name===name)?.color||"#6b7280",
        icon:  categories.find(c=>c.name===name)?.icon||"📌",
      }));
  },[monthExp,categories]);

  const recent = expenses.slice(0,10);

  return (
    <div>
      <SectionHeader t={t} title="Dashboard"
        sub={new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
        action={<PrimaryBtn t={t} onClick={()=>setPage("add")}>+ Add Expense</PrimaryBtn>}
      />

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:18}}>
        <StatCard t={t} label="Today"      value={fmt(todayTotal)}  sub={`${todayExp.length} transaction${todayExp.length!==1?"s":""}`} color={t.accent} icon="📅"/>
        <StatCard t={t} label="This Month" value={fmt(monthTotal)}  sub={`${monthExp.length} transactions`} icon="📆"/>
        <StatCard t={t} label="This Year"  value={fmt(yearTotal)}   sub={`${yearExp.length} transactions`}  icon="📊"/>
        <StatCard t={t} label="Daily Avg"  value={fmt(avgDaily)}    sub="This month"                        icon="📈"/>
      </div>

      {/* Charts */}
      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:14,marginBottom:18}}>
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>Monthly Spending (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={monthly6} margin={{top:0,right:0,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="name" tick={{fill:t.muted,fontSize:11}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}
                tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
              <Tooltip content={(p)=><CTooltip {...p} t={t}/>}/>
              <Bar dataKey="total" name="Total" fill={t.accent} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:10}}>This Month by Category</h3>
          {catPie.length===0 ? (
            <div style={{height:195,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:t.muted,gap:8}}>
              <span style={{fontSize:32}}>📂</span>
              <span style={{fontSize:13}}>No expenses this month</span>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{flexShrink:0}}>
                <ResponsiveContainer width={130} height={175}>
                  <PieChart>
                    <Pie data={catPie} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                      dataKey="value" paddingAngle={2}>
                      {catPie.map((e,i)=><Cell key={i} fill={e.color}/>)}
                    </Pie>
                    <Tooltip formatter={v=>fmt(v)} contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{flex:1,overflow:"hidden"}}>
                {catPie.slice(0,6).map((c,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,overflow:"hidden"}}>
                      <div style={{width:8,height:8,borderRadius:2,background:c.color,flexShrink:0}}/>
                      <span style={{fontSize:11,color:t.muted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</span>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:t.text,fontFamily:"monospace",flexShrink:0,marginLeft:4}}>{fmt(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card t={t}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text}}>Recent Expenses</h3>
          <button onClick={()=>setPage("expenses")} style={{background:"none",border:"none",color:t.accent,fontSize:12,fontWeight:600,cursor:"pointer"}}>View All →</button>
        </div>
        {recent.length===0 ? (
          <div style={{textAlign:"center",padding:"36px 0",color:t.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>📝</div>
            <div style={{fontSize:14}}>No expenses yet.</div>
            <div style={{fontSize:12,marginTop:4}}>Click "Add Expense" to get started, or load sample data in Settings.</div>
          </div>
        ) : (
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${t.border}`}}>
                {["Date","Category","Notes","Payment","Amount",""].map((h,i)=>(
                  <th key={i} style={{padding:"8px 10px",textAlign:i>=4?"right":"left",fontSize:10,color:t.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.6px"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map(e=>{
                const cat = categories.find(c=>c.name===e.category);
                return (
                  <tr key={e.id} style={{borderBottom:`1px solid ${t.border}`}}>
                    <td style={{padding:"10px",fontSize:12,color:t.muted,whiteSpace:"nowrap"}}>{e.date}</td>
                    <td style={{padding:"10px"}}><Badge color={cat?.color}>{cat?.icon} {e.category}</Badge></td>
                    <td style={{padding:"10px",fontSize:12,color:t.text,maxWidth:180}}>
                      <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.notes||e.subcategory||"—"}</div>
                    </td>
                    <td style={{padding:"10px",fontSize:11,color:t.muted}}>{e.paymentMethod}</td>
                    <td style={{padding:"10px",textAlign:"right",fontSize:14,fontWeight:700,color:t.text,fontFamily:"monospace",whiteSpace:"nowrap"}}>{fmt(e.amount)}</td>
                    <td style={{padding:"10px",textAlign:"right",whiteSpace:"nowrap"}}>
                      <button onClick={()=>openEdit(e)} style={{background:"none",border:"none",color:t.blue,fontSize:11,cursor:"pointer",fontWeight:600,marginRight:6}}>Edit</button>
                      <button onClick={()=>deleteExpense(e.id)} style={{background:"none",border:"none",color:t.danger,fontSize:11,cursor:"pointer",fontWeight:600}}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── EXPENSE FORM ─────────────────────────────────────────────────────────────

function ExpenseForm({ t, categories, expense, onSave, onCancel }) {
  const [form, setForm] = useState({
    date: today(), amount:"", category: categories[0]?.name||"",
    subcategory:"", paymentMethod:"UPI", notes:"",
    ...(expense||{}),
    amount: expense ? String(expense.amount) : "",
  });
  const [err, setErr] = useState("");

  const set = field => e => setForm(p=>({...p,[field]:e.target.value}));

  const submit = () => {
    if (!form.date||!form.amount||!form.category){setErr("Date, amount and category are required.");return;}
    if (isNaN(Number(form.amount))||Number(form.amount)<=0){setErr("Enter a valid amount greater than 0.");return;}
    onSave({...form,amount:Number(form.amount)});
  };

  const fieldStyle = {
    width:"100%", padding:"10px 12px", borderRadius:8,
    border:`1px solid ${t.border}`, background:t.input,
    color:t.text, fontSize:14, outline:"none",
    fontFamily:"'DM Sans',sans-serif", marginTop:4,
  };
  const labelStyle = {fontSize:11,color:t.muted,fontWeight:700,letterSpacing:"0.4px"};

  return (
    <div>
      <SectionHeader t={t}
        title={expense ? "Edit Expense" : "Add New Expense"}
        sub="Record your expense details below"
        action={<GhostBtn t={t} onClick={onCancel}>← Back</GhostBtn>}
      />

      <Card t={t} style={{maxWidth:620}}>
        {err && (
          <div style={{background:t.dangerBg,border:`1px solid ${t.danger}`,color:t.danger,padding:"10px 14px",borderRadius:8,marginBottom:16,fontSize:13}}>
            ⚠ {err}
          </div>
        )}

        {/* Row 1: Date + Amount */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <div style={{marginBottom:16}}>
            <label style={labelStyle}>DATE *</label>
            <input type="date" value={form.date} onChange={set("date")} style={fieldStyle}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={labelStyle}>AMOUNT (₹) *</label>
            <input type="number" value={form.amount} onChange={set("amount")} placeholder="0"
              min="0" step="1" style={fieldStyle}/>
          </div>
        </div>

        {/* Category Grid */}
        <div style={{marginBottom:16}}>
          <label style={labelStyle}>CATEGORY *</label>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:8}}>
            {categories.map(cat=>(
              <button key={cat.name} onClick={()=>setForm(p=>({...p,category:cat.name}))} style={{
                padding:"6px 11px",borderRadius:20,fontSize:12,fontWeight:500,
                border:`1.5px solid ${form.category===cat.name ? cat.color : t.border}`,
                background: form.category===cat.name ? `${cat.color}18` : "transparent",
                color: form.category===cat.name ? cat.color : t.muted,
                cursor:"pointer",display:"flex",alignItems:"center",gap:4,transition:"all 0.15s",
              }}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Subcategory + Payment */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
          <div style={{marginBottom:16}}>
            <label style={labelStyle}>SUBCATEGORY (OPTIONAL)</label>
            <input type="text" value={form.subcategory} onChange={set("subcategory")}
              placeholder="e.g. HP Petrol Pump" style={fieldStyle}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={labelStyle}>PAYMENT METHOD</label>
            <select value={form.paymentMethod} onChange={set("paymentMethod")} style={{...fieldStyle,cursor:"pointer"}}>
              {PAYMENT_METHODS.map(m=><option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div style={{marginBottom:20}}>
          <label style={labelStyle}>NOTES / DESCRIPTION</label>
          <textarea value={form.notes} onChange={set("notes")}
            placeholder="Add details about this expense..."
            style={{...fieldStyle,resize:"vertical",minHeight:72}}/>
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={submit} style={{
            flex:1,padding:"12px",background:t.accent,color:"#fff",
            border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",
          }}>
            {expense ? "✓ Update Expense" : "+ Add Expense"}
          </button>
          <GhostBtn t={t} onClick={onCancel} style={{padding:"12px 20px"}}>Cancel</GhostBtn>
        </div>
      </Card>
    </div>
  );
}

// ─── EXPENSE LIST ────────────────────────────────────────────────────────────

function ExpenseList({ t, expenses, categories, openEdit, deleteExpense }) {
  const [search,    setSearch]    = useState("");
  const [catF,      setCatF]      = useState("All");
  const [payF,      setPayF]      = useState("All");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [sortBy,    setSortBy]    = useState("date");
  const [sortDir,   setSortDir]   = useState("desc");
  const [pg,        setPg]        = useState(1);
  const PER = 15;

  const filtered = useMemo(()=>{
    let r = [...expenses];
    const q = search.toLowerCase();
    if (q) r = r.filter(e=>
      (e.notes||"").toLowerCase().includes(q) ||
      (e.subcategory||"").toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q) ||
      String(e.amount).includes(q)
    );
    if (catF!=="All") r = r.filter(e=>e.category===catF);
    if (payF!=="All") r = r.filter(e=>e.paymentMethod===payF);
    if (dateFrom) r = r.filter(e=>e.date>=dateFrom);
    if (dateTo)   r = r.filter(e=>e.date<=dateTo);
    r.sort((a,b)=>{
      const dir = sortDir==="asc"?1:-1;
      if (sortBy==="date")   return a.date>b.date ? dir : -dir;
      if (sortBy==="amount") return (Number(a.amount)-Number(b.amount))*dir;
      return 0;
    });
    return r;
  },[expenses,search,catF,payF,dateFrom,dateTo,sortBy,sortDir]);

  const totalPgs = Math.max(1,Math.ceil(filtered.length/PER));
  const paged = filtered.slice((pg-1)*PER, pg*PER);
  const totalFiltered = sum(filtered);

  const toggleSort = (f)=>{
    if(sortBy===f) setSortDir(d=>d==="asc"?"desc":"asc");
    else {setSortBy(f); setSortDir("desc");}
  };

  const fs = {
    width:"100%",padding:"8px 11px",borderRadius:8,
    border:`1px solid ${t.border}`,background:t.input,
    color:t.text,fontSize:12,outline:"none",marginTop:4,
    fontFamily:"'DM Sans',sans-serif",
  };

  return (
    <div>
      <SectionHeader t={t} title="My Expenses"
        sub={`${filtered.length} of ${expenses.length} entries · Total: ${fmt(totalFiltered)}`}
      />

      {/* Filters */}
      <Card t={t} style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr",gap:10}}>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>SEARCH</label>
            <input value={search} onChange={e=>{setSearch(e.target.value);setPg(1);}}
              placeholder="Search notes, category, amount…" style={fs}/>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>CATEGORY</label>
            <select value={catF} onChange={e=>{setCatF(e.target.value);setPg(1);}} style={{...fs,cursor:"pointer"}}>
              <option value="All">All Categories</option>
              {categories.map(c=><option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>PAYMENT</label>
            <select value={payF} onChange={e=>{setPayF(e.target.value);setPg(1);}} style={{...fs,cursor:"pointer"}}>
              <option value="All">All Methods</option>
              {PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>FROM</label>
            <input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPg(1);}} style={fs}/>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>TO</label>
            <input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPg(1);}} style={fs}/>
          </div>
        </div>
        <div style={{marginTop:10,display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>{setSearch("");setCatF("All");setPayF("All");setDateFrom("");setDateTo("");setPg(1);}}
            style={{fontSize:11,color:t.muted,background:"none",border:"none",cursor:"pointer"}}>
            ✕ Clear Filters
          </button>
        </div>
      </Card>

      {/* Table */}
      <Card t={t}>
        {paged.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 0",color:t.muted}}>
            <div style={{fontSize:36,marginBottom:8}}>🔍</div>
            <div>No expenses match your filters.</div>
          </div>
        ) : (
          <>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${t.border}`}}>
                  {[
                    {key:"date",label:"Date"},
                    {key:null,  label:"Category"},
                    {key:null,  label:"Notes"},
                    {key:null,  label:"Payment"},
                    {key:"amount",label:"Amount"},
                    {key:null,  label:"Actions"},
                  ].map(({key,label},i)=>(
                    <th key={i} onClick={()=>key&&toggleSort(key)} style={{
                      padding:"9px 10px",
                      textAlign: i>=4 ? "right" : "left",
                      fontSize:10,color:t.muted,fontWeight:700,
                      textTransform:"uppercase",letterSpacing:"0.6px",
                      cursor:key?"pointer":"default",whiteSpace:"nowrap",
                    }}>
                      {label}{key&&sortBy===key?(sortDir==="asc"?" ↑":" ↓"):""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map(e=>{
                  const cat = categories.find(c=>c.name===e.category);
                  return (
                    <tr key={e.id} style={{borderBottom:`1px solid ${t.border}`,transition:"background 0.1s"}}
                      onMouseEnter={ev=>ev.currentTarget.style.background=t.hover}
                      onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
                      <td style={{padding:"10px",fontSize:12,color:t.muted,whiteSpace:"nowrap"}}>{e.date}</td>
                      <td style={{padding:"10px"}}><Badge color={cat?.color}>{cat?.icon} {e.category}</Badge></td>
                      <td style={{padding:"10px",maxWidth:200}}>
                        <div style={{fontSize:13,color:t.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                          {e.notes||e.subcategory||"—"}
                        </div>
                        {e.subcategory&&e.notes && <div style={{fontSize:10,color:t.muted}}>{e.subcategory}</div>}
                      </td>
                      <td style={{padding:"10px",fontSize:11,color:t.muted,whiteSpace:"nowrap"}}>{e.paymentMethod}</td>
                      <td style={{padding:"10px",textAlign:"right",fontSize:14,fontWeight:700,color:t.text,fontFamily:"monospace",whiteSpace:"nowrap"}}>{fmt(e.amount)}</td>
                      <td style={{padding:"10px",textAlign:"right",whiteSpace:"nowrap"}}>
                        <button onClick={()=>openEdit(e)} style={{background:"none",border:"none",color:t.blue,fontSize:11,cursor:"pointer",fontWeight:600,marginRight:8}}>Edit</button>
                        <button onClick={()=>deleteExpense(e.id)} style={{background:"none",border:"none",color:t.danger,fontSize:11,cursor:"pointer",fontWeight:600}}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPgs>1 && (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:12,borderTop:`1px solid ${t.border}`}}>
                <span style={{fontSize:12,color:t.muted}}>Page {pg} of {totalPgs} · {filtered.length} results</span>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg===1}
                    style={{padding:"4px 14px",borderRadius:6,border:`1px solid ${t.border}`,background:"none",color:t.text,cursor:pg===1?"not-allowed":"pointer",opacity:pg===1?0.4:1,fontSize:13}}>←</button>
                  <button onClick={()=>setPg(p=>Math.min(totalPgs,p+1))} disabled={pg===totalPgs}
                    style={{padding:"4px 14px",borderRadius:6,border:`1px solid ${t.border}`,background:"none",color:t.text,cursor:pg===totalPgs?"not-allowed":"pointer",opacity:pg===totalPgs?0.4:1,fontSize:13}}>→</button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

function Analytics({ t, expenses, categories }) {
  const [period, setPeriod] = useState("month");

  const sel = useMemo(()=>{
    if (period==="month") return expenses.filter(e=>e.date?.startsWith(thisMonth()));
    if (period==="year")  return expenses.filter(e=>e.date?.startsWith(thisYear()));
    return expenses;
  },[expenses,period]);

  const catBreak = useMemo(()=>{
    const total = sum(sel);
    const map = {};
    sel.forEach(e=>{ map[e.category]=(map[e.category]||0)+Number(e.amount||0); });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({
      name, value, pct: total>0?((value/total)*100).toFixed(1):0,
      color: categories.find(c=>c.name===name)?.color||"#6b7280",
      icon:  categories.find(c=>c.name===name)?.icon||"📌",
    }));
  },[sel,categories]);

  const payBreak = useMemo(()=>{
    const total = sum(sel); const map = {};
    sel.forEach(e=>{ map[e.paymentMethod]=(map[e.paymentMethod]||0)+Number(e.amount||0); });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({
      name, value, pct: total>0?((value/total)*100).toFixed(1):0,
    }));
  },[sel]);

  // Daily trend for current selection (last 30 days if month)
  const dailyTrend = useMemo(()=>{
    const days = [];
    const n = period==="month" ? 30 : period==="year" ? 12 : 30;
    if (period==="year") {
      return getLast6Months().map(m=>({
        name: getMonthName(m),
        amount: sum(expenses.filter(e=>e.date?.startsWith(m))),
      }));
    }
    for (let i=n-1;i>=0;i--) {
      const d = new Date(); d.setDate(d.getDate()-i);
      const ds = d.toISOString().split("T")[0];
      days.push({
        name: d.toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
        amount: sum(expenses.filter(e=>e.date===ds)),
      });
    }
    return days;
  },[expenses,period]);

  // Top categories for stacked area
  const topCats = useMemo(()=>{
    const map = {};
    expenses.forEach(e=>{ map[e.category]=(map[e.category]||0)+Number(e.amount||0); });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([name])=>({
      name, color: categories.find(c=>c.name===name)?.color||"#6b7280",
    }));
  },[expenses,categories]);

  const areaData = useMemo(()=> getLast6Months().map(m=>{
    const row = {name:getMonthName(m)};
    topCats.forEach(c=>{ row[c.name]=sum(expenses.filter(e=>e.date?.startsWith(m)&&e.category===c.name)); });
    return row;
  }),[expenses,topCats]);

  const periods = [{id:"month",label:"This Month"},{id:"year",label:"This Year"},{id:"all",label:"All Time"}];

  return (
    <div>
      <SectionHeader t={t} title="Analytics" sub="Understand where your money goes"
        action={
          <div style={{display:"flex",gap:4,background:t.card,border:`1px solid ${t.border}`,borderRadius:10,padding:3}}>
            {periods.map(p=>(
              <button key={p.id} onClick={()=>setPeriod(p.id)} style={{
                padding:"5px 13px",borderRadius:7,fontSize:12,fontWeight:500,
                background:period===p.id?t.accent:"transparent",
                color:period===p.id?"#fff":t.muted,border:"none",cursor:"pointer",
              }}>{p.label}</button>
            ))}
          </div>
        }
      />

      {/* Stacked Area Chart */}
      <Card t={t} style={{marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>6-Month Category Trend</h3>
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart data={areaData} margin={{top:0,right:10,bottom:0,left:-10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
            <XAxis dataKey="name" tick={{fill:t.muted,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}
              tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
            <Tooltip content={(p)=><CTooltip {...p} t={t}/>}/>
            <Legend wrapperStyle={{fontSize:11,color:t.muted}}/>
            {topCats.map(c=>(
              <Area key={c.name} type="monotone" dataKey={c.name} stackId="1"
                stroke={c.color} fill={c.color} fillOpacity={0.55}/>
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Daily/Monthly line */}
      <Card t={t} style={{marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>
          {period==="year" ? "Monthly" : "Daily"} Spending Trend
        </h3>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={dailyTrend} margin={{top:0,right:10,bottom:0,left:-10}}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
            <XAxis dataKey="name" tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}
              interval={period==="month"?4:0}/>
            <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}
              tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
            <Tooltip content={(p)=><CTooltip {...p} t={t}/>}/>
            <Line type="monotone" dataKey="amount" name="Spent" stroke={t.accent}
              strokeWidth={2} dot={false} activeDot={{r:4,fill:t.accent}}/>
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {/* Category Breakdown bars */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>Category Breakdown</h3>
          {catBreak.length===0 ? (
            <div style={{color:t.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>No data for period</div>
          ) : catBreak.map((c,i)=>(
            <div key={i} style={{marginBottom:13}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:14}}>{c.icon}</span>
                  <span style={{fontSize:12,color:t.text,fontWeight:500}}>{c.name}</span>
                </div>
                <div>
                  <span style={{fontSize:13,fontWeight:700,color:t.text,fontFamily:"monospace"}}>{fmt(c.value)}</span>
                  <span style={{fontSize:10,color:t.muted,marginLeft:5}}>{c.pct}%</span>
                </div>
              </div>
              <div style={{height:4,background:t.border,borderRadius:2}}>
                <div style={{height:4,width:`${c.pct}%`,background:c.color,borderRadius:2,transition:"width 0.6s ease"}}/>
              </div>
            </div>
          ))}
        </Card>

        {/* Payment Method Pie */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:10}}>Payment Methods</h3>
          {payBreak.length===0 ? (
            <div style={{color:t.muted,fontSize:13,textAlign:"center",padding:"24px 0"}}>No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={payBreak} cx="50%" cy="50%" innerRadius={44} outerRadius={68}
                    dataKey="value" paddingAngle={2}>
                    {payBreak.map((_,i)=><Cell key={i} fill={PAY_COLORS[i%PAY_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>fmt(v)} contentStyle={{background:t.card,border:`1px solid ${t.border}`,borderRadius:8}}/>
                </PieChart>
              </ResponsiveContainer>
              {payBreak.map((p,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <div style={{width:9,height:9,borderRadius:2,background:PAY_COLORS[i%PAY_COLORS.length]}}/>
                    <span style={{fontSize:12,color:t.text}}>{p.name}</span>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:13,fontWeight:700,color:t.text,fontFamily:"monospace"}}>{fmt(p.value)}</span>
                    <span style={{fontSize:10,color:t.muted,marginLeft:5}}>{p.pct}%</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

function Reports({ t, expenses, categories }) {
  const firstOfMonth = ()=>{const d=new Date();d.setDate(1);return d.toISOString().split("T")[0];};
  const [from,    setFrom]    = useState(firstOfMonth);
  const [to,      setTo]      = useState(today);
  const [groupBy, setGroupBy] = useState("category");

  const filtered = useMemo(()=>expenses.filter(e=>e.date>=from&&e.date<=to),[expenses,from,to]);
  const total = sum(filtered);

  const grouped = useMemo(()=>{
    const g = {};
    filtered.forEach(e=>{
      const key = groupBy==="category" ? e.category
                : groupBy==="payment"  ? e.paymentMethod
                : e.date?.substring(0,7);
      if (!g[key]) g[key]={count:0,total:0};
      g[key].count++; g[key].total+=Number(e.amount||0);
    });
    return Object.entries(g).sort((a,b)=>b[1].total-a[1].total);
  },[filtered,groupBy]);

  const monthlyBar = useMemo(()=>{
    const m={};
    filtered.forEach(e=>{const k=e.date?.substring(0,7);m[k]=(m[k]||0)+Number(e.amount||0);});
    return Object.entries(m).sort().map(([k,v])=>({name:getMonthName(k),total:v}));
  },[filtered]);

  const days = useMemo(()=>Math.max(1,Math.ceil((new Date(to)-new Date(from))/86400000)+1),[from,to]);

  const quickRange = (label)=>{
    const d = new Date();
    if (label==="month") { d.setDate(1); setFrom(d.toISOString().split("T")[0]); setTo(today()); }
    if (label==="q") { d.setMonth(d.getMonth()-3); d.setDate(1); setFrom(d.toISOString().split("T")[0]); setTo(today()); }
    if (label==="year") { setFrom(`${thisYear()}-01-01`); setTo(today()); }
    if (label==="all") { setFrom("2020-01-01"); setTo(today()); }
  };

  const exportCSV = ()=>{
    const h = ["Date","Amount","Category","Subcategory","Payment Method","Notes"];
    const rows = filtered.map(e=>[e.date,e.amount,e.category,e.subcategory||"",e.paymentMethod,(e.notes||"").replace(/,/g,";")]);
    const csv  = [h,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`expenses_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fs = {width:"100%",padding:"8px 11px",borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:12,outline:"none",marginTop:4,fontFamily:"'DM Sans',sans-serif"};

  return (
    <div>
      <SectionHeader t={t} title="Reports" sub="Custom date range analysis & export"
        action={<PrimaryBtn t={t} onClick={exportCSV}>↓ Export CSV</PrimaryBtn>}
      />

      {/* Filter Row */}
      <Card t={t} style={{marginBottom:14}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>FROM DATE</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={fs}/>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>TO DATE</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={fs}/>
          </div>
          <div>
            <label style={{fontSize:10,color:t.muted,fontWeight:700,letterSpacing:"0.5px"}}>GROUP BY</label>
            <select value={groupBy} onChange={e=>setGroupBy(e.target.value)} style={{...fs,cursor:"pointer"}}>
              <option value="category">Category</option>
              <option value="payment">Payment Method</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["month","This Month"],["q","Last 3 Months"],["year","This Year"],["all","All Time"]].map(([k,l])=>(
            <button key={k} onClick={()=>quickRange(k)} style={{
              padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:500,
              border:`1px solid ${t.border}`,background:"transparent",color:t.muted,cursor:"pointer",
            }}>{l}</button>
          ))}
        </div>
      </Card>

      {/* Summary KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        <StatCard t={t} label="Total Spent" value={fmt(total)} color={t.accent} icon="💰" sub={`${filtered.length} transactions`}/>
        <StatCard t={t} label="Date Range"  value={`${days}d`} sub={`${from} → ${to}`} icon="📅"/>
        <StatCard t={t} label="Daily Average" value={fmt(total/days)} sub="Over selected period" icon="📊"/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.2fr 1fr",gap:14}}>
        {/* Monthly bar */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>Month-wise Breakdown</h3>
          {monthlyBar.length===0 ? (
            <div style={{height:200,display:"flex",alignItems:"center",justifyContent:"center",color:t.muted,fontSize:13}}>No data in range</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyBar} margin={{top:0,right:0,bottom:0,left:-15}}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
                <XAxis dataKey="name" tick={{fill:t.muted,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:t.muted,fontSize:10}} axisLine={false} tickLine={false}
                  tickFormatter={v=>`₹${v>=1000?(v/1000).toFixed(0)+"k":v}`}/>
                <Tooltip content={(p)=><CTooltip {...p} t={t}/>}/>
                <Bar dataKey="total" name="Total" fill={t.accent} radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Grouped table */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>
            By {groupBy==="category"?"Category":groupBy==="payment"?"Payment Method":"Month"}
          </h3>
          <div style={{overflowY:"auto",maxHeight:240}}>
            {grouped.length===0 ? (
              <div style={{color:t.muted,textAlign:"center",padding:"40px 0",fontSize:13}}>No data</div>
            ) : grouped.map(([key,data],i)=>{
              const cat = categories.find(c=>c.name===key);
              const pct = total>0?(data.total/total*100).toFixed(0):0;
              return (
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${t.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    {cat && <span style={{fontSize:14}}>{cat.icon}</span>}
                    <div>
                      <div style={{fontSize:12,color:t.text,fontWeight:500}}>{key}</div>
                      <div style={{fontSize:10,color:t.muted}}>{data.count} transactions</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:13,fontWeight:700,color:t.text,fontFamily:"monospace"}}>{fmt(data.total)}</div>
                    <div style={{fontSize:10,color:t.muted}}>{pct}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length>0 && (
            <div style={{paddingTop:10,marginTop:4,borderTop:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:12,fontWeight:700,color:t.text}}>TOTAL</span>
              <span style={{fontSize:13,fontWeight:700,color:t.accent,fontFamily:"monospace"}}>{fmt(total)}</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────

function Settings({ t, darkMode, setDarkMode, categories, setCategories, expenses, setExpenses }) {
  const [newName,  setNewName]  = useState("");
  const [newIcon,  setNewIcon]  = useState("🏷️");
  const [newColor, setNewColor] = useState("#6366f1");
  const fileRef = useRef();

  const addCat = ()=>{
    const n = newName.trim();
    if (!n||categories.find(c=>c.name===n)) return;
    setCategories(p=>[...p,{name:n,icon:newIcon,color:newColor}]);
    setNewName(""); setNewIcon("🏷️");
  };

  const removeCat = (name)=>{
    if (BASE_CATEGORIES.find(c=>c.name===name)) { alert("Cannot remove default categories."); return; }
    setCategories(p=>p.filter(c=>c.name!==name));
  };

  const exportBackup = ()=>{
    const data = JSON.stringify({expenses,categories,version:1,exportedAt:new Date().toISOString()},null,2);
    const blob = new Blob([data],{type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`expenseiq_backup_${today()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (e)=>{
    const file = e.target.files?.[0]; if(!file) return;
    const r = new FileReader();
    r.onload = ev=>{
      try {
        const d = JSON.parse(ev.target.result);
        if (d.expenses)   setExpenses(d.expenses);
        if (d.categories) setCategories(d.categories);
        alert(`✓ Restored ${d.expenses?.length||0} expenses!`);
      } catch { alert("Invalid backup file."); }
    };
    r.readAsText(file);
    e.target.value="";
  };

  const loadSample = ()=>{
    const cats  = ["Home Grocery","Petrol/Fuel","Bills","Food","Shopping","Medical","Entertainment","Travel","Online Purchases"];
    const pays  = ["UPI","Cash","Credit Card","Debit Card"];
    const texts = ["Big Bazaar","HP Petrol Pump","Electricity Bill","Swiggy Order","Amazon","Apollo Pharmacy","Movie Tickets","Auto fare","Reliance Fresh","Airtel Recharge","Zomato","Flipkart","Medplus","Netflix","BSNL Broadband"];
    const sample = [];
    for (let i=180;i>=0;i--) {
      const n = Math.floor(Math.random()*3);
      for (let j=0;j<n;j++) {
        const d = new Date(); d.setDate(d.getDate()-i);
        sample.push({
          id:uid(), date:d.toISOString().split("T")[0],
          amount: Math.floor(Math.random()*3500)+100,
          category: cats[Math.floor(Math.random()*cats.length)],
          subcategory:"", paymentMethod:pays[Math.floor(Math.random()*pays.length)],
          notes: texts[Math.floor(Math.random()*texts.length)],
          createdAt: new Date().toISOString(),
        });
      }
    }
    setExpenses(sample);
    alert(`✓ Loaded ${sample.length} demo expenses across 6 months!`);
  };

  const clearAll = ()=>{
    if (confirm(`Delete ALL ${expenses.length} expenses? This cannot be undone.`)) setExpenses([]);
  };

  const Row = ({label,sub,action})=>(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${t.border}`}}>
      <div>
        <div style={{fontSize:13,color:t.text,fontWeight:500}}>{label}</div>
        {sub && <div style={{fontSize:11,color:t.muted,marginTop:2}}>{sub}</div>}
      </div>
      {action}
    </div>
  );

  return (
    <div>
      <SectionHeader t={t} title="Settings" sub="Preferences, categories & data management"/>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* Appearance */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>🎨 Appearance</h3>
          <Row label="Dark Mode" sub="Toggle between light and dark theme"
            action={<Toggle t={t} value={darkMode} onChange={setDarkMode}/>}
          />
        </Card>

        {/* Stats */}
        <Card t={t}>
          <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>📊 Statistics</h3>
          <Row label="Total Expenses"     sub="" action={<span style={{fontSize:14,fontWeight:700,color:t.text,fontFamily:"monospace"}}>{expenses.length}</span>}/>
          <Row label="Total Amount Spent" sub="" action={<span style={{fontSize:14,fontWeight:700,color:t.accent,fontFamily:"monospace"}}>{fmt(expenses.reduce((s,e)=>s+Number(e.amount||0),0))}</span>}/>
          <Row label="Categories"         sub="" action={<span style={{fontSize:14,fontWeight:700,color:t.text}}>{categories.length}</span>}/>
        </Card>
      </div>

      {/* Data Management */}
      <Card t={t} style={{marginBottom:14}}>
        <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:4}}>💾 Data Management</h3>
        <Row label="Export Backup"    sub="Download all data as JSON file"
          action={<button onClick={exportBackup} style={{padding:"6px 14px",borderRadius:8,background:t.accentBg,color:t.accent,border:`1px solid ${t.accent}`,fontSize:12,fontWeight:600,cursor:"pointer"}}>↓ Backup</button>}/>
        <Row label="Import Backup"    sub="Restore from previously exported JSON"
          action={<button onClick={()=>fileRef.current?.click()} style={{padding:"6px 14px",borderRadius:8,background:t.hover,color:t.text,border:`1px solid ${t.border}`,fontSize:12,fontWeight:600,cursor:"pointer"}}>↑ Restore</button>}/>
        <Row label="Load Demo Data"   sub="Populate with 6 months of sample expenses (great for testing)"
          action={<button onClick={loadSample} style={{padding:"6px 14px",borderRadius:8,background:t.hover,color:t.text,border:`1px solid ${t.border}`,fontSize:12,fontWeight:600,cursor:"pointer"}}>Demo</button>}/>
        <Row label="Clear All Data"   sub={`Permanently delete all ${expenses.length} stored expenses`}
          action={<button onClick={clearAll} style={{padding:"6px 14px",borderRadius:8,background:t.dangerBg,color:t.danger,border:`1px solid ${t.danger}`,fontSize:12,fontWeight:600,cursor:"pointer"}}>Delete All</button>}/>
        <input ref={fileRef} type="file" accept=".json" onChange={importBackup} style={{display:"none"}}/>
      </Card>

      {/* Category Management */}
      <Card t={t}>
        <h3 style={{fontSize:13,fontWeight:600,color:t.text,marginBottom:14}}>🏷️ Manage Categories</h3>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New category name…"
            onKeyDown={e=>e.key==="Enter"&&addCat()}
            style={{flex:1,padding:"8px 12px",borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:13,outline:"none",fontFamily:"'DM Sans',sans-serif"}}/>
          <input value={newIcon} onChange={e=>setNewIcon(e.target.value)} maxLength={2}
            style={{width:46,padding:"8px",borderRadius:8,border:`1px solid ${t.border}`,background:t.input,color:t.text,fontSize:18,outline:"none",textAlign:"center"}}/>
          <input type="color" value={newColor} onChange={e=>setNewColor(e.target.value)}
            style={{width:42,height:38,borderRadius:8,border:`1px solid ${t.border}`,cursor:"pointer",background:"none",padding:2}}/>
          <PrimaryBtn t={t} onClick={addCat}>+ Add</PrimaryBtn>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:8}}>
          {categories.map(cat=>{
            const isBase = BASE_CATEGORIES.find(c=>c.name===cat.name);
            return (
              <div key={cat.name} style={{
                display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"8px 12px",borderRadius:8,
                border:`1px solid ${t.border}`,background:t.hover,
              }}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:10,height:10,borderRadius:2,background:cat.color,flexShrink:0}}/>
                  <span style={{fontSize:13,color:t.text}}>{cat.icon} {cat.name}</span>
                </div>
                {!isBase && (
                  <button onClick={()=>removeCat(cat.name)} style={{background:"none",border:"none",color:t.danger,cursor:"pointer",fontSize:14,padding:0,lineHeight:1}}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [darkMode,  setDarkMode]  = useState(true);
  const [page,      setPage]      = useState("dashboard");
  const [expenses,  setExpenses]  = useState([]);
  const [categories,setCategories]= useState(BASE_CATEGORIES);
  const [editing,   setEditing]   = useState(null);
  const [sidebarOpen,setSidebarOpen]= useState(true);
  const [loaded,    setLoaded]    = useState(false);

  const t = darkMode ? DARK : LIGHT;

  // ── Load from persistent storage ──

useEffect(() => {
  try {
    const expensesData = localStorage.getItem("iq_exp");
    if (expensesData) setExpenses(JSON.parse(expensesData));

    const darkModeData = localStorage.getItem("iq_dm");
    if (darkModeData) setDarkMode(JSON.parse(darkModeData));

    const categoriesData = localStorage.getItem("iq_cats");
    if (categoriesData) setCategories(JSON.parse(categoriesData));
  } catch (error) {
    console.error("Storage load error:", error);
  }

  setLoaded(true);
}, []);

useEffect(() => {
  if (loaded) {
    localStorage.setItem("iq_exp", JSON.stringify(expenses));
  }
}, [expenses, loaded]);

useEffect(() => {
  if (loaded) {
    localStorage.setItem("iq_dm", JSON.stringify(darkMode));
  }
}, [darkMode, loaded]);

useEffect(() => {
  if (loaded) {
    localStorage.setItem("iq_cats", JSON.stringify(categories));
  }
}, [categories, loaded]);


  // ── CRUD ──
  const addExpense    = (d) => setExpenses(p=>[{...d,id:uid(),createdAt:new Date().toISOString()},...p]);
  const updateExpense = (id,d)=> setExpenses(p=>p.map(e=>e.id===id?{...e,...d}:e));
  const deleteExpense = (id)=>{
    if (confirm("Delete this expense?")) setExpenses(p=>p.filter(e=>e.id!==id));
  };

  const nav = (p) => { setPage(p); if (p!=="add") setEditing(null); };

  const openEdit = (exp) => { setEditing(exp); setPage("add"); };

  const sW = sidebarOpen ? 220 : 64;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{overflow-x:hidden;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#374151;border-radius:4px;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        input[type=color]{-webkit-appearance:none;padding:2px;}
        input,select,textarea,button{font-family:'DM Sans',sans-serif;}
      `}</style>

      <div style={{
        display:"flex",minHeight:"100vh",
        background:t.bg,color:t.text,
        fontFamily:"'DM Sans',sans-serif",
        transition:"background 0.3s,color 0.3s",
      }}>
        <Sidebar t={t} page={page} setPage={nav}
          darkMode={darkMode} setDarkMode={setDarkMode}
          open={sidebarOpen} setOpen={setSidebarOpen}/>

        <div style={{marginLeft:sW,flex:1,padding:28,transition:"margin-left 0.25s",minWidth:0,minHeight:"100vh"}}>
          {!loaded ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"80vh",flexDirection:"column",gap:12}}>
              <div style={{fontSize:36}}>₹</div>
              <div style={{color:t.muted,fontSize:14}}>Loading ExpenseIQ…</div>
            </div>
          ) : page==="dashboard" ? (
            <Dashboard t={t} expenses={expenses} categories={categories}
              setPage={nav} openEdit={openEdit} deleteExpense={deleteExpense}/>
          ) : page==="add" ? (
            <ExpenseForm t={t} categories={categories} expense={editing}
              onSave={(d)=>{
                if (editing) updateExpense(editing.id,d);
                else addExpense(d);
                setEditing(null); nav("expenses");
              }}
              onCancel={()=>{ setEditing(null); nav("dashboard"); }}/>
          ) : page==="expenses" ? (
            <ExpenseList t={t} expenses={expenses} categories={categories}
              openEdit={openEdit} deleteExpense={deleteExpense}/>
          ) : page==="analytics" ? (
            <Analytics t={t} expenses={expenses} categories={categories}/>
          ) : page==="reports" ? (
            <Reports t={t} expenses={expenses} categories={categories}/>
          ) : page==="settings" ? (
            <Settings t={t} darkMode={darkMode} setDarkMode={setDarkMode}
              categories={categories} setCategories={setCategories}
              expenses={expenses} setExpenses={setExpenses}/>
          ) : null}
        </div>
      </div>
    </>
  );
}
