import { db } from '../database.js';
import { ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 文件接口定义
 */
export interface FileDocument {
  _id?: ObjectId;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  userId: string;
  createdAt: Date;
}

/**
 * 文件上传输入
 */
export interface UploadFileInput {
  filename: string;
  mimetype: string;
  size: number;
  data: Buffer;
  userId: string;
}

/**
 * 文件响应
 */
export interface FileResponse {
  _id: ObjectId;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  createdAt: Date;
}

/**
 * 文件集合
 */
const files = db.collection<FileDocument>('files');

/**
 * 文件服务类
 */
export class FileService {
  /**
   * 初始化上传目录
   */
  static async initUploadDir(): Promise<void> {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      console.log(`Upload directory created: ${UPLOAD_DIR}`);
    }
  }

  /**
   * 生成唯一文件名
   */
  private static generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  /**
   * 验证文件大小
   */
  private static validateFileSize(size: number): void {
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    if (size === 0) {
      throw new Error('File is empty');
    }
  }

  /**
   * 上传文件
   */
  static async upload(input: UploadFileInput): Promise<FileResponse> {
    // 验证文件大小
    this.validateFileSize(input.size);

    // 确保上传目录存在
    await this.initUploadDir();

    // 生成唯一文件名
    const filename = this.generateUniqueFilename(input.filename);
    const filePath = path.join(UPLOAD_DIR, filename);

    // 保存文件到磁盘
    await fs.writeFile(filePath, input.data);

    // 保存文件元数据到数据库
    const now = new Date();
    const fileDoc: FileDocument = {
      filename,
      originalName: input.filename,
      mimetype: input.mimetype,
      size: input.size,
      path: filePath,
      userId: input.userId,
      createdAt: now,
    };

    const result = await files.insertOne(fileDoc);
    const createdFile = await files.findOne({ _id: result.insertedId });

    if (!createdFile) {
      // 如果数据库插入失败，删除已上传的文件
      await fs.unlink(filePath).catch(() => {});
      throw new Error('Failed to create file record');
    }

    return this.toFileResponse(createdFile);
  }

  /**
   * 转换为文件响应格式
   */
  private static toFileResponse(file: FileDocument): FileResponse {
    return {
      _id: file._id!,
      filename: file.filename,
      originalName: file.originalName,
      mimetype: file.mimetype,
      size: file.size,
      url: `/files/${file.filename}`,
      createdAt: file.createdAt,
    };
  }

  /**
   * 根据ID获取文件信息
   */
  static async findById(id: string): Promise<FileResponse | null> {
    const file = await files.findOne({ _id: new ObjectId(id) });
    if (!file) {
      return null;
    }
    return this.toFileResponse(file);
  }

  /**
   * 根据文件名获取文件信息
   */
  static async findByFilename(filename: string): Promise<FileDocument | null> {
    return await files.findOne({ filename });
  }

  /**
   * 获取用户的所有文件
   */
  static async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    files: FileResponse[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const total = await files.countDocuments({ userId });
    const fileList = await files
      .find({ userId })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    return {
      files: fileList.map((file) => this.toFileResponse(file)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 删除文件
   */
  static async delete(id: string, userId: string): Promise<void> {
    const file = await files.findOne({ _id: new ObjectId(id) });

    if (!file) {
      throw new Error('File not found');
    }

    // 验证文件所有者
    if (file.userId !== userId) {
      throw new Error('You do not have permission to delete this file');
    }

    // 从磁盘删除文件
    try {
      await fs.unlink(file.path);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }

    // 从数据库删除记录
    await files.deleteOne({ _id: new ObjectId(id) });
  }

  /**
   * 获取文件内容
   */
  static async getFileContent(filename: string): Promise<{ data: Buffer; file: FileDocument }> {
    const file = await this.findByFilename(filename);
    if (!file) {
      throw new Error('File not found');
    }

    try {
      const data = await fs.readFile(file.path);
      return { data, file };
    } catch (error) {
      throw new Error('Error reading file');
    }
  }

  /**
   * 创建索引
   */
  static async createIndexes(): Promise<void> {
    await files.createIndex({ userId: 1, createdAt: -1 });
    await files.createIndex({ filename: 1 }, { unique: true });
  }
}

