/*
 Purchased Tiles Client Script
 -----------------------------
 Mini README:
 This script renders the list of tiles purchased during the current game and
 allows players to return a tile to the available pool if selected by mistake.
 Each piece is shown using its chosen color and calculated net value.

 Structure:
 - Load purchased tiles from localStorage
 - Compute and display each tile's net value
 - Render table with shapes and a return button
 - Navigation back to the main game interface
*/

const AGE_COUNT = 9; // total number of paydays/ages
let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');
// assign defaults to legacy pieces
purchasedPieces.forEach(p => {
  if (!p.color) p.color = '#4caf50';
  // normalize legacy data to the new 1–9 age scale
  if (p.purchaseAge === undefined || p.purchaseAge < 1) p.purchaseAge = 1;
});

const purchasedTableBody = document.querySelector('#purchasedTable tbody');
const backBtn = document.getElementById('backBtn');

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

function computeValue(piece) {
  const area = piece.shape.length;
  const buttonPoints = piece.buttons * (AGE_COUNT - piece.purchaseAge);
  const totalValue = area * 2 + buttonPoints;
  return totalValue - piece.cost;
}

function refreshTable() {
  purchasedTableBody.innerHTML = '';
  purchasedPieces.forEach(piece => {
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

    const valueTd = document.createElement('td');
    valueTd.textContent = computeValue(piece);
    tr.appendChild(valueTd);

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

refreshTable();

