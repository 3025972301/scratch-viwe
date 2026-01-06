const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// 初始化数据库
const { initDatabase } = require('./db')

const app = express()
const PORT = process.env.PORT || 3002

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads')
const thumbnailsDir = path.join(uploadsDir, 'thumbnails')
const projectsDir = path.join(uploadsDir, 'projects')

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir)
if (!fs.existsSync(projectsDir)) fs.mkdirSync(projectsDir)

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 静态文件服务 - 上传的文件
app.use('/uploads', express.static(uploadsDir))

// 生产环境：提供前端静态文件
const distPath = path.join(__dirname, '../dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
}

// 启动服务器
async function startServer() {
  // 先初始化数据库
  await initDatabase()
  console.log('数据库初始化完成')

  // 然后加载路由（路由依赖数据库）
  const authRoutes = require('./routes/auth')
  const studentsRoutes = require('./routes/students')
  const projectsRoutes = require('./routes/projects')
  const uploadRoutes = require('./routes/upload')

  // API 路由
  app.use('/api/auth', authRoutes)
  app.use('/api/students', studentsRoutes)
  app.use('/api/projects', projectsRoutes)
  app.use('/api/upload', uploadRoutes)

  // 健康检查
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // 生产环境：所有非 API 请求返回 index.html（SPA 路由支持）
  if (fs.existsSync(distPath)) {
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  // 错误处理
  app.use((err, req, res, next) => {
    console.error('Error:', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  })

  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`)
  })
}

startServer().catch(err => {
  console.error('启动服务器失败:', err)
  process.exit(1)
})
