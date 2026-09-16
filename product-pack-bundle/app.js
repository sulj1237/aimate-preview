/* 상품 관리 > 적수 관리 — 적수 묶음 목록/상세 + 적수 매칭 목록(팝업) */

/* ── 상품 원본 (기존 상품 데이터) ───────────────────────────────
   dc   = 약품코드 — 상품 목록·상세에 출력되는 품목 식별 코드. 적수 변형끼리 같은 값을 쓴다.
   bc   = 바코드   — 적수별 단품을 식별한다.
   unit·qty = 기존 상품 데이터가 이미 가지고 있는 단위·적수(기본값 1).
   code = 내부 키(PRODUCT_CODE) — 화면에는 출력하지 않는다. */
const PRODUCTS = [
  { code:"P641702920", dc:"DA00004721", name:"박카스",              bc:"8801234567801", unit:"병", qty:1,   mk:"동아제약", buy:600,   sell:800,   stock:15 },
  { code:"P641702937", dc:"DA00004721", name:"박카스10",            bc:"8801234567802", unit:"병", qty:10,  mk:"동아제약", buy:5800,  sell:7500,  stock:3  },
  { code:"P641702944", dc:"DA00004721", name:"박카스 100병",        bc:"8801234567803", unit:"병", qty:100, mk:"동아제약", buy:56000, sell:70000, stock:1  },
  { code:"P730115502", dc:"JS00001803", name:"타이레놀500mg100정",  bc:"8805551234501", unit:"정", qty:1,   mk:"한국얀센", buy:7400,  sell:9800,  stock:4  },
  { code:"P730115519", dc:"JS00001803", name:"타이레놀 500mg 300정",bc:"8805551234502", unit:"정", qty:1,   mk:"한국얀센", buy:21000, sell:27000, stock:2  },
  { code:"P730115526", dc:"JS00001811", name:"타이레놀650mg100정",  bc:"8805551234503", unit:"정", qty:1,   mk:"한국얀센", buy:8300,  sell:11000, stock:5  },
  { code:"P815440071", dc:"KE00002250", name:"비타민C 500mg 100정", bc:"8807770001101", unit:"정", qty:100, mk:"고려은단", buy:9000,  sell:12000, stock:10 },
  { code:"P992018844", dc:"",           name:"덴탈마스크",          bc:"8809998887701", unit:"개", qty:1,   mk:"웰킵스",   buy:200,   sell:300,   stock:50 },
  { code:"P992018851", dc:"",           name:"덴탈마스크 대용량",    bc:"8809998887702", unit:"",   qty:1,   mk:"웰킵스",   buy:9000,  sell:12000, stock:5  },
  { code:"P708823310", dc:"DW00003318", name:"이지엔6이브 10정",     bc:"8806667770011", unit:"정", qty:1,   mk:"대웅제약", buy:3200,  sell:4500,  stock:8  },
  { code:"P708823327", dc:"DW00003318", name:"이지엔6이브 20정",     bc:"8806667770012", unit:"정", qty:1,   mk:"대웅제약", buy:6100,  sell:8500,  stock:2  },
  { code:"P708823334", dc:"DW00003318", name:"이지엔6이브 30정",     bc:"8806667770013", unit:"정", qty:1,   mk:"대웅제약", buy:8900,  sell:12500, stock:1  },
  { code:"P550317761", dc:"YH00005140", name:"종합비타민골드 30정",  bc:"8807771110011", unit:"정", qty:30,  mk:"유한양행", buy:12000, sell:16000, stock:2  },
  { code:"P550317778", dc:"YH00005140", name:"종합비타민골드 100정", bc:"8807771110012", unit:"정", qty:100, mk:"유한양행", buy:34000, sell:45000, stock:0  },
  { code:"P550317785", dc:"YH00005140", name:"종합비타민골드 60정",  bc:"8807771110013", unit:"정", qty:60,  mk:"유한양행", buy:21000, sell:28000, stock:3  },
  { code:"P600914233", dc:"DA00001102", name:"판피린큐",            bc:"8801111222201", unit:"병", qty:1,   mk:"동아제약", buy:900,   sell:1200,  stock:40 },
];
const P = (code) => PRODUCTS.find((p) => p.code === code);
const dcTxt = (code) => P(code).dc || "-";
/* 담기·추가할 때 채울 적수·단위 — 저장된 값이 기본값 1이면 상품명에서 읽은 값을 제안한다 */
function seedPack(code){
  const p = P(code), parsed = parsePack(p.name);
  if (parsed && p.qty === 1 && parsed.qty !== 1) return { qty: parsed.qty, unit: parsed.unit || p.unit };
  return { qty: p.qty, unit: p.unit };
}

