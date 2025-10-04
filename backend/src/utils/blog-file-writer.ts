import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { pinyin } from 'pinyin-pro'

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
 * 普通用户: vitepress/content/{username}/blog/{slug}.md
 * admin 用户: vitepress/content/{slug}.md
 */
export function getBlogFilePath(username: string, slug: string): string {
  const vitepressContentDir = path.join(process.cwd(), '..', 'vitepress', 'content')

  // 将用户名转为小写
  const lowercaseUsername = username.toLowerCase()

  if (lowercaseUsername === 'admin') {
    // admin 用户的博客直接放在 content 根目录
    return path.join(vitepressContentDir, `${slug}.md`)
  }
  else {
    // 普通用户的博客放在 {username}/blog/ 目录下（用户名小写）
    return path.join(vitepressContentDir, lowercaseUsername, 'blog', `${slug}.md`)
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
  while (fs.existsSync(getBlogFilePath(username, slug))) {
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
    const oldFilePath = getBlogFilePath(username, oldSlug)
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath)
      }
      catch (error) {
        console.error('Failed to delete old blog file:', error)
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8')

  return { slug, filePath }
}

/**
 * 删除博客文件
 */
export async function deleteBlogFile(username: string, slug: string): Promise<void> {
  const filePath = getBlogFilePath(username, slug)

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath)
    }
    catch (error) {
      console.error('Failed to delete blog file:', error)
      throw error
    }
  }
}
