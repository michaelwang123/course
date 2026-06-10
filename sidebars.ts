import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  ragflowSidebar: [
    {
      type: 'doc',
      id: 'ragflow/index',
      label: '介绍',
    },
    {
      type: 'doc',
      id: 'ragflow/architecture',
      label: '架构概览',
    },
    {
      type: 'doc',
      id: 'ragflow/installation',
      label: '安装部署',
    },
    {
      type: 'doc',
      id: 'ragflow/quickstart',
      label: '快速上手',
    },
    {
      type: 'doc',
      id: 'ragflow/advanced',
      label: '进阶功能',
    },
  ],
};

export default sidebars;
