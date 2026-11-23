import React, { useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TwoKeyClearSignCell } from '../components/TwoKeyClearSignCell';
import { MissionSnapshot, playQuindarBeep } from '../hooks/useNousgentMission';

export interface MissionsQuorumPageProps {
  readonly snapshot: MissionSnapshot;
  readonly onRefresh: () => void;
}

type SigningPanelTab = 'dao_vote' | 'two_key_sign';
type VoteSupportChoice = 'FOR' | 'AGAINST' | 'ABSTAIN';

const SIGNING_TABS: readonly { readonly id: SigningPanelTab; readonly label: string }[] = [
  { id: 'dao_vote', label: '1. DAO Vote' },
  { id: 'two_key_sign', label: '2. Two-Key Sign-Off' }
];

const VOTE_CHOICES: readonly { readonly value: VoteSupportChoice; readonly label: string }[] = [
  { value: 'FOR', label: 'For' },
  { value: 'AGAINST', label: 'Against' },
  { value: 'ABSTAIN', label: 'Abstain' }
];

function formatMissionStatusLabel(status: string): string {
  if (status === 'CHIP0043_QUORUM_SEALED') return 'Sealed';
  if (status === 'DAO_APPROVED_AWAITING_SIGNING') return 'Vote Passed · Sign-Off';
  if (status === 'DAO_VOTING_OPEN') return 'Voting Open';
  if (status === 'ACTIVE_SWARM_HARVEST') return 'Active';
  return 'Awaiting Sign-Off';
}

