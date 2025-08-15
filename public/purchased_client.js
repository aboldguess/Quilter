/*
 Purchased Tiles Client Script
 -----------------------------
 Mini README:
 This script renders the list of tiles purchased during the current game and
 allows players to return a tile to the available pool if selected by mistake.
 Columns in the table can be clicked to sort the purchases.

 Structure:
 - Load purchased tiles from localStorage
 - Render table with shapes, sortable headers, and a return button
 - Navigation back to the main game interface
*/

let purchasedPieces = JSON.parse(localStorage.getItem('purchasedPieces') || '[]');

const purchasedTableBody = document.querySelector('#purchasedTable tbody');
const purchasedTableHeaders = document.querySelectorAll('#purchasedTable th');
const backBtn = document.getElementById('backBtn');

const sortState = { key: null, asc: true };

purchasedTableHeaders.forEach(th => {
  const key = th.dataset.sort;
  if (!key) return;
  th.addEventListener('click', () => {
    if (sortState.key === key) {
      sortState.asc = !sortState.asc;
    } else {
      sortState.key = key;
      sortState.asc = true;
    }
    console.debug('Sorting purchases by', key, sortState.asc ? 'asc' : 'desc');
    refreshTable();
  });
});

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

function savePurchased() {
  localStorage.setItem('purchasedPieces', JSON.stringify(purchasedPieces));
}

function getSortValue(piece, key) {
  switch (key) {
    case 'buttons':
      return piece.buttons;
    case 'cost':
      return piece.cost;
    case 'time':
      return piece.time;
    default:
      return 0;
  }
}

function sortPurchasedPieces() {
  if (!sortState.key) return;
  purchasedPieces.sort((a, b) => {
    const aVal = getSortValue(a, sortState.key);
    const bVal = getSortValue(b, sortState.key);
    return sortState.asc ? aVal - bVal : bVal - aVal;
  });
}

function refreshTable() {
  sortPurchasedPieces();
  purchasedTableBody.innerHTML = '';
  purchasedTableHeaders.forEach(th => {
    th.classList.remove('asc', 'desc');
    if (th.dataset.sort === sortState.key) {
      th.classList.add(sortState.asc ? 'asc' : 'desc');
    }
  });
  purchasedPieces.forEach(piece => {
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

