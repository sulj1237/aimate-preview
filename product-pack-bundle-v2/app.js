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

/* ── 적수 후보 (미처리 매칭 그룹) ─────────────────────────── */
const CANDS = [
  { id:"C01", rank:1, items:[ { code:"B001", qty:100, unit:"정", memo:"" }, { code:"B002", qty:300, unit:"정", memo:"" } ] },
  { id:"C02", rank:2, items:[ { code:"E001", qty:10,  unit:"정", memo:"" }, { code:"E002", qty:20,  unit:"정", memo:"" } ] },
  { id:"C03", rank:3, items:[ { code:"D001", qty:null, unit:"", memo:"포장정보 미확인" }, { code:"D002", qty:null, unit:"", memo:"포장정보 미확인" } ] },
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
  if (el("matchN")) el("matchN").textContent = liveCands().length;
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

/* ── 적수 매칭 목록 (모달) ─────────────────────────────────── */
const sel = {}, removed = new Map(), done = new Set(), skuOut = {}, expandedOut = new Set(), collapsed = new Set();
CANDS.forEach((c) => { sel[c.id] = new Set(c.items.map((i) => i.code)); skuOut[c.id] = new Set(); });
const liveCands = () => CANDS.filter((c) => !removed.has(c.id) && !done.has(c.id));

el("openMatch").addEventListener("click", () => { renderCands(); openM("matchModal"); });
el("openHistory").addEventListener("click", () => { drawHistory(); openM("hxModal"); });

function renderCands(){
  const list = liveCands().sort((a,b) => a.rank - b.rank);
  el("candCnt").textContent = list.length;
  el("histN").textContent = removed.size;
  el("matchN").textContent = list.length;

  const cell = (i) => {
    const p = P(i.code), memo = i.memo || "";
    return '<td>'+p.bc+'</td><td>'+p.mk+'</td><td class="num">'+won(p.buy)+'</td><td class="num">'+p.stock+'</td>'
      + '<td'+(isUnk(i)?' class="dash"':"")+'>'+packTxt(i)+'</td>'
      + '<td class="memo'+(memo?"":" dash")+'">'+(memo || "-")+'</td>';
  };
  el("candBody").innerHTML = list.map((c) => {
    const open = !collapsed.has(c.id);
    const live = c.items.filter((i) => !skuOut[c.id].has(i.code));
    const out = c.items.filter((i) => skuOut[c.id].has(i.code));
    const main = pickMain(live), rest = live.filter((i) => i !== main).sort(byQty);
    const picked = live.filter((i) => sel[c.id].has(i.code)).length;
    const head = '<tr class="grow '+(picked?"on":"")+'" data-g="'+c.id+'">'
      + '<td class="ck"><input type="checkbox" data-gck="'+c.id+'" '+(picked===live.length?"checked":"")+' /></td>'
      + '<td class="nm"><span class="caret" data-tg="'+c.id+'">'+(open?"▾":"▸")+'</span> '+P(main.code).name
      + '<span class="gbadge">적수 '+live.length+'건</span></td>' + cell(main) + '<td></td></tr>';
    if (!open) return head;
    const kids = rest.map((i) =>
      '<tr class="'+(sel[c.id].has(i.code)?"on":"")+'" data-c="'+c.id+'" data-code="'+i.code+'">'
      + '<td class="ck"><input type="checkbox" '+(sel[c.id].has(i.code)?"checked":"")+' /></td>'
      + '<td class="sub">└ '+P(i.code).name+'</td>' + cell(i)
      + '<td><button class="btn sm" data-skuout="'+c.id+'|'+i.code+'">제외</button></td></tr>').join("");
    let fold = "";
    if (out.length) {
      const openFold = expandedOut.has(c.id);
      fold = '<tr class="ex"><td></td><td colspan="8"><span class="caret" data-fold="'+c.id+'">'+(openFold?"▾":"▸")
        + '</span> 이전에 제외한 상품 '+out.length+'개</td></tr>'
        + (openFold ? out.map((i) =>
            '<tr class="ex"><td class="ck">–</td><td class="sub">└ '+P(i.code).name+'</td>' + cell(i)
            + '<td><button class="btn sm" data-skuback="'+c.id+'|'+i.code+'">다시 추가</button></td></tr>').join("") : "");
    }
    return head + kids + fold;
  }).join("") || '<tr><td colspan="9" class="empty">검토할 적수 후보가 없습니다.</td></tr>';

  document.querySelectorAll("#candBody tr[data-code]").forEach((tr) => tr.addEventListener("click", (e) => {
    if (e.target.dataset.tg || e.target.dataset.skuout || e.target.dataset.skuback) return;
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
  document.querySelectorAll("#candBody [data-fold]").forEach((x) => x.addEventListener("click", (e) => {
    e.stopPropagation();
    if (expandedOut.has(x.dataset.fold)) expandedOut.delete(x.dataset.fold); else expandedOut.add(x.dataset.fold);
    renderCands();
  }));
  document.querySelectorAll("#candBody [data-skuout]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation(); const [cid, code] = b.dataset.skuout.split("|");
    skuOut[cid].add(code); sel[cid].delete(code); renderCands(); toast("이 상품을 그룹에서 제외했습니다.");
  }));
  document.querySelectorAll("#candBody [data-skuback]").forEach((b) => b.addEventListener("click", (e) => {
    e.stopPropagation(); const [cid, code] = b.dataset.skuback.split("|");
    skuOut[cid].delete(code); sel[cid].add(code); renderCands(); toast("그룹에 다시 추가했습니다.");
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
      + (ready.length < pickedG.length ? " (2건 미만 선택 그룹 " + (pickedG.length - ready.length) + "개 제외)" : "")
    : "선택 없음";
  el("makeSel").disabled = ready.length === 0;
  el("dropSel").disabled = pickedG.length === 0;
  BAR = { picked: pickedG, ready };
}
let BAR = { picked: [], ready: [] };
el("dropSel").addEventListener("click", () => {
  BAR.picked.forEach((c) => removed.set(c.id, { at:"09-11", by:"약사(김)", n: c.items.length }));
  renderCands(); renderGroups(); toast("선택한 그룹을 제외했습니다. 제외 내역에서 복원할 수 있습니다.");
});
el("makeSel").addEventListener("click", () => openMake(BAR.ready.map((c) => c.id)));

function drawHistory(){
  el("hxBody").innerHTML = [...removed.entries()].map(([cid, meta]) => {
    const c = CANDS.find((x) => x.id === cid);
    return '<tr><td>'+meta.at+'</td><td class="nm">'+P(pickMain(c.items).code).name+' 계열</td>'
      + '<td class="num">'+meta.n+'개</td><td>'+meta.by+'</td>'
      + '<td><button class="btn sm" data-restore="'+cid+'">후보로 복원</button></td></tr>';
  }).join("") || '<tr><td colspan="5" class="empty">제외한 후보가 없습니다.</td></tr>';
  document.querySelectorAll("#hxBody [data-restore]").forEach((b) => b.addEventListener("click", () => {
    removed.delete(b.dataset.restore); drawHistory(); renderCands(); renderGroups(); toast("후보 목록으로 복원했습니다.");
  }));
}

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
    GROUPS.unshift({ id: gid, name: baseNameOf(g), rep: g.rep, upd: "09-11",
      items: g.rows.map((r) => ({ code:r.code, qty:r.qty, unit:r.unit })) });
    done.add(g.cid);
    curId = gid;
  });
  const n = MK.groups.length;
  closeM("mkModal"); closeM("matchModal");
  renderCands(); renderGroups(); renderDetail();
  toast(n + "개 묶음을 만들었습니다.");
});

/* ── 초기 렌더 ──────────────────────────────────────────────── */
renderGroups(); renderDetail();
const qs = new URLSearchParams(location.search);
if (qs.get("modal") === "match") el("openMatch").click();
if (qs.get("modal") === "make") { el("openMatch").click(); el("makeSel").click(); }
if (qs.get("modal") === "add") {
  el("btnAdd")?.click();
  const pick = qs.get("pick");   // 리뷰 링크용 — 선택 상태로 열기
  if (pick) { const g2 = parsePack(P(pick).name) ?? { qty:null, unit:"" }; addDraft = { code:pick, qty:g2.qty, unit:g2.unit }; drawAddList(); drawAddInfo(); }
}
if (qs.get("g")) { curId = qs.get("g"); renderGroups(); renderDetail(); }
if (qs.get("edit") === "1") el("btnEdit")?.click();
