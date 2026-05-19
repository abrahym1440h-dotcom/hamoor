"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ARTICLES, ARTICLE_CATEGORIES } from "./articles";
import {
  Home, BarChart2, Grid, BookOpen, ChevronDown, TrendingUp, Users, DollarSign,
  AlertTriangle, MapPin, Coffee, ShoppingBag, Building2, Utensils, Wifi, Car,
  Search, CheckCircle, XCircle, Clock, Lightbulb, Zap, Shield, Sparkles, X,
  Target, Award, TrendingDown, Calendar, PieChart, Activity, Briefcase, Star,
  Scissors, GraduationCap, Dumbbell, Smartphone, Cake, Pizza, Shirt, Sparkle,
  ChevronRight, Share2, Trash2, Archive, FileText, Eye, ArrowRight, Flame, Layers
} from "lucide-react";

const CATEGORY_ICONS = { Utensils, ShoppingBag, Sparkle, GraduationCap, Dumbbell, Briefcase, Activity, PieChart, BookOpen };

const $ = {
  bg:"#F2F2F7", surface:"#FFFFFF", L1:"#1C1C1E", L2:"rgba(60,60,67,0.78)",
  L3:"rgba(60,60,67,0.54)", L4:"rgba(60,60,67,0.26)",
  blue:"#007AFF", green:"#34C759", red:"#FF3B30", orange:"#FF9500", purple:"#AF52DE",
  teal:"#32ADE6", indigo:"#5856D6", pink:"#FF2D92", yellow:"#FFCC00",
  F3:"rgba(120,120,128,0.12)", F4:"rgba(120,120,128,0.08)", F5:"rgba(120,120,128,0.04)",
  sep:"rgba(60,60,67,0.29)", sepL:"rgba(60,60,67,0.10)",
};
const SH = {
  card:"0 1px 0 rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.05),0 4px 24px rgba(0,0,0,0.04)",
  lift:"0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.06)",
  blue:"0 2px 8px rgba(0,122,255,0.22),0 8px 32px rgba(0,122,255,0.28)",
};
const sp = {1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,14:56,16:64};

function useScreenSize() {
  const [size, setSize] = useState({ width: 0, isMobile: true, isTablet: false, isDesktop: false });
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setSize({ width: w, isMobile: w < 768, isTablet: w >= 768 && w < 1024, isDesktop: w >= 1024 });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

const STORAGE_KEY = "hamour_analyses";

function saveAnalysis(analysis) {
  if (typeof window === "undefined") return;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newAnalysis = { ...analysis, id: Date.now().toString(), savedAt: new Date().toISOString() };
    saved.unshift(newAnalysis);
    if (saved.length > 50) saved.splice(50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return newAnalysis;
  } catch(e) { return null; }
}

function getSavedAnalyses() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch(e) { return []; }
}

function deleteAnalysis(id) {
  if (typeof window === "undefined") return;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = saved.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch(e) {}
}

function formatDate(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    const diff = (new Date() - d) / (1000 * 60);
    if (diff < 1) return "الآن";
    if (diff < 60) return `قبل ${Math.floor(diff)} دقيقة`;
    if (diff < 1440) return `قبل ${Math.floor(diff/60)} ساعة`;
    if (diff < 10080) return `قبل ${Math.floor(diff/1440)} يوم`;
    return d.toLocaleDateString("ar-SA");
  } catch(e) { return ""; }
}

async function apiCall(endpoint, body) {
  const res = await fetch(`/api/${endpoint}`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "خطأ في الخادم");
  return data;
}

const fmt = n => (n||0).toLocaleString("en-US");

function RiyalIcon({size=14, color="currentColor", style={}}) {
  return <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{display:"inline-block",verticalAlign:"middle",...style}}><path d="M 20 30 L 80 30 M 20 50 L 80 50 M 35 15 L 35 75 Q 35 85 45 85 L 65 85 M 55 15 L 55 65" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"/></svg>;
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
  return <div style={{background:$.F3,borderRadius:99,height:h,overflow:"hidden"}}><div style={{width:`${Math.min(pct,100)}%`,height:"100%",background:color,borderRadius:99,transition:"width .9s"}}/></div>;
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

function SectionLabel({children, action}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[3]}}><div style={{fontSize:14,fontWeight:700,color:$.L1}}>{children}</div>{action}</div>;
}

function Section({title, Icon, color=$.blue, children, subtitle}) {
  return <Card style={{marginBottom:sp[3]}}>
    <div style={{display:"flex",alignItems:"center",gap:sp[3],padding:`${sp[4]}px ${sp[5]}px ${sp[3]}px`,borderBottom:`0.5px solid ${$.sepL}`}}>
      <IconBadge Icon={Icon} color={color} size={32}/>
      <div style={{flex:1}}>
        <div style={{fontSize:15,fontWeight:700,color:$.L1}}>{title}</div>
        {subtitle && <div style={{fontSize:11,color:$.L3,marginTop:1}}>{subtitle}</div>}
      </div>
    </div>
    <div style={{padding:`${sp[4]}px ${sp[5]}px`}}>{children}</div>
  </Card>;
}

function MoneyRow({label, value, valueColor=$.L1, bold=false}) {
  return <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <span style={{fontSize:13,color:$.L2}}>{label}</span>
    <span style={{fontSize:bold?15:14,fontWeight:bold?800:600,color:valueColor,display:"inline-flex",alignItems:"center",gap:5}}>
      <span>{fmt(value)}</span><RiyalIcon size={13} color={valueColor}/>
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
  return <div style={{marginBottom:sp[4]}}><div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>{icon}<label style={{fontSize:12,fontWeight:600,color:$.L3}}>{label}</label></div>{children}</div>;
}

