// Global storage for protein data
let proteinData = [];
let currentIndex = 0;

// Safe DOM lookups (in case elements are not yet available)
const carouselWrapper = document.getElementById('carouselWrapper');

// ---------- Helpers ----------
function safeLower(val) {
  return (val ?? '').toString().trim().toLowerCase();
}

function getField(protein, key) {
  // Handles keys with spaces and different naming
  // Returns empty string if missing
  return protein?.[key] ?? '';
}

function normalizeRecord(p) {
  // Optionally pre-normalize frequently used fields for speed
  return {
    id: getField(p, 'Dark_protein ID'),
    symbol: getField(p, 'ncbi_gene_Symbol'),
    description: getField(p, 'Description') || getField(p, 'ncbi_gene_Description'),
    taxonomicName: getField(p, 'TaxonomicName'),
    geneType: getField(p, 'GeneType'),
    raw: p
  };
}

// ---------- Load data ----------
const jsonURL = 'https://sarang15sbt.github.io/protein-database/proteins.json';

fetch(jsonURL)
  .then(res => res.json())
  .then(data => {
    // Keep original but also a normalized view
    proteinData = Array.isArray(data) ? data.map(normalizeRecord) : [];
    console.log('Loaded proteins:', proteinData);

    // Initial carousel
    renderCarousel(proteinData.slice(0, 3));
  })
  .catch(err => console.error('Error loading JSON:', err));

// ---------- Carousel ----------
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
  if (proteinData.length === 0) return;
  currentIndex = (currentIndex + 1) % proteinData.length;
  const slice = proteinData.slice(currentIndex, currentIndex + 3);
  renderCarousel(slice.length ? slice : proteinData.slice(0, 3));
}

function prevSlide() {
  if (proteinData.length === 0) return;
  currentIndex = (currentIndex - 1 + proteinData.length) % proteinData.length;
  const slice = proteinData.slice(currentIndex, currentIndex + 3);
  renderCarousel(slice.length ? slice : proteinData.slice(0, 3));
}

// ---------- Filtering ----------
function filterByGeneType() {
  const categoryEl = document.getElementById('categorySelect');
  const category = safeLower(categoryEl?.value);

  // Case-insensitive exact match on GeneType
  const results = proteinData.filter(p => {
    const gt = safeLower(p.geneType);
    return category ? gt === category : true;
  });

  renderTable(results);
}

function performSearch() {
  const categoryEl = document.getElementById('categorySelect');
  const queryEl = document.getElementById('searchInput');

  const category = safeLower(categoryEl?.value);
  const query = safeLower(queryEl?.value);

  const results = proteinData.filter(p => {
    // Case-insensitive text query across key fields
    const matchesQuery = query
      ? (
          safeLower(p.id).includes(query) ||
          safeLower(p.symbol).includes(query) ||
          safeLower(p.description).includes(query) ||
          safeLower(p.taxonomicName).includes(query) ||
          safeLower(p.geneType).includes(query)
        )
      : true;

    // Case-insensitive exact match on GeneType if category selected
    const matchesCategory = category ? safeLower(p.geneType) === category : true;

    return matchesQuery && matchesCategory;
  });

  renderTable(results);
}

// ---------- Results table ----------
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

// ---------- Optional: auto-filter on dropdown change ----------
document.addEventListener('DOMContentLoaded', () => {
  const categoryEl = document.getElementById('categorySelect');
  if (categoryEl) {
    categoryEl.addEventListener('change', filterByGeneType);
  }
});
