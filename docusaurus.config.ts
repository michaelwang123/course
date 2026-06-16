import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '高质量人生',
  tagline: '技术成长 × 人生修炼',
  url: 'https://michaelwang123.github.io',
  baseUrl: '/course/',

  onBrokenLinks: 'throw',

  markdown: {
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  headTags: [
    { tagName: 'meta', attributes: { name: 'theme-color', content: '#030712' } },
  ],

  themes: [
    ['@easyops-cn/docusaurus-search-local', {
      indexDocs: true,
      indexBlog: false,
      indexPages: true,
      language: ['zh', 'en'],
      hashed: true,
      highlightSearchTermsOnTargetPage: true,
      searchResultLimits: 20,
      searchBarShortcutHint: false,
      docsRouteBasePath: '/',
    }],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          showLastUpdateTime: false,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      title: '高质量人生',
      items: [
        { to: '/', label: '首页', position: 'left' },
        {
          type: 'dropdown',
          label: '人生成长',
          position: 'left',
          items: [
            { to: '/life-wish/', label: '🎯 人生愿望' },
            { to: '/money-wisdom/', label: '💰 财务认知' },
            { to: '/mental-health/', label: '🧠 心理健康' },
            { to: '/relationship/', label: '💑 关系与社交' },
            { to: '/habits/', label: '✅ 好习惯养成' },
            { to: '/book-read/', label: '📚 智慧书籍' },
            { to: '/basketball-skill/', label: '🏀 篮球训练' },
          ],
        },
        {
          type: 'dropdown',
          label: '技术学习',
          position: 'left',
          items: [
            { to: '/ragflow/', label: 'RAGFlow 教程' },
          ],
        },
      ],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    docs: {
      sidebar: { hideable: true },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