function Sheet({open, onClose, children}) {
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:2000,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={onClose} style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.40)",backdropFilter:"blur(4px)"}}/>
      <div style={{position:"relative",background:$.surface,borderRadius:"24px 24px 0 0",maxHeight:"92vh",maxWidth:720,margin:"0 auto",width:"100%",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"center",padding:`${sp[3]}px 0`,position:"sticky",top:0,background:$.surface,zIndex:10}}><div style={{width:36,height:4,borderRadius:99,background:$.F3}}/></div>
        <button onClick={onClose} style={{position:"sticky",top:sp[3],left:sp[4],background:$.F3,border:"none",borderRadius:99,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:sp[4],zIndex:11}}><X size={16} color={$.L3}/></button>
        {children}
      </div>
    </div>
  );
}

const CITIES = ["الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","تبوك","أبها","القصيم","الخبر","نجران"];

const FEATURED_SECTORS = [
  {id:"tech", name:"خدمات تقنية", Icon:Wifi, color:$.indigo, score:85, growth:"+25%"},
  {id:"edu", name:"تعليم وتدريب", Icon:GraduationCap, color:$.blue, score:82, growth:"+22%"},
  {id:"fit", name:"لياقة ورياضة", Icon:Dumbbell, color:$.green, score:78, growth:"+20%"},
  {id:"sweets", name:"حلويات", Icon:Cake, color:$.pink, score:72, growth:"+18%"}
];