export function MissionsQuorumPage({ snapshot, onRefresh }: Readonly<MissionsQuorumPageProps>) {
  const formUid = useId();
  const location = useLocation();
  const supportsFocusGroup =
    typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'focusGroup');
  const supportsUntilFound =
    typeof HTMLElement !== 'undefined' && 'onbeforematch' in HTMLElement.prototype;

  const [selectedMissionId, setSelectedMissionId] = useState<string>(() =>
    new URLSearchParams(location.search).get('mission') || ''
  );
  const [rightTab, setRightTab] = useState<SigningPanelTab>('dao_vote');

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get('mission');
    if (requested) {
      setSelectedMissionId(requested);
    }
  }, [location.search]);

  // DAO Vote form state
  const [support, setSupport] = useState<VoteSupportChoice>('FOR');
  const [voterDid, setVoterDid] = useState<string>(() => snapshot.enlistedRigs[0]?.did || 'did:chia:1citizenkeyholder');
  const [didTouched, setDidTouched] = useState<boolean>(false);
  const [didError, setDidError] = useState<string>('');
  const [stakeDig, setStakeDig] = useState<string>('1000.000');
  const [voting, setVoting] = useState<boolean>(false);
  const [voteFeedback, setVoteFeedback] = useState<{
    readonly ok: boolean;
    readonly message: string;
    readonly nullifierHash?: string;
  } | null>(null);

  // DAO Proposal form state
  const [propTitle, setPropTitle] = useState<string>('');
  const [propTitleTouched, setPropTitleTouched] = useState<boolean>(false);
  const [propTitleError, setPropTitleError] = useState<string>('');
  const [propCategory, setPropCategory] = useState<string>('CAPABILITY_SYNTHESIS');
  const [propProposerDid, setPropProposerDid] = useState<string>('did:chia:1citizenproposer');
  const [propRewardDig, setPropRewardDig] = useState<string>('25000.000');
  const [propSummary, setPropSummary] = useState<string>('');
  const [proposing, setProposing] = useState<boolean>(false);
  const [proposeFeedback, setProposeFeedback] = useState<string>('');

  const voterDidRef = useRef<HTMLInputElement | null>(null);
  const propTitleRef = useRef<HTMLInputElement | null>(null);
  const tabRefs = useRef<Record<SigningPanelTab, HTMLButtonElement | null>>({
    dao_vote: null,
    two_key_sign: null
  });

  const activeMission =
    snapshot.missions.find((m) => m.missionId === selectedMissionId) || snapshot.missions[0];

  if (!activeMission) {
    return (
      <div className="glass-card mono-xs text-muted">
        {snapshot.loading ? 'Loading governance…' : 'No active missions.'}
      </div>
    );
  }

  function selectSigningTab(next: SigningPanelTab, focusButton = false): void {
    setRightTab(next);
    const btn = tabRefs.current[next];
    if (btn) {
      btn.scrollIntoView({
        block: 'nearest',
        inline: 'nearest',
        container: 'nearest'
      } as ScrollIntoViewOptions);
      if (focusButton) {
        btn.focus();
      }
    }
  }

  function handleSigningTabKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (supportsFocusGroup) return;
    const curIdx = SIGNING_TABS.findIndex((t) => t.id === rightTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      selectSigningTab(SIGNING_TABS[(curIdx + 1) % SIGNING_TABS.length].id, true);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      selectSigningTab(SIGNING_TABS[(curIdx - 1 + SIGNING_TABS.length) % SIGNING_TABS.length].id, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      selectSigningTab(SIGNING_TABS[0].id, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      selectSigningTab(SIGNING_TABS[SIGNING_TABS.length - 1].id, true);
    }
  }

  function validateDid(val: string): string {
    const trimmed = val.trim();
    if (!trimmed.startsWith('did:chia:') || trimmed.length < 12) {
      return 'Enter a Chia DID starting with did:chia: (at least 12 characters).';
    }
    return '';
  }

  async function handleCastDaoVote(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const err = validateDid(voterDid);
    if (err) {
      setDidError(err);
      voterDidRef.current?.focus();
      return;
    }

    const targetMissionId = activeMission.missionId;
    setSelectedMissionId(targetMissionId);
    setVoting(true);
    setVoteFeedback(null);
    playQuindarBeep(2525);

    try {
      const res = await fetch('/api/nousgent/dao/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: targetMissionId,
          voterDid: voterDid.trim(),
          support,
          stakeDig: stakeDig.trim()
        })
      });
      const data = await res.json();
      if (data.ok) {
        const xpNote =
          Number(data.xpBonusCatMojos || 0) > 0
            ? ` (+${(Number(data.xpBonusCatMojos) / 1000).toFixed(3)} $DIG XP bonus)`
            : '';
        setVoteFeedback({
          ok: true,
          message: `✓ Recorded ${data.support} vote (${data.weightDig} $DIG${xpNote}) on ${data.missionId}.`,
          nullifierHash: data.nullifierHash
        });
        onRefresh();
      } else {
        setVoteFeedback({
          ok: false,
          message: data.error || 'Vote rejected by community governance.',
          nullifierHash: data.nullifierHash
        });
      }
    } catch {
      setVoteFeedback({ ok: false, message: 'DAO governance API unreachable.' });
    } finally {
      setVoting(false);
    }
  }

  async function handleCreateProposal(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const cleanTitle = propTitle.trim();
    if (cleanTitle.length < 4) {
      setPropTitleError('Enter a mission title of at least 4 characters.');
      propTitleRef.current?.focus();
      return;
    }

    setProposing(true);
    setProposeFeedback('');
    playQuindarBeep(2525);

    try {
      const res = await fetch('/api/nousgent/dao/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          category: propCategory,
          proposerDid: propProposerDid.trim(),
          rewardDig: propRewardDig.trim(),
          summary: propSummary.trim()
        })
      });
      const data = await res.json();
      if (data.ok && data.mission) {
        setPropTitle('');
        setPropTitleTouched(false);
        setPropSummary('');
        setSelectedMissionId(data.mission.missionId);
        setProposeFeedback(`✓ Created ${data.mission.missionId}`);
        onRefresh();
      } else {
        setProposeFeedback(data.error || 'Proposal rejected.');
      }
    } catch {
      setProposeFeedback('DAO proposal API unreachable.');
    } finally {
      setProposing(false);
    }
  }

  const dao = activeMission.dao;
  const tabIdFor = (t: SigningPanelTab) => `${formUid}-signing-tab-${t}`;

  return (
    <div className="bento-grid" style={{ alignItems: 'start' }}>
      <section className="glass-card col-7" aria-label="Upgrade Proposals and Missions">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Signing</h1>
            <span className="pill-badge cyan">Community Vote · Two-Key Sign-Off</span>
          </div>

          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>
            Vote on proposed NOUSGENT upgrades with your Chia identity and <code>$DIG</code> stake, then approve winning upgrades with two-key human sign-off.
          </p>

          <details className="glass-well" style={{ padding: '0.75rem 0.9rem' }}>
            <summary id="dao-propose-heading" className="mono-xs text-pistachio" style={{ cursor: 'pointer', fontWeight: 700 }}>
              + Propose Upgrade Mission
            </summary>
            <form
              action="/api/nousgent/dao/proposals"
              method="POST"
              aria-labelledby="dao-propose-heading"
              onSubmit={(e) => void handleCreateProposal(e)}
              className="dao-form-stack"
              style={{ marginTop: '0.75rem' }}
            >
              <div className="dao-form-field">
                <label htmlFor={`${formUid}-prop-title`}>
                  Mission Title <span aria-hidden="true">*</span>
                </label>
                <input
                  ref={propTitleRef}
                  type="text"
                  id={`${formUid}-prop-title`}
                  name="title"
                  className="spatial-input"
                  required
                  minLength={4}
                  maxLength={96}
                  aria-invalid={propTitleError ? 'true' : undefined}
                  aria-describedby={propTitleError ? `${formUid}-prop-title-err` : undefined}
                  value={propTitle}
                  onChange={(e) => {
                    setPropTitle(e.target.value);
                    setPropTitleTouched(true);
                    if (propTitleError) setPropTitleError('');
                  }}
                  onBlur={() => {
                    if (propTitleTouched && propTitle.trim().length < 4) {
                      setPropTitleError('Enter a mission title of at least 4 characters.');
                    }
                  }}
                />
                {propTitleError ? (
                  <span id={`${formUid}-prop-title-err`} role="alert" className="mono-xs text-rose">
                    ⚠ {propTitleError}
                  </span>
                ) : null}
              </div>

              <div className="dao-two-col-fields">
                <div className="dao-form-field">
                  <label htmlFor={`${formUid}-prop-cat`}>Category</label>
                  <select
                    id={`${formUid}-prop-cat`}
                    name="category"
                    className="spatial-input"
                    value={propCategory}
                    onChange={(e) => setPropCategory(e.target.value)}
                  >
                    <option value="CAPABILITY_SYNTHESIS">Capability Synthesis</option>
                    <option value="IMMUNE_ANTIBODY">Immune Antibody</option>
                    <option value="DREAM_CONSOLIDATION">Dream Consolidation</option>
                    <option value="LOCAL_HALO_BENCHMARK">Local Node Benchmark</option>
                  </select>
                </div>

                <div className="dao-form-field">
                  <label htmlFor={`${formUid}-prop-reward`}>Reward ($DIG)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    id={`${formUid}-prop-reward`}
                    name="rewardDig"
                    className="spatial-input"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={propRewardDig}
                    onChange={(e) => setPropRewardDig(e.target.value)}
                  />
                </div>
              </div>

              <div className="dao-form-field">
                <label htmlFor={`${formUid}-prop-did`}>Proposer Chia DID</label>
                <input
                  type="text"
                  id={`${formUid}-prop-did`}
                  name="proposerDid"
                  className="spatial-input"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={propProposerDid}
                  onChange={(e) => setPropProposerDid(e.target.value)}
                />
              </div>

              <div className="dao-form-field">
                <label htmlFor={`${formUid}-prop-summary`}>Objective</label>
                <textarea
                  id={`${formUid}-prop-summary`}
                  name="summary"
                  rows={2}
                  maxLength={280}
                  className="spatial-input"
                  value={propSummary}
                  onChange={(e) => setPropSummary(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {proposeFeedback ? (
                  <span role="status" className="mono-xs text-pistachio">
                    {proposeFeedback}
                  </span>
                ) : (
                  <span className="mono-xs text-muted">Recorded in community DAO governance</span>
                )}
                <button type="submit" className="btn-spatial btn-pistachio" disabled={proposing}>
                  {proposing ? 'Submitting…' : 'Create Proposal'}
                </button>
              </div>
            </form>
          </details>

          {snapshot.missions.map((m) => {
            const active = m.missionId === activeMission.missionId;
            const mDao = m.dao;
            return (
              <div
                key={m.missionId}
                className="glass-well"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  borderColor: active ? 'rgb(126 217 87 / 0.55)' : 'var(--color-outline)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{m.missionId} // {m.title}</span>
                  <span className="mono-xs text-emerald" style={{ fontWeight: 700 }}>{m.rewardDig} $DIG</span>
                </div>

                <div className="text-muted" style={{ fontSize: '12.5px' }}>{m.summary}</div>

                <progress
                  className="monolith-progress violet"
                  max={100}
                  value={mDao ? mDao.quorumPct : m.progressPct}
                  aria-label={`DAO quorum for ${m.title}`}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
                  <div className="mono-xs text-muted" style={{ fontSize: '10.5px' }}>
                    <span className="text-pistachio">{mDao?.votesForDig || '0.000'} For</span>
                    {' · '}
                    <span>{mDao?.votesAgainstDig || '0.000'} Against</span>
                    {' · '}
                    <span className="text-cyan">{m.quorumSignatures}/{m.quorumTarget} Signed</span>
                    {' · '}
                    <span className="text-bronze">{formatMissionStatusLabel(m.status)}</span>
                  </div>
                  <button
                    type="button"
                    className={`btn-spatial ${active ? 'btn-pistachio' : 'btn-glass'}`}
                    onClick={() => {
                      setSelectedMissionId(m.missionId);
                      setVoteFeedback(null);
                    }}
                  >
                    {active ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section
        className={`glass-card ${rightTab === 'dao_vote' ? 'emerald' : 'cyan'} col-5`}
        aria-label="Mission Voting and Two-Key Sign-Off"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div
            className="spec-tablist"
            role={supportsFocusGroup ? undefined : 'tablist'}
            aria-label="Approval Steps"
            onKeyDown={handleSigningTabKeyDown}
            {...({ focusgroup: 'tablist nomemory' } as Record<string, string>)}
          >
            {SIGNING_TABS.map((tab) => {
              const selected = rightTab === tab.id;
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    tabRefs.current[tab.id] = el;
                  }}
                  id={tabIdFor(tab.id)}
                  type="button"
                  role={supportsFocusGroup ? undefined : 'tab'}
                  className="spec-tab"
                  aria-selected={selected}
                  tabIndex={supportsFocusGroup ? undefined : selected ? 0 : -1}
                  {...(selected ? ({ focusgroupstart: '' } as Record<string, string>) : {})}
                  onClick={() => selectSigningTab(tab.id)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="spec-tabpanel-grid" style={{ alignItems: 'start' }}>
            {/* TAB PANEL 1: DAO VOTE */}
            <div
              role="tabpanel"
              aria-labelledby={tabIdFor('dao_vote')}
              {...(rightTab !== 'dao_vote'
                ? supportsUntilFound
                  ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                  : { hidden: true }
                : {})}
              ref={(el) => {
                if (!el) return;
                const handler = () => setRightTab('dao_vote');
                el.addEventListener('beforematch', handler);
                return () => el.removeEventListener('beforematch', handler);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingTop: '0.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h2 id="dao-vote-heading" style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    DAO Vote · {activeMission.missionId}
                  </h2>
                  <span className="pill-badge bronze">{dao?.category.replace(/_/g, ' ') || 'GOVERNANCE'}</span>
                </div>

                <div className="glass-well" style={{ padding: '0.65rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span className="mono-xs text-muted">Vote Target: {dao?.quorumTargetDig || '10000.000'} $DIG</span>
                    <span className="mono-xs text-pistachio">{dao?.voterCount || 0} Voters ({dao?.quorumPct || 0}%)</span>
                  </div>
                  <progress
                    className="monolith-progress"
                    max={100}
                    value={dao?.quorumPct || 0}
                    aria-label={`DAO quorum progress for ${activeMission.missionId}`}
                  />
                  {dao?.proposalPuzzleHash ? (
                    <div className="mono-xs text-muted" style={{ fontSize: '10px', overflowWrap: 'anywhere' }}>
                      Contract: {dao.proposalPuzzleHash.slice(0, 18)}…{dao.proposalPuzzleHash.slice(-8)}
                    </div>
                  ) : null}
                </div>

                <form
                  action="/api/nousgent/dao/vote"
                  method="POST"
                  aria-labelledby="dao-vote-heading"
                  onSubmit={(e) => void handleCastDaoVote(e)}
                  className="dao-form-stack"
                >
                  <fieldset className="dao-radio-fieldset">
                    <legend className="mono-xs text-muted">Ballot Choice</legend>
                    <div className="dao-radio-row">
                      {VOTE_CHOICES.map((opt) => {
                        const radioId = `${formUid}-vote-${opt.value.toLowerCase()}`;
                        return (
                          <div key={opt.value} className="dao-radio-option">
                            <input
                              type="radio"
                              id={radioId}
                              name="support"
                              value={opt.value}
                              className="dao-radio-input"
                              checked={support === opt.value}
                              onChange={() => setSupport(opt.value)}
                            />
                            <label htmlFor={radioId} className="dao-radio-label">
                              <span>{opt.label}</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="dao-form-field">
                    <label htmlFor={`${formUid}-voter-did`}>
                      Voter Chia DID <span aria-hidden="true">*</span>
                    </label>
                    <input
                      ref={voterDidRef}
                      type="text"
                      id={`${formUid}-voter-did`}
                      name="voterDid"
                      className="spatial-input"
                      required
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      aria-invalid={didError ? 'true' : undefined}
                      aria-describedby={didError ? `${formUid}-did-err ${formUid}-did-hint` : `${formUid}-did-hint`}
                      value={voterDid}
                      onChange={(e) => {
                        setVoterDid(e.target.value);
                        setDidTouched(true);
                        if (didError) setDidError('');
                      }}
                      onBlur={() => {
                        if (didTouched) {
                          setDidError(validateDid(voterDid));
                        }
                      }}
                    />
                    <span id={`${formUid}-did-hint`} className="mono-xs text-muted" style={{ fontSize: '10px' }}>
                      One vote per Chia identity per mission (duplicate ballots are automatically blocked).
                    </span>
                    {didError ? (
                      <span id={`${formUid}-did-err`} role="alert" className="mono-xs text-rose">
                        ⚠ {didError}
                      </span>
                    ) : null}
                  </div>

                  <div className="dao-form-field">
                    <label htmlFor={`${formUid}-stake-dig`}>
                      Stake Weight ($DIG · 1 $DIG = 1,000 CAT2 mojos)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      id={`${formUid}-stake-dig`}
                      name="stakeDig"
                      className="spatial-input"
                      required
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={stakeDig}
                      onChange={(e) => setStakeDig(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn-spatial btn-pistachio" disabled={voting} style={{ width: '100%' }}>
                    {voting ? 'Recording Vote…' : 'Cast Vote'}
                  </button>

                  {voteFeedback ? (
                    <div
                      role="status"
                      className="glass-well"
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderColor: voteFeedback.ok ? 'rgb(126 217 87 / 0.45)' : 'rgb(251 113 133 / 0.5)'
                      }}
                    >
                      <div className={`mono-xs ${voteFeedback.ok ? 'text-pistachio' : 'text-rose'}`}>
                        {voteFeedback.message}
                      </div>
                      {voteFeedback.nullifierHash ? (
                        <div className="mono-xs text-muted" style={{ marginTop: '0.18rem', fontSize: '10px', overflowWrap: 'anywhere' }}>
                          Receipt: {voteFeedback.nullifierHash}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </form>
              </div>
            </div>

            {/* TAB PANEL 2: TWO-KEY HUMAN SIGN-OFF */}
            <div
              role="tabpanel"
              aria-labelledby={tabIdFor('two_key_sign')}
              {...(rightTab !== 'two_key_sign'
                ? supportsUntilFound
                  ? ({ hidden: 'until-found' } as unknown as Record<string, string>)
                  : { hidden: true }
                : {})}
              ref={(el) => {
                if (!el) return;
                const handler = () => setRightTab('two_key_sign');
                el.addEventListener('beforematch', handler);
                return () => el.removeEventListener('beforematch', handler);
              }}
            >
              <TwoKeyClearSignCell
                embedded
                key={activeMission.missionId}
                mission={activeMission}
                onSigned={onRefresh}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
