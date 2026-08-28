import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  CardItem,
  STATUSES,
  PRIORITIES,
  ItemType,
  Priority,
  StatusKey,
  CSV_COLS,
  nowISO,
} from './types';

interface ContextMenuState {
  x: number;
  y: number;
  item: CardItem;
  field: 'type' | 'priority' | 'status' | 'owner' | 'version';
}

interface PromptModalState {
  title: string;
  message: string;
  defaultValue: string;
  multiline?: boolean;
  onResolve: (val: string | null) => void;
}

interface ConfirmModalState {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onResolve: (confirmed: boolean) => void;
}

interface BoardModalsProps {
  editingCard: CardItem | null;
  isAddingNew: boolean;
  onCloseEditModal: () => void;
  onSaveCard: (card: Partial<CardItem>) => void;
  onArchiveCard: (cardId: string) => void;
  onRestoreCard: (cardId: string) => void;
  onDeleteCard: (cardId: string) => void;

  showOwnersModal: boolean;
  owners: string[];
  onCloseOwnersModal: () => void;
  onAddOwner: (name: string) => void;
  onRemoveOwner: (name: string) => void;

  importPreviewData: CardItem[] | null;
  onCloseImportPreview: () => void;
  onConfirmImport: (items: CardItem[]) => void;

  contextMenu: ContextMenuState | null;
  onCloseContextMenu: () => void;

  promptModal: PromptModalState | null;
  confirmModal: ConfirmModalState | null;
  onShowPrompt: (title: string, message: string, defaultValue?: string, multiline?: boolean) => Promise<string | null>;
  onShowConfirm: (title: string, message: string, danger?: boolean) => Promise<boolean>;
}