/* ── 적수 묶음 (Mapping) ────────────────────────────────────── */
let GROUPS = [
  { id:"G001", name:"박카스", rep:"P641702920", upd:"2026-09-08",
    items:[ {code:"P641702920",qty:1,unit:"병"}, {code:"P641702937",qty:10,unit:"병"}, {code:"P641702944",qty:100,unit:"병"} ] },
  { id:"G002", name:"종합비타민골드", rep:"P550317761", upd:"2026-09-06",
    items:[ {code:"P550317761",qty:30,unit:"정"}, {code:"P550317778",qty:100,unit:"정"}, {code:"P550317785",qty:60,unit:"정"} ] },
];

/* ── 적수 후보 (미처리 매칭 그룹) ─────────────────────────── */
const CANDS = [
  { id:"C01", rank:1, items:[ { code:"P730115502", qty:100, unit:"정" }, { code:"P730115519", qty:300, unit:"정" } ] },
  { id:"C02", rank:2, items:[ { code:"P708823310", qty:10,  unit:"정" }, { code:"P708823327", qty:20,  unit:"정" }, { code:"P708823334", qty:30, unit:"정" } ] },
  { id:"C03", rank:3, items:[ { code:"P992018844", qty:1, unit:"개" }, { code:"P992018851", qty:1, unit:"" } ] },
];

/* ── 공통 ───────────────────────────────────────────────────── */
const TODAY = "2026-09-16";
const el = (id) => document.getElementById(id);
const won = (n) => (n === null || n === undefined ? "-" : Number(n).toLocaleString("ko-KR"));
const isUnk = (i) => i.qty === null || i.qty === undefined || !i.unit;
const packTxt = (i) => (isUnk(i) ? "-" : i.qty + i.unit);
const bundledCodes = () => new Set(GROUPS.flatMap((g) => g.items.map((i) => i.code)));

/* 상품명에서 포장정보(수량+단위)를 읽는다. 함량·용량 단위는 먼저 걷어낸다. */
const PACK_UNITS = ["정","캡슐","병","포","개","매","앰플","바이알","스틱","통"];
function parsePack(name){
  const stripped = String(name).replace(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|IU|%)/gi, " ");
  const re = new RegExp("(\\d+(?:\\.\\d+)?)\\s*(" + PACK_UNITS.join("|") + ")(?![가-힣])", "g");
  const m = [...stripped.matchAll(re)];
  return m.length ? { qty: Number(m[m.length-1][1]), unit: m[m.length-1][2] } : null;
}
/* 표시명 = 대표상품명(적수+단위).
   대표상품명은 포장 표기를 뺀 이름이므로, 구성 상품마다 같은 형식으로 떨어진다.
   예) 박카스(1병) · 박카스(10병) · 박카스(100병) / 타이레놀 500mg(300정) */
const coreName = (nm) => String(nm).replace(/\s*\d+(?:\.\d+)?\s*(병|정|개|매|포|캡슐|앰플|바이알|스틱|통)\s*$/, "").trim();
function displayName(baseNm, item){
  if (isUnk(item)) return "-";
  return (baseNm || coreName(P(item.code).name)) + "(" + item.qty + item.unit + ")";
}
/* 기준(대표) 상품 = 최소 적수 상품. 적수를 모르면 사입가 최저 → 바코드 순 */
const byBc = (a,b) => P(a.code).bc.localeCompare(P(b.code).bc);
const byQty = (a,b) => (a.qty ?? Infinity) - (b.qty ?? Infinity) || (P(a.code).buy - P(b.code).buy) || byBc(a,b);
function pickMain(items){
  const allKnown = items.every((i) => i.qty !== null && i.qty !== undefined);
  return [...items].sort(allKnown ? byQty : (a,b) => P(a.code).buy - P(b.code).buy || byBc(a,b))[0];
}
const convStock = (g) => g.items.reduce((s,i) => s + (isUnk(i) ? 0 : i.qty * P(i.code).stock), 0);
const baseUnit = (g) => (g.items.find((i) => i.unit) || {}).unit || "";

function toast(msg){ const t = el("toast"); t.textContent = msg; t.classList.add("on"); setTimeout(()=>t.classList.remove("on"), 2400); }
const openM = (id) => el(id).classList.add("open");
const closeM = (id) => el(id).classList.remove("open");
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeM(b.dataset.close)));

/* ── 저장하지 않은 변경 가드 ────────────────────────────────
   값이 바뀌면 [저장]이 활성화되고, 저장 전에 다른 묶음·탭·닫기로 이동하면 확인을 받는다. */
let pendingNav = null;
function guard(run){
  if (!dirty) return run();
  pendingNav = run;
  openM("navModal");
}
el("navOk").addEventListener("click", () => {
  closeM("navModal");
  dirty = false;
  const run = pendingNav; pendingNav = null;
  if (run) run();
});
el("winClose").addEventListener("click", () => guard(() => toast("화면을 닫습니다.")));

