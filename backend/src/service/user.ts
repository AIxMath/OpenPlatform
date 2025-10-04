import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'
import { db } from '../database.js'

const SALT_ROUNDS = 10

/**
 * 用户角色
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * 用户接口定义
 */
export interface User {
  _id?: ObjectId
  username: string
  email: string
  password: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户注册输入
 */
export interface RegisterInput {
  username: string
  email: string
  password: string
}

/**
 * 用户响应（不包含密码）
 */
export interface UserResponse {
  _id: ObjectId
  username: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * 用户集合
 */
const users = db.collection<User>('users')

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 移除密码字段
   */
  private static removePassword(user: User): UserResponse {
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as UserResponse
  }

  /**
   * 用户注册
   */
  static async register(input: RegisterInput): Promise<UserResponse> {
    // 检查用户名是否已存在（大小写不敏感）
    const existingUsername = await users.findOne({
      username: { $regex: `^${input.username}$`, $options: 'i' },
    })
    if (existingUsername) {
      throw new Error('Username already exists')
    }

    // 检查邮箱是否已存在
    const existingEmail = await users.findOne({ email: input.email })
    if (existingEmail) {
      throw new Error('Email already exists')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS)

    // 创建用户（默认角色为普通用户）
    const now = new Date()
    const user: User = {
      username: input.username,
      email: input.email,
      password: hashedPassword,
      role: UserRole.USER,
      createdAt: now,
      updatedAt: now,
    }

    const result = await users.insertOne(user)
    const createdUser = await users.findOne({ _id: result.insertedId })

    if (!createdUser) {
      throw new Error('Failed to create user')
    }

    return this.removePassword(createdUser)
  }

  /**
   * 用户登录
   */
  static async login(usernameOrEmail: string, password: string): Promise<UserResponse> {
    // 查找用户（支持用户名或邮箱登录）
    const user = await users.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    return this.removePassword(user)
  }

  /**
   * 根据ID查找用户
   */
  static async findById(id: string): Promise<UserResponse | null> {
    const user = await users.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return null
    }
    return this.removePassword(user)
  }

  /**
   * 根据用户名查找用户
   */
  static async findByUsername(username: string): Promise<UserResponse | null> {
    const user = await users.findOne({ username })
    if (!user) {
      return null
    }
    return this.removePassword(user)
  }

  /**
   * 根据邮箱查找用户
   */
  static async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await users.findOne({ email })
    if (!user) {
      return null
    }
    return this.removePassword(user)
  }

  /**
   * 获取所有用户（分页）
   */
  static async findAll(page: number = 1, limit: number = 10): Promise<{
    users: UserResponse[]
    total: number
    page: number
    totalPages: number
  }> {
    const skip = (page - 1) * limit
    const total = await users.countDocuments()
    const userList = await users
      .find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray()

    return {
      users: userList.map(user => this.removePassword(user)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * 更新用户信息
   */
  static async update(
    id: string,
    updates: Partial<Omit<User, '_id' | 'password' | 'createdAt'>>,
  ): Promise<UserResponse> {
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' },
    )

    if (!result) {
      throw new Error('User not found')
    }

    return this.removePassword(result)
  }

  /**
   * 修改密码
   */
  static async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await users.findOne({ _id: new ObjectId(id) })
    if (!user) {
      throw new Error('User not found')
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid old password')
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await users.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    )
  }

  /**
   * 删除用户
   */
  static async delete(id: string): Promise<void> {
    const result = await users.deleteOne({ _id: new ObjectId(id) })
    if (result.deletedCount === 0) {
      throw new Error('User not found')
    }
  }

  /**
   * 创建索引（应用启动时调用）
   */
  static async createIndexes(): Promise<void> {
    await users.createIndex({ username: 1 }, { unique: true })
    await users.createIndex({ email: 1 }, { unique: true })
  }
}
