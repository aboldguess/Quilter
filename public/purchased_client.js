/*
 Purchased Tiles Client Script
 -----------------------------
 Mini README:
 This script renders tiles purchased during the current game and allows
 players to return a tile to the available pool if selected by mistake. It
 displays each tile's point value at the moment of purchase along with value
 per time penalty metrics so scores remain historically accurate.

 Structure:
 - Load purchased tiles from localStorage
 - Display stored purchase-time value metrics
 - Render table with shapes, metrics and a return button
 - Dropdown to choose which metric column is visible on small screens
 - Navigation back to the main game interface
*/

const AGE_COUNT = 9; // total number of paydays/ages
let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');
// assign defaults to legacy pieces and compute missing purchase metrics
purchasedPieces.forEach(p => {
  if (!p.color) p.color = '#4caf50';
  if (p.purchaseAge === undefined || p.purchaseAge < 1) p.purchaseAge = 1;
  const stats = computeMetrics(p);
  if (p.purchaseValue === undefined) p.purchaseValue = stats.value;
  if (p.purchaseValuePerTime === undefined) p.purchaseValuePerTime = stats.valuePerTime;
  if (p.purchaseValuePerTimePerArea === undefined) {
    p.purchaseValuePerTimePerArea = stats.valuePerTimePerArea;
  }
});
// persist any computed defaults
savePurchased();

const purchasedTable = document.getElementById('purchasedTable');
const purchasedTableBody = purchasedTable.querySelector('tbody');
const backBtn = document.getElementById('backBtn');
const columnSelect = document.getElementById('columnSelect');

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
  const buttonPoints = piece.buttons * (AGE_COUNT - piece.purchaseAge);
  const value = piece.cost - area * 2 + buttonPoints;
  const valuePerTime = piece.time ? value / piece.time : value;
  const valuePerTimePerArea = piece.time && area ? value / (piece.time * area) : 0;
  return { value, valuePerTime, valuePerTimePerArea };
}

function refreshTable() {
  purchasedTableBody.innerHTML = '';
  purchasedPieces.forEach(piece => {
    const tr = document.createElement('tr');

    const shapeTd = document.createElement('td');
    shapeTd.appendChild(renderShape(piece.shape, piece.color));
    tr.appendChild(shapeTd);

    const valueTd = document.createElement('td');
    valueTd.classList.add('value');
    valueTd.textContent = piece.purchaseValue;
    tr.appendChild(valueTd);

    const vptTd = document.createElement('td');
    vptTd.classList.add('valuePerTime');
    vptTd.textContent = piece.purchaseValuePerTime.toFixed(2);
    tr.appendChild(vptTd);

    const vptaTd = document.createElement('td');
    vptaTd.classList.add('valuePerTimePerArea');
    vptaTd.textContent = piece.purchaseValuePerTimePerArea.toFixed(2);
    tr.appendChild(vptaTd);

    const actionTd = document.createElement('td');
    const returnBtn = document.createElement('button');
    returnBtn.textContent = 'Return';
    returnBtn.addEventListener('click', () => {
      purchasedPieces = purchasedPieces.filter(p => p.id !== piece.id);
      savePurchased();
      refreshTable();
    });
    actionTd.appendChild(returnBtn);
    tr.appendChild(actionTd);

    purchasedTableBody.appendChild(tr);
  });
}

backBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

columnSelect.addEventListener('change', () => {
  purchasedTable.classList.remove('show-value', 'show-valuePerTime', 'show-valuePerTimePerArea');
  purchasedTable.classList.add('show-' + columnSelect.value);
});

// initialize dropdown selection
columnSelect.dispatchEvent(new Event('change'));

refreshTable();

