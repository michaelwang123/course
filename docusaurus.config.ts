import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '技术教程站',
  tagline: '高质量中文技术教程',
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
      title: '技术教程站',
      items: [
        { to: '/', label: '首页', position: 'left' },
        { to: '/ragflow/', label: 'RAGFlow', position: 'left' },
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
