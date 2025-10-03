import anchorPlugin from 'markdown-it-anchor'
import { MarkdownItAsync } from 'markdown-it-async'
import attrsPlugin from 'markdown-it-attrs'
import mditCjkFriendly from 'markdown-it-cjk-friendly'
import { full as emojiPlugin } from 'markdown-it-emoji'
import { containerPlugin } from './containers'
import { gitHubAlertsPlugin } from './githubAlerts'
import { highlight as createHighlighter } from './highlight'
import { highlightLinePlugin } from './highlightLines'
import { imagePlugin } from './image'
import { lineNumberPlugin } from './lineNumbers'
import { linkPlugin } from './link'
import { preWrapperPlugin } from './preWrapper'
import { restoreEntities } from './restoreEntities'

let md: MarkdownItAsync | undefined
let _disposeHighlighter: (() => void) | undefined

export function disposeMdItInstance() {
  if (md) {
    md = undefined
    _disposeHighlighter?.()
  }
}

/**
 * @experimental
 */
export async function createMarkdownRenderer(
  srcDir: string,
  options: MarkdownOptions = {},
  base = '/',
): Promise<MarkdownItAsync> {
  if (md)
    return md

  const theme = options.theme ?? { light: 'github-light', dark: 'github-dark' }
  const codeCopyButtonTitle = options.codeCopyButtonTitle || 'Copy Code'

  const [highlight, dispose] = await createHighlighter(theme, options)

  _disposeHighlighter = dispose

  md = new MarkdownItAsync({ html: true, linkify: true, highlight, ...options })

  md.linkify.set({ fuzzyLink: false })
  md.use(restoreEntities)

  if (options.preConfig) {
    await options.preConfig(md)
  }

  const slugify = options.anchor?.slugify ?? defaultSlugify

  // custom plugins
  md.use(highlightLinePlugin)
    .use(preWrapperPlugin, {
      codeCopyButtonTitle,
      languageLabel: options.languageLabel,
    })
    .use(containerPlugin, options.container)
    .use(imagePlugin, options.image)
    .use(
      linkPlugin,
      { target: '_blank', rel: 'noreferrer', ...options.externalLinks },
      base,
      slugify,
    )
    .use(lineNumberPlugin, options.lineNumbers)

  const tableOpen = md.renderer.rules.table_open
  md.renderer.rules.table_open = function (tokens, idx, options, env, self) {
    const token = tokens[idx]
    if (token.attrIndex('tabindex') < 0)
      token.attrPush(['tabindex', '0'])
    return tableOpen
      ? tableOpen(tokens, idx, options, env, self)
      : self.renderToken(tokens, idx, options)
  }

  if (options.gfmAlerts !== false) {
    md.use(gitHubAlertsPlugin, options.container)
  }

  // third party plugins
  if (!options.attrs?.disable) {
    md.use(attrsPlugin, options.attrs)
  }
  md.use(emojiPlugin, { ...options.emoji })

  // mdit-vue plugins
  md.use(anchorPlugin, {
    slugify,
    getTokensText: (tokens) => {
      return tokens
        .filter(t => !['html_inline', 'emoji'].includes(t.type))
        .map(t => t.content)
        .join('')
    },
    permalink: (slug, _, state, idx) => {
      const title
        = state.tokens[idx + 1]?.children
          ?.filter(token => ['text', 'code_inline'].includes(token.type))
          .reduce((acc, t) => acc + t.content, '')
          .trim() || ''

      const linkTokens = [
        Object.assign(new state.Token('text', '', 0), { content: ' ' }),
        Object.assign(new state.Token('link_open', 'a', 1), {
          attrs: [
            ['class', 'header-anchor'],
            ['href', `#${slug}`],
            ['aria-label', `Permalink to “${title}”`],
          ],
        }),
        Object.assign(new state.Token('html_inline', '', 0), {
          content: '&#8203;',
          meta: { isPermalinkSymbol: true },
        }),
        new state.Token('link_close', 'a', -1),
      ]

      state.tokens[idx + 1].children?.push(...linkTokens)
    },
    ...options.anchor,
  } as anchorPlugin.AnchorOptions)

  if (options.math) {
    try {
      const mathPlugin = await import('markdown-it-mathjax3')
      md.use(mathPlugin.default ?? mathPlugin, {
        ...(typeof options.math === 'boolean' ? {} : options.math),
      })
      const origMathInline = md.renderer.rules.math_inline!
      md.renderer.rules.math_inline = function (...args) {
        return origMathInline
          .apply(this, args)
          .replace(/^<mjx-container /, '<mjx-container v-pre ')
      }
      const origMathBlock = md.renderer.rules.math_block!
      md.renderer.rules.math_block = function (...args) {
        return origMathBlock
          .apply(this, args)
          .replace(/^<mjx-container /, '<mjx-container v-pre tabindex="0" ')
      }
    }
    catch (error) {
      throw new Error(
        'You need to install `markdown-it-mathjax3` to use math support.',
      )
    }
  }

  if (options.cjkFriendlyEmphasis !== false && options.cjkFriendly !== false) {
    md.use(mditCjkFriendly)
  }

  // apply user config
  if (options.config) {
    await options.config(md)
  }

  return md
}
