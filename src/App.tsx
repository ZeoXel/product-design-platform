import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Workspace } from './pages/Workspace';
import { Gallery } from './pages/Gallery';
import { History } from './pages/History';
import './styles/globals.css';
import type { HistoryItem } from './services/historyService';

type Page = 'workspace' | 'gallery' | 'history';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('workspace');
  const [editingHistoryItem, setEditingHistoryItem] = useState<HistoryItem | null>(null);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleEditFromHistory = (item: HistoryItem) => {
    setEditingHistoryItem(item);
    setCurrentPage('workspace');
  };

  // 工作台始终渲染，使用 CSS 控制显示/隐藏以保留状态
  return (
    <>
      {/* 工作台 - 始终挂载，通过 CSS 控制显隐 */}
      <div className={currentPage === 'workspace' ? '' : 'hidden'}>
        <Workspace onNavigate={handleNavigate} historyItem={editingHistoryItem} />
      </div>

      {/* 其他页面 - 条件渲染 */}
      {currentPage !== 'workspace' && (
        <div className="h-screen flex flex-col bg-gray-50">
          <Header currentPage={currentPage} onNavigate={handleNavigate} />
          <main className="flex-1 overflow-hidden">
            {currentPage === 'gallery' && (
              <Gallery onSelect={() => handleNavigate('workspace')} />
            )}
            {currentPage === 'history' && (
              <History onNavigate={handleNavigate} onEdit={handleEditFromHistory} />
            )}
          </main>
        </div>
      )}
    </>
  );
}
