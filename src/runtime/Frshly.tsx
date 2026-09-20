import React from 'react';
import { FrshlyProvider, type FrshlyProviderProps } from './FrshlyProvider';
import { UpdateBanner } from './UpdateBanner';

export interface FrshlyProps extends Omit<FrshlyProviderProps, 'children'> {
  children: React.ReactNode;
  showBanner?: boolean;
  bannerPosition?: 'top' | 'bottom';
  bannerMessage?: string;
}

/**
 * Zero-config wrapper combining FrshlyProvider + UpdateBanner.
 * Defaults to auto mode with banner in prompt mode.
 */
export function Frshly({
  children,
  showBanner = true,
  bannerPosition = 'top',
  bannerMessage,
  mode = 'auto',
  ...providerProps
}: FrshlyProps) {
  // If mode is auto, no banner needed (reloads automatically)
  // If mode is prompt or manual, show banner if enabled
  const shouldShowBanner = showBanner && (mode === 'prompt' || mode === 'manual');

  return (
    <FrshlyProvider mode={mode} {...providerProps}>
      {shouldShowBanner && (
        <UpdateBanner position={bannerPosition} message={bannerMessage} />
      )}
      {children}
    </FrshlyProvider>
  );
}
