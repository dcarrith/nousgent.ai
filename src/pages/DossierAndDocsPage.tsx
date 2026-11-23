import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { CopyCommandButton } from '../components/CopyCommandButton';
import {
  CommunityLeaderboardEntry,
  DidLeaderboardEntry,
  MissionSnapshot
} from '../hooks/useNousgentMission';

export interface DossierAndDocsPageProps {
  readonly snapshot: MissionSnapshot;
  readonly onRefresh?: () => void;
}

const textCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

const ROYALTY_WATERFALL_SPLITS = [
  { tier: '01 // Direct Origin Creator', pct: '60%', note: 'Authoring DID / Community Brain Store' },
  { tier: '02 // Cited Ancestor Lineage', pct: '25%', note: 'Upstream .dig parent capsules cited' },
  { tier: '03 // Foundational Merkle Root', pct: '10%', note: 'Genesis protocol & store lineage' },
  { tier: '04 // Ring-0 Antibody Verifiers', pct: '5%', note: 'SECDED & pre-thalamic auditors' }
] as const;

function MiddleEllipsis({
  text,
  tailChars = 6
}: Readonly<{
  readonly text: string;
  readonly tailChars?: number;
}>) {
  if (!text) return <span>—</span>;
  if (text.length <= tailChars + 10) {
    return <code className="mono-xs">{text}</code>;
  }
  const head = text.slice(0, -tailChars);
  const tail = text.slice(-tailChars);
  return (
    <code className="mono-xs middle-ellipsis">
      <span>{head}</span>
      {tail}
    </code>
  );
}