/* ── 탭 ─────────────────────────────────────────────────────── */
document.querySelectorAll(".tab[data-page]").forEach((t) => t.addEventListener("click", () => guard(() => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
  t.classList.add("on");
  const p = t.dataset.page;
  el("page-list").style.display = p === "list" ? "grid" : "none";
  el("page-pack").style.display = p === "pack" ? "block" : "none";
  el("subhead").textContent = p === "list" ? "상품 목록" : "적수 관리";
})));
el("plBody").innerHTML = PRODUCTS.map((p,i) =>
  '<tr class="'+(i===0?"on":"")+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td><td>'+(p.unit || "-")+'</td>'
  + '<td class="num">'+won(p.buy)+'</td><td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td>'
  + '<td class="mono">'+(p.dc || "-")+'</td><td>'+p.mk+'</td></tr>').join("");

/* ── 적수 묶음 목록 ─────────────────────────────────────────── */
let curId = GROUPS[0]?.id ?? null;
let draft = null;     // 상세에서 편집 중인 값
let dirty = false;    // 저장하지 않은 변경이 있는지

function renderGroups(){
  const q = (el("grpQ").value || "").trim();
  const list = GROUPS.filter((g) => !q || g.name.includes(q)
    || g.items.some((i) => P(i.code).name.includes(q) || P(i.code).bc.includes(q) || (P(i.code).dc && P(i.code).dc.includes(q))));
  el("grpCnt").textContent = list.length;
  el("matchN").textContent = liveCands().length;
  el("grpBody").innerHTML = list.map((g) =>
    '<tr class="'+(g.id===curId?"on":"")+'" data-g="'+g.id+'"><td class="nm">'+g.name+'</td>'
    + '<td class="mono">'+dcTxt(g.rep)+'</td>'
    + '<td>'+P(g.rep).mk+'</td>'
    + '<td class="num">'+g.items.length+'</td>'
    + '<td class="num">'+won(convStock(g))+baseUnit(g)+'</td>'
    + '<td>'+g.upd+'</td></tr>').join("")
    || '<tr><td colspan="6" class="empty">적수 묶음이 없습니다.</td></tr>';
  document.querySelectorAll("#grpBody tr[data-g]").forEach((tr) => tr.addEventListener("click", () => {
    if (tr.dataset.g === curId) return;
    guard(() => selectGroup(tr.dataset.g));
  }));
}
el("grpSearch").addEventListener("click", renderGroups);
el("grpQ").addEventListener("keydown", (e) => { if (e.key === "Enter") renderGroups(); });

/* ── 적수 묶음 편집 영역 (상세 화면 · 신규 등록 모달 공용) ───── */
const autoName = (code) => P(code).name.replace(/\s*\d+\s*(병|정|개|매|포|캡슐)?\s*$/, "").trim();

function editorHTML(d, scope){
  const items = d.items.slice().sort(byQty);
  const nm = d.name || (d.rep ? autoName(d.rep) : "");
  const unit = (items.find((i) => i.unit) || {}).unit || "";
  const rows = items.map((i) => {
    const p = P(i.code);
    return '<tr data-code="'+i.code+'">'
      + '<td class="ck"><input type="radio" name="rep_'+scope+'" '+(d.rep===i.code?"checked":"")+' data-rep="'+i.code+'" /></td>'
      + '<td class="nm">'+p.name+'</td>'
      + '<td'+(displayName(nm, i) === "-" ? ' class="dash"' : "")+'>'+displayName(nm, i)+'</td>'
      + '<td>'+p.bc+'</td>'
      + '<td><input class="in-s unit'+(!i.unit?" warn":"")+'" value="'+(i.unit||"")+'" placeholder="-" data-f="unit" /></td>'
      + '<td class="num"><input class="in-s'+(i.qty===null?" warn":"")+'" type="number" min="1" value="'+(i.qty??"")+'" placeholder="-" data-f="qty" /></td>'
      + '<td class="num">'+won(p.buy)+'</td><td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td>'
      + '<td><button class="btn sm" data-out="'+i.code+'">제외</button></td></tr>';
  }).join("") || '<tr><td colspan="10" class="empty">'+(scope==="reg" ? "위 목록에서 상품을 [담기] 해 주세요." : "[＋ 상품 추가]로 상품을 담아 주세요.")+'</td></tr>';

  /* 상단은 묶음 공통 정보만 둔다. 대표상품·바코드·가격·재고는 구성 상품 목록에서 확인한다. */
  const dcCode = d.rep || items[0]?.code;
  return '<div class="grid">'
    + '<div class="fld"><label>묶음명</label><input class="in" data-name value="'+nm+'" placeholder="대표상품명으로 자동 입력" style="height:30px" /></div>'
    + '<div class="fld"><label>약품코드</label><span class="in ro mono">'+(dcCode ? dcTxt(dcCode) : "-")+'</span></div>'
    + '<div class="fld"><label>상품 수</label><span class="in ro">'+items.length+'개</span></div>'
    + '<div class="fld"><label>환산 재고</label><span class="in ro">'+(items.some((i) => !isUnk(i)) ? won(convStock({items})) + unit : "-")+'</span></div>'
    + (scope === "reg" ? "" : '<div class="fld"><label>최근 수정일</label><span class="in ro">'+(d.upd || "-")+'</span></div>')
    + '</div>'
    + '<div class="sub-sec"><div class="sec-h"><h3>구성 상품</h3>'
    + '<span class="hint" style="margin-left:auto">대표상품을 선택하고 적수·단위를 확인하세요.</span></div>'
    + '<div class="tablewrap" style="max-height:'+(scope==="reg" ? 220 : 300)+'px"><table>'
    + '<colgroup><col style="width:28px"><col><col style="width:104px"><col style="width:112px"><col style="width:46px"><col style="width:52px"><col style="width:56px"><col style="width:56px"><col style="width:34px"><col style="width:56px"></colgroup>'
    + '<thead><tr><th class="ck">대표</th><th>상품명</th><th>표시명</th><th>바코드</th>'
    + '<th>단위</th><th class="num">적수</th><th class="num">사입가</th><th class="num">판매가</th><th class="num">재고</th><th></th></tr></thead>'
    + '<tbody>'+rows+'</tbody></table></div>'
    + '<div class="note">구성 상품은 적수별 단품이라 <b>바코드</b>로 구분합니다. 약품코드는 묶음 전체가 같은 값이라 위 기본 정보에 한 번만 표기합니다. 대표를 바꿔도 구성 상품의 상품명·바코드·약품코드·가격·재고는 그대로 유지됩니다.</div>'
    + '</div>';
}

