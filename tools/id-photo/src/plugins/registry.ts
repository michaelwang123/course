import { lazy } from 'react';
import type { ToolPlugin } from './types';
import { CameraIcon } from '../components/icons';

export const tools: ToolPlugin[] = [
  {
    id: 'id-photo',
    name: '证件照处理',
    icon: CameraIcon,
    description: '裁剪标准尺寸、更换底色、批量排版导出',
    route: '/id-photo',
    component: lazy(() => import('../modules/id-photo')),
  },
];
