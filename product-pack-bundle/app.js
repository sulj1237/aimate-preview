/* 상품 관리 > 적수 관리 — 적수 묶음 목록/상세 + 적수 매칭 목록(팝업) */

/* ── 상품 원본 (기존 상품 데이터) ───────────────────────────── */
const PRODUCTS = [
  { code:"A001", name:"박카스",              bc:"8801234567801", mk:"동아제약", buy:600,   sell:800,   stock:15 },
  { code:"A002", name:"박카스10",            bc:"8801234567802", mk:"동아제약", buy:5800,  sell:7500,  stock:3  },
  { code:"A003", name:"박카스 100병",        bc:"8801234567803", mk:"동아제약", buy:56000, sell:70000, stock:1  },
  { code:"B001", name:"타이레놀500mg100정",  bc:"8805551234501", mk:"한국얀센", buy:7400,  sell:9800,  stock:4  },
  { code:"B002", name:"타이레놀 500mg 300정",bc:"8805551234502", mk:"한국얀센", buy:21000, sell:27000, stock:2  },
  { code:"B003", name:"타이레놀650mg100정",  bc:"8805551234503", mk:"한국얀센", buy:8300,  sell:11000, stock:5  },
  { code:"C001", name:"비타민C 500mg 100정", bc:"8807770001101", mk:"고려은단", buy:9000,  sell:12000, stock:10 },
  { code:"D001", name:"덴탈마스크",          bc:"8809998887701", mk:"웰킵스",   buy:200,   sell:300,   stock:50 },
  { code:"D002", name:"덴탈마스크 대용량",    bc:"8809998887702", mk:"웰킵스",   buy:9000,  sell:12000, stock:5  },
  { code:"E001", name:"이지엔6이브 10정",     bc:"8806667770011", mk:"대웅제약", buy:3200,  sell:4500,  stock:8  },
  { code:"E002", name:"이지엔6이브 20정",     bc:"8806667770012", mk:"대웅제약", buy:6100,  sell:8500,  stock:2  },
  { code:"E101", name:"종합비타민골드 30정",  bc:"8807771110011", mk:"유한양행", buy:12000, sell:16000, stock:2  },
  { code:"E102", name:"종합비타민골드 100정", bc:"8807771110012", mk:"유한양행", buy:34000, sell:45000, stock:0  },
  { code:"E103", name:"종합비타민골드 60정",  bc:"8807771110013", mk:"유한양행", buy:21000, sell:28000, stock:3  },
  { code:"F001", name:"판피린큐",            bc:"8801111222201", mk:"동아제약", buy:900,   sell:1200,  stock:40 },
];
const P = (code) => PRODUCTS.find((p) => p.code === code);

/* ── 적수 묶음 (Mapping) ────────────────────────────────────── */
let GROUPS = [
  { id:"G001", name:"박카스", rep:"A001", upd:"09-08",
    items:[ {code:"A001",qty:1,unit:"병"}, {code:"A002",qty:10,unit:"병"}, {code:"A003",qty:100,unit:"병"} ] },
  { id:"G002", name:"종합비타민골드", rep:"E101", upd:"09-06",
    items:[ {code:"E101",qty:30,unit:"정"}, {code:"E102",qty:100,unit:"정"}, {code:"E103",qty:6,unit:"정"} ] },
];

/* ── 공통 ───────────────────────────────────────────────────── */
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
/* 표시명 = 상품명 + 적수 + 단위.
   상품명에서 읽은 포장정보가 저장값과 같으면 이미 포함된 것으로 보고 기존 상품명을 그대로 쓴다.
   (문자열 포함 여부로 판단하면 '160정' 안의 '60정' 같은 경우를 같은 값으로 오인한다) */
