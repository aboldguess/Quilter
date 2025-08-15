/*
 Patchwork Client Script
 -----------------------
 Mini README:
 This browser script powers the main Patchwork helper interface. It manages
 a persistent library of tiles, handles purchases during a game, and allows
 pieces to be created, colored, edited, or deleted. When a tile is bought its
 score metrics at that moment are stored so the purchased list can show
 historical scores. Purchases are tracked per player (yellow and green) so
 individual scores can be calculated. Table evaluations display the same scoring
 formulas used at purchase time—gross score is twice the area plus remaining
 payday button income, net score subtracts the cost, and efficiency metrics
 divide by time penalty and area as applicable.

 Structure:
 - State management for library, available, and purchased tiles
 - Grid rendering utilities and stats calculations
 - Event listeners for CRUD actions and game flow
  - Column sorting for the pieces table
  - Per-player purchase buttons (yellow and green)
*/

const AGE_COUNT = 9; // number of paydays/ages in the game

// currentAge is 1-based representing the payday marker on the board
let currentAge = 1;
let nextId = parseInt(localStorage.getItem('nextId'), 10) || 1;
let pieceLibrary = JSON.parse(localStorage.getItem('pieceLibrary') || '[]');
let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');
// ensure legacy pieces get defaults
pieceLibrary.forEach(p => { if (!p.color) p.color = '#4caf50'; });
purchasedPieces.forEach(p => {
  if (!p.color) p.color = '#4caf50';
  // normalize legacy data to the new 1–9 age scale
  if (p.purchaseAge === undefined || p.purchaseAge < 1) p.purchaseAge = 1;
  // legacy records may not track which player purchased the tile
  if (!p.player) p.player = 'unknown';
  // legacy records may not have stored purchase-time metrics; compute them
  const stats = computeScoreStats(p, p.purchaseAge);
  if (p.purchaseGross === undefined) p.purchaseGross = stats.grossScore;
  if (p.purchaseNet === undefined) p.purchaseNet = stats.netScore;
  if (p.purchaseNetPerTime === undefined) p.purchaseNetPerTime = stats.netScorePerTime;
  if (p.purchaseNetPerTimePerArea === undefined) {
    p.purchaseNetPerTimePerArea = stats.netScorePerTimePerArea;
  }
});
let availablePieces = pieceLibrary.filter(p => !purchasedPieces.some(pp => pp.id === p.id));
let editingPieceId = null;

const ageInput = document.getElementById('age');
const ageDisplay = document.getElementById('ageDisplay');
const piecesTableBody = document.querySelector('#piecesTable tbody');
const headerCells = document.querySelectorAll('#piecesTable thead th');
const addPieceBtn = document.getElementById('addPieceBtn');
const newGameBtn = document.getElementById('newGameBtn');
const viewPurchasedBtn = document.getElementById('viewPurchasedBtn');
const pieceForm = document.getElementById('pieceForm');
const grid = document.getElementById('grid');
const buttonsInput = document.getElementById('buttonsInput');
const costInput = document.getElementById('costInput');
const timeInput = document.getElementById('timeInput');
const colorInput = document.getElementById('colorInput');
const savePieceBtn = document.getElementById('savePiece');
const cancelPieceBtn = document.getElementById('cancelPiece');

// initialize age slider display
ageInput.value = currentAge;
ageDisplay.textContent = currentAge;

// Track which column is sorted and direction
let sortState = { key: null, asc: true };

// Map header indices to piece/stat keys used for sorting
const sortableColumns = {
  1: 'grossScore',
  2: 'netScore',
  3: 'netScorePerTime',
  4: 'netScorePerTimePerArea'
};

// Update header classes to show sort direction arrows
function updateSortIndicators() {
  headerCells.forEach((th, index) => {
    th.classList.remove('asc', 'desc');
    if (sortableColumns[index]) {
      if (sortState.key === sortableColumns[index]) {
        th.classList.add(sortState.asc ? 'asc' : 'desc');
      }
    }
  });
}

// Clicking a header toggles sort on that column
headerCells.forEach((th, index) => {
  if (!sortableColumns[index]) return; // skip non-sortable headers
  th.addEventListener('click', () => {
    const key = sortableColumns[index];
    if (sortState.key === key) {
      sortState.asc = !sortState.asc;
    } else {
      sortState = { key, asc: true };
    }
    console.debug('Sorting by', key, sortState.asc ? 'asc' : 'desc');
    refreshTable();
  });
});

