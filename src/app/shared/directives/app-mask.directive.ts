import { Directive, ElementRef, HostListener, inject, input, OnInit, AfterViewInit } from '@angular/core';
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
export class AppMaskDirective implements OnInit, AfterViewInit {
  private readonly elementRef = inject(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true });

  appMask = input<InputMaskType>();

  ngOnInit(): void {
    setTimeout(() => this.aplicarMascara(), 0);
    if (this.ngControl && this.ngControl.valueChanges) {
      this.ngControl.valueChanges.subscribe(() => {
        setTimeout(() => this.aplicarMascara(), 0);
      });
    }
  }

  ngAfterViewInit(): void {
    this.aplicarMascara();
  }

  @HostListener('input', ['$event'])
  onInput(): void {
    this.aplicarMascara();
  }

  public aplicarMascara(): void {
    const mask = this.appMask()?.toLowerCase();
    if (!mask) return;

    const inputElement = this.elementRef.nativeElement as HTMLInputElement;
    if (!inputElement) return;

    const novoValor = formatarComMascara(inputElement.value, mask);

    if (inputElement.value !== novoValor) {
      inputElement.value = novoValor;
      if (mask !== 'data' && this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(novoValor, { emitModelToViewChange: false });
      }
    }
  }
}

// --- Funções Puras de Formatação ---

export function formatarComMascara(valor: string, mask?: string): string {
  if (!valor || !mask) return valor || '';
  const valorLimpo = (valor || '').replace(/\D/g, '');

  switch (mask.toLowerCase()) {
    case 'cpf':
      return formatarCpf(valorLimpo);
    case 'cep':
      return formatarCep(valorLimpo);
    case 'celular':
      return formatarCelular(valorLimpo);
    case 'telefone_fixo':
      return formatarTelefoneFixo(valorLimpo);
    case 'data':
      return formatarData(valorLimpo);
    default:
      return valor;
  }
}

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
