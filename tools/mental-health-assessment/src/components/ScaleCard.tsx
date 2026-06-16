interface ScaleCardProps {
  name: string;
  description: string;
  itemCount: number;
  estimatedMinutes: number;
  onClick: () => void;
}

export function ScaleCard({
  name,
  description,
  itemCount,
  estimatedMinutes,
  onClick,
}: ScaleCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:border-green-300 hover:shadow-md transition-all"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {itemCount}题
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          约{estimatedMinutes}分钟
        </span>
      </div>
    </button>
  );
}
