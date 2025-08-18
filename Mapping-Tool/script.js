// Daten/State
const dataTypes = ["POI", "Tour", "Event", "Gastro", "Hotel", "Angebot"];
let selectedDataType = null;
let selectedSource = "systemA";
let viewMode = "field";

const systems = { source: [{ id: "systemA", name: "Outdooractive" }] };
const byId = new Map(systems.source.map(s => [s.id, s]));
const targetName = "SaTourN";

const mappings = {
  POI:   { systemA: { name: "title", description: "summary" } },
  Tour:  { systemA: { route: "track", difficulty: "level" } },
  Event: { systemA: { event_name: "headline", time: "start_time" } },
  Gastro:{ systemA: {} }
};
// Falls vorhanden, hier Kategorie-Mappings eintragen
const categoryMappings = undefined;

const labels = {
  source_field: "Feld in Outdooractive",
  target_field: "Feld in SaTourN",
  category_source: "Kategorie in Outdooractive",
  category_target: "Kategorie in SaTourN",
  name: "Name", description: "Beschreibung", title: "Titel", summary: "Zusammenfassung",
  content: "Inhalt", route: "Route", difficulty: "Schwierigkeitsgrad",
  event_name: "Veranstaltungsname", time: "Zeit", headline: "Überschrift",
  start_time: "Startzeit", poi_headline: "POI-Titel", poi_body: "POI-Inhalt"
};

// DOM-Helper
const $  = s => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const n = document.createElement(tag);
  Object.entries(props).forEach(([k,v]) => {
    if (k === "class") n.className = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k === "attrs") Object.entries(v).forEach(([a,val]) => n.setAttribute(a,val));
    else if (k === "role" || k.startsWith("aria-") || k.startsWith("data-") || k.includes("-")) n.setAttribute(k, v);
    else n[k] = v;
  });
  kids.flat().forEach(k => n.append(k?.nodeType ? k : document.createTextNode(k)));
  return n;
};
const L = k => labels[k] || k;

// Sortierfunktion
function makeSortable(table){
  const ths = [...table.querySelectorAll('thead th')];
  ths.forEach((th,i)=>{
    th.style.cursor='pointer';
    th.setAttribute('aria-sort','none');
    th.title = 'Klicken zum Sortieren';
    th.addEventListener('click', ()=>{
      const dir = th.dataset.sortDir === 'asc' ? 'desc' : 'asc';
      ths.forEach(h=>{ if(h!==th){ h.removeAttribute('data-sort-dir'); h.setAttribute('aria-sort','none'); }});
      th.dataset.sortDir = dir;
      th.setAttribute('aria-sort', dir === 'asc' ? 'ascending' : 'descending');

      const rows=[...table.tBodies[0].rows];
      rows.sort((a,b)=>{
        const va=a.cells[i].textContent.trim().toLowerCase();
        const vb=b.cells[i].textContent.trim().toLowerCase();
        return dir==='asc'
          ? va.localeCompare(vb, 'de', { sensitivity:'base' })
          : vb.localeCompare(va, 'de', { sensitivity:'base' });
      });
      rows.forEach(r=>table.tBodies[0].appendChild(r));
    });
  });
}

// Chips (Datenarten)
function renderTypeChips(){
  const wrap = $("#dataTypes");
  wrap.innerHTML = "";
  dataTypes.forEach(t => {
    const chip = el("button", {
      class: "chip" + (selectedDataType===t ? " active" : ""),
      textContent: t,
      type: "button",
      onclick: e => {
        selectedDataType = t;
        wrap.querySelectorAll(".chip").forEach(b => b.classList.toggle("active", b === e.currentTarget));
        renderMapping();
      }
    });
    wrap.append(chip);
  });
}