function displayName(baseNm, item){
  const nm = P(item.code).name;
  if (isUnk(item)) return "-";
  const p = parsePack(nm);
  if (p && p.qty === Number(item.qty) && p.unit === item.unit) return nm;
  return (baseNm || nm) + " " + item.qty + item.unit;
}
/* 기준(대표) 상품 = 최소 적수 상품. 적수를 모르면 사입가 최저 → 상품코드 순 */
const byQty = (a,b) => (a.qty ?? Infinity) - (b.qty ?? Infinity) || (P(a.code).buy - P(b.code).buy) || a.code.localeCompare(b.code);
function pickMain(items){
  const allKnown = items.every((i) => i.qty !== null && i.qty !== undefined);
  return [...items].sort(allKnown ? byQty : (a,b) => P(a.code).buy - P(b.code).buy || a.code.localeCompare(b.code))[0];
}
const convStock = (g) => g.items.reduce((s,i) => s + (isUnk(i) ? 0 : i.qty * P(i.code).stock), 0);
const baseUnit = (g) => (g.items.find((i) => i.unit) || {}).unit || "";

function toast(msg){ const t = el("toast"); t.textContent = msg; t.classList.add("on"); setTimeout(()=>t.classList.remove("on"), 2400); }
const openM = (id) => el(id).classList.add("open");
const closeM = (id) => el(id).classList.remove("open");
document.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => closeM(b.dataset.close)));

/* ── 탭 ─────────────────────────────────────────────────────── */
document.querySelectorAll(".tab[data-page]").forEach((t) => t.addEventListener("click", () => {
  document.querySelectorAll(".tab").forEach((x) => x.classList.remove("on"));
  t.classList.add("on");
  const p = t.dataset.page;
  el("page-list").style.display = p === "list" ? "grid" : "none";
  el("page-pack").style.display = p === "pack" ? "block" : "none";
  el("subhead").textContent = p === "list" ? "상품 목록" : "적수 관리";
}));
el("plBody").innerHTML = PRODUCTS.map((p,i) =>
  '<tr class="'+(i===0?"on":"")+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td><td>'+(parsePack(p.name)?.unit ?? "개")+'</td>'
  + '<td class="num">'+won(p.buy)+'</td><td class="num">'+p.stock+'</td></tr>').join("");

/* ── 적수 묶음 목록 ─────────────────────────────────────────── */
let curId = GROUPS[0]?.id ?? null;
let editing = false;
let draft = null;   // 수정 모드 임시값

function renderGroups(){
  const q = (el("grpQ").value || "").trim();
  const list = GROUPS.filter((g) => !q || g.name.includes(q) || g.items.some((i) => P(i.code).name.includes(q) || P(i.code).bc.includes(q)));
  el("grpCnt").textContent = list.length;
  el("grpBody").innerHTML = list.map((g) =>
    '<tr class="'+(g.id===curId?"on":"")+'" data-g="'+g.id+'"><td class="nm">'+g.name+'</td>'
    + '<td class="num">'+g.items.length+'</td>'
    + '<td class="num">'+won(convStock(g))+baseUnit(g)+'</td>'
    + '<td>'+g.upd+'</td></tr>').join("")
    || '<tr><td colspan="4" class="empty">적수 묶음이 없습니다.</td></tr>';
  document.querySelectorAll("#grpBody tr[data-g]").forEach((tr) => tr.addEventListener("click", () => {
    curId = tr.dataset.g; editing = false; draft = null; renderGroups(); renderDetail();
  }));
}
el("grpSearch").addEventListener("click", renderGroups);
el("grpQ").addEventListener("keydown", (e) => { if (e.key === "Enter") renderGroups(); });

/* ── 적수 묶음 상세 ─────────────────────────────────────────── */
function curGroup(){ return GROUPS.find((g) => g.id === curId) ?? null; }