function bindEditor(root, d, rerender, onOut){
  const touch = () => { if (d === draft) dirty = true; };
  root.querySelectorAll("[data-rep]").forEach((r) => r.addEventListener("change", () => {
    touch();
    d.rep = r.dataset.rep;
    if (!d.name) d.name = autoName(d.rep);
    rerender();
  }));
  root.querySelectorAll("input[data-f]").forEach((inp) => inp.addEventListener("change", () => {
    touch();
    const it = d.items.find((x) => x.code === inp.closest("tr").dataset.code);
    if (inp.dataset.f === "qty") it.qty = inp.value === "" ? null : Number(inp.value);
    else it.unit = inp.value.trim();
    rerender();
  }));
  root.querySelectorAll("[data-out]").forEach((b) => b.addEventListener("click", () => onOut(b.dataset.out)));
  root.querySelector("[data-name]").addEventListener("change", (e) => { touch(); d.name = e.target.value.trim(); });
}

function validate(d){
  if (d.items.length < 2) return "적수 묶음은 2개 이상의 상품으로 구성합니다.";
  if (d.items.some(isUnk)) return "적수·단위를 모두 입력해 주세요.";
  if (!d.rep) return "대표상품을 선택해 주세요.";
  return null;
}

/* ── 적수 묶음 상세 (수정 버튼 없이 바로 편집 · 저장) ──────── */
function curGroup(){ return GROUPS.find((g) => g.id === curId) ?? null; }
function selectGroup(gid){
  const g = GROUPS.find((x) => x.id === gid);
  if (!g) return;
  curId = gid;
  draft = { name: g.name, rep: g.rep, upd: g.upd, items: g.items.map((i) => ({ ...i })) };
  dirty = false;
  renderGroups(); renderDetail();
}

function renderDetail(){
  if (!draft) { el("detail").innerHTML = '<div class="empty">좌측에서 적수 묶음을 선택하세요.</div>'; return; }
  el("detail").innerHTML =
    '<div class="sec-h"><h3>적수 묶음 상세</h3><div class="acts">'
    + '<button class="btn sm" id="btnAdd">＋ 상품 추가</button>'
    + '<button class="btn red sm" id="btnRelease">묶음 해제</button>'
    + '<button class="btn teal sm" id="btnSave"'+(dirty ? "" : " disabled")+'>💾 저장</button></div></div>'
    + editorHTML(draft, "detail");
  bindEditor(el("detail"), draft, renderDetail, removeItem);
  el("btnAdd").addEventListener("click", openAdd);
  el("btnSave").addEventListener("click", saveDraft);
  el("btnRelease").addEventListener("click", () => askRelease(curGroup(), null));
}

function removeItem(code){
  if (draft.items.length <= 2) { askRelease(curGroup(), "구성 상품이 1개만 남습니다. 묶음을 해제할까요?"); return; }
  draft.items = draft.items.filter((i) => i.code !== code);
  if (draft.rep === code) draft.rep = pickMain(draft.items).code;
  dirty = true;
  renderDetail();
  toast("적수 묶음에서만 제외됩니다. 해당 상품은 개별 상품으로 그대로 남습니다.");
}