function saveLibrary() {
  localStorage.setItem('pieceLibrary', JSON.stringify(pieceLibrary));
  localStorage.setItem('nextId', String(nextId));
}

function savePurchased() {
  localStorage.setItem('purchasedPieces', JSON.stringify(purchasedPieces));
}

function createGrid() {
  grid.innerHTML = '';
  // apply current color selection to grid cells
  grid.style.setProperty('--active-color', colorInput.value);
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.addEventListener('click', () => cell.classList.toggle('active'));
    grid.appendChild(cell);
  }
}

// preview color while drawing
colorInput.addEventListener('input', () => {
  grid.style.setProperty('--active-color', colorInput.value);
});

function loadShapeIntoGrid(shape) {
  createGrid();
  shape.forEach(p => {
    const index = p.y * 5 + p.x;
    const cell = grid.children[index];
    if (cell) {
      cell.classList.add('active');
    }
  });
}

function getGridShape() {
  const shape = [];
  [...grid.children].forEach((cell, index) => {
    if (cell.classList.contains('active')) {
      const x = index % 5;
      const y = Math.floor(index / 5);
      shape.push({ x, y });
    }
  });
  return shape;
}

function renderShape(shape, color = '#4caf50') {
  const container = document.createElement('div');
  container.classList.add('grid');
  container.style.gridTemplateColumns = 'repeat(5, 12px)';
  container.style.gridTemplateRows = 'repeat(5, 12px)';
  container.style.setProperty('--active-color', color);
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    const x = i % 5;
    const y = Math.floor(i / 5);
    if (shape.some(p => p.x === x && p.y === y)) {
      cell.classList.add('active');
    }
    cell.style.width = '12px';
    cell.style.height = '12px';
    container.appendChild(cell);
  }
  return container;
}

// Calculate current score metrics for a piece at a given age
function computeScoreStats(piece, age = currentAge) {
  const area = piece.shape.length;
  // age slider names the *next* payday to be passed, so when age is 1
  // there are still all 9 paydays remaining. Use AGE_COUNT - age + 1 as the
  // base to reflect the correct number of remaining paydays.
  const remainingPaydays = AGE_COUNT - age + 1;
  const grossScore = area * 2 + piece.buttons * remainingPaydays;
  const netScore = grossScore - piece.cost;
  const netScorePerTime = piece.time ? netScore / piece.time : netScore;
  const netScorePerTimePerArea = piece.time && area ? netScore / (piece.time * area) : 0;
  return { area, grossScore, netScore, netScorePerTime, netScorePerTimePerArea };
}

// Record the purchase of a piece for the specified player
function purchasePiece(piece, player) {
  const index = availablePieces.findIndex(p => p.id === piece.id);
  if (index >= 0) {
    console.debug(`Purchasing piece ${piece.id} for ${player}`);
    const purchaseAge = currentAge;
    const statsAtPurchase = computeScoreStats(availablePieces[index], purchaseAge);
    const purchasedCopy = {
      ...availablePieces[index],
      player,
      purchaseAge,
      purchaseGross: statsAtPurchase.grossScore,
      purchaseNet: statsAtPurchase.netScore,
      purchaseNetPerTime: statsAtPurchase.netScorePerTime,
      purchaseNetPerTimePerArea: statsAtPurchase.netScorePerTimePerArea
    };
    purchasedPieces.push(purchasedCopy);
    availablePieces.splice(index, 1);
    savePurchased();
    refreshTable();
  }
}

