import { Component, inject, input, signal, Injectable, DoCheck, ViewChild } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  FormsModule,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter } from '@angular/material/core';
import { AppMaskDirective } from '../../../directives/app-mask.directive';

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

@Injectable()
export class PtBrDateAdapter extends NativeDateAdapter {
  override parse(valor: any): Date | null {
    if (typeof valor === 'string' && valor.trim()) {
      const texto = valor.trim();
      const partes = texto.split('/');
      if (partes.length === 3) {
        const dia = Number(partes[0]);
        const mes = Number(partes[1]);
        const anoTexto = partes[2];

        // Exige estritamente 4 dígitos no ano para evitar parsing precoce de anos de 2 dígitos (ex: 20 -> 1920)
        if (anoTexto.length !== 4) {
          return new Date(NaN);
        }

        const ano = Number(anoTexto);
        if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
          const data = new Date(ano, mes - 1, dia);
          if (
            data.getFullYear() === ano &&
            data.getMonth() === mes - 1 &&
            data.getDate() === dia
          ) {
            return data;
          }
        }
        return new Date(NaN);
      }
    }
    return super.parse(valor);
  }
}

export class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private getControl: () => AbstractControl | null | undefined) { }

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const parentControl = this.getControl();
    return !!(parentControl && parentControl.invalid && (parentControl.touched || parentControl.dirty));
  }
}

export type DateInputErrorMessage = string | ((error: any) => string);

export type DateInputErrorMessages = Record<string, DateInputErrorMessage>;

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
    { provide: DateAdapter, useClass: PtBrDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: BR_DATE_FORMATS },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
  ],
  templateUrl: './date-input.component.html',
  styleUrl: './date-input.component.scss',
})
export class DateInputComponent implements ControlValueAccessor, DoCheck {
  public ngControl = inject(NgControl, { optional: true, self: true });

  @ViewChild(MatInput) matInput?: MatInput;

  // Inputs
  label = input.required<string>();
  placeholder = input<string>('DD/MM/AAAA');
  hint = input<string>('');
  required = input<boolean>(false);

  /** Data mínima limite estática em objeto Date ou string no formato 'YYYY-MM-DD' */
  min = input<Date | string>();

  /** Data máxima limite estática em objeto Date ou string no formato 'YYYY-MM-DD' */
  max = input<Date | string>();

  /** Mensagens de erro personalizadas para sobrescrever ou estender as mensagens padrão */
  errorMessages = input<DateInputErrorMessages>({});

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

  readonly matcher = new CustomErrorStateMatcher(() => this.control);

  private readonly defaultErrorMessages: DateInputErrorMessages = {
    required: () => `${this.label()} é obrigatório`,
    matDatepickerParse: 'Data inválida',
    matDatepickerMin: 'Data inferior ao limite permitido',
    matDatepickerMax: 'Data superior ao limite permitido',
  };

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => { };
  public onTouched: () => void = () => { };

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngDoCheck(): void {
    if (this.control && this.matInput) {
      this.matInput.updateErrorState();
    }
  }

  get control() {
    return this.ngControl?.control;
  }

  private converterParaDate(valor: Date | string | undefined | null): Date | null {
    if (!valor) return null;
    if (typeof valor === 'string') {
      const texto = valor.trim();
      const textoData = texto.includes('T') ? texto.split('T')[0] : texto;
      if (textoData.includes('-')) {
        const partes = textoData.split('-').map(Number);
        if (partes.length === 3 && !partes.some(isNaN)) {
          return new Date(partes[0], partes[1] - 1, partes[2]);
        }
      }
      if (textoData.includes('/')) {
        const partes = textoData.split('/').map(Number);
        if (partes.length === 3 && !partes.some(isNaN)) {
          return new Date(partes[2], partes[1] - 1, partes[0]);
        }
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
  get dataMinima(): Date | null {
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
  get dataMaxima(): Date | null {
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

    const minCalculada = this.dataMinima;
    if (minCalculada && dataCalculada && minCalculada > dataCalculada) {
      console.error(
        `[DateInputComponent]: Conflito no campo "${this.label()}". A data mínima (${minCalculada.toISOString().split('T')[0]}) é maior que a data máxima (${dataCalculada.toISOString().split('T')[0]}).`
      );
      return null;
    }

    return dataCalculada;
  }

  get temErro(): boolean {
    if (!this.control) return false;
    return !!(
      this.control.invalid &&
      (this.control.touched || this.control.dirty)
    );
  }

  get mensagemErro(): string {
    const errors = this.control?.errors;

    if (!errors) {
      return '';
    }

    const messages: DateInputErrorMessages = {
      ...this.defaultErrorMessages,
      ...this.errorMessages(),
    };

    const errorKey = Object.keys(errors).find((key) => messages[key]);

    if (!errorKey) {
      return 'Campo inválido';
    }

    const message = messages[errorKey];

    return typeof message === 'function' ? message(errors[errorKey]) : message;
  }

  onInput(event: Event): void {
    const valorTexto = (event.target as HTMLInputElement).value;
    if (valorTexto && valorTexto.length === 10) {
      const partes = valorTexto.split('/');
      if (partes.length === 3) {
        const dia = Number(partes[0]);
        const mes = Number(partes[1]) - 1;
        const ano = Number(partes[2]);
        const data = new Date(ano, mes, dia);
        if (
          !isNaN(data.getTime()) &&
          data.getFullYear() === ano &&
          data.getMonth() === mes &&
          data.getDate() === dia
        ) {
          this.control?.setValue(data);
        }
      }
    }
  }

  onDateChange(event: any): void {
    const valor = event.value;
    let valorFormatado: string | null = null;
    if (valor instanceof Date && !isNaN(valor.getTime())) {
      const ano = valor.getFullYear();
      const mes = String(valor.getMonth() + 1).padStart(2, '0');
      const dia = String(valor.getDate()).padStart(2, '0');
      valorFormatado = `${ano}-${mes}-${dia}`;
    }
    this.value.set(valor);
    this.onChange(valorFormatado);
    this.onTouched();
  }

  writeValue(valor: any): void {
    const dataConvertida = this.converterParaDate(valor);
    this.value.set(dataConvertida);
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
