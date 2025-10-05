import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'
import { contentType as mimeContentType, lookup as mimeLookup } from 'mime-types'
import { db } from './database.js'
import { extractToken, verifyToken } from './middleware/auth.js'
import { appRouter } from './router'
import { BlogService } from './service/blog.js'
import { FileService } from './service/file.js'
import { UserService } from './service/user.js'
import { createContext } from './trpc.js'

export * from './router'

// 初始化数据库索引
async function initializeDatabase() {
  try {
    await UserService.createIndexes()
    await FileService.createIndexes()
    await FileService.initUploadDir()
    await BlogService.createIndexes()
    console.log('Database indexes and upload directory created successfully')
  }
  catch (error) {
    console.error('Error initializing database:', error)
  }
}

// tRPC handler mounted under /api
const trpcHandler = createHTTPHandler({
  router: appRouter,
  createContext,
})

// Static files directory (dist). By default relative to backend working directory.
// If you build frontend in ../frontend/dist you can copy or symlink it to ./dist.
const staticDir = path.resolve(import.meta.dirname, '../dist')
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads')

function getContentType(filePath: string): string {
  const ct = mimeContentType(path.basename(filePath)) || mimeLookup(filePath) || 'application/octet-stream'
  return typeof ct === 'string' ? ct : 'application/octet-stream'
}

/**
 * 从URL解析博客信息
 * 返回: { username, slug } 或 null（如果不是博客URL）
 */
function parseBlogUrl(url: string): { username: string, slug: string } | null {
  // 移除查询参数和哈希
  const cleanUrl = url.split('?')[0].split('#')[0]

  // 匹配 /{username}/blog/{slug}.html 格式
  const userBlogMatch = cleanUrl.match(/^\/([^/]+)\/blog\/([^/]+)\.html$/)
  if (userBlogMatch) {
    return { username: userBlogMatch[1].toLowerCase(), slug: userBlogMatch[2] }
  }

  // 匹配 /{slug}.html 格式（admin用户）
  const adminBlogMatch = cleanUrl.match(/^\/([^/]+)\.html$/)
  if (adminBlogMatch && !cleanUrl.includes('/')) {
    // 排除根路径和包含多个斜杠的路径
    return { username: 'admin', slug: adminBlogMatch[1] }
  }

  // 匹配博客相关的 JavaScript 文件
  // 格式: /assets/{username}_blog_{slug}.md.{hash}.js 或 .lean.js
  const jsBlogMatch = cleanUrl.match(/^\/assets\/([^_]+)_blog_([^.]+)\.md\.[^.]+(?:\.lean)?\.js$/)
  if (jsBlogMatch) {
    return { username: jsBlogMatch[1].toLowerCase(), slug: jsBlogMatch[2] }
  }

  return null
}

/**
 * 从Cookie字符串中提取token
 */
function extractTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    const [name, value] = cookie.split('=')
    if (name === 'token' && value) {
      return value
    }
  }

  return null
}

/**
 * 检查用户是否有权访问博客
 * 返回 true 表示允许访问，false 表示拒绝（应返回404）
 */
async function checkBlogAccess(
  username: string,
  slug: string,
  req: http.IncomingMessage,
): Promise<boolean> {
  try {
    // 从数据库查找博客
    const blogsCollection = db.collection('blogs')
    const blog = await blogsCollection.findOne({
      authorName: new RegExp(`^${username}$`, 'i'), // 不区分大小写
      slug,
    })

    if (!blog) {
      // 博客不存在，允许继续（会返回404）
      return true
    }

    // 如果是公开博客，允许所有人访问
    if (blog.visibility === 'public') {
      return true
    }

    // 私有博客，需要验证身份
    // 先尝试从 Authorization header 获取 token
    let token = extractToken(req.headers.authorization)

    // 如果没有，尝试从 Cookie 中获取
    if (!token) {
      token = extractTokenFromCookie(req.headers.cookie)
    }

    if (!token) {
      // 没有token，返回false（当作404处理）
      return false
    }

    try {
      const user = verifyToken(token)
      // 只有作者本人可以访问私有博客
      if (user.userId === blog.authorId.toString()) {
        return true
      }
      // 不是作者，返回false（当作404处理）
      return false
    }
    catch {
      // token无效，返回false（当作404处理）
      return false
    }
  }
  catch (error) {
    console.error('Error checking blog access:', error)
    return false
  }
}

