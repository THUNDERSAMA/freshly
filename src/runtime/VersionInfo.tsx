import React from 'react';
import { useFrshly } from './useFrshly';

export interface VersionInfoProps {
  render?: (props: {
    currentVersion: string;
    latestVersion: string | null;
    builtAt: string | null;
    status: string;
    updateAvailable: boolean;
  }) => React.ReactNode;
}

export function VersionInfo({ render }: VersionInfoProps) {
  const { currentVersion, latestVersion, builtAt, status, updateAvailable } = useFrshly();

  if (render) {
    return (
      <>
        {render({ currentVersion, latestVersion, builtAt, status, updateAvailable })}
      </>
    );
  }

  const styles: React.CSSProperties = {
    fontFamily: 'var(--frshly-version-font, monospace)',
    fontSize: 'var(--frshly-version-font-size, 14px)',
    color: 'var(--frshly-version-color, #374151)',
    padding: 'var(--frshly-version-padding, 16px)',
  };

  const rowStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginBottom: '4px',
  };

  const labelStyles: React.CSSProperties = {
    fontWeight: 600,
    minWidth: '120px',
  };

  return (
    <div style={styles}>
      <div style={rowStyles}>
        <span style={labelStyles}>Current Version:</span>
        <span>{currentVersion}</span>
      </div>
      {latestVersion && (
        <div style={rowStyles}>
          <span style={labelStyles}>Latest Version:</span>
          <span>{latestVersion}</span>
        </div>
      )}
      {builtAt && (
        <div style={rowStyles}>
          <span style={labelStyles}>Built At:</span>
          <span>{new Date(builtAt).toLocaleString()}</span>
        </div>
      )}
      <div style={rowStyles}>
        <span style={labelStyles}>Status:</span>
        <span>{status}</span>
      </div>
      {updateAvailable && (
        <div style={{ marginTop: '8px', color: 'var(--frshly-version-alert, #dc2626)' }}>
          ⚠ Update available
        </div>
      )}
    </div>
  );
}
