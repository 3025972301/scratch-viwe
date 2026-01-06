const express = require('express')
const { all, get, run } = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// 获取所有项目（公开）
router.get('/', (req, res) => {
  try {
    const projects = all('SELECT * FROM projects ORDER BY created_at DESC')
    res.json(projects.map(formatProject))
  } catch (err) {
    console.error('获取项目列表失败:', err)
    res.status(500).json({ error: '获取项目列表失败' })
  }
})

// 获取单个项目（公开）
router.get('/:id', (req, res) => {
  try {
    const project = get('SELECT * FROM projects WHERE id = ?', [req.params.id])
    if (!project) {
      return res.status(404).json({ error: '项目不存在' })
    }
    res.json(formatProject(project))
  } catch (err) {
    console.error('获取项目失败:', err)
    res.status(500).json({ error: '获取项目失败' })
  }
})

// 获取学生的所有项目（公开）
router.get('/student/:studentId', (req, res) => {
  try {
    const projects = all(
      'SELECT * FROM projects WHERE student_id = ? ORDER BY created_at DESC',
      [req.params.studentId]
    )
    res.json(projects.map(formatProject))
  } catch (err) {
    console.error('获取学生项目失败:', err)
    res.status(500).json({ error: '获取学生项目失败' })
  }
})

// 添加项目（需要认证）
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      studentId, title, description, instructions,
      scratchUrl, sb3File, thumbnail, award, allowDownload
    } = req.body

    if (!studentId || !title) {
      return res.status(400).json({ error: '学生ID和标题不能为空' })
    }

    // 检查学生是否存在
    const student = get('SELECT id FROM students WHERE id = ?', [studentId])
    if (!student) {
      return res.status(400).json({ error: '学生不存在' })
    }

    run(
      `INSERT INTO projects (student_id, title, description, instructions, scratch_url, sb3_file, thumbnail, award, allow_download)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        studentId,
        title,
        description || '',
        instructions || '',
        scratchUrl || '',
        sb3File || '',
        thumbnail || '',
        award || '',
        allowDownload !== false ? 1 : 0
      ]
    )

    // 查询刚插入的记录（按ID降序取第一条）
    const project = get('SELECT * FROM projects ORDER BY id DESC LIMIT 1')
    if (!project) {
      return res.status(500).json({ error: '创建项目失败' })
    }
    res.status(201).json(formatProject(project))
  } catch (err) {
    console.error('添加项目失败:', err)
    res.status(500).json({ error: '添加项目失败: ' + err.message })
  }
})

// 更新项目（需要认证）
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params
    const {
      studentId, title, description, instructions,
      scratchUrl, sb3File, thumbnail, award, allowDownload
    } = req.body

    const existing = get('SELECT * FROM projects WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '项目不存在' })
    }

    run(
      `UPDATE projects SET
        student_id = ?,
        title = ?,
        description = ?,
        instructions = ?,
        scratch_url = ?,
        sb3_file = ?,
        thumbnail = ?,
        award = ?,
        allow_download = ?
      WHERE id = ?`,
      [
        studentId !== undefined ? studentId : existing.student_id,
        title !== undefined ? title : existing.title,
        description !== undefined ? description : existing.description,
        instructions !== undefined ? instructions : existing.instructions,
        scratchUrl !== undefined ? scratchUrl : existing.scratch_url,
        sb3File !== undefined ? sb3File : existing.sb3_file,
        thumbnail !== undefined ? thumbnail : existing.thumbnail,
        award !== undefined ? award : existing.award,
        allowDownload !== undefined ? (allowDownload ? 1 : 0) : existing.allow_download,
        id
      ]
    )

    const project = get('SELECT * FROM projects WHERE id = ?', [id])
    res.json(formatProject(project))
  } catch (err) {
    console.error('更新项目失败:', err)
    res.status(500).json({ error: '更新项目失败: ' + err.message })
  }
})

// 删除项目（需要认证）
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params

    const existing = get('SELECT * FROM projects WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '项目不存在' })
    }

    run('DELETE FROM projects WHERE id = ?', [id])

    res.json({ success: true })
  } catch (err) {
    console.error('删除项目失败:', err)
    res.status(500).json({ error: '删除项目失败: ' + err.message })
  }
})

// 增加浏览量（公开）
router.post('/:id/view', (req, res) => {
  try {
    const { id } = req.params

    const existing = get('SELECT views FROM projects WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '项目不存在' })
    }

    run('UPDATE projects SET views = views + 1 WHERE id = ?', [id])

    res.json({ success: true, views: existing.views + 1 })
  } catch (err) {
    console.error('增加浏览量失败:', err)
    res.status(500).json({ error: '增加浏览量失败' })
  }
})

// 点赞/取消点赞（公开）
router.post('/:id/like', (req, res) => {
  try {
    const { id } = req.params
    const { unlike } = req.body || {}

    const existing = get('SELECT likes FROM projects WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: '项目不存在' })
    }

    let newLikes
    if (unlike) {
      // 取消点赞，确保点赞数不小于0
      newLikes = Math.max(0, existing.likes - 1)
      run('UPDATE projects SET likes = ? WHERE id = ?', [newLikes, id])
    } else {
      // 点赞
      newLikes = existing.likes + 1
      run('UPDATE projects SET likes = likes + 1 WHERE id = ?', [id])
    }

    res.json({ success: true, likes: newLikes })
  } catch (err) {
    console.error('点赞失败:', err)
    res.status(500).json({ error: '点赞失败' })
  }
})

// 格式化项目数据
function formatProject(project) {
  return {
    id: String(project.id),
    studentId: String(project.student_id),
    title: project.title,
    description: project.description,
    instructions: project.instructions,
    scratchUrl: project.scratch_url,
    sb3File: project.sb3_file,
    thumbnail: project.thumbnail,
    award: project.award,
    allowDownload: project.allow_download === 1,
    views: project.views,
    likes: project.likes,
    createdAt: project.created_at
  }
}

module.exports = router
