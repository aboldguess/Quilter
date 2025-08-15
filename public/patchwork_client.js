/*
 Patchwork Client Script
 -----------------------
 Mini README:
 This browser script powers the main Patchwork helper interface. It manages
 a persistent library of tiles, handles purchases during a game, and allows
 pieces to be created, colored, edited, or deleted.

 Structure:
 - State management for library, available, and purchased tiles
 - Grid rendering utilities and stats calculations
 - Event listeners for CRUD actions and game flow
*/

const TOTAL_TIME = 53; // total time spaces in Patchwork
let currentAge = 0;
let nextId = parseInt(localStorage.getItem('nextId'), 10) || 1;
let pieceLibrary = JSON.parse(localStorage.getItem('pieceLibrary') || '[]');
let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');
// ensure legacy pieces get a default color
pieceLibrary.forEach(p => { if (!p.color) p.color = '#4caf50'; });
purchasedPieces.forEach(p => { if (!p.color) p.color = '#4caf50'; });
let availablePieces = pieceLibrary.filter(p => !purchasedPieces.some(pp => pp.id === p.id));
let editingPieceId = null;

const ageInput = document.getElementById('age');
const ageDisplay = document.getElementById('ageDisplay');
const piecesTableBody = document.querySelector('#piecesTable tbody');
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

function computeStats(piece) {
  const area = piece.shape.length;
  const pointsPerCost = piece.cost ? piece.buttons / piece.cost : piece.buttons;
  const pointsPerCostPerArea = piece.cost && area ? piece.buttons / (piece.cost * area) : 0;
  const netPoints = piece.buttons - piece.cost;
  const remaining = TOTAL_TIME - currentAge - piece.time;
  const valid = remaining >= 0;
  return { area, pointsPerCost, pointsPerCostPerArea, netPoints, valid };
}

function refreshTable() {
  piecesTableBody.innerHTML = '';
  availablePieces.forEach(piece => {
    const stats = computeStats(piece);
    const tr = document.createElement('tr');

    const shapeTd = document.createElement('td');
    shapeTd.appendChild(renderShape(piece.shape, piece.color));
    tr.appendChild(shapeTd);

    const buttonsTd = document.createElement('td');
    buttonsTd.textContent = piece.buttons;
    tr.appendChild(buttonsTd);

    const costTd = document.createElement('td');
    costTd.textContent = piece.cost;
    tr.appendChild(costTd);

    const timeTd = document.createElement('td');
    timeTd.textContent = piece.time;
    tr.appendChild(timeTd);

    const pcTd = document.createElement('td');
    pcTd.textContent = stats.pointsPerCost.toFixed(2);
    tr.appendChild(pcTd);

    const pcaTd = document.createElement('td');
    pcaTd.textContent = stats.pointsPerCostPerArea.toFixed(2);
    tr.appendChild(pcaTd);

    const netTd = document.createElement('td');
    netTd.textContent = stats.netPoints;
    tr.appendChild(netTd);

    const actionTd = document.createElement('td');
    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Purchase';
    buyBtn.disabled = !stats.valid;
    buyBtn.addEventListener('click', () => {
      const index = availablePieces.findIndex(p => p.id === piece.id);
      if (index >= 0) {
        console.debug('Purchasing piece', piece.id);
        purchasedPieces.push(availablePieces[index]);
        availablePieces.splice(index, 1);
        savePurchased();
        refreshTable();
      }
    });
    actionTd.appendChild(buyBtn);

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

