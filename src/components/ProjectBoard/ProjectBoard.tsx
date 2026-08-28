import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { useRealtime, useRealtimeChannel } from '../../realtime/react-context';
import { RealtimeMessage } from '../../realtime/types';
import {
  CardItem,
  ViewState,
  SEED_CARDS,
  CARDS_KEY,
  VIEW_KEY,
  OWNERS_KEY,
  CSV_COLS,
  STATUSES,
  allVersions,
  nowISO,
  StatusKey,
  Priority,
  ItemType,
} from './types';
import { BoardControls } from './BoardControls';
import { CardView } from './CardView';
import { TableView } from './TableView';
import { BoardModals } from './BoardModals';
import { RealtimeStatusBar } from './RealtimeStatusBar';
import './project-board.css';

const DEFAULT_VIEW_STATE: ViewState = {
  view: 'card',
  primary: 'priority',
  subGroup: true,
  versionGroup: false,
  tablePrimary: 'none',
  tableSubGroup: false,
  tableVersionGroup: false,
  sortRules: [{ field: 'priority', dir: 'asc' }],
  theme: 'system',
  archiveFilter: 'active',
  showTime: false,
  pageSize: 50,
  page: 1,
  filters: {
    type: 'all',
    priority: ['high', 'med', 'low'],
    status: STATUSES.map((s) => s.key),
    version: ['Unreleased'],
  },
};

