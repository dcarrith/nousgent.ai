import { useState } from 'react';
import { playQuindarBeep } from '../hooks/useNousgentMission';
import { SwarmMissionItem } from '../data/mockData';

export interface TwoKeyClearSignCellProps {
  readonly mission: SwarmMissionItem;
  readonly colClass?: string;
  readonly onSigned?: () => void;
}

export function TwoKeyClearSignCell({
  mission,
  colClass = 'col-6',
  onSigned
}: Readonly<TwoKeyClearSignCellProps>) {
  const nativeSwitchSupported =
    typeof HTMLInputElement !== 'undefined' && 'switch' in HTMLInputElement.prototype;

  const [keyAArmed, setKeyAArmed] = useState<boolean>(true);
  const [keyBArmed, setKeyBArmed] = useState<boolean>(true);
  const [signerCallsign, setSignerCallsign] = useState<string>('NOUSGENT-IL-0001');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [attestationHash, setAttestationHash] = useState<string>('');
  const [localQuorumSigs, setLocalQuorumSigs] = useState<number>(mission.quorumSignatures);

  const quorumPct = Math.min(100, Number(((localQuorumSigs / mission.quorumTarget) * 100).toFixed(1)));

  async function handleExecuteClearSign(): Promise<void> {
    if (!keyAArmed || !keyBArmed) {
      playQuindarBeep(2475);
      setStatusMessage('INTERLOCK HALT: Arm both KEY A (Citizen) and KEY B (Swarm) switches before co-signing.');
      return;
    }
    playQuindarBeep(2525);
    try {
      const res = await fetch('/api/nousgent/missions/clear-sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission.missionId,
          keyAArmed,
          keyBArmed,
          signerCallsign
        })
      });
      const data = await res.json();
      if (data.ok) {
        setLocalQuorumSigs(data.quorumSignatures);
        setAttestationHash(data.attestationHash);
        setStatusMessage(`CO-SIGNED ${data.missionId}: ${data.quorumSignatures}/${data.quorumTarget} (${data.status})`);
        if (onSigned) onSigned();
      } else {
        setStatusMessage(data.error || 'CHIP-0043 interlock rejected unsigned payload.');
      }
    } catch {
      const next = localQuorumSigs + 1;
      setLocalQuorumSigs(next);
      setStatusMessage(`OFFLINE QUORUM SIMULATION: ${next}/${mission.quorumTarget} CHIP-0043 Passkey Signatures.`);
    }
  }

  return (
    <section className={`spec-cell ${colClass}`} aria-label="CHIP-0043 Two-Key Clear-Sign Quorum">
      <div className="spec-cell-header">
        <span className="spec-label">CELL 05 // TWO-KEY CHIP-0043 CLEAR-SIGN QUORUM</span>
        <span className="spec-mono text-vermilion">HARDWARE INTERLOCK</span>
      </div>
      <div className="spec-cell-body">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong>{mission.missionId}: {mission.title}</strong>
            <span className="spec-mono text-emerald">POOL: {mission.rewardDig} $DIG</span>
          </div>
          <p className="text-muted" style={{ margin: '0.35rem 0 0', fontSize: '13px' }}>
            {mission.summary}
          </p>
        </div>

        <div className="grid-12" style={{ gap: '0.75rem' }}>
          <label className="apollo-switch-label col-6">
            <div>
              <div className="spec-label">KEY A // CITIZEN VERMILION ARM</div>
              <div className="spec-mono text-vermilion" style={{ marginTop: '0.2rem' }}>
                {keyAArmed ? 'ARMED (WEBAUTHN P-256)' : 'SAFE / LOCKED'}
              </div>
            </div>
            <input
              type="checkbox"
              className={`apollo-switch-input vermilion${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
              {...({ switch: '' } as Record<string, string>)}
              role={nativeSwitchSupported ? undefined : 'switch'}
              checked={keyAArmed}
              onChange={(e) => setKeyAArmed(e.target.checked)}
            />
          </label>

          <label className="apollo-switch-label col-6">
            <div>
              <div className="spec-label">KEY B // SWARM COBALT TELEMETRY</div>
              <div className="spec-mono text-cobalt" style={{ marginTop: '0.2rem' }}>
                {keyBArmed ? 'ARMED (BLS12-381 G2)' : 'SAFE / LOCKED'}
              </div>
            </div>
            <input
              type="checkbox"
              className={`apollo-switch-input${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
              {...({ switch: '' } as Record<string, string>)}
              role={nativeSwitchSupported ? undefined : 'switch'}
              checked={keyBArmed}
              onChange={(e) => setKeyBArmed(e.target.checked)}
            />
          </label>
        </div>

        <div className="metric-tile">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
            <span className="spec-label">FIDO2 PASSKEY + BLS12-381 QUORUM PROGRESS</span>
            <span className="spec-mono text-cobalt">
              {localQuorumSigs} / {mission.quorumTarget} SIGNATURES ({quorumPct}%)
            </span>
          </div>
          <div className="quorum-track" role="progressbar" aria-valuenow={quorumPct} aria-valuemin={0} aria-valuemax={100}>
            <div className="quorum-fill" style={{ width: `${quorumPct}%` }} />
          </div>
          <div className="spec-mono text-muted" style={{ marginTop: '0.45rem', wordBreak: 'break-all' }}>
            PAYLOAD: {mission.clearSignUr}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="spec-input"
            style={{ flex: '1 1 200px' }}
            value={signerCallsign}
            onChange={(e) => setSignerCallsign(e.target.value)}
            aria-label="Citizen Signer Callsign"
          />
          <button type="button" className="btn-spec btn-cobalt" onClick={() => void handleExecuteClearSign()}>
            CO-SIGN BOUNDED ASI SWARM RUN
          </button>
        </div>

        {statusMessage ? (
          <div className="metric-tile metric-tile-emerald" role="status">
            <div className="spec-mono text-emerald">{statusMessage}</div>
            {attestationHash ? (
              <div className="spec-mono text-muted" style={{ marginTop: '0.25rem', wordBreak: 'break-all' }}>
                ATTESTATION: {attestationHash}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
