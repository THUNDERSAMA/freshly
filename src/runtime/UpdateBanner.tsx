import React from 'react';
import { useFrshly } from './useFrshly';

export interface UpdateBannerProps {
  message?: string;
  reloadLabel?: string;
  dismissLabel?: string;
  position?: 'top' | 'bottom';
  render?: (props: {
    message: string;
    onReload: () => void;
    onDismiss: () => void;
    latestVersion: string;
  }) => React.ReactNode;
}

export function UpdateBanner({
  message = 'A new version is available.',
  reloadLabel = 'Reload',
  dismissLabel = 'Dismiss',
  position = 'top',
  render,
}: UpdateBannerProps) {
  const { updateAvailable, latestVersion, reload, dismiss } = useFrshly();

  if (!updateAvailable || !latestVersion) {
    return null;
  }

  if (render) {
    return <>{render({ message, onReload: reload, onDismiss: dismiss, latestVersion })}</>;
  }

  const styles: React.CSSProperties = {
    position: 'fixed',
    [position]: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 'var(--frshly-banner-padding, 12px 16px)',
    backgroundColor: 'var(--frshly-banner-bg, #1f2937)',
    color: 'var(--frshly-banner-color, #ffffff)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--frshly-banner-gap, 16px)',
    fontFamily: 'var(--frshly-banner-font, system-ui, sans-serif)',
    fontSize: 'var(--frshly-banner-font-size, 14px)',
    boxShadow: 'var(--frshly-banner-shadow, 0 2px 8px rgba(0, 0, 0, 0.15))',
  };

  const buttonBaseStyles: React.CSSProperties = {
    padding: 'var(--frshly-button-padding, 6px 12px)',
    border: 'none',
    borderRadius: 'var(--frshly-button-radius, 4px)',
    fontSize: 'var(--frshly-button-font-size, 14px)',
    fontWeight: 'var(--frshly-button-font-weight, 500)',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  };

  const reloadButtonStyles: React.CSSProperties = {
    ...buttonBaseStyles,
    backgroundColor: 'var(--frshly-button-primary-bg, #3b82f6)',
    color: 'var(--frshly-button-primary-color, #ffffff)',
  };

  const dismissButtonStyles: React.CSSProperties = {
    ...buttonBaseStyles,
    backgroundColor: 'var(--frshly-button-secondary-bg, transparent)',
    color: 'var(--frshly-button-secondary-color, #9ca3af)',
    border: '1px solid var(--frshly-button-secondary-border, #4b5563)',
  };

  return (
    <div style={styles} role="status" aria-live="polite">
      <span>{message}</span>
      <button
        onClick={reload}
        style={reloadButtonStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.9';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {reloadLabel}
      </button>
      <button
        onClick={dismiss}
        style={dismissButtonStyles}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '0.8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '1';
        }}
      >
        {dismissLabel}
      </button>
    </div>
  );
}
