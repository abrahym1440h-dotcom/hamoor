"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ARTICLES, ARTICLE_CATEGORIES } from "./articles";
import {
  Home, BarChart2, Grid, BookOpen, ChevronDown, TrendingUp, Users, DollarSign,
  AlertTriangle, MapPin, Coffee, ShoppingBag, Building2, Utensils, Wifi, Car,
  Search, CheckCircle, XCircle, Clock, Lightbulb, Zap, Shield, Sparkles, X,
  Target, Award, TrendingDown, Calendar, PieChart, Activity, Briefcase, Star,
  Scissors, GraduationCap, Dumbbell, Smartphone, Cake, Pizza, Shirt, Sparkle,
  ChevronRight, Share2, Trash2, Archive, FileText, Eye, ArrowRight, Flame, Layers, Info
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

function MoneyRow({label, value, valueColor=$.L1, bold=false, big=false, note=null}) {
  return <div style={{padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:$.L2}}>{label}</span>
      <span style={{fontSize:big?17:(bold?15:14),fontWeight:bold?800:600,color:valueColor,display:"inline-flex",alignItems:"center",gap:5,direction:"ltr"}}>
        <span>{fmt(value)}</span>
        <span style={{fontFamily:"'Noto Sans Arabic',sans-serif",fontWeight:700}}>﷼</span>
      </span>
    </div>
    {note && <div style={{fontSize:11,color:$.L4,marginTop:3,lineHeight:1.4}}>{note}</div>}
  </div>;
}

function Row({label, value, valueColor=$.L1, bold=false, note=null}) {
  return <div style={{padding:`${sp[2]}px 0`,borderBottom:`0.5px solid ${$.sepL}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{fontSize:13,color:$.L2}}>{label}</span>
      <span style={{fontSize:bold?15:14,fontWeight:bold?800:600,color:valueColor,textAlign:"left"}}>{value}</span>
    </div>
    {note && <div style={{fontSize:11,color:$.L4,marginTop:3,lineHeight:1.4}}>{note}</div>}
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

const CITIES = [
  "الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","الخبر","الطائف",
  "تبوك","أبها","الباحة","القصيم","حائل","نجران","جازان","ينبع","الجوف","عرعر"
];

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
          <div style={{fontSize:12,color:$.L3,marginTop:2}}>تحليل عميق ومفصّل بالذكاء الاصطناعي</div>
        </div>
      </div>
      <FormField label="فكرة المشروع" icon={<Lightbulb size={14} color={$.L4}/>}>
        <input value={idea} onChange={e=>setIdea(e.target.value)} placeholder="مثال: كوفي مختص" style={iStyle}/>
      </FormField>
      <FormField label="تفاصيل المشروع (اختياري)" icon={<Sparkles size={14} color={$.L4}/>}>
        <textarea value={details} onChange={e=>setDetails(e.target.value)} placeholder="مثال: كوفي بأجواء يابانية، يقدم قهوة مختصة وحلويات أسيوية" rows={3} style={{...iStyle,resize:"none",lineHeight:1.5}}/>
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
      <FormField label="الميزانية بالريال السعودي" icon={<Briefcase size={14} color={$.L4}/>}>
        <div style={{position:"relative"}}>
          <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle,paddingLeft:sp[10],fontSize:17,fontWeight:600,direction:"ltr",textAlign:"right"}}/>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:18,fontWeight:700,color:$.L3}}>﷼</div>
        </div>
      </FormField>
      {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
      <button onClick={go} disabled={!canGo} style={{marginTop:sp[5],width:"100%",background:canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3,color:canGo?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px`,fontSize:16,fontWeight:700,cursor:canGo?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:canGo?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
        {busy?<><Spinner sz={17}/>جاري التحليل العميق…</>:<><Zap size={16} strokeWidth={2.2}/>حلّل المشروع</>}
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
            <p style={{fontSize:screen.isDesktop?17:14,color:"rgba(255,255,255,0.75)",lineHeight:1.6,maxWidth:screen.isDesktop?480:280,marginBottom:sp[5]}}>دراسة جدوى ذكية ومفصّلة للسوق السعودي مدعومة بالذكاء الاصطناعي</p>
            <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <BarChart2 size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{totalAnalyses} تحليل</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <Layers size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>12 قطاع</span>
              </div>
              <div style={{background:"rgba(255,255,255,0.15)",borderRadius:99,padding:`${sp[2]}px ${sp[3]}px`,display:"flex",alignItems:"center",gap:5}}>
                <MapPin size={12} color="#fff"/><span style={{fontSize:11,fontWeight:700,color:"#fff"}}>{CITIES.length} مدينة</span>
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
                <p style={{fontSize:screen.isDesktop?14:12,color:$.L3,lineHeight:1.5}}>تحليل مفصّل بالذكاء الاصطناعي في 30 ثانية</p>
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

const TABS=["نظرة عامة","تحليل السوق","التحليل المالي","المخاطر والتحديات"];

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
  const loc = result.locations || {};
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:720, margin:"0 auto"} : {};

  return (
    <div>
      <div style={{background:hGrad,position:"relative",overflow:"hidden",padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{...containerStyle,position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",gap:sp[4]}}>
          <div style={{flex:1}}>
            <Chip text="نتيجة التحليل" color="rgba(255,255,255,0.88)" bg="rgba(255,255,255,0.20)"/>
            <div style={{fontSize:screen.isDesktop?34:26,fontWeight:800,color:"#fff",letterSpacing:"-0.6px",margin:`${sp[3]}px 0 ${sp[2]}px`}}>{result.decision}</div>
            <p style={{fontSize:screen.isDesktop?15:13,color:"rgba(255,255,255,0.88)",lineHeight:1.7,maxWidth:screen.isDesktop?500:280}}>{result.summary}</p>
          </div>
          <ScoreRing value={result.score} size={screen.isDesktop?140:104} track={screen.isDesktop?11:9} color="rgba(255,255,255,0.95)"/>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[5]}px ${sp[10]}px ${sp[16]}px`:`${sp[4]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <div style={containerStyle}>
          <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr 1fr":"1fr 1fr 1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
            {[{Icon:TrendingUp,label:"طلب السوق",val:result.market_demand,color:$.blue},{Icon:Users,label:"المنافسة",val:result.competition,color:$.orange},{Icon:Briefcase,label:"التكلفة",val:result.cost_level,color:$.purple},{Icon:Shield,label:"المخاطر",val:result.risk_level,color:$.red}].map(({Icon,label,val,color})=>(
              <Card key={label} style={{padding:`${sp[4]}px`}}>
                <IconBadge Icon={Icon} color={color} size={34}/>
                <div style={{fontSize:11,color:$.L3,marginTop:sp[2],marginBottom:3}}>{label}</div>
                <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{val}</div>
              </Card>
            ))}
          </div>

          <div style={{background:$.F3,borderRadius:12,padding:3,display:"flex",gap:2,marginBottom:sp[4],overflowX:"auto"}}>
            {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{flex:"none",minWidth:screen.isMobile?"23%":"auto",padding:`${sp[2]}px ${sp[3]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===i?$.surface:"transparent",color:tab===i?$.blue:$.L3,fontSize:12,fontWeight:tab===i?700:500,boxShadow:tab===i?SH.card:"none",whiteSpace:"nowrap"}}>{t}</button>))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[4]}}>
            {tab===0 && (<>
              {sw.strengths?.length>0 && <Section title="نقاط القوة" Icon={CheckCircle} color={$.green} subtitle={`${sw.strengths.length} نقاط قوة تدعم المشروع`}>
                {sw.strengths.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.green}06`,borderRadius:10,borderRight:`3px solid ${$.green}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.weaknesses?.length>0 && <Section title="نقاط الضعف" Icon={TrendingDown} color={$.orange} subtitle="نقاط تحتاج معالجة">
                {sw.weaknesses.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.orange}06`,borderRadius:10,borderRight:`3px solid ${$.orange}`}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.orange,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>!</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.opportunities?.length>0 && <Section title="الفرص المتاحة" Icon={Target} color={$.blue} subtitle="فرص يمكن استغلالها">
                {sw.opportunities.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.blue}06`,borderRadius:10,borderRight:`3px solid ${$.blue}`}}>
                    <Sparkles size={16} color={$.blue} style={{marginTop:2,flexShrink:0}}/>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              {sw.threats?.length>0 && <Section title="التهديدات" Icon={AlertTriangle} color={$.red} subtitle="مخاطر خارجية محتملة">
                {sw.threats.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.red}06`,borderRadius:10,borderRight:`3px solid ${$.red}`}}>
                    <AlertTriangle size={16} color={$.red} style={{marginTop:2,flexShrink:0}}/>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{s}</span>
                  </div>
                ))}
              </Section>}
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                {result.recommendations?.length>0 && <Section title="التوصيات الاستراتيجية" Icon={Lightbulb} color={$.purple} subtitle="خطوات عملية للنجاح">
                  {result.recommendations.map((s,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],background:`${$.purple}06`,padding:`${sp[4]}px`,borderRadius:12}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:$.purple,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
                      <span style={{fontSize:14,color:$.L2,lineHeight:1.7,flex:1}}>{s}</span>
                    </div>
                  ))}
                </Section>}
                {result.kpis?.length>0 && <Section title="مؤشرات الأداء الرئيسية" Icon={Activity} color={$.teal} subtitle="KPIs لمتابعة نجاح المشروع">
                  {result.kpis.map((k,i)=>(
                    <div key={i} style={{padding:`${sp[3]}px 0`,borderBottom:i<result.kpis.length-1?`0.5px solid ${$.sepL}`:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:k.description?6:0}}>
                        <span style={{fontSize:14,fontWeight:600,color:$.L1}}>{k.name}</span>
                        <span style={{fontSize:15,fontWeight:800,color:$.teal}}>{k.target}</span>
                      </div>
                      {k.description && <p style={{fontSize:12,color:$.L3,lineHeight:1.6}}>{k.description}</p>}
                    </div>
                  ))}
                </Section>}
              </div>
            </>)}

            {tab===1 && (<>
              <Section title="حجم السوق والجمهور" Icon={Users} color={$.blue}>
                <Row label="حجم السوق الإجمالي" value={m.market_size||"-"} note="القيمة السوقية الكاملة للقطاع"/>
                <Row label="الفئة المستهدفة" value={m.target_audience||"-"}/>
                <Row label="أنماط الشراء" value={m.buying_patterns||"-"}/>
                <Row label="الموسمية" value={m.seasonality||"-"} note="فترات الذروة والتراجع"/>
                <Row label="الحصة المتوقعة" value={m.expected_market_share||"-"} valueColor={$.blue} bold note="نسبة استحواذك من السوق"/>
                <Row label="إمكانيات النمو" value={m.growth_potential||"-"}/>
              </Section>
              {m.competitors?.length>0 && <Section title="المنافسون الرئيسيون" Icon={Briefcase} color={$.orange} subtitle={`${m.competitors.length} منافسين في السوق`}>
                {m.competitors.map((c,i)=>(
                  <div key={i} style={{padding:`${sp[4]}px`,borderBottom:i<m.competitors.length-1?`0.5px solid ${$.sepL}`:"none",background:`${$.orange}04`,borderRadius:10,marginBottom:sp[2]}}>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}>
                      <Star size={15} color={$.orange} fill={$.orange}/>
                      <span style={{fontSize:15,fontWeight:700,color:$.L1}}>{c.name}</span>
                    </div>
                    <p style={{fontSize:13,color:$.L2,lineHeight:1.7,paddingRight:sp[5]}}>{c.strength}</p>
                    {c.weakness && <div style={{marginTop:sp[2],padding:`${sp[2]}px ${sp[3]}px`,background:`${$.green}08`,borderRadius:8,borderRight:`2px solid ${$.green}`}}>
                      <div style={{fontSize:11,fontWeight:700,color:$.green,marginBottom:2}}>الفرصة</div>
                      <p style={{fontSize:12,color:$.L2,lineHeight:1.5}}>{c.weakness}</p>
                    </div>}
                  </div>
                ))}
              </Section>}
              {(loc.best || loc.worst) && <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المواقع" Icon={MapPin} color={$.green} subtitle="الموقع الأفضل والأسوأ للمشروع">
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop||screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {[{type:"الموقع الأفضل",color:$.green,d:loc.best,icon:CheckCircle},{type:"الموقع الأسوأ",color:$.red,d:loc.worst,icon:XCircle}].map(({type,color,d,icon:Icon})=>d && (
                      <div key={type} style={{background:`${color}06`,border:`1.5px solid ${color}25`,borderRadius:14,padding:`${sp[4]}px`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:sp[3]}}>
                          <div>
                            <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                              <Icon size={16} color={color}/>
                              <Chip text={type} color={color} bg={`${color}16`}/>
                            </div>
                            <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{d.name}</div>
                          </div>
                          <div style={{fontSize:28,fontWeight:800,color}}>{d.score}<span style={{fontSize:14,color:$.L4}}>%</span></div>
                        </div>
                        <Bar pct={d.score||0} color={color}/>
                        {d.reason && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginTop:sp[3]}}>{d.reason}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>}
            </>)}

            {tab===2 && (<>
              <Section title="تكلفة التأسيس" Icon={Briefcase} color={$.purple} subtitle="استثمار لمرة واحدة - التكاليف الأولية">
                <MoneyRow label="ضمان الإيجار" value={sc.rent_deposit} note="عادة 3-6 أشهر إيجار"/>
                <MoneyRow label="التجهيز والديكور" value={sc.renovation}/>
                <MoneyRow label="المعدات والأثاث" value={sc.equipment}/>
                <MoneyRow label="التراخيص والتسجيل" value={sc.licenses} note="السجل التجاري + الرخص البلدية"/>
                <MoneyRow label="المخزون الأولي" value={sc.initial_inventory}/>
                <MoneyRow label="تسويق الإطلاق" value={sc.marketing_launch}/>
                <MoneyRow label="رأس مال تشغيلي" value={sc.working_capital} note="لتغطية أول 3-6 أشهر"/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.purple}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:15,fontWeight:700,color:$.L1}}>إجمالي تكلفة التأسيس</span>
                  <span style={{fontSize:22,fontWeight:800,color:$.purple,display:"inline-flex",alignItems:"center",gap:6,direction:"ltr"}}>
                    <span>{fmt(sc.total)}</span><span style={{fontWeight:700}}>﷼</span>
                  </span>
                </div>
              </Section>
              <Section title="التكاليف الشهرية" Icon={Calendar} color={$.orange} subtitle="المصاريف الشهرية المتكررة">
                <MoneyRow label="الإيجار الشهري" value={mc.rent}/>
                <MoneyRow label="الرواتب والأجور" value={mc.salaries} note="رواتب الموظفين والتأمينات"/>
                <MoneyRow label="فواتير الخدمات" value={mc.utilities} note="كهرباء، ماء، إنترنت"/>
                <MoneyRow label="المواد الخام" value={mc.materials}/>
                <MoneyRow label="التسويق" value={mc.marketing}/>
                <MoneyRow label="الصيانة" value={mc.maintenance}/>
                <MoneyRow label="مصاريف أخرى" value={mc.other}/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.orange}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي الشهري</span>
                  <span style={{fontSize:22,fontWeight:800,color:$.orange,display:"inline-flex",alignItems:"center",gap:6,direction:"ltr"}}>
                    <span>{fmt(mc.total)}</span><span style={{fontWeight:700}}>﷼</span>
                  </span>
                </div>
              </Section>
              <Section title="توقع الإيرادات" Icon={TrendingUp} color={$.green} subtitle="نمو متوقع على 3 سنوات">
                <MoneyRow label="الشهر الأول" value={rp.month_1} note="مرحلة الإطلاق"/>
                <MoneyRow label="الشهر الثالث" value={rp.month_3} note="استقرار العمليات"/>
                <MoneyRow label="الشهر السادس" value={rp.month_6}/>
                <MoneyRow label="الشهر الـ12" value={rp.month_12} valueColor={$.green} bold note="نهاية السنة الأولى"/>
                <MoneyRow label="السنة الثانية (شهرياً)" value={rp.year_2_monthly}/>
                <MoneyRow label="السنة الثالثة (شهرياً)" value={rp.year_3_monthly} valueColor={$.green} bold note="مرحلة النضج"/>
              </Section>
              <Section title="مؤشرات الربحية" Icon={PieChart} color={$.blue} subtitle="مقاييس النجاح المالي">
                <Row label="نقطة التعادل" value={(f.break_even_months||"-")+" شهر"} valueColor={$.blue} bold note="الشهر الذي تغطي فيه التكاليف"/>
                <Row label="العائد على الاستثمار (ROI)" value={(f.roi_percentage||"-")+"%"} valueColor={$.green} bold note="نسبة الربح من رأس المال"/>
                <MoneyRow label="صافي الربح السنوي - السنة 1" value={f.annual_profit_year1}/>
                <MoneyRow label="صافي الربح السنوي - السنة 3" value={f.annual_profit_year3} valueColor={$.green} bold/>
              </Section>
            </>)}

            {tab===3 && (
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المخاطر التفصيلي" Icon={AlertTriangle} color={$.red} subtitle={`${(result.risk_analysis||[]).length} مخاطر مصنّفة مع خطط التخفيف`}>
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {(result.risk_analysis||[]).map((r,i)=>{
                      const probColor = r.probability==="عالي"?$.red:r.probability==="متوسط"?$.orange:$.green;
                      const impColor = r.impact==="شديد"?$.red:r.impact==="متوسط"?$.orange:$.green;
                      return (
                        <div key={i} style={{background:$.F5,borderRadius:14,padding:`${sp[4]}px`}}>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{i+1}</div>
                            <span style={{fontSize:15,fontWeight:700,color:$.L1,flex:1,lineHeight:1.4}}>{r.risk}</span>
                          </div>
                          {r.description && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginBottom:sp[3],paddingRight:sp[5]}}>{r.description}</p>}
                          <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],flexWrap:"wrap"}}>
                            <Chip text={"احتمالية: "+r.probability} color={probColor} bg={`${probColor}15`} size={12}/>
                            <Chip text={"التأثير: "+r.impact} color={impColor} bg={`${impColor}15`} size={12}/>
                          </div>
                          <div style={{background:`${$.green}07`,borderRight:`3px solid ${$.green}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8}}>
                            <div style={{fontSize:12,fontWeight:700,color:$.green,marginBottom:6,display:"flex",alignItems:"center",gap:5}}>
                              <Shield size={13}/>
                              <span>خطة التخفيف</span>
                            </div>
                            <p style={{fontSize:13,color:$.L2,lineHeight:1.7}}>{r.mitigation}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>
            )}
          </div>

          {(result.alternatives?.length > 0 || result.alternative_idea || result.alternative_city) && <div style={{marginTop:sp[5]}}>
            <Section title="بدائل مقترحة" Icon={Lightbulb} color={$.purple} subtitle={`${result.alternatives?.length || 1} خيارات بديلة قد تكون أفضل`}>
              {result.alternatives?.length > 0 && (
                <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3],marginBottom:sp[4]}}>
                  {result.alternatives.map((alt, i) => {
                    const scoreColor = alt.score>=70?$.green : alt.score>=50?$.orange : $.red;
                    return (
                      <div key={i} style={{background:`${$.purple}06`,borderRadius:14,padding:`${sp[4]}px`,border:`1.5px solid ${$.purple}25`}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:sp[3]}}>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                            <div style={{width:28,height:28,borderRadius:"50%",background:$.purple,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700}}>{i+1}</div>
                            <div style={{fontSize:11,fontWeight:700,color:$.purple}}>بديل {i+1}</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2]}}>
                            <div style={{fontSize:11,color:$.L3}}>السكور</div>
                            <div style={{fontSize:18,fontWeight:800,color:scoreColor}}>{alt.score}</div>
                          </div>
                        </div>
                        <div style={{fontSize:15,fontWeight:700,color:$.L1,lineHeight:1.5,marginBottom:sp[2]}}>{alt.idea}</div>
                        {alt.reason && <p style={{fontSize:13,color:$.L2,lineHeight:1.7,marginBottom:sp[3]}}>{alt.reason}</p>}
                        {alt.budget_needed && (
                          <div style={{display:"flex",alignItems:"center",gap:sp[2],paddingTop:sp[3],borderTop:`0.5px solid ${$.sepL}`}}>
                            <Briefcase size={14} color={$.purple}/>
                            <span style={{fontSize:12,color:$.L3,fontWeight:600}}>الميزانية المطلوبة:</span>
                            <span style={{fontSize:13,fontWeight:700,color:$.L1}}>{alt.budget_needed}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {result.alternative_city && <div style={{background:`${$.blue}06`,borderRadius:14,padding:`${sp[4]}px`,border:`1.5px solid ${$.blue}20`}}>
                <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}>
                  <MapPin size={16} color={$.blue}/>
                  <div style={{fontSize:12,fontWeight:700,color:$.blue}}>مدينة بديلة مقترحة</div>
                </div>
                <div style={{fontSize:15,fontWeight:700,color:$.L1,lineHeight:1.6}}>{result.alternative_city}</div>
              </div>}
            </Section>
          </div>}

                 
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

  function handleClearAll() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      setAnalyses([]);
    }
  }

  const positiveCount = analyses.filter(a => a.decision_type === "positive").length;
  const negativeCount = analyses.filter(a => a.decision_type === "negative").length;
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
        <h1 style={{fontSize:30,fontWeight:800,color:$.L1,marginBottom:4}}>تحليلاتي</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>{analyses.length} تحليلات محفوظة</p>
        
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:sp[3],marginBottom:sp[5]}}>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={Archive} color={$.blue} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.L1,marginTop:sp[2]}}>{analyses.length}</div>
            <div style={{fontSize:11,color:$.L3}}>المجموع</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={CheckCircle} color={$.green} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.green,marginTop:sp[2]}}>{positiveCount}</div>
            <div style={{fontSize:11,color:$.L3}}>إيجابي</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={XCircle} color={$.red} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.red,marginTop:sp[2]}}>{negativeCount}</div>
            <div style={{fontSize:11,color:$.L3}}>سلبي</div>
          </Card>
        </div>

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
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                    <Chip text={a.decision} color={color} bg={`${color}15`} size={11}/>
                    <div style={{display:"flex",alignItems:"center",gap:3,color:$.L4,fontSize:11}}><Clock size={10}/><span>{formatDate(a.savedAt)}</span></div>
                  </div>
                </div>
                <div style={{display:"flex",borderTop:`0.5px solid ${$.sepL}`}}>
                  <button onClick={()=>onViewAnalysis(a)} style={{flex:1,padding:sp[3],background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <Eye size={14}/><span>عرض التحليل</span>
                  </button>
                  <button onClick={()=>setConfirmDelete(a.id)} style={{flex:"none",padding:`${sp[3]}px ${sp[5]}px`,background:"transparent",border:"none",cursor:"pointer",color:$.red}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <button onClick={handleClearAll} style={{marginTop:sp[6],width:"100%",background:"transparent",color:$.L4,border:`1.5px dashed ${$.L4}`,borderRadius:12,padding:sp[3],fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>حذف كل التحليلات</button>

        <Sheet open={!!confirmDelete} onClose={()=>setConfirmDelete(null)}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
              <AlertTriangle size={30} color={$.red}/>
            </div>
            <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>حذف التحليل؟</h3>
            <p style={{fontSize:14,color:$.L3,marginBottom:sp[6]}}>سيتم حذف هذا التحليل نهائياً ولا يمكن استرجاعه</p>
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

const CATEGORIES = [
  {id:"all", name:"الكل", color:$.blue},
  {id:"food", name:"أطعمة", color:$.orange},
  {id:"retail", name:"تجزئة", color:$.purple},
  {id:"services", name:"خدمات", color:$.teal},
  {id:"professional", name:"احترافية", color:$.indigo}
];

const SECTORS_DATA = [
  {
    id:1, category:"food", name:"مقاهي ومشروبات", Icon:Coffee, color:$.orange,
    score:68, growth:"+12%", failure_rate:"60%", investment:"150,000 - 400,000", investment_avg:250000,
    payback:"18-24 شهر", margin:"15-25%", competition:"عالية جداً",
    audience:"شباب 18-35، طلاب جامعات، عمال شركات، عائلات في عطلات نهاية الأسبوع",
    top_cities:["الرياض","جدة","الخبر","الدمام","المدينة المنورة"],
    success_tips:["موقع استراتيجي قرب الجامعات أو المكاتب أو الأحياء السكنية الحديثة","تميّز في القهوة - استورد حبوب مختصة وقدّم تجربة فريدة","تصميم داخلي جذاب للسوشيال ميديا وتجربة تصوير ممتازة","خدمة توصيل سريعة عبر التطبيقات (هنقرستيشن، جاهز، توصيل)","برامج ولاء وعروض ذكية للزبائن المنتظمين","تركيز على جودة الباريستا وتدريبه باستمرار"],
    failure_reasons:["إشباع السوق - منافسة شرسة من ستاربكس ودنكن والمحلات المحلية","موقع ضعيف أو في حي ميت بدون حركة كافية","ضعف التمييز - كل المقاهي صارت متشابهة","تكاليف عالية للإيجار والديكور أكلت رأس المال قبل البدء","عدم الاستمرارية في الجودة بسبب دوران الباريستا"],
    competitors:["ستاربكس","% عربيكا","دنكن","كوفي بين","مذاق","بريد","حلواني"],
    sub_ideas:["كوفي متخصص في القهوة الكورية","عربة قهوة متنقلة","كوفي بطابع تراثي سعودي"],
    city_notes:{"الباحة":"السياحة الجبلية والمصيف فرصة ممتازة - تشهد المنطقة إقبال سياحي عالي صيفاً","الرياض":"منافسة عالية جداً، تحتاج تميّز قوي وموقع استثنائي","جدة":"سوق متشبّع لكن السياح والكورنيش يفتحون فرصاً موسمية","تبوك":"نمو سياحي مع نيوم - فرصة ذهبية للمستقبل القريب","أبها":"المصيف السياحي + الطلاب يخلون السوق نشط","جازان":"إقبال جيد لكن المنافسة محدودة - فرصة"},
    last_updated:"يناير 2026"
  },
  {
    id:2, category:"food", name:"مطاعم وأكل", Icon:Utensils, color:$.red,
    score:65, growth:"+8%", failure_rate:"70%", investment:"200,000 - 800,000", investment_avg:400000,
    payback:"24-36 شهر", margin:"10-18%", competition:"عالية",
    audience:"عائلات، عمال، موظفون، شباب في الخروجات الأسبوعية",
    top_cities:["الرياض","جدة","الدمام","الخبر","مكة المكرمة"],
    success_tips:["تخصص واضح - مطعم لمأكولات محددة أفضل من قائمة طويلة","اتساق في الجودة - الزبون يجي عشان طعم معين","خدمة توصيل قوية عبر كل المنصات","تسعير منافس وعروض موسمية","موقع في مجمعات تجارية أو شوارع رئيسية مزدحمة","نظافة المطبخ والخدمة - أهم من أي شي ثاني"],
    failure_reasons:["قائمة طعام كبيرة جداً تسبب هدر في المواد","ضعف الإدارة المالية والمخزون","منافسة شرسة من السلاسل الكبيرة (البيك، كودو، هرفي)","موسمية صعبة في رمضان والإجازات","صعوبة إيجاد طباخين ماهرين والاحتفاظ بهم"],
    competitors:["البيك","كودو","هرفي","ماكدونالدز","ماجستيك","الطازج","البرج"],
    sub_ideas:["مطعم متخصص في الكبسة","مطعم آسيوي شعبي","فطور صباحي راقي"],
    city_notes:{"الباحة":"المطاعم العائلية والشعبية الأنجح - الزبائن يحبون الأكل التراثي","مكة المكرمة":"موسم الحج والعمرة يضاعف الطلب - استعد للذروة","المدينة المنورة":"السياحة الدينية تخلق طلب مستمر للأكل العائلي","الطائف":"المصيف يفتح فرصة موسمية ممتازة"},
    last_updated:"يناير 2026"
  },
  {
    id:3, category:"food", name:"حلويات ومخبوزات", Icon:Cake, color:$.pink,
    score:72, growth:"+18%", failure_rate:"45%", investment:"120,000 - 500,000", investment_avg:200000,
    payback:"12-18 شهر", margin:"25-40%", competition:"متوسطة",
    audience:"نساء، عائلات، مناسبات (أعراس، تخرج، مواليد)، مكاتب",
    top_cities:["الرياض","جدة","الدمام","القصيم","المدينة المنورة"],
    success_tips:["تصوير احترافي للمنتجات للسوشيال ميديا","تغليف فاخر يصلح للهدايا والمناسبات","توصيل سريع مع المحافظة على جودة المنتج","تخصص في نوع معين (كنافة، بقلاوة، كيكات مناسبات، إلخ)","ابتكار طعمات جديدة باستمرار","حسابات قوية في إنستقرام وتيك توك"],
    failure_reasons:["تقليد المنافسين بدل الابتكار","ضعف التغليف يضر التجربة","عدم اتساق الجودة بين الوجبات","تسعير غير صحيح","إهمال الموسمية (رمضان، أعياد، فصل الشتاء)"],
    competitors:["صابا","عبدالصمد القرشي","ميلانو","لافيت","الإمبراطور","تشيز كيك فاكتوري"],
    sub_ideas:["حلويات صحية بدون سكر","تخصص في الكنافة الفاخرة","كيكات تخرج وأعراس"],
    city_notes:{"القصيم":"معروفة بالحلويات التقليدية - فرصة للابتكار العصري","الباحة":"السوق المحلي صغير لكن أقل منافسة - فرصة جيدة"},
    last_updated:"يناير 2026"
  },
  {
    id:4, category:"food", name:"وجبات سريعة", Icon:Pizza, color:$.yellow,
    score:64, growth:"+10%", failure_rate:"55%", investment:"100,000 - 350,000", investment_avg:180000,
    payback:"15-24 شهر", margin:"20-30%", competition:"عالية",
    audience:"شباب، طلاب، عمال، موظفون في استراحة الغداء",
    top_cities:["الرياض","جدة","الدمام","تبوك","الخبر"],
    success_tips:["سرعة التحضير - أقل من 5 دقائق","تسعير منافس - أقل من السلاسل العالمية","موقع قريب من الجامعات أو المناطق الصناعية","توصيل عبر كل تطبيقات التوصيل بفعالية","بساطة القائمة - تركيز على 3-5 منتجات أساسية","نظافة عالية ومستمرة"],
    failure_reasons:["منافسة شرسة من السلاسل العالمية","ضعف الجودة في المواد الخام","ارتفاع تكاليف اللحوم والدجاج","صعوبة المحافظة على نفس الجودة في الذروة","اعتماد كامل على التوصيل بدون حضور قوي في المحل"],
    competitors:["ماكدونالدز","برجر كنق","KFC","البيك","شوكسي","صب واي"],
    sub_ideas:["برجر سعودي بنكهات محلية","شاورما مختصة فاخرة","ساندوتشات صحية"],
    city_notes:{"تبوك":"نمو نيوم يجلب آلاف العمال - طلب عالي على الوجبات السريعة"},
    last_updated:"يناير 2026"
  },
  {
    id:5, category:"retail", name:"تجزئة عامة", Icon:ShoppingBag, color:$.purple,
    score:55, growth:"+5%", failure_rate:"55%", investment:"100,000 - 500,000", investment_avg:200000,
    payback:"24-36 شهر", margin:"15-30%", competition:"عالية جداً",
    audience:"عام - حسب نوع البضاعة (أطفال، نساء، رجال، عائلات)",
    top_cities:["الرياض","جدة","الدمام","مكة المكرمة","الخبر"],
    success_tips:["تخصص واضح - متجر بدل سوبر ماركت عام","موقع في مجمع تجاري أو شارع تجاري مزدحم","إدارة مخزون ذكية - تجنب البضاعة الراكدة","حضور أونلاين قوي (متجر إلكتروني + سوشيال)","خدمة عملاء مميزة وسياسة استرجاع واضحة","عروض موسمية ومناسبات"],
    failure_reasons:["منافسة قوية من التجارة الإلكترونية (نون، أمازون)","بضاعة راكدة تأكل رأس المال","موقع ضعيف بدون حركة","تسعير مرتفع مقارنة بالسلاسل الكبيرة","إهمال التسويق الرقمي"],
    competitors:["نون","أمازون","إكسترا","ساكو","جرير","سنتربوينت","المنيع"],
    sub_ideas:["متجر منتجات أطفال متخصص","متجر مستلزمات حيوانات","متجر هدايا فاخرة"],
    city_notes:{"الباحة":"السوق المحلي محدود - ركّز على ما يحتاجه السكان فعلاً"},
    last_updated:"يناير 2026"
  },
  {
    id:6, category:"retail", name:"أزياء وعبايات", Icon:Shirt, color:$.indigo,
    score:75, growth:"+15%", failure_rate:"40%", investment:"80,000 - 300,000", investment_avg:150000,
    payback:"12-18 شهر", margin:"25-40%", competition:"متوسطة",
    audience:"نساء 20-60 سنة، مناسبات (أعراس، تخرج، عيد، رمضان)",
    top_cities:["الرياض","جدة","الخبر","الدمام","المدينة المنورة"],
    success_tips:["تصاميم حصرية وفريدة - لا تقلد","خياطة عالية الجودة بأقمشة فاخرة","إنستقرام احترافي مع مودلز وتصوير ممتاز","خدمة VIP لكبار العملاء","موقع راقي في حي راقي أو مول","تنوع المقاسات والألوان"],
    failure_reasons:["تشابه التصاميم مع المنافسين","تسعير ضعيف لا يغطي التكاليف","موقع غير ملائم للجمهور المستهدف","ضعف التسويق الرقمي","عدم متابعة الموضة الحالية"],
    competitors:["مزون","نهى","أنوار","حلا الترك","نسك","عبايات الرياض"],
    sub_ideas:["عبايات شبابية عصرية","فساتين سهرة مستوردة","عبايات صلاة فاخرة"],
    city_notes:{"الباحة":"الأعراس الموسمية والسياحة تخلق طلب جيد","القصيم":"السوق المحافظ يفضّل العبايات التقليدية والمستورة"},
    last_updated:"يناير 2026"
  },
  {
    id:7, category:"retail", name:"إلكترونيات", Icon:Smartphone, color:$.teal,
    score:60, growth:"+7%", failure_rate:"50%", investment:"200,000 - 1,000,000", investment_avg:400000,
    payback:"30-48 شهر", margin:"8-18%", competition:"عالية جداً",
    audience:"شباب، موظفون، طلاب، عائلات",
    top_cities:["الرياض","جدة","الدمام","الخبر","تبوك"],
    success_tips:["أسعار منافسة (الهامش قليل، الكمية تفرق)","ضمان موثوق وخدمة ما بعد البيع","تشكيلة متنوعة من الماركات","صيانة في المحل لتمييز عن المنافسين","حسابات سوشيال قوية مع مراجعات للمنتجات","تعاون مع شركات الأقساط (تابي، تمارا، تسهيل)"],
    failure_reasons:["هامش ربح ضعيف يصعب الاستمرار","منافسة قاتلة من المتاجر الإلكترونية","تزييف المنتجات وفقدان الثقة","تخزين بضاعة قديمة تنخفض قيمتها","صعوبة الحصول على وكالات حصرية"],
    competitors:["إكسترا","جرير","نون","أمازون","السيف غاليري","لولو هايبر","ماكس"],
    sub_ideas:["إكسسوارات الجوالات","صيانة وإصلاح متخصصة","قطع غيار كمبيوترات"],
    city_notes:{"تبوك":"العمال الأجانب في نيوم يحتاجون إلكترونيات وإكسسوارات"},
    last_updated:"يناير 2026"
  },
  {
    id:8, category:"services", name:"صالونات وتجميل", Icon:Sparkle, color:$.pink,
    score:70, growth:"+14%", failure_rate:"50%", investment:"100,000 - 400,000", investment_avg:200000,
    payback:"18-24 شهر", margin:"25-40%", competition:"متوسطة",
    audience:"نساء 18-55 سنة، رجال 18-50 (للحلاقة)، مناسبات",
    top_cities:["الرياض","جدة","الخبر","الدمام","أبها"],
    success_tips:["مصففين موهوبين من بلاد متخصصة (لبنان، تركيا، البرازيل)","تجربة فاخرة - استقبال، تشكيلة قهوة، خصوصية","نظام حجز إلكتروني (واتساب، تطبيق)","تخصص في خدمات معينة (أعراس، علاج بشرة، شعر)","نظافة وتعقيم على أعلى مستوى","تنظيم الوقت - عدم تأخير الزبائن"],
    failure_reasons:["دوران الموظفين السريع","عدم النظافة والتعقيم الكافي","تسعير غير واضح يفاجئ الزبون","ضعف التسويق الرقمي","إهمال خدمة الزبون والمتابعة"],
    competitors:["روزا","إكسير","توني آند جاي","رويال","حلا للتجميل","ميرنا"],
    sub_ideas:["صالون رجالي راقي","صالون متخصص في الأعراس","عيادة جلدية تجميلية"],
    city_notes:{"الباحة":"السياحة الصيفية تفتح فرصة موسمية ممتازة","أبها":"الجو الجميل يجذب سياحة العرائس"},
    last_updated:"يناير 2026"
  },
  {
    id:9, category:"services", name:"خياطة وتفصيل", Icon:Scissors, color:$.purple,
    score:62, growth:"+6%", failure_rate:"30%", investment:"40,000 - 150,000", investment_avg:70000,
    payback:"12-18 شهر", margin:"30-50%", competition:"متوسطة",
    audience:"رجال (ثياب، بشوت)، نساء (فساتين، عبايات)، مناسبات",
    top_cities:["الرياض","القصيم","المدينة المنورة","جدة","الدمام"],
    success_tips:["خياطين ماهرين بخبرة طويلة","الالتزام بالمواعيد - السمعة كل شي","تخصص في نوع معين (رجالي، نسائي، عبايات)","أقمشة فاخرة ومستوردة","موقع قريب من الأحياء التي تخدمها","خدمة قياس بالمنزل للعملاء الكبار"],
    failure_reasons:["تأخر التسليم وفقدان ثقة الزبائن","ضعف جودة الخياطة","نقص في الخياطين المهرة","تسعير غير منافس","عدم مواكبة موضة الموسم"],
    competitors:["محلات خياطة محلية في كل حي","الطلال","الفيصلية","عابد"],
    sub_ideas:["خياطة فساتين سهرة","خياطة بشوت ملوكية","تفصيل عبايات تصاميم خاصة"],
    city_notes:{"القصيم":"السوق التقليدي يحب الخياطة الفاخرة - فرصة قوية","الباحة":"الأعراس الموسمية تفتح طلب كبير"},
    last_updated:"يناير 2026"
  },
  {
    id:10, category:"professional", name:"تعليم وتدريب", Icon:GraduationCap, color:$.blue,
    score:82, growth:"+22%", failure_rate:"35%", investment:"80,000 - 350,000", investment_avg:150000,
    payback:"12-20 شهر", margin:"35-55%", competition:"متوسطة",
    audience:"طلاب مدارس، طلاب جامعات، موظفون يبغون تطوير ذواتهم",
    top_cities:["الرياض","جدة","الدمام","الخبر","المدينة المنورة"],
    success_tips:["مدرّبين ذوي خبرة وشهادات","محتوى مميز وأسلوب تقديم جذاب","شهادات معتمدة من جهات معروفة","تسويق رقمي قوي عبر السوشيال","دورات مكثفة وقصيرة الأمد","أسعار تنافسية مع برامج أقساط"],
    failure_reasons:["ضعف جودة المدربين والمحتوى","تسعير مرتفع جداً","موقع غير ملائم أو وصول صعب","عدم وجود تخصص واضح","إهمال متابعة الطلاب بعد الدورة"],
    competitors:["دروب","رواق","عبر مدرسة","تمكين","مهارة"],
    sub_ideas:["تعليم البرمجة للأطفال","تطوير الذات والقيادة","دورات لغات متخصصة"],
    city_notes:{"الباحة":"الطلاب يحتاجون مراكز قوية - فرصة قليلة المنافسة"},
    last_updated:"يناير 2026"
  },
  {
    id:11, category:"professional", name:"لياقة ورياضة", Icon:Dumbbell, color:$.green,
    score:78, growth:"+20%", failure_rate:"40%", investment:"150,000 - 600,000", investment_avg:300000,
    payback:"18-30 شهر", margin:"30-45%", competition:"متوسطة",
    audience:"شباب وشابات 18-45، موظفون، رياضيون، مهتمون بالصحة",
    top_cities:["الرياض","جدة","الخبر","الدمام","تبوك"],
    success_tips:["أجهزة حديثة وعالية الجودة","مدربين معتمدين دولياً","تنوع البرامج (يوغا، كروسفت، حديد، كارديو)","نظافة وتعقيم مستمر","اشتراكات مرنة وعروض موسمية","تطبيق لحجز الجلسات والمتابعة"],
    failure_reasons:["أجهزة قديمة أو معطلة","اشتراكات مرتفعة جداً","صعوبة الاحتفاظ بالعملاء بعد أول شهر","موقع غير ملائم بدون مواقف","ضعف خدمة العملاء"],
    competitors:["فتنس تايم","بادي ماستر","بود فيتنس","نقاء","فيتنس فيرست"],
    sub_ideas:["نادي نسائي متخصص","مركز كروسفت متخصص","ستوديو يوغا وبيلاتس"],
    city_notes:{"تبوك":"نيوم تجلب آلاف الموظفين الشباب - طلب عالي"},
    last_updated:"يناير 2026"
  },
  {
    id:12, category:"professional", name:"خدمات تقنية", Icon:Wifi, color:$.indigo,
    score:85, growth:"+25%", failure_rate:"30%", investment:"50,000 - 300,000", investment_avg:100000,
    payback:"12-18 شهر", margin:"40-60%", competition:"منخفضة",
    audience:"شركات، رواد أعمال، متاجر، أفراد",
    top_cities:["الرياض","جدة","الدمام","الخبر","تبوك"],
    success_tips:["تخصص في خدمة محددة (تطبيقات، مواقع، تسويق رقمي)","محفظة أعمال قوية وشهادات عملاء","أسعار باقات واضحة ومحددة","دعم فني سريع ومستمر","حضور قوي على لينكدإن وموقع احترافي","شراكات مع شركات كبرى"],
    failure_reasons:["عدم وجود تخصص واضح","ضعف التسعير وعدم تقدير الجهد","صعوبة إيجاد عملاء مستمرين","ضعف خدمة الدعم بعد التسليم","تقادم التقنيات بسرعة"],
    competitors:["شركات تقنية محلية متنوعة","stc Pay","موضوع","حسوب"],
    sub_ideas:["تسويق رقمي للمحلات","تصميم تطبيقات للشركات","إدارة سوشيال ميديا"],
    city_notes:{"الرياض":"السوق الأكبر للخدمات التقنية في المملكة","تبوك":"نيوم تحتاج خدمات تقنية متخصصة - فرصة ذهبية"},
    last_updated:"يناير 2026"
  }
];

function SectorsScreen() {
  const screen = useScreenSize();
  const [q,setQ]=useState("");
  const [cat,setCat]=useState("all");
  const [cityFilter,setCityFilter]=useState("all");
  const [active,setActive]=useState(null);
  
  const list = SECTORS_DATA.filter(s => {
    if (cat !== "all" && s.category !== cat) return false;
    if (q && !s.name.includes(q)) return false;
    return true;
  });

  const sc = s => s.score>=75?$.green : s.score>=60?$.orange : $.red;
  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  const cityNote = active && cityFilter !== "all" ? active.city_notes?.[cityFilter] : null;

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>القطاعات</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>تحليلات مفصّلة للسوق السعودي · {SECTORS_DATA.length} قطاعات</p>

        <div style={{position:"relative",marginBottom:sp[4]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن قطاع…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],overflowX:"auto",paddingBottom:4}}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:cat===c.id?c.color:$.F4,color:cat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{c.name}</button>
          ))}
        </div>

        <div style={{marginBottom:sp[5],background:$.surface,borderRadius:12,padding:sp[3],boxShadow:SH.card}}>
          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[2]}}>
            <MapPin size={14} color={$.blue}/>
            <span style={{fontSize:12,fontWeight:700,color:$.L2}}>فلترة حسب المدينة (لرؤية ملاحظات مخصصة)</span>
          </div>
          <div style={{position:"relative"}}>
            <select value={cityFilter} onChange={e=>setCityFilter(e.target.value)} style={{...iStyle,paddingLeft:sp[8],cursor:"pointer",fontSize:13}}>
              <option value="all">كل المدن (عام)</option>
              {CITIES.map(c=><option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} color={$.L4} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {list.length === 0 && <div style={{gridColumn:"1/-1",padding:`${sp[8]}px`,textAlign:"center",color:$.L3,fontSize:14}}>لا توجد قطاعات مطابقة</div>}
          {list.map(s => {
            const hasNote = cityFilter !== "all" && s.city_notes?.[cityFilter];
            return (
              <Card key={s.id} onClick={()=>setActive(s)} style={{padding:sp[4],cursor:"pointer",border:hasNote?`1.5px solid ${$.blue}40`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:sp[4]}}>
                  <IconBadge Icon={s.Icon} color={s.color} size={48}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:sp[2]}}>
                      <span style={{fontSize:16,fontWeight:700,color:$.L1}}>{s.name}</span>
                      <span style={{fontSize:20,fontWeight:800,color:sc(s)}}>{s.score}<span style={{fontSize:12,fontWeight:600,color:$.L4}}>/100</span></span>
                    </div>
                    <Bar pct={s.score} color={sc(s)}/>
                    <div style={{display:"flex",gap:sp[2],marginTop:sp[3],flexWrap:"wrap"}}>
                      <Chip text={"نمو "+s.growth} color={$.green} bg={`${$.green}15`}/>
                      <Chip text={"فشل "+s.failure_rate} color={$.red} bg={`${$.red}15`}/>
                    </div>
                  </div>
                </div>
                {hasNote && (
                  <div style={{marginTop:sp[3],padding:`${sp[2]}px ${sp[3]}px`,background:`${$.blue}08`,borderRadius:10,borderRight:`3px solid ${$.blue}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:3}}>
                      <Info size={12} color={$.blue}/>
                      <span style={{fontSize:11,fontWeight:700,color:$.blue}}>ملاحظة لـ {cityFilter}</span>
                    </div>
                    <p style={{fontSize:12,color:$.L2,lineHeight:1.5}}>{s.city_notes[cityFilter]}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Sheet open={!!active} onClose={()=>setActive(null)}>
          {active && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[3]}}>
                <IconBadge Icon={active.Icon} color={active.color} size={52}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:22,fontWeight:800,color:$.L1}}>{active.name}</div>
                  <div style={{fontSize:11,color:$.L4,marginTop:2}}>آخر تحديث: {active.last_updated}</div>
                </div>
                <div style={{fontSize:32,fontWeight:800,color:active.color}}>{active.score}</div>
              </div>

              {cityNote && (
                <div style={{background:`${$.blue}08`,border:`1.5px solid ${$.blue}25`,borderRadius:14,padding:`${sp[4]}px`,marginBottom:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:sp[2]}}>
                    <Info size={15} color={$.blue}/>
                    <span style={{fontSize:13,fontWeight:700,color:$.blue}}>ملاحظة خاصة لـ {cityFilter}</span>
                  </div>
                  <p style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{cityNote}</p>
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><TrendingUp size={14} color={$.green}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>النمو السنوي</span></div>
                  <div style={{fontSize:18,fontWeight:800,color:$.green}}>{active.growth}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><AlertTriangle size={14} color={$.red}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>معدل الفشل</span></div>
                  <div style={{fontSize:18,fontWeight:800,color:$.red}}>{active.failure_rate}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Briefcase size={14} color={$.purple}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>متوسط الاستثمار</span></div>
                  <div style={{fontSize:12,fontWeight:700,color:$.L1,direction:"ltr",textAlign:"right"}}>{active.investment}</div>
                  <div style={{fontSize:10,color:$.L4,marginTop:2}}>﷼ سعودي</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Clock size={14} color={$.orange}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>فترة الاسترداد</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.payback}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><PieChart size={14} color={$.blue}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>هامش الربح</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.margin}</div>
                </Card>
                <Card style={{padding:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><Users size={14} color={$.teal}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>المنافسة</span></div>
                  <div style={{fontSize:14,fontWeight:700,color:$.L1}}>{active.competition}</div>
                </Card>
              </div>

              <Section title="الجمهور المستهدف" Icon={Users} color={$.blue}>
                <p style={{fontSize:14,color:$.L2,lineHeight:1.8}}>{active.audience}</p>
              </Section>

              <Section title="أفضل المدن" Icon={MapPin} color={$.green}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.top_cities.map((c,i)=>(<Chip key={c} text={`${i+1}. ${c}`} color={$.green} bg={`${$.green}15`} size={13}/>))}
                </div>
              </Section>

              <Section title="عوامل النجاح" Icon={CheckCircle} color={$.green} subtitle={`${active.success_tips.length} نصائح عملية للنجاح`}>
                {active.success_tips.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.green}06`,borderRadius:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{t}</span>
                  </div>
                ))}
              </Section>

              <Section title="أسباب الفشل الشائعة" Icon={XCircle} color={$.red} subtitle="تحذيرات مهمة قبل البدء">
                {active.failure_reasons.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],padding:`${sp[3]}px`,background:`${$.red}06`,borderRadius:10}}>
                    <div style={{width:24,height:24,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>×</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{t}</span>
                  </div>
                ))}
              </Section>

              <Section title="المنافسون المعروفون" Icon={Briefcase} color={$.orange}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.competitors.map(c=>(<Chip key={c} text={c} color={$.orange} bg={`${$.orange}15`} size={12}/>))}
                </div>
              </Section>

              <Section title="أفكار فرعية مقترحة" Icon={Lightbulb} color={$.purple} subtitle="فرص داخل القطاع">
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
    if (q && !a.title.includes(q) && !a.excerpt.includes(q)) return false;
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

  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  return (
    <div style={{padding:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>مكتبة التعلم</h1>
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
                        <Chip text={activeArticle.level} color="rgba(255,255,255,0.95)" bg="rgba(255,255,255,0.22)"/>
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