export const ProjectBoard: React.FC = () => {
  const { publish } = useRealtime();

  // State
  const [cards, setCards] = useState<CardItem[]>(SEED_CARDS);
  const [owners, setOwners] = useState<string[]>([]);
  const [view, setView] = useState<ViewState>(DEFAULT_VIEW_STATE);
  const [ioStatus, setIoStatus] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Modals & Context Menus
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showOwnersModal, setShowOwnersModal] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<CardItem[] | null>(null);

  const [collapsedCard, setCollapsedCard] = useState<Set<string>>(new Set());
  const [collapsedTable, setCollapsedTable] = useState<Set<string>>(new Set());

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: CardItem;
    field: 'type' | 'priority' | 'status' | 'owner' | 'version';
  } | null>(null);

  const [promptModal, setPromptModal] = useState<{
    title: string;
    message: string;
    defaultValue: string;
    multiline?: boolean;
    onResolve: (val: string | null) => void;
  } | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    danger?: boolean;
    onResolve: (confirmed: boolean) => void;
  } | null>(null);

  // 1. Fetch Board Items from Database API
  const fetchBoardFromDatabase = async () => {
    try {
      const res = await fetch('/api/trackers');
      if (res.ok) {
        const data: CardItem[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCards(data);
          try {
            localStorage.setItem(CARDS_KEY, JSON.stringify(data));
          } catch {}
          return;
        }
      }
    } catch (e) {
      console.warn('Database fetch fallback to local data:', e);
    }
  };

  // 2. Fetch Users to populate default owners list
  const fetchOwnersFromUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const users = await res.json();
        if (Array.isArray(users)) {
          const names = users
            .map((u: { name?: string; email?: string }) => u.name || u.email)
            .filter((name): name is string => Boolean(name));
          const merged = Array.from(new Set([...names, ...owners, 'Tim IT Dominus4d', 'Tim IT Live Chat', 'Tim Nova']));
          setOwners(merged);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchBoardFromDatabase();
    fetchOwnersFromUsers();

    try {
      const savedViewStr = localStorage.getItem(VIEW_KEY);
      if (savedViewStr) {
        const parsed = JSON.parse(savedViewStr);
        setView((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const persistView = (updatedView: ViewState) => {
    setView(updatedView);
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(updatedView));
    } catch (e) {
      console.error(e);
    }
  };

  // Theme effect
  useEffect(() => {
    let effective = view.theme;
    if (effective === 'system') {
      effective =
        window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark';
    }
    document.body.setAttribute('data-theme', effective === 'light' ? 'light' : 'dark');
    persistView(view);
  }, [view.theme]);

  // Reconcile versions filter when cards update
  useEffect(() => {
    const versions = allVersions(cards);
    setView((prev) => {
      const currentVersions = prev.filters.version;
      const merged = Array.from(new Set([...currentVersions, ...versions])).filter((v) =>
        versions.includes(v)
      );
      if (merged.length !== currentVersions.length) {
        return { ...prev, filters: { ...prev.filters, version: merged } };
      }
      return prev;
    });
  }, [cards]);

  // Real-time synchronization subscriber
  const handleRealtimeMessage = useCallback(
    (message: RealtimeMessage) => {
      setLastSyncTime(new Date().toLocaleTimeString());
      if (message.event === 'BOARD_UPDATED' && message.payload) {
        const payloadCards = message.payload as CardItem[];
        setCards(payloadCards);
      } else if (message.event === 'ITEM_SAVED' && message.payload) {
        const item = message.payload as CardItem;
        setCards((prev) => {
          const exists = prev.some((c) => c.id === item.id);
          return exists ? prev.map((c) => (c.id === item.id ? item : c)) : [item, ...prev];
        });
      } else if (message.event === 'ITEM_DELETED' && message.payload) {
        const { id } = message.payload as { id: string };
        setCards((prev) => prev.filter((c) => c.id !== id));
      }
    },
    []
  );

  useRealtimeChannel('project:trackers', handleRealtimeMessage);

  // Filtering
  const passesFilter = (c: CardItem) => {
    if (view.archiveFilter === 'active' && c.archived) return false;
    if (view.archiveFilter === 'archived' && !c.archived) return false;
    if (view.filters.type !== 'all' && c.type !== view.filters.type) return false;
    if (!view.filters.priority.includes(c.priority)) return false;
    if (!view.filters.status.includes(c.status)) return false;
    const v = c.version || 'Unreleased';
    if (!view.filters.version.includes(v)) return false;
    return true;
  };

  const filteredCards = cards.filter(passesFilter);

  // Card & Table Reorder & Assign
  const handleReorderAndAssign = async (
    sourceId: string,
    targetPath: string[],
    leafKey: string,
    leafList: CardItem[]
  ) => {
    const updated = cards.map((c) => ({ ...c }));
    const source = updated.find((x) => x.id === sourceId);
    if (!source) return;

    targetPath.forEach((seg) => {
      const [dim, val] = seg.split(':');
      if (dim === 'priority') source.priority = val as Priority;
      if (dim === 'status') source.status = val as StatusKey;
    });

    const ids = leafList.map((c) => c.id).filter((x) => x !== sourceId);
    ids.push(sourceId);

    ids.forEach((cid, i) => {
      const item = updated.find((x) => x.id === cid);
      if (item) item.order = i * 10;
    });

    source.updatedAt = nowISO();
    setCards(updated);

    // Save item update to Database API
    try {
      await fetch(`/api/trackers/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...source, clientUpdatedAt: source.updatedAt }),
      });
    } catch {}

    await publish('project:trackers', 'BOARD_UPDATED', updated);
  };

  // Card Operations with Database Persistence & Concurrency Control
  const handleSaveCard = async (patch: Partial<CardItem>) => {
    if (isAddingNew) {
      const nextNum =
        1 +
        cards.reduce((m, c) => {
          const n = parseInt((c.id || 'F-0').split('-')[1], 10);
          return isNaN(n) ? m : Math.max(m, n);
        }, 0);
      const prefix = patch.type === 'bug' ? 'B' : 'F';
      const id = `${prefix}-${String(nextNum).padStart(3, '0')}`;

      const newCard: CardItem = {
        id,
        type: patch.type || 'feature',
        title: patch.title || 'Untitled',
        desc: patch.desc || '',
        priority: patch.priority || 'high',
        status: patch.status || 'planned',
        owner: patch.owner || '',
        blocked: patch.blocked || '',
        version: patch.version || '',
        notes: patch.notes || '',
        archived: false,
        order: 0,
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      setEditingCardId(null);
      setIsAddingNew(false);

      // Save to DB
      try {
        const res = await fetch('/api/trackers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCard),
        });
        if (res.ok) {
          const created: CardItem = await res.json();
          setCards((prev) => [created, ...prev]);
          await publish('project:trackers', 'ITEM_SAVED', created);
          return;
        }
      } catch {}

      setCards((prev) => [newCard, ...prev]);
      await publish('project:trackers', 'ITEM_SAVED', newCard);
    } else {
      const targetId = editingCardId || patch.id;
      if (!targetId) return;

      const existing = cards.find((c) => c.id === targetId);
      if (!existing) return;

      const updatedCard: CardItem = {
        ...existing,
        ...patch,
        updatedAt: nowISO(),
      };

      setEditingCardId(null);
      setIsAddingNew(false);

      // Save to DB with Optimistic Concurrency Control (OCC)
      try {
        const res = await fetch(`/api/trackers/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...updatedCard, clientUpdatedAt: existing.updatedAt }),
        });

        if (res.status === 409) {
          // Concurrency Conflict detected!
          const conflictData = (await res.json()) as { currentItem?: CardItem };
          setIoStatus('⚠️ Edit conflict! Another user updated this item.');
          setTimeout(() => setIoStatus(''), 5000);
          if (conflictData.currentItem) {
            const currentItem = conflictData.currentItem;
            setCards((prev) => prev.map((c) => (c.id === targetId ? currentItem : c)));
          }
          return;
        }

        if (res.ok) {
          const saved: CardItem = await res.json();
          setCards((prev) => prev.map((c) => (c.id === targetId ? saved : c)));
          await publish('project:trackers', 'ITEM_SAVED', saved);
          return;
        }
      } catch {}

      setCards((prev) => prev.map((c) => (c.id === targetId ? updatedCard : c)));
      await publish('project:trackers', 'ITEM_SAVED', updatedCard);
    }
  };

  const handleArchiveCard = async (cardId: string) => {
    const item = cards.find((c) => c.id === cardId);
    if (!item) return;
    const updated = { ...item, archived: true, updatedAt: nowISO() };
    setEditingCardId(null);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));

    try {
      await fetch(`/api/trackers/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    await publish('project:trackers', 'ITEM_SAVED', updated);
  };

  const handleRestoreCard = async (cardId: string) => {
    const item = cards.find((c) => c.id === cardId);
    if (!item) return;
    const updated = { ...item, archived: false, updatedAt: nowISO() };
    setEditingCardId(null);
    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));

    try {
      await fetch(`/api/trackers/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    await publish('project:trackers', 'ITEM_SAVED', updated);
  };

  const handleDeleteCard = async (cardId: string) => {
    const confirmed = await showConfirmModal(
      'Delete Item',
      `Are you sure you want to permanently delete item ${cardId}?`,
      true
    );
    if (!confirmed) return;

    setEditingCardId(null);
    setCards((prev) => prev.filter((c) => c.id !== cardId));

    try {
      await fetch(`/api/trackers/${cardId}`, { method: 'DELETE' });
    } catch {}

    await publish('project:trackers', 'ITEM_DELETED', { id: cardId });
  };

  const handleUpdateCardStatus = async (cardId: string, newStatus: StatusKey) => {
    const target = cards.find((c) => c.id === cardId);
    if (!target) return;

    if (newStatus === 'blocked') {
      setEditingCardId(cardId);
      return;
    }
    if (newStatus === 'done' && !target.version) {
      setEditingCardId(cardId);
      return;
    }

    const updated = {
      ...target,
      status: newStatus,
      blocked: (newStatus as string) !== 'blocked' ? '' : target.blocked,
      updatedAt: nowISO(),
    };

    setCards((prev) => prev.map((c) => (c.id === cardId ? updated : c)));

    try {
      await fetch(`/api/trackers/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {}

    await publish('project:trackers', 'ITEM_SAVED', updated);
  };

  // Owners Handlers
  const handleAddOwner = (name: string) => {
    if (!owners.includes(name)) {
      setOwners((prev) => [...prev, name]);
    }
  };

  const handleRemoveOwner = (name: string) => {
    setOwners((prev) => prev.filter((o) => o !== name));
  };

  // Custom Dialog Helpers
  const showPromptModal = (
    title: string,
    message: string,
    defaultValue: string = '',
    multiline: boolean = false
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptModal({
        title,
        message,
        defaultValue,
        multiline,
        onResolve: (val) => {
          setPromptModal(null);
          resolve(val);
        },
      });
    });
  };

  const showConfirmModal = (
    title: string,
    message: string,
    danger: boolean = false
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        title,
        message,
        danger,
        onResolve: (confirmed) => {
          setConfirmModal(null);
          resolve(confirmed);
        },
      });
    });
  };

  // Import / Export Handlers
  const handleDownloadTemplateCSV = () => {
    const csvStr = CSV_COLS.join(',') + '\n';
    downloadBlob(csvStr, 'project-board-template.csv', 'text/csv');
  };

  const handleDownloadExampleCSV = () => {
    const csvStr = Papa.unparse(SEED_CARDS, { columns: CSV_COLS });
    downloadBlob(csvStr, 'project-board-example.csv', 'text/csv');
  };

  const handleDownloadTemplateJSON = () => {
    const jsonStr = JSON.stringify(
      [
        {
          id: 'F-001',
          type: 'feature',
          title: 'Example task',
          desc: '',
          priority: 'high',
          status: 'planned',
          owner: '',
          blocked: '',
          version: '',
          notes: '',
          archived: false,
          order: 0,
        },
      ],
      null,
      2
    );
    downloadBlob(jsonStr, 'project-board-template.json', 'application/json');
  };

  const handleDownloadExampleJSON = () => {
    const jsonStr = JSON.stringify(SEED_CARDS, null, 2);
    downloadBlob(jsonStr, 'project-board-example.json', 'application/json');
  };

  const handleExportCSV = () => {
    const csvStr = Papa.unparse(cards, { columns: CSV_COLS });
    downloadBlob(csvStr, `project-board-export-${Date.now()}.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(cards, null, 2);
    downloadBlob(jsonStr, `project-board-export-${Date.now()}.json`, 'application/json');
  };

  const downloadBlob = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            setImportPreviewData(parsed as CardItem[]);
          }
        } else {
          Papa.parse<CardItem>(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                const cleaned = results.data.map((row, i) => ({
                  id: row.id || `F-${String(100 + i).padStart(3, '0')}`,
                  type: (row.type as ItemType) || 'feature',
                  title: row.title || 'Untitled',
                  desc: row.desc || '',
                  priority: (row.priority as Priority) || 'high',
                  status: (row.status as StatusKey) || 'planned',
                  owner: row.owner || '',
                  blocked: row.blocked || '',
                  version: row.version || '',
                  notes: row.notes || '',
                  archived: String(row.archived) === 'true',
                  order: Number(row.order) || i * 10,
                  createdAt: row.createdAt || nowISO(),
                  updatedAt: row.updatedAt || nowISO(),
                }));
                setImportPreviewData(cleaned);
              }
            },
          });
        }
      } catch (err) {
        console.error('Import parse error:', err);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async (importedItems: CardItem[]) => {
    setImportPreviewData(null);
    setCards(importedItems);

    try {
      await fetch('/api/trackers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importedItems),
      });
    } catch {}

    await publish('project:trackers', 'BOARD_UPDATED', importedItems);
    setIoStatus(`Imported ${importedItems.length} items to database successfully`);
    setTimeout(() => setIoStatus(''), 4000);
  };

  const editingCard = editingCardId ? cards.find((c) => c.id === editingCardId) || null : null;

  return (
    <div className="project-board-app">
      <BoardControls
        view={view}
        setView={setView}
        cards={cards}
        filteredCount={filteredCards.length}
        totalCount={cards.length}
        ioStatus={ioStatus}
        onOpenAddModal={() => {
          setIsAddingNew(true);
          setEditingCardId(null);
        }}
        onOpenOwnersModal={() => setShowOwnersModal(true)}
        onExpandAll={() => {
          setCollapsedCard(new Set());
          setCollapsedTable(new Set());
        }}
        onCollapseAll={() => {
          setCollapsedCard(new Set(['all']));
          setCollapsedTable(new Set(['all']));
        }}
        onDownloadTemplateCSV={handleDownloadTemplateCSV}
        onDownloadExampleCSV={handleDownloadExampleCSV}
        onDownloadTemplateJSON={handleDownloadTemplateJSON}
        onDownloadExampleJSON={handleDownloadExampleJSON}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onImportFileSelected={handleImportFileSelected}
      />

      {view.view === 'card' ? (
        <CardView
          cards={filteredCards}
          allCards={cards}
          view={view}
          onEditCard={(id) => {
            setEditingCardId(id);
            setIsAddingNew(false);
          }}
          onUpdateCardStatus={handleUpdateCardStatus}
          onReorderAndAssign={handleReorderAndAssign}
          onContextMenu={(e, item, field) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item, field });
          }}
          collapsedCard={collapsedCard}
          setCollapsedCard={setCollapsedCard}
        />
      ) : (
        <TableView
          cards={filteredCards}
          allCards={cards}
          view={view}
          setView={setView}
          onEditCard={(id) => {
            setEditingCardId(id);
            setIsAddingNew(false);
          }}
          onArchiveToggle={(id) => {
            const item = cards.find((c) => c.id === id);
            if (item) {
              if (item.archived) handleRestoreCard(id);
              else handleArchiveCard(id);
            }
          }}
          onDeleteCard={handleDeleteCard}
          onReorderAndAssign={handleReorderAndAssign}
          onContextMenu={(e, item, field) => {
            e.preventDefault();
            setContextMenu({ x: e.clientX, y: e.clientY, item, field });
          }}
          collapsedTable={collapsedTable}
          setCollapsedTable={setCollapsedTable}
        />
      )}

      <BoardModals
        editingCard={editingCard}
        isAddingNew={isAddingNew}
        onCloseEditModal={() => {
          setEditingCardId(null);
          setIsAddingNew(false);
        }}
        onSaveCard={handleSaveCard}
        onArchiveCard={handleArchiveCard}
        onRestoreCard={handleRestoreCard}
        onDeleteCard={handleDeleteCard}
        showOwnersModal={showOwnersModal}
        owners={owners}
        onCloseOwnersModal={() => setShowOwnersModal(false)}
        onAddOwner={handleAddOwner}
        onRemoveOwner={handleRemoveOwner}
        importPreviewData={importPreviewData}
        onCloseImportPreview={() => setImportPreviewData(null)}
        onConfirmImport={handleConfirmImport}
        contextMenu={contextMenu}
        onCloseContextMenu={() => setContextMenu(null)}
        promptModal={promptModal}
        confirmModal={confirmModal}
        onShowPrompt={showPromptModal}
        onShowConfirm={showConfirmModal}
      />

      <RealtimeStatusBar lastEventTime={lastSyncTime} />
    </div>
  );
};
