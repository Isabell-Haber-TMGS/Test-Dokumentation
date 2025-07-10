const data = {
  standard: [
    { prefix: "title", description: "Titel-Suche", example: "q=title:Golfplatz", type: "Query.Standard" },
    { prefix: "category", description: "Suche nach bestimmten Kategorien", example: "q=category:Golf", type: "Query.Singleword" },
    { prefix: "keyword", description: "Keyword-Suche", example: "q=keyword:XYZ", type: "Query.Singleword" },
    { prefix: "rating_*", description: "Bewertungen", example: "q=rating_pricerange:[50 TO 100]", type: "Query.Rating" },
    { prefix: "highlight", description: "Markierung", example: "q=highlight:true", type: "Query.Boolean" },
    { prefix: "accessibility", description: "Barrierefrei", example: "q=accessibility:true", type: "Query.Boolean" },
    { prefix: "child_friendly", description: "Familienfreundlich", example: "q=child_friendly:true", type: "Query.Boolean" },
    { prefix: "globalid", description: "Globale ID", example: "q=globalid:1_123", type: "Query.Exact" },
    { prefix: "channelid", description: "Kanal-ID", example: "q=channelid:1", type: "Query.Integer" },
    { prefix: "sourceid", description: "Partner-ID", example: "q=sourceid:123", type: "Query.Exact" },
    { prefix: "contentid", description: "", example: "q=contentid:1", type: "Query.Integer" }
  ],
  geo: [
    { prefix: "zip", description: "PLZ-Suche", example: "q=zip:93462", type: "Query.Standard" },
    { prefix: "city", description: "Stadt", example: "q=city:XYZ", type: "Query.Standard" },
    { prefix: "street", description: "Straße", example: "q=street:XYZ", type: "Query.Standard" },
    { prefix: "country", description: "Ländercode", example: "q=country:ITA", type: "Query.Standard" },
    { prefix: "area", description: "Region", example: "q=area:XYZ", type: "Query.Standard" },
    { prefix: "lat", description: "Breitengrad", example: "q=lat:[48.5 TO 49.0]", type: "Query.Double" },
    { prefix: "lon", description: "Längengrad", example: "q=lon:[12.1 TO 12.5]", type: "Query.Double" }
  ],
  spezial: [
    { prefix: "all", description: "Negation", example: "q=-category:Hotel AND all:all", type: "Query.All" },
    { prefix: "systag", description: "System-Tags", example: "q=systag:has_video", type: "Query.Systag" },
    { prefix: "nearlinestring", description: "Pfadsuche", example: "q=nearlinestring:...", type: "Query.Exact" },
    { prefix: "nearhashlink", description: "Umgebung", example: "q=nearhashlink:~30km ...", type: "Query.Exact" }
  ],
  tour: [
    { prefix: "length", description: "Länge", example: "q=length:[* TO 500]", type: "Query.Integer" },
    { prefix: "difficulty", description: "Schwierigkeit", example: "q=difficulty:[* TO 3]", type: "Query.Integer" },
    { prefix: "duration", description: "Dauer", example: "q=duration:[* TO 6000]", type: "Query.Integer" },
    { prefix: "altdiff", description: "Höhenmeter", example: "q=altdiff:[* TO 300]", type: "Query.Integer" },
    { prefix: "elevmax", description: "Höchster Punkt", example: "q=elevmax:[* TO 1000]", type: "Query.Double" },
    { prefix: "elevmin", description: "Tiefster Punkt", example: "q=elevmin:[500 TO *]", type: "Query.Double" },
    { prefix: "round_tour", description: "Rundtour", example: "q=round_tour:false", type: "Query.Boolean" },
    { prefix: "rest_stop", description: "Rastplatz", example: "q=rest_stop:true", type: "Query.Boolean" }
  ]
};

function highlight(text, term) {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function renderTable(section, data) {
  const filterText = document.getElementById('filter').value.toLowerCase();
  const wrapper = document.getElementById(`${section}-content`);
  const arrow = document.getElementById(`arrow-${section}-content`);
  const tbody = document.getElementById(`${section}-table`);

  tbody.innerHTML = '';
  const filtered = data.filter(p =>
    p.prefix.toLowerCase().includes(filterText) ||
    (p.description && p.description.toLowerCase().includes(filterText))
  );

  if (filterText && filtered.length > 0) {
    wrapper.classList.remove('collapsed');
    arrow.textContent = 'expand_more';
  } else if (filterText) {
    wrapper.classList.add('collapsed');
    arrow.textContent = 'chevron_right';
  }

  filtered.sort((a, b) => a.prefix.localeCompare(b.prefix)).forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${highlight(p.prefix, filterText)}</strong></td>
      <td>${highlight(p.description || '-', filterText)}</td>
      <td class="example">${highlight(p.example || '-', filterText)}</td>
      <td>${highlight(p.type || '-', filterText)}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderAllTables() {
  for (const section in data) {
    renderTable(section, data[section]);
  }
}

function toggleSection(id) {
  const wrapper = document.getElementById(id);
  const arrow = document.getElementById('arrow-' + id);
  wrapper.classList.toggle('collapsed');
  arrow.textContent = wrapper.classList.contains('collapsed') ? 'chevron_right' : 'expand_more';
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  document.getElementById('mode-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
}

function showSuggestions() {
  const input = document.getElementById('filter');
  const val = input.value.toLowerCase();
  const suggestions = document.getElementById('suggestions');
  const allItems = Object.values(data).flat();

  if (!val) return suggestions.style.display = 'none';

  const matches = allItems
    .map(d => [d.prefix, d.description])
    .flat()
    .filter(text => text && text.toLowerCase().includes(val))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  suggestions.innerHTML = matches.map(m =>
    `<li onclick="selectSuggestion('${m.replace(/'/g, "\\'")}')">${m}</li>`
  ).join('');
  suggestions.style.display = matches.length ? 'block' : 'none';
}

function selectSuggestion(text) {
  const input = document.getElementById('filter');
  input.value = text;
  document.getElementById('suggestions').style.display = 'none';
  renderAllTables();
}

document.addEventListener('click', e => {
  if (!document.getElementById('suggestions').contains(e.target) &&
      e.target.id !== 'filter') {
    document.getElementById('suggestions').style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sections');
  for (const section in data) {
    container.innerHTML += `
      <table onclick="toggleSection('${section}-content')">
        <tr>
          <td colspan="4" class="section-header">
            <span class="material-icons" id="arrow-${section}-content">chevron_right</span>
            ${section.charAt(0).toUpperCase() + section.slice(1)}
          </td>
        </tr>
      </table>
      <div id="${section}-content" class="collapsible collapsed">
        <table>
          <colgroup><col><col><col><col></colgroup>
          <thead><tr><th>Prefix</th><th>Beschreibung</th><th>Beispiel</th><th>Typ</th></tr></thead>
          <tbody id="${section}-table"></tbody>
        </table>
      </div>
    `;
  }
  renderAllTables();
  toggleDarkMode(); // einmal ein/aus zur Initialisierung
  toggleDarkMode();
});
