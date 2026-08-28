export type ItemType = 'feature' | 'bug';
export type Priority = 'high' | 'med' | 'low';
export type StatusKey = 'idea' | 'planned' | 'progress' | 'blocked' | 'staging' | 'done';
export type GroupDim = 'priority' | 'status' | 'version' | 'none';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ArchiveFilterMode = 'active' | 'archived' | 'all';
export type ViewMode = 'card' | 'table';

export interface CardItem {
  id: string;
  type: ItemType;
  title: string;
  desc: string;
  priority: Priority;
  status: StatusKey;
  owner: string;
  blocked: string;
  version: string;
  notes: string;
  archived: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface StatusDef {
  key: StatusKey;
  label: string;
  color: string;
}

export interface PriorityDef {
  key: Priority;
  label: string;
  color: string;
}

export interface SortRule {
  field: string;
  dir: 'asc' | 'desc';
}

export interface BoardFilters {
  type: string;
  priority: Priority[];
  status: StatusKey[];
  version: string[];
}

export interface ViewState {
  view: ViewMode;
  primary: GroupDim;
  subGroup: boolean;
  versionGroup: boolean;
  tablePrimary: GroupDim;
  tableSubGroup: boolean;
  tableVersionGroup: boolean;
  sortRules: SortRule[];
  theme: ThemeMode;
  archiveFilter: ArchiveFilterMode;
  showTime: boolean;
  pageSize: number;
  page: number;
  filters: BoardFilters;
}

export const STATUSES: StatusDef[] = [
  { key: 'idea', label: 'Idea', color: 'var(--accent-idea)' },
  { key: 'planned', label: 'Planned', color: 'var(--accent-planned)' },
  { key: 'progress', label: 'In Progress', color: 'var(--accent-progress)' },
  { key: 'blocked', label: 'Blocked', color: 'var(--accent-blocked)' },
  { key: 'staging', label: 'In Staging', color: 'var(--accent-staging)' },
  { key: 'done', label: 'Done / Live', color: 'var(--accent-done)' },
];

export const STATUS_INDEX: Record<StatusKey, number> = Object.fromEntries(
  STATUSES.map((s, i) => [s.key, i])
) as Record<StatusKey, number>;

export const PRIORITIES: PriorityDef[] = [
  { key: 'high', label: 'High priority', color: 'var(--pri-high)' },
  { key: 'med', label: 'Medium priority', color: 'var(--pri-med)' },
  { key: 'low', label: 'Low priority', color: 'var(--pri-low)' },
];

export const PRIORITY_INDEX: Record<Priority, number> = Object.fromEntries(
  PRIORITIES.map((p, i) => [p.key, i])
) as Record<Priority, number>;

export const PRI_SHORT: Record<Priority, string> = {
  high: 'High',
  med: 'Med',
  low: 'Low',
};

export const SORT_FIELDS = [
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'owner', label: 'Owner' },
  { key: 'version', label: 'Version' },
];

export const SEED_CARDS: CardItem[] = [
  { id: 'F-001', type: 'feature', title: 'Dashboard summary widget', desc: 'Show total users, total registered, currently logged in, currently playing in-game.', priority: 'high', status: 'planned', owner: 'Tim IT Dominus4d', blocked: '', version: '', notes: '', archived: false, order: 0, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-002', type: 'feature', title: 'Dashboard hover/click explanations', desc: 'Add explanation on hover/click for each dashboard summary metric.', priority: 'med', status: 'idea', owner: 'Tim IT Dominus4d', blocked: '', version: '', notes: '', archived: false, order: 10, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-003', type: 'feature', title: 'Edit AMP settings', desc: 'Admin panel must be able to edit AMP settings.', priority: 'high', status: 'planned', owner: 'Tim IT Dominus4d', blocked: '', version: '', notes: '', archived: false, order: 20, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-004', type: 'feature', title: 'Edit SEO settings', desc: 'Admin panel must be able to edit SEO settings.', priority: 'med', status: 'idea', owner: 'Tim IT Dominus4d', blocked: '', version: '', notes: '', archived: false, order: 30, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-005', type: 'feature', title: 'Edit contact channels', desc: 'Admin panel must be able to edit contacts (WhatsApp, Telegram, etc.).', priority: 'med', status: 'idea', owner: 'Tim IT Dominus4d', blocked: '', version: '', notes: '', archived: false, order: 40, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-006', type: 'feature', title: 'Per-user detailed game history', desc: 'Detailed game history per user including screenshot/replay of winning rounds.', priority: 'med', status: 'blocked', owner: 'Tim IT Dominus4d', blocked: 'Third-party game provider', version: '', notes: '', archived: false, order: 50, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-007', type: 'feature', title: 'Block user by username', desc: 'Live chat: block-by-username feature.', priority: 'high', status: 'planned', owner: 'Tim IT Live Chat', blocked: '', version: '', notes: '', archived: false, order: 60, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-008', type: 'feature', title: 'Chat user data panel', desc: 'Show chat user data for logged-in users.', priority: 'med', status: 'idea', owner: 'Tim IT Live Chat', blocked: '', version: '', notes: '', archived: false, order: 70, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-009', type: 'feature', title: 'Multi-message send delay', desc: 'Allow multiple chat messages with a ~3 second delay between messages.', priority: 'low', status: 'idea', owner: 'Tim IT Live Chat', blocked: '', version: '', notes: '', archived: false, order: 80, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
  { id: 'F-010', type: 'feature', title: 'Admin panel access provisioning', desc: 'Share AMP settings example, game win history example, and email list for admin panel access.', priority: 'high', status: 'progress', owner: 'Tim Nova', blocked: '', version: '', notes: '', archived: false, order: 90, createdAt: '2026-08-06T00:00:00.000Z', updatedAt: '2026-08-06T00:00:00.000Z' },
];

export const CARDS_KEY = 'roadmap-cards';
export const VIEW_KEY = 'roadmap-explorer-view';
export const OWNERS_KEY = 'roadmap-owners';
export const CSV_COLS = ['id','type','title','desc','priority','status','owner','blocked','version','notes','archived','order','createdAt','updatedAt'];

export function nowISO(): string {
  return new Date().toISOString();
}

export function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function allVersions(cards: CardItem[]): string[] {
  const set = new Set<string>(['Unreleased']);
  cards.forEach((c) => {
    if (c.version) set.add(c.version);
  });
  return Array.from(set).sort((a, b) => {
    if (a === 'Unreleased') return 1;
    if (b === 'Unreleased') return -1;
    const pa = a.replace(/^v/i, '').split('.').map(Number);
    const pb = b.replace(/^v/i, '').split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const d = (pb[i] || 0) - (pa[i] || 0);
      if (d) return d;
    }
    return 0;
  });
}
