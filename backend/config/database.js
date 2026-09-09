const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbFilePath = path.resolve(__dirname, '..', 'database', 'velora.sqlite');

let dbInstance = null;

async function getDB() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbFilePath)) {
    const filebuffer = fs.readFileSync(dbFilePath);
    dbInstance = new SQL.Database(filebuffer);
    console.log('Loaded existing SQLite database from:', dbFilePath);
  } else {
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    dbInstance = new SQL.Database();
    console.log('Created new SQLite database at:', dbFilePath);
  }

  return dbInstance;
}

function saveDB() {
  if (!dbInstance) return;
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dbFilePath, buffer);
}

const dbHelper = {
  get: async (sql, params = []) => {
    const db = await getDB();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    let result = null;
    if (stmt.step()) {
      result = stmt.getAsObject();
    }
    stmt.free();
    return result;
  },
  all: async (sql, params = []) => {
    const db = await getDB();
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  },
  run: async (sql, params = []) => {
    const db = await getDB();
    db.run(sql, params);
    saveDB();

    // Fetch last inserted ID reliably
    const res = db.exec("SELECT last_insert_rowid() as id;");
    const lastId = res.length > 0 && res[0].values.length > 0 ? res[0].values[0][0] : 0;

    return { id: lastId };
  },
  exec: async (sql) => {
    const db = await getDB();
    db.exec(sql);
    saveDB();
  },
  resetDB: () => {
    dbInstance = null;
  }
};

module.exports = dbHelper;
