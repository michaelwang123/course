import React from 'react';
import type { Quote } from '../types/quote';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';

interface CopyButtonProps {
  quote: Quote;
  disabled?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ quote, disabled }) => {
  const { copy, status, isSupported } = useCopyToClipboard();

  const handleClick = () => {
    copy(quote);
  };

  const isDisabled = disabled || !isSupported;

  const getButtonText = (): string => {
    switch (status) {
      case 'success':
        return '已复制 ✓';
      case 'error':
        return '复制失败';
      case 'unsupported':
        return '复制不可用';
      default:
        return '复制';
    }
  };

  const getButtonClassName = (): string => {
    const base =
      'px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2';

    if (!isSupported) {
      return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    if (status === 'success') {
      return `${base} bg-green-600 text-white`;
    }

    if (status === 'error') {
      return `${base} bg-red-600 text-white`;
    }

    if (disabled) {
      return `${base} bg-gray-300 text-gray-500 cursor-not-allowed`;
    }

    return `${base} bg-amber-700 text-white hover:bg-amber-800`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      aria-label="复制金句到剪贴板"
      className={getButtonClassName()}
      title={!isSupported ? '当前浏览器不支持剪贴板功能' : undefined}
    >
      {getButtonText()}
    </button>
  );
};

export default CopyButton;
