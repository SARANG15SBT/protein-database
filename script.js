// -------------------- State --------------------
let proteinData = [];
let currentIndex = 0;
let dataReady = false;

// Safe DOM lookups
const carouselWrapper = document.getElementById('carouselWrapper');

// -------------------- Helpers --------------------
const lower = v => (v ?? '').toString().trim().toLowerCase();

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

// -------------------- Load data --------------------
const jsonURL = 'https://sarang15sbt.github.io/protein-database/proteins.json';

fetch(jsonURL)
  .then(res => res.json())
  .then(data => {
    const arr = ensureArray(data);
    proteinData = arr.map(normalizeRecord);
    dataReady = true;

    // Initial UI
    renderCarousel(proteinData.slice(0, 3));
    renderTable(proteinData);

    // Apply filter from URL if present
    applyFiltersFromURL();
  })
  .catch(err => {
    console.error('Error loading JSON:', err);
  });

// -------------------- Carousel --------------------
function renderCarousel(items) {
  if (!carouselWrapper) return;
  carouselWrapper.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'protein-card';
    card.innerHTML = `
      <h4>${item.id}</h4>
      <p><strong>Symbol:</strong> ${item.symbol}</p>
      <p><strong>Description:</strong> ${item.description}</p>
      <p><strong>Organism:</strong> ${item.taxonomicName}</p>
      <p><strong>Gene Type:</strong> ${item.geneType}</p>
    `;
    carouselWrapper.appendChild(card);
  });
}

function nextSlide() {
  if (!dataReady || proteinData.length === 0) return;
  currentIndex = (currentIndex + 1) % proteinData.length;
  const slice = proteinData.slice(currentIndex, currentIndex + 3);
  renderCarousel(slice.length ? slice : proteinData.slice(0, 3));
}

function prevSlide() {
  if (!dataReady || proteinData.length === 0) return;
  currentIndex = (currentIndex - 1 + proteinData.length) % proteinData.length;
  const slice = proteinData.slice(currentIndex, currentIndex + 3);
  renderCarousel(slice.length ? slice : proteinData.slice(0, 3));
}

// -------------------- Filtering (case-insensitive) --------------------
function filterByGeneType() {
  if (!dataReady) return;
  const category = lower(document.getElementById('categorySelect')?.value);

  const results = proteinData.filter(p => {
    const gt = lower(p.geneType);
    return category ? gt === category : true;
  });

  renderTable(results);
}

function performSearch() {
  if (!dataReady) return;
  const category = lower(document.getElementById('categorySelect')?.value);
  const query = lower(document.getElementById('searchInput')?.value);

  const results = proteinData.filter(p => {
    const matchesQuery = query
      ? (
          lower(p.id).includes(query) ||
          lower(p.symbol).includes(query) ||
          lower(p.description).includes(query) ||
          lower(p.taxonomicName).includes(query) ||
          lower(p.geneType).includes(query)
        )
      : true;

    const matchesCategory = category ? lower(p.geneType) === category : true;

    return matchesQuery && matchesCategory;
  });

  renderTable(results);
}

// -------------------- Page reload with query string --------------------
function reloadWithFilter() {
  const category = document.getElementById('categorySelect')?.value || '';
  const query = document.getElementById('searchInput')?.value || '';

  const params = new URLSearchParams();
  if (category) params.set('geneType', category);
  if (query) params.set('q', query);

  // Reload the page in the same tab with query string
  window.location.search = params.toString();
}

// Apply filters from URL after data is ready
function applyFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const geneType = params.get('geneType') || '';
  const q = params.get('q') || '';

  // Set UI controls to reflect URL
  const catEl = document.getElementById('categorySelect');
  const qEl = document.getElementById('searchInput');
  if (catEl && geneType) catEl.value = geneType;
  if (qEl && q) qEl.value = q;

  // If any filter present, perform search
  if (geneType || q) {
    performSearch();
  }
}

// -------------------- Table rendering --------------------
function renderTable(results) {
  const tbody = document.querySelector('#resultsTable tbody');
  if (!tbody) {
    console.error('Table body #resultsTable tbody not found in DOM');
    return;
  }

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

// -------------------- Wire up events --------------------
document.addEventListener('DOMContentLoaded', () => {
  const categoryEl = document.getElementById('categorySelect');
  const searchBtn = document.querySelector('.search-bar button');

  // Change: dropdown triggers gene-type-only filter without reloading
  if (categoryEl) {
    categoryEl.addEventListener('change', filterByGeneType);
  }

  // Button: reload page with query params
  if (searchBtn) {
    searchBtn.removeAttribute('onclick'); // avoid duplicate handlers
    searchBtn.addEventListener('click', reloadWithFilter);
  }
});
