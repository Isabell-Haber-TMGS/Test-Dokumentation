const dataTypes = ["POI", "Tour", "Event"];
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
    systemA: { name: "title", description: "summary" }
  },
  Tour: {
    systemA: { route: "track", difficulty: "level" }
  },
  Event: {
    systemA: { event_name: "headline", time: "start_time" }
  }
};

const translations = {
  de: {
    name: "Name", description: "Beschreibung", location: "Ort",
    title: "Titel", summary: "Zusammenfassung", content: "Inhalt",
    poi_name: "POI-Name", poi_desc: "POI-Beschreibung",
    route: "Route", difficulty: "Schwierigkeitsgrad",
    event_name: "Veranstaltungsname", time: "Zeit",
    poi_headline: "POI-Titel", poi_body: "POI-Inhalt",
    track: "Route", level: "Schwierigkeitsgrad",
    headline: "Überschrift", start_time: "Startzeit"
  },
  en: {
    name: "Name", description: "Description", location: "Location",
    title: "Title", summary: "Summary", content: "Content",
    poi_name: "POI Name", poi_desc: "POI Description",
    route: "Route", difficulty: "Difficulty",
    event_name: "Event Name", time: "Time",
    poi_headline: "POI Headline", poi_body: "POI Content",
    track: "Track", level: "Difficulty Level",
    headline: "Headline", start_time: "Start Time"
  }
};

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
    if (system.id === selectedSource) {
      div.classList.add("selected");
    }
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
  if (!mapping) {
    container.innerHTML = "<p>Kein Mapping für diese Kombination vorhanden.</p>";
    return;
  }

  const sourceName = systems.source.find(s => s.id === selectedSource)?.name || selectedSource;
  const targetName = "SaTourN";

  const block = document.createElement("div");
  block.className = "mapping-block";

  const table = document.createElement("table");
  table.setAttribute("id", "mappingTable");
  table.innerHTML = `
    <thead>
      <tr><th colspan="3">${sourceName} → ${targetName}</th></tr>
      <tr><th>Feld im Quellsystem</th><th>→</th><th>Feld im Zielsystem</th></tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  for (const [sourceField, targetField] of Object.entries(mapping)) {
    const sourceLabel = translations[selectedLanguage]?.[sourceField] || sourceField;
    const targetLabel = translations[selectedLanguage]?.[targetField] || targetField;
    const row = `<tr><td>${sourceLabel}</td><td>→</td><td>${targetLabel}</td></tr>`;
    tbody.insertAdjacentHTML("beforeend", row);
  }

  block.appendChild(table);
  container.appendChild(block);
}

function exportPDF() {
  const table = document.getElementById("mappingTable");
  if (!table) {
    alert("Keine Tabelle zum Exportieren vorhanden.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const title = table.querySelector("thead tr:first-child th")?.textContent || "Mapping-Tabelle";
  doc.setFontSize(14);
  doc.text(title, 105, 15, { align: "center" });

  const rows = Array.from(table.querySelectorAll("tbody tr")).map(row => {
    const cells = row.querySelectorAll("td");
    return [cells[0].textContent.trim(), "→", cells[2].textContent.trim()];
  });

  doc.autoTable({
    head: [["Feld im Quellsystem", "→", "Feld im Zielsystem"]],
    body: rows,
    startY: 25,
    theme: 'grid',
    headStyles: { fillColor: [0, 123, 255] }
  });

  doc.save("mapping.pdf");
}

function exportCSV() {
  const table = document.getElementById("mappingTable");
  if (!table) {
    alert("Keine Tabelle zum Exportieren vorhanden.");
    return;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr"));
  let csvContent = "Feld im Quellsystem,Feld im Zielsystem\n";

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const source = cells[0].textContent.trim();
    const target = cells[2].textContent.trim();
    csvContent += `"${source}","${target}"\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mapping.csv";
  link.click();
}

function exportJSON() {
  const table = document.getElementById("mappingTable");
  if (!table) {
    alert("Keine Tabelle zum Exportieren vorhanden.");
    return;
  }

  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const data = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    const source = cells[0].textContent.trim();
    const target = cells[2].textContent.trim();
    data.push({ source, target });
  });

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "mapping.json";
  link.click();
}

// Init
createSystemCards("sourceSystems", systems.source);
createDataTypeButtons();
createLanguageButtons();
