import {
  defineConfig,
  presetWind4,
  presetIcons,
  presetTypography,
  presetAttributify,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons(),
    presetTypography(),
    presetAttributify(),
  ],
  transformers: [
    transformerDirectives(),
  ],
})
