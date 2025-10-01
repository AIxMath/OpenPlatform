import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router"
import { createContext } from "./trpc.js";
import { UserService } from "./service/user.js";
import { FileService } from "./service/file.js";
import { BlogService } from "./service/blog.js";

export * from "./router"

// 初始化数据库索引
async function initializeDatabase() {
  try {
    await UserService.createIndexes();
    await FileService.createIndexes();
    await FileService.initUploadDir();
    await BlogService.createIndexes();
    console.log('Database indexes and upload directory created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

const server = createHTTPServer({
  router: appRouter,
  createContext,
});

// 启动服务器
await initializeDatabase();

server.listen(3000);
console.log('Server listening on http://localhost:3000');