function saveDraft(){
  const err = validate(draft);
  if (err) return toast(err);
  const g = curGroup();
  g.name = draft.name || autoName(draft.rep); g.rep = draft.rep;
  g.items = draft.items.map((i) => ({ ...i })); g.upd = TODAY;
  selectGroup(g.id);
  toast("수정 내용을 저장했습니다.");
}

/* ── 적수 묶음 신규 등록 (모달 · 상품 담기 + 적수 묶음 상세 영역) ── */
let REG = null;
el("openReg").addEventListener("click", () => {
  REG = { name: "", rep: null, items: [] };
  el("regQ").value = "";
  drawReg(); openM("regModal");
});
function drawReg(){
  const q = (el("regQ").value || "").trim();
  const used = bundledCodes();
  const inReg = new Set(REG.items.map((i) => i.code));
  const list = PRODUCTS.filter((p) => !used.has(p.code) && !inReg.has(p.code))
    .filter((p) => !q || p.name.includes(q) || p.bc.includes(q));
  el("regList").innerHTML = list.map((p) =>
    '<tr data-code="'+p.code+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td><td class="mono">'+(p.dc || "-")+'</td>'
    + '<td>'+(p.unit || "-")+'</td>'
    + '<td class="num">'+won(p.buy)+'</td><td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td>'
    + '<td><button class="btn sm" data-pick="'+p.code+'">담기</button></td></tr>').join("")
    || '<tr><td colspan="8" class="empty">담을 수 있는 상품이 없습니다. 이미 다른 적수 묶음에 포함된 상품은 표시되지 않습니다.</td></tr>';
  el("regEditor").innerHTML = editorHTML(REG, "reg");
  bindEditor(el("regEditor"), REG, drawReg, (code) => {
    REG.items = REG.items.filter((i) => i.code !== code);
    if (REG.rep === code) REG.rep = REG.items.length ? pickMain(REG.items).code : null;
    drawReg();
  });
  el("regList").querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => {
    const code = b.dataset.pick;
    const g = seedPack(code);
    REG.items.push({ code, qty: g.qty, unit: g.unit });
    REG.rep = pickMain(REG.items).code;
    if (!REG.name) REG.name = autoName(REG.rep);
    drawReg();
  }));
}
el("regSearch").addEventListener("click", drawReg);
el("regQ").addEventListener("keydown", (e) => { if (e.key === "Enter") drawReg(); });
el("regOk").addEventListener("click", () => {
  const err = validate(REG);
  if (err) return toast(err);
  const gid = "G" + String(GROUPS.length + 3).padStart(3, "0");
  const name = REG.name || autoName(REG.rep);
  GROUPS.unshift({ id: gid, name, rep: REG.rep, upd: TODAY, items: REG.items.map((i) => ({ ...i })) });
  closeM("regModal"); selectGroup(gid);
  toast(name + " 적수 묶음을 등록했습니다.");
});

/* ── 묶음 해제 ──────────────────────────────────────────────── */
let relTarget = null;
function askRelease(g, lead){
  relTarget = g;
  el("relText").textContent = (lead ? lead + " " : "")
    + "이 적수 묶음을 해제하시겠습니까? 구성 상품의 상품정보·판매내역·재고는 변경되지 않으며 적수 연결만 해제됩니다.";
  openM("relModal");
}
el("relOk").addEventListener("click", () => {
  GROUPS = GROUPS.filter((g) => g.id !== relTarget.id);
  closeM("relModal");
  draft = null;
  if (GROUPS.length) selectGroup(GROUPS[0].id); else { curId = null; renderGroups(); renderDetail(); }
  toast("적수 묶음을 해제했습니다.");
});

