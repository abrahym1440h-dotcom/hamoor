"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { ARTICLES, ARTICLE_CATEGORIES } from "./articles";
import {
  Home, BarChart2, Grid, BookOpen, ChevronDown, TrendingUp, Users, DollarSign,
  AlertTriangle, MapPin, Coffee, ShoppingBag, Building2, Utensils, Wifi, Car,
  Search, CheckCircle, XCircle, Clock, Lightbulb, Zap, Shield, Sparkles, X,
  Target, Award, TrendingDown, Calendar, PieChart, Activity, Briefcase, Star,
  Scissors, GraduationCap, Dumbbell, Smartphone, Cake, Pizza, Shirt, Sparkle,
  ChevronRight, BookmarkPlus, Share2, Trash2, Archive, FileText, Plus, Eye
} from "lucide-react";

const CATEGORY_ICONS = {
  Utensils, ShoppingBag, Sparkle, GraduationCap, Dumbbell,
  Briefcase, Activity, PieChart, BookOpen
};

const $ = {
  bg:"#F2F2F7", surface:"#FFFFFF",
  L1:"#1C1C1E", L2:"rgba(60,60,67,0.78)",
  L3:"rgba(60,60,67,0.54)", L4:"rgba(60,60,67,0.26)",
  blue:"#007AFF", green:"#34C759", red:"#FF3B30",
  orange:"#FF9500", purple:"#AF52DE", teal:"#32ADE6", indigo:"#5856D6", pink:"#FF2D92", yellow:"#FFCC00",
  F3:"rgba(120,120,128,0.12)", F4:"rgba(120,120,128,0.08)", F5:"rgba(120,120,128,0.04)",
  sep:"rgba(60,60,67,0.29)", sepL:"rgba(60,60,67,0.10)",
};
const SH = {
  card: "0 1px 0 rgba(0,0,0,0.05),0 2px 12px rgba(0,0,0,0.05),0 4px 24px rgba(0,0,0,0.04)",
  lift: "0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.08),0 16px 48px rgba(0,0,0,0.06)",
  blue: "0 2px 8px rgba(0,122,255,0.22),0 8px 32px rgba(0,122,255,0.28)",
};
const sp = {1:4,2:8,3:12,4:16,5:20,6:24,7:28,8:32,10:40,12:48,14:56,16:64};

// ═══════════════════════════════════════
// 📱 Hook للكشف عن حجم الشاشة
// ═══════════════════════════════════════
function useScreenSize() {
  const [size, setSize] = useState({ width: 0, isMobile: true, isTablet: false, isDesktop: false });
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      setSize({
        width: w,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1280,
        isDesktop: w >= 1280
      });
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

// ═══════════════════════════════════════
// 💾 نظام حفظ التحليلات
// ═══════════════════════════════════════
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
    return d.toLocaleDateString("ar-SA", {year:"numeric", month:"short", day:"numeric"});
  } catch(e) { return ""; }
}

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

function RiyalIcon({size=14, color="currentColor", style={}}) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{display:"inline-block", verticalAlign:"middle", ...style}}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 30 L 80 30 M 20 50 L 80 50 M 35 15 L 35 75 Q 35 85 45 85 L 65 85 M 55 15 L 55 65"
        stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
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
      <div style={{position:"relative",background:$.surface,borderRadius:"24px 24px 0 0",maxHeight:"92vh",maxWidth:720,margin:"0 auto",width:"100%",overflowY:"auto",boxShadow:"0 -4px 40px rgba(0,0,0,0.18)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:`${sp[3]}px 0 ${sp[2]}px`,position:"sticky",top:0,background:$.surface,zIndex:10}}><div style={{width:36,height:4,borderRadius:99,background:$.F3}}/></div>
        <button onClick={onClose} style={{position:"sticky",top:sp[3],left:sp[4],background:$.F3,border:"none",borderRadius:99,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginLeft:sp[4],marginRight:"auto",zIndex:11}}><X size={16} color={$.L3}/></button>
        {children}
      </div>
    </div>
  );
}

const CITIES=["الرياض","جدة","الدمام","مكة المكرمة","المدينة المنورة","تبوك","أبها","القصيم","الخبر","نجران"];

