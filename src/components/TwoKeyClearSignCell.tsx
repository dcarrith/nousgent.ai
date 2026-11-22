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
      setStatusMessage('Enable both Key A (FIDO2) and Key B (BLS G2) before co-signing.');
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
        setStatusMessage(`✓ Signed ${data.missionId}: ${data.quorumSignatures}/${data.quorumTarget} (${data.status})`);
        if (onSigned) onSigned();
      } else {
        setStatusMessage(data.error || 'CHIP-0043 interlock rejected unsigned payload.');
      }
    } catch {
      setStatusMessage('Signing API unreachable.');
    }
  }

  return (
    <section className={`glass-card cyan ${colClass}`} aria-label="CHIP-0043 Two-Key Co-Signing">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>CHIP-0043 Quorum</h2>
          <span className="pill-badge emerald">Two-Key</span>
        </div>

        <p className="text-muted" style={{ margin: 0, fontSize: '12.5px' }}>
          Verify the UR digest for <strong>{mission.missionId}</strong> and arm both keys to co-sign.
        </p>

        <div className="glass-well" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div
            style={{
              width: 112,
              height: 112,
              padding: '0.45rem',
              borderRadius: '10px',
              background: 'var(--color-surface-container)',
              border: '1px solid rgb(45 212 191 / 0.35)',
              marginBottom: '0.45rem'
            }}
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%" fill="#2dd4bf" aria-hidden="true">
              <rect x="5" y="5" width="25" height="25" rx="3" fill="none" stroke="#2dd4bf" strokeWidth="4" />
              <rect x="11" y="11" width="13" height="13" rx="2" />
              <rect x="70" y="5" width="25" height="25" rx="3" fill="none" stroke="#2dd4bf" strokeWidth="4" />
              <rect x="76" y="11" width="13" height="13" rx="2" />
              <rect x="5" y="70" width="25" height="25" rx="3" fill="none" stroke="#2dd4bf" strokeWidth="4" />
              <rect x="11" y="76" width="13" height="13" rx="2" />
              <rect x="38" y="10" width="8" height="8" />
              <rect x="50" y="18" width="6" height="6" opacity="0.8" />
              <rect x="36" y="36" width="28" height="28" rx="4" fill="#120a07" stroke="#7ed957" strokeWidth="2" />
              <circle cx="50" cy="50" r="6" fill="#7ed957" />
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 145px), 1fr))', gap: '0.55rem' }}>
          <label className="spatial-switch-label">
            <div>
              <div className="mono-xs text-pistachio" style={{ fontSize: '10px', fontWeight: 600 }}>KEY A · FIDO2</div>
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>{keyAArmed ? 'Armed' : 'Locked'}</div>
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
              <div className="mono-xs text-muted" style={{ fontSize: '10px' }}>{keyBArmed ? 'Armed' : 'Locked'}</div>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
            <span style={{ fontSize: '12px' }}>Signatures</span>
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

        <input
          type="text"
          className="spatial-input"
          value={signerCallsign}
          onChange={(e) => setSignerCallsign(e.target.value)}
          aria-label="Signer Callsign"
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button
          type="button"
          className="btn-spatial btn-pistachio"
          style={{ width: '100%' }}
          onClick={() => void handleExecuteClearSign()}
        >
          Co-Sign (FIDO2)
        </button>

        {statusMessage ? (
          <div className="glass-well" role="status" style={{ padding: '0.6rem 0.75rem', borderColor: 'rgb(78 222 163 / 0.45)' }}>
            <div className="mono-xs text-emerald">{statusMessage}</div>
            {attestationHash ? (
              <div className="mono-xs text-muted" style={{ marginTop: '0.18rem', fontSize: '10px', wordBreak: 'break-all' }}>
                {attestationHash}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
