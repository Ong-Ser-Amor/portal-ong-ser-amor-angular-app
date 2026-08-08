import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

export type InputMaskType =
  | 'cpf'
  | 'cep'
  | 'celular'
  | 'telefone_fixo'
  | 'data'
  | 'CELULAR'
  | 'TELEFONE_FIXO'
  | string
  | undefined;

/**
 * Diretiva unificada de máscara para diferentes tipos de inputs.
 */
@Directive({
  selector: '[appMask]',
  standalone: true,
})
export class AppMaskDirective {
  private readonly el = inject(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  appMask = input<InputMaskType>();

  @HostListener('input', ['$event'])
  onInput(): void {
    const mask = this.appMask()?.toLowerCase();
    if (!mask) return;

    const inputEl = this.el.nativeElement as HTMLInputElement;
    const valorLimpo = inputEl.value.replace(/\D/g, '');
    let novoValor = inputEl.value;

    switch (mask) {
      case 'cpf':
        novoValor = formatarCpf(valorLimpo);
        break;
      case 'cep':
        novoValor = formatarCep(valorLimpo);
        break;
      case 'celular':
        novoValor = formatarCelular(valorLimpo);
        break;
      case 'telefone_fixo':
        novoValor = formatarTelefoneFixo(valorLimpo);
        break;
      case 'data':
        novoValor = formatarData(valorLimpo);
        break;
    }

    inputEl.value = novoValor;

    if (mask !== 'data' && this.ngControl && this.ngControl.control) {
      this.ngControl.control.setValue(novoValor, { emitModelToViewChange: false });
    }
  }
}

// --- Funções Puras de Formatação ---

function formatarCpf(valor: string): string {
  const v = valor.slice(0, 11);
  if (v.length > 9) return v.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
  if (v.length > 6) return v.replace(/^(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3');
  if (v.length > 3) return v.replace(/^(\d{3})(\d{1,3})$/, '$1.$2');
  return v;
}

function formatarCep(valor: string): string {
  const v = valor.slice(0, 8);
  if (v.length > 5) return v.replace(/^(\d{5})(\d{1,3})$/, '$1-$2');
  return v;
}

function formatarCelular(valor: string): string {
  const v = valor.slice(0, 11);
  if (v.length > 6) return v.replace(/^(\d{2})(\d{5})(\d{1,4})$/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/^(\d{2})(\d{1,5})$/, '($1) $2');
  if (v.length > 0) return v.replace(/^(\d{1,2})$/, '($1');
  return v;
}

function formatarTelefoneFixo(valor: string): string {
  const v = valor.slice(0, 10);
  if (v.length > 6) return v.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3');
  if (v.length > 2) return v.replace(/^(\d{2})(\d{1,4})$/, '($1) $2');
  if (v.length > 0) return v.replace(/^(\d{1,2})$/, '($1');
  return v;
}

function formatarData(valor: string): string {
  const v = valor.slice(0, 8);
  if (v.length > 4) return v.replace(/^(\d{2})(\d{2})(\d{1,4})$/, '$1/$2/$3');
  if (v.length > 2) return v.replace(/^(\d{2})(\d{1,2})$/, '$1/$2');
  return v;
}