/* ── 상품 추가 (검색·선택 + 포장정보 확인을 한 화면에서) ──── */
let addDraft = null;
function openAdd(){ addDraft = null; el("addQ").value = ""; drawAddList(); drawAddInfo(); openM("addModal"); }
function drawAddList(){
  const q = (el("addQ").value || "").trim();
  const used = bundledCodes();
  const inDraft = new Set((draft?.items ?? []).map((i) => i.code));
  const rows = PRODUCTS.filter((p) => !used.has(p.code) && !inDraft.has(p.code))
    .filter((p) => !q || p.name.includes(q) || p.bc.includes(q));
  el("addBody").innerHTML = rows.map((p) =>
    '<tr class="'+(addDraft?.code===p.code?"on":"")+'" data-code="'+p.code+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td>'
    + '<td class="mono">'+(p.dc || "-")+'</td><td>'+(p.unit || "-")+'</td>'
    + '<td class="num">'+won(p.buy)+'</td><td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td></tr>').join("")
    || '<tr><td colspan="7" class="empty">추가할 수 있는 상품이 없습니다. 이미 다른 적수 묶음에 포함된 상품은 추가할 수 없습니다.</td></tr>';
  // 상품을 고르면 같은 화면에서 적수·단위를 확인·수정한다
  document.querySelectorAll("#addBody tr[data-code]").forEach((tr) => tr.addEventListener("click", () => {
    const guess = seedPack(tr.dataset.code);
    addDraft = { code: tr.dataset.code, qty: guess.qty, unit: guess.unit };
    drawAddList(); drawAddInfo();
  }));
}
function drawAddInfo(){
  if (!addDraft) {
    el("addInfo").innerHTML = '<div class="note">추가할 상품을 목록에서 선택하면 적수·단위를 확인할 수 있습니다.</div>';
    el("addOk").disabled = true;
    return;
  }
  const p = P(addDraft.code);
  el("addInfo").innerHTML =
    '<div class="grid" style="margin-bottom:0">'
    + '<div class="fld full"><label>상품명</label><span class="in ro">'+p.name+'</span></div>'
    + '<div class="fld"><label>바코드</label><span class="in ro mono">'+p.bc+'</span></div>'
    + '<div class="fld"><label>약품코드</label><span class="in ro mono">'+(p.dc || "-")+'</span></div>'
    + '<div class="fld"><label>적수</label><input class="in'+(addDraft.qty===null?" warn":"")+'" id="aq" type="number" min="1" value="'+(addDraft.qty??"")+'" placeholder="-" style="height:30px"/></div>'
    + '<div class="fld"><label>단위</label><input class="in'+(!addDraft.unit?" warn":"")+'" id="au" value="'+(addDraft.unit||"")+'" placeholder="-" style="height:30px"/></div>'
    + '<div class="fld full"><label>표시명 미리보기</label><span class="in ro">'+displayName(draft?.name || P(addDraft.code).name, addDraft)+'</span></div></div>'
    ;
  el("aq").addEventListener("input", (e) => { addDraft.qty = e.target.value === "" ? null : Number(e.target.value); drawAddInfo(); });
  el("au").addEventListener("change", (e) => { addDraft.unit = e.target.value.trim(); drawAddInfo(); });
  el("addOk").disabled = isUnk(addDraft);
}
el("addSearch").addEventListener("click", drawAddList);
el("addQ").addEventListener("keydown", (e) => { if (e.key === "Enter") drawAddList(); });
el("addOk").addEventListener("click", () => {
  draft.items.push({ code: addDraft.code, qty: addDraft.qty, unit: addDraft.unit });
  dirty = true;
  if (!draft.rep) draft.rep = pickMain(draft.items).code;
  if (!draft.name && draft.rep) draft.name = P(draft.rep).name.replace(/\s*\d+\s*(병|정|개|매|포|캡슐)?\s*$/, "").trim();
  closeM("addModal"); renderDetail();
  toast(P(addDraft.code).name + " 을(를) 담았습니다. [저장]을 눌러 반영하세요.");
});

/* ── 적수 매칭 목록 (모달) ─────────────────────────────────── */
const sel = {}, hidden = new Set(), done = new Set(), skuOut = {}, collapsed = new Set();
CANDS.forEach((c) => { sel[c.id] = new Set(); skuOut[c.id] = new Set(); });

/* 매칭 제외 기록 — 적수 매핑 정보에 보관 (상품 마스터는 그대로)
   · 제외한 상품은 이후 매칭 후보에 다시 나오지 않는다
   · 제외일시 이후 등록된 신규 상품은 남아 있는 상품과 합쳐 2개 이상이면 다시 표시된다
   · 상품별로 상품 상세의 변경 내용 보기(CNT-01-003)에 '적수 매칭 · 매칭 후보 → 매칭 제외'로 남는다 */
const EXCLUDED = [];   // { pharmacy, prefix, code, at, by }
function recordExclusion(c, code, at){
  EXCLUDED.push({ pharmacy: "PH001", prefix: P(code).bc.slice(0, 11), code, at, by: "약사(김)" });
  skuOut[c.id].add(code);
}
// 예시: 이지엔6이브 20정은 09-05에 매칭에서 제외됐고, 이후 30정이 신규 등록돼 10정 + 30정으로 다시 표시된다
recordExclusion(CANDS.find((c) => c.id === "C02"), "P708823327", "2026-09-05 10:12");

const liveCands = () => CANDS.filter((c) => !hidden.has(c.id) && !done.has(c.id));

el("openMatch").addEventListener("click", () => { renderCands(); openM("matchModal"); });

