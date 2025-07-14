// === Datenquellen und Übersetzungen ===
const dataTypes = ["POI", "Tour", "Event", "Gastro", "Hotel", "Angebot"];
const languages = ["de", "en"];
let selectedDataType = dataTypes[0];
let selectedLanguage = languages[0];
let selectedSource = null;

const systems = {
  source: [
    { id: "systemA", name: "Outdooractive", logo: "https://corporate.outdooractive.com/press/wp-content/uploads/sites/12/2023/01/Logo-Outdooractive-green.png" },
    { id: "systemB", name: "Feratel", logo: "https://www.feratel.com/typo3conf/ext/icc_template/Resources/Public/Img/logo-feratel.svg" }
  ]
};

const mappings = {
  POI: {
    systemA: { name: "title", description: "summary" },
    systemB: { title: "poi_headline", content: "poi_body" }
  },
  Tour: {
    systemA: { route: "track", difficulty: "level" }
  },
  Event: {
    systemA: { event_name: "headline", time: "start_time" }
  },
  Gastro: { systemA: {} }
};

const translations = {
  de: {
    name: "Name", description: "Beschreibung", title: "Titel", summary: "Zusammenfassung",
    content: "Inhalt", route: "Route", difficulty: "Schwierigkeitsgrad",
    event_name: "Veranstaltungsname", time: "Zeit", field_type: "Feldtyp",
    source_field: "Feld im Quellsystem", target_field: "Feld in SaTourN",
    headline: "Überschrift", start_time: "Startzeit", poi_headline: "POI-Titel", poi_body: "POI-Inhalt"
  },
  en: {
    name: "Name", description: "Description", title: "Title", summary: "Summary",
    content: "Content", route: "Route", difficulty: "Difficulty",
    event_name: "Event Name", time: "Time", field_type: "Field type",
    source_field: "Source field", target_field: "Target field",
    headline: "Headline", start_time: "Start Time", poi_headline: "POI Headline", poi_body: "POI Content"
  }
};

// === Hilfsfunktionen ===
function inferFieldType(name) {
  name = name.toLowerCase();
  if (name.includes("time") || name.includes("date")) return "Datum/Zeit";
  if (name.includes("desc") || name.includes("summary") || name.includes("body")) return "Text";
  if (name.includes("title") || name.includes("name") || name.includes("headline")) return "Kurztext";
  if (name.includes("difficulty") || name.includes("level")) return "Kategorie";
  if (name.includes("route") || name.includes("track")) return "Pfad";
  return "Text";
}

// === UI-Erstellung ===
function createSystemCards(containerId, systemsList) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  systemsList.forEach(system => {
    const div = document.createElement("div");
    div.className = "system";
    div.dataset.id = system.id;
    div.innerHTML = `<img src="${system.logo}" alt="${system.name}"><div>${system.name}</div>`;
    div.onclick = () => {
      document.querySelectorAll(`#${containerId} .system`).forEach(el => el.classList.remove("selected"));
      div.classList.add("selected");
      selectedSource = system.id;
      renderMapping();
    };
    if (system.id === selectedSource) div.classList.add("selected");
    container.appendChild(div);
  });
}

function createDataTypeButtons() {
  const container = document.getElementById("dataTypes");
  container.innerHTML = '';
  dataTypes.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type;
    if (type === selectedDataType) btn.classList.add("active");
    btn.onclick = () => {
      selectedDataType = type;
      document.querySelectorAll("#dataTypes button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMapping();
    };
    container.appendChild(btn);
  });
}

