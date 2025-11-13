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

    // Check URL params for search/filter
    const params = new URLSearchParams(window.location.search);
    const category = toLower(params.get('category'));
    const query = toLower(params.get('query'));

    if (category || query) {
      // Apply filter immediately on load
      const results = filterResults(category, query);
      renderTable(results);
      renderCarousel(results.slice(0, 3));
    } else {
      // Default initial render
      renderCarousel(proteinData.slice(0, 3));
      renderTable(proteinData);
    }
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

    const matchesCategory = category ? toLower(p.geneType) === category : true;
    return matchesQuery && matchesCategory;
  });
}

// Triggered when user clicks search
function performSearch() {
  const category = toLower(document.getElementById('categorySelect')?.value);
  const query = toLower(document.getElementById('searchInput')?.value);

  // Reload page with query params
  const params = new URLSearchParams({ category, query });
  window.location.search = params.toString();
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

  if (categoryEl) {
    categoryEl.addEventListener('change', performSearch);
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
});