function SortChevron() {
  return (
    <svg className="leaderboard-sort-icon" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 4.25L6 7.75L9.5 4.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function rankMedalClass(rank: number): string {
  if (rank === 1) return 'leaderboard-rank-medal rank-1';
  if (rank === 2) return 'leaderboard-rank-medal rank-2';
  if (rank === 3) return 'leaderboard-rank-medal rank-3';
  return 'leaderboard-rank-medal';
}

function formatCompactTokens(tokens: number): string {
  if (!tokens || tokens <= 0) return '0';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return tokens.toLocaleString();
}

function useDomSortableTable(rowSignature: string) {
  const rawId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const tableId = `lb-tbl-${rawId}`;
  const captionId = `lb-cap-${rawId}`;
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const activeSortRef = useRef<{ colIndex: number; direction: 'ascending' | 'descending' } | null>(null);

  const supportsInvokerCommands =
    typeof HTMLButtonElement !== 'undefined' && 'commandForElement' in HTMLButtonElement.prototype;

  const executeSortOnHeader = useCallback(
    (th: HTMLTableCellElement, explicitDirection?: 'ascending' | 'descending', announce = true) => {
      const table = tableRef.current;
      const tbody = tbodyRef.current;
      if (!table || !tbody || !table.tHead || !table.tHead.rows[0]) return;

      const currentSort = th.getAttribute('aria-sort');
      const direction: 'ascending' | 'descending' =
        explicitDirection ?? (currentSort === 'ascending' ? 'descending' : 'ascending');
      const colIndex = th.cellIndex;
      const colType = th.dataset.type || 'text';

      for (const cell of Array.from(table.tHead.rows[0].cells)) {
        cell.removeAttribute('aria-sort');
      }
      th.setAttribute('aria-sort', direction);
      activeSortRef.current = { colIndex, direction };

      const factor = direction === 'ascending' ? 1 : -1;
      const decorated = Array.from(tbody.rows).map((row) => {
        const targetCell = row.cells[colIndex];
        const raw = targetCell?.dataset.value ?? targetCell?.textContent?.trim() ?? '';
        return {
          row,
          numVal: colType === 'number' ? Number(raw || 0) : 0,
          strVal: raw
        };
      });

      decorated.sort((a, b) => {
        if (colType === 'number') {
          return factor * (a.numVal - b.numVal);
        }
        return factor * textCollator.compare(a.strVal, b.strVal);
      });

      const reorderDom = () => {
        const moveBeforeFn = (
          tbody as unknown as { moveBefore?: (node: Node, child: Node | null) => void }
        ).moveBefore;
        for (const item of decorated) {
          if (typeof moveBeforeFn === 'function') {
            moveBeforeFn.call(tbody, item.row, null);
          } else {
            tbody.appendChild(item.row);
          }
        }
      };

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      const startScopedTransition = (
        table as unknown as { startViewTransition?: (cb: () => void) => void }
      ).startViewTransition;

      if (!prefersReducedMotion && decorated.length <= 40 && typeof startScopedTransition === 'function') {
        startScopedTransition.call(table, reorderDom);
      } else {
        reorderDom();
      }

      if (announce && statusRef.current) {
        const label = th.querySelector('button')?.textContent?.trim() || th.textContent?.trim() || 'Column';
        statusRef.current.textContent = `Sorted by ${label}, ${direction}, ${decorated.length} rows`;
      }
    },
    []
  );

  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;
    const onCommand = (evt: Event) => {
      const cmdEvt = evt as Event & { command?: string; source?: HTMLElement | null };
      if (cmdEvt.command !== '--sort') return;
      const th = cmdEvt.source?.closest('th') as HTMLTableCellElement | null;
      if (th) executeSortOnHeader(th);
    };
    table.addEventListener('command', onCommand);
    return () => table.removeEventListener('command', onCommand);
  }, [executeSortOnHeader]);

  // Re-apply active sort silently if underlying telemetry refreshes without changing row keys
  useEffect(() => {
    const saved = activeSortRef.current;
    const table = tableRef.current;
    if (!saved || !table?.tHead?.rows[0]) return;
    const th = table.tHead.rows[0].cells[saved.colIndex] as HTMLTableCellElement | undefined;
    if (th) {
      executeSortOnHeader(th, saved.direction, false);
    }
  }, [rowSignature, executeSortOnHeader]);

  const onHeaderButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (supportsInvokerCommands) return;
      const th = e.currentTarget.closest('th') as HTMLTableCellElement | null;
      if (th) executeSortOnHeader(th);
    },
    [supportsInvokerCommands, executeSortOnHeader]
  );

  return {
    tableId,
    captionId,
    tableRef,
    tbodyRef,
    statusRef,
    onHeaderButtonClick
  };
}

