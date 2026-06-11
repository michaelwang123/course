import { Link } from 'react-router-dom';
import type { ToolPlugin } from '../plugins/types';

interface ToolCardProps {
  tool: ToolPlugin;
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Link
      to={tool.route}
      className="group block p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all"
      aria-label={`打开${tool.name}工具`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
          <tool.icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {tool.name}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {tool.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
