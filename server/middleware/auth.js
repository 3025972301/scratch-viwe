const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'scratch-show-secret-key-2024'

// 验证 JWT 中间件
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token 无效或已过期' })
  }
}

// 生成 JWT
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

module.exports = {
  authMiddleware,
  generateToken,
  JWT_SECRET
}
