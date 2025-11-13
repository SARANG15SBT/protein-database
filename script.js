// -------------------- State --------------------
let proteinData = [];
let dataReady = false;

// -------------------- Helpers --------------------
const toLower = v => (v ?? '').toString().trim().toLowerCase();

function normalizeRecord(p) {
  return {
    id: p?.['Dark_protein ID'] ?? '',
    symbol: p?.['ncbi_gene_Symbol'] ?? '',
    description: p?.['Description'] ?? p?.['ncbi_gene_Description'] ?? '',
    taxonomicName: p?.['TaxonomicName'] ?? '',
    geneType: p?.['GeneType'] ?? '',
    raw: p
  };
}

function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return [data];
  return [];
}

// -------------------- Filtering --------------------
function filterResults(category, query) {
  return proteinData.filter(p => {
    const matchesQuery = query
      ? (
          toLower(p.id).includes(query) ||
          toLower(p.symbol).includes(query) ||
          toLower(p.description).includes(query) ||
          toLower(p.taxonomicName).includes(query) ||
          toLower(p.geneType).includes(query)
        )
      : true;

    const matchesCategory = category ? toLower(p.geneType).includes(category) : true;
    return matchesQuery && matchesCategory;
  });
}

// -------------------- Table rendering --------------------
function renderTable(results) {
  const tbody = document.querySelector('#resultsTable tbody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!Array.isArray(results) || results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No results found</td></tr>`;
    return;
  }

  results.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.id}</td>
      <td>${p.symbol}</td>
      <td>${p.description}</td>
      <td>${p.taxonomicName}</td>
      <td>${p.geneType}</td>
    `;
    tbody.appendChild(row);
  });
}

// -------------------- Search trigger --------------------
function performSearch() {
  const category = toLower(document.getElementById('categorySelect')?.value);
  const query = toLower(document.getElementById('searchInput')?.value);

  // Reload page with query params
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (query) params.set('query', query);

  window.location.search = params.toString();
}

// -------------------- Load & boot --------------------
document.addEventListener('DOMContentLoaded', () => {
  const categoryEl = document.getElementById('categorySelect');
  const searchBtn = document.querySelector('.search-bar button');

  if (categoryEl) categoryEl.addEventListener('change', performSearch);
  if (searchBtn) searchBtn.addEventListener('click', performSearch);

  const jsonURL = 'https://sarang15sbt.github.io/protein-database/proteins.json';

  fetch(jsonURL)
    .then(res => res.json())
    .then(data => {
      proteinData = ensureArray(data).map(normalizeRecord);
      dataReady = true;

      // Read params from URL
      const params = new URLSearchParams(window.location.search);
      const category = toLower(params.get('category'));
      const query = toLower(params.get('query'));

      // Pre-fill inputs
      if (categoryEl) categoryEl.value = category || '';
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = query || '';

      // Filter if params exist, else show all
      const results = (category || query)
        ? filterResults(category, query)
        : proteinData;

      renderTable(results);
    })
    .catch(err => {
      console.error('Error loading JSON:', err);
    });
});
