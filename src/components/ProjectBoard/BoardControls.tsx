import React, { useState } from 'react';
import {
  ViewState,
  CardItem,
  STATUSES,
  PRIORITIES,
  SORT_FIELDS,
  allVersions,
  GroupDim,
  ArchiveFilterMode,
  ThemeMode,
  ViewMode,
} from './types';

interface BoardControlsProps {
  view: ViewState;
  setView: React.Dispatch<React.SetStateAction<ViewState>>;
  cards: CardItem[];
  filteredCount: number;
  totalCount: number;
  ioStatus: string;
  onOpenAddModal: () => void;
  onOpenOwnersModal: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onDownloadTemplateCSV: () => void;
  onDownloadExampleCSV: () => void;
  onDownloadTemplateJSON: () => void;
  onDownloadExampleJSON: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  onImportFileSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BoardControls: React.FC<BoardControlsProps> = ({
  view,
  setView,
  cards,
  filteredCount,
  totalCount,
  ioStatus,
  onOpenAddModal,
  onOpenOwnersModal,
  onExpandAll,
  onCollapseAll,
  onDownloadTemplateCSV,
  onDownloadExampleCSV,
  onDownloadTemplateJSON,
  onDownloadExampleJSON,
  onExportCSV,
  onExportJSON,
  onImportFileSelected,
}) => {
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isTable = view.view === 'table';
  const primaryKey = isTable ? 'tablePrimary' : 'primary';
  const subKey = isTable ? 'tableSubGroup' : 'subGroup';
  const verKey = isTable ? 'tableVersionGroup' : 'versionGroup';

  const primaryVal = view[primaryKey];
  const isGrouped = primaryVal !== 'none';

  const versionsList = allVersions(cards);

  const updateView = (patch: Partial<ViewState>) => {
    setView((prev) => ({ ...prev, ...patch }));
  };

  const handleAddSortField = (fieldKey: string) => {
    if (!fieldKey) return;
    updateView({
      sortRules: [...view.sortRules, { field: fieldKey, dir: 'asc' }],
    });
  };

  const handleToggleSortDir = (index: number) => {
    const updated = [...view.sortRules];
    updated[index] = {
      ...updated[index],
      dir: updated[index].dir === 'asc' ? 'desc' : 'asc',
    };
    updateView({ sortRules: updated });
  };

  const handleRemoveSortRule = (index: number) => {
    const updated = view.sortRules.filter((_, i) => i !== index);
    updateView({ sortRules: updated });
  };

  const handleMoveSortRuleUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...view.sortRules];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    updateView({ sortRules: updated });
  };

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <p className="brand-eyebrow">Dominus 4D</p>
          <h1 className="brand-title">Project Board</h1>
          <p className="brand-desc">Feature & Bug Tracker</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {ioStatus && <span className="io-status">{ioStatus}</span>}
          <button className="btn-board small" onClick={onOpenOwnersModal}>
            Owners
          </button>
          <button
            className={`btn-board small ${showImportPanel ? 'active' : ''}`}
            onClick={() => setShowImportPanel((prev) => !prev)}
          >
            Import / Export
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.json"
            style={{ display: 'none' }}
            onChange={onImportFileSelected}
          />
          <button className="btn-board primary" onClick={onOpenAddModal}>
            + Add item
          </button>
        </div>
      </div>

      <p className="item-count">
        {filteredCount} of {totalCount} items shown
      </p>

      {/* Control Deck */}
      <div className="deck">
        {/* Import/Export Panel */}
        <div className={`deck-row import-panel ${showImportPanel ? 'open' : ''}`}>
          <p>
            Download a template (empty, just headers) or an example (filled in) to see expected columns, then use "Choose file" to import your own.
          </p>
          <div className="dl-row">
            <button className="btn-board small" onClick={onDownloadTemplateCSV}>
              Template — CSV
            </button>
            <button className="btn-board small" onClick={onDownloadExampleCSV}>
              Example — CSV
            </button>
            <button className="btn-board small" onClick={onDownloadTemplateJSON}>
              Template — JSON
            </button>
            <button className="btn-board small" onClick={onDownloadExampleJSON}>
              Example — JSON
            </button>
          </div>
          <div className="dl-row">
            <button
              className="btn-board small primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose file to import&hellip;
            </button>
            <button className="btn-board small" onClick={onExportCSV}>
              Export current — CSV
            </button>
            <button className="btn-board small" onClick={onExportJSON}>
              Export current — JSON
            </button>
          </div>
        </div>

        {/* Row 1: View & Grouping */}
        <div className="deck-row">
          <span className="deck-label">View</span>
          <div className="seg">
            <button
              type="button"
              className={`btn-board small ${view.view === 'card' ? 'active' : ''}`}
              onClick={() => updateView({ view: 'card' })}
            >
              Card
            </button>
            <button
              type="button"
              className={`btn-board small ${view.view === 'table' ? 'active' : ''}`}
              onClick={() => updateView({ view: 'table' })}
            >
              Table
            </button>
          </div>

          <span className="deck-label">Group by</span>
          <div className="seg">
            {isTable && (
              <button
                type="button"
                className={`btn-board small ${primaryVal === 'none' ? 'active' : ''}`}
                onClick={() => updateView({ [primaryKey]: 'none' })}
              >
                None
              </button>
            )}
            <button
              type="button"
              className={`btn-board small ${primaryVal === 'priority' ? 'active' : ''}`}
              onClick={() => updateView({ [primaryKey]: 'priority' })}
            >
              Priority
            </button>
            <button
              type="button"
              className={`btn-board small ${primaryVal === 'status' ? 'active' : ''}`}
              onClick={() => updateView({ [primaryKey]: 'status' })}
            >
              Status
            </button>
          </div>

          {isGrouped && (
            <>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={view[subKey]}
                  onChange={(e) => updateView({ [subKey]: e.target.checked })}
                />
                <span>split by {primaryVal === 'priority' ? 'status' : 'priority'}</span>
              </label>

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={view[verKey]}
                  onChange={(e) => updateView({ [verKey]: e.target.checked })}
                />
                <span>split by release version</span>
              </label>
            </>
          )}

          <div className="spacer" />

          {isGrouped && (
            <>
              <button className="btn-board small" onClick={onExpandAll}>
                Expand all
              </button>
              <button className="btn-board small" onClick={onCollapseAll}>
                Collapse all
              </button>
            </>
          )}
        </div>

        {/* Row 2: Sort Rules & Theme */}
        <div className="deck-row">
          <span className="deck-label">Sort by</span>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {view.sortRules.map((rule, i) => {
              const def = SORT_FIELDS.find((f) => f.key === rule.field);
              return (
                <div key={rule.field + i} className="sort-chip">
                  {i > 0 && (
                    <button
                      type="button"
                      title="Higher priority"
                      onClick={() => handleMoveSortRuleUp(i)}
                    >
                      &uarr;
                    </button>
                  )}
                  <span>{def ? def.label : rule.field}</span>
                  <span
                    className="arrow"
                    title="Toggle sort direction"
                    onClick={() => handleToggleSortDir(i)}
                  >
                    {rule.dir === 'asc' ? '↑' : '↓'}
                  </span>
                  <button
                    type="button"
                    title="Remove sort"
                    onClick={() => handleRemoveSortRule(i)}
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>

          <select
            className="add-sort-select"
            value=""
            onChange={(e) => handleAddSortField(e.target.value)}
          >
            <option value="">+ Add sort field&hellip;</option>
            {SORT_FIELDS.filter((f) => !view.sortRules.some((r) => r.field === f.key)).map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Archive & Filter Toggle */}
        <div className="deck-row">
          <span className="deck-label">Show</span>
          <div className="seg">
            {(['active', 'archived', 'all'] as ArchiveFilterMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`btn-board small ${view.archiveFilter === mode ? 'active' : ''}`}
                onClick={() => updateView({ archiveFilter: mode, page: 1 })}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          <label className="toggle">
            <input
              type="checkbox"
              checked={view.showTime}
              onChange={(e) => updateView({ showTime: e.target.checked })}
            />
            <span>timestamps</span>
          </label>

          <div className="spacer" />

          <button
            type="button"
            className={`btn-board small ${showFilterPanel ? 'active' : ''}`}
            onClick={() => setShowFilterPanel((prev) => !prev)}
          >
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        <div className={`deck-row filter-panel ${showFilterPanel ? 'open' : ''}`}>
          {/* Filter Type */}
          <div className="filter-col">
            <div className="filter-col-head">
              <span className="filter-col-title">Type</span>
            </div>
            {[
              { key: 'all', label: 'All types', color: 'var(--text-dim)' },
              { key: 'feature', label: 'Feature', color: 'var(--feature)' },
              { key: 'bug', label: 'Bug fix', color: 'var(--bug)' },
            ].map((o) => (
              <label key={o.key} className="filter-check">
                <input
                  type="radio"
                  name="typeFilter"
                  checked={view.filters.type === o.key}
                  onChange={() => updateView({ filters: { ...view.filters, type: o.key }, page: 1 })}
                />
                <span className="sw" style={{ background: o.color }} />
                {o.label}
              </label>
            ))}
          </div>

          {/* Filter Priority */}
          <div className="filter-col">
            <div className="filter-col-head">
              <span className="filter-col-title">Priority</span>
              <span
                className="filter-quick"
                onClick={() => {
                  const allSelected = view.filters.priority.length === PRIORITIES.length;
                  updateView({
                    filters: {
                      ...view.filters,
                      priority: allSelected ? [] : PRIORITIES.map((p) => p.key),
                    },
                    page: 1,
                  });
                }}
              >
                All
              </span>
            </div>
            {PRIORITIES.map((p) => (
              <label key={p.key} className="filter-check">
                <input
                  type="checkbox"
                  checked={view.filters.priority.includes(p.key)}
                  onChange={(e) => {
                    const set = new Set(view.filters.priority);
                    if (e.target.checked) set.add(p.key);
                    else set.delete(p.key);
                    updateView({ filters: { ...view.filters, priority: Array.from(set) }, page: 1 });
                  }}
                />
                <span className="sw" style={{ background: p.color }} />
                {p.label}
              </label>
            ))}
          </div>

          {/* Filter Status */}
          <div className="filter-col">
            <div className="filter-col-head">
              <span className="filter-col-title">Status</span>
              <span
                className="filter-quick"
                onClick={() => {
                  const allSelected = view.filters.status.length === STATUSES.length;
                  updateView({
                    filters: {
                      ...view.filters,
                      status: allSelected ? [] : STATUSES.map((s) => s.key),
                    },
                    page: 1,
                  });
                }}
              >
                All
              </span>
            </div>
            {STATUSES.map((s) => (
              <label key={s.key} className="filter-check">
                <input
                  type="checkbox"
                  checked={view.filters.status.includes(s.key)}
                  onChange={(e) => {
                    const set = new Set(view.filters.status);
                    if (e.target.checked) set.add(s.key);
                    else set.delete(s.key);
                    updateView({ filters: { ...view.filters, status: Array.from(set) }, page: 1 });
                  }}
                />
                <span className="sw" style={{ background: s.color }} />
                {s.label}
              </label>
            ))}
          </div>

          {/* Filter Version */}
          <div className="filter-col">
            <div className="filter-col-head">
              <span className="filter-col-title">Release version</span>
              <span
                className="filter-quick"
                onClick={() => {
                  const allSelected = view.filters.version.length === versionsList.length;
                  updateView({
                    filters: {
                      ...view.filters,
                      version: allSelected ? [] : versionsList,
                    },
                    page: 1,
                  });
                }}
              >
                All
              </span>
            </div>
            {versionsList.map((v) => (
              <label key={v} className="filter-check">
                <input
                  type="checkbox"
                  checked={view.filters.version.includes(v)}
                  onChange={(e) => {
                    const set = new Set(view.filters.version);
                    if (e.target.checked) set.add(v);
                    else set.delete(v);
                    updateView({ filters: { ...view.filters, version: Array.from(set) }, page: 1 });
                  }}
                />
                <span className="sw" style={{ background: 'var(--version)' }} />
                {v}
              </label>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