// Mapping-Ansicht
function renderMapping() {
  const container = $("#mappingDisplay");
  container.innerHTML = "";

  if (!selectedDataType) {
    container.innerHTML = `<div class="table-wrap" style="color:var(--muted)">Bitte zuerst Datenart und Datentyp wählen.</div>`;
    return;
  }
  const map = (viewMode === 'category')
    ? (categoryMappings?.[selectedDataType]?.[selectedSource] || {})
    : (mappings[selectedDataType]?.[selectedSource] || {});
  if (!map || !Object.keys(map).length) {
    container.innerHTML = `<div class="table-wrap" style="color:var(--muted)">Kein Mapping für diese Kombination vorhanden.</div>`;
    return;
  }

  const tools = el('div',{class:'sticky-tools'},
    el('div',{class:'pills'},
      el('span',{class:'pill-name'}, byId.get(selectedSource)?.name || selectedSource),
      el('span',{class:'pill-sep','aria-hidden':'true'}, '→'),
      el('span',{class:'pill-name'}, targetName)
    ),
    el('div',{class:'pills'}, `${selectedDataType} • ${viewMode === 'category' ? 'Kategorien' : 'Felder'}`)
  );
  container.append(tools);

  const wrap = el('div',{class:'table-wrap'});
  const entries = Object.entries(map).map(([src, tgt]) => ({ src: L(src), tgt: L(tgt) }));

  const headers = (viewMode === "category")
    ? [L("category_source"), L("category_target")]
    : [L("source_field"), L("target_field")];

  const thead = el("thead", {},
    el("tr", {}, ...headers.map(h => el("th", { textContent: h })))
  );

  const rows = entries.map(r => {
    const left  = el("td",{class:'code'}, r.src);
    const right = (r.tgt == null || String(r.tgt).trim() === "")
      ? el("td",{}, el("span",{class:'cell-missing'}, "— fehlt —"))
      : el("td",{}, r.tgt);
    const tr = el("tr", {}, left, right);
    if (r.tgt == null || String(r.tgt).trim() === "") tr.classList.add('row-warn');
    return tr;
  });

  const tbody = el("tbody", {}, ...rows);
  const table = el("table", { id:"mappingTable" }, thead, tbody);
  wrap.append(table);
  container.append(wrap);

  makeSortable(table);
}

/* ---------- Globale Suche über alle Datenarten/-typen ---------- */
const globalIndex = []; // {dataType, view, sourceId, sourceName, srcKey, tgtKey, srcLabel, tgtLabel}

function buildGlobalIndex(){
  globalIndex.length = 0;

  // Felder
  Object.entries(mappings || {}).forEach(([dataType, bySource]) => {
    Object.entries(bySource || {}).forEach(([sourceId, mapObj]) => {
      const sourceName = byId.get(sourceId)?.name || sourceId;
      Object.entries(mapObj || {}).forEach(([srcKey, tgtKey]) => {
        globalIndex.push({
          dataType, view:'field', sourceId, sourceName,
          srcKey, tgtKey, srcLabel:L(srcKey), tgtLabel:L(tgtKey)
        });
      });
    });
  });

  // Kategorien (optional)
  if (typeof categoryMappings !== 'undefined' && categoryMappings) {
    Object.entries(categoryMappings || {}).forEach(([dataType, bySource]) => {
      Object.entries(bySource || {}).forEach(([sourceId, mapObj]) => {
        const sourceName = byId.get(sourceId)?.name || sourceId;
        Object.entries(mapObj || {}).forEach(([srcKey, tgtKey]) => {
          globalIndex.push({
            dataType, view:'category', sourceId, sourceName,
            srcKey, tgtKey, srcLabel:L(srcKey), tgtLabel:L(tgtKey)
          });
        });
      });
    });
  }
}

function buildGlobalSuggestions() {
  const set = new Set();
  globalIndex.forEach(r => {
    [r.dataType, r.sourceName, r.srcKey, r.tgtKey, r.srcLabel, r.tgtLabel]
      .filter(Boolean).forEach(v => set.add(String(v)));
  });
  const globalList  = $("#globalSuggestions");
  const options = [...set].sort((a,b)=>a.localeCompare(b,'de',{sensitivity:'base'}));
  globalList.innerHTML = options.map(v => `<option value="${v}">`).join('');
}

