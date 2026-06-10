import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '教程站',
  description: '高质量技术教程集合',
  lang: 'zh-CN',
  base: '/course/',

  head: [
    ['meta', { name: 'theme-color', content: '#030712' }]
  ],

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'RAGFlow', link: '/ragflow/' },
    ],

    sidebar: {
      '/ragflow/': [
        {
          text: 'RAGFlow 教程',
          items: [
            { text: '介绍', link: '/ragflow/' },
            { text: '架构概览', link: '/ragflow/architecture' },
            { text: '安装部署', link: '/ragflow/installation' },
            { text: '快速上手', link: '/ragflow/quickstart' },
            { text: '进阶功能', link: '/ragflow/advanced' },
          ]
        }
      ]
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除查询',
            footer: { selectText: '选择', navigateText: '切换' }
          }
        }
      }
    },

    outline: { level: [2, 3], label: '目录' },
    docFooter: { prev: '上一篇', next: '下一篇' },
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换深色模式',
  },

  ignoreDeadLinks: false,

  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === 'UNRESOLVED_IMPORT') {
            throw new Error(warning.message)
          }
          warn(warning)
        }
      }
    }
  }
})
