import React from 'react';

interface RefreshButtonProps {
  onRefresh: () => void;
  disabled: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = React.memo(({ onRefresh, disabled }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onRefresh}
        disabled={disabled}
        className={`px-5 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
          disabled
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-amber-700 text-white hover:bg-amber-800 active:bg-amber-900'
        }`}
      >
        换一句
      </button>
      {disabled && (
        <span className="text-xs text-gray-400">已无更多金句</span>
      )}
    </div>
  );
});

RefreshButton.displayName = 'RefreshButton';

export default RefreshButton;
