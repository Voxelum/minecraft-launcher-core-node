import { defineConfig } from 'vitepress'
import sidebar from '../sidebar.json'

export default defineConfig({
  title: "Minecraft Launcher Core",
  cleanUrls: true,
  base: '/en/core/',
  themeConfig: {
    sidebar,
    outline: {
      level: [2, 3]
    }
  },
})
