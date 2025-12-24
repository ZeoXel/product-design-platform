import type { ImageVersion, CostBreakdown } from '../types';

export interface HistoryItem {
  id: string;
  timestamp: Date;
  instruction: string;
  referenceUrl: string;
  generatedUrl: string;
  versions: ImageVersion[];
  versionsCount: number;
  status: 'success' | 'failed';
  cost: number;
  costBreakdown?: CostBreakdown;
}

const STORAGE_KEY = 'design_history';

function loadHistory(): HistoryItem[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp),
      versions: item.versions?.map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp)
      })) || []
    }));
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

export function getHistoryItems(): HistoryItem[] {
  return loadHistory().sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function addHistoryItem(item: Omit<HistoryItem, 'id'>): HistoryItem {
  const items = loadHistory();
  const newItem: HistoryItem = {
    ...item,
    id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  items.unshift(newItem);
  saveHistory(items);
  return newItem;
}

export function getHistoryItem(id: string): HistoryItem | null {
  const items = loadHistory();
  return items.find(item => item.id === id) || null;
}

export function deleteHistoryItem(id: string): void {
  const items = loadHistory();
  const filtered = items.filter(item => item.id !== id);
  saveHistory(filtered);
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getHistoryStats() {
  const items = loadHistory();
  return {
    total: items.length,
    success: items.filter(h => h.status === 'success').length,
    failed: items.filter(h => h.status === 'failed').length,
    totalCost: items.reduce((sum, h) => sum + h.cost, 0),
  };
}

export function filterHistoryByTime(filter: 'today' | 'week' | 'month' | 'all'): HistoryItem[] {
  const items = loadHistory();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter(item => {
    const itemDate = new Date(item.timestamp);
    switch (filter) {
      case 'today':
        return itemDate >= today;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return itemDate >= monthAgo;
      case 'all':
      default:
        return true;
    }
  }).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function searchHistory(query: string): HistoryItem[] {
  if (!query.trim()) return getHistoryItems();

  const items = loadHistory();
  const lowerQuery = query.toLowerCase();

  return items.filter(item =>
    item.instruction.toLowerCase().includes(lowerQuery)
  ).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
