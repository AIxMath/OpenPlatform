import fs from 'node:fs'
import { basename, resolve } from 'node:path'

export default {
  paths() {
    const hiddenPages = new Set(['login', 'register'])

    return fs
      .readdirSync(resolve(import.meta.dirname, 'pages'))
      .filter(page => !hiddenPages.has(basename(page, '.vue')))
      .map((page) => {
        return { params: { page: basename(page, '.vue') } }
      })
  },
}
