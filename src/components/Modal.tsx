import type { ReactNode } from 'react';

/** 通用模态窗：点击遮罩关闭。 */
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-96 max-w-full rounded-2xl bg-bg p-5 shadow-2xl ring-1 ring-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-semibold text-fg">{title}</div>
          <button
            onClick={onClose}
            className="text-muted hover:text-fg"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
