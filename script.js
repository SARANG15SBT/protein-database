// -------------------- State --------------------
let proteinData = [];
let currentIndex = 0;
let dataReady = false;

const carouselWrapper = document.getElementById('carouselWrapper');

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
  // If the JSON returns a single object, wrap it
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

    console.log('Loaded proteins (normalized):', proteinData.length);
    // Render initial carousel
    renderCarousel(proteinData.slice(0, 3));
    // Render full table initially (optional)
    renderTable(proteinData);
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

// -------------------- Filtering --------------------
// Filter ONLY by GeneType (dropdown)
function filterByGeneType() {
  if (!dataReady) {
    console.warn('Data not ready yet');
    return;
  }
  const category = toLower(document.getElementById('categorySelect')?.value);

  const results = proteinData.filter(p => {
    const gt = toLower(p.geneType);
    return category ? gt === category : true;
  });

  console.log('filterByGeneType -> category:', category, 'results:', results.length);
  renderTable(results);
}

// Combined text search + GeneType filter
function performSearch() {
  if (!dataReady) {
    console.warn('Data not ready yet');
    return;
  }
  const category = toLower(document.getElementById('categorySelect')?.value);
  const query = toLower(document.getElementById('searchInput')?.value);

  const results = proteinData.filter(p => {
    const matchesQuery = query
      ? (
          toLower(p.id).includes(query) ||
          toLower(p.symbol).includes(query) ||
          toLower(p.description).includes(query) ||
          toLower(p.taxonomicName).includes(query) ||
          toLower(p.geneType).includes(query)
        )
      : true;

    const matchesCategory = category ? toLower(p.geneType) === category : true;

    return matchesQuery && matchesCategory;
  });

  console.log('performSearch -> category:', category, 'query:', query, 'results:', results.length);
  renderTable(results);
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

// -------------------- Wire up events safely --------------------
document.addEventListener('DOMContentLoaded', () => {
  const categoryEl = document.getElementById('categorySelect');
  const searchBtn = document.querySelector('.search-bar button');

  // Auto-filter when dropdown changes
  if (categoryEl) {
    categoryEl.addEventListener('change', filterByGeneType);
  }

  // Ensure the button also triggers performSearch
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
});
function reloadWithFilter() {
  const category = document.getElementById('categorySelect').value;
  const query = document.getElementById('searchInput').value;

  // Build query string
  const params = new URLSearchParams();
  if (category) params.set('geneType', category);
  if (query) params.set('q', query);

  // Reload page with query string
  window.location.search = params.toString();
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const geneType = params.get('geneType');
  const query = params.get('q');

  if (geneType) {
    document.getElementById('categorySelect').value = geneType;
  }
  if (query) {
    document.getElementById('searchInput').value = query;
  }

  // Wait until proteinData is loaded, then filter
  const checkData = setInterval(() => {
    if (proteinData.length > 0) {
      clearInterval(checkData);
      performSearch(); // reuse your existing search+filter
    }
  }, 200);
});