function matchesRow(r, q){
  const hay = [
    r.dataType, r.view, r.sourceId, r.sourceName,
    r.srcKey, r.tgtKey, r.srcLabel, r.tgtLabel
  ].filter(Boolean).join(' ').toLowerCase();
  return hay.includes(q);
}

function renderSearchResults(query){
  const container = $("#mappingDisplay");
  container.innerHTML = "";

  const q = query.trim().toLowerCase();
  const results = q ? globalIndex.filter(r => matchesRow(r, q)) : [];

  const info = el('div', { class:'sticky-tools' },
    el('div', { class:'pills' },
      el('span', { class:'pill-name' }, 'Suche'),
      el('span', { class:'pill-sep', 'aria-hidden':'true' }, '→'),
      el('span', { class:'pill-name' }, q ? `"${query}"` : 'leer')
    ),
    el('div', { class:'pills' }, `${results.length} Treffer`)
  );
  container.append(info);

  const wrap = el('div',{class:'table-wrap'});
  if (!q) {
    wrap.append(el('div', { style:'color:var(--muted)' }, 'Bitte einen Suchbegriff eingeben.'));
    container.append(wrap);
    return;
  }
  if (results.length === 0) {
    wrap.append(el('div', { style:'color:var(--muted)' }, 'Keine Treffer gefunden.'));
    container.append(wrap);
    return;
  }

  const headers = ['Datenart', 'Typ', 'Quelle', 'Quelle Feld/Kategorie', 'Ziel Feld/Kategorie'];
  const thead = el('thead', {}, el('tr', {}, ...headers.map(h => el('th', { textContent: h }))));
  const rows = results.map(r => {
    const typ = r.view === 'category' ? 'Kategorie' : 'Feld';
    const left = `${r.srcLabel} (${r.srcKey})`;
    const right = r.tgtKey == null || String(r.tgtKey).trim()==='' ? '— fehlt —' : `${r.tgtLabel} (${r.tgtKey})`;
    const tr = el('tr', {},
      el('td', {}, r.dataType),
      el('td', {}, typ),
      el('td', {}, r.sourceName),
      el('td', { class:'code' }, left),
      el('td', {}, right)
    );
    if (r.tgtKey == null || String(r.tgtKey).trim()==='') tr.classList.add('row-warn');
    return tr;
  });
  const tbody = el('tbody', {}, ...rows);
  const table = el('table', { id:'searchResultsTable' }, thead, tbody);
  wrap.append(table);
  container.append(wrap);

  makeSortable(table);
}

/* Events */
$("#viewFieldBtn").addEventListener("click", () => {
  viewMode = "field";
  $("#viewFieldBtn").classList.add("active"); $("#viewFieldBtn").setAttribute('aria-selected','true');
  $("#viewCategoryBtn").classList.remove("active"); $("#viewCategoryBtn").setAttribute('aria-selected','false');
  renderMapping();
});
$("#viewCategoryBtn").addEventListener("click", () => {
  viewMode = "category";
  $("#viewCategoryBtn").classList.add("active"); $("#viewCategoryBtn").setAttribute('aria-selected','true');
  $("#viewFieldBtn").classList.remove("active"); $("#viewFieldBtn").setAttribute('aria-selected','false');
  renderMapping();
});

/* Globale Suche */
const globalInput = $("#globalSearchInput");
const clearBtn = $("#clearSearch");
globalInput.addEventListener("input", () => {
  const q = globalInput.value;
  if (q.trim() === "") {
    renderMapping();
  } else {
    renderSearchResults(q);
  }
});
clearBtn.addEventListener("click", () => {
  globalInput.value = "";
  renderMapping();
});

/* Init */
buildGlobalIndex();
buildGlobalSuggestions();
renderTypeChips();
renderMapping();
