import React, { useState } from 'react';
import {
  CardItem,
  ViewState,
  STATUSES,
  STATUS_INDEX,
  PRIORITIES,
  PRIORITY_INDEX,
  allVersions,
  fmtDate,
  GroupDim,
  StatusKey,
} from './types';

interface TableViewProps {
  cards: CardItem[];
  allCards: CardItem[];
  view: ViewState;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  onEditCard: (cardId: string) => void;
  onArchiveToggle: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;
  onReorderAndAssign: (sourceId: string, targetPath: string[], leafKey: string, leafList: CardItem[]) => void;
  onContextMenu: (e: React.MouseEvent, item: CardItem, field: 'type' | 'priority' | 'status' | 'owner' | 'version') => void;
  collapsedTable: Set<string>;
  setCollapsedTable: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface TableTreeNode {
  leaf: boolean;
  cards?: CardItem[];
  dim?: GroupDim;
  groups?: Array<{
    dim: GroupDim;
    val: string;
    meta: { label: string; color: string };
    cards: CardItem[];
    child: TableTreeNode;
  }>;
}

const TABLE_COLS = [
  { key: 'title', label: 'Title', sort: 'title' },
  { key: 'type', label: 'Type', sort: 'type' },
  { key: 'priority', label: 'Priority', sort: 'priority' },
  { key: 'status', label: 'Status', sort: 'status' },
  { key: 'owner', label: 'Owner', sort: 'owner' },
  { key: 'version', label: 'Version', sort: 'version' },
];

export const TableView: React.FC<TableViewProps> = ({
  cards,
  allCards,
  view,
  setView,
  onEditCard,
  onArchiveToggle,
  onDeleteCard,
  onReorderAndAssign,
  onContextMenu,
  collapsedTable,
  setCollapsedTable,
}) => {
  const [openReleaseNotes, setOpenReleaseNotes] = useState<Set<string>>(new Set());

  const colCount = 2 + TABLE_COLS.length + (view.showTime ? 2 : 0);

  const toggleNotes = (id: string) => {
    setOpenReleaseNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const compareCards = (a: CardItem, b: CardItem) => {
    for (const rule of view.sortRules) {
      const dirMul = rule.dir === 'desc' ? -1 : 1;
      let d = 0;
      if (rule.field === 'priority') d = PRIORITY_INDEX[a.priority] - PRIORITY_INDEX[b.priority];
      else if (rule.field === 'status') d = STATUS_INDEX[a.status] - STATUS_INDEX[b.status];
      else if (rule.field === 'title') d = (a.title || '').localeCompare(b.title || '');
      else if (rule.field === 'type') d = (a.type || '').localeCompare(b.type || '');
      else if (rule.field === 'owner') d = (a.owner || '').localeCompare(b.owner || '');
      else if (rule.field === 'version') d = (a.version || '').localeCompare(b.version || '');
      
      d = d * dirMul;
      if (d !== 0) return d;
    }
    return a.order - b.order;
  };

  const handleHeaderSort = (fieldKey: string) => {
    const firstRule = view.sortRules[0];
    if (firstRule && firstRule.field === fieldKey) {
      const nextDir = firstRule.dir === 'asc' ? 'desc' : 'asc';
      setView((prev) => ({
        ...prev,
        sortRules: [{ field: fieldKey, dir: nextDir }, ...prev.sortRules.slice(1)],
      }));
    } else {
      setView((prev) => ({
        ...prev,
        sortRules: [{ field: fieldKey, dir: 'asc' }, ...prev.sortRules.filter((r) => r.field !== fieldKey)],
      }));
    }
  };

  const getDimDef = (dim: GroupDim) => {
    let order: string[] = [];
    let meta: Record<string, { label: string; color: string }> = {};

    if (dim === 'priority') {
      order = PRIORITIES.map((p) => p.key);
      meta = Object.fromEntries(PRIORITIES.map((p) => [p.key, { label: p.label, color: p.color }]));
    } else if (dim === 'status') {
      order = STATUSES.map((s) => s.key);
      meta = Object.fromEntries(STATUSES.map((s) => [s.key, { label: s.label, color: s.color }]));
    } else {
      const vs = allVersions(allCards);
      order = vs;
      meta = Object.fromEntries(vs.map((v) => [v, { label: v, color: 'var(--version)' }]));
    }

    const sortRule = view.sortRules.find((r) => r.field === dim);
    if (sortRule && sortRule.dir === 'desc') {
      order = [...order].reverse();
    }
    return { order, meta };
  };

  const keyOf = (dim: GroupDim, c: CardItem) => {
    return dim === 'version' ? c.version || 'Unreleased' : (c[dim as keyof CardItem] as string);
  };

  const buildTree = (list: CardItem[], dims: GroupDim[], isTop: boolean): TableTreeNode => {
    if (dims.length === 0) return { leaf: true, cards: list };
    const [dim, ...rest] = dims;
    const def = getDimDef(dim);
    const groups = def.order
      .map((val) => {
        const groupCards = list.filter((c) => keyOf(dim, c) === val);
        if (!isTop && groupCards.length === 0) return null;
        return {
          dim,
          val,
          meta: def.meta[val] || { label: val, color: 'var(--accent-planned)' },
          cards: groupCards,
          child: buildTree(groupCards, rest, false),
        };
      })
      .filter(Boolean) as TableTreeNode['groups'];

    return { leaf: false, dim, groups };
  };

  const dims: GroupDim[] = view.tablePrimary === 'none'
    ? []
    : ([
        view.tablePrimary,
        view.tableSubGroup ? (view.tablePrimary === 'priority' ? 'status' : 'priority') : null,
        view.tableVersionGroup ? 'version' : null,
      ].filter(Boolean) as GroupDim[]);

  const toggleGroupCollapse = (pathKey: string) => {
    setCollapsedTable((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  };

  const renderRow = (c: CardItem, path: string[], leafList: CardItem[], isHidden: boolean) => {
    const statusDef = STATUSES.find((s) => s.key === c.status) || STATUSES[0];
    const priorityDef = PRIORITIES.find((p) => p.key === c.priority) || PRIORITIES[0];
    const leafKey = path.join('>');
    const isNotesOpen = openReleaseNotes.has(c.id);

    return (
      <tr
        key={c.id}
        className={`drag-row ${c.archived ? 'archived-row' : ''} ${isHidden ? 'group-collapsed-hidden' : ''}`}
        draggable
        onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const sourceId = e.dataTransfer.getData('text/plain');
          if (sourceId) onReorderAndAssign(sourceId, path, leafKey, leafList);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <td className="drag-handle">⠿</td>
        <td>
          <span className="row-title" onClick={() => onEditCard(c.id)}>
            {c.title}
          </span>
          {c.desc && <span className="row-desc">{c.desc}</span>}
        </td>

        <td className="has-ctx-menu" onContextMenu={(e) => onContextMenu(e, c, 'type')}>
          <span className={`type-pill ${c.type}`}>{c.type === 'bug' ? 'Bug' : 'Feature'}</span>
        </td>

        <td
          className="has-ctx-menu"
          style={{ color: priorityDef.color }}
          onContextMenu={(e) => onContextMenu(e, c, 'priority')}
        >
          {priorityDef.label.replace(' priority', '')}
        </td>

        <td
          className="has-ctx-menu"
          style={{ color: statusDef.color }}
          onContextMenu={(e) => onContextMenu(e, c, 'status')}
        >
          {statusDef.label} {c.status === 'blocked' && c.blocked ? `(${c.blocked})` : ''}
        </td>

        <td className="has-ctx-menu" onContextMenu={(e) => onContextMenu(e, c, 'owner')}>
          {c.owner ? c.owner : <span className="dash">—</span>}
        </td>

        <td className="has-ctx-menu" onContextMenu={(e) => onContextMenu(e, c, 'version')}>
          {c.status === 'done' && c.version ? (
            <div>
              <span className="version-wrap">
                <span
                  className="version-badge"
                  title="Click to view release notes"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotes(c.id);
                  }}
                >
                  {c.version}
                </span>
                <button
                  type="button"
                  className="version-info-btn"
                  title="View release notes"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotes(c.id);
                  }}
                >
                  ℹ
                </button>
              </span>
              <div className={`release-notes ${isNotesOpen ? 'open' : ''}`}>
                {c.notes || 'No release notes yet.'}
              </div>
            </div>
          ) : (
            <span className="dash">—</span>
          )}
        </td>

        {view.showTime && (
          <>
            <td className="meta-time">{fmtDate(c.createdAt)}</td>
            <td className="meta-time">{fmtDate(c.updatedAt)}</td>
          </>
        )}

        <td>
          <div className="row-actions">
            <button
              type="button"
              className="btn-board icon small"
              onClick={() => onArchiveToggle(c.id)}
            >
              {c.archived ? 'Restore' : 'Archive'}
            </button>
            {c.archived && (
              <button
                type="button"
                className="btn-board icon small danger"
                onClick={() => onDeleteCard(c.id)}
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderTableNode = (node: TableTreeNode, path: string[], isAncestorCollapsed: boolean): React.ReactNode => {
    if (node.leaf && node.cards) {
      const list = [...node.cards].sort(compareCards);
      if (list.length === 0) return null;
      return list.map((c) => renderRow(c, path, list, isAncestorCollapsed));
    }

    if (node.groups) {
      return node.groups.map((g) => {
        const groupPath = [...path, `${g.dim}:${g.val}`];
        const pathKey = groupPath.join('>');
        const isCollapsed = collapsedTable.has(pathKey);
        const isRowHidden = isAncestorCollapsed;

        return (
          <React.Fragment key={pathKey}>
            <tr
              className={`group-row ${isRowHidden ? 'group-collapsed-hidden' : ''}`}
              style={{ '--nodecolor': g.meta.color } as React.CSSProperties}
              onClick={() => toggleGroupCollapse(pathKey)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const sourceId = e.dataTransfer.getData('text/plain');
                if (sourceId) onReorderAndAssign(sourceId, groupPath, pathKey, g.cards);
              }}
            >
              <td colSpan={colCount}>
                <span
                  className={`chevron ${isCollapsed ? 'collapsed' : ''}`}
                  style={{ marginRight: '6px' }}
                >
                  ▾
                </span>
                {g.meta.label}
                <span className="node-count">{g.cards.length}</span>
              </td>
            </tr>

            {renderTableNode(g.child, groupPath, isAncestorCollapsed || isCollapsed)}
          </React.Fragment>
        );
      });
    }

    return null;
  };

  // Pagination for flat table
  const sortedFlatList = [...cards].sort(compareCards);
  const totalPages = Math.max(1, Math.ceil(sortedFlatList.length / view.pageSize));
  const currentPage = Math.min(view.page, totalPages);
  const startIdx = (currentPage - 1) * view.pageSize;
  const paginatedFlatList = sortedFlatList.slice(startIdx, startIdx + view.pageSize);

  const isFlat = dims.length === 0;

  return (
    <div id="tableView">
      <div className="table-wrap">
        <table className="roadmap-table">
          <thead>
            <tr>
              <th style={{ width: '26px' }} />
              {TABLE_COLS.map((col) => {
                const isSorted = view.sortRules[0]?.field === col.sort;
                const dir = view.sortRules[0]?.dir;
                return (
                  <th
                    key={col.key}
                    className={isSorted ? 'sorted' : ''}
                    onClick={() => handleHeaderSort(col.sort)}
                  >
                    {col.label}
                    {isSorted ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                  </th>
                );
              })}
              {view.showTime && (
                <>
                  <th>Created</th>
                  <th>Updated</th>
                </>
              )}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isFlat ? (
              paginatedFlatList.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="table-empty">
                    Nothing matches the current filters
                  </td>
                </tr>
              ) : (
                paginatedFlatList.map((c) => renderRow(c, [], sortedFlatList, false))
              )
            ) : (
              renderTableNode(buildTree(cards, dims, true), [], false)
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {isFlat && (
        <div className="pager">
          <span className="pager-info">
            Page {currentPage} of {totalPages} &mdash; {sortedFlatList.length} rows
          </span>

          <div className="seg">
            <button
              type="button"
              className={`btn-board small ${view.pageSize === 50 ? 'active' : ''}`}
              onClick={() => setView((prev) => ({ ...prev, pageSize: 50, page: 1 }))}
            >
              50 / page
            </button>
            <button
              type="button"
              className={`btn-board small ${view.pageSize === 100 ? 'active' : ''}`}
              onClick={() => setView((prev) => ({ ...prev, pageSize: 100, page: 1 }))}
            >
              100 / page
            </button>
          </div>

          <button
            type="button"
            className="btn-board small"
            disabled={currentPage <= 1}
            onClick={() => setView((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          >
            &larr; Prev
          </button>
          <button
            type="button"
            className="btn-board small"
            disabled={currentPage >= totalPages}
            onClick={() => setView((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
};
