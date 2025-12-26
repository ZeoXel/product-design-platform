import { useState, useEffect } from 'react';
import { isApiConfigured } from '../../services/directApi';

interface HeaderProps {
  currentPage: 'workspace' | 'gallery' | 'history';
  onNavigate: (page: 'workspace' | 'gallery' | 'history') => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  const [apiConfigured, setApiConfigured] = useState(false);

  useEffect(() => {
    setApiConfigured(isApiConfigured());
  }, []);

  const navItems = [
    { id: 'workspace' as const, label: '工作台', icon: null },
    { id: 'gallery' as const, label: '图库', icon: null },
    { id: 'history' as const, label: '历史', icon: null },
  ];

  return (
    <header className="h-14 glass-subtle px-6 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-700">AI Design</span>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                px-4 py-1.5 text-sm font-medium rounded-lg transition-all
                ${currentPage === item.id
                  ? 'text-primary-600 bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* API Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded-lg">
          <span className={`w-1.5 h-1.5 rounded-full ${apiConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className={`text-xs ${apiConfigured ? 'text-emerald-600' : 'text-amber-600'}`}>
            {apiConfigured ? 'API 已配置' : 'API 未配置'}
          </span>
        </div>

        {/* User */}
        <button className="w-8 h-8 rounded-xl bg-white/60 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
