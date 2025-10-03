import fs from 'node:fs'
import { basename, resolve } from 'node:path'

export default {
  paths() {
    return fs
      .readdirSync(resolve(import.meta.dirname, 'pages'))
      .map((page) => {
        return { params: { page: basename(page, '.vue') } }
      })
  },
}
