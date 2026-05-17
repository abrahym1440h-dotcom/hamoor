"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Home, BarChart2, Grid, BookOpen, ChevronDown, TrendingUp, Users, DollarSign,
  AlertTriangle, MapPin, Coffee, ShoppingBag, Building2, Utensils, Wifi, Car,
  Search, CheckCircle, XCircle, Clock, Lightbulb, Zap, Shield, Sparkles, X,
  Target, Award, TrendingDown, Calendar, PieChart, Activity, Briefcase, Star
} from "lucide-react";

const $ = {
  bg:"#F2F2F7", surface:"#FFFFFF",
  L1:"#1C1C1E", L2:"rgba(60,60,67,0.78)",
  L3:"rgba(60,60,67,0.54)", L4:"rgba(60,60,67,0.26)",
  blue:"#007AFF", green:"#34C759", red:"#FF3B30",
  orange:"#FF9500", purple:"#AF52DE", teal:"#32ADE6", indigo:"#5856D6", pink:"#FF2D92",
  F3:"rgba(120,120,128,0.12)", F4:"rgba(120,120,128,0.08)", F5:"rgba(120,120,128,0.04)",
  sep:"rgba(60,60,67,0.29)", sepL:"rgba(60,60,67,0.10)",
};
const SH = {
  card: "0 1px 0 rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.05),0 4px 24px rgba(0,0,0,0.04)",
  lift: "0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.06)",
  blue: "0 2px 8px rgba(0,122,255,0.22),0 8px 32px rgba(0,122,255,0.28)",
};
const sp = {1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,14:56,16:64};

async function apiCall(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "خطأ في الخادم");
  return data;
}

const fmt = n => (n||0).toLocaleString("en-US");

function function RiyalIcon({size=14, color="currentColor", style={}}) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none"
      style={{display:"inline-block", verticalAlign:"middle", ...style}}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M 20 30 L 80 30 M 20 50 L 80 50 M 35 15 L 35 75 Q 35 85 45 85 L 65 85 M 55 15 L 55 65" 
        stroke={color} 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

  return (
    <svg 
      width={size} 
      height={size * 1.1} 
      viewBox="0 0 1124.14 1256.39" 
      fill={color}
      style={{display:"inline-block", verticalAlign:"middle", ...style}}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path d="M1085.73,895.94c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.39L0,698.51c20.06,44.47,33.32,92.75,38.4,143.37l violations.49-65.04v176.13Z"/>
      <path d="M1085.73,895.94c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.39L0,698.51c20.06,44.47,33.32,92.75,38.4,143.37l428.39-91.04v435.04c132.25-29.04,132.25-130.59,132.25-189.61v-273.5l132.25-28.11v359.4l253.44-53.85Z"/>
    </svg>
  );
}

function Spinner({sz=20, clr="#fff"}) {
  return <div style={{width:sz,height:sz,flexShrink:0,border:`2.5px solid ${clr}28`,borderTop:`2.5px solid ${clr}`,borderRadius:"50%",animation:"_spin .72s linear infinite"}}/>;
}

