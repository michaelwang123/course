import { ComponentType, LazyExoticComponent } from 'react';

export interface ToolPlugin {
  /** 唯一标识符 */
  id: string;
  /** 工具显示名称 */
  name: string;
  /** 图标组件 */
  icon: ComponentType<{ className?: string }>;
  /** 简要描述 */
  description: string;
  /** 路由路径（如 '/id-photo'） */
  route: string;
  /** React 懒加载组件引用 */
  component: LazyExoticComponent<ComponentType>;
}
