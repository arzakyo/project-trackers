import React, { useState } from 'react';
import {
  CardItem,
  ViewState,
  STATUSES,
  STATUS_INDEX,
  PRIORITIES,
  PRIORITY_INDEX,
  PRI_SHORT,
  allVersions,
  fmtDate,
  GroupDim,
  StatusKey,
} from './types';

interface CardViewProps {
  cards: CardItem[];
  allCards: CardItem[];
  view: ViewState;
  onEditCard: (cardId: string) => void;
  onUpdateCardStatus: (cardId: string, newStatus: StatusKey) => void;
  onReorderAndAssign: (sourceId: string, targetPath: string[], leafKey: string, leafList: CardItem[]) => void;
  onContextMenu: (e: React.MouseEvent, item: CardItem, field: 'type' | 'priority' | 'status' | 'owner' | 'version') => void;
  collapsedCard: Set<string>;
  setCollapsedCard: React.Dispatch<React.SetStateAction<Set<string>>>;
}

interface TreeNode {
  leaf: boolean;
  cards?: CardItem[];
  dim?: GroupDim;
  groups?: Array<{
    dim: GroupDim;
    val: string;
    meta: { label: string; color: string };
    cards: CardItem[];
    child: TreeNode;
  }>;
}

export const CardView: React.FC<CardViewProps> = ({
  cards,
  allCards,
  view,
  onEditCard,
  onUpdateCardStatus,
  onReorderAndAssign,
  onContextMenu,
  collapsedCard,
  setCollapsedCard,
}) => {
  const [openReleaseNotes, setOpenReleaseNotes] = useState<Set<string>>(new Set());
  const [dragOverLeaf, setDragOverLeaf] = useState<string | null>(null);
  const [dragTargetHead, setDragTargetHead] = useState<string | null>(null);

  // Sorting helper
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
    return dim === 'version' ? c.version || 'Unreleased' : c[dim as keyof CardItem] as string;
  };

  const buildTree = (list: CardItem[], dims: GroupDim[], isTop: boolean): TreeNode => {
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
      .filter(Boolean) as TreeNode['groups'];

    return { leaf: false, dim, groups };
  };

  const dims: GroupDim[] = [
    view.primary,
    view.subGroup ? (view.primary === 'priority' ? 'status' : 'priority') : null,
    view.versionGroup ? 'version' : null,
  ].filter(Boolean) as GroupDim[];

  const tree = buildTree(cards, dims, true);

  const toggleCollapseNode = (pathKey: string) => {
    setCollapsedCard((prev) => {
      const next = new Set(prev);
      if (next.has(pathKey)) next.delete(pathKey);
      else next.add(pathKey);
      return next;
    });
  };

  const toggleNotes = (id: string) => {
    setOpenReleaseNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderNode = (node: TreeNode, path: string[]): React.ReactNode => {
    if (node.leaf && node.cards) {
      const list = [...node.cards].sort(compareCards);
      const leafKey = path.join('>');

      return (
        <div
          className={`leaf ${dragOverLeaf === leafKey ? 'drag-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverLeaf(leafKey);
          }}
          onDragLeave={() => setDragOverLeaf(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverLeaf(null);
            const sourceId = e.dataTransfer.getData('text/plain');
            if (sourceId) onReorderAndAssign(sourceId, path, leafKey, list);
          }}
        >
          {list.length === 0 ? (
            <div className="leaf-empty">Nothing here</div>
          ) : (
            list.map((c) => {
              const statusDef = STATUSES.find((s) => s.key === c.status) || STATUSES[0];
              const isNotesOpen = openReleaseNotes.has(c.id);

              return (
                <div
                  key={c.id}
                  className={`card-board ${c.archived ? 'archived' : ''}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', c.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId) onReorderAndAssign(sourceId, path, leafKey, list);
                  }}
                >
                  <div className="card-header">
                    <div className="card-inner" style={{ paddingBottom: 0, gap: '4px' }}>
                      <div className="card-top">
                        <span
                          className={`type-pill ${c.type} has-ctx-menu`}
                          onContextMenu={(e) => onContextMenu(e, c, 'type')}
                        >
                          {c.type === 'bug' ? 'Bug' : 'Feature'}
                        </span>
                        <span className="card-id">{c.id}</span>
                      </div>
                      <p
                        className="card-title"
                        onClick={() => onEditCard(c.id)}
                      >
                        {c.title}
                      </p>
                    </div>
                  </div>

                  <div className="card-inner" style={{ paddingTop: '4px' }}>
                    {c.desc && <p className="card-desc">{c.desc}</p>}

                    <div className="status-label" style={{ '--statuscolor': statusDef.color } as React.CSSProperties}>
                      <span className="sw" />
                      {statusDef.label} &middot; {PRI_SHORT[c.priority]}
                    </div>

                    <div className="track">
                      {STATUSES.map((st, idx) => (
                        <span
                          key={st.key}
                          className={`track-dot ${idx <= STATUS_INDEX[c.status] ? 'filled' : ''}`}
                          style={{ '--dotcolor': st.color } as React.CSSProperties}
                          title={st.label}
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateCardStatus(c.id, st.key);
                          }}
                        />
                      ))}
                    </div>

                    {c.status === 'blocked' && c.blocked && (
                      <div className="blocked-note">⛔ {c.blocked}</div>
                    )}

                    {c.status === 'done' && c.version && (
                      <div
                        className="version-wrap has-ctx-menu"
                        onContextMenu={(e) => onContextMenu(e, c, 'version')}
                      >
                        <div
                          className="version-badge"
                          title="Click to view release notes"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleNotes(c.id);
                          }}
                        >
                          {c.version}
                        </div>
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
                      </div>
                    )}

                    {c.status === 'done' && c.version && (
                      <div className={`release-notes ${isNotesOpen ? 'open' : ''}`}>
                        {c.notes || 'No release notes yet.'}
                      </div>
                    )}

                    {c.archived && <span className="archived-tag">Archived</span>}

                    {view.showTime && (
                      <div className="meta-time">
                        created {fmtDate(c.createdAt)} &middot; updated {fmtDate(c.updatedAt)}
                      </div>
                    )}

                    <div className="card-foot">
                      <span
                        className="owner-tag has-ctx-menu"
                        onContextMenu={(e) => onContextMenu(e, c, 'owner')}
                      >
                        {c.owner || ''}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (node.groups) {
      return (
        <>
          {node.groups.map((g) => {
            const groupPath = [...path, `${g.dim}:${g.val}`];
            const pathKey = groupPath.join('>');
            const isCollapsed = collapsedCard.has(pathKey);

            return (
              <div key={pathKey} className="node">
                <div
                  className={`node-head ${dragTargetHead === pathKey ? 'drop-target-active' : ''}`}
                  style={{ '--nodecolor': g.meta.color } as React.CSSProperties}
                  onClick={() => toggleCollapseNode(pathKey)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragTargetHead(pathKey);
                  }}
                  onDragLeave={() => setDragTargetHead(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragTargetHead(null);
                    const sourceId = e.dataTransfer.getData('text/plain');
                    if (sourceId) onReorderAndAssign(sourceId, groupPath, pathKey, g.cards);
                  }}
                >
                  <span className={`chevron ${isCollapsed ? 'collapsed' : ''}`}>▾</span>
                  <span className="node-label">{g.meta.label}</span>
                  <span className="node-count">{g.cards.length}</span>
                </div>

                <div className={`node-children ${isCollapsed ? 'collapsed' : ''}`}>
                  <div className="node-children-inner">{renderNode(g.child, groupPath)}</div>
                </div>
              </div>
            );
          })}
        </>
      );
    }

    return null;
  };

  return <div id="tree">{renderNode(tree, [])}</div>;
};