function renderDetail(){
  const g = curGroup();
  if (!g) { el("detail").innerHTML = '<div class="empty">좌측에서 적수 묶음을 선택하세요.</div>'; return; }
  const items = (editing ? draft.items : g.items).slice().sort(byQty);
  const repCode = editing ? draft.rep : g.rep;
  const nm = editing ? draft.name : g.name;

  const rows = items.map((i) => {
    const p = P(i.code);
    return '<tr data-code="'+i.code+'">'
      + (editing ? '<td class="ck"><input type="radio" name="rep" '+(repCode===i.code?"checked":"")+' data-rep="'+i.code+'" /></td>' : "")
      + '<td class="nm">'+(!editing && repCode===i.code ? '<span class="tag rep">대표</span> ' : "")+p.name+'</td>'
      + '<td'+(displayName(nm, i) === "-" ? ' class="dash"' : "")+'>'+displayName(nm, i)+'</td>'
      + '<td>'+p.bc+'</td>'
      + (editing
          ? '<td class="num"><input class="in-s'+(i.qty===null?" warn":"")+'" type="number" min="1" value="'+(i.qty??"")+'" placeholder="-" data-f="qty" /></td>'
            + '<td><input class="in-s unit'+(!i.unit?" warn":"")+'" value="'+(i.unit||"")+'" placeholder="-" data-f="unit" /></td>'
          : '<td class="num'+(i.qty===null?" unk":"")+'">'+(i.qty ?? "-")+'</td><td class="'+(!i.unit?"unk":"")+'">'+(i.unit || "-")+'</td>')
      + '<td class="num">'+won(p.buy)+'</td><td class="num">'+won(p.sell)+'</td><td class="num">'+p.stock+'</td>'
      + (editing ? '<td><button class="btn sm" data-out="'+i.code+'">제외</button></td>' : "") + '</tr>';
  }).join("");

  el("detail").innerHTML =
    '<div class="sec-h"><h3>적수 묶음 상세</h3><div class="acts">'
    + (editing
        ? '<button class="btn sm" id="btnCancel">취소</button><button class="btn teal sm" id="btnSave">💾 저장</button>'
        : '<button class="btn sm" id="btnEdit">✎ 수정</button><button class="btn sm" id="btnAdd">＋ 상품 추가</button>'
          + '<button class="btn red sm" id="btnRelease">묶음 해제</button>')
    + '</div></div>'
    + '<div class="grid">'
    + '<div class="fld"><label>묶음명</label>'
    + (editing ? '<input class="in" id="fName" value="'+nm+'" style="height:30px" />' : '<span class="in ro">'+nm+'</span>') + '</div>'
    + '<div class="fld"><label>대표상품</label><span class="in ro">'+P(repCode).name+'</span></div>'
    + '<div class="fld"><label>상품 수</label><span class="in ro">'+items.length+'개</span></div>'
    + '<div class="fld"><label>환산 재고</label><span class="in ro">'+won(convStock({items}))+baseUnit({items})+'</span></div>'
    + '</div>'
    + '<div class="sub-sec"><div class="sec-h"><h3>구성 상품</h3>'
    + (editing ? '<span class="hint" style="margin-left:auto">대표상품을 선택하고 적수·단위를 확인하세요.</span>' : "") + '</div>'
    + '<div class="tablewrap" style="max-height:300px"><table>'
    + '<colgroup>' + (editing
        ? '<col style="width:30px"><col><col style="width:92px"><col style="width:104px"><col style="width:58px"><col style="width:48px"><col style="width:58px"><col style="width:58px"><col style="width:36px"><col style="width:58px">'
        : '<col><col style="width:124px"><col style="width:112px"><col style="width:62px"><col style="width:44px"><col style="width:64px"><col style="width:64px"><col style="width:44px">')
    + '</colgroup><thead><tr>'
    + (editing ? '<th class="ck">대표</th>' : "")
    + '<th>상품명</th><th>표시명</th><th>바코드</th><th class="num">적수</th><th>단위</th><th class="num">사입가</th><th class="num">판매가</th><th class="num">재고</th>'
    + (editing ? "<th></th>" : "") + '</tr></thead><tbody>'+rows+'</tbody></table></div>'
    + (editing ? '<div class="note">대표상품은 표시·식별 기준입니다. 대표를 바꿔도 구성 상품의 상품명·상품코드·바코드·가격·재고는 그대로 유지됩니다.</div>' : "")
    + '</div>';

  if (editing) {
    document.querySelectorAll("#detail [data-rep]").forEach((r) => r.addEventListener("change", () => { draft.rep = r.dataset.rep; renderDetail(); }));
    document.querySelectorAll("#detail input[data-f]").forEach((inp) => inp.addEventListener("change", () => {
      const code = inp.closest("tr").dataset.code, it = draft.items.find((x) => x.code === code);
      if (inp.dataset.f === "qty") it.qty = inp.value === "" ? null : Number(inp.value);
      else it.unit = inp.value.trim();
      renderDetail();
    }));
    document.querySelectorAll("#detail [data-out]").forEach((b) => b.addEventListener("click", () => removeItem(b.dataset.out)));
    el("fName").addEventListener("change", (e) => { draft.name = e.target.value.trim(); });
    el("btnCancel").addEventListener("click", () => { editing = false; draft = null; renderDetail(); });
    el("btnSave").addEventListener("click", saveDraft);
  } else {
    el("btnEdit").addEventListener("click", () => {
      const g2 = curGroup();
      draft = { name: g2.name, rep: g2.rep, items: g2.items.map((i) => ({ ...i })) };
      editing = true; renderDetail();
    });
    el("btnAdd").addEventListener("click", openAdd);
    el("btnRelease").addEventListener("click", () => askRelease(curGroup(), null));
  }
}

