import { z } from 'zod'
import { generateToken } from './middleware/auth.ts'
import { BlogService, BlogVisibility } from './service/blog.ts'
import { FileService } from './service/file.ts'
import { UserService } from './service/user.ts'
import { adminProcedure, protectedProcedure, publicProcedure, router } from './trpc.ts'

/**
 * 应用路由
 */
export const appRouter = router({
  /**
   * 用户注册
   */
  register: publicProcedure
    .input(z.object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^\w+$/, 'Username can only contain letters, numbers, and underscores'),
      email: z.string().email('Invalid email format'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        ),
    }))
    .mutation(async ({ input }) => {
      const user = await UserService.register(input)
      return {
        success: true,
        message: 'User registered successfully',
        data: user,
      }
    }),

  /**
   * 用户登录
   */
  login: publicProcedure
    .input(z.object({
      usernameOrEmail: z.string().min(1, 'Username or email is required'),
      password: z.string().min(1, 'Password is required'),
    }))
    .mutation(async ({ input }) => {
      const user = await UserService.login(input.usernameOrEmail, input.password)
      const token = generateToken({
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      })

      return {
        user,
        token,
      }
    }),

  /**
   * 获取当前用户信息（需要认证）
   */
  getMe: protectedProcedure
    .query(async ({ ctx }) => {
      const user = await UserService.findById(ctx.user.userId)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    }),

  /**
   * 修改密码（需要认证）
   */
  changePassword: protectedProcedure
    .input(z.object({
      oldPassword: z.string().min(1, 'Old password is required'),
      newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number',
        ),
    }))
    .mutation(async ({ input, ctx }) => {
      await UserService.changePassword(ctx.user.userId, input.oldPassword, input.newPassword)
      return {
        success: true,
        message: 'Password changed successfully',
      }
    }),

  /**
   * 更新用户个人资料（需要认证）
   */
  updateProfile: protectedProcedure
    .input(z.object({
      avatar: z.string().optional(),
      bio: z.string().max(500, 'Bio is too long').optional(),
      github: z.string().max(100, 'GitHub username is too long').optional(),
      contactEmail: z.string().email('Invalid email').optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await UserService.updateProfile(ctx.user.userId, input)
      return {
        success: true,
        message: 'Profile updated successfully',
        data: user,
      }
    }),

  /**
   * 上传文件（需要认证）
   */
  uploadFile: protectedProcedure
    .input(z.object({
      filename: z.string().min(1, 'Filename is required'),
      mimetype: z.string().min(1, 'Mimetype is required'),
      size: z.number().positive('File size must be positive'),
      data: z.string().min(1, 'File data is required'), // Base64编码的文件数据或Data URI
    }))
    .mutation(async ({ input, ctx }) => {
      // 处理 Data URI 格式 (data:image/png;base64,xxxxx)
      let base64Data = input.data
      if (base64Data.startsWith('data:')) {
        // 去掉 data URI 前缀，只保留 Base64 数据
        const base64Index = base64Data.indexOf('base64,')
        if (base64Index !== -1) {
          base64Data = base64Data.substring(base64Index + 7)
        }
      }

      // 将Base64编码的数据转换为Buffer
      const buffer = Buffer.from(base64Data, 'base64')

      const file = await FileService.upload({
        filename: input.filename,
        mimetype: input.mimetype,
        size: buffer.length,
        data: buffer,
        userId: ctx.user.userId,
      })

      return {
        success: true,
        message: 'File uploaded successfully',
        data: file,
      }
    }),

  /**
   * 获取我的文件列表（需要认证）
   */
  getMyFiles: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const page = input?.page || 1
      const limit = input?.limit || 20
      return await FileService.findByUserId(ctx.user.userId, page, limit)
    }),

  /**
   * 删除文件（需要认证）
   */
  deleteFile: protectedProcedure
    .input(z.object({
      fileId: z.string().min(1, 'File ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      await FileService.delete(input.fileId, ctx.user.userId)
      return {
        success: true,
        message: 'File deleted successfully',
      }
    }),

  /**
   * 创建博客（需要认证）
   */
  createBlog: protectedProcedure
    .input(z.object({
      title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
      content: z.string().min(1, 'Content is required'),
      visibility: z.nativeEnum(BlogVisibility).default(BlogVisibility.PUBLIC),
    }))
    .mutation(async ({ input, ctx }) => {
      const blog = await BlogService.create({
        title: input.title,
        content: input.content,
        visibility: input.visibility,
        authorId: ctx.user.userId,
        authorName: ctx.user.username,
      })

      return {
        success: true,
        message: 'Blog created successfully',
        data: blog,
      }
    }),

  /**
   * 更新博客（需要认证）
   */
  updateBlog: protectedProcedure
    .input(z.object({
      blogId: z.string().min(1, 'Blog ID is required'),
      title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
      content: z.string().min(1, 'Content is required').optional(),
      visibility: z.nativeEnum(BlogVisibility).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { blogId, ...updates } = input
      const blog = await BlogService.update(blogId, ctx.user.userId, updates)

      return {
        success: true,
        message: 'Blog updated successfully',
        data: blog,
      }
    }),

  /**
   * 通过 slug 更新博客（需要认证）
   */
  updateBlogBySlug: protectedProcedure
    .input(z.object({
      slug: z.string().min(1, 'Slug is required'),
      title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
      content: z.string().min(1, 'Content is required').optional(),
      visibility: z.nativeEnum(BlogVisibility).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { slug, ...updates } = input
      const blog = await BlogService.updateBySlug(slug, ctx.user.userId, updates)

      return {
        success: true,
        message: 'Blog updated successfully',
        data: blog,
      }
    }),

  /**
   * 切换博客可见性（需要认证）
   */
  toggleBlogVisibility: protectedProcedure
    .input(z.object({
      blogId: z.string().min(1, 'Blog ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      const blog = await BlogService.toggleVisibility(input.blogId, ctx.user.userId)

      return {
        success: true,
        message: 'Blog visibility toggled successfully',
        data: blog,
      }
    }),

  /**
   * 删除博客（需要认证）
   */
  deleteBlog: protectedProcedure
    .input(z.object({
      blogId: z.string().min(1, 'Blog ID is required'),
    }))
    .mutation(async ({ input, ctx }) => {
      await BlogService.delete(input.blogId, ctx.user.userId)

      return {
        success: true,
        message: 'Blog deleted successfully',
      }
    }),

  /**
   * 获取我的博客列表（需要认证）
   */
  getMyBlogs: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const page = input?.page || 1
      const limit = input?.limit || 20
      return await BlogService.findByAuthorId(ctx.user.userId, page, limit)
    }),

  /**
   * 获取我的博客统计信息（需要认证）
   */
  getMyBlogStats: protectedProcedure
    .query(async ({ ctx }) => {
      return await BlogService.getStatsByAuthorId(ctx.user.userId)
    }),

  /**
   * 根据ID获取博客（需要认证）
   */
  getBlogById: protectedProcedure
    .input(z.object({
      blogId: z.string().min(1, 'Blog ID is required'),
    }))
    .query(async ({ input, ctx }) => {
      const blog = await BlogService.findById(input.blogId, ctx.user.userId)
      if (!blog) {
        throw new Error('Blog not found')
      }
      return blog
    }),

  /**
   * 根据 slug 获取博客（需要认证）
   */
  getBlogBySlug: protectedProcedure
    .input(z.object({
      slug: z.string().min(1, 'Slug is required'),
    }))
    .query(async ({ input, ctx }) => {
      const blog = await BlogService.findBySlug(input.slug, ctx.user.userId)
      if (!blog) {
        throw new Error('Blog not found')
      }
      return blog
    }),

  /**
   * 搜索公开博客（需要认证）
   */
  searchPublicBlogs: protectedProcedure
    .input(z.object({
      query: z.string().min(1, 'Search query is required'),
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    }))
    .query(async ({ input }) => {
      return await BlogService.searchPublicBlogs(input.query, input.page, input.limit)
    }),

  /**
   * 获取所有公开博客（需要认证）
   */
  getPublicBlogs: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
      excludeAdmin: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page || 1
      const limit = input?.limit || 20
      const excludeAdmin = input?.excludeAdmin || false
      return await BlogService.findAllPublic(page, limit, excludeAdmin)
    }),

  /**
   * 获取置顶的博客列表（公开接口，无需登录）
   */
  getPinnedBlogs: publicProcedure.query(async () => {
    return await BlogService.findPinned()
  }),

  /**
   * 管理员：查看所有博客（包括public和private）
   */
  adminGetAllBlogs: adminProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(100).default(20),
    }).optional())
    .query(async ({ input }) => {
      const page = input?.page || 1
      const limit = input?.limit || 20
      return await BlogService.findAll(page, limit)
    }),

  /**
   * 管理员：设置博客置顶状态
   */
  adminSetBlogPinned: adminProcedure
    .input(z.object({
      blogId: z.string().min(1, 'Blog ID is required'),
      pinned: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const blog = await BlogService.setPinned(input.blogId, input.pinned)
      return {
        success: true,
        message: `Blog ${input.pinned ? 'pinned' : 'unpinned'} successfully`,
        data: blog,
      }
    }),

  /**
   * 健康检查
   */
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }),
})

export type AppRouter = typeof appRouter
