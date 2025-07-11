const data = {
  Basis: [
    { prefix: "template", description: "Verwendung der Seite für Streaming", example: "http://demo.et4.de/ort/?page_id=204" },
    { prefix: "subdomain", description: "Subdomain des Projekts", example: "pages.sachsen-tourismus.de" }
  ],
  Boerse: [
    { prefix: "confirm_email_template", description: "Vorlage zum Versenden von E-Mails", example: "" }
  ]
};

function highlight(text, term) {
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

function formatExampleAsList(example, filterText) {
  if (!example || example.trim() === '') return '-';
  const items = example.split(/;\s*/);
  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = highlight(item.trim(), filterText);
    ul.appendChild(li);
  });
  return ul.outerHTML;
}

function renderTable(section, entries) {
  const filterText = document.getElementById('filter').value.toLowerCase();
  const container = document.getElementById(`${section}-table`);
  container.innerHTML = '';

  const filtered = entries.filter(entry =>
    [entry.prefix, entry.description, entry.example]
      .some(field => field && field.toLowerCase().includes(filterText))
  );

  for (const entry of filtered.sort((a, b) => a.prefix.localeCompare(b.prefix))) {
    const row = document.createElement('tr');

    const td1 = document.createElement('td');
    td1.innerHTML = `<strong>${highlight(entry.prefix, filterText)}</strong>`;

    const td2 = document.createElement('td');
    td2.innerHTML = highlight(entry.description || '-', filterText);

    const td3 = document.createElement('td');
    td3.className = 'example';
    td3.innerHTML = formatExampleAsList(entry.example, filterText);

    row.append(td1, td2, td3);
    container.appendChild(row);
  }
}

function renderAllTables() {
  for (const section in data) {
    renderTable(section, data[section]);
  }
}

function toggleSection(id, button) {
  const wrapper = document.getElementById(id);
  const arrow = document.getElementById('arrow-' + id);
  const isCollapsed = wrapper.classList.toggle('collapsed');
  arrow.textContent = isCollapsed ? '▶' : '▼';
  button.setAttribute('aria-expanded', !isCollapsed);
  wrapper.setAttribute('aria-hidden', isCollapsed);
}

function toggleDarkMode() {
  document.body.classList.toggle('dark');
  const button = document.getElementById('toggle-mode');
  const isDark = document.body.classList.contains('dark');
  button.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  button.setAttribute('aria-label', isDark ? 'Light Mode umschalten' : 'Dark Mode umschalten');
}

function showSuggestions() {
  const input = document.getElementById('filter');
  const val = input.value.toLowerCase();
  const suggestions = document.getElementById('suggestions');
  const allItems = Object.values(data).flat();

  if (!val) {
    suggestions.style.display = 'none';
    return;
  }

  const matches = allItems.flatMap(d => [d.prefix, d.description])
    .filter(t => t && t.toLowerCase().includes(val))
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 10);

  suggestions.innerHTML = '';
  matches.forEach(match => {
    const li = document.createElement('li');
    li.textContent = match;
    li.onclick = () => selectSuggestion(match);
    suggestions.appendChild(li);
  });

  suggestions.style.display = matches.length ? 'block' : 'none';
}

function selectSuggestion(text) {
  const input = document.getElementById('filter');
  input.value = text;
  document.getElementById('suggestions').style.display = 'none';
  renderAllTables();
}

function handleFilter() {
  renderAllTables();
  showSuggestions();
}

document.addEventListener('click', e => {
  if (!document.getElementById('suggestions').contains(e.target) && e.target.id !== 'filter') {
    document.getElementById('suggestions').style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('sections');

  for (const section in data) {
    const sectionId = `${section}-content`;

    const headerButton = document.createElement('button');
    headerButton.className = 'section-header';
    headerButton.setAttribute('aria-expanded', 'false');
    headerButton.setAttribute('aria-controls', sectionId);
    headerButton.onclick = () => toggleSection(sectionId, headerButton);
    headerButton.innerHTML = `<span id="arrow-${sectionId}">▶</span> ${section}`;

    const wrapper = document.createElement('div');
    wrapper.id = sectionId;
    wrapper.className = 'collapsible collapsed';
    wrapper.setAttribute('role', 'region');
    wrapper.setAttribute('aria-hidden', 'true');

    const table = document.createElement('table');
    table.innerHTML = `
      <colgroup><col><col><col></colgroup>
      <thead><tr><th>Parameter</th><th>Beschreibung</th><th>Mögliche Werte</th></tr></thead>
      <tbody id="${section}-table"></tbody>
    `;

    wrapper.appendChild(table);
    container.appendChild(headerButton);
    container.appendChild(wrapper);
  }

  renderAllTables();
});
