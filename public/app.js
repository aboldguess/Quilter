/*
 Patchwork Tile Helper Front-End Script
 --------------------------------------
 Mini README:
 This script handles the interactive behaviour of the Patchwork helper web app.
 Users can select the current age, create new pieces by drawing on a grid, and
 view statistics to aid their purchase decisions.

 Structure:
 - State management for age and pieces
 - UI rendering functions
 - Event listeners for user actions
*/

const TOTAL_TIME = 53; // total time spaces in Patchwork
let currentAge = 0;
let nextId = 1;
const pieces = [];

const ageInput = document.getElementById('age');
const ageDisplay = document.getElementById('ageDisplay');
const piecesTableBody = document.querySelector('#piecesTable tbody');
const addPieceBtn = document.getElementById('addPieceBtn');
const pieceForm = document.getElementById('pieceForm');
const grid = document.getElementById('grid');
const buttonsInput = document.getElementById('buttonsInput');
const costInput = document.getElementById('costInput');
const timeInput = document.getElementById('timeInput');
const savePieceBtn = document.getElementById('savePiece');
const cancelPieceBtn = document.getElementById('cancelPiece');

function createGrid() {
  grid.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.addEventListener('click', () => cell.classList.toggle('active'));
    grid.appendChild(cell);
  }
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

function renderShape(shape) {
  const container = document.createElement('div');
  container.classList.add('grid');
  container.style.gridTemplateColumns = 'repeat(5, 12px)';
  container.style.gridTemplateRows = 'repeat(5, 12px)';
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
  pieces.forEach(piece => {
    const stats = computeStats(piece);
    const tr = document.createElement('tr');

    const shapeTd = document.createElement('td');
    shapeTd.appendChild(renderShape(piece.shape));
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
      const index = pieces.findIndex(p => p.id === piece.id);
      if (index >= 0) {
        console.debug('Purchasing piece', piece.id);
        pieces.splice(index, 1);
        refreshTable();
      }
    });
    actionTd.appendChild(buyBtn);
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
  pieceForm.classList.remove('hidden');
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
  const piece = {
    id: nextId++,
    shape,
    buttons: parseInt(buttonsInput.value, 10) || 0,
    cost: parseInt(costInput.value, 10) || 0,
    time: parseInt(timeInput.value, 10) || 0
  };
  console.debug('Adding piece', piece);
  pieces.push(piece);
  pieceForm.classList.add('hidden');
  refreshTable();
});

cancelPieceBtn.addEventListener('click', () => {
  pieceForm.classList.add('hidden');
});

// initialize
createGrid();
refreshTable();