function renderCands(){
  const list = liveCands().sort((a,b) => a.rank - b.rank);
  el("candCnt").textContent = list.length;
  el("matchN").textContent = list.length;

  const cell = (i) => {
    const p = P(i.code);
    return '<td>'+p.bc+'</td><td>'+(p.unit || "-")+'</td><td class="num">'+won(p.buy)+'</td>'
      + '<td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td>';
  };
  el("candBody").innerHTML = list.map((c) => {
    const open = !collapsed.has(c.id);
    const live = c.items.filter((i) => !skuOut[c.id].has(i.code)).sort(byQty);
    const main = pickMain(live);
    const picked = live.filter((i) => sel[c.id].has(i.code)).length;
    // 그룹 행: 그룹 전체 선택 전용 (상품 정보는 아래 상품 행에서)
    const head = '<tr class="grow" data-g="'+c.id+'">'
      + '<td class="ck"><input type="checkbox" data-gck="'+c.id+'" '+(live.length && picked===live.length?"checked":"")+' /></td>'
      + '<td class="nm" colspan="7"><span class="caret" data-tg="'+c.id+'">'+(open?"▾":"▸")+'</span> '+P(main.code).name
      + (P(main.code).dc ? ' <span class="mono">'+P(main.code).dc+'</span>' : ' <span class="tag">약품코드 없음</span>')
      + ' · '+P(main.code).mk
      + '<span class="gbadge">적수 '+live.length+'건</span></td></tr>';
    if (!open) return head;
    // 상품 행: 대표 상품 포함 모든 상품을 적수 오름차순으로, 각각 선택
    const rows = live.map((i) =>
      '<tr class="'+(sel[c.id].has(i.code)?"on":"")+'" data-c="'+c.id+'" data-code="'+i.code+'">'
      + '<td class="ck"><input type="checkbox" '+(sel[c.id].has(i.code)?"checked":"")+' /></td>'
      + '<td class="sub">└ '+(i===main?'<span class="tag rep">대표</span> ':"")+P(i.code).name+'</td>' + cell(i) + '<td></td></tr>').join("");
    return head + rows;
  }).join("") || '<tr><td colspan="8" class="empty">검토할 적수 매칭 그룹이 없습니다.</td></tr>';

  document.querySelectorAll("#candBody tr[data-code]").forEach((tr) => tr.addEventListener("click", (e) => {
    if (e.target.dataset.tg) return;
    const s2 = sel[tr.dataset.c];
    if (s2.has(tr.dataset.code)) s2.delete(tr.dataset.code); else s2.add(tr.dataset.code);
    renderCands();
  }));
  document.querySelectorAll("#candBody tr[data-g]").forEach((tr) => tr.addEventListener("click", (e) => {
    if (e.target.dataset.tg) return;
    const c = CANDS.find((x) => x.id === tr.dataset.g);
    const live = c.items.filter((i) => !skuOut[c.id].has(i.code));
    const all = live.every((i) => sel[c.id].has(i.code));
    sel[c.id] = new Set(all ? [] : live.map((i) => i.code));
    renderCands();
  }));
  document.querySelectorAll("#candBody [data-tg]").forEach((x) => x.addEventListener("click", (e) => {
    e.stopPropagation();
    if (collapsed.has(x.dataset.tg)) collapsed.delete(x.dataset.tg); else collapsed.add(x.dataset.tg);
    renderCands();
  }));
  document.querySelectorAll("#candBody [data-gck]").forEach((x) => {
    const c = CANDS.find((y) => y.id === x.dataset.gck);
    const live = c.items.filter((i) => !skuOut[c.id].has(i.code));
    const n = live.filter((i) => sel[c.id].has(i.code)).length;
    x.indeterminate = n > 0 && n < live.length;
  });

  const pickedG = list.filter((c) => sel[c.id].size > 0);
  const ready = pickedG.filter((c) => sel[c.id].size >= 2);
  el("selSum").textContent = pickedG.length
    ? "그룹 " + pickedG.length + "개 · 상품 " + pickedG.reduce((n,c) => n + sel[c.id].size, 0) + "건 선택"
    : "선택 없음";
  el("makeSel").disabled = ready.length === 0;
  el("dropSel").disabled = pickedG.length === 0;
  BAR = { picked: pickedG, ready };
}
let BAR = { picked: [], ready: [] };
el("dropSel").addEventListener("click", () => {
  // 선택한 상품을 매칭 후보에서 제외한다. 묶을 상품이 2개 미만으로 남은 그룹은 목록에서 빠진다.
  let items = 0, groupsOut = 0;
  BAR.picked.forEach((c) => {
    sel[c.id].forEach((code) => { recordExclusion(c, code, "2026-09-14 14:20"); items++; });
    sel[c.id] = new Set();
    const live = c.items.filter((i) => !skuOut[c.id].has(i.code));
    if (live.length < 2) { hidden.add(c.id); groupsOut++; }
  });
  renderCands(); renderGroups();
  toast("선택한 상품 " + items + "건을 매칭 후보에서 제외했습니다. 기록은 상품 상세의 변경 내용 보기에 남습니다."
    + (groupsOut ? " 묶을 상품이 남지 않은 그룹 " + groupsOut + "개는 목록에서 빠졌습니다." : ""));
});
el("makeSel").addEventListener("click", () => openMake(BAR.ready.map((c) => c.id)));

