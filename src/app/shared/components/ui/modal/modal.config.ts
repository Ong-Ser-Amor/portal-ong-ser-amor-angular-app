export type TamanhoModal = 'sm' | 'md' | 'lg' | 'full';

export const CONFIG_MODAL: Record<TamanhoModal, { panelClass: string; maxHeight: string; maxWidth: string }> = {
  sm: { panelClass: 'modal-sm', maxHeight: '90vh', maxWidth: '95vw' },
  md: { panelClass: 'modal-md', maxHeight: '90vh', maxWidth: '95vw' },
  lg: { panelClass: 'modal-lg', maxHeight: '90vh', maxWidth: '95vw' },
  full: { panelClass: 'modal-full', maxHeight: '100vh', maxWidth: '100vw' },
};