function removeItem(code){
  if (draft.items.length <= 2) {
    askRelease(curGroup(), "구성 상품이 1개만 남습니다. 묶음을 해제할까요?");
    return;
  }
  draft.items = draft.items.filter((i) => i.code !== code);
  if (draft.rep === code) draft.rep = pickMain(draft.items).code;
  renderDetail(); toast("적수 묶음에서만 제외됩니다. 해당 상품은 개별 상품으로 그대로 남습니다.");
}

function saveDraft(){
  const g = curGroup();
  g.name = draft.name; g.rep = draft.rep; g.items = draft.items; g.upd = "09-10";
  editing = false; draft = null;
  renderGroups(); renderDetail(); toast("수정 내용을 저장했습니다.");
}

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
  curId = GROUPS[0]?.id ?? null; editing = false; draft = null;
  closeM("relModal"); renderGroups(); renderDetail(); toast("적수 묶음을 해제했습니다.");
});

/* ── 상품 추가 (검색·선택 + 포장정보 확인을 한 화면에서) ──── */
let addDraft = null;
function openAdd(){ addDraft = null; el("addQ").value = ""; drawAddList(); drawAddInfo(); openM("addModal"); }
function drawAddList(){
  const q = (el("addQ").value || "").trim();
  const used = bundledCodes();
  const rows = PRODUCTS.filter((p) => !used.has(p.code)).filter((p) => !q || p.name.includes(q) || p.bc.includes(q));
  el("addBody").innerHTML = rows.map((p) =>
    '<tr class="'+(addDraft?.code===p.code?"on":"")+'" data-code="'+p.code+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td>'
    + '<td>'+p.mk+'</td><td class="num">'+won(p.buy)+'</td><td class="num">'+p.stock+'</td></tr>').join("")
    || '<tr><td colspan="5" class="empty">추가할 수 있는 상품이 없습니다. 이미 다른 적수 묶음에 포함된 상품은 추가할 수 없습니다.</td></tr>';
  // 상품을 고르면 같은 화면에서 포장정보를 확인·수정한다
  document.querySelectorAll("#addBody tr[data-code]").forEach((tr) => tr.addEventListener("click", () => {
    const guess = parsePack(P(tr.dataset.code).name) ?? { qty:null, unit:"" };
    addDraft = { code: tr.dataset.code, qty: guess.qty, unit: guess.unit };
    drawAddList(); drawAddInfo();
  }));
}
function drawAddInfo(){
  const g = curGroup();
  if (!addDraft) {
    el("addInfo").innerHTML = '<div class="note">추가할 상품을 목록에서 선택하면 적수·단위를 확인할 수 있습니다.</div>';
    el("addOk").disabled = true;
    return;
  }
  const p = P(addDraft.code);
  el("addInfo").innerHTML =
    '<div class="grid" style="margin-bottom:0">'
    + '<div class="fld full"><label>상품명</label><span class="in ro">'+p.name+'</span></div>'
    + '<div class="fld"><label>적수</label><input class="in'+(addDraft.qty===null?" warn":"")+'" id="aq" type="number" min="1" value="'+(addDraft.qty??"")+'" placeholder="-" style="height:30px"/></div>'
    + '<div class="fld"><label>단위</label><input class="in'+(!addDraft.unit?" warn":"")+'" id="au" value="'+(addDraft.unit||"")+'" placeholder="-" style="height:30px"/></div>'
    + '<div class="fld full"><label>표시명 미리보기</label><span class="in ro">'+displayName(g.name, addDraft)+'</span></div></div>'
    ;
  el("aq").addEventListener("input", (e) => { addDraft.qty = e.target.value === "" ? null : Number(e.target.value); drawAddInfo(); });
  el("au").addEventListener("change", (e) => { addDraft.unit = e.target.value.trim(); drawAddInfo(); });
  el("addOk").disabled = isUnk(addDraft);
}
el("addSearch").addEventListener("click", drawAddList);
el("addQ").addEventListener("keydown", (e) => { if (e.key === "Enter") drawAddList(); });
el("addOk").addEventListener("click", () => {
  const g = curGroup();
  g.items.push({ code: addDraft.code, qty: addDraft.qty, unit: addDraft.unit });
  g.upd = "09-10";
  closeM("addModal"); renderGroups(); renderDetail();
  toast(P(addDraft.code).name + " 을(를) 묶음에 추가했습니다.");
});

