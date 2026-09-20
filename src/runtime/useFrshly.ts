import { useContext } from 'react';
import { FrshlyContext } from './FrshlyProvider';
import type { FrshlyState } from './types';

export function useFrshly(): FrshlyState {
  const context = useContext(FrshlyContext);

  if (!context) {
    throw new Error('useFrshly must be used within a FrshlyProvider or Frshly component');
  }

  return context;
}