function refreshTable() {
  piecesTableBody.innerHTML = '';
  // Create a sorted copy of pieces based on current sort state
  const piecesToRender = availablePieces.slice().sort((a, b) => {
    if (!sortState.key) return 0;
    const statsA = computeScoreStats(a, currentAge);
    const statsB = computeScoreStats(b, currentAge);
    const valA = statsA[sortState.key];
    const valB = statsB[sortState.key];
    return sortState.asc ? valA - valB : valB - valA;
  });
  updateSortIndicators();
  piecesToRender.forEach(piece => {
    const stats = computeScoreStats(piece, currentAge);
    const tr = document.createElement('tr');

    const shapeTd = document.createElement('td');
    shapeTd.appendChild(renderShape(piece.shape, piece.color));
    tr.appendChild(shapeTd);

    const grossTd = document.createElement('td');
    grossTd.textContent = stats.grossScore;
    tr.appendChild(grossTd);

    const netTd = document.createElement('td');
    netTd.textContent = stats.netScore;
    tr.appendChild(netTd);

    const nptTd = document.createElement('td');
    nptTd.textContent = stats.netScorePerTime.toFixed(2);
    tr.appendChild(nptTd);

    const nptaTd = document.createElement('td');
    nptaTd.textContent = stats.netScorePerTimePerArea.toFixed(2);
    tr.appendChild(nptaTd);

    const actionTd = document.createElement('td');
    const yellowBtn = document.createElement('button');
    yellowBtn.textContent = 'Buy Yellow';
    yellowBtn.classList.add('buy-yellow');
    yellowBtn.addEventListener('click', () => purchasePiece(piece, 'yellow'));
    actionTd.appendChild(yellowBtn);

    const greenBtn = document.createElement('button');
    greenBtn.textContent = 'Buy Green';
    greenBtn.classList.add('buy-green');
    greenBtn.addEventListener('click', () => purchasePiece(piece, 'green'));
    actionTd.appendChild(greenBtn);

    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      editingPieceId = piece.id;
      buttonsInput.value = piece.buttons;
      costInput.value = piece.cost;
      timeInput.value = piece.time;
      colorInput.value = piece.color || '#4caf50';
      loadShapeIntoGrid(piece.shape);
      pieceForm.classList.remove('hidden');
    });
    actionTd.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      console.debug('Deleting piece', piece.id);
      pieceLibrary = pieceLibrary.filter(p => p.id !== piece.id);
      availablePieces = availablePieces.filter(p => p.id !== piece.id);
      purchasedPieces = purchasedPieces.filter(p => p.id !== piece.id);
      saveLibrary();
      savePurchased();
      refreshTable();
    });
    actionTd.appendChild(deleteBtn);

    tr.appendChild(actionTd);

    piecesTableBody.appendChild(tr);
  });
}

ageInput.addEventListener('input', () => {
  currentAge = parseInt(ageInput.value, 10);
  ageDisplay.textContent = currentAge;
  refreshTable();
});

addPieceBtn.addEventListener('click', () => {
  editingPieceId = null;
  pieceForm.classList.remove('hidden');
  colorInput.value = '#4caf50';
  createGrid();
  buttonsInput.value = 0;
  costInput.value = 0;
  timeInput.value = 0;
});

savePieceBtn.addEventListener('click', () => {
  const shape = getGridShape();
  if (shape.length === 0) {
    alert('Please draw at least one square.');
    return;
  }
  if (editingPieceId) {
    const piece = pieceLibrary.find(p => p.id === editingPieceId);
    if (piece) {
      piece.shape = shape;
      piece.buttons = parseInt(buttonsInput.value, 10) || 0;
      piece.cost = parseInt(costInput.value, 10) || 0;
      piece.time = parseInt(timeInput.value, 10) || 0;
      piece.color = colorInput.value;
    }
    const avail = availablePieces.find(p => p.id === editingPieceId);
    if (avail) Object.assign(avail, piece);
    const purch = purchasedPieces.find(p => p.id === editingPieceId);
    if (purch) Object.assign(purch, piece);
    console.debug('Updated piece', editingPieceId);
  } else {
    const piece = {
      id: nextId++,
      shape,
      buttons: parseInt(buttonsInput.value, 10) || 0,
      cost: parseInt(costInput.value, 10) || 0,
      time: parseInt(timeInput.value, 10) || 0,
      color: colorInput.value
    };
    console.debug('Adding piece', piece);
    pieceLibrary.push(piece);
    availablePieces.push(piece);
  }
  saveLibrary();
  pieceForm.classList.add('hidden');
  refreshTable();
});

cancelPieceBtn.addEventListener('click', () => {
  pieceForm.classList.add('hidden');
  editingPieceId = null;
});

newGameBtn.addEventListener('click', () => {
  purchasedPieces = [];
  savePurchased();
  availablePieces = pieceLibrary.slice();
  refreshTable();
});

viewPurchasedBtn.addEventListener('click', () => {
  window.location.href = 'purchased.html';
});

// initialize
createGrid();
refreshTable();
// persist any defaulted data to storage
saveLibrary();
savePurchased();

