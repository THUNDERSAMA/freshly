import React from 'react';
import { useFrshly } from 'frshly';

function App() {
  const {
    currentVersion,
    latestVersion,
    builtAt,
    status,
    updateAvailable,
    lastCheckedAt,
    check,
  } = useFrshly();

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>frshly demo</h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Deploy. Open tabs update themselves. No hard refresh. No "please clear your cache".
      </p>

      <div style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: '#f9fafb',
        marginBottom: '24px',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>Version Info</h2>

        <div style={{ display: 'grid', gap: '12px' }}>
          <InfoRow label="Running version:" value={currentVersion} />
          {latestVersion && (
            <InfoRow label="Latest version:" value={latestVersion} />
          )}
          {builtAt && (
            <InfoRow
              label="Built:"
              value={new Date(builtAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
              })}
            />
          )}
          <InfoRow label="Status:" value={status} />
          {lastCheckedAt && (
            <InfoRow
              label="Last check:"
              value={new Date(lastCheckedAt).toLocaleTimeString()}
            />
          )}
        </div>

        {updateAvailable && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            color: '#92400e',
          }}>
            ⚠ Update available - Check the banner at the top!
          </div>
        )}

        {!updateAvailable && status === 'current' && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '6px',
            color: '#065f46',
          }}>
            ✓ You're on the latest version
          </div>
        )}
      </div>

      <button
        onClick={check}
        disabled={status === 'checking'}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          fontWeight: 500,
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: status === 'checking' ? 'not-allowed' : 'pointer',
          opacity: status === 'checking' ? 0.6 : 1,
        }}
      >
        {status === 'checking' ? 'Checking...' : 'Check for update'}
      </button>

      <div style={{
        marginTop: '32px',
        padding: '24px',
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px' }}>
          Try it out
        </h3>
        <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.8 }}>
          <li>Run <code style={codeStyle}>npm run build</code> in the parent directory</li>
          <li>Run <code style={codeStyle}>npm run simulate-deploy</code> to update version.json</li>
          <li>Watch this page detect the update and show the banner</li>
          <li>Click "Reload" in the banner to update</li>
        </ol>
        <p style={{ marginTop: '12px', marginBottom: 0, fontSize: '14px', color: '#1e40af' }}>
          <strong>Note:</strong> The simulation only updates version.json. In production,
          you'd deploy a new bundle and frshly would detect it automatically.
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span style={{ fontWeight: 600, minWidth: '140px', color: '#374151' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'monospace', color: '#1f2937' }}>
        {value}
      </span>
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  backgroundColor: '#1f2937',
  color: '#f9fafb',
  padding: '2px 6px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
};

export default App;