function AnalyzeForm({onAnalyze, onClose}) {
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
      const r = await apiCall("analyze", { idea:fullIdea, city:fullLocation, budget:cleanBudget });
      const analysis = {...r, idea:fullIdea, city:fullLocation, budget:cleanBudget};
      const saved = saveAnalysis(analysis);
      onAnalyze(saved || analysis);
      if (onClose) onClose();
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{padding:`${sp[3]}px ${sp[5]}px ${sp[6]}px`}}>
      <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[5]}}>
        <div style={{width:42,height:42,borderRadius:14,background:"linear-gradient(145deg,#007AFF,#0055D4)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={20} color="#fff" strokeWidth={2}/></div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:$.L1}}>حلّل مشروعك</div>
          <div style={{fontSize:12,color:$.L3,marginTop:2}}>تحليل عميق على 4 أبعاد بالذكاء الاصطناعي</div>
        </div>
      </div>
      <FormField label="فكرة المشروع" icon={<Lightbulb size={14} color={$.L4}/>}>
        <input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="مثال: كوفي مختص" style={iStyle}/>
      </FormField>
      <FormField label="تفاصيل المشروع (اختياري)" icon={<Sparkles size={14} color={$.L4}/>}>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="مثال: كوفي بأجواء يابانية" rows={3} style={{...iStyle,resize:"none",lineHeight:1.5}}/>
      </FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3]}}>
        <FormField label="المدينة" icon={<MapPin size={14} color={$.L4}/>}>
          <div style={{position:"relative"}}>
            <select value={city} onChange={e=>setCity(e.target.value)} style={{...iStyle,paddingLeft:sp[8],cursor:"pointer"}}>{CITIES.map(c=><option key={c}>{c}</option>)}</select>
            <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
        </FormField>
        <FormField label="الحي (اختياري)" icon={<MapPin size={14} color={$.L4}/>}>
          <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="مثال: العليا" style={iStyle}/>
        </FormField>
      </div>
      <FormField label="الميزانية" icon={<DollarSign size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle,paddingLeft:sp[10],fontSize:17,fontWeight:600}}/>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><RiyalIcon size={20} color={$.L3}/></div>
        </div>
      </FormField>
      {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
      <button onClick={go} disabled={!canGo} style={{marginTop:sp[5],width:"100%",background:canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3,color:canGo?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:16,fontWeight:700,cursor:canGo?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:canGo?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
        {busy?<><Spinner sz={17}/>جاري التحليل…</>:<><Zap size={16} strokeWidth={2.2}/>حلّل المشروع</>}
      </button>
    </div>
  );
}

function HomeScreen({onAnalyze, lastResult, onViewLast, onViewSaved, onGoSectors, onGoLearning}) {
  const screen = useScreenSize();
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState([]);

  useEffect(() => { setSaved(getSavedAnalyses()); }, [lastResult]);

  const totalAnalyses = saved.length;
  const positiveCount = saved.filter(a => a.decision_type === "positive").length;
  const successRate = totalAnalyses > 0 ? Math.round((positiveCount / totalAnalyses) * 100) : 0;
  const featuredArticles = ARTICLES.slice(0, 3);

  function getCategoryInfo(catId) {
    return ARTICLE_CATEGORIES.find(c => c.id === catId) || {name:"عام", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)", iconName:"BookOpen"};
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  return (
    <div>
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(168deg,#1D6EF5 0%,#007AFF 55%,#0063DB 100%)",padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{...containerStyle,position:"relative"}}>
          <div style={{position:"absolute",top:-120,left:-120,width:340,height:340,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:$.green,boxShadow:`0 0 12px ${$.green}`}}/>
              <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)"}}>جاهز للتحليل</span>
            </div>
            <h1 style={{fontSize:screen.isDesktop?52:screen.isTablet?44:38,fontWeight:800,color:"#fff",letterSpacing:"-1.4px",lineHeight:1.08,marginBottom:sp[2]}}>هامور</h1>
            <p style={{fontSize:screen.isDesktop?17:14,color:"rgba(255,255,255,0.75)",lineHeight:1.6,maxWidth:screen.isDesktop?480:280,marginBottom:sp[5]}}>دراسة جدوى ذكية للسوق السعودي مدعومة بالذكاء الاصطناعي</p>
            <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <BarChart2 size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{totalAnalyses} تحليل</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <Layers size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>12 قطاع</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <BookOpen size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{ARTICLES.length} مقالة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[6]}px ${sp[10]}px ${sp[16]}px`:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[5]}}>
        <div style={containerStyle}>
          <Card onClick={()=>setShowForm(true)} style={{cursor:"pointer",boxShadow:SH.lift,marginBottom:sp[5],background:"linear-gradient(145deg,#FFFFFF,#F8FAFF)",border:`1.5px solid ${$.blue}15`}}>
            <div style={{padding:screen.isDesktop?`${sp[6]}px ${sp[7]}px`:`${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[4]}}>
              <div style={{width:screen.isDesktop?72:56,height:screen.isDesktop?72:56,borderRadius:18,background:"linear-gradient(145deg,#007AFF,#0050C0)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:SH.blue,flexShrink:0}}>
                <Sparkles size={screen.isDesktop?32:26} color="#fff" strokeWidth={2}/>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:screen.isDesktop?22:18,fontWeight:800,color:$.L1,letterSpacing:"-0.4px",marginBottom:4}}>حلّل مشروعك الآن</div>
                <p style={{fontSize:screen.isDesktop?14:12,color:$.L3,lineHeight:1.5}}>تحليل عميق بالذكاء الاصطناعي في 30 ثانية</p>
              </div>
              <div style={{width:44,height:44,borderRadius:14,background:$.blue,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:SH.blue}}>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} style={{transform:"scaleX(-1)"}}/>
              </div>
            </div>
          </Card>

          {totalAnalyses > 0 && (
            <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:sp[3],marginBottom:sp[6]}}>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Archive} color={$.purple} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.L1,marginTop:sp[2]}}>{totalAnalyses}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>تحليل محفوظ</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={CheckCircle} color={$.green} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.green,marginTop:sp[2]}}>{successRate}%</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>معدل النجاح</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Flame} color={$.orange} size={36}/>
                <div style={{fontSize:24,fontWeight:800,color:$.orange,marginTop:sp[2]}}>{positiveCount}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>مشروع واعد</div>
              </Card>
              <Card style={{padding:sp[4]}}>
                <IconBadge Icon={Clock} color={$.blue} size={36}/>
                <div style={{fontSize:13,fontWeight:800,color:$.L1,marginTop:sp[2],lineHeight:1.3}}>{saved[0] ? formatDate(saved[0].savedAt) : "-"}</div>
                <div style={{fontSize:11,color:$.L3,marginTop:2,fontWeight:600}}>آخر تحليل</div>
              </Card>
            </div>
          )}

          {saved.length > 0 && (
            <div style={{marginBottom:sp[6]}}>
              <SectionLabel action={<button onClick={onViewSaved} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>آخر تحليلاتك</SectionLabel>
              <div style={{display:"flex",gap:sp[3],overflowX:"auto",paddingBottom:sp[2]}}>
                {saved.slice(0,5).map(a => {
                  const pos = a.decision_type === "positive";
                  const color = pos ? $.green : $.red;
                  return (
                    <Card key={a.id} onClick={()=>onViewLast(a)} style={{flex:"none",width:260,padding:sp[4],cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[3],marginBottom:sp[3]}}>
                        <ScoreRing value={a.score} size={52} track={5} color={color} noAnim/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:14,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                          <div style={{fontSize:11,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/><span>{a.city}</span></div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:sp[2],borderTop:`0.5px solid ${$.sepL}`}}>
                        <Chip text={pos?"واعد":"متعثر"} color={color} bg={`${color}15`} size={10}/>
                        <div style={{fontSize:10,color:$.L4,display:"flex",alignItems:"center",gap:3}}><Clock size={9}/>{formatDate(a.savedAt)}</div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{marginBottom:sp[6]}}>
            <SectionLabel action={<button onClick={onGoSectors} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>قطاعات مميزة</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr 1fr":screen.isTablet?"1fr 1fr 1fr 1fr":"1fr 1fr",gap:sp[3]}}>
              {FEATURED_SECTORS.map(s => (
                <Card key={s.id} onClick={onGoSectors} style={{padding:sp[4],cursor:"pointer"}}>
                  <IconBadge Icon={s.Icon} color={s.color} size={44}/>
                  <div style={{fontSize:13,fontWeight:700,color:$.L1,marginTop:sp[3],marginBottom:6,lineHeight:1.3}}>{s.name}</div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <Chip text={s.growth} color={$.green} bg={`${$.green}15`} size={10}/>
                    <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.score}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div style={{marginBottom:sp[5]}}>
            <SectionLabel action={<button onClick={onGoLearning} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,fontWeight:600,color:$.blue,fontFamily:"inherit",display:"flex",alignItems:"center",gap:3}}><span>عرض الكل</span><ChevronRight size={14}/></button>}>مقالات مختارة</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
              {featuredArticles.map(article => {
                const catInfo = getCategoryInfo(article.category);
                const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
                return (
                  <Card key={article.id} onClick={onGoLearning} style={{padding:sp[4],cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:sp[3]}}>
                      <div style={{width:54,height:54,borderRadius:14,background:catInfo.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${catInfo.color}33`}}>
                        <CatIcon size={26} color="#ffffff" strokeWidth={2.4} absoluteStrokeWidth/>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{article.title}</div>
                        <Chip text={catInfo.name} color={catInfo.color} bg={`${catInfo.color}15`} size={10}/>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showForm} onClose={()=>setShowForm(false)}>
        <AnalyzeForm onAnalyze={onAnalyze} onClose={()=>setShowForm(false)}/>
      </Sheet>
    </div>
  );
}

const TABS=["نظرة","السوق","المالي","المخاطر"];

function AnalysisScreen({result}) {
  const screen = useScreenSize();
  const [tab,setTab]=useState(0);
  if (!result) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${sp[16]}px ${sp[5]}px`,gap:sp[3],color:$.L3,minHeight:"60vh"}}>
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
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:720, margin:"0 auto"} : {};

  return (
    <div>
      <div style={{background:hGrad,position:"relative",overflow:"hidden",padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{...containerStyle,position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:sp[4]}}>
          <div style={{flex:1}}>
            <Chip text="نتيجة التحليل" color="rgba(255,255,255,0.88)" bg="rgba(255,255,255,0.20)"/>
            <div style={{fontSize:screen.isDesktop?34:26,fontWeight:800,color:"#fff",letterSpacing:"-0.6px",margin:`${sp[3]}px 0 ${sp[2]}px`}}>{result.decision}</div>
            <p style={{fontSize:screen.isDesktop?15:13,color:"rgba(255,255,255,0.78)",lineHeight:1.6,maxWidth:screen.isDesktop?500:220}}>{result.summary}</p>
          </div>
          <ScoreRing value={result.score} size={screen.isDesktop?140:104} track={screen.isDesktop?11:9} color="rgba(255,255,255,0.95)"/>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[5]}px ${sp[10]}px ${sp[16]}px`:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <div style={containerStyle}>
          <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
            {[{Icon:TrendingUp,label:"طلب السوق",val:result.market_demand,color:$.blue},{Icon:Users,label:"المنافسة",val:result.competition,color:$.orange},{Icon:DollarSign,label:"التكلفة",val:result.cost_level,color:$.purple},{Icon:Shield,label:"المخاطر",val:result.risk_level,color:$.red}].map(({Icon,label,val,color})=>(
              <Card key={label} style={{padding:`${sp[4]}px`}}>
                <IconBadge Icon={Icon} color={color} size={34}/>
                <div style={{fontSize:11,color:$.L3,marginTop:sp[2],marginBottom:3}}>{label}</div>
                <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{val}</div>
              </Card>
            ))}
          </div>

          <div style={{background:$.F3,borderRadius:12,padding:3,display:"flex",gap:2,marginBottom:sp[4],maxWidth:screen.isDesktop?500:"100%",margin:`0 auto ${sp[4]}px`}}>
            {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{flex:1,padding:`${sp[2]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===i?$.surface:"transparent",color:tab===i?$.blue:$.L3,fontSize:12,fontWeight:tab===i?700:500,boxShadow:tab===i?SH.card:"none"}}>{t}</button>))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[4]}}>
            {tab===0 && (<>
              {sw.strengths?.length>0 && <Section title="نقاط القوة" Icon={CheckCircle} color={$.green}>{sw.strengths.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.green,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.weaknesses?.length>0 && <Section title="نقاط الضعف" Icon={TrendingDown} color={$.orange}>{sw.weaknesses.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.orange,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.opportunities?.length>0 && <Section title="الفرص" Icon={Target} color={$.blue}>{sw.opportunities.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.blue,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.threats?.length>0 && <Section title="التهديدات" Icon={AlertTriangle} color={$.red}>{sw.threats.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.red,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
            </>)}

            {tab===1 && (<>
              <Section title="حجم السوق" Icon={Users} color={$.blue}>
                <Row label="حجم السوق" value={m.market_size||"-"}/>
                <Row label="الفئة المستهدفة" value={m.target_audience||"-"}/>
                <Row label="الحصة المتوقعة" value={m.expected_market_share||"-"} valueColor={$.blue} bold/>
              </Section>
            </>)}

            {tab===2 && (<>
              <Section title="تكلفة التأسيس" Icon={Briefcase} color={$.purple}>
                <MoneyRow label="ضمان الإيجار" value={sc.rent_deposit}/>
                <MoneyRow label="التجهيز والديكور" value={sc.renovation}/>
                <MoneyRow label="المعدات" value={sc.equipment}/>
                <MoneyRow label="التراخيص" value={sc.licenses}/>
                <MoneyRow label="المخزون الأولي" value={sc.initial_inventory}/>
                <MoneyRow label="تسويق الإطلاق" value={sc.marketing_launch}/>
                <MoneyRow label="رأس مال تشغيلي" value={sc.working_capital}/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.purple}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي</span><span style={{fontSize:20,fontWeight:800,color:$.purple,display:"inline-flex",alignItems:"center",gap:6}}><span>{fmt(sc.total)}</span><RiyalIcon size={18} color={$.purple}/></span></div>
              </Section>
              <Section title="التكاليف الشهرية" Icon={Calendar} color={$.orange}>
                <MoneyRow label="الإيجار" value={mc.rent}/>
                <MoneyRow label="الرواتب" value={mc.salaries}/>
                <MoneyRow label="الفواتير" value={mc.utilities}/>
                <MoneyRow label="المواد" value={mc.materials}/>
                <MoneyRow label="التسويق" value={mc.marketing}/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.orange}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي</span><span style={{fontSize:20,fontWeight:800,color:$.orange,display:"inline-flex",alignItems:"center",gap:6}}><span>{fmt(mc.total)}</span><RiyalIcon size={18} color={$.orange}/></span></div>
              </Section>
              <Section title="توقع الإيرادات" Icon={TrendingUp} color={$.green}>
                <MoneyRow label="الشهر الأول" value={rp.month_1}/>
                <MoneyRow label="الشهر الثالث" value={rp.month_3}/>
                <MoneyRow label="الشهر السادس" value={rp.month_6}/>
                <MoneyRow label="الشهر 12" value={rp.month_12} valueColor={$.green} bold/>
              </Section>
              <Section title="الربحية" Icon={PieChart} color={$.blue}>
                <Row label="نقطة التعادل" value={(f.break_even_months||"-")+" شهر"} valueColor={$.blue} bold/>
                <Row label="ROI" value={(f.roi_percentage||"-")+"%"} valueColor={$.green} bold/>
              </Section>
            </>)}

            {tab===3 && (
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المخاطر" Icon={AlertTriangle} color={$.red}>
                  {(result.risk_analysis||[]).map((r,i)=>(
                    <div key={i} style={{background:$.F5,borderRadius:14,padding:sp[4],marginBottom:sp[3]}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div>
                        <span style={{fontSize:14,fontWeight:700,color:$.L1,flex:1}}>{r.risk}</span>
                      </div>
                      <div style={{background:`${$.green}07`,borderRight:`3px solid ${$.green}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8}}>
                        <div style={{fontSize:11,fontWeight:700,color:$.green,marginBottom:4}}>خطة التخفيف</div>
                        <p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedAnalysesScreen({onViewAnalysis}) {
  const screen = useScreenSize();
  const [analyses, setAnalyses] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { setAnalyses(getSavedAnalyses()); }, []);

  function handleDelete(id) {
    deleteAnalysis(id);
    setAnalyses(getSavedAnalyses());
    setConfirmDelete(null);
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : {};

  if (analyses.length === 0) {
    return (
      <div style={{padding:`${sp[14]}px ${sp[5]}px`}}>
        <div style={containerStyle}>
          <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:sp[8]}}>تحليلاتي</h1>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:`${sp[12]}px`,textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:24,background:`${$.purple}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:sp[5]}}>
              <Archive size={36} color={$.purple} strokeWidth={1.5}/>
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>لا توجد تحليلات بعد</h3>
            <p style={{fontSize:14,color:$.L3,lineHeight:1.6,maxWidth:320}}>عند تحليل أي مشروع، سيتم حفظه تلقائياً هنا</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:sp[5]}}>تحليلاتي</h1>
        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
          {analyses.map(a => {
            const pos = a.decision_type === "positive";
            const color = pos ? $.green : $.red;
            return (
              <Card key={a.id} style={{padding:0,overflow:"hidden"}}>
                <div onClick={()=>onViewAnalysis(a)} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[3]}}>
                    <ScoreRing value={a.score} size={56} track={5} color={color} noAnim/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                      <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{a.city}</span></div>
                    </div>
                  </div>
                  <Chip text={a.decision} color={color} bg={`${color}15`} size={11}/>
                </div>
                <div style={{display:"flex",borderTop:`0.5px solid ${$.sepL}`}}>
                  <button onClick={()=>onViewAnalysis(a)} style={{flex:1,padding:sp[3],background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Eye size={14}/><span>عرض</span>
                  </button>
                  <button onClick={()=>setConfirmDelete(a.id)} style={{flex:"none",padding:`${sp[3]}px ${sp[5]}px`,background:"transparent",border:"none",cursor:"pointer",color:$.red}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Sheet open={!!confirmDelete} onClose={()=>setConfirmDelete(null)}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
              <AlertTriangle size={30} color={$.red}/>
            </div>
            <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>حذف التحليل؟</h3>
            <p style={{fontSize:14,color:$.L3,marginBottom:sp[6]}}>سيتم حذف هذا التحليل نهائياً</p>
            <div style={{display:"flex",gap:sp[3]}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,background:$.F3,color:$.L1,border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{flex:1,background:$.red,color:"#fff",border:"none",borderRadius:12,padding:sp[3],fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>حذف</button>
            </div>
          </div>
        </Sheet>
      </div>
    </div>
  );
}

const SECTORS_DATA = [
  {id:1, category:"food", name:"مقاهي ومشروبات", Icon:Coffee, color:$.orange, score:68, growth:"+12%", failure_rate:"60%", audience:"شباب 18-35", top_cities:["الرياض","جدة"], success_tips:["موقع استراتيجي","تميّز في القهوة","تصميم جذاب"], failure_reasons:["إشباع السوق","موقع ضعيف","ضعف التمييز"], competitors:["ستاربكس","عربيكا"], sub_ideas:["كوفي كوري","عربة قهوة"]},
  {id:2, category:"food", name:"مطاعم وأكل", Icon:Utensils, color:$.red, score:65, growth:"+8%", failure_rate:"70%", audience:"عائلات", top_cities:["الرياض","جدة"], success_tips:["تخصص واضح","اتساق الجودة","توصيل قوي"], failure_reasons:["قائمة كبيرة","ضعف الإدارة"], competitors:["البيك","كودو"], sub_ideas:["مطعم كبسة","فطور راقي"]},
  {id:3, category:"food", name:"حلويات", Icon:Cake, color:$.pink, score:72, growth:"+18%", failure_rate:"45%", audience:"نساء، مناسبات", top_cities:["الرياض","جدة"], success_tips:["تصوير احترافي","تغليف فاخر","توصيل سريع"], failure_reasons:["تقليد المنافسين","ضعف التغليف"], competitors:["صابا","ميلانو"], sub_ideas:["حلويات صحية","كيكات مناسبات"]},
  {id:4, category:"food", name:"وجبات سريعة", Icon:Pizza, color:$.yellow, score:64, growth:"+10%", failure_rate:"55%", audience:"شباب، طلاب", top_cities:["الرياض"], success_tips:["سرعة التحضير","تسعير منافس","توصيل قوي"], failure_reasons:["منافسة شرسة","ضعف الجودة"], competitors:["ماكدونالدز","البيك"], sub_ideas:["برجر سعودي","شاورما فاخرة"]},
  {id:5, category:"retail", name:"تجزئة", Icon:ShoppingBag, color:$.purple, score:55, growth:"+5%", failure_rate:"55%", audience:"عام", top_cities:["الرياض","جدة"], success_tips:["تخصص واضح","موقع جيد","إدارة مخزون"], failure_reasons:["منافسة التجارة الإلكترونية","بضاعة راكدة"], competitors:["نون","ساكو"], sub_ideas:["متجر أطفال","متجر هدايا"]},
  {id:6, category:"retail", name:"أزياء وعبايات", Icon:Shirt, color:$.indigo, score:75, growth:"+15%", failure_rate:"40%", audience:"نساء 20-60", top_cities:["الرياض","جدة"], success_tips:["تصاميم حصرية","خياطة عالية","إنستقرام احترافي"], failure_reasons:["تشابه التصاميم","تسعير ضعيف"], competitors:["مزون","نهى"], sub_ideas:["عبايات شبابية","فساتين سهرة"]},
  {id:7, category:"retail", name:"إلكترونيات", Icon:Smartphone, color:$.teal, score:60, growth:"+7%", failure_rate:"50%", audience:"شباب، موظفون", top_cities:["الرياض"], success_tips:["أسعار منافسة","ضمان موثوق","صيانة"], failure_reasons:["هامش ضعيف","منافسة قاتلة"], competitors:["إكسترا","جرير"], sub_ideas:["إكسسوارات","صيانة متخصصة"]},
  {id:8, category:"services", name:"صالونات وتجميل", Icon:Sparkle, color:$.pink, score:70, growth:"+14%", failure_rate:"50%", audience:"نساء 18-55", top_cities:["الرياض","جدة"], success_tips:["مصففين موهوبين","تجربة فاخرة","نظام حجز"], failure_reasons:["دوران الموظفين","عدم النظافة"], competitors:["روزا","إكسير"], sub_ideas:["صالون رجالي","صالون أعراس"]},
  {id:9, category:"services", name:"خياطة", Icon:Scissors, color:$.purple, score:62, growth:"+6%", failure_rate:"30%", audience:"رجال، نساء", top_cities:["الرياض","القصيم"], success_tips:["خياطين ماهرين","الالتزام بالمواعيد","تخصص"], failure_reasons:["تأخر التسليم","ضعف الجودة"], competitors:["محلات محلية"], sub_ideas:["فساتين سهرة","بشوت"]},
  {id:10, category:"professional", name:"تعليم وتدريب", Icon:GraduationCap, color:$.blue, score:82, growth:"+22%", failure_rate:"35%", audience:"طلاب، موظفون", top_cities:["الرياض","جدة"], success_tips:["مدربين ذوي خبرة","محتوى مميز","شهادات معتمدة"], failure_reasons:["ضعف الجودة","تسعير مرتفع"], competitors:["دروب","رواق"], sub_ideas:["برمجة للأطفال","لغات"]},
  {id:11, category:"professional", name:"لياقة ورياضة", Icon:Dumbbell, color:$.green, score:78, growth:"+20%", failure_rate:"40%", audience:"شباب 18-45", top_cities:["الرياض","جدة"], success_tips:["أجهزة حديثة","مدربين معتمدين","تنوع البرامج"], failure_reasons:["أجهزة قديمة","اشتراكات مرتفعة"], competitors:["فتنس تايم","بادي ماستر"], sub_ideas:["نادي نسائي","كروسفت"]},
  {id:12, category:"professional", name:"خدمات تقنية", Icon:Wifi, color:$.indigo, score:85, growth:"+25%", failure_rate:"30%", audience:"شركات", top_cities:["الرياض","جدة"], success_tips:["تخصص","محفظة قوية","دعم فني"], failure_reasons:["عدم التخصص","ضعف التسعير"], competitors:["شركات محلية"], sub_ideas:["تسويق رقمي","تصميم تطبيقات"]}
];

const CATEGORIES_LIST = [
  {id:"all", name:"الكل", color:$.blue},
  {id:"food", name:"أطعمة", color:$.orange},
  {id:"retail", name:"تجزئة", color:$.purple},
  {id:"services", name:"خدمات", color:$.teal},
  {id:"professional", name:"احترافية", color:$.indigo}
];

function SectorsScreen() {
  const screen = useScreenSize();
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("all");
  const [active,setActive]=useState(null);
  
  const list = SECTORS_DATA.filter(s => {
    if (cat !== "all" && s.category !== cat) return false;
    if (q && !s.name.includes(q)) return false;
    return true;
  });

  const sc = s => s.score>=75?$.green : s.score>=60?$.orange : $.red;
  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>القطاعات</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>تحليلات السوق السعودي</p>
        <div style={{position:"relative",marginBottom:sp[4]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>
        <div style={{display:"flex",gap:sp[2],marginBottom:sp[5],overflowX:"auto",paddingBottom:4}}>
          {CATEGORIES_LIST.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:cat===c.id?c.color:$.F4,color:cat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{c.name}</button>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {list.map(s=>(
            <Card key={s.id} onClick={()=>setActive(s)} style={{padding:sp[4],cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
                <IconBadge Icon={s.Icon} color={s.color} size={48}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
                    <span style={{fontSize:16,fontWeight:700,color:$.L1}}>{s.name}</span>
                    <span style={{fontSize:20,fontWeight:800,color:sc(s)}}>{s.score}</span>
                  </div>
                  <Bar pct={s.score} color={sc(s)}/>
                  <div style={{display:"flex",gap:sp[2],marginTop:sp[3],flexWrap:"wrap"}}>
                    <Chip text={"نمو "+s.growth} color={$.green} bg={`${$.green}15`}/>
                    <Chip text={"فشل "+s.failure_rate} color={$.red} bg={`${$.red}15`}/>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <Sheet open={!!active} onClose={()=>setActive(null)}>
          {active && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[3]}}>
                <IconBadge Icon={active.Icon} color={active.color} size={52}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:22,fontWeight:800,color:$.L1}}>{active.name}</div>
                </div>
                <div style={{fontSize:32,fontWeight:800,color:active.color}}>{active.score}</div>
              </div>
              <Section title="الجمهور" Icon={Users} color={$.blue}>
                <p style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{active.audience}</p>
              </Section>
              <Section title="أفضل المدن" Icon={MapPin} color={$.green}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.top_cities.map((c,i)=>(<Chip key={c} text={`${i+1}. ${c}`} color={$.green} bg={`${$.green}15`} size={13}/>))}
                </div>
              </Section>
              <Section title="عوامل النجاح" Icon={CheckCircle} color={$.green}>
                {active.success_tips.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{t}</span>
                  </div>
                ))}
              </Section>
              <Section title="أسباب الفشل" Icon={XCircle} color={$.red}>
                {active.failure_reasons.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>×</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{t}</span>
                  </div>
                ))}
              </Section>
              <Section title="المنافسون" Icon={Briefcase} color={$.orange}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.competitors.map(c=>(<Chip key={c} text={c} color={$.orange} bg={`${$.orange}15`} size={12}/>))}
                </div>
              </Section>
              <Section title="أفكار فرعية" Icon={Lightbulb} color={$.purple}>
                {active.sub_ideas.map((idea,i)=>(
                  <div key={i} style={{background:`${$.purple}07`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:10,marginBottom:sp[2]}}>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                      <Sparkles size={14} color={$.purple}/>
                      <span style={{fontSize:14,fontWeight:600,color:$.L1}}>{idea}</span>
                    </div>
                  </div>
                ))}
              </Section>
            </div>
          )}
        </Sheet>
      </div>
    </div>
  );
}

function LearningScreen() {
  const screen = useScreenSize();
  const [q,setQ]=useState("");
  const [activeCat,setActiveCat]=useState("all");
  const [activeArticle,setActiveArticle]=useState(null);

  const allCategories = [{id:"all", name:"الكل", iconName:"BookOpen", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)"}, ...ARTICLE_CATEGORIES];
  
  const filteredArticles = ARTICLES.filter(a => {
    if (activeCat !== "all" && a.category !== activeCat) return false;
    if (q && !a.title.includes(q)) return false;
    return true;
  });

  function getLevelColor(level) {
    if (level === "مبتدئ") return $.green;
    if (level === "متوسط") return $.orange;
    return $.red;
  }

  function getCategoryInfo(catId) {
    return ARTICLE_CATEGORIES.find(c => c.id === catId) || {name:"عام", color:$.blue, gradient:"linear-gradient(145deg,#007AFF,#0050C0)", iconName:"BookOpen"};
  }

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>مكتبة التعلم</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>{ARTICLES.length} مقالة احترافية</p>
        <div style={{position:"relative",marginBottom:sp[5]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث في المقالات…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>
        <div style={{display:"flex",gap:sp[2],marginBottom:sp[4],overflowX:"auto",paddingBottom:4}}>
          {allCategories.map(c => {
            const CatIcon = CATEGORY_ICONS[c.iconName] || BookOpen;
            return (
              <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:activeCat===c.id?c.color:$.F4,color:activeCat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
                <CatIcon size={14} strokeWidth={2.2}/>
                <span>{c.name}</span>
              </button>
            );
          })}
        </div>
        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {filteredArticles.map(article => {
            const catInfo = getCategoryInfo(article.category);
            const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
            return (
              <Card key={article.id} onClick={()=>setActiveArticle(article)} style={{padding:sp[4],cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:sp[4]}}>
                  <div style={{width:60,height:60,borderRadius:16,background:catInfo.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${catInfo.color}33`}}>
                    <CatIcon size={30} color="#ffffff" strokeWidth={2.4} absoluteStrokeWidth/>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:4}}>{article.title}</div>
                    <p style={{fontSize:12,color:$.L3,lineHeight:1.5,marginBottom:sp[2],overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{article.excerpt}</p>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                      <Chip text={catInfo.name} color={catInfo.color} bg={`${catInfo.color}15`} size={11}/>
                      <Chip text={article.level} color={getLevelColor(article.level)} bg={`${getLevelColor(article.level)}15`} size={11}/>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <Sheet open={!!activeArticle} onClose={()=>setActiveArticle(null)}>
          {activeArticle && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              {(() => {
                const catInfo = getCategoryInfo(activeArticle.category);
                const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
                return (
                  <>
                    <div style={{background:catInfo.gradient,borderRadius:20,padding:`${sp[6]}px ${sp[5]}px`,marginBottom:sp[5]}}>
                      <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                        <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.22)",borderRadius:99,padding:"5px 12px"}}>
                          <CatIcon size={13} color="#fff" strokeWidth={2.2}/>
                          <span style={{fontSize:11,fontWeight:600,color:"#fff"}}>{catInfo.name}</span>
                        </div>
                      </div>
                      <h2 style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.3}}>{activeArticle.title}</h2>
                    </div>
                    <div style={{fontSize:15,color:$.L2,lineHeight:1.9}}>
                      {activeArticle.content.split("\n\n").filter(p=>p.trim()).map((paragraph,i) => {
                        const trimmed = paragraph.trim();
                        if (trimmed.startsWith("═══")) {
                          const headerText = trimmed.replace(/═/g,"").trim();
                          return <h3 key={i} style={{fontSize:18,fontWeight:800,color:$.L1,marginTop:sp[6],marginBottom:sp[3]}}>{headerText}</h3>;
                        }
                        return <p key={i} style={{marginBottom:sp[3]}}>{trimmed}</p>;
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </Sheet>
      </div>
    </div>
  );
}

const NAV = [
  {id:"home",label:"الرئيسية",Icon:Home},
  {id:"analysis",label:"التحليل",Icon:BarChart2},
  {id:"saved",label:"تحليلاتي",Icon:Archive},
  {id:"sectors",label:"القطاعات",Icon:Grid},
  {id:"learning",label:"التعلم",Icon:BookOpen}
];

function BottomNav({tab,setTab}) {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:999,display:"flex",justifyContent:"space-around",background:"rgba(246,246,248,0.88)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",borderTop:`0.5px solid rgba(60,60,67,0.18)`,padding:`${sp[3]}px ${sp[2]}px ${sp[7]}px`}}>
      {NAV.map(({id,label,Icon})=>{const on=tab===id;return(<button key={id} onClick={()=>setTab(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:sp[1],background:"none",border:"none",cursor:"pointer",padding:`${sp[1]}px ${sp[3]}px`,borderRadius:14}}><div style={{padding:`${sp[1]+2}px ${sp[2]+2}px`,borderRadius:12,background:on?`${$.blue}18`:"transparent"}}><Icon size={20} color={on?$.blue:$.L4} strokeWidth={on?2.1:1.6}/></div><span style={{fontSize:9,fontWeight:on?700:500,color:on?$.blue:$.L4}}>{label}</span></button>);})}
    </nav>
  );
}

function SideNav({tab,setTab}) {
  return (
    <nav style={{position:"fixed",top:0,right:0,bottom:0,width:240,zIndex:999,display:"flex",flexDirection:"column",background:$.surface,borderLeft:`0.5px solid ${$.sepL}`,padding:`${sp[6]}px ${sp[4]}px`}}>
      <div style={{padding:`${sp[2]}px ${sp[3]}px`,marginBottom:sp[6]}}>
        <h2 style={{fontSize:24,fontWeight:800,color:$.blue}}>هامور</h2>
        <p style={{fontSize:11,color:$.L4,marginTop:2}}>دراسة جدوى ذكية</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:sp[1]}}>
        {NAV.map(({id,label,Icon})=>{
          const on=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:sp[3],background:on?`${$.blue}12`:"transparent",border:"none",cursor:"pointer",padding:`${sp[3]}px ${sp[4]}px`,borderRadius:12,fontFamily:"inherit"}}>
              <Icon size={20} color={on?$.blue:$.L3} strokeWidth={on?2.1:1.8}/>
              <span style={{fontSize:14,fontWeight:on?700:500,color:on?$.blue:$.L2}}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function HamourApp() {
  const screen = useScreenSize();
  const [tab,setTab]=useState("home");
  const [result,setResult]=useState(null);
  
  const handleAnalyze=useCallback((data)=>{setResult(data);setTab("analysis");},[]);
  const handleViewSaved=useCallback((analysis)=>{setResult(analysis);setTab("analysis");},[]);

  const useSideNav = screen.isDesktop;

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
      <div style={{minHeight:"100vh",background:$.bg,position:"relative",paddingBottom:useSideNav?0:90,marginRight:useSideNav?240:0}}>
        {tab==="home" && <HomeScreen onAnalyze={handleAnalyze} lastResult={result} onViewLast={handleViewSaved} onViewSaved={()=>setTab("saved")} onGoSectors={()=>setTab("sectors")} onGoLearning={()=>setTab("learning")}/>}
        {tab==="analysis" && <AnalysisScreen result={result}/>}
        {tab==="saved" && <SavedAnalysesScreen onViewAnalysis={handleViewSaved}/>}
        {tab==="sectors" && <SectorsScreen/>}
        {tab==="learning" && <LearningScreen/>}
        {useSideNav ? <SideNav tab={tab} setTab={setTab}/> : <BottomNav tab={tab} setTab={setTab}/>}
      </div>
    </>
  );
}
