const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = path.join(__dirname, '../uploads')

    if (file.fieldname === 'thumbnail') {
      uploadPath = path.join(uploadPath, 'thumbnails')
    } else if (file.fieldname === 'sb3File') {
      uploadPath = path.join(uploadPath, 'projects')
    } else if (file.fieldname === 'avatar') {
      uploadPath = path.join(uploadPath, 'avatars')
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true })
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix + ext)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail' || file.fieldname === 'avatar') {
      // 只允许图片
      if (file.mimetype.startsWith('image/')) {
        cb(null, true)
      } else {
        cb(new Error('只允许上传图片文件'))
      }
    } else if (file.fieldname === 'sb3File') {
      // 只允许 .sb3 文件
      if (file.originalname.endsWith('.sb3')) {
        cb(null, true)
      } else {
        cb(new Error('只允许上传 .sb3 文件'))
      }
    } else {
      cb(null, true)
    }
  }
})

// 上传缩略图
router.post('/thumbnail', authMiddleware, upload.single('thumbnail'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const fileUrl = `/uploads/thumbnails/${req.file.filename}`
    res.json({ success: true, url: fileUrl })
  } catch (err) {
    console.error('上传缩略图失败:', err)
    res.status(500).json({ error: '上传缩略图失败: ' + err.message })
  }
})

// 上传 .sb3 文件
router.post('/sb3', authMiddleware, upload.single('sb3File'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const fileUrl = `/uploads/projects/${req.file.filename}`
    res.json({ success: true, url: fileUrl })
  } catch (err) {
    console.error('上传sb3文件失败:', err)
    res.status(500).json({ error: '上传sb3文件失败: ' + err.message })
  }
})

// 上传头像
router.post('/avatar', authMiddleware, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const fileUrl = `/uploads/avatars/${req.file.filename}`
    res.json({ success: true, url: fileUrl })
  } catch (err) {
    console.error('上传头像失败:', err)
    res.status(500).json({ error: '上传头像失败: ' + err.message })
  }
})

// 删除文件
router.delete('/file', authMiddleware, (req, res) => {
  try {
    const { url } = req.body

    if (!url || !url.startsWith('/uploads/')) {
      return res.status(400).json({ error: '无效的文件路径' })
    }

    const filePath = path.join(__dirname, '..', url)

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ success: true })
    } else {
      res.status(404).json({ error: '文件不存在' })
    }
  } catch (err) {
    console.error('删除文件失败:', err)
    res.status(500).json({ error: '删除文件失败: ' + err.message })
  }
})

module.exports = router
