import { useEffect, useState } from 'react';

/**
 * chrome.storage 变化时自增的版本号，用作 liveQuery 依赖，
 * 驱动分类规则等非 DB 状态变更后重算（替代各组件复制 storage.onChanged 监听）。
 */
export function useSettingsVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }, []);
  return version;
}
