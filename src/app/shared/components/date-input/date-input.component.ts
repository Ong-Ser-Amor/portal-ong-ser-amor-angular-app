import { Component, inject, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { AppMaskDirective } from '../../directives/app-mask.directive';

export const BR_DATE_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    AppMaskDirective,
  ],
  providers: [
    provideNativeDateAdapter(BR_DATE_FORMATS),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
  ],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
})
export class DateInputComponent implements ControlValueAccessor {
  public ngControl = inject(NgControl, { optional: true, self: true });

  // Inputs
  label = input.required<string>();
  placeholder = input<string>('DD/MM/AAAA');
  hint = input<string>('');
  required = input<boolean>(false);

  /** Data mínima limite estática em objeto Date ou string no formato 'YYYY-MM-DD' */
  min = input<Date | string>();

  /** Data máxima limite estática em objeto Date ou string no formato 'YYYY-MM-DD' */
  max = input<Date | string>();

  /** Se true, bloqueia automaticamente a seleção de qualquer data no futuro (posterior a HOJE) */
  bloquearFuturo = input<boolean>(false);

  /** Se true, bloqueia automaticamente a seleção de qualquer data no passado (anterior a HOJE) */
  bloquearPassado = input<boolean>(false);

  /** Define o limite mínimo como N anos a partir do ano atual (Ex: 150 limita em anoAtual - 150) */
  maxAnosAtras = input<number>();

  /** Define o limite máximo como N anos a partir do ano atual (Ex: 5 limita em anoAtual + 5) */
  maxAnosFrente = input<number>();

  // Signals de Estado
  value = signal<Date | null>(null);
  disabled = signal<boolean>(false);

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => {};
  public onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get control() {
    return this.ngControl?.control;
  }

  private converterParaDate(valor: Date | string | undefined | null): Date | null {
    if (!valor) return null;
    if (typeof valor === 'string') {
      const parts = valor.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    if (valor instanceof Date && !isNaN(valor.getTime())) {
      return valor;
    }
    return null;
  }

  /**
   * Retorna a data mínima aplicando estritamente uma única regra fornecida.
   */
  get minDate(): Date | null {
    // 1. Verificação de conflito entre regras de limite mínimo
    const temMin = !!this.min();
    const temBloquearPassado = this.bloquearPassado();
    const temMaxAnosAtras = this.maxAnosAtras() !== undefined && this.maxAnosAtras() !== null;

    const qtdRegrasMinima = [temMin, temBloquearPassado, temMaxAnosAtras].filter(Boolean).length;
    if (qtdRegrasMinima > 1) {
      console.error(
        `[DateInputComponent]: Conflito no campo "${this.label()}". Foi fornecida mais de uma regra de limite mínimo ("min", "bloquearPassado", "maxAnosAtras"). Escolha apenas UMA regra.`
      );
      return null;
    }

    if (temBloquearPassado && this.bloquearFuturo()) {
      console.error(
        `[DateInputComponent]: Conflito no campo "${this.label()}". Não é permitido ativar "bloquearFuturo" e "bloquearPassado" simultaneamente.`
      );
      return null;
    }

    if (temMin) {
      return this.converterParaDate(this.min());
    }

    if (temBloquearPassado) {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      return hoje;
    }

    if (temMaxAnosAtras) {
      const dataAnosAtras = new Date();
      dataAnosAtras.setFullYear(dataAnosAtras.getFullYear() - this.maxAnosAtras()!);
      dataAnosAtras.setMonth(0, 1);
      dataAnosAtras.setHours(0, 0, 0, 0);
      return dataAnosAtras;
    }

    return null;
  }

  /**
   * Retorna a data máxima aplicando estritamente uma única regra fornecida.
   */
  get maxDate(): Date | null {
    // 1. Verificação de conflito entre regras de limite máximo
    const temMax = !!this.max();
    const temBloquearFuturo = this.bloquearFuturo();
    const temMaxAnosFrente = this.maxAnosFrente() !== undefined && this.maxAnosFrente() !== null;

    const qtdRegrasMaxima = [temMax, temBloquearFuturo, temMaxAnosFrente].filter(Boolean).length;
    if (qtdRegrasMaxima > 1) {
      console.error(
        `[DateInputComponent]: Conflito no campo "${this.label()}". Foi fornecida mais de uma regra de limite máximo ("max", "bloquearFuturo", "maxAnosFrente"). Escolha apenas UMA regra.`
      );
      return null;
    }

    let dataCalculada: Date | null = null;

    if (temMax) {
      dataCalculada = this.converterParaDate(this.max());
    } else if (temBloquearFuturo) {
      const hoje = new Date();
      hoje.setHours(23, 59, 59, 999);
      dataCalculada = hoje;
    } else if (temMaxAnosFrente) {
      const dataAnosFrente = new Date();
      dataAnosFrente.setFullYear(dataAnosFrente.getFullYear() + this.maxAnosFrente()!);
      dataAnosFrente.setMonth(11, 31);
      dataAnosFrente.setHours(23, 59, 59, 999);
      dataCalculada = dataAnosFrente;
    }

    // 2. Validação de inconsistência entre min e max
    const minCalculada = this.minDate;
    if (minCalculada && dataCalculada && minCalculada > dataCalculada) {
      console.error(
        `[DateInputComponent]: Conflito no campo "${this.label()}". A data mínima (${minCalculada.toISOString().split('T')[0]}) é maior que a data máxima (${dataCalculada.toISOString().split('T')[0]}).`
      );
      return null;
    }

    return dataCalculada;
  }

  get hasError(): boolean {
    if (!this.control) return false;
    return !!(
      this.control.invalid &&
      (this.control.touched || this.control.dirty)
    );
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';

    const errors = this.control.errors;

    if (errors['required']) {
      return `${this.label()} é obrigatório`;
    }
    if (errors['matDatepickerParse']) {
      return 'Data inválida';
    }
    if (errors['matDatepickerMin']) {
      return 'Data inferior ao limite permitido';
    }
    if (errors['matDatepickerMax']) {
      return 'Data superior ao limite permitido';
    }

    return 'Campo inválido';
  }

  onInput(event: Event): void {
    const inputVal = (event.target as HTMLInputElement).value;
    if (inputVal && inputVal.length === 10) {
      const parts = inputVal.split('/');
      if (parts.length === 3) {
        const day = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const year = Number(parts[2]);
        const d = new Date(year, month, day);
        if (
          !isNaN(d.getTime()) &&
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day
        ) {
          this.control?.setValue(d);
        }
      }
    }
  }

  onDateChange(event: any): void {
    const value = event.value;
    let formattedValue: string | null = null;
    if (value instanceof Date && !isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      formattedValue = `${year}-${month}-${day}`;
    }
    this.value.set(value);
    this.onChange(formattedValue);
    this.onTouched();
  }

  writeValue(value: any): void {
    const dateVal = this.converterParaDate(value);
    this.value.set(dateVal);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
