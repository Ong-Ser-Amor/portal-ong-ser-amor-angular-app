import {
  Component,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

function normalizarCpf(valor: string): string {
  return `${valor || ''}`.replace(/\D/g, '').slice(0, 11);
}

@Component({
  selector: 'app-cpf-input',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './cpf-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CpfInputComponent),
      multi: true,
    },
  ],
})
export class CpfInputComponent implements ControlValueAccessor {
  label = input<string>('CPF');
  placeholder = input<string>('11 dígitos');
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  autocomplete = input<string>('off');
  hint = input<string>('');

  value = signal<string>('');
  disabled = signal<boolean>(false);

  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };

  formatarCpf(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cpf = normalizarCpf(input.value);

    this.value.set(cpf);
    this.onChange(cpf);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value.set(normalizarCpf(value || ''));
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}