export const BoardModals: React.FC<BoardModalsProps> = ({
  editingCard,
  isAddingNew,
  onCloseEditModal,
  onSaveCard,
  onArchiveCard,
  onRestoreCard,
  onDeleteCard,
  showOwnersModal,
  owners,
  onCloseOwnersModal,
  onAddOwner,
  onRemoveOwner,
  importPreviewData,
  onCloseImportPreview,
  onConfirmImport,
  contextMenu,
  onCloseContextMenu,
  promptModal,
  confirmModal,
  onShowPrompt,
  onShowConfirm,
}) => {
  // Add/Edit Form State
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fType, setFType] = useState<ItemType>('feature');
  const [fPriority, setFPriority] = useState<Priority>('high');
  const [fStatus, setFStatus] = useState<StatusKey>('planned');
  const [fOwner, setFOwner] = useState('');
  const [fBlocked, setFBlocked] = useState('');
  const [fVersion, setFVersion] = useState('');
  const [fNotes, setFNotes] = useState('');

  // Owners Modal State
  const [newOwnerName, setNewOwnerName] = useState('');

  // Prompt Form State
  const [promptVal, setPromptVal] = useState('');

  useEffect(() => {
    if (editingCard) {
      setFTitle(editingCard.title || '');
      setFDesc(editingCard.desc || '');
      setFType(editingCard.type || 'feature');
      setFPriority(editingCard.priority || 'high');
      setFStatus(editingCard.status || 'planned');
      setFOwner(editingCard.owner || '');
      setFBlocked(editingCard.blocked || '');
      setFVersion(editingCard.version || '');
      setFNotes(editingCard.notes || '');
    } else {
      setFTitle('');
      setFDesc('');
      setFType('feature');
      setFPriority('high');
      setFStatus('planned');
      setFOwner('');
      setFBlocked('');
      setFVersion('');
      setFNotes('');
    }
  }, [editingCard, isAddingNew]);

  useEffect(() => {
    if (promptModal) setPromptVal(promptModal.defaultValue || '');
  }, [promptModal]);

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fTitle.trim()) return;

    onSaveCard({
      title: fTitle.trim(),
      desc: fDesc.trim(),
      type: fType,
      priority: fPriority,
      status: fStatus,
      owner: fOwner.trim(),
      blocked: fStatus === 'blocked' ? fBlocked.trim() : '',
      version: fVersion.trim(),
      notes: fNotes.trim(),
    });
  };

  return (
    <>
      {/* Item Add/Edit Modal */}
      {(editingCard || isAddingNew) && (
        <div className="overlay-board" onClick={onCloseEditModal}>
          <div className="modal-board" onClick={(e) => e.stopPropagation()}>
            <h3>{isAddingNew ? 'New item' : `Edit item — ${editingCard?.id}`}</h3>
            {editingCard && (
              <p className="modal-meta">
                Created: {new Date(editingCard.createdAt).toLocaleString()} &middot; Updated:{' '}
                {new Date(editingCard.updatedAt).toLocaleString()}
              </p>
            )}

            <form onSubmit={handleSaveForm}>
              <div className="field">
                <label>Title</label>
                <input
                  type="text"
                  value={fTitle}
                  placeholder="e.g. Block user by username"
                  onChange={(e) => setFTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="field">
                <label>Description</label>
                <textarea
                  value={fDesc}
                  placeholder="What is this, and why does it matter?"
                  onChange={(e) => setFDesc(e.target.value)}
                />
              </div>

              <div className="row2">
                <div className="field">
                  <label>Type</label>
                  <select
                    value={fType}
                    onChange={(e) => setFType(e.target.value as ItemType)}
                  >
                    <option value="feature">Feature</option>
                    <option value="bug">Bug fix</option>
                  </select>
                </div>
                <div className="field">
                  <label>Priority</label>
                  <select
                    value={fPriority}
                    onChange={(e) => setFPriority(e.target.value as Priority)}
                  >
                    <option value="high">High</option>
                    <option value="med">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="row2">
                <div className="field">
                  <label>Status</label>
                  <select
                    value={fStatus}
                    onChange={(e) => setFStatus(e.target.value as StatusKey)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Owner</label>
                  <input
                    type="text"
                    list="ownersDatalist"
                    value={fOwner}
                    placeholder="Who's on this?"
                    onChange={(e) => setFOwner(e.target.value)}
                  />
                  <datalist id="ownersDatalist">
                    {owners.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
              </div>

              {fStatus === 'blocked' && (
                <div className="field">
                  <label>Blocked by</label>
                  <select
                    value={fBlocked}
                    onChange={(e) => setFBlocked(e.target.value)}
                  >
                    <option value="">Select a reason&hellip;</option>
                    <option value="API">API</option>
                    <option value="Design">Design</option>
                    <option value="Third-party PG">Third-party PG</option>
                    <option value="Third-party game provider">Third-party game provider</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}

              {(fStatus === 'done' || fVersion) && (
                <div className="row2">
                  <div className="field">
                    <label>Version</label>
                    <input
                      type="text"
                      value={fVersion}
                      placeholder="v1.2.0"
                      onChange={(e) => setFVersion(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {(fStatus === 'done' || fNotes) && (
                <div className="field">
                  <label>Release notes</label>
                  <textarea
                    value={fNotes}
                    placeholder="What shipped, for anyone hovering the version tag"
                    onChange={(e) => setFNotes(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-actions">
                <div className="left">
                  {editingCard && !editingCard.archived && (
                    <button
                      type="button"
                      className="btn-board small"
                      onClick={() => onArchiveCard(editingCard.id)}
                    >
                      Archive
                    </button>
                  )}
                  {editingCard && editingCard.archived && (
                    <button
                      type="button"
                      className="btn-board small"
                      onClick={() => onRestoreCard(editingCard.id)}
                    >
                      Restore
                    </button>
                  )}
                  {editingCard && (
                    <button
                      type="button"
                      className="btn-board danger small"
                      onClick={() => onDeleteCard(editingCard.id)}
                    >
                      Delete permanently
                    </button>
                  )}
                </div>
                <div className="right">
                  <button
                    type="button"
                    className="btn-board small"
                    onClick={onCloseEditModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-board primary small">
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owners Management Modal */}
      {showOwnersModal && (
        <div className="overlay-board" onClick={onCloseOwnersModal}>
          <div className="modal-board" onClick={(e) => e.stopPropagation()}>
            <h3>Manage owners</h3>
            <div>
              {owners.length === 0 ? (
                <div className="owners-empty">No owners defined yet.</div>
              ) : (
                owners.map((o) => (
                  <div key={o} className="owner-row">
                    <span>{o}</span>
                    <button type="button" onClick={() => onRemoveOwner(o)}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="row2" style={{ marginTop: '12px' }}>
              <input
                type="text"
                value={newOwnerName}
                placeholder="Add owner name"
                onChange={(e) => setNewOwnerName(e.target.value)}
              />
              <button
                type="button"
                className="btn-board small"
                onClick={() => {
                  if (newOwnerName.trim()) {
                    onAddOwner(newOwnerName.trim());
                    setNewOwnerName('');
                  }
                }}
              >
                Add owner
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '8px' }}>
              Removing an owner from this list won't change items already assigned to them.
            </p>
            <div className="modal-actions">
              <div className="right">
                <button
                  type="button"
                  className="btn-board small"
                  onClick={onCloseOwnersModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {importPreviewData && (
        <div className="overlay-board" onClick={onCloseImportPreview}>
          <div
            className="modal-board"
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Import Preview</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '-4px 0 12px' }}>
              Found {importPreviewData.length} valid items to import.
            </p>

            <div
              style={{
                maxHeight: '320px',
                overflowY: 'auto',
                border: '1px solid var(--border-soft)',
                borderRadius: '8px',
                marginBottom: '14px',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr
                    style={{
                      background: 'var(--panel-2)',
                      textAlign: 'left',
                      fontSize: '11.5px',
                      textTransform: 'uppercase',
                      color: 'var(--text-faint)',
                    }}
                  >
                    <th style={{ padding: '7px 10px' }}>Status</th>
                    <th style={{ padding: '7px 10px' }}>ID</th>
                    <th style={{ padding: '7px 10px' }}>Title</th>
                    <th style={{ padding: '7px 10px' }}>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreviewData.map((item, idx) => (
                    <tr key={item.id + idx} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <td style={{ padding: '7px 10px' }}>{item.status}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-faint)' }}>{item.id}</td>
                      <td style={{ padding: '7px 10px', fontWeight: 600 }}>{item.title}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text-dim)' }}>{item.owner || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-actions">
              <div className="left">
                <button
                  type="button"
                  className="btn-board small"
                  onClick={onCloseImportPreview}
                >
                  Cancel
                </button>
              </div>
              <div className="right">
                <button
                  type="button"
                  className="btn-board primary small"
                  onClick={() => onConfirmImport(importPreviewData)}
                >
                  Confirm Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu Overlay */}
      {contextMenu && (
        <div
          className="context-menu open"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-header">
            {contextMenu.field.toUpperCase()} &middot; {contextMenu.item.id}
          </div>

          {contextMenu.field === 'type' && (
            <>
              {(['feature', 'bug'] as ItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`context-menu-item ${contextMenu.item.type === t ? 'active' : ''}`}
                  onClick={() => {
                    onSaveCard({ ...contextMenu.item, type: t, updatedAt: nowISO() });
                    onCloseContextMenu();
                  }}
                >
                  {contextMenu.item.type === t ? '✓ ' : ''}
                  {t === 'bug' ? 'Bug fix' : 'Feature'}
                </button>
              ))}
            </>
          )}

          {contextMenu.field === 'priority' && (
            <>
              {PRIORITIES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  className={`context-menu-item ${contextMenu.item.priority === p.key ? 'active' : ''}`}
                  onClick={() => {
                    onSaveCard({ ...contextMenu.item, priority: p.key, updatedAt: nowISO() });
                    onCloseContextMenu();
                  }}
                >
                  <span style={{ color: p.color }}>●</span>{' '}
                  {contextMenu.item.priority === p.key ? '✓ ' : ''}
                  {p.label}
                </button>
              ))}
            </>
          )}

          {contextMenu.field === 'status' && (
            <>
              {STATUSES.map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`context-menu-item ${contextMenu.item.status === st.key ? 'active' : ''}`}
                  onClick={() => {
                    onSaveCard({ ...contextMenu.item, status: st.key, updatedAt: nowISO() });
                    onCloseContextMenu();
                  }}
                >
                  <span style={{ color: st.color }}>●</span>{' '}
                  {contextMenu.item.status === st.key ? '✓ ' : ''}
                  {st.label}
                </button>
              ))}
            </>
          )}

          {contextMenu.field === 'owner' && (
            <>
              {owners.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={`context-menu-item ${contextMenu.item.owner === o ? 'active' : ''}`}
                  onClick={() => {
                    onSaveCard({ ...contextMenu.item, owner: o, updatedAt: nowISO() });
                    onCloseContextMenu();
                  }}
                >
                  {contextMenu.item.owner === o ? '✓ ' : ''}
                  {o}
                </button>
              ))}
              <div className="context-menu-divider" />
              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  onCloseContextMenu();
                  const val = await onShowPrompt(
                    'Custom Owner',
                    'Enter owner name:',
                    contextMenu.item.owner || ''
                  );
                  if (val !== null) {
                    const trimmed = val.trim();
                    if (trimmed && !owners.includes(trimmed)) onAddOwner(trimmed);
                    onSaveCard({ ...contextMenu.item, owner: trimmed, updatedAt: nowISO() });
                  }
                }}
              >
                ✏ Custom owner...
              </button>
            </>
          )}

          {contextMenu.field === 'version' && (
            <>
              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  onCloseContextMenu();
                  const val = await onShowPrompt(
                    'Release Version',
                    'Enter release version (e.g. v1.2.0):',
                    contextMenu.item.version || ''
                  );
                  if (val !== null) {
                    onSaveCard({ ...contextMenu.item, version: val.trim(), updatedAt: nowISO() });
                  }
                }}
              >
                🏷️ Change Version Value
              </button>
              <button
                type="button"
                className="context-menu-item"
                onClick={async () => {
                  onCloseContextMenu();
                  const val = await onShowPrompt(
                    'Release Notes',
                    `Edit release notes for ${contextMenu.item.version || contextMenu.item.id}:`,
                    contextMenu.item.notes || '',
                    true
                  );
                  if (val !== null) {
                    onSaveCard({ ...contextMenu.item, notes: val.trim(), updatedAt: nowISO() });
                  }
                }}
              >
                📝 Edit Release Notes
              </button>
            </>
          )}
        </div>
      )}

      {/* Custom Prompt Modal */}
      {promptModal && (
        <div className="overlay-board" style={{ zIndex: 100 }}>
          <div className="modal-board" style={{ maxWidth: '380px' }}>
            <h3>{promptModal.title}</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: '-4px 0 12px' }}>
              {promptModal.message}
            </p>
            <div className="field">
              {promptModal.multiline ? (
                <textarea
                  value={promptVal}
                  style={{ minHeight: '70px' }}
                  onChange={(e) => setPromptVal(e.target.value)}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={promptVal}
                  onChange={(e) => setPromptVal(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="modal-actions">
              <div className="right">
                <button
                  type="button"
                  className="btn-board small"
                  onClick={() => promptModal.onResolve(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-board primary small"
                  onClick={() => promptModal.onResolve(promptVal)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModal && (
        <div className="overlay-board" style={{ zIndex: 100 }}>
          <div className="modal-board" style={{ maxWidth: '380px' }}>
            <h3>{confirmModal.title}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text)', margin: '-4px 0 16px', lineHeight: 1.45 }}>
              {confirmModal.message}
            </p>
            <div className="modal-actions">
              <div className="right">
                <button
                  type="button"
                  className="btn-board small"
                  onClick={() => confirmModal.onResolve(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn-board small ${confirmModal.danger ? 'danger' : 'primary'}`}
                  onClick={() => confirmModal.onResolve(true)}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
