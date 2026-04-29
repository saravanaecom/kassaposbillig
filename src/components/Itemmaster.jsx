import { useState, useRef, useCallback, useEffect } from "react";
import "../Itemmaster.css";

// ═══════════════════════════════════════════════════════════════
//  SERVER CONFIG
//  BASE_URL = ""  →  uses the Vite proxy (recommended for dev)
//                    see vite.config.js — proxy forwards all API
//                    routes to http://13.200.71.164:9001
//
//  BASE_URL = "http://13.200.71.164:9001"
//            →  direct calls to server (requires CORS enabled on server)
// ═══════════════════════════════════════════════════════════════
const BASE_URL = "";   // ← keep empty if using vite.config.js proxy

// ── Build full URL (mirrors jQuery url: "/Brand/SelectBrand") ──
// Ensures path always starts with /  e.g.  BASE_URL + "/Brand/SelectBrand"
const mkUrl = (path) => {
  const p = path.startsWith("/") ? path : "/" + path;
  return BASE_URL + p;
};
var token=localStorage.getItem('token')  ; 

const getToken = () =>
  localStorage.getItem('token')   


// ── Safe POST — mirrors jQuery $.ajax type:"POST" ──
// Never throws. Returns parsed JSON or { ok:false, message, _netErr/_http404 }
const api = async (path, body, extraHeaders = {}) => {
  try {
    const fullUrl = mkUrl(path);
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8"  ,
        'Authorization': `Bearer ${getToken()}`,
        
        ...extraHeaders 



      },
      body: JSON.stringify(body),
    });
    if (res.status === 404)
      return { ok: false, _http404: true, message: `404 Not Found: ${fullUrl}` };
    const text = await res.text();
    if (!text.trim())
      return { ok: false, message: `Empty response (HTTP ${res.status})` };
    try   { return JSON.parse(text); }
    catch { return { ok: false, message: `Non-JSON (${res.status}): ${text.slice(0, 200)}` }; }
  } catch (err) {
    return { ok: false, _netErr: true, message: err.message || "Network error" };
  }
};

// ── Safe GET — mirrors jQuery $.ajax type:"GET" / dataType:"json" ──
const apiGet = async (path) => {
  try {
    const res  = await fetch(mkUrl(path));
    if (res.status === 404) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    try   { return JSON.parse(text); } catch { return null; }
  } catch { return null; }
};

// localStorage helpers (mirrors JS localStorage.getItem)
const getLocal = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const getStr   = k => localStorage.getItem(k) || "";

// ─────────────────────────────────────────────
//  COLUMN DEFINITIONS
// ─────────────────────────────────────────────
const COLUMNS = [
  { key:"ProductCode",      label:"Product Code",    width:150, pinned:true },
  { key:"SecondCode",       label:"Second Code",     width:150, pinned:true, hidden:true },
  { key:"ProductName",      label:"Description",     width:200, pinned:true },
  { key:"PrinterName",      label:"Printer Name",    width:200, hidden:true },
  { key:"HSNCode",          label:"HSN Code",        width:100, hidden:true },
  { key:"Brand",            label:"Brand",           width:200, hidden:true, isCombo:true, idField:"BrandId" },
  { key:"Category",         label:"Category",        width:200, isCombo:true, idField:"CategoryId" },
  { key:"Department",       label:"Department",      width:200, hidden:true, isCombo:true, idField:"DepartmentId" },
  { key:"Supplier",         label:"Supplier",        width:200, hidden:true, isCombo:true, idField:"SupplierId" },
  { key:"UOM",              label:"UOM",             width:200, isCombo:true, idField:"UOMId" },
  { key:"LocationMaster",   label:"Location",        width:200, hidden:true, isCombo:true, idField:"LocationMasterId" },
  { key:"NomsQty",          label:"Noms Qty",        width:100, type:"int",  hidden:true },
  { key:"MRP",              label:"MRP",             width:100, type:"f2" },
  { key:"DMPer",            label:"DM%",             width:100, type:"f2",  calc:true, hidden:true },
  { key:"DMAmt",            label:"DM Amt",          width:100, type:"f2",  calc:true, hidden:true },
  { key:"PurchaseRate",     label:"Purchase Rate",   width:120, type:"f2" },
  { key:"GST",              label:"GST%",            width:100, type:"f2" },
  { key:"GSTAmt",           label:"GST Amt",         width:100, type:"f2",  calc:true, hidden:true },
  { key:"TransPer",         label:"Transport%",      width:110, type:"f2",  hidden:true },
  { key:"TransAmt",         label:"Transport Amt",   width:120, type:"f2",  calc:true, hidden:true },
  { key:"CESS",             label:"CESS%",           width:100, type:"f2",  hidden:true },
  { key:"CESSAmt",          label:"CESS Amt",        width:100, type:"f2",  calc:true, hidden:true },
  { key:"SPLCESS",          label:"SPL CESS",        width:100, type:"f2",  hidden:true },
  { key:"LandingCost",      label:"Landing Cost",    width:120, type:"f2",  calc:true },
  { key:"ProfitPer",        label:"Profit%",         width:100, type:"f2",  hidden:true },
  { key:"ProfitAmt",        label:"Profit Amt",      width:100, type:"f2",  calc:true, hidden:true },
  { key:"SalesRate",        label:"Sale Rate",       width:100, type:"f2" },
  { key:"CardRate",         label:"Card Rate",       width:100, type:"f2",  hidden:true },
  { key:"WholeSaleRate",    label:"Whole Sale Rate", width:130, type:"f2",  hidden:true },
  { key:"NomsPCRate",       label:"Noms PC Rate",    width:120, type:"f2",  hidden:true },
  { key:"SalesRateType",    label:"Fixed Rate",      width:100, bool:true,  hidden:true },
  { key:"SaleDiscountPer",  label:"Sale Disc%",      width:100, type:"f2",  hidden:true },
  { key:"SaleDiscountAmt",  label:"Sale Disc Amt",   width:130, type:"f2",  hidden:true },
  { key:"ReorderLevelMin",  label:"Reorder Min",     width:110, type:"f2",  hidden:true },
  { key:"ReorderLevelMax",  label:"Reorder Max",     width:110, type:"f2",  hidden:true },
  { key:"MaxSaleQty",       label:"Max Sale Qty",    width:110, type:"f2",  hidden:true },
  { key:"LessAmt",          label:"Less Amt",        width:100, type:"f2",  hidden:true },
  { key:"StockNeed",        label:"Stock Need",      width:100, bool:true,  hidden:true },
  { key:"ExpriyDate",       label:"Expiry Date",     width:110, bool:true,  hidden:true },
  { key:"OnlineShow",       label:"Online Show",     width:110, bool:true,  hidden:true },
  { key:"ExpriyDays",       label:"Expiry Days",     width:110, type:"int", hidden:true },
  { key:"ExpiryBeforeDays", label:"Exp Before Days", width:130, type:"int", hidden:true },
  { key:"ManufactureDate",  label:"Mfg Date",        width:110, bool:true,  hidden:true },
  { key:"Repacking",        label:"Repacking",       width:105, bool:true,  hidden:true },
  { key:"NetWeight",        label:"Net Weight",      width:105, type:"f3",  hidden:true },
  { key:"BrandType",        label:"Brand Type",      width:110, bool:true,  hidden:true },
  { key:"ModelType",        label:"Model Type",      width:110, bool:true,  hidden:true },
  { key:"ColorType",        label:"Color Type",      width:105, bool:true,  hidden:true },
  { key:"SizeType",         label:"Size Type",       width:100, bool:true,  hidden:true },
  { key:"GenderType",       label:"Gender Type",     width:110, bool:true,  hidden:true },
  { key:"SerialNoType",     label:"Serial No Type",  width:125, bool:true,  hidden:true },
  { key:"CRMPoints",        label:"CRM Points",      width:110, type:"f2",  hidden:true },
  { key:"NegativetStock",   label:"Neg Stock",       width:110, bool:true,  hidden:true },
  { key:"BatchwiseStock",   label:"Batchwise",       width:120, bool:true,  hidden:true },
  { key:"Remarks",          label:"Remarks",         width:150, hidden:true },
  { key:"Active",           label:"Active",          width:80,  bool:true },
];

const ROWS_PER_PAGE = 20;
const SNO_W = 50;
const DEFAULT_COLS = COLUMNS.map(c => ({ key:c.key, label:c.label, width:c.width, visible:!c.hidden }));

