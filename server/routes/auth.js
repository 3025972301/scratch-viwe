const express = require('express')
const bcrypt = require('bcryptjs')
const { get } = require('../db')
const { generateToken } = require('../middleware/auth')

const router = express.Router()

// 登录
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' })
    }

    const admin = get('SELECT * FROM admins WHERE username = ?', [username])

    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const validPassword = bcrypt.compareSync(password, admin.password)
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' })
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: 'admin'
    })

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      }
    })
  } catch (err) {
    console.error('登录失败:', err)
    res.status(500).json({ error: '登录失败: ' + err.message })
  }
})

// 验证 token
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false })
  }

  const token = authHeader.split(' ')[1]

  try {
    const jwt = require('jsonwebtoken')
    const { JWT_SECRET } = require('../middleware/auth')
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ valid: true, user: decoded })
  } catch (err) {
    res.status(401).json({ valid: false })
  }
})

module.exports = router