/* ── 상품 정보 확인 → 적수 묶기 ─────────────────────────────── */
let MK = null;
function openMake(cids){
  const groups = cids.map((cid) => {
    const c = CANDS.find((x) => x.id === cid);
    const picked = c.items.filter((i) => sel[cid].has(i.code)).map((i) => ({ ...i }));
    return { cid, rep: pickMain(picked).code, rows: picked.sort(byQty) };
  }).filter((g) => g.rows.length >= 2);
  if (!groups.length) return toast("묶을 상품을 2개 이상 선택해 주세요.");
  MK = { groups }; drawMake(); openM("mkModal");
}
const baseNameOf = (g) => P(g.rep).name.replace(/\s*\d+\s*(병|정|개|매|포|캡슐)?\s*$/, "").trim();
function drawMake(){
  el("mkBody").innerHTML = MK.groups.map((g) => {
    const nm = baseNameOf(g);
    const rows = g.rows.map((r) =>
      '<tr data-g="'+g.cid+'" data-code="'+r.code+'"><td class="nm">'+P(r.code).name+'</td>'
      + '<td class="ck"><input type="radio" name="rep_'+g.cid+'" '+(g.rep===r.code?"checked":"")+' data-rep="'+r.code+'" data-g="'+g.cid+'" /></td>'
      + '<td class="num"><input class="in-s'+(r.qty===null?" warn":"")+'" type="number" min="1" value="'+(r.qty??"")+'" placeholder="-" data-f="qty" /></td>'
      + '<td><input class="in-s unit'+(!r.unit?" warn":"")+'" value="'+(r.unit||"")+'" placeholder="-" data-f="unit" /></td>'
      + '<td>'+displayName(nm, r)+'</td></tr>').join("");
    return '<div class="mgroup"><div class="mgroup-h"><b>'+nm+'</b>'
      + '<span class="gbadge">적수 '+g.rows.length+'건</span></div>'
      + '<div class="tablewrap"><table><thead><tr><th>현재 상품명</th><th class="ck">대표상품</th>'
      + '<th class="num">적수</th><th>단위</th><th>표시명 미리보기</th></tr></thead><tbody>'+rows+'</tbody></table></div></div>';
  }).join("");
  const all = MK.groups.flatMap((g) => g.rows);
  const unkN = all.filter(isUnk).length;
  el("mkNote").innerHTML = '묶음 <b>'+MK.groups.length+'개</b> · 상품 <b>'+all.length+'건</b>을 확인합니다.'
    + (unkN ? '<br>적수·단위가 확인되지 않은 상품 <b>'+unkN+'건</b>은 직접 입력해야 합니다.' : "");
  el("mkOk").disabled = unkN > 0;
  el("mkOk").textContent = "적수 묶기 (" + MK.groups.length + ")";
  document.querySelectorAll("#mkBody [data-rep]").forEach((r) => r.addEventListener("change", () => {
    MK.groups.find((g) => g.cid === r.dataset.g).rep = r.dataset.rep; drawMake();
  }));
  document.querySelectorAll("#mkBody input[data-f]").forEach((inp) => inp.addEventListener("change", () => {
    const tr = inp.closest("tr"), g = MK.groups.find((x) => x.cid === tr.dataset.g);
    const row = g.rows.find((r) => r.code === tr.dataset.code);
    if (inp.dataset.f === "qty") row.qty = inp.value === "" ? null : Number(inp.value);
    else row.unit = inp.value.trim();
    drawMake();
  }));
}
el("mkOk").addEventListener("click", () => {
  MK.groups.forEach((g) => {
    const gid = "G" + String(GROUPS.length + 3).padStart(3, "0");
    GROUPS.unshift({ id: gid, name: baseNameOf(g), rep: g.rep, upd: TODAY,
      items: g.rows.map((r) => ({ code:r.code, qty:r.qty, unit:r.unit })) });
    done.add(g.cid);
    curId = gid;
  });
  const n = MK.groups.length;
  closeM("mkModal"); closeM("matchModal");
  renderCands(); selectGroup(curId);
  toast(n + "개 묶음을 만들었습니다.");
});

/* ── 초기 렌더 ──────────────────────────────────────────────── */
renderGroups();
if (GROUPS.length) selectGroup(GROUPS[0].id); else renderDetail();
const qs = new URLSearchParams(location.search);
if (qs.get("modal") === "new") el("openReg").click();
if (qs.get("modal") === "match") el("openMatch").click();
if (qs.get("modal") === "add") {
  el("btnAdd")?.click();
  const pick = qs.get("pick");   // 리뷰 링크용 — 선택 상태로 열기
  if (pick && P(pick)) { const g2 = seedPack(pick); addDraft = { code:pick, qty:g2.qty, unit:g2.unit }; drawAddList(); drawAddInfo(); }
}
if (qs.get("g")) selectGroup(qs.get("g"));
