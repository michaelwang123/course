export function PrivacyBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-full border border-green-200 dark:border-green-800">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-3.5 h-3.5"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <span>所有照片仅在本地处理，不会上传到服务器</span>
    </div>
  );
}