/* ── 적수 묶음 신규 등록 (상품 담기 + 적수 확인을 한 화면에서) ── */
let REG = null;   // { rows:[{code,qty,unit}], rep }
el("openReg").addEventListener("click", () => {
  REG = { rows: [], rep: null };
  el("regQ").value = "";
  drawRegList(); drawRegPicked(); openM("regModal");
});
function drawRegList(){
  const q = (el("regQ").value || "").trim();
  const used = bundledCodes();
  const rows = PRODUCTS.filter((p) => !used.has(p.code)).filter((p) => !q || p.name.includes(q) || p.bc.includes(q));
  el("regList").innerHTML = rows.map((p) =>
    '<tr data-code="'+p.code+'"><td class="nm">'+p.name+'</td><td>'+p.bc+'</td>'
    + '<td>'+p.mk+'</td><td class="num">'+won(p.buy)+'</td><td class="num">'+p.stock+'</td>'
    + '<td><button class="btn sm">담기</button></td></tr>').join("") || '<tr><td colspan="6" class="empty">담을 수 있는 상품이 없습니다. 이미 다른 적수 묶음에 포함된 상품은 표시되지 않습니다.</td></tr>';
  // 상품을 클릭하면 아래 '담은 상품'에 추가된다 (상품명에서 읽은 적수·단위를 초기값으로 제안)
  document.querySelectorAll("#regList tr[data-code]").forEach((tr) => tr.addEventListener("click", () => {
    const code = tr.dataset.code;
    if (REG.rows.some((r) => r.code === code)) { toast("이미 담은 상품입니다."); return; }
    const g = parsePack(P(code).name) ?? { qty:null, unit:"" };
    REG.rows.push({ code, qty:g.qty, unit:g.unit });
    if (!REG.rep) REG.rep = pickMain(REG.rows).code;
    drawRegList(); drawRegPicked();
  }));
}
function drawRegPicked(){
  el("regN").textContent = REG.rows.length;
  if (!REG.rows.length) {
    el("regPicked").innerHTML = '<div class="note">위 목록에서 상품을 클릭해 2개 이상 담아 주세요.</div>';
    el("regOk").disabled = true;
    return;
  }
  const rows = REG.rows.slice().sort(byQty);
  const nm = P(REG.rep).name.replace(/\s*\d+\s*(병|정|개|매|포|캡슐)?\s*$/, "").trim();
  el("regPicked").innerHTML =
    '<div class="tablewrap" style="max-height:220px"><table>'
    + '<colgroup><col style="width:34px"><col><col style="width:130px"><col style="width:72px"><col style="width:62px"><col style="width:56px"></colgroup>'
    + '<thead><tr><th class="ck">대표</th><th>상품명</th><th>표시명</th><th class="num">적수</th><th>단위</th><th></th></tr></thead><tbody>'
    + rows.map((r) => {
        return '<tr data-code="'+r.code+'">'
          + '<td class="ck"><input type="radio" name="regrep" '+(REG.rep===r.code?"checked":"")+' data-rep="'+r.code+'" /></td>'
          + '<td class="nm">'+P(r.code).name+'</td>'
          + '<td'+(displayName(nm, r)==="-"?' class="dash"':"")+'>'+displayName(nm, r)+'</td>'
          + '<td class="num"><input class="in-s'+(r.qty===null?" warn":"")+'" type="number" min="1" value="'+(r.qty??"")+'" placeholder="-" data-f="qty" /></td>'
          + '<td><input class="in-s unit'+(!r.unit?" warn":"")+'" value="'+(r.unit||"")+'" placeholder="-" data-f="unit" /></td>'
          + '<td><button class="btn sm" data-drop="'+r.code+'">제외</button></td></tr>';
      }).join("")
    + '</tbody></table></div>'
    + '<div class="note">묶음명은 대표상품명 <b>'+nm+'</b> 으로 등록됩니다. 기존 상품명은 수정하지 않습니다.</div>';

  document.querySelectorAll("#regPicked [data-rep]").forEach((x) => x.addEventListener("change", () => { REG.rep = x.dataset.rep; drawRegPicked(); }));
  document.querySelectorAll("#regPicked input[data-f]").forEach((inp) => inp.addEventListener("change", () => {
    const r = REG.rows.find((y) => y.code === inp.closest("tr").dataset.code);
    if (inp.dataset.f === "qty") r.qty = inp.value === "" ? null : Number(inp.value);
    else r.unit = inp.value.trim();
    drawRegPicked();
  }));
  document.querySelectorAll("#regPicked [data-drop]").forEach((b) => b.addEventListener("click", () => {
    REG.rows = REG.rows.filter((r) => r.code !== b.dataset.drop);
    if (REG.rep === b.dataset.drop) REG.rep = REG.rows.length ? pickMain(REG.rows).code : null;
    drawRegList(); drawRegPicked();
  }));
  const unk = REG.rows.filter(isUnk).length;
  el("regOk").disabled = REG.rows.length < 2 || unk > 0;
}
el("regSearch").addEventListener("click", drawRegList);
el("regQ").addEventListener("keydown", (e) => { if (e.key === "Enter") drawRegList(); });
el("regOk").addEventListener("click", () => {
  const nm = P(REG.rep).name.replace(/\s*\d+\s*(병|정|개|매|포|캡슐)?\s*$/, "").trim();
  const gid = "G" + String(GROUPS.length + 3).padStart(3, "0");
  GROUPS.unshift({ id: gid, name: nm, rep: REG.rep, upd: "09-10",
    items: REG.rows.map((r) => ({ code:r.code, qty:r.qty, unit:r.unit })) });
  curId = gid; editing = false; draft = null;
  closeM("regModal"); renderGroups(); renderDetail();
  toast(nm + " 적수 묶음을 등록했습니다.");
});

/* ── 초기 렌더 ──────────────────────────────────────────────── */
renderGroups(); renderDetail();
const qs = new URLSearchParams(location.search);
if (qs.get("modal") === "reg") {
  el("openReg").click();
  const pick = (qs.get("pick") || "").split(",").filter(Boolean);   // 리뷰 링크용 — 담은 상태로 열기
  if (pick.length) {
    pick.forEach((code) => { const g = parsePack(P(code).name) ?? { qty:null, unit:"" }; REG.rows.push({ code, qty:g.qty, unit:g.unit }); });
    REG.rep = pickMain(REG.rows).code; drawRegList(); drawRegPicked();
  }
}
if (qs.get("modal") === "add") {
  el("btnAdd")?.click();
  const pick = qs.get("pick");   // 리뷰 링크용 — 선택 상태로 열기
  if (pick) { const g2 = parsePack(P(pick).name) ?? { qty:null, unit:"" }; addDraft = { code:pick, qty:g2.qty, unit:g2.unit }; drawAddList(); drawAddInfo(); }
}
if (qs.get("g")) { curId = qs.get("g"); renderGroups(); renderDetail(); }
if (qs.get("edit") === "1") el("btnEdit")?.click();
