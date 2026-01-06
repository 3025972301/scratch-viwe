const initSqlJs = require('sql.js')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data.db')

let db = null

// 初始化数据库
async function initDatabase() {
  const SQL = await initSqlJs()

  // 尝试加载已有数据库
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
    console.log('数据库已加载')
  } else {
    db = new SQL.Database()
    console.log('创建新数据库')
  }

  // 初始化数据库表
  db.run(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT,
      bio TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      instructions TEXT,
      scratch_url TEXT,
      sb3_file TEXT,
      thumbnail TEXT,
      award TEXT,
      allow_download INTEGER DEFAULT 1,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 初始化默认管理员账号
  const adminCheck = all("SELECT id FROM admins WHERE username = 'admin'")
  if (adminCheck.length === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    run('INSERT INTO admins (username, password) VALUES (?, ?)', ['admin', hashedPassword])
    console.log('默认管理员账号已创建: admin / admin123')
  }

  // 保存数据库
  saveDatabase()

  return db
}

// 保存数据库到文件
function saveDatabase() {
  if (db) {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(DB_PATH, buffer)
  }
}

// 获取数据库实例
function getDb() {
  return db
}

// 执行查询并返回所有结果
function all(sql, params = []) {
  try {
    const stmt = db.prepare(sql)
    if (params.length > 0) {
      stmt.bind(params)
    }

    const results = []
    while (stmt.step()) {
      const row = stmt.getAsObject()
      results.push(row)
    }
    stmt.free()
    return results
  } catch (err) {
    console.error('SQL Error (all):', sql, params, err.message)
    throw err
  }
}

// 执行查询并返回单个结果
function get(sql, params = []) {
  const results = all(sql, params)
  return results[0] || null
}

// 执行插入/更新/删除
function run(sql, params = []) {
  try {
    // 使用 db.run() 直接执行带参数的 SQL
    db.run(sql, params)

    saveDatabase()

    // 获取最后插入的ID
    const lastIdResult = db.exec('SELECT last_insert_rowid() as id')
    const lastId = lastIdResult.length > 0 && lastIdResult[0].values.length > 0
      ? lastIdResult[0].values[0][0]
      : null

    // 获取受影响的行数
    const changesResult = db.exec('SELECT changes() as changes')
    const changes = changesResult.length > 0 && changesResult[0].values.length > 0
      ? changesResult[0].values[0][0]
      : 0

    return { lastInsertRowid: lastId, changes }
  } catch (err) {
    console.error('SQL Error (run):', sql, params, err.message)
    throw err
  }
}

module.exports = {
  initDatabase,
  getDb,
  saveDatabase,
  all,
  get,
  run
}