const mkEmpty = () => {
  const f = {};
  COLUMNS.forEach(c => { f[c.key] = c.bool ? false : ""; });
  ["BrandId","CategoryId","DepartmentId","SupplierId","UOMId","LocationMasterId","ProductImage","Id","EditMode"].forEach(k => { f[k] = ""; });
  f.Active = true; f.StockNeed = true; f.SalesRateType = true;
  return f;
};

// ─── UTILS ───
const vn = v => parseFloat(v) || 0;
const ro = v => Math.round(v * 100) / 100;
const f2 = v => parseFloat(vn(v).toFixed(2));
const ns = v => (v == null ? "" : String(v));
const zp = (n, d) => String(n).padStart(d, "0");

// ─── CALC ENGINE (mirrors JS calcution) ───
function calc(form, sessFlags, isNewRow) {
  const PR=vn(form.PurchaseRate), GST=vn(form.GST), CESS=vn(form.CESS);
  const TP=vn(form.TransPer), MRP=vn(form.MRP), PP=vn(form.ProfitPer);
  const GSTAmt=ro(PR*GST/100), CessAmt=ro(PR*CESS/100), TrAmt=ro(PR*TP/100);
  const LC=ro(PR+GSTAmt+CessAmt+TrAmt);
  const DlrAmt=ro(MRP-LC), DlrPer=MRP>0?ro(DlrAmt/MRP*100):0;
  const ProfitAmt=ro(LC*PP/100);

  // mirrors jQuery calcution():
  // PurchaseProfitSaleRateChange=true: if ProfitAmt!=0 → SR=LC+ProfitAmt
  //                                    if ProfitAmt==0 && new row (Id==0) → SR=MRP
  //                                    if ProfitAmt==0 && existing row → keep current SR
  // PurchaseProfitSaleRateChange=false: if Id==0 (new row) → SR=MRP (keep existing on edit)
  let SR;
  if (sessFlags && sessFlags.PurchaseProfitSaleRateChange) {
    if (ProfitAmt !== 0) {
      SR = f2(LC + ProfitAmt);
    } else {
      // isNewRow mirrors jQuery: ValNum(grdId)==0
      SR = isNewRow ? f2(MRP) : (vn(form.SalesRate) || f2(MRP));
    }
  } else {
    if (ProfitAmt !== 0) {
      SR = f2(LC + ProfitAmt);
    } else {
      SR = isNewRow ? f2(MRP) : (vn(form.SalesRate) || f2(MRP));
    }
  }

  let finalMRP = MRP;
  if (sessFlags && sessFlags.univercell) {
    // mirrors jQuery: MRP = SalesRate when univercell=true
    finalMRP = f2(ro(SR));
  }

  return { GSTAmt:f2(GSTAmt),CESSAmt:f2(CessAmt),TransAmt:f2(TrAmt),LandingCost:f2(LC),
           DMAmt:f2(DlrAmt),DMPer:f2(DlrPer),ProfitAmt:f2(ProfitAmt),SalesRate:SR,
           ...(sessFlags && sessFlags.univercell ? { MRP: finalMRP } : {}) };
}
function calcFromSR(form) {
  const LC=vn(form.LandingCost), SR=vn(form.SalesRate);
  return { ...form, ProfitPer: f2(SR-LC>0&&LC>0?ro((SR-LC)/LC*100):0) };
}
function calcFromPA(form) {
  const LC=vn(form.LandingCost), PA=vn(form.ProfitAmt);
  return { ...form, ProfitPer: LC>0?f2(PA/LC*100):0 };
}

// ─── FORMAT ROW DECIMALS (mirrors JS forEach decimal fixes) ───
const F2K=["MRP","PurchaseRate","GST","GSTAmt","TransPer","TransAmt","CESS","CESSAmt","SPLCESS",
           "LandingCost","ProfitPer","ProfitAmt","SalesRate","WholeSaleRate","SaleDiscountPer",
           "SaleDiscountAmt","ReorderLevelMin","ReorderLevelMax","CRMPoints","DMPer","DMAmt",
           "CardRate","LessAmt","NomsPCRate"];
const F3K=["NetWeight"];
const INK=["ExpriyDays","ExpiryBeforeDays","NomsQty"];
function fmtRow(obj) {
  const r={...obj};
  F2K.forEach(k=>{ if(r[k]!==undefined) r[k]=parseFloat(vn(r[k]).toFixed(2)); });
  F3K.forEach(k=>{ if(r[k]!==undefined) r[k]=parseFloat(vn(r[k]).toFixed(3)); });
  INK.forEach(k=>{ if(r[k]!==undefined) r[k]=parseInt(vn(r[k]))||0; });
  return r;
}


// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
export default function ItemMaster() {

  // ── Session ──
  const [sess] = useState(() => {
    try {
      const menulist = getLocal("menulist") || [];
      const main0 = (getLocal("Mainsetting")    || [{}])[0] || {};
      const com0  = (getLocal("Companysetting") || [{}])[0] || {};
      const Comid = getStr("Comid") || "1";
      const MComid = getStr("MComid") || Comid;
      const IdComList = getStr("IdComList") || Comid;
      const CC = !!main0.CommonCompany;
      return {
        Comid: CC ? MComid : Comid, MComid, IdComList,
        Tamil:!!main0.ProductNameTamil, CommonCompany:CC,
        CommonCompanyDiffStock:!!main0.CommonCompanyDiffStock,
        SupplierMulitipleAllow:!!main0.SupplierMulitipleAllow,
        BranchSaleRate:!!main0.BranchWiseSaleRate,
        MulipleMRP:!!com0.MultiMRP, MirrorTable:0,
        LandingCostCompare:!!main0.LandingCostCompare,
        PurchaseProfitSaleRateChange:!!main0.PurchaseProfitSaleRateChange,
        univercell:!!main0.univercell,
        MultipleUOMBilling:!!main0.MultipleUOMBilling,
        GroupCommission:!!main0.GroupCommission,
        subwebcategory:!!main0.MobilePrint3Inch,
        Ecotech:!!main0.Ecotech,
        Productcodeautogen:!!com0.PCode_Auto,
        Productcodedigit: com0.PCode_Digits || 0,
        Productcodeprefix: com0.PCode_Prefix || "",
        menudata: menulist.filter(o => o.PageName === "Item Master"),
      };
    } catch {
      return { Comid:"1",MComid:"1",IdComList:"1",Tamil:false,CommonCompany:false,
               CommonCompanyDiffStock:false,SupplierMulitipleAllow:false,BranchSaleRate:false,
               MulipleMRP:false,MirrorTable:0,LandingCostCompare:false,
               PurchaseProfitSaleRateChange:false,Ecotech:false,
               univercell:false,MultipleUOMBilling:false,GroupCommission:false,subwebcategory:false,
               Productcodeautogen:false,Productcodedigit:0,Productcodeprefix:"",menudata:[] };
    }
  });
  const perm = sess.menudata[0] || { View:1, Add:1, Edit:1, Delete:1 };

  // ── Columns ──
  const [cols, setCols] = useState(() => {
    try { const s = localStorage.getItem("imCols"); return s ? JSON.parse(s) : DEFAULT_COLS; }
    catch { return DEFAULT_COLS; }
  });
  const [showCS, setShowCS] = useState(false);
  const [showCfg, setShowCfg] = useState(false);
  const [draft, setDraft]   = useState([]);
  const [csSrch, setCsSrch] = useState("");

  // ── Core state ──
  const [rows,    setRows]    = useState([]);
  const [form,    setForm]    = useState(mkEmpty());
  const [selId,   setSelId]   = useState(null);
  const [editId,  setEditId]  = useState(null);
  const [page,    setPage]    = useState(1);
  const [totCnt,  setTotCnt]  = useState(0);
  const [fCode,   setFCode]   = useState("");
  const [fName,   setFName]   = useState("");
  const [vErr,    setVErr]    = useState("");
  const [loading, setLoading] = useState(false);
  const [ldMsg,   setLdMsg]   = useState("Loading...");
  const [toasts,  setToasts]  = useState([]);

 

  // ── Dropdowns ──
  const [brandL, setBrandL] = useState([]);
  const [catL,   setCatL]   = useState([]);
  const [deptL,  setDeptL]  = useState([]);
  const [deptAll,setDeptAll]= useState([]);
  const [supL,   setSupL]   = useState([]);
  const [uomL,   setUomL]   = useState([]);
  const [locL,   setLocL]   = useState([]);

  // ── Popups ──
  const [ddPop,    setDdPop]    = useState(null);
  const [ddQ,      setDdQ]      = useState("");
  const [msgState, setMsgState] = useState(null);
  const [pw,       setPw]       = useState(null);
  const [pwVal,    setPwVal]    = useState("");
  const [bcOpen,   setBcOpen]   = useState(false);
  const [barcodes, setBarcodes] = useState([]);
  const [bcNew,    setBcNew]    = useState("");
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitRows, setUnitRows] = useState([]);
  const [bsrOpen,  setBsrOpen]  = useState(false);
  const [bsrRows,  setBsrRows]  = useState([]);
  // Group Commission (mirrors jQuery btnsave1: /ItemMaster/InsertGroupCommission)
  const [gcOpen,   setGcOpen]   = useState(false);
  const [gcRows,   setGcRows]   = useState([]);
  const [tnOpen,   setTnOpen]   = useState(false);
  const [tnVal,    setTnVal]    = useState("");
  const [imgOpen,  setImgOpen]  = useState(false);
  const [imgUrl,   setImgUrl]   = useState("");

  // ── Refs ──
  const fRef  = useRef(null);
  const gRef  = useRef(null);
  const drag  = useRef({ on:false,x:0,y:0,sl:0,st:0 });
  const sync  = useRef(false);
  const idCtr = useRef(0);

  // ── Toast ──
  

  const saveCfgUrl = () => {
    // Since BASE_URL is a constant in this file, to change the server
    // you need to edit BASE_URL at the top of this file.
    // This button just closes the modal.
    setShowCfg(false);
    toast(`✅ Server URL is: ${BASE_URL || "(same origin)"}`);
  };

  const toast = useCallback((m, err=false) => {
    const id = Date.now();
    setToasts(p => [...p, { id,m,err }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  // ── Confirm / Alert helpers ──
  const doConfirm = useCallback((text, onYes, onNo) => {
    setMsgState({ text, yesNo:true,
      onYes:()=>{ setMsgState(null); onYes(); },
      onNo: ()=>{ setMsgState(null); if(onNo) onNo(); }
    });
  }, []);
  const doAlert = useCallback((text) => {
    setMsgState({ text, yesNo:false, onYes:()=>setMsgState(null) });
  }, []);

  // ── Ask Password ──
  const askPw = useCallback((title, onOk) => {
    setPw({ title, onOk }); setPwVal("");
  }, []);
  const submitPw = async () => {
    if (!pwVal) return;
    const res = await api("/Login/EditPassword", { password:pwVal, type:"EditPassword", Comid:sess.Comid });
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) { const cb=pw.onOk; setPw(null); setPwVal(""); cb(); }
    else window.alert("Invalid Password !!!.");
  };

  // ── Load column config ──
  const loadColCfg = useCallback(async () => {
    const data = await apiGet(`/Content/Appdata/Visible/${sess.Comid}/Itemmaster.json`);
    if (!data || !data.length) return;
    setCols(prev => {
      const u = [...prev];
      data.forEach(d => {
        const i = u.findIndex(c => c.key === d.column);
        if (i !== -1) u[i] = { ...u[i], visible:d.Visible!==false, width:d.Width||u[i].width };
      });
      return u;
    });
  }, [sess.Comid]);

  const saveColCfg = useCallback(async (c) => {
    const payload = c.map(x => ({ filename:"Itemmaster",column:x.key,Visible:x.visible,Width:x.width,Comid:sess.Comid }));
    const res = await api("/Login/VisibleColumns", payload);
    if (!res._netErr && res.ok) toast("✅ Column settings saved.");
  }, [sess.Comid, toast]);

  // ── Load dropdowns ──
  // Mirrors jQuery: BrandList → /Brand/SelectBrand, CategoryList → /Category/SelectCategory,
  //   DepartmentList → /Department/SelectDepartment, SupplierList → /Supplier/GetSupplier,
  //   UOMList → /UOM/SelectUOM, LocationList → /Location/SelectLocation
  // All use data: '{"Comid":'+Comid+'}'  → POST body
  const loadDropdowns = useCallback(async () => {
    const [br,ca,de,su,uo,lo] = await Promise.all([
      api("/Brand/SelectBrand",           { Comid:sess.Comid }),
      api("/Category/SelectCategory",     { Comid:sess.Comid }),
      api("/Department/SelectDepartment", { Comid:sess.Comid }),
      api("/Supplier/GetSupplier",        { Comid:sess.Comid, AccountType:"SUPPLIER" }),
      api("/UOM/SelectUOM",               { Comid:sess.Comid }),
      api("/Location/SelectLocation",     { Comid:sess.Comid }),
    ]);
    // 404 check — means BASE_URL is wrong or server routes not available
    const has404 = [br,ca,de,su,uo,lo].some(r => r._http404);
    if (has404) {
      toast(`❌ 404 Not Found — check BASE_URL in code. Current: "${BASE_URL}"`, true);
      return;
    }
    // jQuery: getdata = data.data  (data is the ResponseViewModel, .data is Data property)
    if (!br._netErr && br.data) setBrandL(br.data);
    if (!ca._netErr && ca.data) setCatL(ca.data);
    if (!de._netErr && de.data) { setDeptL(de.data); setDeptAll(de.data); }
    if (!su._netErr && su.data) setSupL(su.data);
    if (!uo._netErr && uo.data) setUomL(uo.data);
    if (!lo._netErr && lo.data) setLocL(lo.data);
  }, [sess.Comid, toast]);

  // ── Load Item Master ──
  // Mirrors jQuery methods.loadItemMaster(Startindex, PageCount, Keyword, Column, loadstatus)
  // URL: "/ItemMaster/SelectItemMaster"
  // Headers: { 'Download': "0" }
  // Body:    { Comid, Startindex, PageCount, Keyword, Column }
  const loadItems = useCallback(async (startIdx, pageCnt, keyword="", column="", isInit=false) => {
    setLoading(true); setLdMsg("Loading Item Master...");
    const res = await api(
      "/ItemMaster/SelectItemMaster",
      { Comid:sess.Comid, Startindex:startIdx, PageCount:pageCnt, Keyword:keyword, Column:column },
      { "Download":"0" }
    );
    setLoading(false);
    if (res._http404) {
      toast(`❌ 404 Not Found: ${res.message} — verify BASE_URL="${BASE_URL}" is correct`, true);
      return;
    }
    if (res._netErr) { toast(`❌ Cannot reach server: ${res.message} — BASE_URL="${BASE_URL}"`, true); return; }
    // mirrors jQuery: if (data.redis == false) → alert + redirect
    if (res.redis === false) { window.alert("Already Login Another User Please Login Again!!!"); window.location.href="/Login"; return; }
    if (res.ok === false && !res.data) { toast(`⚠️ ${res.message || "Failed to load data"}`, true); return; }
    const arr = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
    // mirrors jQuery: if loadstatus==1 && Keyword=="" → use data.Count for pagination
    if (isInit) setTotCnt(res.Count || arr.length);
    setRows(arr.map(fmtRow));
    setPage(1);
  }, [sess.Comid, toast]);

  // ── Product Auto Gen ──
  // Mirrors jQuery ServiceCallById("/ItemMaster/MaxProductCode", ...) → objlist = Data1
  // C# MaxProductCode returns ResponseViewModel; MaxProductCode1 returns ro.Data1 directly.
  // We call MaxProductCode and read .Data1 (the max code integer).
  const autoGen = useCallback(async (currentCode) => {
    if (!sess.Productcodeautogen || String(currentCode||"").trim()) return null;
    const res = await api("/ItemMaster/MaxProductCode", { Comid:sess.Comid });
    if (res._netErr) return null;
    // C# MaxProductCode: if IsSuccess → returns ResponseViewModel; Data1 holds the max code
    // MaxProductCode1 returns ro.Data1 raw. Either way handle both:
    const max = Number(res.Data1 ?? res) || 0;
    if (sess.Productcodedigit > 0)
      return sess.Productcodeprefix + zp(max, sess.Productcodedigit);
    return sess.Productcodeprefix ? sess.Productcodeprefix + max : String(max);
  }, [sess]);

  // ── INIT ──
  useEffect(() => {
    (async () => {
      await loadColCfg();
      await loadDropdowns();
      await loadItems(-1, 20, "", "", true);
      // mirrors jQuery: if opened as a popup, pre-fill ProductCode/ProductName from sessionStorage
      const popVal  = sessionStorage.getItem("POPValue")  || "";
      const popVal1 = sessionStorage.getItem("POPValue1") || "";
      if (popVal || popVal1) {
        setForm(p => ({
          ...p,
          ...(popVal  ? { ProductCode: popVal  } : {}),
          ...(popVal1 ? { ProductName: popVal1 } : {}),
        }));
      }
    })();
  // eslint-disable-next-line
  }, []);

  // ── KEYBOARD SHORTCUTS ──
  const anyOpen = msgState || pw || ddPop || bcOpen || unitOpen || bsrOpen || gcOpen || tnOpen || imgOpen || showCS;
  useEffect(() => {
    const onKey = e => {
      if (anyOpen) return;
      if (e.key==="F1")     { e.preventDefault(); doSave(); }
      if (e.key==="F2")     { e.preventDefault(); handleUnitOpen(); }
      if (e.key==="F3")     { e.preventDefault(); askPw("F3 Password", ()=>{ window.location.href="/ItemMaster/Productopening"; }); }
      if (e.key==="F4")     { e.preventDefault(); askPw("F4 Password", doExcelDownload); }
      if (e.key==="F5")     { e.preventDefault(); sess.Ecotech ? (window.location.href="Customer/GroupItems") : handleBsrOpen(); }
      if (e.key==="F6")     { e.preventDefault(); handleTnOpen(); }
      if (e.key==="F7")     { e.preventDefault(); askPw("F7 Password", doExcelUpload); }
      if (e.key==="F9")     { e.preventDefault(); handleBcOpen(); }
      if (e.key==="F12")    { e.preventDefault(); openCS(); }
      if (e.key==="Delete") { doDelete(); }
      if (e.ctrlKey && e.key==="q") { e.preventDefault(); handleImgOpen(); }
      if (e.key==="Escape") { e.preventDefault(); doConfirm("Do You Want To Quit Page?", ()=>{ window.location.href="/Login/Home"; }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line
  }, [anyOpen, rows, form, selId, editId]);

  // ── Form change + auto-calc ──
  const onChange = e => {
    const { name, value, type, checked } = e.target;
    let nf = { ...form, [name]: type==="checkbox" ? checked : value };
    const isNew = editId === null;
    if (["PurchaseRate","GST","CESS","TransPer","MRP","ProfitPer"].includes(name)) nf = { ...nf, ...calc(nf, sess, isNew) };
    if (name==="SalesRate")  { if (!nf.LandingCost) nf={ ...nf, ...calc(nf, sess, isNew) }; nf=calcFromSR(nf); }
    if (name==="ProfitAmt")  { nf=calcFromPA(nf); nf={ ...nf, ...calc(nf, sess, isNew) }; }
    setVErr(""); setForm(nf);
  };

  // ── Combo config ──
  const comboCfg = {
    Brand:         { list:brandL, title:"Brand",      idKey:"Id", nameKey:"BrandName",     fId:"BrandId",         fName:"Brand" },
    Category:      { list:catL,   title:"Category",   idKey:"Id", nameKey:"Cat_Name",      fId:"CategoryId",      fName:"Category" },
    Department:    { list:deptL,  title:"Department", idKey:"Id", nameKey:"DepartmentName",fId:"DepartmentId",    fName:"Department" },
    Supplier:      { list:supL,   title:"Supplier",   idKey:"Id", nameKey:"AccountName",   fId:"SupplierId",      fName:"Supplier" },
    UOM:           { list:uomL,   title:"UOM",        idKey:"Id", nameKey:"UOMName",       fId:"UOMId",           fName:"UOM" },
    LocationMaster:{ list:locL,   title:"Location",   idKey:"Id", nameKey:"LocationName",  fId:"LocationMasterId",fName:"LocationMaster" },
  };
  const openCombo = field => {
    const cfg = comboCfg[field]; if (!cfg) return;
    let list = cfg.list;
    if (field==="Department" && form.CategoryId) {
      const sub = deptAll.filter(d => String(d.CategoryRefId)===String(form.CategoryId));
      if (sub.length) list = sub;
    }
    setDdPop({ ...cfg, list, field }); setDdQ(ns(form[cfg.fName]));
  };
  const selectDd = item => {
    setForm(p => ({ ...p, [ddPop.fName]:item[ddPop.nameKey], [ddPop.fId]:item[ddPop.idKey] }));
    setDdPop(null); setDdQ("");
  };

  // ── Validation ──
  const validate = f => {
    if (!String(f.ProductCode||"").trim()) { setVErr("❌ Product Code required."); return false; }
    if (!String(f.ProductName||"").trim()) { setVErr("❌ Description required.");  return false; }
    if (sess.LandingCostCompare) {
      if (vn(f.SalesRate)&&vn(f.LandingCost)>vn(f.SalesRate)) { setVErr("❌ Sale Rate < Landing Cost."); return false; }
      if (vn(f.MRP)&&vn(f.SalesRate)&&vn(f.MRP)<vn(f.SalesRate)) { setVErr("❌ Sale Rate > MRP."); return false; }
    }
    if (vn(f.MRP)&&vn(f.PurchaseRate)&&vn(f.MRP)<vn(f.PurchaseRate)) { setVErr("❌ Purchase Rate > MRP."); return false; }
    setVErr(""); return true;
  };

  // ── SAVE headers — mirrors jQuery InsertItemMaster headers exactly ──
  // jQuery: { 'Comid', 'BranchSaleRate', 'CommonCompany', 'CommonCompanyDiffStock',
  //           'SupplierMulitipleAllow', 'MulipleMRP', 'MirrorTable', 'Tamil', 'IdComList' }
  // Note: jQuery also sends 'ApiType' only in Excel upload path (not in regular SaveItemMaster)
  const saveHdrs = {
    "Comid":                  String(sess.Comid),
    "BranchSaleRate":         String(sess.BranchSaleRate),
    "CommonCompany":          String(sess.CommonCompany),
    "CommonCompanyDiffStock": String(sess.CommonCompanyDiffStock),
    "SupplierMulitipleAllow": String(sess.SupplierMulitipleAllow),
    "MulipleMRP":             String(sess.MulipleMRP),
    "MirrorTable":            String(sess.MirrorTable),
    "Tamil":                  String(sess.Tamil),
    "IdComList":              String(sess.IdComList),
    "ApiType":                "0",
  };
  // ── SAVE (F1) ──
  // Mirrors jQuery methods.SaveItemMaster()
  const doSave = () => {
    if (!validate(form)) return;

    // mirrors jQuery: pageadd=0 & pageedit=0 → deny all
    if (!perm.Add && !perm.Edit) { doAlert("Page Add & Update Permission Denied !!!."); return; }
    // mirrors jQuery: pageadd=1 & pageedit=0 → only new rows (Id == null / not yet saved)
    if (perm.Add && !perm.Edit && editId !== null) { doAlert("Page Edit Permission Denied !!!."); return; }
    // mirrors jQuery: pageadd=0 & pageedit=1 → only existing rows
    if (!perm.Add && perm.Edit && editId === null) { doAlert("Page Add Permission Denied !!!."); return; }

    doConfirm("Do you want to Save Item Master Details?", async () => {
      setLoading(true); setLdMsg("Saving...");
      const res = await api("/ItemMaster/InsertItemMaster", [{ ...form, EditMode:1 }], saveHdrs);
      setLoading(false);
      if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
      if (res.ok) {
        toast("✅ " + (res.message||"Saved successfully"));
        // C# InsertItemMaster: ro.Data2 = inserted Id (int), ro.Data1 = updated item object
        const nid = res.Data2 || res.Id || (editId !== null ? editId : ++idCtr.current);
        if (editId !== null) {
          setRows(p => p.map(r => r.Id===editId ? { ...form, Id:editId, EditMode:0 } : r));
        } else {
          setRows(p => [...p, { ...form, Id:nid, EditMode:0 }]);
        }
        const code = form.ProductCode;
        setForm(mkEmpty()); setSelId(null); setEditId(null); setVErr("");
        // mirrors jQuery: sessionStorage POPStatus handling after save
        if (sessionStorage.getItem("POPStatus") === "ON") {
          sessionStorage.setItem("POPValue", nid);
          sessionStorage.setItem("POPStatus", "OFF");
          try { window.parent.$('.ui-dialog-content:visible').dialog('close'); } catch {}
        }
        const genCode = await autoGen(code);
        if (genCode) setForm(p => ({ ...p, ProductCode:genCode }));
      } else {
        if (res.redis===false) { window.alert("Session expired"); window.location.href="/Login"; }
        else toast(`❌ ${res.message||"Save failed"}`, true);
      }
    });
  };

  // ── DELETE ──
  // Mirrors jQuery: url: "/ItemMaster/DeleteItemMaster", data: '{"Id":'+Id+',"Comid":'+Comid+',"MirrorTable":'+MirrorTable+'}'
  // C# signature: DeleteItemMaster(Int32 Id, Int32 Comid, int MirrorTable) — all query string params
  // IdComList goes as a header (C# reads Request.Headers.GetValues("IdComList"))
  const doDelete = () => {
    if (selId===null) { toast("Select a row to delete", true); return; }
    if (!perm.Delete) { toast("Delete Permission Denied", true); return; }
    const row = rows.find(r => r.Id===selId);
    doConfirm(`Wish to Delete "${row?.ProductName||selId}"?`, async () => {
      setLoading(true); setLdMsg("Deleting...");
      // C# reads Id, Comid, MirrorTable from query string (not body) for this endpoint
      const qs = `?Id=${selId}&Comid=${sess.Comid}&MirrorTable=${sess.MirrorTable}`;
      const res = await api("/ItemMaster/DeleteItemMaster" + qs, {},
        { "IdComList":String(sess.IdComList) });
      setLoading(false);
      if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
      if (res.ok) {
        toast("✅ " + (res.message||"Deleted"));
        setRows(p => p.filter(r => r.Id!==selId));
        setForm(mkEmpty()); setSelId(null); setEditId(null);
      } else {
        if (res.redis===false) { window.alert("Session expired"); window.location.href="/Login"; }
        else toast(`❌ ${res.message||"Delete failed"}`, true);
      }
    });
  };

  // ── EXCEL DOWNLOAD (F4) ──
  const doExcelDownload = async () => {
    setLoading(true); setLdMsg("Preparing Excel...");
    const res = await api("/ItemMaster/SelectItemMaster",
      { Comid:sess.Comid, Startindex:0, PageCount:20, Keyword:"Excel", Column:"Excel" },
      { "Download":"1" });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    const data1 = res.data || rows;
    if (!data1?.length) { toast("No records to export", true); return; }
    const fmt = data1.map((o,i) => {
      const r=fmtRow(o); const out={ SNo:i+1 };
      COLUMNS.forEach(c => { out[c.label] = r[c.key]??""; }); return out;
    });
    const hdr  = Object.keys(fmt[0]).join(",");
    const body = fmt.map(r => Object.values(r).map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([hdr+"\n"+body], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download="itemmaster.csv"; a.click();
    URL.revokeObjectURL(url); toast("✅ Excel downloaded");
  };

  // ── EXCEL UPLOAD (F7) ──
  // Mirrors jQuery ExcelUpload function:
  //   url: "/ItemMaster/InsertItemMaster", headers: { Comid, BranchSaleRate, CommonCompany,
  //     CommonCompanyDiffStock, SupplierMulitipleAllow, MulipleMRP, MirrorTable, Tamil, IdComList }
  // Note: jQuery Excel upload also adds 'ApiType' header (not present in regular save)
  const doExcelUpload = () => {
    const inp = document.createElement("input"); inp.type="file"; inp.accept=".xlsx,.csv";
    inp.onchange = async e => {
      const file = e.target.files[0]; if (!file) return;
      const text = await file.text();
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) { toast("Empty file", true); return; }
      const hdrs = lines[0].split(",").map(h => h.replace(/^"|"$/g,"").trim());
      const records = lines.slice(1)
        .map(line => { const vals=line.split(",").map(v=>v.replace(/^"|"$/g,"").trim()); const o={}; hdrs.forEach((h,i)=>{o[h]=vals[i]||"";}); return o; })
        .filter(o => o.ProductName);
      if (!records.length) { toast("No valid ProductName rows in file", true); return; }
      doConfirm(`Import ${records.length} records?`, async () => {
        setLoading(true); setLdMsg("Uploading...");
        // jQuery Excel upload includes ApiType=0 in headers
        const uploadHdrs = { ...saveHdrs, "ApiType":"0" };
        const res = await api("/ItemMaster/InsertItemMaster", records, uploadHdrs);
        setLoading(false);
        if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
        if (res.ok) { toast("✅ " + (res.message||"Upload successful")); await loadItems(-1,20,"","",true); }
        else toast(`❌ ${res.message||"Upload failed"}`, true);
      });
    };
    inp.click();
  };

  // ── BARCODE (F9) ──
  const handleBcOpen = async () => {
    if (!selId) { toast("Select a row first", true); return; }
    const res = await api("/ItemMaster/SelectItemBarcode", { Id:selId, Comid:sess.Comid });
    setBarcodes(!res._netErr && res.data ? res.data : []);
    setBcNew(""); setBcOpen(true);
  };
  const addBc = () => {
    if (!bcNew.trim()) return;
    if (barcodes.some(b=>b.Barcode===bcNew.trim())) { toast("Duplicate barcode", true); return; }
    setBarcodes(p=>[...p,{Barcode:bcNew.trim(),Id:null}]); setBcNew("");
  };
  const saveBc = async () => {
    // Mirrors jQuery btnsave2: headers { 'ItemId': value, 'MComid': MComid, 'MirrorTable': MirrorTable, 'IdComList': IdComList }
    setLoading(true); setLdMsg("Saving barcodes...");
    const res = await api("/ItemMaster/InsertItemBarcode", barcodes,
      { "ItemId":String(selId), "MComid":String(sess.MComid),
        "MirrorTable":String(sess.MirrorTable), "IdComList":String(sess.IdComList) });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) { toast("✅ " + (res.message||"Barcodes saved")); setBcOpen(false); }
    else toast(`❌ ${res.message||"Failed"}`, true);
  };

  // ── UNIT MASTER (F2) ──
  const handleUnitOpen = async () => {
    if (!selId) { toast("Select a row first", true); return; }
    const res = await api("/ItemMaster/SelectUnitMaster", { Id:selId });
    setUnitRows(!res._netErr && res.data ? res.data : []); setUnitOpen(true);
  };
  const saveUnit = async () => {
    setLoading(true); setLdMsg("Saving Unit Master...");
    const res = await api("/ItemMaster/InsertUnitMaster", unitRows, { "ItemId":String(selId) });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) { toast("✅ " + (res.message||"Unit saved")); setUnitOpen(false); }
    else toast(`❌ ${res.message||"Failed"}`, true);
  };

  // ── GROUP COMMISSION ──
  // Mirrors jQuery btnsave1: url: "/ItemMaster/InsertGroupCommission"
  // headers: { 'ItemId': value, 'MComid': MComid, 'MirrorTable': MirrorTable }
  const handleGcOpen = async () => {
    if (!selId) { toast("Select a row first", true); return; }
    const res = await api("/ItemMaster/SelectGroupCommission", { Id:selId });
    setGcRows(!res._netErr && res.data ? res.data : []); setGcOpen(true);
  };
  const saveGc = async () => {
    setLoading(true); setLdMsg("Saving Group Commission...");
    const res = await api("/ItemMaster/InsertGroupCommission", gcRows,
      { "ItemId":String(selId), "MComid":String(sess.MComid), "MirrorTable":String(sess.MirrorTable) });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) { toast("✅ " + (res.message||"Saved")); setGcOpen(false); }
    else toast(`❌ ${res.message||"Failed"}`, true);
  };

  // ── BRANCH SALE RATE (F5) ──
  const handleBsrOpen = async () => {
    if (!selId) { toast("Select a row first", true); return; }
    const res = await api("/ItemMaster/SelectBranchSaleRate", { Id:selId });
    setBsrRows(!res._netErr && res.data ? res.data : []); setBsrOpen(true);
  };
  const saveBsr = async () => {
    setLoading(true); setLdMsg("Saving Branch Sale Rate...");
    const res = await api("/ItemMaster/UpdateBranchSaleRate", bsrRows, { "ItemId":String(selId) });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) { toast("✅ " + (res.message||"Saved")); setBsrOpen(false); }
    else toast(`❌ ${res.message||"Failed"}`, true);
  };

  // ── TAMIL NAME (F6) ──
  const handleTnOpen = () => {
    const sel = rows.find(r => r.Id===selId);
    setTnVal(sel ? ns(sel.PrinterName) : ""); setTnOpen(true);
  };
  const saveTn = () => {
    if (selId!==null) {
      setRows(p=>p.map(r=>r.Id===selId?{...r,PrinterName:tnVal}:r));
      if (editId===selId) setForm(f=>({...f,PrinterName:tnVal}));
    }
    setTnOpen(false); toast("✅ Tamil/Printer name updated");
  };

  // ── IMAGE WINDOW (Ctrl+Q) ──
  const handleImgOpen = () => {
    const sel = rows.find(r => r.Id===selId);
    setImgUrl(sel ? ns(sel.ProductImage) : ""); setImgOpen(true);
  };
  const saveImg = async () => {
    if (!selId) { setImgOpen(false); return; }
    setLoading(true); setLdMsg("Saving image...");
    const res = await api("/ItemMaster/UpdateImage", { Id:selId, Img:imgUrl });
    setLoading(false);
    if (res._netErr) { toast(`❌ ${res.message}`, true); return; }
    if (res.ok) {
      toast("✅ " + (res.message||"Image updated"));
      setRows(p=>p.map(r=>r.Id===selId?{...r,ProductImage:imgUrl}:r));
      setImgOpen(false);
    } else toast(`❌ ${res.message||"Failed"}`, true);
  };
  const uploadImgFile = e => {
    // Mirrors jQuery ImageUpload: uploads to /ItemMaster/ImageUpload
    // C# ImageUpload saves file and returns the filename (guid + ext)
    const file = e.target.files[0]; if (!file) return;
    const data = new FormData(); data.append("MyImages", file);
    fetch(mkUrl("/ItemMaster/ImageUpload"), { method:"POST", body:data })
      .then(r=>r.text()).then(fname=>setImgUrl(fname.replace(/^"|"$/g,"")))
      .catch(()=>toast("Image upload failed", true));
  };

  // ── Row click / New ──
  const rowClick = row => { setSelId(row.Id); setEditId(row.Id); setForm({ ...mkEmpty(), ...row }); setVErr(""); };
  const doNew    = () => { setForm(mkEmpty()); setSelId(null); setEditId(null); setVErr(""); };

  // ── Column Settings ──
  const openCS = () => { setDraft(cols.map(c=>({...c}))); setCsSrch(""); setShowCS(true); };
  const saveCS = async () => {
    setCols(draft); try { localStorage.setItem("imCols", JSON.stringify(draft)); } catch {}
    await saveColCfg(draft); setShowCS(false);
  };
  const csToggle = i => { const u=[...draft]; u[i]={...u[i],visible:!u[i].visible}; setDraft(u); };
  const csW = (i,v) => { const u=[...draft]; u[i]={...u[i],width:Number(v)||u[i].width}; setDraft(u); };
  const csFilt   = draft.filter(c => c.label.toLowerCase().includes(csSrch.toLowerCase()) || c.key.toLowerCase().includes(csSrch.toLowerCase()));
  const visCount = draft.filter(c=>c.visible).length;

  // ── Pagination ──
  const filtered  = rows.filter(r =>
    String(r.ProductCode||"").toLowerCase().includes(fCode.toLowerCase()) &&
    String(r.ProductName||"").toLowerCase().includes(fName.toLowerCase())
  );
  const totPages  = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paged     = filtered.slice((page-1)*ROWS_PER_PAGE, page*ROWS_PER_PAGE);
  const pageNums  = Array.from({ length:Math.min(totPages,8) }, (_,i)=>i+1);
  const visCols   = cols.filter(c=>c.visible);
  const totW      = SNO_W + visCols.reduce((s,c)=>s+c.width,0);

  // ── Scroll sync / drag ──
  const onScroll = useCallback(() => {
    if (sync.current) return; sync.current=true;
    if (fRef.current && gRef.current) fRef.current.scrollLeft = gRef.current.scrollLeft;
    sync.current=false;
  }, []);
  const onMD = e => { const el=gRef.current; drag.current={on:true,x:e.pageX-el.offsetLeft,y:e.pageY-el.offsetTop,sl:el.scrollLeft,st:el.scrollTop}; };
  const onML = () => { drag.current.on=false; };
  const onMU = () => { drag.current.on=false; };
  const onMM = e => {
    if (!drag.current.on) return; e.preventDefault();
    const el=gRef.current;
    el.scrollLeft=drag.current.sl-((e.pageX-el.offsetLeft)-drag.current.x)*1.4;
    el.scrollTop =drag.current.st-((e.pageY-el.offsetTop )-drag.current.y)*1.4;
  };

  // ── Cell renderer ──
  const renderCell = (col, row) => {
    const v = row[col.key];
    if (col.bool)        return v ? <span className="y">✓</span> : <span className="n">✗</span>;
    if (col.type==="f2") return vn(v).toFixed(2);
    if (col.type==="f3") return vn(v).toFixed(3);
    if (col.type==="int")return String(parseInt(vn(v))||"");
    return v ?? "";
  };

  const ddFilt = ddPop ? ddPop.list.filter(x => String(x[ddPop.nameKey]||"").toLowerCase().includes(ddQ.toLowerCase())) : [];

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="im">

        {/* HEADER */}
        <div className="hdr">
          <div className="hdr-brand">
            <div className="hdr-icon">D</div>
            <div><div className="hdr-name">Dreams POS</div><div className="hdr-sub">Billing</div></div>
          </div>
          <div className="hdr-title">⬛ KASSA BM — Item Master</div>
          <div className="hdr-user">
            <div className="hdr-avatar">👤</div>
            <div><div className="hdr-uname">Co: {sess.Comid}</div><div className="hdr-urole">Administrator</div></div>
          </div>
        </div>

        <div className="body">

          {/* TITLE BAR */}
          <div className="tbar">
            <span className="tbar-txt">📋 Item Master</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{display:"flex",gap:3}}>
                {pageNums.map(n=>(
                  <button key={n} className={`pgbtn${page===n?" on":""}`} onClick={()=>setPage(n)}>{n}</button>
                ))}
                {totPages>8&&<span style={{color:"#8b99b5",fontSize:11}}>…</span>}
              </div>
              <span className="badge">Rows: {rows.length}{totCnt>rows.length?` / ${totCnt}`:""}</span>
              {editId&&<span className="badge-w">✏️ Editing #{editId}</span>}
              {vErr&&<span className="verr">{vErr}</span>}
            </div>
          </div>

          {/* FILTER BAR */}
          <div className="fbar">
            <span style={{fontWeight:700,color:"#e8a020",fontSize:12}}>🔍</span>
            <span className="flbl">Code</span>
            <input className="finp" style={{width:110}} value={fCode}
              onChange={e=>{setFCode(e.target.value);setPage(1);}}
              onKeyDown={e=>{ if(e.key==="Enter"&&fCode) loadItems(0,0,fCode,"ProductCode",false); }}
              placeholder="Search…"/>
            <span className="flbl">Name</span>
            <input className="finp" style={{width:140}} value={fName}
              onChange={e=>{setFName(e.target.value);setPage(1);}}
              onKeyDown={e=>{ if(e.key==="Enter"&&fName) loadItems(0,0,fName,"ProductName",false); }}
              placeholder="Search…"/>
            <button className="fb ex" style={{height:23,padding:"0 9px",fontSize:10}}
              onClick={()=>loadItems(-1,20,"","",true)}>🔄 Reload</button>
            <span style={{marginLeft:"auto",fontSize:11,color:"#8b99b5"}}>
              {paged.length}/{filtered.length} — Enter to server-search
            </span>
          </div>

          {/* FORM STRIP + GRID */}
          <div className="grid-wrap">

            {/* FORM STRIP */}
            <div className="fstrip-scroll" ref={fRef}>
              <div className="fstrip" style={{width:totW}}>
                <div style={{width:SNO_W,minWidth:SNO_W,flexShrink:0}}/>
                {visCols.map(col => {
                  const cd = COLUMNS.find(c=>c.key===col.key) || {};
                  return (
                    <div key={col.key} className="fcell" style={{width:col.width,minWidth:col.width}}>
                      <label title={col.key}>{col.label}{cd.calc?" 🔒":""}</label>
                      {cd.bool ? (
                        <select value={form[col.key]?"Yes":"No"}
                          onChange={e=>{setForm(p=>({...p,[col.key]:e.target.value==="Yes"}));setVErr("");}}>
                          <option value="No">No</option><option value="Yes">Yes</option>
                        </select>
                      ) : cd.isCombo ? (
                        <input className="combo" value={form[col.key]||""} readOnly
                          placeholder={"▼ "+col.label}
                          onClick={()=>openCombo(col.key)}
                          onKeyDown={e=>{if(e.key==="Enter"||e.key==="F4")openCombo(col.key);}}/>
                      ) : cd.calc ? (
                        <input className="calc" readOnly value={form[col.key]!==""?form[col.key]:""} placeholder="Auto"/>
                      ) : cd.type==="f2"||cd.type==="f3" ? (
                        <input type="number" step={cd.type==="f3"?"0.001":"0.01"}
                          name={col.key} value={form[col.key]||""} onChange={onChange} placeholder="0.00"/>
                      ) : cd.type==="int" ? (
                        <input type="number" step="1" name={col.key} value={form[col.key]||""} onChange={onChange} placeholder="0"/>
                      ) : (
                        <input name={col.key} value={form[col.key]||""} onChange={onChange} placeholder={col.label}/>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* GRID */}
            <div className="gscroll" ref={gRef} onScroll={onScroll}
              onMouseDown={onMD} onMouseLeave={onML} onMouseUp={onMU} onMouseMove={onMM}>
              <table className="gtbl" style={{width:totW}}>
                <thead><tr>
                  <th className="sno" style={{width:SNO_W,minWidth:SNO_W}}>S.No</th>
                  {visCols.map(c=><th key={c.key} style={{width:c.width,minWidth:c.width}}>{c.label}</th>)}
                </tr></thead>
                <tbody>
                  {paged.length===0 ? (
                    <tr><td colSpan={visCols.length+1} className="empty-td">
                      📭 No records — fill the form above and press <strong>F1 Save</strong>
                    </td></tr>
                  ) : paged.map((row,idx)=>(
                    <tr key={row.Id}
                      className={[selId===row.Id?"sel":"",row.Active===false?"inact":"",row.EditMode===1?"mod":""].filter(Boolean).join(" ")}
                      onClick={()=>rowClick(row)}>
                      <td className="sno">{(page-1)*ROWS_PER_PAGE+idx+1}</td>
                      {visCols.map(c=>{
                        const cd=COLUMNS.find(x=>x.key===c.key)||{};
                        return (
                          <td key={c.key} style={{width:c.width,textAlign:cd.type&&!cd.bool?"right":"left"}}>
                            {renderCell(cd,row)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="ftr">
          <button className="fb sv"  onClick={doSave}          disabled={loading}>💾 F1-Save</button>
          <span className="fsep">|</span>
          <button className="fb nw"  onClick={doNew}>➕ New</button>
          <span className="fsep">|</span>
          <button className="fb"     onClick={()=>askPw("F3 Password",()=>window.location.href="/ItemMaster/Productopening")}>📦 F3-Opening</button>
          <span className="fsep">|</span>
          <button className="fb ex"  onClick={()=>askPw("F4 Password",doExcelDownload)} disabled={loading}>📥 F4-Excel↓</button>
          <span className="fsep">|</span>
          <button className="fb"     onClick={handleUnitOpen}  disabled={!selId}>🔢 F2-Units</button>
          <span className="fsep">|</span>
          <button className="fb"     onClick={sess.Ecotech ? ()=>window.location.href="Customer/GroupItems" : handleBsrOpen} disabled={!selId&&!sess.Ecotech}>🏪 F5-{sess.Ecotech?"GroupItems":"BranchRate"}</button>
          <span className="fsep">|</span>
          {sess.GroupCommission&&<><button className="fb" onClick={handleGcOpen} disabled={!selId}>💰 GrpCommission</button><span className="fsep">|</span></>}
          <button className="fb"     onClick={handleTnOpen}    disabled={!selId}>🌐 F6-TamilName</button>
          <span className="fsep">|</span>
          <button className="fb ex"  onClick={()=>askPw("F7 Password",doExcelUpload)} disabled={loading}>📤 F7-Excel↑</button>
          <span className="fsep">|</span>
          <button className="fb"     onClick={handleBcOpen}    disabled={!selId}>🏷️ F9-Barcode</button>
          <span className="fsep">|</span>
          <button className="fb"     onClick={handleImgOpen}   disabled={!selId}>🖼️ Image</button>
          <span className="fsep">|</span>
          <button className="fb dl"  onClick={doDelete}        disabled={!selId||loading}>🗑️ Del</button>
          <span className="fsep">|</span>
          <button className="fb cf"  onClick={openCS}>⚙️ F12</button>
          <span className="fsep">|</span>
         
        </div>

        {/* ── DROPDOWN POPUP ── */}
        {ddPop&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget){setDdPop(null);setDdQ("");}}}>
            <div className="dd-modal">
              <div className="dd-hdr">🔽 {ddPop.title}
                <button onClick={()=>{setDdPop(null);setDdQ("");}}>✕</button></div>
              <input className="dd-srch" autoFocus value={ddQ} onChange={e=>setDdQ(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&ddFilt.length)selectDd(ddFilt[0]);if(e.key==="Escape"){setDdPop(null);setDdQ("");}}}
                placeholder={`Search ${ddPop.title}...`}/>
              <div className="dd-list">
                {ddFilt.length===0
                  ?<div className="dd-empty">No result s</div>
                  :ddFilt.map(item=>(
                    <div key={item[ddPop.idKey]}
                      className={`dd-item${String(form[ddPop.fId])===String(item[ddPop.idKey])?" hi":""}`}
                      onClick={()=>selectDd(item)}>
                      {item[ddPop.nameKey]}
                    </div>
                  ))}
              </div>
              <div className="dd-create">+ Create new {ddPop.title}</div>
            </div>
          </div>
        )}

        {/* ── BARCODE WINDOW (F9) ── */}
        {bcOpen&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setBcOpen(false);}}>
            <div className="bc-modal">
              <div className="dd-hdr">🏷️ Barcodes — Item #{selId}
                <button onClick={()=>setBcOpen(false)}>✕</button></div>
              <div className="bc-body">
                <div className="bc-row">
                  <input className="bc-inp" placeholder="Enter barcode..." value={bcNew}
                    onChange={e=>setBcNew(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter")addBc();}}/>
                  <button className="bc-add" onClick={addBc}>+ Add</button>
                </div>
                {barcodes.length===0
                  ?<div style={{textAlign:"center",color:"#b0bbd4",padding:14,fontSize:11}}>No barcodes</div>
                  :barcodes.map((b,i)=>(
                    <div key={i} className="bc-row">
                      <input className="bc-inp" value={b.Barcode}
                        onChange={e=>setBarcodes(p=>p.map((x,j)=>j===i?{...x,Barcode:e.target.value}:x))}/>
                      <button className="bc-del" onClick={()=>setBarcodes(p=>p.filter((_,j)=>j!==i))}>🗑</button>
                    </div>
                  ))}
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setBcOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveBc} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── UNIT MASTER (F2) ── */}
        {unitOpen&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setUnitOpen(false);}}>
            <div className="unit-modal">
              <div className="dd-hdr">🔢 Unit Master — Item #{selId}
                <button onClick={()=>setUnitOpen(false)}>✕</button></div>
              <div className="unit-body">
                <table className="utbl">
                  <thead><tr><th>UOM Name</th><th>Nos</th><th>Sale Rate</th><th>Default</th><th style={{width:32}}></th></tr></thead>
                  <tbody>
                    {unitRows.map((r,i)=>(
                      <tr key={i}>
                        <td><input value={r.UOMName||""} onChange={e=>setUnitRows(p=>p.map((x,j)=>j===i?{...x,UOMName:e.target.value}:x))}/></td>
                        <td><input type="number" value={r.Nos||""} onChange={e=>setUnitRows(p=>p.map((x,j)=>j===i?{...x,Nos:e.target.value}:x))}/></td>
                        <td><input type="number" step="0.01" value={r.SaleRate||""} onChange={e=>setUnitRows(p=>p.map((x,j)=>j===i?{...x,SaleRate:e.target.value}:x))}/></td>
                        <td><select value={r.Default1||"0"} onChange={e=>setUnitRows(p=>p.map((x,j)=>j===i?{...x,Default1:e.target.value}:x))}>
                          <option value="0">No</option><option value="1">Yes</option></select></td>
                        <td><button className="bc-del" onClick={()=>setUnitRows(p=>p.filter((_,j)=>j!==i))}>🗑</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="bc-add" style={{marginTop:7}}
                  onClick={()=>setUnitRows(p=>[...p,{UOMName:"",Nos:"",SaleRate:"",Default1:"0"}])}>+ Add Row</button>
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setUnitOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveUnit} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── BRANCH SALE RATE (F5) ── */}
        {bsrOpen&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setBsrOpen(false);}}>
            <div className="bsr-modal">
              <div className="dd-hdr">🏪 Branch Sale Rate — Item #{selId}
                <button onClick={()=>setBsrOpen(false)}>✕</button></div>
              <div className="unit-body">
                <table className="utbl">
                  <thead><tr><th>Branch</th><th>Sale Rate</th></tr></thead>
                  <tbody>
                    {bsrRows.length===0
                      ?<tr><td colSpan={2} style={{textAlign:"center",color:"#b0bbd4",padding:14,fontSize:11}}>No branches</td></tr>
                      :bsrRows.map((r,i)=>(
                        <tr key={i}>
                          <td><input value={r.BranchName||""} readOnly style={{background:"#f8f9fb"}}/></td>
                          <td><input type="number" step="0.01" value={r.SaleRate||""} onChange={e=>setBsrRows(p=>p.map((x,j)=>j===i?{...x,SaleRate:e.target.value}:x))}/></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setBsrOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveBsr} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── GROUP COMMISSION — mirrors jQuery GroupCommissionWindow + btnsave1 ── */}
        {gcOpen&&sess.GroupCommission&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setGcOpen(false);}}>
            <div className="bsr-modal">
              <div className="dd-hdr">💰 Group Commission — Item #{selId}
                <button onClick={()=>setGcOpen(false)}>✕</button></div>
              <div className="unit-body">
                <table className="utbl">
                  <thead><tr><th>Group Name</th><th>Commission %</th><th>Active</th><th style={{width:32}}></th></tr></thead>
                  <tbody>
                    {gcRows.length===0
                      ?<tr><td colSpan={4} style={{textAlign:"center",color:"#b0bbd4",padding:14,fontSize:11}}>No group commissions</td></tr>
                      :gcRows.map((r,i)=>(
                        <tr key={i}>
                          <td><input value={r.GroupName||""} onChange={e=>setGcRows(p=>p.map((x,j)=>j===i?{...x,GroupName:e.target.value}:x))}/></td>
                          <td><input type="number" step="0.01" value={r.Commisssion||""} onChange={e=>setGcRows(p=>p.map((x,j)=>j===i?{...x,Commisssion:e.target.value}:x))}/></td>
                          <td><select value={r.GrpActive||"0"} onChange={e=>setGcRows(p=>p.map((x,j)=>j===i?{...x,GrpActive:e.target.value}:x))}>
                            <option value="0">No</option><option value="1">Yes</option></select></td>
                          <td><button className="bc-del" onClick={()=>setGcRows(p=>p.filter((_,j)=>j!==i))}>🗑</button></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                <button className="bc-add" style={{marginTop:7}}
                  onClick={()=>setGcRows(p=>[...p,{GroupName:"",Commisssion:"",GrpActive:"1"}])}>+ Add Row</button>
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setGcOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveGc} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAMIL NAME (F6) ── */}
        {tnOpen&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setTnOpen(false);}}>
            <div className="tname-modal">
              <div className="dd-hdr">🌐 Tamil / Printer Name
                <button onClick={()=>setTnOpen(false)}>✕</button></div>
              <div className="modal-body">
                <label style={{fontSize:11,color:"#6b7a99",fontWeight:600}}>Tamil / Printer Name:</label>
                <input className="tname-inp" autoFocus value={tnVal}
                  onChange={e=>setTnVal(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter")saveTn();if(e.key==="Escape")setTnOpen(false);}}
                  placeholder="Enter Tamil name..."/>
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setTnOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveTn}>✅ Apply</button>
              </div>
            </div>
          </div>
        )}

        {/* ── IMAGE WINDOW (Ctrl+Q) ── */}
        {imgOpen&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setImgOpen(false);}}>
            <div className="img-modal">
              <div className="dd-hdr">🖼️ Product Image — #{selId}
                <button onClick={()=>setImgOpen(false)}>✕</button></div>
              <div className="modal-body">
                {imgUrl
                  ?<img className="img-preview" src={mkUrl("/Upload/" + imgUrl)} alt="product preview"/>
                  :<div className="img-no">No image selected</div>}
                <div className="img-row">
                  <input className="img-inp" value={imgUrl} onChange={e=>setImgUrl(e.target.value)} placeholder="Image filename…"/>
                  <label style={{border:"1px solid #d4dbe8",borderRadius:4,padding:"3px 10px",fontSize:11,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",background:"#f5f7fc"}}>
                    📁 Upload
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={uploadImgFile}/>
                  </label>
                </div>
              </div>
              <div className="mftr">
                <button className="mbtn-cancel" onClick={()=>setImgUrl("")}>Clear</button>
                <button className="mbtn-cancel" onClick={()=>setImgOpen(false)}>Cancel</button>
                <button className="mbtn-save"   onClick={saveImg} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── COLUMN SETTINGS (F12) ── */}
        {showCS&&(
          <div className="ov" onClick={e=>{if(e.target===e.currentTarget)setShowCS(false);}}>
            <div className="cs-modal">
              <div className="cs-hdr">
                <div className="cs-hdr-l">
                  <div className="cs-hdr-icon">⚙️</div>
                  <div><div className="cs-htitle">Column Settings</div>
                    <div className="cs-hsub">Toggle visibility · Adjust width · Saved to server + browser</div></div>
                </div>
                <button className="cs-close" onClick={()=>setShowCS(false)}>✕</button>
              </div>
              <div className="cs-bar">
                <input className="cs-srch" placeholder="🔍 Search columns…" value={csSrch} onChange={e=>setCsSrch(e.target.value)}/>
                <button className="cs-tbtn" onClick={()=>setDraft(draft.map(c=>({...c,visible:true})))}>✅ All</button>
                <button className="cs-tbtn" onClick={()=>setDraft(draft.map(c=>({...c,visible:false})))}>🚫 None</button>
                <button className="cs-tbtn" onClick={()=>setDraft(DEFAULT_COLS.map(c=>({...c})))}>↩ Default</button>
                <span className="cs-badge">{visCount}/{draft.length}</span>
              </div>
              <div className="cs-lhdr">
                <span>#</span><span>Column</span>
                <span style={{textAlign:"center"}}>Visible</span>
                <span style={{textAlign:"right"}}>Width</span>
              </div>
              <div className="cs-list">
                {csFilt.map(col=>{
                  const ri=draft.findIndex(c=>c.key===col.key);
                  return (
                    <div key={col.key} className={`cs-row${!col.visible?" off":""}`}>
                      <div className="cs-rnum">{ri+1}</div>
                      <div className="cs-rlbl">{col.label}</div>
                      <div style={{display:"flex",justifyContent:"center"}}>
                        <label className="toggle">
                          <input type="checkbox" checked={col.visible} onChange={()=>csToggle(ri)}/>
                          <div className="toggle-track"/>
                        </label>
                      </div>
                      <div><input type="number" className="cs-winp" value={col.width} min={40} max={600}
                        onChange={e=>csW(ri,e.target.value)}/></div>
                    </div>
                  );
                })}
              </div>
              <div className="cs-ftr">
                <span className="cs-finfo">Saves to <strong>server</strong> + localStorage</span>
                <button className="cs-cancel" onClick={()=>setShowCS(false)}>Cancel</button>
                <button className="cs-reset"  onClick={()=>setDraft(DEFAULT_COLS.map(c=>({...c})))}>↩ Reset</button>
                <button className="cs-save"   onClick={saveCS} disabled={loading}>💾 Save</button>
              </div>
            </div>
          </div>
        )}

        {/* ── PASSWORD WINDOW ── */}
        {pw&&(
          <div className="ov z25">
            <div className="pw-modal">
              <div className="pw-title">🔐 {pw.title}</div>
              <input className="pw-inp" type="password" autoFocus value={pwVal}
                onChange={e=>setPwVal(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")submitPw();if(e.key==="Escape"){setPw(null);setPwVal("");}}}
                placeholder="Enter password…"/>
              <div className="pw-btns">
                <button className="pw-cancel" onClick={()=>{setPw(null);setPwVal("");}}>Cancel</button>
                <button className="pw-ok"     onClick={submitPw}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* ── MESSAGE BOX ── */}
        {msgState&&(
          <div className="ov z30">
            <div className="msg-box">
              <div className="msg-title">{msgState.yesNo?"⚠️ Confirm":"ℹ️ Info"}</div>
              <div className="msg-text">{msgState.text}</div>
              <div className="msg-btns">
                {msgState.yesNo
                  ?<><button className="msg-no" onClick={msgState.onNo}>No</button>
                     <button className="msg-yes" onClick={msgState.onYes}>Yes</button></>
                  :<button className="msg-ok" onClick={msgState.onYes}>OK</button>}
              </div>
            </div>
          </div>
        )}

        {/* ── LOADER ── */}
        {loading&&(
          <div className="ldr-ov">
            <div className="ldr-box">
              <div className="ldr-spin"/>
              <div className="ldr-msg">{ldMsg}</div>
            </div>
          </div>
        )}

        {/* ── TOASTS ── */}
        <div className="toasts">
          {toasts.map(t=><div key={t.id} className={`toast${t.err?" err":""}`}>{t.m}</div>)}
        </div>  

      </div>
    </>
  );
}
