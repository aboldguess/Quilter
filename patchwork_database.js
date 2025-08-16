/**
 * Patchwork Database Module
 * ------------------------
 * Mini README:
 * Provides a SQLite-backed persistence layer for the Patchwork helper
 * application. Game state for each match (pieces, purchases, buttons and
 * bonuses) is stored in `data/patchwork.db` so multiple clients share the same
 * information and past games can be retained.
 *
 * Structure:
 * - Creates the database and required tables on first load.
 * - `getState(gameId)` returns the current state for a given game.
 * - `saveState(gameId, state)` replaces the stored state for a game.
 *
 * The `pieces` table holds the full piece library shared by all games. The
 * `games` table tracks per-game metadata, and `purchased_pieces` stores
 * purchases linked to a game. Piece and purchase rows serialise their payloads
 * as JSON for flexibility.
 */

const path = require('path');
const Database = require('better-sqlite3');

// Open the database in the repo's data directory; it will be created if absent.
const dbPath = path.join(__dirname, 'data', 'patchwork.db');
const db = new Database(dbPath);

// Ensure tables exist. Using `exec` here is safe as the statements are static.
db.exec(`
  CREATE TABLE IF NOT EXISTS pieces (
    id INTEGER PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    nextId INTEGER DEFAULT 1,
    yellowButtons INTEGER DEFAULT 0,
    greenButtons INTEGER DEFAULT 0,
    bonusWinner TEXT DEFAULT 'none'
  );
  CREATE TABLE IF NOT EXISTS purchased_pieces (
    id INTEGER PRIMARY KEY,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    data TEXT NOT NULL
  );
`);

/**
 * Retrieve the complete game state for the requested game id. If the game does
 * not yet exist a default row is created.
 * @param {number} gameId - Identifier for the game, defaults to 1.
 * @returns {object} Current state including pieceLibrary and purchasedPieces.
 */
function getState(gameId = 1) {
  const id = Number.isInteger(gameId) ? gameId : 1;
  let game = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
  if (!game) {
    db.prepare(
      'INSERT INTO games (id, nextId, yellowButtons, greenButtons, bonusWinner) VALUES (?, 1, 0, 0, "none")'
    ).run(id);
    game = { id, nextId: 1, yellowButtons: 0, greenButtons: 0, bonusWinner: 'none' };
  }
  const pieceRows = db.prepare('SELECT data FROM pieces').all();
  const purchasedRows = db.prepare('SELECT data FROM purchased_pieces WHERE game_id = ?').all(id);
  return {
    nextId: game.nextId,
    yellowButtons: game.yellowButtons,
    greenButtons: game.greenButtons,
    bonusWinner: game.bonusWinner,
    pieceLibrary: pieceRows.map(r => JSON.parse(r.data)),
    purchasedPieces: purchasedRows.map(r => JSON.parse(r.data))
  };
}

/**
 * Persist the supplied state for the given game id, replacing any existing
 * records. Operations are wrapped in a transaction for consistency.
 * @param {number} gameId - Identifier for the game, defaults to 1.
 * @param {object} state - Object containing nextId, pieceLibrary, purchasedPieces,
 *                         yellowButtons, greenButtons and bonusWinner.
 */
function saveState(gameId = 1, state = {}) {
  const id = Number.isInteger(gameId) ? gameId : 1;
  const txn = db.transaction(() => {
    db.prepare(
      'INSERT INTO games (id, nextId, yellowButtons, greenButtons, bonusWinner) VALUES (?, ?, ?, ?, ?)\n       ON CONFLICT(id) DO UPDATE SET nextId=excluded.nextId, yellowButtons=excluded.yellowButtons, greenButtons=excluded.greenButtons, bonusWinner=excluded.bonusWinner'
    ).run(
      id,
      state.nextId || 1,
      state.yellowButtons || 0,
      state.greenButtons || 0,
      state.bonusWinner || 'none'
    );

    db.prepare('DELETE FROM pieces').run();
    const insertPiece = db.prepare('INSERT INTO pieces (id, data) VALUES (?, ?)');
    for (const piece of state.pieceLibrary || []) {
      insertPiece.run(piece.id, JSON.stringify(piece));
    }

    db.prepare('DELETE FROM purchased_pieces WHERE game_id = ?').run(id);
    const insertPurchase = db.prepare(
      'INSERT INTO purchased_pieces (id, game_id, data) VALUES (?, ?, ?)'
    );
    for (const piece of state.purchasedPieces || []) {
      insertPurchase.run(piece.id, id, JSON.stringify(piece));
    }
  });

  txn();
}

module.exports = { getState, saveState };
