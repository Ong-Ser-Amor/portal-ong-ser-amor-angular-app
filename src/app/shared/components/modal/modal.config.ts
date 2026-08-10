export type TamanhoModal = 'sm' | 'md' | 'lg' | 'full';

export const CONFIG_MODAL: Record<TamanhoModal, { panelClass: string }> = {
  sm: { panelClass: 'modal-sm' },
  md: { panelClass: 'modal-md' },
  lg: { panelClass: 'modal-lg' },
  full: { panelClass: 'modal-full' },
};
