import type { ReactNode } from 'react';

/** 通用模态窗：点击遮罩关闭，遮罩淡入 + 内容缩放入场。 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="animate-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="animate-modal w-96 max-w-full rounded-2xl bg-bg p-5 shadow-2xl ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-semibold text-fg">{title}</div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted transition-colors hover:bg-card hover:text-fg"
            aria-label="关闭"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