function serveUploadedFile(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = req.url || '/'
  // Extract filename from /files/filename
  const filename = url.replace(/^\/files\//, '')

  if (!filename || filename.includes('..') || filename.includes('/')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Invalid filename')
    return
  }

  const filePath = path.join(uploadDir, filename)

  // Ensure file is inside uploadDir
  if (!filePath.startsWith(uploadDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    fs.createReadStream(filePath).pipe(res)
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('File not found')
  }
}

/**
 * 返回404页面
 */
function serve404(res: http.ServerResponse) {
  const notFoundPath = path.join(staticDir, '404.html')

  if (fs.existsSync(notFoundPath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' })
    fs.createReadStream(notFoundPath).pipe(res)
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
  }
}

async function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  // Normalize and prevent path traversal
  let url = req.url || '/'

  // 移除查询参数和哈希
  url = url.split('?')[0].split('#')[0]

  if (url === '/' || url === '') {
    const indexPath = path.join(staticDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(indexPath).pipe(res)
    }
    else {
      serve404(res)
    }
    return
  }

  // 检查是否是博客URL，如果是则进行权限验证
  // 注意：需要在添加 .html 后缀前检查，因为 parseBlogUrl 已经处理了 .html
  let blogInfo = parseBlogUrl(url)
  let urlToTry = url

  // 如果URL不以.html结尾，尝试添加.html后缀
  if (!url.endsWith('.html') && !url.includes('.')) {
    urlToTry = `${url}.html`
    // 重新解析博客信息（使用添加后缀的URL）
    blogInfo = parseBlogUrl(urlToTry)
  }

  if (blogInfo) {
    const hasAccess = await checkBlogAccess(blogInfo.username, blogInfo.slug, req)

    if (!hasAccess) {
      // 未授权访问私有博客，返回404（不暴露博客是否存在）
      serve404(res)
      return
    }
  }

  const safePath = path.normalize(urlToTry).replace(/^\/+/, '') // remove leading slashes
  const filePath = path.join(staticDir, safePath)

  // Ensure file is inside staticDir
  if (!filePath.startsWith(staticDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Forbidden')
    return
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': getContentType(filePath) })
    fs.createReadStream(filePath).pipe(res)
  }
  else {
    // 如果添加了.html后缀还是找不到，尝试原始URL
    if (urlToTry !== url) {
      const originalSafePath = path.normalize(url).replace(/^\/+/, '')
      const originalFilePath = path.join(staticDir, originalSafePath)

      if (originalFilePath.startsWith(staticDir) && fs.existsSync(originalFilePath) && fs.statSync(originalFilePath).isFile()) {
        res.writeHead(200, { 'Content-Type': getContentType(originalFilePath) })
        fs.createReadStream(originalFilePath).pipe(res)
        return
      }
    }

    // 文件不存在，返回404页面
    serve404(res)
  }
}

const server = http.createServer(async (req, res) => {
  // CORS headers
  const origin = req.headers.origin
  const allowedOrigins = ['http://localhost:5174', 'http://localhost:5173']

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url || '/'
  if (url.startsWith('/api')) {
    // Strip /api prefix for tRPC handling to keep paths consistent
    req.url = url.substring(4) || '/'
    return trpcHandler(req, res)
  }
  if (url.startsWith('/files/')) {
    // Serve uploaded files
    if (req.method === 'GET' || req.method === 'HEAD') {
      return serveUploadedFile(req, res)
    }
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Method Not Allowed')
    return
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return await serveStatic(req, res)
  }
  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('Method Not Allowed')
})

async function main() {
  await initializeDatabase()

  const port = Number(process.env.PORT) || 3000
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
    console.log(`tRPC endpoint mounted at http://localhost:${port}/api`)
    console.log(`Serving static files from: ${staticDir}`)
  })
}
main()