function HomeScreen({onAnalyze, lastResult, onViewLast, onViewSaved}) {
  const screen = useScreenSize();
  const [idea,setIdea]=useState("");
  const [details,setDetails]=useState("");
  const [city,setCity]=useState("الرياض");
  const [neighborhood,setNeighborhood]=useState("");
  const [budget,setBudget]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [savedCount,setSavedCount]=useState(0);
  const canGo = idea.trim()&&budget.trim()&&!busy;

  useEffect(() => { setSavedCount(getSavedAnalyses().length); }, [lastResult]);

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
      const analysis = {...r, idea: fullIdea, city: fullLocation, budget: cleanBudget};
      const savedAnalysis = saveAnalysis(analysis);
      onAnalyze(savedAnalysis || analysis);
    } catch(e) { setErr(e.message); }
    finally { setBusy(false); }
  }

  const containerStyle = screen.isDesktop 
    ? {maxWidth:1100, margin:"0 auto"}
    : screen.isTablet 
    ? {maxWidth:720, margin:"0 auto"}
    : {};

  return (
    <div>
      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(168deg,#1D6EF5 0%,#007AFF 55%,#0063DB 100%)",padding:screen.isDesktop?`${sp[16]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
        <div style={{...containerStyle, position:"relative"}}>
          <div style={{position:"absolute",top:-120,left:-120,width:340,height:340,borderRadius:"50%",background:"rgba(255,255,255,0.06)"}}/>
          <div style={{position:"relative"}}>
            <p style={{fontSize:screen.isDesktop?15:13,fontWeight:500,color:"rgba(255,255,255,0.65)",marginBottom:sp[1]}}>تحليل احترافي بمستوى استشاري</p>
            <h1 style={{fontSize:screen.isDesktop?56:screen.isTablet?46:38,fontWeight:800,color:"#fff",letterSpacing:"-1.5px",lineHeight:1.08,marginBottom:sp[2]}}>هامور</h1>
            <p style={{fontSize:screen.isDesktop?18:15,color:"rgba(255,255,255,0.70)",lineHeight:1.6,maxWidth:screen.isDesktop?480:280}}>دراسة جدوى ذكية للسوق السعودي مدعومة ببيانات حقيقية وتحليل AI</p>
          </div>
        </div>
      </div>

      <div style={{padding:screen.isDesktop?`${sp[8]}px ${sp[10]}px ${sp[16]}px`:`${sp[5]}px ${sp[5]}px ${sp[10]}px`,marginTop:-sp[3]}}>
        <div style={containerStyle}>
          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1.2fr 1fr":"1fr",gap:sp[5]}}>
            <Card style={{boxShadow:SH.lift,marginTop:sp[5]}}>
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
                  <div style={{fontSize:10,color:$.L4,marginTop:6,paddingRight:4,display:"flex",alignItems:"center",gap:4}}><Lightbulb size={11} color={$.L4}/><span>كل ما زادت التفاصيل، زادت دقة التحليل</span></div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:screen.isMobile?"1fr":"1fr 1fr",gap:sp[3]}}>
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
                    <input value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} placeholder="مثال: العليا" style={iStyle}/>
                  </div>
                </div>
                <div style={{marginBottom:sp[4]}}>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:7}}>
                    <DollarSign size={14} color={$.L4}/>
                    <label style={{fontSize:12,fontWeight:600,color:$.L3,letterSpacing:.4}}>الميزانية</label>
                  </div>
                  <div style={{position:"relative"}}>
                    <input value={budget} onChange={handleBudgetChange} placeholder="150,000" inputMode="numeric" style={{...iStyle, paddingLeft:sp[10], fontSize:17, fontWeight:600, letterSpacing:0.5}}/>
                    <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",display:"flex",alignItems:"center"}}><RiyalIcon size={20} color={$.L3}/></div>
                  </div>
                  {budget && <div style={{fontSize:11,color:$.L3,marginTop:6,paddingRight:4,display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}><DollarSign size={11} color={$.L3}/><span style={{fontWeight:600,color:$.L2}}>{parseInt(budget.replace(/,/g,"")).toLocaleString("en-US")}</span><RiyalIcon size={11} color={$.L2}/><span>سعودي</span></div>}
                </div>
                {err && <div style={{marginTop:sp[3],background:`${$.red}09`,border:`1px solid ${$.red}25`,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`,fontSize:13,color:$.red,lineHeight:1.6}}>{err}</div>}
                <button onClick={go} disabled={!canGo} style={{marginTop:sp[5],width:"100%",background:canGo?"linear-gradient(150deg,#1A7AFF,#007AFF,#005FCC)":$.F3,color:canGo?"#fff":$.L4,border:"none",borderRadius:14,padding:`${sp[4]}px ${sp[5]}px`,fontSize:16,fontWeight:700,cursor:canGo?"pointer":"not-allowed",fontFamily:"inherit",boxShadow:canGo?SH.blue:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:sp[2]}}>
                  {busy?<><Spinner sz={17}/>جاري التحليل العميق…</>:<><Zap size={16} strokeWidth={2.2}/>حلّل المشروع</>}
                </button>
              </div>
            </Card>

            <div style={{display:"flex",flexDirection:"column",gap:sp[4],marginTop:screen.isDesktop?sp[5]:0}}>
              {savedCount > 0 && (
                <Card onClick={onViewSaved} style={{cursor:"pointer",padding:`${sp[4]}px ${sp[5]}px`,display:"flex",alignItems:"center",gap:sp[3]}}>
                  <IconBadge Icon={Archive} color={$.purple} size={42}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:$.L1,marginBottom:2}}>تحليلاتي المحفوظة</div>
                    <div style={{fontSize:12,color:$.L3}}>{savedCount} {savedCount === 1 ? "تحليل" : "تحليلات"} محفوظة</div>
                  </div>
                  <ChevronRight size={18} color={$.L4}/>
                </Card>
              )}

              {lastResult && (
                <div>
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
        </div>
      </div>
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
  const loc = result.locations || {};
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:720, margin:"0 auto"} : {};

  return (
    <div>
      <div style={{background:hGrad,position:"relative",overflow:"hidden",padding:screen.isDesktop?`${sp[16]}px ${sp[10]}px ${sp[12]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`,borderRadius:"0 0 36px 36px"}}>
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
          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr 1fr":screen.isTablet?"1fr 1fr 1fr 1fr":"1fr 1fr",gap:sp[3],marginBottom:sp[4]}}>
            {[{Icon:TrendingUp,label:"طلب السوق",val:result.market_demand,color:$.blue},{Icon:Users,label:"المنافسة",val:result.competition,color:$.orange},{Icon:DollarSign,label:"التكلفة",val:result.cost_level,color:$.purple},{Icon:Shield,label:"المخاطر",val:result.risk_level,color:$.red}].map(({Icon,label,val,color})=>(
              <Card key={label} style={{padding:`${sp[4]}px ${sp[4]}px ${sp[3]}px`}}>
                <IconBadge Icon={Icon} color={color} size={34}/>
                <div style={{fontSize:11,color:$.L3,marginTop:sp[2],marginBottom:3}}>{label}</div>
                <div style={{fontSize:16,fontWeight:700,color:$.L1}}>{val}</div>
              </Card>
            ))}
          </div>

          <div style={{background:$.F3,borderRadius:12,padding:3,display:"flex",gap:2,marginBottom:sp[4],maxWidth:screen.isDesktop?500:"100%",margin:`0 auto ${sp[4]}px`}}>
            {TABS.map((t,i)=>(<button key={t} onClick={()=>setTab(i)} style={{flex:1,padding:`${sp[2]}px ${sp[1]}px`,borderRadius:10,border:"none",cursor:"pointer",fontFamily:"inherit",background:tab===i?$.surface:"transparent",color:tab===i?$.blue:$.L3,fontSize:12,fontWeight:tab===i?700:500,boxShadow:tab===i?SH.card:"none"}}>{t}</button>))}
          </div>

          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[4]}}>
            {tab===0 && (<>
              {sw.strengths?.length>0 && <Section title="نقاط القوة" Icon={CheckCircle} color={$.green}>{sw.strengths.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.green,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.weaknesses?.length>0 && <Section title="نقاط الضعف" Icon={TrendingDown} color={$.orange}>{sw.weaknesses.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.orange,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.opportunities?.length>0 && <Section title="الفرص" Icon={Target} color={$.blue}>{sw.opportunities.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.blue,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              {sw.threats?.length>0 && <Section title="التهديدات" Icon={AlertTriangle} color={$.red}>{sw.threats.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}><div style={{marginTop:5,width:6,height:6,borderRadius:"50%",background:$.red,flexShrink:0}}/><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                {result.recommendations?.length>0 && <Section title="التوصيات الاستراتيجية" Icon={Lightbulb} color={$.purple}>{result.recommendations.map((s,i)=><div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3],background:`${$.purple}06`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:10}}><div style={{width:22,height:22,borderRadius:"50%",background:$.purple,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div><span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{s}</span></div>)}</Section>}
                {result.kpis?.length>0 && <Section title="مؤشرات الأداء" Icon={Activity} color={$.teal}>{result.kpis.map((k,i)=><Row key={i} label={k.name} value={k.target} valueColor={$.teal}/>)}</Section>}
              </div>
            </>)}

            {tab===1 && (<>
              <Section title="حجم السوق والجمهور" Icon={Users} color={$.blue}>
                <Row label="حجم السوق" value={m.market_size||"-"}/>
                <Row label="الفئة المستهدفة" value={m.target_audience||"-"}/>
                <Row label="أنماط الشراء" value={m.buying_patterns||"-"}/>
                <Row label="الموسمية" value={m.seasonality||"-"}/>
                <Row label="الحصة المتوقعة" value={m.expected_market_share||"-"} valueColor={$.blue} bold/>
                <Row label="إمكانيات النمو" value={m.growth_potential||"-"}/>
              </Section>
              {m.competitors?.length>0 && <Section title="المنافسون الرئيسيون" Icon={Briefcase} color={$.orange}>{m.competitors.map((c,i)=><div key={i} style={{padding:`${sp[3]}px 0`,borderBottom:i<m.competitors.length-1?`0.5px solid ${$.sepL}`:"none"}}><div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:4}}><Star size={14} color={$.orange}/><span style={{fontSize:14,fontWeight:700,color:$.L1}}>{c.name}</span></div><p style={{fontSize:13,color:$.L3,lineHeight:1.5,paddingRight:sp[5]}}>{c.strength}</p></div>)}</Section>}
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="أفضل وأسوأ موقع" Icon={MapPin} color={$.green}>
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop||screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {[{type:"الموقع الأفضل",color:$.green,d:loc.best},{type:"الموقع الأسوأ",color:$.red,d:loc.worst}].map(({type,color,d})=>d && (
                      <div key={type} style={{background:`${color}07`,border:`1px solid ${color}20`,borderRadius:14,padding:`${sp[4]}px`}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:sp[3]}}><div><Chip text={type} color={color} bg={`${color}16`}/><div style={{fontSize:15,fontWeight:700,color:$.L1,marginTop:sp[2]}}>{d.name}</div></div><div style={{fontSize:26,fontWeight:800,color}}>{d.score}%</div></div>
                        <Bar pct={d.score||0} color={color}/>
                        {d.reason && <p style={{fontSize:12,color:$.L3,lineHeight:1.5,marginTop:sp[3]}}>{d.reason}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            </>)}

            {tab===2 && (<>
              <Section title="تكلفة التأسيس" Icon={Briefcase} color={$.purple} subtitle="تكاليف لمرة واحدة">
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
                <MoneyRow label="فواتير الخدمات" value={mc.utilities}/>
                <MoneyRow label="المواد الخام" value={mc.materials}/>
                <MoneyRow label="التسويق" value={mc.marketing}/>
                <MoneyRow label="الصيانة" value={mc.maintenance}/>
                <MoneyRow label="مصاريف أخرى" value={mc.other}/>
                <div style={{marginTop:sp[3],paddingTop:sp[3],borderTop:`2px solid ${$.orange}30`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:700,color:$.L1}}>الإجمالي الشهري</span><span style={{fontSize:20,fontWeight:800,color:$.orange,display:"inline-flex",alignItems:"center",gap:6}}><span>{fmt(mc.total)}</span><RiyalIcon size={18} color={$.orange}/></span></div>
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
            </>)}

            {tab===3 && (
              <div style={{gridColumn:screen.isDesktop?"span 2":"auto"}}>
                <Section title="تحليل المخاطر التفصيلي" Icon={AlertTriangle} color={$.red} subtitle="5 مخاطر مصنّفة مع خطط التخفيف">
                  <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":"1fr",gap:sp[3]}}>
                    {(result.risk_analysis||[]).map((r,i)=>{
                      const probColor = r.probability==="عالي"?$.red:r.probability==="متوسط"?$.orange:$.green;
                      const impColor = r.impact==="شديد"?$.red:r.impact==="متوسط"?$.orange:$.green;
                      return (
                        <div key={i} style={{background:$.F5,borderRadius:14,padding:`${sp[4]}px`}}>
                          <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}><div style={{width:26,height:26,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{i+1}</div><span style={{fontSize:14,fontWeight:700,color:$.L1,flex:1}}>{r.risk}</span></div>
                          <div style={{display:"flex",gap:sp[2],marginBottom:sp[3],flexWrap:"wrap"}}><Chip text={"احتمالية: "+r.probability} color={probColor} bg={`${probColor}15`}/><Chip text={"التأثير: "+r.impact} color={impColor} bg={`${impColor}15`}/></div>
                          <div style={{background:`${$.green}07`,borderRight:`3px solid ${$.green}`,padding:`${sp[3]}px ${sp[4]}px`,borderRadius:8}}><div style={{fontSize:11,fontWeight:700,color:$.green,marginBottom:4}}>خطة التخفيف</div><p style={{fontSize:13,color:$.L2,lineHeight:1.6}}>{r.mitigation}</p></div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>
            )}
          </div>

          <div style={{marginTop:sp[5]}}>
            <Section title="بدائل مقترحة" Icon={Lightbulb} color={$.purple}>
              <div style={{display:"grid",gridTemplateColumns:screen.isDesktop||screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
                <div style={{background:$.F5,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`}}><div style={{fontSize:11,color:$.L3,marginBottom:2}}>فكرة بديلة</div><div style={{fontSize:14,fontWeight:600,color:$.L1}}>{result.alternative_idea}</div></div>
                <div style={{background:$.F5,borderRadius:12,padding:`${sp[3]}px ${sp[4]}px`}}><div style={{fontSize:11,color:$.L3,marginBottom:2}}>مدينة بديلة</div><div style={{fontSize:14,fontWeight:600,color:$.L1}}>{result.alternative_city}</div></div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedAnalysesScreen({onViewAnalysis}) {
  const screen = useScreenSize();
  const [analyses, setAnalyses] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
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

  const filtered = analyses.filter(a => {
    if (filter === "positive" && a.decision_type !== "positive") return false;
    if (filter === "negative" && a.decision_type !== "negative") return false;
    if (q && !a.idea?.includes(q) && !a.city?.includes(q)) return false;
    return true;
  });

  const positiveCount = analyses.filter(a => a.decision_type === "positive").length;
  const negativeCount = analyses.filter(a => a.decision_type === "negative").length;
  const containerStyle = screen.isDesktop ? {maxWidth:1100, margin:"0 auto"} : screen.isTablet ? {maxWidth:720, margin:"0 auto"} : {};

  if (analyses.length === 0) {
    return (
      <div style={{padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
        <div style={containerStyle}>
          <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>تحليلاتي</h1>
          <p style={{fontSize:14,color:$.L3,marginBottom:sp[8]}}>جميع تحليلاتك في مكان واحد</p>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:`${sp[12]}px ${sp[5]}px`,textAlign:"center"}}>
            <div style={{width:80,height:80,borderRadius:24,background:`${$.purple}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:sp[5]}}>
              <Archive size={36} color={$.purple} strokeWidth={1.5}/>
            </div>
            <h3 style={{fontSize:18,fontWeight:700,color:$.L1,marginBottom:sp[2]}}>لا توجد تحليلات بعد</h3>
            <p style={{fontSize:14,color:$.L3,lineHeight:1.6,maxWidth:320}}>عند تحليل أي مشروع، سيتم حفظه تلقائياً هنا للرجوع إليه لاحقاً</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <div style={{marginBottom:sp[5]}}>
          <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>تحليلاتي</h1>
          <p style={{fontSize:14,color:$.L3}}>{analyses.length} {analyses.length === 1 ? "تحليل محفوظ" : "تحليلات محفوظة"}</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:sp[3],marginBottom:sp[5]}}>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={Archive} color={$.blue} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.L1,marginTop:sp[2]}}>{analyses.length}</div>
            <div style={{fontSize:11,color:$.L3,marginTop:2}}>المجموع</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={CheckCircle} color={$.green} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.green,marginTop:sp[2]}}>{positiveCount}</div>
            <div style={{fontSize:11,color:$.L3,marginTop:2}}>إيجابي</div>
          </Card>
          <Card style={{padding:sp[4]}}>
            <IconBadge Icon={XCircle} color={$.red} size={32}/>
            <div style={{fontSize:24,fontWeight:800,color:$.red,marginTop:sp[2]}}>{negativeCount}</div>
            <div style={{fontSize:11,color:$.L3,marginTop:2}}>سلبي</div>
          </Card>
        </div>

        <div style={{position:"relative",marginBottom:sp[4]}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث في تحليلاتك…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[5],overflowX:"auto",paddingBottom:4}}>
          {[{id:"all", name:"الكل", color:$.blue},{id:"positive", name:"إيجابي", color:$.green},{id:"negative", name:"سلبي", color:$.red}].map(f => (
            <button key={f.id} onClick={()=>setFilter(f.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:filter===f.id?f.color:$.F4,color:filter===f.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{f.name}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{padding:`${sp[8]}px ${sp[4]}px`,textAlign:"center",color:$.L3,fontSize:14,background:$.surface,borderRadius:16}}>لا توجد نتائج مطابقة</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
            {filtered.map(a => {
              const pos = a.decision_type === "positive";
              const color = pos ? $.green : $.red;
              return (
                <Card key={a.id} style={{padding:0,overflow:"hidden"}}>
                  <div onClick={()=>onViewAnalysis(a)} style={{padding:`${sp[4]}px ${sp[5]}px`,cursor:"pointer"}}>
                    <div style={{display:"flex",alignItems:"center",gap:sp[4],marginBottom:sp[3]}}>
                      <ScoreRing value={a.score} size={56} track={5} color={color} noAnim/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:15,fontWeight:700,color:$.L1,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.idea}</div>
                        <div style={{fontSize:12,color:$.L3,display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={11}/><span>{a.city}</span></div>
                          <span>·</span>
                          <div style={{display:"flex",alignItems:"center",gap:3}}><RiyalIcon size={10}/><span>{fmt(parseInt(a.budget))}</span></div>
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                      <Chip text={a.decision} color={color} bg={`${color}15`} size={11}/>
                      <div style={{display:"flex",alignItems:"center",gap:3,color:$.L4,fontSize:11}}>
                        <Clock size={10}/>
                        <span>{formatDate(a.savedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",borderTop:`0.5px solid ${$.sepL}`}}>
                    <button onClick={()=>onViewAnalysis(a)} style={{flex:1,padding:`${sp[3]}px`,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.blue,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                      <Eye size={14}/>
                      <span>عرض التحليل</span>
                    </button>
                    <div style={{width:"0.5px",background:$.sepL}}/>
                    <button onClick={()=>setConfirmDelete(a.id)} style={{flex:"none",padding:`${sp[3]}px ${sp[5]}px`,background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,color:$.red,display:"flex",alignItems:"center",gap:5}}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {analyses.length > 0 && (
          <button onClick={handleClearAll} style={{marginTop:sp[6],width:"100%",background:"transparent",color:$.L4,border:`1.5px dashed ${$.L4}`,borderRadius:12,padding:`${sp[3]}px`,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>حذف كل التحليلات</button>
        )}

        <Sheet open={!!confirmDelete} onClose={()=>setConfirmDelete(null)}>
          <div style={{padding:`${sp[5]}px ${sp[5]}px ${sp[8]}px`,textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:20,background:`${$.red}15`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",marginBottom:sp[5]}}>
              <AlertTriangle size={30} color={$.red} strokeWidth={1.8}/>
            </div>
            <h3 style={{fontSize:20,fontWeight:800,color:$.L1,marginBottom:sp[2]}}>حذف التحليل؟</h3>
            <p style={{fontSize:14,color:$.L3,lineHeight:1.6,marginBottom:sp[6]}}>سيتم حذف هذا التحليل نهائياً ولا يمكن استرجاعه</p>
            <div style={{display:"flex",gap:sp[3]}}>
              <button onClick={()=>setConfirmDelete(null)} style={{flex:1,background:$.F3,color:$.L1,border:"none",borderRadius:12,padding:`${sp[3]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>إلغاء</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{flex:1,background:$.red,color:"#fff",border:"none",borderRadius:12,padding:`${sp[3]}px`,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>حذف</button>
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
    last_updated:"يناير 2026"
  }
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
  const containerStyle = screen.isDesktop ? {maxWidth:1200, margin:"0 auto"} : screen.isTablet ? {maxWidth:900, margin:"0 auto"} : {};

  return (
    <div style={{padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[10]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>القطاعات</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>تحليلات السوق السعودي · محدّثة يناير 2026</p>

        <div style={{position:"relative",marginBottom:sp[4],maxWidth:screen.isDesktop?500:"100%"}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن قطاع…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        <div style={{display:"flex",gap:sp[2],marginBottom:sp[5],overflowX:"auto",paddingBottom:4}}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={()=>setCat(c.id)} style={{flex:"none",padding:`${sp[2]}px ${sp[4]}px`,borderRadius:99,border:"none",cursor:"pointer",fontFamily:"inherit",background:cat===c.id?c.color:$.F4,color:cat===c.id?"#fff":$.L2,fontSize:13,fontWeight:600,whiteSpace:"nowrap"}}>{c.name}</button>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
          {list.length === 0 && <div style={{gridColumn:"1/-1",padding:`${sp[8]}px ${sp[4]}px`,textAlign:"center",color:$.L3,fontSize:14}}>لا توجد قطاعات مطابقة</div>}
          {list.map(s=>(
            <Card key={s.id} onClick={()=>setActive(s)} style={{padding:`${sp[4]}px`,cursor:"pointer"}}>
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
                  <div style={{fontSize:11,color:$.L4,marginTop:2}}>آخر تحديث: {active.last_updated}</div>
                </div>
                <div style={{fontSize:32,fontWeight:800,color:active.color}}>{active.score}</div>
              </div>
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
                  <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:6}}><DollarSign size={14} color={$.purple}/><span style={{fontSize:10,fontWeight:600,color:$.L3}}>متوسط الاستثمار</span></div>
                  <div style={{fontSize:13,fontWeight:700,color:$.L1}}>{active.investment}</div>
                  <div style={{fontSize:9,color:$.L4,marginTop:2,display:"inline-flex",alignItems:"center",gap:3}}><RiyalIcon size={10} color={$.L4}/><span>ريال</span></div>
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
                <p style={{fontSize:14,color:$.L2,lineHeight:1.7}}>{active.audience}</p>
              </Section>
              <Section title="أفضل المدن" Icon={MapPin} color={$.green}>
                <div style={{display:"flex",gap:sp[2],flexWrap:"wrap"}}>
                  {active.top_cities.map((c,i)=>(<Chip key={c} text={`${i+1}. ${c}`} color={$.green} bg={`${$.green}15`} size={13}/>))}
                </div>
              </Section>
              <Section title="عوامل النجاح" Icon={CheckCircle} color={$.green} subtitle={`${active.success_tips.length} نصيحة عملية`}>
                {active.success_tips.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:$.green,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{t}</span>
                  </div>
                ))}
              </Section>
              <Section title="أسباب الفشل الشائعة" Icon={XCircle} color={$.red} subtitle="تحذيرات مهمة قبل البدء">
                {active.failure_reasons.map((t,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:sp[3],marginBottom:sp[3]}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:$.red,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>×</div>
                    <span style={{fontSize:14,color:$.L2,lineHeight:1.6}}>{t}</span>
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

  const featuredArticle = ARTICLES[0];
  const categoryStats = ARTICLE_CATEGORIES.map(c => ({...c, count: ARTICLES.filter(a => a.category === c.id).length}));

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
    <div style={{padding:screen.isDesktop?`${sp[14]}px ${sp[10]}px ${sp[10]}px`:`${sp[14]}px ${sp[5]}px ${sp[10]}px`}}>
      <div style={containerStyle}>
        <h1 style={{fontSize:screen.isDesktop?42:30,fontWeight:800,color:$.L1,letterSpacing:"-0.8px",marginBottom:4}}>مكتبة التعلم</h1>
        <p style={{fontSize:14,color:$.L3,marginBottom:sp[5]}}>{ARTICLES.length} مقالة احترافية · محدّثة يناير 2026</p>

        <div style={{position:"relative",marginBottom:sp[5],maxWidth:screen.isDesktop?500:"100%"}}>
          <Search size={15} color={$.L4} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)"}}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث في المقالات…" style={{...iStyle,paddingRight:40,background:$.surface,boxShadow:SH.card}}/>
        </div>

        {activeCat === "all" && !q && (() => {
          const FeatCatInfo = getCategoryInfo(featuredArticle.category);
          return (
            <div onClick={()=>setActiveArticle(featuredArticle)} style={{background:FeatCatInfo.gradient,borderRadius:24,padding:screen.isDesktop?`${sp[10]}px ${sp[8]}px`:`${sp[7]}px ${sp[6]}px ${sp[5]}px`,marginBottom:sp[6],cursor:"pointer",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:-60,left:-60,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
              <div style={{position:"relative",maxWidth:screen.isDesktop?700:"100%"}}>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.25)",borderRadius:99,padding:"6px 14px",marginBottom:sp[3]}}>
                  <Star size={13} color="#fff" strokeWidth={2.2}/>
                  <span style={{fontSize:12,fontWeight:700,color:"#fff"}}>مقالة مميزة</span>
                </div>
                <div style={{fontSize:screen.isDesktop?28:22,fontWeight:800,color:"#fff",lineHeight:1.3,marginBottom:sp[3],letterSpacing:"-0.4px"}}>{featuredArticle.title}</div>
                <p style={{fontSize:screen.isDesktop?15:13,color:"rgba(255,255,255,0.85)",lineHeight:1.6,marginBottom:sp[4]}}>{featuredArticle.excerpt}</p>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{display:"flex",alignItems:"center",gap:sp[3]}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,0.85)"}}><Clock size={13}/><span style={{fontSize:13,fontWeight:600}}>{featuredArticle.readTime} دقائق</span></div>
                    <div style={{display:"flex",alignItems:"center",gap:5,color:"rgba(255,255,255,0.85)"}}><Activity size={13}/><span style={{fontSize:13,fontWeight:600}}>{featuredArticle.level}</span></div>
                  </div>
                  <div style={{background:"rgba(255,255,255,0.25)",borderRadius:99,padding:`${sp[2]}px ${sp[4]}px`,fontSize:13,fontWeight:700,color:"#fff",display:"flex",alignItems:"center",gap:4}}>اقرأ <ChevronRight size={14}/></div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeCat === "all" && !q && (
          <>
            <SectionLabel>تصفّح حسب الفئة</SectionLabel>
            <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"repeat(4,1fr)":screen.isTablet?"repeat(3,1fr)":"1fr 1fr",gap:sp[3],marginBottom:sp[6]}}>
              {categoryStats.map(c => {
                const CatIcon = CATEGORY_ICONS[c.iconName] || BookOpen;
                return (
                  <Card key={c.id} onClick={()=>setActiveCat(c.id)} style={{padding:`${sp[4]}px`,cursor:"pointer"}}>
                    <IconBadge Icon={CatIcon} color={c.color} size={42}/>
                    <div style={{fontSize:14,fontWeight:700,color:$.L1,marginTop:sp[3],marginBottom:4,lineHeight:1.3}}>{c.name}</div>
                    <div style={{fontSize:11,color:$.L3}}>{c.count} مقالات</div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

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

        <SectionLabel>{activeCat === "all" ? `جميع المقالات (${filteredArticles.length})` : `${getCategoryInfo(activeCat).name} (${filteredArticles.length})`}</SectionLabel>
        
        {filteredArticles.length === 0 ? (
          <div style={{padding:`${sp[8]}px ${sp[4]}px`,textAlign:"center",color:$.L3,fontSize:14,background:$.surface,borderRadius:16}}>لا توجد مقالات مطابقة</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:screen.isDesktop?"1fr 1fr 1fr":screen.isTablet?"1fr 1fr":"1fr",gap:sp[3]}}>
            {filteredArticles.map(article => {
              const catInfo = getCategoryInfo(article.category);
              const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
              return (
                <Card key={article.id} onClick={()=>setActiveArticle(article)} style={{padding:`${sp[4]}px`,cursor:"pointer"}}>
                  <div style={{display:"flex",alignItems:"flex-start",gap:sp[4]}}>
                    <div style={{width:60,height:60,borderRadius:16,background:catInfo.gradient,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 4px 12px ${catInfo.color}33`}}>
                      <CatIcon size={30} color="#ffffff" strokeWidth={2.4} absoluteStrokeWidth/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:15,fontWeight:700,color:$.L1,lineHeight:1.4,marginBottom:4}}>{article.title}</div>
                      <p style={{fontSize:12,color:$.L3,lineHeight:1.5,marginBottom:sp[2],overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{article.excerpt}</p>
                      <div style={{display:"flex",alignItems:"center",gap:sp[2],flexWrap:"wrap"}}>
                        <Chip text={catInfo.name} color={catInfo.color} bg={`${catInfo.color}15`} size={11}/>
                        <div style={{display:"flex",alignItems:"center",gap:3,color:$.L4}}><Clock size={11}/><span style={{fontSize:11,fontWeight:600}}>{article.readTime} د</span></div>
                        <Chip text={article.level} color={getLevelColor(article.level)} bg={`${getLevelColor(article.level)}15`} size={11}/>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Sheet open={!!activeArticle} onClose={()=>setActiveArticle(null)}>
          {activeArticle && (
            <div style={{padding:`0 ${sp[5]}px ${sp[8]}px`}}>
              {(() => {
                const catInfo = getCategoryInfo(activeArticle.category);
                const CatIcon = CATEGORY_ICONS[catInfo.iconName] || BookOpen;
                return (
                  <>
                    <div style={{background:catInfo.gradient,borderRadius:20,padding:`${sp[6]}px ${sp[5]}px`,marginBottom:sp[5],position:"relative",overflow:"hidden"}}>
                      <div style={{position:"absolute",top:-40,left:-40,width:140,height:140,borderRadius:"50%",background:"rgba(255,255,255,0.1)"}}/>
                      <div style={{position:"relative"}}>
                        <div style={{display:"flex",alignItems:"center",gap:sp[2],marginBottom:sp[3]}}>
                          <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.22)",borderRadius:99,padding:"5px 12px"}}>
                            <CatIcon size={13} color="#fff" strokeWidth={2.2}/>
                            <span style={{fontSize:11,fontWeight:600,color:"#fff"}}>{catInfo.name}</span>
                          </div>
                          <Chip text={activeArticle.level} color="rgba(255,255,255,0.95)" bg="rgba(255,255,255,0.22)"/>
                        </div>
                        <h2 style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.3,marginBottom:sp[3],letterSpacing:"-0.4px"}}>{activeArticle.title}</h2>
                        <div style={{display:"flex",alignItems:"center",gap:sp[4],color:"rgba(255,255,255,0.85)"}}>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><Clock size={13}/><span style={{fontSize:13,fontWeight:600}}>{activeArticle.readTime} دقائق</span></div>
                          <div style={{display:"flex",alignItems:"center",gap:5}}><Calendar size={13}/><span style={{fontSize:13,fontWeight:600}}>{activeArticle.date}</span></div>
                        </div>
                      </div>
                    </div>
                    <div style={{fontSize:15,color:$.L2,lineHeight:1.9,fontWeight:400}}>
                      {activeArticle.content.split("\n\n").filter(p=>p.trim()).map((paragraph,i) => {
                        const trimmed = paragraph.trim();
                        if (trimmed.startsWith("═══")) {
                          const headerText = trimmed.replace(/═/g,"").trim();
                          return <h3 key={i} style={{fontSize:18,fontWeight:800,color:$.L1,marginTop:sp[6],marginBottom:sp[3],paddingBottom:sp[2],borderBottom:`2px solid ${catInfo.color}30`,letterSpacing:"-0.3px"}}>{headerText}</h3>;
                        }
                        if (trimmed.includes("•") || trimmed.match(/^[-*]/m)) {
                          return <div key={i} style={{marginBottom:sp[4]}}>
                            {trimmed.split("\n").map((line,j) => {
                              const l = line.trim();
                              if (!l) return null;
                              if (l.startsWith("•") || l.startsWith("-")) {
                                return <div key={j} style={{display:"flex",alignItems:"flex-start",gap:sp[2],marginBottom:sp[2]}}>
                                  <div style={{marginTop:8,width:5,height:5,borderRadius:"50%",background:catInfo.color,flexShrink:0}}/>
                                  <span style={{flex:1}}>{l.replace(/^[•-]\s*/,"")}</span>
                                </div>;
                              }
                              return <p key={j} style={{marginBottom:sp[2]}}>{l}</p>;
                            })}
                          </div>;
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

const NAV=[
  {id:"home",label:"الرئيسية",Icon:Home},
  {id:"analysis",label:"التحليل",Icon:BarChart2},
  {id:"saved",label:"تحليلاتي",Icon:Archive},
  {id:"sectors",label:"القطاعات",Icon:Grid},
  {id:"learning",label:"التعلم",Icon:BookOpen}
];

function BottomNav({tab,setTab}) {
  return (
    <nav style={{position:"fixed",bottom:0,left:0,right:0,zIndex:999,display:"flex",justifyContent:"space-around",background:"rgba(246,246,248,0.88)",backdropFilter:"saturate(180%) blur(28px)",WebkitBackdropFilter:"saturate(180%) blur(28px)",borderTop:`0.5px solid rgba(60,60,67,0.18)`,padding:`${sp[3]}px ${sp[2]}px ${sp[7]}px`}}>
      {NAV.map(({id,label,Icon})=>{const on=tab===id;return(<button key={id} onClick={()=>setTab(id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:sp[1],background:"none",border:"none",cursor:"pointer",padding:`${sp[1]}px ${sp[3]}px`,borderRadius:14}}><div style={{padding:`${sp[1]+2}px ${sp[2]+2}px`,borderRadius:12,background:on?`${$.blue}18`:"transparent"}}><Icon size={20} color={on?$.blue:$.L4} strokeWidth={on?2.1:1.6}/></div><span style={{fontSize:9,fontWeight:on?700:500,color:on?$.blue:$.L4}}>{label}</span></button>);})}
    </nav>
  );
}

function SideNav({tab,setTab}) {
  return (
    <nav style={{position:"fixed",top:0,right:0,bottom:0,width:240,zIndex:999,display:"flex",flexDirection:"column",background:$.surface,borderLeft:`0.5px solid ${$.sepL}`,padding:`${sp[6]}px ${sp[4]}px`,boxShadow:"-2px 0 20px rgba(0,0,0,0.03)"}}>
      <div style={{padding:`${sp[2]}px ${sp[3]}px`,marginBottom:sp[6]}}>
        <h2 style={{fontSize:24,fontWeight:800,color:$.blue,letterSpacing:"-0.8px"}}>هامور</h2>
        <p style={{fontSize:11,color:$.L4,marginTop:2}}>دراسة جدوى ذكية</p>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:sp[1]}}>
        {NAV.map(({id,label,Icon})=>{
          const on=tab===id;
          return (
            <button key={id} onClick={()=>setTab(id)} style={{display:"flex",alignItems:"center",gap:sp[3],background:on?`${$.blue}12`:"transparent",border:"none",cursor:"pointer",padding:`${sp[3]}px ${sp[4]}px`,borderRadius:12,fontFamily:"inherit",transition:"all 0.2s"}}>
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
        {tab==="home" && <HomeScreen onAnalyze={handleAnalyze} lastResult={result} onViewLast={()=>setTab("analysis")} onViewSaved={()=>setTab("saved")}/>}
        {tab==="analysis" && <AnalysisScreen result={result}/>}
        {tab==="saved" && <SavedAnalysesScreen onViewAnalysis={handleViewSaved}/>}
        {tab==="sectors" && <SectorsScreen/>}
        {tab==="learning" && <LearningScreen/>}
        {useSideNav ? <SideNav tab={tab} setTab={setTab}/> : <BottomNav tab={tab} setTab={setTab}/>}
      </div>
    </>
  );
}
