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
  colClass = 'col-5',
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
      setStatusMessage('INTERLOCK HALT: Enable both Key A (FIDO2 Passkey) and Key B (Swarm BLS) switches.');
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
    <section className={`glass-card cyan ${colClass}`} aria-label="CHIP-0043 Swarm Clear-Sign Ceremony">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600 }}>
            <span className="text-cyan" aria-hidden="true">⛨ </span>
            CHIP-0043 Clear-Sign
          </h3>
          <span className="pill-badge emerald">AIR-GAP SYNC</span>
        </div>

        <p className="text-muted" style={{ margin: 0 }}>
          Decentralized air-gap validation ceremony for <strong>{mission.missionId}</strong> ({mission.rewardDig} $DIG). Co-sign weights using your hardware FIDO2 passkey via UR-encoded glyphs.
        </p>

        {/* Holographic Animated QR Visualizer Box */}
        <div className="glass-well" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: 128,
              height: 128,
              padding: '0.5rem',
              borderRadius: '12px',
              background: 'var(--color-surface-container)',
              border: '1px solid rgb(123 208 255 / 0.35)',
              boxShadow: '0 0 22px rgb(0 166 224 / 0.2)',
              marginBottom: '0.55rem'
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%" fill="#7bd0ff" aria-hidden="true">
              <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="#7bd0ff" strokeWidth="4" />
              <rect x="11" y="11" width="13" height="13" rx="2" />
              <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="#7bd0ff" strokeWidth="4" />
              <rect x="76" y="11" width="13" height="13" rx="2" />
              <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="#7bd0ff" strokeWidth="4" />
              <rect x="11" y="76" width="13" height="13" rx="2" />
              <rect x="38" y="10" width="8" height="8" />
              <rect x="50" y="18" width="6" height="6" opacity="0.8" />
              <rect x="36" y="36" width="28" height="28" rx="4" fill="#0e0d15" stroke="#7bd0ff" strokeWidth="2" />
              <circle cx="50" cy="50" r="6" fill="#ddb7ff" />
              <rect x="15" y="42" width="6" height="6" />
              <rect x="72" y="40" width="8" height="8" />
              <rect x="42" y="74" width="7" height="7" />
              <rect x="56" y="70" width="6" height="6" />
              <rect x="78" y="76" width="10" height="10" />
            </svg>
          </div>
          <div className="mono-xs text-cyan" style={{ wordBreak: 'break-all' }}>
            {mission.clearSignUr}
          </div>
        </div>

        {/* Two-Key Native <input type="checkbox" switch> Toggles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          <label className="spatial-switch-label">
            <div>
              <div className="mono-xs text-violet" style={{ fontSize: '10px', fontWeight: 600 }}>KEY A · FIDO2</div>
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>{keyAArmed ? '✓ Armed' : '✕ Locked'}</div>
            </div>
            <input
              type="checkbox"
              className={`spatial-switch-input${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
              {...({ switch: '' } as Record<string, string>)}
              role={nativeSwitchSupported ? undefined : 'switch'}
              checked={keyAArmed}
              onChange={(e) => setKeyAArmed(e.target.checked)}
            />
          </label>

          <label className="spatial-switch-label">
            <div>
              <div className="mono-xs text-cyan" style={{ fontSize: '10px', fontWeight: 600 }}>KEY B · BLS G2</div>
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>{keyBArmed ? '✓ Armed' : '✕ Locked'}</div>
            </div>
            <input
              type="checkbox"
              className={`spatial-switch-input cyan${nativeSwitchSupported ? '' : ' input-switch-polyfill'}`}
              {...({ switch: '' } as Record<string, string>)}
              role={nativeSwitchSupported ? undefined : 'switch'}
              checked={keyBArmed}
              onChange={(e) => setKeyBArmed(e.target.checked)}
            />
          </label>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '12px' }}>Signatures Collected</span>
            <span className="mono-xs text-emerald" style={{ fontWeight: 700 }}>
              {localQuorumSigs} / {mission.quorumTarget} ({quorumPct}%)
            </span>
          </div>
          <progress
            className="monolith-progress"
            max={100}
            value={quorumPct}
            aria-label={`Signatures collected for ${mission.missionId}`}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {['IL SQUAD ✓', 'TX SQUAD ✓', 'WY VAULT ✓', 'CA SQUAD ✓', 'OH SQUAD ✓'].map((sq) => (
            <span key={sq} className="pill-badge emerald" style={{ fontSize: '10px', padding: '0.15rem 0.55rem' }}>
              {sq}
            </span>
          ))}
        </div>

        <input
          type="text"
          className="spatial-input"
          value={signerCallsign}
          onChange={(e) => setSignerCallsign(e.target.value)}
          aria-label="Astronaut Signer Callsign"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
        <button
          type="button"
          className="btn-spatial btn-aurora"
          style={{ width: '100%', padding: '0.75rem 1rem' }}
          onClick={() => void handleExecuteClearSign()}
        >
          <span aria-hidden="true">◉</span>
          <span>CO-SIGN WITH PASSKEY (FIDO2)</span>
        </button>

        {statusMessage ? (
          <div className="glass-well" role="status" style={{ padding: '0.65rem 0.8rem', borderColor: 'rgb(78 222 163 / 0.45)' }}>
            <div className="mono-xs text-emerald">{statusMessage}</div>
            {attestationHash ? (
              <div className="mono-xs text-muted" style={{ marginTop: '0.2rem', fontSize: '10px', wordBreak: 'break-all' }}>
                {attestationHash}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
