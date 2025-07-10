const dataTypes = {"POI", "Tour", "Event", "Gastro", "Hotel"];
let selectedDataType = dataTypes[0]; //default

const systems = {
  source: [
    { id: "systemA", name:"Outdooractive", logo: "https://digitizetheplanet.org/wp-content/uploads/2024/07/8815_433571-2048x1365.gif" };
    { id: "systemB", name:"Feratel", logo: "https://www.feratel.de/fileadmin/user_upload/Logo-white.svg" }
];
  target: [
    { id: "systemX", name:"SaTourN" }
]
};

// Mappings nach System und Datenart
const mappings = {
  POI: {
    systemA: {
      systemA: { name: "title", description: "summary" },
      systemX: { name: "Titel", description: "Titel" }
    },
    systemB: {
      systemB: { name: "Titel", description: "Titel", }
      systemX: { name: Titel", description: "Titel" }
               }
},
let selectedSource = null;
let selectedTarget = null;

function createSystemCards(containerId, systemsList, type) {
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
      if (type === "source") selectedSource = system.id;
      else selectedTarget = system.id;
    };
    container.appendChild(div);
  });
}

function createDataTypeButtons() {
  const container = document.getElementById("dataTypes");
  dataTypes.forEach(type => {
    const btn = document.createElement("button");
    btn.textContent = type;
    if (type === selectedDataType) btn.classList.add("active");
    btn.onclick = () => {
      selectedDataType = type;
      document.querySelectorAll("#dataTypes button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    };
    container.appendChild(btn);
  });
}

function renderMapping() {
  const tableBody = document.querySelector("#mappingTable tbody");
  tableBody.innerHTML = "";

  if (!selectedSource || !selectedTarget) {
    tableBody.innerHTML = `<tr><td colspan="3">Bitte Quell- und Zielsystem auswählen.</td></tr>`;
    return;
  }

  const selectedMapping = mappings[selectedDataType]?.[selectedSource]?.[selectedTarget];

  if (!selectedMapping) {
    tableBody.innerHTML = `<tr><td colspan="3">Kein Mapping für diese Kombination vorhanden.</td></tr>`;
    return;
  }

  for (const [sourceField, targetField] of Object.entries(selectedMapping)) {
    const row = `<tr><td>${sourceField}</td><td>→</td><td>${targetField}</td></tr>`;
    tableBody.insertAdjacentHTML("beforeend", row);
  }
}

// Initialisierung
createSystemCards("sourceSystems", systems.source, "source");
createSystemCards("targetSystems", systems.target, "target");
createDataTypeButtons();