function createLanguageButtons() {
  const container = document.getElementById("languageSelector");
  container.innerHTML = '';
  languages.forEach(lang => {
    const btn = document.createElement("button");
    btn.textContent = lang.toUpperCase();
    if (lang === selectedLanguage) btn.classList.add("active");
    btn.onclick = () => {
      selectedLanguage = lang;
      document.querySelectorAll("#languageSelector button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMapping();
    };
    container.appendChild(btn);
  });
}
function renderMapping() {
  const container = document.getElementById("mappingDisplay");
  container.innerHTML = "";
  if (!selectedSource || !selectedDataType) {
    container.innerHTML = "<p>Bitte ein Quellsystem und eine Datenart auswählen.</p>";
    return;
  }
  const mapping = mappings[selectedDataType]?.[selectedSource];
  if (!mapping || Object.keys(mapping).length === 0) {
    container.innerHTML = "<p>Kein Mapping für diese Kombination vorhanden.</p>";
    return;
  }

  const t = translations[selectedLanguage];
  const sourceName = systems.source.find(s => s.id === selectedSource)?.name || selectedSource;
  const targetName = "SaTourN";

  const table = document.createElement("table");
  table.id = "mappingTable";
  table.innerHTML = `
    <thead>
      <tr><th colspan="3">${sourceName} → ${targetName}</th></tr>
      <tr><th>${t.field_type}</th><th>${t.source_field}</th><th>${t.target_field}</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");
  const suggestions = new Set();

  for (const [sourceField, targetField] of Object.entries(mapping)) {
    const sourceLabel = t[sourceField] || sourceField;
    const targetLabel = t[targetField] || targetField;
    const type = inferFieldType(sourceField);
    suggestions.add(sourceLabel);
    suggestions.add(targetLabel);
    tbody.innerHTML += `<tr><td>${type}</td><td>${sourceLabel}</td><td>${targetLabel}</td></tr>`;
  }

  const datalist = document.getElementById("searchSuggestions");
  if (datalist) {
    datalist.innerHTML = "";
    suggestions.forEach(val => {
      datalist.innerHTML += `<option value="${val}">`;
    });
  }

  container.appendChild(table);
}

function exportPDF() {
  const table = document.getElementById("mappingTable");
  if (!table) return alert("Keine Tabelle zum Exportieren vorhanden.");
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const t = translations[selectedLanguage];
  const sourceName = systems.source.find(s => s.id === selectedSource)?.name || selectedSource;
  const targetName = "SaTourN";
  const title =
    selectedLanguage === "de"
      ? `Mapping von ${sourceName} zu ${targetName} für ${selectedDataType}`
      : `Mapping from ${sourceName} to ${targetName} for ${selectedDataType}`;

  doc.setFontSize(14);
  doc.text(title, 105, 15, { align: "center" });

  const rows = Array.from(table.querySelectorAll("tbody tr")).map(row => {
    const cells = row.querySelectorAll("td");
    return [cells[0].textContent.trim(), cells[1].textContent.trim(), cells[2].textContent.trim()];
  });

  doc.autoTable({
    head: [[t.field_type, t.source_field, t.target_field]],
    body: rows,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [0, 123, 255] }
  });

  doc.save("mapping.pdf");
}

function exportCSV() {
  const table = document.getElementById("mappingTable");
  if (!table) return alert("Keine Tabelle zum Exportieren vorhanden.");
  const t = translations[selectedLanguage];
  const rows = Array.from(table.querySelectorAll("tbody tr"));
  let csv = `${t.field_type},${t.source_field},${t.target_field}\n`;
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    csv += `"${cells[0].textContent}","${cells[1].textContent}","${cells[2].textContent}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mapping.csv";
  link.click();
}

function exportJSON() {
  const table = document.getElementById("mappingTable");
  if (!table) return alert("Keine Tabelle zum Exportieren vorhanden.");
  const data = Array.from(table.querySelectorAll("tbody tr")).map(row => {
    const cells = row.querySelectorAll("td");
    return {
      type: cells[0].textContent.trim(),
      source: cells[1].textContent.trim(),
      target: cells[2].textContent.trim()
    };
  });
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mapping.json";
  link.click();
}

function globalSearch() {
  const input = document.getElementById("globalSearchInput").value.toLowerCase();
  const container = document.getElementById("globalSearchResults");
  container.innerHTML = "";
  if (!input) return;
  const results = [];
  for (const [dataType, systemMap] of Object.entries(mappings)) {
    for (const [systemId, mapping] of Object.entries(systemMap)) {
      for (const [sourceField, targetField] of Object.entries(mapping)) {
        const t = translations[selectedLanguage];
        const sourceLabel = t[sourceField] || sourceField;
        const targetLabel = t[targetField] || targetField;
        const type = inferFieldType(sourceField);
        if (
          sourceLabel.toLowerCase().includes(input) ||
          targetLabel.toLowerCase().includes(input)
        ) {
          results.push({ dataType, systemId, sourceLabel, targetLabel, type });
        }
      }
    }
  }
  if (results.length === 0) {
    container.innerHTML = "<p>Keine Treffer gefunden.</p>";
    return;
  }
  const table = document.createElement("table");
  table.innerHTML = `
    <thead><tr>
      <th>Datenart</th><th>System</th><th>${translations[selectedLanguage].field_type}</th>
      <th>${translations[selectedLanguage].source_field}</th><th>${translations[selectedLanguage].target_field}</th>
    </tr></thead><tbody>
    ${results.map(r => `
      <tr style="cursor:pointer" onclick="selectAndShow('${r.dataType}', '${r.systemId}')">
        <td>${r.dataType}</td><td>${systems.source.find(s => s.id === r.systemId)?.name || r.systemId}</td>
        <td>${r.type}</td><td>${r.sourceLabel}</td><td>${r.targetLabel}</td>
      </tr>`).join("")}
  </tbody>`;
  container.appendChild(table);

  const list = document.getElementById("globalSuggestions");
  list.innerHTML = "";
  new Set(results.flatMap(r => [r.sourceLabel, r.targetLabel])).forEach(val => {
    list.innerHTML += `<option value="${val}">`;
  });
}

function selectAndShow(dataType, systemId) {
  selectedDataType = dataType;
  document.querySelectorAll("#dataTypes button").forEach(btn => {
    btn.classList.toggle("active", btn.textContent === dataType);
  });
  selectedSource = systemId;
  document.querySelectorAll("#sourceSystems .system").forEach(div => {
    div.classList.toggle("selected", div.dataset.id === systemId);
  });
  renderMapping();
  document.getElementById("mappingDisplay")?.scrollIntoView({ behavior: "smooth" });
}

// === Initialisierung ===
createSystemCards("sourceSystems", systems.source);
createDataTypeButtons();
createLanguageButtons();
