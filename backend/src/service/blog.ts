import { ObjectId } from 'mongodb'
import { db } from '../database.js'

/**
 * 博客可见性状态
 */
export enum BlogVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

/**
 * 博客接口定义
 */
export interface Blog {
  _id?: ObjectId
  title: string
  content: string // Markdown格式
  visibility: BlogVisibility
  pinned: boolean // 是否被置顶（仅管理员可设置）
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 创建博客输入
 */
export interface CreateBlogInput {
  title: string
  content: string
  visibility: BlogVisibility
  authorId: string
  authorName: string
}

/**
 * 更新博客输入
 */
export interface UpdateBlogInput {
  title?: string
  content?: string
  visibility?: BlogVisibility
}

/**
 * 博客响应
 */
export interface BlogResponse {
  _id: ObjectId
  title: string
  content: string
  visibility: BlogVisibility
  pinned: boolean
  authorId: string
  authorName: string
  createdAt: Date
  updatedAt: Date
}

/**
 * 博客集合
 */
const blogs = db.collection<Blog>('blogs')

/**
 * 博客服务类
 */
export class BlogService {
  /**
   * 转换为博客响应格式
   */
  private static toBlogResponse(blog: Blog): BlogResponse {
    return {
      _id: blog._id!,
      title: blog.title,
      content: blog.content,
      visibility: blog.visibility,
      pinned: blog.pinned || false,
      authorId: blog.authorId,
      authorName: blog.authorName,
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    }
  }

  /**
   * 创建博客
   */
  static async create(input: CreateBlogInput): Promise<BlogResponse> {
    const now = new Date()
    const blog: Blog = {
      title: input.title,
      content: input.content,
      visibility: input.visibility,
      pinned: false, // 默认不置顶
      authorId: input.authorId,
      authorName: input.authorName,
      createdAt: now,
      updatedAt: now,
    }

    const result = await blogs.insertOne(blog)
    const createdBlog = await blogs.findOne({ _id: result.insertedId })

    if (!createdBlog) {
      throw new Error('Failed to create blog')
    }

    return this.toBlogResponse(createdBlog)
  }

  /**
   * 根据ID获取博客
   */
  static async findById(id: string, userId?: string): Promise<BlogResponse | null> {
    const blog = await blogs.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      return null
    }

    // 如果是私有博客，只有作者本人可以查看
    if (blog.visibility === BlogVisibility.PRIVATE && blog.authorId !== userId) {
      throw new Error('You do not have permission to view this blog')
    }

    return this.toBlogResponse(blog)
  }

  /**
   * 获取用户的所有博客
   */
  static async findByAuthorId(
    authorId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    blogs: BlogResponse[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const total = await blogs.countDocuments({ authorId })
    const blogList = await blogs
      .find({ authorId })
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .toArray()

    return {
      blogs: blogList.map(blog => this.toBlogResponse(blog)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 搜索公开博客（按标题搜索）
   */
  static async searchPublicBlogs(
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    blogs: BlogResponse[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit

    // 构建搜索条件：标题包含查询字符串，且可见性为public
    const filter = {
      visibility: BlogVisibility.PUBLIC,
      title: { $regex: query, $options: 'i' }, // 不区分大小写的正则搜索
    }

    const total = await blogs.countDocuments(filter)
    const blogList = await blogs
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .toArray()

    return {
      blogs: blogList.map(blog => this.toBlogResponse(blog)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 获取所有公开博客
   */
  static async findAllPublic(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    blogs: BlogResponse[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const filter = { visibility: BlogVisibility.PUBLIC }

    const total = await blogs.countDocuments(filter)
    const blogList = await blogs
      .find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .toArray()

    return {
      blogs: blogList.map(blog => this.toBlogResponse(blog)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 更新博客
   */
  static async update(
    id: string,
    userId: string,
    updates: UpdateBlogInput,
  ): Promise<BlogResponse> {
    const blog = await blogs.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      throw new Error('Blog not found')
    }

    // 验证博客所有者
    if (blog.authorId !== userId) {
      throw new Error('You do not have permission to update this blog')
    }

    // 如果博客被pinned且要改为private，自动去掉pinned
    const updateData: any = { ...updates, updatedAt: new Date() }
    if (blog.pinned && updates.visibility === BlogVisibility.PRIVATE) {
      updateData.pinned = false
    }

    const result = await blogs.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' },
    )

    if (!result) {
      throw new Error('Failed to update blog')
    }

    return this.toBlogResponse(result)
  }

  /**
   * 切换博客可见性
   */
  static async toggleVisibility(id: string, userId: string): Promise<BlogResponse> {
    const blog = await blogs.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      throw new Error('Blog not found')
    }

    // 验证博客所有者
    if (blog.authorId !== userId) {
      throw new Error('You do not have permission to update this blog')
    }

    const newVisibility
      = blog.visibility === BlogVisibility.PUBLIC
        ? BlogVisibility.PRIVATE
        : BlogVisibility.PUBLIC

    const result = await blogs.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          visibility: newVisibility,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    )

    if (!result) {
      throw new Error('Failed to update blog visibility')
    }

    return this.toBlogResponse(result)
  }

  /**
   * 删除博客
   */
  static async delete(id: string, userId: string): Promise<void> {
    const blog = await blogs.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      throw new Error('Blog not found')
    }

    // 验证博客所有者
    if (blog.authorId !== userId) {
      throw new Error('You do not have permission to delete this blog')
    }

    const result = await blogs.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      throw new Error('Failed to delete blog')
    }
  }

  /**
   * 获取所有博客（管理员专用）
   */
  static async findAll(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    blogs: BlogResponse[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const total = await blogs.countDocuments()
    const blogList = await blogs
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ pinned: -1, updatedAt: -1 }) // 置顶的排在前面
      .toArray()

    return {
      blogs: blogList.map(blog => this.toBlogResponse(blog)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 设置博客置顶状态（管理员专用）
   */
  static async setPinned(id: string, pinned: boolean): Promise<BlogResponse> {
    const blog = await blogs.findOne({ _id: new ObjectId(id) })

    if (!blog) {
      throw new Error('Blog not found')
    }

    // 只有public的博客才能被置顶
    if (pinned && blog.visibility === BlogVisibility.PRIVATE) {
      throw new Error('Only public blogs can be pinned')
    }

    const result = await blogs.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          pinned,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    )

    if (!result) {
      throw new Error('Failed to update blog')
    }

    return this.toBlogResponse(result)
  }

  /**
   * 获取置顶的博客列表（公开接口）
   */
  static async findPinned(): Promise<BlogResponse[]> {
    const blogList = await blogs
      .find({
        pinned: true,
        visibility: BlogVisibility.PUBLIC,
      })
      .sort({ updatedAt: -1 })
      .toArray()

    return blogList.map(blog => this.toBlogResponse(blog))
  }

  /**
   * 创建索引
   */
  static async createIndexes(): Promise<void> {
    // 为作者ID创建索引
    await blogs.createIndex({ authorId: 1, updatedAt: -1 })

    // 为可见性和更新时间创建复合索引（用于获取公开博客）
    await blogs.createIndex({ visibility: 1, updatedAt: -1 })

    // 为标题创建文本索引（用于搜索）
    await blogs.createIndex({ title: 'text' })

    // 为可见性和标题创建复合索引（用于搜索公开博客）
    await blogs.createIndex({ visibility: 1, title: 1 })

    // 为置顶和可见性创建复合索引（用于获取置顶博客）
    await blogs.createIndex({ pinned: 1, visibility: 1, updatedAt: -1 })
  }
}
