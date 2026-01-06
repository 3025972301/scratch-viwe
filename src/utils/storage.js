// IndexedDB 存储工具 - 用于存储大文件数据

const DB_NAME = 'ScratchShowDB'
const DB_VERSION = 1
const STORE_NAME = 'appData'

let db = null

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('IndexedDB 打开失败:', request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = event.target.result

      // 创建存储对象
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
  })
}

// 保存数据
export async function saveToStorage(key, value) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.put({ key, value })

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('保存数据失败:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('存储失败:', error)
    throw error
  }
}

// 读取数据
export async function loadFromStorage(key) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.get(key)

      request.onsuccess = () => {
        resolve(request.result?.value || null)
      }
      request.onerror = () => {
        console.error('读取数据失败:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('读取失败:', error)
    return null
  }
}

// 删除数据
export async function removeFromStorage(key) {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.delete(key)

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('删除数据失败:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('删除失败:', error)
    throw error
  }
}

// 清空所有数据
export async function clearStorage() {
  try {
    const database = await initDB()
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      const request = store.clear()

      request.onsuccess = () => resolve(true)
      request.onerror = () => {
        console.error('清空数据失败:', request.error)
        reject(request.error)
      }
    })
  } catch (error) {
    console.error('清空失败:', error)
    throw error
  }
}

// 获取存储使用情况估算
export async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      usageInMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      quotaInMB: (estimate.quota / (1024 * 1024)).toFixed(2),
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    }
  }
  return null
}

// 从 localStorage 迁移数据到 IndexedDB（用于升级现有用户）
export async function migrateFromLocalStorage() {
  const oldData = localStorage.getItem('scratchShowData')
  if (oldData) {
    try {
      const parsed = JSON.parse(oldData)
      await saveToStorage('students', parsed.students || [])
      await saveToStorage('projects', parsed.projects || [])
      // 迁移成功后删除旧数据
      localStorage.removeItem('scratchShowData')
      console.log('数据迁移成功：从 localStorage 迁移到 IndexedDB')
      return true
    } catch (e) {
      console.error('数据迁移失败:', e)
      return false
    }
  }
  return false
}
