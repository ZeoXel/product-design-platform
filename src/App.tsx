import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Workspace } from './pages/Workspace';
import { Gallery } from './pages/Gallery';
import { History } from './pages/History';
import './styles/globals.css';

type Page = 'workspace' | 'gallery' | 'history';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('workspace');

  const renderPage = () => {
    switch (currentPage) {
      case 'workspace':
        return <Workspace onNavigate={setCurrentPage} />;
      case 'gallery':
        return <Gallery onSelect={() => setCurrentPage('workspace')} />;
      case 'history':
        return <History />;
      default:
        return <Workspace onNavigate={setCurrentPage} />;
    }
  };

  // 工作台页面自带 Header，其他页面需要外层 Header
  if (currentPage === 'workspace') {
    return renderPage();
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
}