export function DossierAndDocsPage({ snapshot, onRefresh }: Readonly<DossierAndDocsPageProps>) {
  const supportsUntilFound =
    typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCommunities: readonly CommunityLeaderboardEntry[] = useMemo(() => {
    if (!normalizedQuery) return snapshot.communityLeaderboard;
    return snapshot.communityLeaderboard.filter(
      (c) =>
        c.name.toLowerCase().includes(normalizedQuery) ||
        c.storeId.toLowerCase().includes(normalizedQuery) ||
        c.agentDid.toLowerCase().includes(normalizedQuery) ||
        c.source.toLowerCase().includes(normalizedQuery) ||
        c.slug.toLowerCase().includes(normalizedQuery)
    );
  }, [snapshot.communityLeaderboard, normalizedQuery]);

  const filteredDids: readonly DidLeaderboardEntry[] = useMemo(() => {
    if (!normalizedQuery) return snapshot.didLeaderboard;
    return snapshot.didLeaderboard.filter(
      (d) =>
        d.did.toLowerCase().includes(normalizedQuery) ||
        d.role.toLowerCase().includes(normalizedQuery) ||
        d.citizenCallsign.toLowerCase().includes(normalizedQuery) ||
        d.stateCode.toLowerCase().includes(normalizedQuery) ||
        d.agentHandles.some((a) => a.toLowerCase().includes(normalizedQuery)) ||
        d.communityNames.some((n) => n.toLowerCase().includes(normalizedQuery))
    );
  }, [snapshot.didLeaderboard, normalizedQuery]);

  const filteredPods = useMemo(() => {
    const hubsWithRank = snapshot.stateHubs.map((h, idx) => ({
      rank: idx + 1,
      ...h
    }));
    if (!normalizedQuery) return hubsWithRank;
    return hubsWithRank.filter(
      (h) =>
        h.stateCode.toLowerCase().includes(normalizedQuery) ||
        h.hubName.toLowerCase().includes(normalizedQuery) ||
        h.subtitle.toLowerCase().includes(normalizedQuery)
    );
  }, [snapshot.stateHubs, normalizedQuery]);

  const communityRowSig = filteredCommunities.map((c) => c.storeId).join('|');
  const didRowSig = filteredDids.map((d) => d.did).join('|');
  const podRowSig = filteredPods.map((p) => p.stateCode).join('|');

  const commTable = useDomSortableTable(communityRowSig);
  const didTable = useDomSortableTable(didRowSig);
  const podTable = useDomSortableTable(podRowSig);

  function selectTab(index: number): void {
    setActiveTab(index);
    const btn = tabRefs.current[index];
    if (btn && typeof btn.scrollIntoView === 'function') {
      try {
        btn.scrollIntoView({
          block: 'nearest',
          inline: 'nearest',
          container: 'nearest'
        } as ScrollIntoViewOptions);
      } catch {
        btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }
  }

  const topThreeCommunities = snapshot.communityLeaderboard.slice(0, 3);
  const distinctDidsTotal = snapshot.rsiLeaderboardSummary.distinctDidsCount;
  const distinctAgentsTotal = snapshot.rsiLeaderboardSummary.distinctAgentHandlesCount;
  const listedCapsulesTotal = snapshot.rsiLeaderboardSummary.totalListedCapsules;

  const leaderboardTabs = [
    {
      id: 'communities',
      label: `Communities (${filteredCommunities.length})`
    },
    {
      id: 'dids',
      label: `DIDs (${filteredDids.length})`
    },
    {
      id: 'state-pods',
      label: `State Pods (${filteredPods.length})`
    }
  ] as const;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* COMPACT HEADER & LIVE COLLECTIVE KPIs */}
      <section className="glass-card emerald" aria-label="Leaderboard Overview">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Leaderboard</h1>
              <p className="text-muted" style={{ margin: '0.2rem 0 0', fontSize: '13px' }}>
                Live intelligence contributions across community Brain Stores, Chia DIDs, and regional pods.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {onRefresh ? (
                <button type="button" className="btn-spatial btn-glass" onClick={onRefresh}>
                  Refresh
                </button>
              ) : null}
              <Link to="/enlist" className="btn-spatial btn-pistachio">
                Join
              </Link>
            </div>
          </div>

          <div className="kpi-four-grid">
            <div className="glass-well">
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>COMMUNITIES</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.15rem' }} className="text-pistachio">
                {snapshot.loading ? '…' : snapshot.morphicFieldBrainsActive}
              </div>
              <div className="mono-xs text-jade" style={{ fontSize: '10px', marginTop: '0.12rem' }}>
                {snapshot.l1DiscoveredStoresTotal} Chia L1 Singletons
              </div>
            </div>

            <div className="glass-well">
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>VERIFIED .DIG</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.15rem' }} className="text-ivory">
                {snapshot.loading ? '…' : snapshot.liveCapsulesTotal.toLocaleString()}
              </div>
              <div className="mono-xs text-pistachio" style={{ fontSize: '10px', marginTop: '0.12rem' }}>
                Gen #{snapshot.dbrainGeneration} · 0% Forgetting
              </div>
            </div>

            <div className="glass-well">
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>CHIA DIDS</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.15rem' }} className="text-jade">
                {snapshot.loading ? '…' : distinctDidsTotal}
              </div>
              <div className="mono-xs text-bronze" style={{ fontSize: '10px', marginTop: '0.12rem' }}>
                {distinctAgentsTotal} Agents · {snapshot.enlistedNodesCount} Rigs
              </div>
            </div>

            <div className="glass-well">
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>ROYALTIES</div>
              <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.15rem' }} className="text-bronze">
                {snapshot.loading ? '…' : snapshot.royaltiesStreamedDig}
              </div>
              <div className="mono-xs text-pistachio" style={{ fontSize: '10px', marginTop: '0.12rem' }}>
                {listedCapsulesTotal} Listed Capsules
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TOP 3 PODIUM */}
      {topThreeCommunities.length > 0 ? (
        <section aria-label="Top 3 Communities">
          <div className="leaderboard-podium-grid">
            {topThreeCommunities.map((leader) => (
              <article
                key={leader.storeId}
                className={`leaderboard-podium-card rank-${leader.rank}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minInlineSize: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className={rankMedalClass(leader.rank)}>
                      #{String(leader.rank).padStart(2, '0')}
                    </span>
                    <span className="mono-xs text-pistachio">
                      {leader.rsiImpactScore.toLocaleString()} PTS
                    </span>
                  </div>

                  <h2 style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1.3 }}>
                    {leader.name}
                  </h2>

                  <div className="mono-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', minInlineSize: 0 }}>
                    <span style={{ flex: 'none' }}>DID:</span>
                    <MiddleEllipsis text={leader.agentDid || leader.storeId} tailChars={6} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <progress
                    className="monolith-progress"
                    max={100}
                    value={Math.max(3, leader.shareOfFieldPct)}
                    aria-label={`${leader.name} share of Morphic Field`}
                  />
                  <div className="mono-xs" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.35rem' }}>
                    <span className="text-pistachio">
                      <strong>{leader.verifiedCapsules.toLocaleString()}</strong> .dig ({leader.shareOfFieldPct}%)
                    </span>
                    <span className="text-jade">Gen #{leader.generation}</span>
                    <span className="text-bronze">
                      {leader.listedCapsulesCount > 0
                        ? `${leader.listedValueDig.toFixed(1)} $DIG`
                        : leader.source === 'chia-l1-datalayer-discovery'
                          ? 'Chia L1'
                          : 'Merkle WAL'}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {/* MAIN INTERACTIVE LEADERBOARD CARD: Search + 3-Tab Switcher + Sortable Responsive Tables */}
      <section
        className="glass-card"
        aria-label="Interactive Exocortex + Verifier-Driven Decentralized Recursive Self-Improvement Rankings"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="leaderboard-toolbar">
            <div
              className="spec-tablist"
              role="tablist"
              aria-label="Exocortex + Verifier-Driven Decentralized Recursive Self-Improvement Leaderboard Views"
              {...({ focusgroup: 'tablist nomemory' } as Record<string, string>)}
            >
              {leaderboardTabs.map((tab, idx) => {
                const selected = idx === activeTab;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[idx] = el;
                    }}
                    id={`lb-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    className="spec-tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    {...(selected ? ({ focusgroupstart: '' } as Record<string, string>) : {})}
                    onClick={() => selectTab(idx)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="leaderboard-search-box">
              <input
                type="search"
                className="spatial-input"
                placeholder="Filter communities, DIDs, or states…"
                aria-label="Filter leaderboard rows"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className="btn-spatial btn-glass"
                  style={{ paddingInline: '0.75rem' }}
                  onClick={() => setSearchQuery('')}
                >
                  Clear
                </button>
              ) : null}
            </div>
          </div>

          <div className="spec-tabpanel-grid">
            {/* TAB 0: BRAIN COMMUNITIES & STORES */}
            <div
              id="lb-panel-communities"
              role="tabpanel"
              aria-labelledby="lb-tab-communities"
              {...(activeTab !== 0
                ? supportsUntilFound
                  ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                  : { hidden: true }
                : {})}
              ref={(el) => {
                if (!el) return;
                const handler = () => setActiveTab(0);
                el.addEventListener('beforematch', handler);
                return () => el.removeEventListener('beforematch', handler);
              }}
            >
              <div className="tabpanel-inner" style={{ padding: '0.85rem' }}>
                <div ref={commTable.statusRef} role="status" className="visually-hidden" />
                {filteredCommunities.length === 0 ? (
                  <div className="glass-well mono-xs text-muted">
                    {snapshot.loading
                      ? 'Loading communities…'
                      : 'No communities matched your filter.'}
                  </div>
                ) : (
                  <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby={commTable.captionId}
                    className="leaderboard-table-wrapper"
                  >
                    <table
                      id={commTable.tableId}
                      ref={commTable.tableRef}
                      className="leaderboard-table"
                      style={
                        {
                          '--label-2': '"Governing Chia DID"',
                          '--label-3': '"Verified .dig"',
                          '--label-4': '"Field Share"',
                          '--label-5': '"DataLayer Gen"',
                          '--label-6': '"Listed $DIG"',
                          '--label-7': '"Impact Score"'
                        } as React.CSSProperties
                      }
                    >
                      <caption id={commTable.captionId}>
                        Community Brain Stores advancing exocortex + verifier-driven decentralized recursive self-improvement — click column headers to sort
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" data-type="number" aria-sort="ascending">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Rank &amp; Community</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col">Governing Chia DID</th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Verified .dig</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Field Share</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>DataLayer Gen</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Listed $DIG</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={commTable.onHeaderButtonClick}
                              {...({
                                commandfor: commTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Impact Score</span>
                              <SortChevron />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody key={communityRowSig} ref={commTable.tbodyRef}>
                        {filteredCommunities.map((c) => {
                          const didCopyId = `copy-comm-did-${c.rank}`;
                          return (
                            <tr key={c.storeId}>
                              <th scope="row" data-value={String(c.rank)}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', minInlineSize: 0 }}>
                                  <span className={rankMedalClass(c.rank)}>
                                    #{String(c.rank).padStart(2, '0')}
                                  </span>
                                  <div style={{ minInlineSize: 0 }}>
                                    <div style={{ fontWeight: 700, lineHeight: 1.3 }}>{c.name}</div>
                                    <div className="mono-xs text-muted" style={{ fontSize: '10px', marginTop: '0.18rem' }}>
                                      <MiddleEllipsis text={c.storeId} tailChars={6} /> ·{' '}
                                      <span className={c.source === 'chia-l1-datalayer-discovery' ? 'text-jade' : 'text-bronze'}>
                                        {c.source === 'chia-l1-datalayer-discovery' ? 'Chia L1 Singleton' : 'Merkle WAL'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </th>
                              <td>
                                {c.agentDid ? (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', maxInlineSize: '230px', minInlineSize: 0 }}>
                                    <span id={didCopyId} className="visually-hidden">
                                      {c.agentDid}
                                    </span>
                                    <MiddleEllipsis text={c.agentDid} tailChars={6} />
                                    <CopyCommandButton targetId={didCopyId} label="Copy" />
                                  </div>
                                ) : (
                                  <span className="mono-xs text-muted">—</span>
                                )}
                              </td>
                              <td data-value={String(c.verifiedCapsules)}>
                                <strong className="mono-sm text-pistachio">
                                  {c.verifiedCapsules.toLocaleString()}
                                </strong>
                              </td>
                              <td data-value={String(c.shareOfFieldPct)}>
                                <span className="mono-xs text-ivory">{c.shareOfFieldPct}%</span>
                              </td>
                              <td data-value={String(c.generation)}>
                                <span className="mono-xs text-jade">Gen #{c.generation.toLocaleString()}</span>
                              </td>
                              <td data-value={String(c.listedValueDig)}>
                                <span className="mono-xs text-bronze">
                                  {c.listedCapsulesCount > 0
                                    ? `${c.listedValueDig.toFixed(3)} $DIG (${c.listedCapsulesCount})`
                                    : '0.000 $DIG'}
                                </span>
                              </td>
                              <td data-value={String(c.rsiImpactScore)}>
                                <strong className="mono-sm text-pistachio">
                                  {c.rsiImpactScore.toLocaleString()}
                                </strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: CHIA DIDS & SOVEREIGN AGENTS */}
            <div
              id="lb-panel-dids"
              role="tabpanel"
              aria-labelledby="lb-tab-dids"
              {...(activeTab !== 1
                ? supportsUntilFound
                  ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                  : { hidden: true }
                : {})}
              ref={(el) => {
                if (!el) return;
                const handler = () => setActiveTab(1);
                el.addEventListener('beforematch', handler);
                return () => el.removeEventListener('beforematch', handler);
              }}
            >
              <div className="tabpanel-inner" style={{ padding: '0.85rem' }}>
                <div ref={didTable.statusRef} role="status" className="visually-hidden" />
                {filteredDids.length === 0 ? (
                  <div className="glass-well mono-xs text-muted">
                    {snapshot.loading
                      ? 'Loading DIDs…'
                      : 'No Chia DIDs matched your filter.'}
                  </div>
                ) : (
                  <div
                    tabIndex={0}
                    role="region"
                    aria-labelledby={didTable.captionId}
                    className="leaderboard-table-wrapper"
                  >
                    <table
                      id={didTable.tableId}
                      ref={didTable.tableRef}
                      className="leaderboard-table"
                      style={
                        {
                          '--label-2': '"Role & Active Agents"',
                          '--label-3': '"Communities / Pod"',
                          '--label-4': '"Verified .dig"',
                          '--label-5': '"Derivation Compute"',
                          '--label-6': '"Listed $DIG"',
                          '--label-7': '"Impact Score"'
                        } as React.CSSProperties
                      }
                    >
                      <caption id={didTable.captionId}>
                        Verified Digital Identities (Chia DIDs) advancing exocortex + verifier-driven decentralized recursive self-improvement — click column headers to sort
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col" data-type="number" aria-sort="ascending">
                            <button
                              type="button"
                              onClick={didTable.onHeaderButtonClick}
                              {...({
                                commandfor: didTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Rank &amp; Chia DID</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col">Role &amp; Active Agents</th>
                          <th scope="col">Communities / Pod</th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={didTable.onHeaderButtonClick}
                              {...({
                                commandfor: didTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Verified .dig</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={didTable.onHeaderButtonClick}
                              {...({
                                commandfor: didTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Derivation Compute</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={didTable.onHeaderButtonClick}
                              {...({
                                commandfor: didTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Listed $DIG</span>
                              <SortChevron />
                            </button>
                          </th>
                          <th scope="col" data-type="number">
                            <button
                              type="button"
                              onClick={didTable.onHeaderButtonClick}
                              {...({
                                commandfor: didTable.tableId,
                                command: '--sort'
                              } as Record<string, string>)}
                            >
                              <span>Impact Score</span>
                              <SortChevron />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody key={didRowSig} ref={didTable.tbodyRef}>
                        {filteredDids.map((d) => {
                          const didCopyId = `copy-did-row-${d.rank}`;
                          return (
                            <tr key={d.did}>
                              <th scope="row" data-value={String(d.rank)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minInlineSize: 0 }}>
                                  <span className={rankMedalClass(d.rank)}>
                                    #{String(d.rank).padStart(2, '0')}
                                  </span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minInlineSize: 0 }}>
                                    <span id={didCopyId} className="visually-hidden">
                                      {d.did}
                                    </span>
                                    <MiddleEllipsis text={d.did} tailChars={6} />
                                    <CopyCommandButton targetId={didCopyId} label="Copy" />
                                  </div>
                                </div>
                              </th>
                              <td>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.18rem', minInlineSize: 0 }}>
                                  <span className="mono-xs text-jade" style={{ fontWeight: 600 }}>
                                    {d.role}
                                  </span>
                                  {d.agentHandles.length > 0 ? (
                                    <span className="mono-xs text-muted" style={{ fontSize: '10px' }}>
                                      Agents: {d.agentHandles.slice(0, 4).join(', ')}
                                      {d.agentHandles.length > 4 ? ` +${d.agentHandles.length - 4}` : ''}
                                    </span>
                                  ) : null}
                                  {d.citizenCallsign ? (
                                    <a
                                      href={`/api/nousgent/card/${encodeURIComponent(d.citizenCallsign)}.svg`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mono-xs text-pistachio"
                                      style={{ fontSize: '10px' }}
                                    >
                                      Callsign {d.citizenCallsign} ({d.citizenXp.toLocaleString()} XP) ↗
                                    </a>
                                  ) : null}
                                </div>
                              </td>
                              <td>
                                <span className="mono-xs text-ivory" style={{ fontSize: '11px' }}>
                                  {d.communityNames.length > 0 ? d.communityNames.slice(0, 2).join(' · ') : 'Morphic Field'}
                                </span>
                              </td>
                              <td data-value={String(d.verifiedCapsules)}>
                                <strong className="mono-sm text-pistachio">
                                  {d.verifiedCapsules.toLocaleString()}
                                </strong>
                                {d.generationsCommitted > 0 ? (
                                  <span className="mono-xs text-muted" style={{ fontSize: '10px', marginInlineStart: '0.35rem' }}>
                                    (Gen #{d.generationsCommitted})
                                  </span>
                                ) : null}
                              </td>
                              <td data-value={String(d.derivationTokens)}>
                                <span className="mono-xs text-ivory">
                                  {d.derivationTokens > 0
                                    ? `${formatCompactTokens(d.derivationTokens)} tok`
                                    : d.citizenXp > 0
                                      ? `${d.citizenXp.toLocaleString()} PoST XP`
                                      : 'On-Chain Gen'}
                                </span>
                              </td>
                              <td data-value={String(d.marketValueDig)}>
                                <span className="mono-xs text-bronze">
                                  {d.liquidishListingsCount > 0
                                    ? `${d.marketValueDig.toFixed(3)} $DIG (${d.liquidishListingsCount})`
                                    : '0.000 $DIG'}
                                </span>
                              </td>
                              <td data-value={String(d.rsiImpactScore)}>
                                <strong className="mono-sm text-pistachio">
                                  {d.rsiImpactScore.toLocaleString()}
                                </strong>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* TAB 2: REGIONAL STATE CONSORTIUM PODS & ENLISTED CITIZEN RIGS */}
            <div
              id="lb-panel-state-pods"
              role="tabpanel"
              aria-labelledby="lb-tab-state-pods"
              {...(activeTab !== 2
                ? supportsUntilFound
                  ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                  : { hidden: true }
                : {})}
              ref={(el) => {
                if (!el) return;
                const handler = () => setActiveTab(2);
                el.addEventListener('beforematch', handler);
                return () => el.removeEventListener('beforematch', handler);
              }}
            >
              <div className="tabpanel-inner" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div ref={podTable.statusRef} role="status" className="visually-hidden" />
                <div
                  tabIndex={0}
                  role="region"
                  aria-labelledby={podTable.captionId}
                  className="leaderboard-table-wrapper"
                >
                  <table
                    id={podTable.tableId}
                    ref={podTable.tableRef}
                    className="leaderboard-table"
                    style={
                      {
                        '--label-2': '"Consortium Hub"',
                        '--label-3': '"Enlisted Rigs"',
                        '--label-4': '"Bonded PoST Storage"',
                        '--label-5': '"Status"'
                      } as React.CSSProperties
                    }
                  >
                    <caption id={podTable.captionId}>
                      Regional State Pods — click column headers to sort
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" data-type="number" aria-sort="ascending">
                          <button
                            type="button"
                            onClick={podTable.onHeaderButtonClick}
                            {...({
                              commandfor: podTable.tableId,
                              command: '--sort'
                            } as Record<string, string>)}
                          >
                            <span>Rank &amp; State</span>
                            <SortChevron />
                          </button>
                        </th>
                        <th scope="col">Consortium Hub</th>
                        <th scope="col" data-type="number">
                          <button
                            type="button"
                            onClick={podTable.onHeaderButtonClick}
                            {...({
                              commandfor: podTable.tableId,
                              command: '--sort'
                            } as Record<string, string>)}
                          >
                            <span>Enlisted Rigs</span>
                            <SortChevron />
                          </button>
                        </th>
                        <th scope="col" data-type="number">
                          <button
                            type="button"
                            onClick={podTable.onHeaderButtonClick}
                            {...({
                              commandfor: podTable.tableId,
                              command: '--sort'
                            } as Record<string, string>)}
                          >
                            <span>Bonded PoST Storage</span>
                            <SortChevron />
                          </button>
                        </th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody key={podRowSig} ref={podTable.tbodyRef}>
                      {filteredPods.map((pod) => (
                        <tr key={pod.stateCode}>
                          <th scope="row" data-value={String(pod.rank)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                              <span className={rankMedalClass(pod.rank)}>
                                #{String(pod.rank).padStart(2, '0')}
                              </span>
                              <strong>{pod.stateCode}</strong>
                            </div>
                          </th>
                          <td>
                            <span className="mono-xs text-ivory">
                              {pod.hubName} · <span className="text-muted">{pod.subtitle}</span>
                            </span>
                          </td>
                          <td data-value={String(pod.rigsCount)}>
                            <strong className={pod.rigsCount > 0 ? 'mono-sm text-pistachio' : 'mono-sm text-muted'}>
                              {pod.rigsCount.toLocaleString()}
                            </strong>
                          </td>
                          <td data-value={String(pod.storagePb)}>
                            <span className="mono-xs text-jade">{pod.storagePb.toFixed(2)} PB</span>
                          </td>
                          <td>
                            {pod.rigsCount > 0 ? (
                              <span className="pill-badge pistachio">● ACTIVE MESH</span>
                            ) : (
                              <Link to="/enlist" className="mono-xs text-bronze">
                                Awaiting First Pod → Enlist
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {snapshot.enlistedRigs.length > 0 ? (
                  <div className="glass-well" style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    <div className="mono-xs text-pistachio">RECENTLY ENLISTED CITIZEN KEYHOLDERS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.65rem' }}>
                      {snapshot.enlistedRigs.slice(0, 6).map((rig) => (
                        <div
                          key={rig.callsign}
                          style={{
                            padding: '0.65rem 0.75rem',
                            borderRadius: '10px',
                            border: '1px solid var(--color-outline)',
                            background: 'var(--color-void)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.22rem',
                            minInlineSize: 0
                          }}
                        >
                          <div className="mono-xs" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <strong className="text-pistachio">{rig.callsign}</strong>
                            <span className="text-jade">{rig.xp.toLocaleString()} XP</span>
                          </div>
                          <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>
                            {rig.rank.title} · {rig.stateCode} ({rig.executionEnv})
                          </div>
                          <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>
                            <MiddleEllipsis text={rig.did} tailChars={6} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CITATION-DAG ROYALTY WATERFALL */}
      <section className="glass-card cyan" aria-label="Citation-DAG Royalty Split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.65rem' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
              Citation-DAG Royalty Split (<code>$DIG</code>)
            </h2>
            <Link to="/enlist" className="btn-spatial btn-pistachio">
              Join Communities
            </Link>
          </div>

          <div className="kpi-four-grid">
            {ROYALTY_WATERFALL_SPLITS.map((item) => (
              <div key={item.tier} className="glass-well">
                <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>{item.tier}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, marginTop: '0.15rem' }} className="text-pistachio">
                  {item.pct}
                </div>
                <div className="mono-xs text-ivory" style={{ fontSize: '10.5px', marginTop: '0.12rem' }}>
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
