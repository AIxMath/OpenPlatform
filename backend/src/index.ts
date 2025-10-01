import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import process from 'node:process'
import { createHTTPHandler } from '@trpc/server/adapters/standalone'
import { contentType as mimeContentType, lookup as mimeLookup } from 'mime-types'
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
const staticDir = path.resolve(process.cwd(), 'dist')

function getContentType(filePath: string): string {
  const ct = mimeContentType(path.basename(filePath)) || mimeLookup(filePath) || 'application/octet-stream'
  return typeof ct === 'string' ? ct : 'application/octet-stream'
}

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse) {
  // Normalize and prevent path traversal
  const url = req.url || '/'
  if (url === '/' || url === '') {
    const indexPath = path.join(staticDir, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      fs.createReadStream(indexPath).pipe(res)
    }
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('index.html not found')
    }
    return
  }

  const safePath = path.normalize(url).replace(/^\/+/, '') // remove leading slashes
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
    // Not found -> 404 (could choose SPA fallback to index.html if desired)
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end('Not Found')
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || '/'
  if (url.startsWith('/api')) {
    // Strip /api prefix for tRPC handling to keep paths consistent
    req.url = url.substring(4) || '/'
    return trpcHandler(req, res)
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return serveStatic(req, res)
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
