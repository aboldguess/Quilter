/*
 Purchased Tiles Client Script
 -----------------------------
 Mini README:
 This script renders tiles purchased during the current game and allows
 players to return a tile to the available pool if selected by mistake. It
 displays each tile's gross and net scores at the moment of purchase along with
 efficiency metrics so scores remain historically accurate. Purchases record
 which player (yellow or green) bought the tile and a running score is
 maintained by summing purchased net values and subtracting 162 to
 calculate each player's final score.

 Structure:
 - Load purchased tiles from localStorage
 - Display stored purchase-time score metrics
 - Render table with shapes, metrics and a return button
  - Show running scores for yellow and green players
 - Dropdown to choose which metric column is visible on small screens
 - Navigation back to the main game interface
*/

const AGE_COUNT = 9; // total number of paydays/ages
let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');
// assign defaults to legacy pieces and compute missing purchase metrics
purchasedPieces.forEach(p => {
  if (!p.color) p.color = '#4caf50';
  if (p.purchaseAge === undefined || p.purchaseAge < 1) p.purchaseAge = 1;
  if (!p.player) p.player = 'unknown';
  const stats = computeMetrics(p);
  if (p.purchaseGross === undefined) p.purchaseGross = stats.grossScore;
  if (p.purchaseNet === undefined) p.purchaseNet = stats.netScore;
  if (p.purchaseNetPerTime === undefined) p.purchaseNetPerTime = stats.netScorePerTime;
  if (p.purchaseNetPerTimePerArea === undefined) {
    p.purchaseNetPerTimePerArea = stats.netScorePerTimePerArea;
  }
});
// persist any computed defaults
savePurchased();

const purchasedTable = document.getElementById('purchasedTable');
const purchasedTableBody = purchasedTable.querySelector('tbody');
const backBtn = document.getElementById('backBtn');
const columnSelect = document.getElementById('columnSelect');
const yellowScoreEl = document.getElementById('yellowScore');
const greenScoreEl = document.getElementById('greenScore');

// Normalise click/tap interactions for mobile devices.
const tapEvent = window.PointerEvent ? 'pointerup' : 'click';

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

function savePurchased() {
  localStorage.setItem('purchasedPieces', JSON.stringify(purchasedPieces));
}

function computeMetrics(piece) {
  const area = piece.shape.length;
  // purchaseAge stores the next payday to be passed at time of buy.
  // To capture all remaining paydays, subtract from AGE_COUNT and add 1.
  const remainingPaydays = AGE_COUNT - piece.purchaseAge + 1;
  const grossScore = area * 2 + piece.buttons * remainingPaydays;
  const netScore = grossScore - piece.cost;
  const netScorePerTime = piece.time ? netScore / piece.time : netScore;
  const netScorePerTimePerArea = piece.time && area ? netScore / (piece.time * area) : 0;
  return { grossScore, netScore, netScorePerTime, netScorePerTimePerArea };
}

function refreshTable() {
  purchasedTableBody.innerHTML = '';
  purchasedPieces.forEach(piece => {
    const tr = document.createElement('tr');

    const shapeTd = document.createElement('td');
    shapeTd.appendChild(renderShape(piece.shape, piece.color));
    tr.appendChild(shapeTd);

    const playerTd = document.createElement('td');
    playerTd.textContent = piece.player || 'unknown';
    tr.appendChild(playerTd);

    const grossTd = document.createElement('td');
    grossTd.classList.add('gross');
    grossTd.textContent = piece.purchaseGross;
    tr.appendChild(grossTd);

    const netTd = document.createElement('td');
    netTd.classList.add('net');
    netTd.textContent = piece.purchaseNet;
    tr.appendChild(netTd);

    const nptTd = document.createElement('td');
    nptTd.classList.add('netPerTime');
    nptTd.textContent = piece.purchaseNetPerTime.toFixed(2);
    tr.appendChild(nptTd);

    const nptaTd = document.createElement('td');
    nptaTd.classList.add('netPerTimePerArea');
    nptaTd.textContent = piece.purchaseNetPerTimePerArea.toFixed(2);
    tr.appendChild(nptaTd);

    const actionTd = document.createElement('td');
    actionTd.classList.add('action');
    const returnBtn = document.createElement('button');
    returnBtn.type = 'button';
    returnBtn.textContent = 'Return';
    returnBtn.addEventListener(tapEvent, () => {
      purchasedPieces = purchasedPieces.filter(p => p.id !== piece.id);
      savePurchased();
      refreshTable();
    });
    actionTd.appendChild(returnBtn);
    tr.appendChild(actionTd);

    purchasedTableBody.appendChild(tr);
  });

  updateScores();
}

function updateScores() {
  const yellowTotal = purchasedPieces
    .filter(p => p.player === 'yellow')
    .reduce((sum, p) => sum + (p.purchaseNet || 0), 0);
  const greenTotal = purchasedPieces
    .filter(p => p.player === 'green')
    .reduce((sum, p) => sum + (p.purchaseNet || 0), 0);
  yellowScoreEl.textContent = yellowTotal - 162;
  greenScoreEl.textContent = greenTotal - 162;
}

backBtn.addEventListener(tapEvent, () => {
  window.location.href = 'index.html';
});

columnSelect.addEventListener('change', () => {
  purchasedTable.classList.remove('show-gross', 'show-net', 'show-netPerTime', 'show-netPerTimePerArea');
  purchasedTable.classList.add('show-' + columnSelect.value);
});

// initialize dropdown selection
columnSelect.dispatchEvent(new Event('change'));

refreshTable();

