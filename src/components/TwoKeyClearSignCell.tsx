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
  colClass = 'col-12',
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
      setStatusMessage('INTERLOCK HALT: Arm both KEY A (Raider FIDO2) and KEY B (Swarm BLS) switches first.');
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
        setStatusMessage(`✓ CO-SIGNED ${data.missionId}: ${data.quorumSignatures}/${data.quorumTarget} (${data.status})`);
        if (onSigned) onSigned();
      } else {
        setStatusMessage(data.error || 'CHIP-0043 interlock rejected unsigned payload.');
      }
    } catch {
      const next = localQuorumSigs + 1;
      setLocalQuorumSigs(next);
      setStatusMessage(`✓ OFFLINE QUORUM SIMULATION: ${next}/${mission.quorumTarget} CHIP-0043 Passkey Signatures.`);
    }
  }

  return (
    <section className={`chamfer-plate ${colClass}`} aria-label="CHIP-0043 Two-Key Clear-Sign Quorum">
      <div className="arena-header-strip cyan">
        <div>
          <span className="hud-ticker text-cyan">FIDO2 PASSKEY + BLS12-381 AIRGAP INTERLOCK</span>
          <h3 className="hud-headline">{mission.missionId}: {mission.title}</h3>
        </div>
        <span className="hud-mono text-volt">REWARD: {mission.rewardDig} $DIG</span>
      </div>

      <div className="grid-12" style={{ gap: '0.75rem' }}>
        <label className="hud-switch-label col-6">
          <div>
            <div className="hud-ticker text-volt">KEY A // RAIDER FIDO2 PASSKEY</div>
            <div className="hud-mono text-muted" style={{ marginTop: '0.2rem' }}>
              {keyAArmed ? '✓ ARMED (WEBAUTHN P-256)' : '✕ SAFE / LOCKED'}
            </div>
          </div>
          <input
            type="checkbox"
            className={`hud-switch-input${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
            {...({ switch: '' } as Record<string, string>)}
            role={nativeSwitchSupported ? undefined : 'switch'}
            checked={keyAArmed}
            onChange={(e) => setKeyAArmed(e.target.checked)}
          />
        </label>

        <label className="hud-switch-label col-6">
          <div>
            <div className="hud-ticker text-cyan">KEY B // SWARM BLS TELEMETRY</div>
            <div className="hud-mono text-muted" style={{ marginTop: '0.2rem' }}>
              {keyBArmed ? '✓ ARMED (BLS12-381 G2)' : '✕ SAFE / LOCKED'}
            </div>
          </div>
          <input
            type="checkbox"
            className={`hud-switch-input cyan${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
            {...({ switch: '' } as Record<string, string>)}
            role={nativeSwitchSupported ? undefined : 'switch'}
            checked={keyBArmed}
            onChange={(e) => setKeyBArmed(e.target.checked)}
          />
        </label>
      </div>

      <div className="chamfer-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
          <span className="hud-ticker">QUORUM CONVERGENCE</span>
          <span className="hud-mono text-cyan">
            {localQuorumSigs} / {mission.quorumTarget} KEYS ({quorumPct}%)
          </span>
        </div>
        <progress
          className="hud-progress cyan"
          max={100}
          value={quorumPct}
          aria-label={`CHIP-0043 Quorum Progress for ${mission.missionId}`}
        />
        <div className="hud-mono text-muted" style={{ marginTop: '0.4rem', fontSize: '11px', wordBreak: 'break-all' }}>
          URI: {mission.clearSignUr}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className="hud-input"
          style={{ flex: '1 1 200px' }}
          value={signerCallsign}
          onChange={(e) => setSignerCallsign(e.target.value)}
          aria-label="Combatant Signer Callsign"
        />
        <button
          type="button"
          className="btn-hud btn-volt"
          style={{ flex: '2 1 280px', fontSize: '13px' }}
          onClick={() => void handleExecuteClearSign()}
        >
          🔑 TURN YOUR CHIP-0043 CLEAR-SIGN KEY ({localQuorumSigs}/{mission.quorumTarget})
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="hud-ticker text-volt" style={{ background: 'var(--color-surface-high)', padding: '0.2rem 0.45rem', fontSize: '10px' }}>IL SQUAD SIGNED</span>
          <span className="hud-ticker text-cyan" style={{ background: 'var(--color-surface-high)', padding: '0.2rem 0.45rem', fontSize: '10px' }}>TX SQUAD SIGNED</span>
          <span className="hud-ticker text-volt" style={{ background: 'var(--color-surface-high)', padding: '0.2rem 0.45rem', fontSize: '10px' }}>WY VAULT SIGNED</span>
          <span className="hud-ticker" style={{ background: 'var(--color-surface-high)', padding: '0.2rem 0.45rem', fontSize: '10px' }}>CA SQUAD SIGNED</span>
        </div>
        <span className="hud-ticker text-cyan" style={{ fontSize: '10px' }}>FIDO2 QUORUM REQUIRED</span>
      </div>

      {statusMessage ? (
        <div className="chamfer-card" role="status" style={{ borderColor: 'var(--color-volt)' }}>
          <div className="hud-mono text-volt">{statusMessage}</div>
          {attestationHash ? (
            <div className="hud-mono text-muted" style={{ marginTop: '0.25rem', fontSize: '11px', wordBreak: 'break-all' }}>
              ATTESTATION: {attestationHash}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
