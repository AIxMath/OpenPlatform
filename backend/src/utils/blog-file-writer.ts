import { exec } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { promisify } from 'node:util'
import { pinyin } from 'pinyin-pro'

const execAsync = promisify(exec)

// 部署状态管理
let deployTimeout: NodeJS.Timeout | null = null
let isDeploying = false

/**
 * 执行部署脚本（防抖处理，避免频繁构建）
 * 在博客文件变化后延迟3秒执行，如果3秒内有新的变化则重新计时
 */
async function triggerDeploy() {
  // 清除之前的定时器
  if (deployTimeout) {
    clearTimeout(deployTimeout)
  }

  // 设置新的定时器
  deployTimeout = setTimeout(async () => {
    if (isDeploying)
      return

    isDeploying = true

    try {
      const projectRoot = path.join(process.cwd(), '..')
      const deployScript = path.join(projectRoot, 'deploy.sh')

      // 执行 deploy.sh
      const { stdout, stderr } = await execAsync(`bash ${deployScript}`, {
        cwd: projectRoot,
        timeout: 300000, // 5分钟超时
      })

      if (stderr)
        console.error('Build stderr:', stderr)
    }
    catch (error: any) {
      console.error('Deploy failed:', error.message)
    }
    finally {
      isDeploying = false
    }
  }, 3000) // 3秒防抖延迟
}

/**
 * 将博客标题转换为 URL 友好的 slug
 * 英文: "An Intro to Math" -> "an-intro-to-math"
 * 中文: "数学入门" -> "shu-xue-ru-men"
 */
export function titleToSlug(title: string): string {
  // 先尝试检测是否包含中文字符
  const hasChinese = /[\u4E00-\u9FA5]/.test(title)

  let slug: string

  if (hasChinese) {
    // 将中文转换为拼音
    slug = pinyin(title, {
      toneType: 'none', // 不带声调
      type: 'array', // 返回数组形式
    }).join('-')
  }
  else {
    // 英文处理：转小写，替换空格和特殊字符为连字符
    slug = title
      .toLowerCase()
      .trim()
      // 替换空格和多个特殊字符为单个连字符
      .replace(/[\s_]+/g, '-')
      // 移除所有非字母数字和连字符的字符
      .replace(/[^\w\-]+/g, '')
      // 移除多个连续的连字符
      .replace(/-{2,}/g, '-')
      // 移除开头和结尾的连字符
      .replace(/^-+|-+$/g, '')
  }

  // 确保 slug 不为空，如果为空则使用时间戳
  if (!slug) {
    slug = `blog-${Date.now()}`
  }

  return slug
}

/**
 * 获取博客文件路径
 * 博客现在统一写入 vitepress/content/blog/{slug}.md。
 * 旧的 vitepress/content/{username}/blog/{slug}.md 会在更新时清理。
 */
export function getBlogFilePath(username: string, slug: string): string {
  const vitepressContentDir = path.join(process.cwd(), '..', 'vitepress', 'content')
  return path.join(vitepressContentDir, 'blog', `${slug}.md`)
}

function getLegacyBlogFilePath(username: string, slug: string): string {
  const vitepressContentDir = path.join(process.cwd(), '..', 'vitepress', 'content')
  const lowercaseUsername = username.toLowerCase()
  return path.join(vitepressContentDir, lowercaseUsername, 'blog', `${slug}.md`)
}

function getAllLegacyBlogFilePaths(slug: string): string[] {
  const vitepressContentDir = path.join(process.cwd(), '..', 'vitepress', 'content')

  if (!fs.existsSync(vitepressContentDir)) {
    return []
  }

  return fs.readdirSync(vitepressContentDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name !== 'blog')
    .map(entry => path.join(vitepressContentDir, entry.name, 'blog', `${slug}.md`))
}

function blogFileExists(username: string, slug: string): boolean {
  if (fs.existsSync(getBlogFilePath(username, slug)))
    return true

  return getAllLegacyBlogFilePaths(slug).some(filePath => fs.existsSync(filePath))
}

function deleteIfExists(filePath: string) {
  if (!fs.existsSync(filePath))
    return

  try {
    fs.unlinkSync(filePath)
  }
  catch (error) {
    console.error('Failed to delete blog file:', error)
  }
}

function deleteLegacyBlogFiles(username: string, slug: string) {
  const legacyPaths = new Set([
    getLegacyBlogFilePath(username, slug),
    ...getAllLegacyBlogFilePaths(slug),
  ])

  for (const filePath of legacyPaths) {
    deleteIfExists(filePath)
  }
}

/**
 * 生成唯一的 slug（如果文件已存在，添加 -1, -2, -3 等后缀）
 */
function generateUniqueSlug(username: string, baseSlug: string, oldSlug?: string): string {
  let slug = baseSlug
  let counter = 1

  // 如果是更新操作且 slug 没变，直接返回
  if (oldSlug && oldSlug === slug) {
    return slug
  }

  // 检查文件是否存在，如果存在则添加数字后缀
  while (blogFileExists(username, slug)) {
    // 如果这个文件是旧文件（更新操作），则跳过
    if (oldSlug && oldSlug === slug) {
      break
    }
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * 写入博客内容到文件系统
 */
export async function writeBlogToFile(
  username: string,
  title: string,
  content: string,
  oldSlug?: string,
): Promise<{ slug: string, filePath: string }> {
  const baseSlug = titleToSlug(title)

  // 生成唯一的 slug（防止重名）
  const slug = generateUniqueSlug(username, baseSlug, oldSlug)

  const filePath = getBlogFilePath(username, slug)

  // 确保目录存在
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // 如果标题改变了（slug 改变），删除旧文件
  if (oldSlug && oldSlug !== slug) {
    deleteIfExists(getBlogFilePath(username, oldSlug))
    deleteLegacyBlogFiles(username, oldSlug)
  }

  fs.writeFileSync(filePath, content, 'utf-8')
  deleteLegacyBlogFiles(username, slug)

  // 触发部署（异步，不等待完成）
  triggerDeploy().catch(err => console.error('Failed to trigger deploy:', err))

  return { slug, filePath }
}

/**
 * 删除博客文件
 */
export async function deleteBlogFile(username: string, slug: string): Promise<void> {
  const filePath = getBlogFilePath(username, slug)
  const legacyFilePaths = getAllLegacyBlogFilePaths(slug).filter(filePath => fs.existsSync(filePath))

  if (fs.existsSync(filePath) || legacyFilePaths.length > 0) {
    try {
      deleteIfExists(filePath)
      deleteLegacyBlogFiles(username, slug)

      // 触发部署（异步，不等待完成）
      triggerDeploy().catch(err => console.error('Failed to trigger deploy:', err))
    }
    catch (error) {
      console.error('Failed to delete blog file:', error)
      throw error
    }
  }
}
