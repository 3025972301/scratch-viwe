const express = require('express')
const { all, get, run } = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 获取所有学生（公开）
router.get('/', (req, res) => {
  try {
    const students = all('SELECT * FROM students ORDER BY created_at DESC')
    res.json(students.map(formatStudent))
  } catch (err) {
    console.error('获取学生列表失败:', err)
    res.status(500).json({ error: '获取学生列表失败' })
  }
})

// 获取单个学生（公开）
router.get('/:id', (req, res) => {
  try {
    const student = get('SELECT * FROM students WHERE id = ?', [req.params.id])
    if (!student) {
      return res.status(404).json({ error: '学生不存在' })
    }
    res.json(formatStudent(student))
  } catch (err) {
    console.error('获取学生失败:', err)
    res.status(500).json({ error: '获取学生失败' })
  }
})

// 添加学生（需要认证）
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, grade, bio, avatar } = req.body

    if (!name) {
      return res.status(400).json({ error: '姓名不能为空' })
    }

    run(
      'INSERT INTO students (name, grade, bio, avatar) VALUES (?, ?, ?, ?)',
      [name, grade || '', bio || '', avatar || '']
    )

    // 查询刚插入的记录（按ID降序取第一条）
    const student = get('SELECT * FROM students ORDER BY id DESC LIMIT 1')
    if (!student) {
      return res.status(500).json({ error: '创建学生失败' })
    }
    res.status(201).json(formatStudent(student))
  } catch (err) {
    console.error('添加学生失败:', err)
    res.status(500).json({ error: '添加学生失败: ' + err.message })
  }
})

// 更新学生（需要认证）
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { name, grade, bio, avatar } = req.body
    const { id } = req.params

    const existing = get('SELECT * FROM students WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '学生不存在' })
    }

    run(
      'UPDATE students SET name = ?, grade = ?, bio = ?, avatar = ? WHERE id = ?',
      [
        name || existing.name,
        grade !== undefined ? grade : existing.grade,
        bio !== undefined ? bio : existing.bio,
        avatar !== undefined ? avatar : existing.avatar,
        id
      ]
    )

    const student = get('SELECT * FROM students WHERE id = ?', [id])
    res.json(formatStudent(student))
  } catch (err) {
    console.error('更新学生失败:', err)
    res.status(500).json({ error: '更新学生失败: ' + err.message })
  }
})

// 删除学生（需要认证）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params

    const existing = get('SELECT * FROM students WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '学生不存在' })
    }

    // 先删除学生的所有项目
    run('DELETE FROM projects WHERE student_id = ?', [id])
    // 删除学生
    run('DELETE FROM students WHERE id = ?', [id])

    res.json({ success: true })
  } catch (err) {
    console.error('删除学生失败:', err)
    res.status(500).json({ error: '删除学生失败: ' + err.message })
  }
})

// 格式化学生数据
function formatStudent(student) {
  return {
    id: String(student.id),
    name: student.name,
    grade: student.grade,
    bio: student.bio,
    avatar: student.avatar,
    createdAt: student.created_at
  }
}

module.exports = router