function ScoreRing({value, size=120, track=10, color=$.blue, noAnim=false}) {
  const [v, setV] = useState(noAnim ? value : 0);
  const raf = useRef();
  useEffect(() => {
    if (noAnim) { setV(value); return; }
    let t0;
    function tick(ts) {
      if (!t0) t0 = ts;
      const p = Math.min((ts-t0)/1100, 1);
      setV(Math.round(value*(1-Math.pow(1-p,4))));
      if (p<1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, noAnim]);
  const r=((size-track)/2), cx=size/2, circ=2*Math.PI*r, dash=(v/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)",display:"block"}}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={`${color}1A`} strokeWidth={track}/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={track} strokeLinecap="round" strokeDasharray={`${dash} ${circ-dash}`}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:size*.246,fontWeight:800,color:$.L1,letterSpacing:"-2px",lineHeight:1}}>{v}</span>
        <span style={{fontSize:size*.097,fontWeight:500,color:$.L3,marginTop:2}}>/ 100</span>
      </div>
    </div>
  );
}

function Bar({pct, color=$.blue, h=6}) {
  return <div style={{background:$.F3,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .9s cubic-bezier(.4,0,.2,1)"}}/></div>;
}

function Chip({text, color=$.L3, bg=$.F4, size=11}) {
  return <span style={{display:"inline-flex",alignItems:"center",background:bg,color,borderRadius:99,padding:`${size>11?5:3}px ${size>11?14:10}px`,fontSize:size,fontWeight:600,lineHeight:1.2}}>{text}</span>;
}

function IconBadge({Icon, color, size=36}) {
  return <div style={{width:size,height:size,borderRadius:size*.27,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon size={size*.48} color={color} strokeWidth={1.9}/></div>;
}

function Card({children, style, onClick}) {
  return <div onClick={onClick} style={{background:$.surface,borderRadius:20,boxShadow:SH.card,overflow:"hidden",...style}}>{children}</div>;
}

function SectionLabel({children}) {
  return <div style={{fontSize:13,fontWeight:600,color:$.L3,letterSpacing:.4,textTransform:"uppercase",paddingRight:4,marginBottom:sp[2]}}>{children}</div>;
}

function Section({title, Icon, color=$.blue, children, subtitle}) {
  return <Card style={{marginBottom:sp[3]}}>
    <div style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[4]}px ${sp[5]}px ${sp[3]}px`,borderBottom:`0.5px solid ${$.sepL}`}}>
      <IconBadge Icon={Icon} color={color} size={32}/>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:$.L1,letterSpacing:"-0.2px"}}>{title}</div>
        {subtitle && <div style={{fontSize:11,color:$.L3,marginTop:1}}>{subtitle}</div>}
      </div>
    </div>
    <div style={{padding:`${sp[4]}px ${sp[5]}px`}}>{children}</div>
  </Card>;
}

function MoneyRow({label, value, valueColor=$.L1, bold=false, big=false}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <span style={{fontSize:13,color:$.L2}}>{label}</span>
    <span style={{fontSize:big?17:(bold?15:14),fontWeight:bold?800:600,color:valueColor,display:"inline-flex",alignItems:"center",gap:5}}>
      <span>{fmt(value)}</span>
      <RiyalIcon size={big?16:13} color={valueColor}/>
    </span>
  </div>;
}

function Row({label, value, valueColor=$.L1, bold=false}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <span style={{fontSize:13,color:$.L2}}>{label}</span>
    <span style={{fontSize:bold?15:14,fontWeight:bold?800:600,color:valueColor}}>{value}</span>
  </div>;
}

const iStyle = {width:"100%",boxSizing:"border-box",background:$.F5,border:"1.5px solid transparent",borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:15,color:$.L1,fontFamily:"inherit",outline:"none",appearance:"none",WebkitAppearance:"none"};

function FormField({label, icon, children}) {
  return <div style={{marginBottom:sp[4]}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>{icon}<label style={{fontSize:12,fontWeight:600,color:$.L3,letterSpacing:.4}}>{label}</label></div>{children}</div>;
}

function Sheet({open, onClose, children}) {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.40)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",background:$.surface,borderRadius:"24px 24px 0 0",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 -4px 40px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:`${sp[3]}px 0 ${sp[2]}px`}}><div style={{width:36,height:4,borderRadius:99,background:$.F3}}/></div>
        <button onClick={onClose} style={{position:"absolute",top:sp[3],left:sp[4],background:$.F3,border:"none",borderRadius:99,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><X size={16} color={$.L3}/></button>
        {children}
      </div>
    </div>
  );
}

const CITIES=["الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","تبوك","أبها","القصيم","الخبر","نجران"];

function HomeScreen({onAnalyze, lastResult, onViewLast}) {
  const [idea,setIdea]=useState("");
  const [details,setDetails]=useState("");
  const [city,setCity]=useState("الرياض");
  const [neighborhood,setNeighborhood]=useState("");
  const [budget,setBudget]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const canGo = idea.trim()&&budget.trim()&&!busy;

  function handleBudgetChange(e) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw === "") { setBudget(""); return; }
    setBudget(parseInt(raw).toLocaleString("en-US"));
  }

  async function go() {
    if (!canGo) return;
    setBusy(true); setErr(null);
    try {
      const cleanBudget = budget.replace(/,/g, "");
      const fullIdea = details.trim() ? `${idea} - تفاصيل: ${details}` : idea;
      const fullLocation = neighborhood.trim() ? `${city} - حي ${neighborhood}` : city;
      const r = await apiCall("analyze", { idea: fullIdea, city: fullLocation, budget: cleanBudget });
      onAnalyze({...r, idea: fullIdea, city: fullLocation, budget: cleanBudget});
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(168deg,#1D6EF5 0%,#007AFF 55%,#0063DB 100%)",padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{position:"absolute",top:-120,left:-120,width:340,height:340,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
        <div style={{position:"relative"}}>
          <p style={{fontSize:13,fontWeight:500,color:"rgba(255,255,255,0.65)",marginBottom:sp[1]}}>تحليل احترافي بمستوى استشاري</p>
          <h1 style={{fontSize:38,fontWeight:800,color:"#fff",letterSpacing:"-1.2px",lineHeight:1.08,marginBottom:sp[2]}}>هامور</h1>
          <p style={{fontSize:15,color:"rgba(255,255,255,0.70)",lineHeight:1.6,maxWidth:280}}>دراسة جدوى ذكية للسوق السعودي مدعومة ببيانات حقيقية وتحليل AI</p>
        </div>
      </div>

      <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <Card style={{boxShadow:SH.lift,marginBottom:sp[4],marginTop:sp[5]}}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[4]}px`,borderBottom:`0.5px solid ${$.sepL}`,display:"flex",alignItems:"center",gap:sp[3]}}>
            <div style={{width:36,height:36,borderRadius:12,background:"linear-gradient(145deg,#007AFF,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={17} color="#fff" strokeWidth={2}/></div>
            <div><div style={{fontSize:16,fontWeight:700,color:$.L1}}>حلّل مشروعك</div><div style={{fontSize:12,color:$.L3,marginTop:1}}>تحليل عميق على 4 أبعاد</div></div>
          </div>
          <div style={{padding:`${sp[4]}px ${sp[5]}px ${sp[5]}px`}}>
            
            <FormField label="فكرة المشروع" icon={<Lightbulb size={14} color={$.L4}/>}>
              <input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="مثال: كوفي مختص" style={iStyle}/>
            </FormField>

            <div style={{marginBottom:sp[4]}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                <Sparkles size={14} color={$.L4}/>
                <label style={{fontSize:12,fontWeight:600,color:$.L3,letterSpacing:.4}}>تفاصيل المشروع</label>
                <span style={{fontSize:10,color:$.L4,marginRight:"auto",background:$.F4,padding:"2px 8px",borderRadius:99}}>اختياري</span>
              </div>
              <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="مثال: كوفي بأجواء يابانية، يقدم قهوة مختصة وحلويات أسيوية، يستهدف الشباب" rows={3} style={{...iStyle, resize:"none", fontFamily:"inherit", lineHeight:1.5}}/>
              <div style={{fontSize:10,color:$.L4,marginTop:6,paddingRight:4}}>💡 كل ما زادت التفاصيل، زادت دقة التحليل</div>
            </div>

            <FormField label="المدينة" icon={<MapPin size={14} color={$.L4}/>}>
              <div style={{position:"relative"}}>
                <select value={city} onChange={e=>setCity(e.target.value)} style={{...iStyle,paddingLeft:sp[8],cursor:"pointer"}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
                <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            </FormField>

            <div style={{marginBottom:sp[4]}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                <MapPin size={14} color={$.L4}/>
                <label style={{fontSize:12,fontWeight:600,color:$.L3,letterSpacing:.4}}>الحي</label>
                <span style={{fontSize:10,color:$.L4,marginRight:"auto",background:$.F4,padding:"2px 8px",borderRadius:99}}>اختياري</span>
              </div>
              <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="مثال: العليا، الملقا، النخيل" style={iStyle}/>
            </div>

            <div style={{marginBottom:sp[4]}}>
              <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                <DollarSign size={14} color={$.L4}/>
                <label style={{fontSize:12,fontWeight:600,color:$.L3,letterSpacing:.4}}>الميزانية</label>
              </div>
              <div style={{position:"relative"}}>
                <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle, paddingLeft:sp[10], fontSize:17, fontWeight:600, letterSpacing:0.5}}/>
                <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center"}}>
                  <RiyalIcon size={20} color={$.L3}/>
                </div>
              </div>
              {budget && <div style={{fontSize:11,color:$.L3,marginTop:6,paddingRight:4,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                <span>💰</span>
                <span style={{fontWeight:600,color:$.L2}}>{parseInt(budget.replace(/,/g,"")).toLocaleString("en-US")}</span>
                <RiyalIcon size={11} color={$.L2}/>
                <span>سعودي</span>
              </div>}
            </div>

            {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
            
            <button onClick={go} disabled={!canGo} style={{marginTop:sp[5],width:"100%",background:canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3,color:canGo?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px ${sp[5]}px`,fontSize:16,fontWeight:700,cursor:canGo?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:canGo?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
              {busy?<><Spinner sz={17}/>جاري التحليل العميق…</>:<><Zap size={16} strokeWidth={2.2}/>حلّل المشروع</>}
            </button>
          </div>
        </Card>

        {lastResult && (
          <div style={{marginBottom:sp[5]}}>
            <SectionLabel>آخر تحليل</SectionLabel>
            <Card onClick={onViewLast} style={{cursor:"pointer"}}>
              <div style={{padding:`${sp[4]}px ${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[4]}}>
                <ScoreRing value={lastResult.score} size={64} track={6} color={lastResult.decision_type==="positive"?$.green:$.red} noAnim/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:$.L3,marginBottom:3}}>{lastResult.idea} · {lastResult.city}</div>
                  <div style={{fontSize:17,fontWeight:700,marginBottom:4,color:lastResult.decision_type==="positive"?$.green:$.red}}>{lastResult.decision}</div>
                  <div style={{fontSize:13,color:$.L3,lineHeight:1.45,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{lastResult.summary}</div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

const TABS=["نظرة","السوق","المالي","المخاطر"];

function AnalysisScreen({result}) {
  const [tab,setTab]=useState(0);
  if (!result) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${sp[16]}px ${sp[5]}px`,gap:sp[3],color:$.L3}}>
      <BarChart2 size={48} strokeWidth={1.3}/>
      <p style={{fontSize:17,fontWeight:600,color:$.L2}}>لا يوجد تحليل بعد</p>
      <p style={{fontSize:14,textAlign:"center"}}>ادخل للرئيسية وحلّل فكرتك أولاً</p>
    </div>
  );
  const pos=result.decision_type==="positive";
  const hGrad=pos?"linear-gradient(160deg,#2DD36F,#34C759,#1E9E40)":"linear-gradient(160deg,#FF4747,#FF3B30,#D42820)";
  const m = result.market_analysis || {};
  const f = result.financial_analysis || {};
  const sc = f.setup_costs || {};
  const mc = f.monthly_costs || {};
  const rp = f.revenue_projection || {};
  const sw = result.swot || {};
  const loc = result.locations || {};

  return (
    <div>
      <div style={{background:hGrad,position:"relative",overflow:"hidden",padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:sp[4]}}>
          <div style={{flex:1}}>
            <Chip text="نتيجة التحليل" color="rgba(255,255,255,0.88)" bg="rgba(255,255,255,0.20)"/>
            <div style={{fontSize:26,fontWeight:800,color:"#fff",letterSpacing:"-0.6px",margin:`${sp[3]}px 0 ${sp[2]}px`}}>{result.decision}</div>
            <p style={{fontSize:13,color:"rgba(255,255,255,0.78)",lineHeight:1.6,maxWidth:220}}>{result.summary}</p>
          </div>
          <ScoreRing value={result.score} size={104} track={9} color="rgba(255,255,255,0.95)"/>
        </div>
      </div>

      <div style={{padding:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
          {[{Icon:TrendingUp,label:"طلب السوق",val:result.market_demand,color:$.blue},{Icon:Users,label:"المنافسة",val:result.competition,color:$.orange},{Icon:DollarSign,label:"التكلفة",val:result.cost_level,color:$.purple},{Icon:Shield,label:"المخاطر",val:result.risk_level,color:$.red}].map(({Icon,label,val,color})=>(
            <Card key={label} style={{padding:`${sp[4]}px ${sp[4]}px ${sp[3]}px`}}>
              <IconBadge Icon={Icon} color={color} size={34}/>
              <div style={{fontSize:11,color:$.L3,marginTop:sp[2],marginBottom:3}}>{label}</div>
              <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{val}</div>
            </Card>
          ))}
        </div>

        <div style={{background:$.F3,borderRadius:12,padding:3,display:"flex",gap:2,marginBottom:sp[4]}}>
          {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{flex:1,padding:`${sp[2]}px ${sp[1]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===i?$.surface:"transparent",color:tab===i?$.blue:$.L3,fontSize:12,fontWeight:tab===i?700:500,boxShadow:tab===i?SH.card:"none"}}>{t}</button>))}
        </div>

        {tab===0 && (
          <>
            {sw.strengths?.length>0 && <Section title="نقاط القوة" Icon={CheckCircle} color={$.green}>
              {sw.strengths.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.green,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}
            </Section>}
            {sw.weaknesses?.length>0 && <Section title="نقاط الضعف" Icon={TrendingDown} color={$.orange}>
              {sw.weaknesses.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.orange,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}
            </Section>}
            {sw.opportunities?.length>0 && <Section title="الفرص" Icon={Target} color={$.blue}>
              {sw.opportunities.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.blue,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}
            </Section>}
            {sw.threats?.length>0 && <Section title="التهديدات" Icon={AlertTriangle} color={$.red}>
              {sw.threats.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.red,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}
            </Section>}
            {result.recommendations?.length>0 && <Section title="التوصيات الاستراتيجية" Icon={Lightbulb} color={$.purple}>
              {result.recommendations.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],background:`${$.purple}06`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:10}}><div style={{width:22,height:22,borderRadius:"50%",background:$.purple,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}
            </Section>}
            {result.kpis?.length>0 && <Section title="مؤشرات الأداء" Icon={Activity} color={$.teal}>
              {result.kpis.map((k,i)=><Row key={i} label={k.name} value={k.target} valueColor={$.teal}/>)}
            </Section>}
          </>
        )}

        {tab===1 && (
          <>
            <Section title="حجم السوق والجمهور" Icon={Users} color={$.blue}>
              <Row label="حجم السوق" value={m.market_size||"-"}/>
              <Row label="الفئة المستهدفة" value={m.target_audience||"-"}/>
              <Row label="أنماط الشراء" value={m.buying_patterns||"-"}/>
              <Row label="الموسمية" value={m.seasonality||"-"}/>
              <Row label="الحصة المتوقعة" value={m.expected_market_share||"-"} valueColor={$.blue} bold/>
              <Row label="إمكانيات النمو" value={m.growth_potential||"-"}/>
            </Section>
            {m.competitors?.length>0 && <Section title="المنافسون الرئيسيون" Icon={Briefcase} color={$.orange}>
              {m.competitors.map((c,i)=><div key={i} style={{padding:`${sp[3]}px 0`,borderBottom:i<m.competitors.length-1?`0.5px solid ${$.sepL}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:4}}>
                  <Star size={14} color={$.orange}/>
                  <span style={{fontSize:14,fontWeight:700,color:$.L1}}>{c.name}</span>
                </div>
                <p style={{fontSize:13,color:$.L3,lineHeight:1.5,paddingRight:sp[5]}}>{c.strength}</p>
              </div>)}
            </Section>}
            <Section title="أفضل وأسوأ موقع" Icon={MapPin} color={$.green}>
              {[{type:"الموقع الأفضل",color:$.green,d:loc.best},{type:"الموقع الأسوأ",color:$.red,d:loc.worst}].map(({type,color,d})=>d && (
                <div key={type} style={{background:`${color}07`,border:`1px solid ${color}20`,borderRadius:14,padding:`${sp[4]}px`,marginBottom:sp[3]}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:sp[3]}}>
                    <div><Chip text={type} color={color} bg={`${color}16`}/><div style={{fontSize:15,fontWeight:700,color:$.L1,marginTop:sp[2]}}>{d.name}</div></div>
                    <div style={{fontSize:26,fontWeight:800,color}}>{d.score}%</div>
                  </div>
                  <Bar pct={d.score||0} color={color}/>
                  {d.reason && <p style={{fontSize:12,color:$.L3,lineHeight:1.5,marginTop:sp[3]}}>{d.reason}</p>}
                </div>
              ))}
            </Section>
          </>
        )}

        {tab===2 && (
          <>
            <Section title="تكلفة التأسيس" Icon={Briefcase} color={$.purple} subtitle="تكاليف لمرة واحدة">
              <MoneyRow label="ضمان الإيجار" value={sc.rent_deposit}/>
              <MoneyRow label="التجهيز والديكور" value={sc.renovation}/>
              <MoneyRow label="المعدات" value={sc.equipment}/>
              <MoneyRow label="التراخيص" value={sc.licenses}/>
              <MoneyRow label="المخزون الأولي" value={sc.initial_inventory}/>
              <MoneyRow label="تسويق الإطلاق" value={sc.marketing_launch}/>
              <MoneyRow label="رأس مال تشغيلي" value={sc.working_capital}/>
              <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.purple}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي</span>
                <span style={{fontSize:20,fontWeight:800,color:$.purple,display:"inline-flex",alignItems:"center",gap:6}}>
                  <span>{fmt(sc.total)}</span>
                  <RiyalIcon size={18} color={$.purple}/>
                </span>
              </div>
            </Section>

            <Section title="التكاليف الشهرية" Icon={Calendar} color={$.orange}>
              <MoneyRow label="الإيجار" value={mc.rent}/>
              <MoneyRow label="الرواتب" value={mc.salaries}/>
              <MoneyRow label="فواتير الخدمات" value={mc.utilities}/>
              <MoneyRow label="المواد الخام" value={mc.materials}/>
              <MoneyRow label="التسويق" value={mc.marketing}/>
              <MoneyRow label="الصيانة" value={mc.maintenance}/>
              <MoneyRow label="مصاريف أخرى" value={mc.other}/>
              <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.orange}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي الشهري</span>
                <span style={{fontSize:20,fontWeight:800,color:$.orange,display:"inline-flex",alignItems:"center",gap:6}}>
                  <span>{fmt(mc.total)}</span>
                  <RiyalIcon size={18} color={$.orange}/>
                </span>
              </div>
            </Section>

            <Section title="توقع الإيرادات" Icon={TrendingUp} color={$.green} subtitle="نمو متوقع على 3 سنوات">
              <MoneyRow label="الشهر الأول" value={rp.month_1}/>
              <MoneyRow label="الشهر الثالث" value={rp.month_3}/>
              <MoneyRow label="الشهر السادس" value={rp.month_6}/>
              <MoneyRow label="الشهر الـ12" value={rp.month_12} valueColor={$.green} bold/>
              <MoneyRow label="السنة الثانية (شهرياً)" value={rp.year_2_monthly}/>
              <MoneyRow label="السنة الثالثة (شهرياً)" value={rp.year_3_monthly} valueColor={$.green} bold/>
            </Section>

            <Section title="مؤشرات الربحية" Icon={PieChart} color={$.blue}>
              <Row label="نقطة التعادل" value={(f.break_even_months||"-")+" شهر"} valueColor={$.blue} bold/>
              <Row label="العائد على الاستثمار (ROI)" value={(f.roi_percentage||"-")+"%"} valueColor={$.green} bold/>
              <MoneyRow label="الربح السنوي - السنة 1" value={f.annual_profit_year1}/>
              <MoneyRow label="الربح السنوي - السنة 3" value={f.annual_profit_year3} valueColor={$.green} bold/>
            </Section>

            <Card style={{background:`${$.blue}07`,border:`1px solid ${$.blue}25`,padding:`${sp[4]}px`,marginBottom:sp[3]}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:sp[3]}}>
                <Lightbulb size={18} color={$.blue} style={{flexShrink:0,marginTop:2}}/>
                <p style={{fontSize:13,color:$.L2,lineHeight:1.65}}>{result.financial_insight || "تحليل مالي شامل بناءً على بيانات السوق الحقيقية"}</p>
              </div>
            </Card>
          </>
        )}

        {tab===3 && (
          <>
            <Section title="تحليل المخاطر التفصيلي" Icon={AlertTriangle} color={$.red} subtitle="5 مخاطر مصنّفة مع خطط التخفيف">
              {(result.risk_analysis||[]).map((r,i)=>{
                const probColor = r.probability==="عالي"?$.red:r.probability==="متوسط"?$.orange:$.green;
                const impColor = r.impact==="شديد"?$.red:r.impact==="متوسط"?$.orange:$.green;
                return (
                  <div key={i} style={{background:$.F5,borderRadius:14,padding:`${sp[4]}px`,marginBottom:sp[3]}}>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:14,fontWeight:700,color:$.L1,flex:1}}>{r.risk}</span>
                    </div>
                    <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],flexWrap:"wrap"}}>
                      <Chip text={"احتمالية: "+r.probability} color={probColor} bg={`${probColor}15`}/>
                      <Chip text={"التأثير: "+r.impact} color={impColor} bg={`${impColor}15`}/>
                    </div>
                    <div style={{background:`${$.green}07`,borderRight:`3px solid ${$.green}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8}}>
                      <div style={{fontSize:11,fontWeight:700,color:$.green,marginBottom:4}}>خطة التخفيف</div>
                      <p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{r.mitigation}</p>
                    </div>
                  </div>
                );
              })}
            </Section>

            {result.risk_insight && <Card style={{background:`${$.red}07`,border:`1px solid ${$.red}25`,padding:`${sp[4]}px`,marginBottom:sp[3]}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:sp[3]}}>
                <Shield size={18} color={$.red} style={{flexShrink:0,marginTop:2}}/>
                <p style={{fontSize:13,color:$.L2,lineHeight:1.65}}>{result.risk_insight}</p>
              </div>
            </Card>}
          </>
        )}

        <div style={{marginTop:sp[5]}}>
          <Section title="بدائل مقترحة" Icon={Lightbulb} color={$.purple}>
            <div style={{background:$.F5,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,marginBottom:sp[2]}}>
              <div style={{fontSize:11,color:$.L3,marginBottom:2}}>فكرة بديلة</div>
              <div style={{fontSize:14,fontWeight:600,color:$.L1}}>{result.alternative_idea}</div>
            </div>
            <div style={{background:$.F5,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`}}>
              <div style={{fontSize:11,color:$.L3,marginBottom:2}}>مدينة بديلة</div>
              <div style={{fontSize:14,fontWeight:600,color:$.L1}}>{result.alternative_city}</div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}

const SECTORS=[
  {id:1,name:"مطاعم",Icon:Utensils,score:72,comp:"متوسطة",color:$.orange,data:[60,65,62,70,68,72]},
  {id:2,name:"مقاهي",Icon:Coffee,score:68,comp:"عالية",color:$.red,data:[55,60,58,65,62,68]},
  {id:3,name:"تجزئة",Icon:ShoppingBag,score:55,comp:"عالية",color:$.purple,data:[50,52,48,55,50,55]},
  {id:4,name:"فنادق",Icon:Building2,score:62,comp:"منخفضة",color:$.indigo,data:[58,60,65,62,68,62]},
  {id:5,name:"اتصالات",Icon:Wifi,score:80,comp:"منخفضة",color:$.blue,data:[70,72,75,78,76,80]},
  {id:6,name:"نقل",Icon:Car,score:59,comp:"متوسطة",color:$.teal,data:[55,57,54,60,58,59]},
];

function SectorsScreen() {
  const [q,setQ]=useState("");
  const [active,setActive]=useState(null);
  const [detail,setDetail]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const list=SECTORS.filter(s=>(!q||s.name.includes(q)));

  async function open(s) {
    setActive(s); setDetail(null); setErr(null); setBusy(true);
    try { setDetail(await apiCall("sector",{name:s.name})); }
    catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }
  const sc=s=>s.score>=70?$.green:s.score>=55?$.orange:$.red;
  const cc=s=>s.comp==="منخفضة"?$.green:s.comp==="متوسطة"?$.orange:$.red;

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <h1 style={{fontSize:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>القطاعات</h1>
      <p style={{fontSize:15,color:$.L3,marginBottom:sp[5]}}>اضغط على قطاع لتحليله</p>
      <div style={{position:"relative",marginBottom:sp[5]}}>
        <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن قطاع…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:sp[3]}}>
        {list.map(s=>(
          <Card key={s.id} onClick={()=>open(s)} style={{padding:`${sp[4]}px`,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
              <IconBadge Icon={s.Icon} color={s.color} size={44}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:sp[2]}}><span style={{fontSize:16,fontWeight:700,color:$.L1}}>{s.name}</span><span style={{fontSize:20,fontWeight:800,color:sc(s)}}>{s.score}%</span></div>
                <Bar pct={s.score} color={sc(s)}/>
                <div style={{marginTop:sp[2]}}><Chip text={"منافسة "+s.comp} color={cc(s)} bg={`${cc(s)}15`}/></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Sheet open={!!active} onClose={()=>{setActive(null);setDetail(null);}}>
        {active && (
          <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
            <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[5]}}>
              <IconBadge Icon={active.Icon} color={active.color} size={48}/>
              <div style={{fontSize:22,fontWeight:800,color:$.L1}}>{active.name}</div>
            </div>
            {busy && <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:sp[3],padding:`${sp[8]}px 0`}}><Spinner sz={28} clr={active.color}/><p style={{fontSize:14,color:$.L3}}>يحلل القطاع…</p></div>}
            {err && <div style={{background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:sp[4],fontSize:13,color:$.red}}>{err}</div>}
            {detail && !busy && (
              <div style={{display:"flex",flexDirection:"column",gap:sp[3]}}>
                <Card style={{padding:sp[4]}}><div style={{fontSize:11,fontWeight:600,color:$.L3,marginBottom:sp[2]}}>نظرة عامة</div><p style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{detail.overview}</p></Card>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
                  <Card style={{padding:sp[4]}}><div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}><CheckCircle size={14} color={$.green}/><span style={{fontSize:11,fontWeight:600,color:$.green}}>الفرصة</span></div><p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{detail.opportunity}</p></Card>
                  <Card style={{padding:sp[4]}}><div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}><AlertTriangle size={14} color={$.red}/><span style={{fontSize:11,fontWeight:600,color:$.red}}>التحديات</span></div><p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{detail.challenges}</p></Card>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
                  <Card style={{padding:sp[4]}}><div style={{fontSize:11,fontWeight:600,color:$.L3,marginBottom:4}}>متوسط الاستثمار</div><div style={{fontSize:15,fontWeight:700,color:$.L1}}>{detail.avg_investment}</div></Card>
                  <Card style={{padding:sp[4]}}><div style={{fontSize:11,fontWeight:600,color:$.L3,marginBottom:4}}>فترة الاسترداد</div><div style={{fontSize:15,fontWeight:700,color:$.L1}}>{detail.roi_period}</div></Card>
                </div>
                {detail.tips?.length>0 && <Card><div style={{padding:`${sp[4]}px ${sp[5]}px ${sp[3]}px`,borderBottom:`0.5px solid ${$.sepL}`}}><span style={{fontSize:14,fontWeight:700,color:$.L1}}>نصائح للنجاح</span></div>{detail.tips.map((t,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],padding:`${sp[3]}px ${sp[5]}px`,borderBottom:i<detail.tips.length-1?`0.5px solid ${$.sepL}`:"none"}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:active.color}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.55}}>{t}</span></div>)}</Card>}
                {detail.top_cities?.length>0 && <Card style={{padding:sp[4]}}><div style={{fontSize:11,fontWeight:600,color:$.L3,marginBottom:sp[3]}}>أفضل المدن</div><div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>{detail.top_cities.map(c=><Chip key={c} text={c} color={active.color} bg={`${active.color}14`} size={13}/>)}</div></Card>}
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}

const ARTICLES=[
  {id:1,title:"كيف تفتح كوفي ناجح في السعودية",time:8,cat:"مقاهي",grad:"linear-gradient(145deg,#FF9500,#E07800)"},
  {id:2,title:"أهم 5 أخطاء يقع فيها رواد الأعمال",time:5,cat:"عام",grad:"linear-gradient(145deg,#FF3B30,#C01E16)"},
  {id:3,title:"دراسة جدوى مطعم بميزانية 200 ألف ريال",time:12,cat:"مطاعم",grad:"linear-gradient(145deg,#34C759,#1C8C36)"},
  {id:4,title:"كيف تختار الموقع الصح لمشروعك",time:6,cat:"تسويق",grad:"linear-gradient(145deg,#007AFF,#0050C0)"},
  {id:5,title:"الفرق بين الفرنشايز والمشروع المستقل",time:9,cat:"عام",grad:"linear-gradient(145deg,#AF52DE,#7830B0)"},
  {id:6,title:"أبرز قطاعات الاستثمار في رؤية 2030",time:7,cat:"اقتصاد",grad:"linear-gradient(145deg,#32ADE6,#1880B8)"},
];

function LearningScreen() {
  const feat=ARTICLES[3];
  const rest=ARTICLES.filter(a=>a.id!==feat.id);
  const [active,setActive]=useState(null);
  const [content,setContent]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);

  async function open(a) {
    setActive(a); setContent(null); setErr(null); setBusy(true);
    try { const r = await apiCall("article",{title:a.title}); setContent(r.content); }
    catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <h1 style={{fontSize:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>التعلم</h1>
      <p style={{fontSize:15,color:$.L3,marginBottom:sp[6]}}>اضغط على مقالة لقراءتها</p>

      <div onClick={()=>open(feat)} style={{background:feat.grad,borderRadius:24,padding:`${sp[7]}px ${sp[6]}px ${sp[5]}px`,marginBottom:sp[5],cursor:"pointer"}}>
        <Chip text="مقالة مميزة" color="rgba(255,255,255,0.92)" bg="rgba(255,255,255,0.22)"/>
        <div style={{fontSize:20,fontWeight:800,color:"#fff",lineHeight:1.3,margin:`${sp[3]}px 0 ${sp[4]}px`}}>{feat.title}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:sp[1],color:"rgba(255,255,255,0.72)"}}><Clock size={13}/><span style={{fontSize:13}}>{feat.time} دقائق</span></div>
          <div style={{background:"rgba(255,255,255,0.22)",borderRadius:99,padding:`${sp[2]}px ${sp[4]}px`,fontSize:13,fontWeight:600,color:"#fff"}}>اقرأ الآن</div>
        </div>
      </div>

      <SectionLabel>جميع المقالات</SectionLabel>
      <Card>
        {rest.map((a,i)=>(
          <div key={a.id} onClick={()=>open(a)} style={{display:"flex",alignItems:"center",gap:sp[4],padding:`${sp[4]}px ${sp[5]}px`,borderBottom:i<rest.length-1?`0.5px solid ${$.sepL}`:"none",cursor:"pointer"}}>
            <div style={{width:52,height:52,borderRadius:14,background:a.grad,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:6}}>{a.title}</div>
              <div style={{display:"flex",alignItems:"center",gap:sp[2]}}><Chip text={a.cat}/><div style={{display:"flex",alignItems:"center",gap:4,color:$.L4}}><Clock size={11}/><span style={{fontSize:11}}>{a.time} دقائق</span></div></div>
            </div>
          </div>
        ))}
      </Card>

      <Sheet open={!!active} onClose={()=>{setActive(null);setContent(null);}}>
        {active && (
          <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
            <div style={{height:140,background:active.grad,borderRadius:16,marginBottom:sp[5],display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:`${sp[4]}px ${sp[5]}px`}}>
              <Chip text={active.cat} color="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.2)"/>
              <div style={{fontSize:17,fontWeight:800,color:"#fff",lineHeight:1.3,marginTop:sp[2]}}>{active.title}</div>
            </div>
            {busy && <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:sp[3],padding:`${sp[8]}px 0`}}><Spinner sz={28} clr={$.blue}/><p style={{fontSize:14,color:$.L3}}>يكتب المقالة…</p></div>}
            {err && <div style={{background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:sp[4],fontSize:13,color:$.red}}>{err}</div>}
            {content && !busy && content.split("\n\n").filter(p=>p.trim()).map((p,i)=>(<p key={i} style={{fontSize:15,color:$.L2,lineHeight:1.85,marginBottom:sp[4]}}>{p.trim()}</p>))}
          </div>
        )}
      </Sheet>
    </div>
  );
}

const NAV=[{id:"home",label:"الرئيسية",Icon:Home},{id:"analysis",label:"التحليل",Icon:BarChart2},{id:"sectors",label:"القطاعات",Icon:Grid},{id:"learning",label:"التعلم",Icon:BookOpen}];

function BottomNav({tab,setTab}) {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:999,display:"flex",justifyContent:"space-around",background:"rgba(246,246,248,0.88)",backdropFilter:"saturate(180%) blur(28px)",WebkitBackdropFilter:"saturate(180%) blur(28px)",borderTop:`0.5px solid rgba(60,60,67,0.18)`,padding:`${sp[3]}px ${sp[2]}px ${sp[7]}px`}}>
      {NAV.map(({id,label,Icon})=>{const on=tab===id;return(<button key={id} onClick={()=>setTab(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:sp[1],background:"none",border:"none",cursor:"pointer",padding:`${sp[1]}px ${sp[4]}px`,borderRadius:14}}><div style={{padding:`${sp[1]+2}px ${sp[2]+2}px`,borderRadius:12,background:on?`${$.blue}18`:"transparent"}}><Icon size={22} color={on?$.blue:$.L4} strokeWidth={on?2.1:1.6}/></div><span style={{fontSize:10,fontWeight:on?700:500,color:on?$.blue:$.L4}}>{label}</span></button>);})}
    </nav>
  );
}

export default function HamourApp() {
  const [tab,setTab]=useState("home");
  const [result,setResult]=useState(null);
  const handleAnalyze=useCallback((data)=>{setResult(data);setTab("analysis");},[]);

  return (
    <>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html,body{font-family:'IBM Plex Sans Arabic',-apple-system,sans-serif;direction:rtl;background:${$.bg};color:${$.L1};-webkit-font-smoothing:antialiased;}
        button,input,select,textarea{font-family:inherit;}
        select option{background:#fff;color:${$.L1};}
        ::-webkit-scrollbar{width:0;height:0;}
        *{-webkit-tap-highlight-color:transparent;}
        @keyframes _spin{to{transform:rotate(360deg);}}
      `}</style>
      <div style={{minHeight:"100vh",maxWidth:430,margin:"0 auto",background:$.bg,position:"relative",paddingBottom:90}}>
        {tab==="home" && <HomeScreen onAnalyze={handleAnalyze} lastResult={result} onViewLast={()=>setTab("analysis")}/>}
        {tab==="analysis" && <AnalysisScreen result={result}/>}
        {tab==="sectors" && <SectorsScreen/>}
        {tab==="learning" && <LearningScreen/>}
        <BottomNav tab={tab} setTab={setTab}/>
      </div>
    </>
  );
}
