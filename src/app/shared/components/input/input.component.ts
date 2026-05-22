import {
  Component,
  input,
  signal,
  inject,
} from '@angular/core';
import {
  ControlValueAccessor,
  ReactiveFormsModule,
  FormsModule,
  NgControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor {
  public ngControl = inject(NgControl, { optional: true, self: true });

  // Inputs
  label = input.required<string>();
  placeholder = input<string>('');
  type = input<InputType>('text');
  hint = input<string>('');

  required = input<boolean>(false);

  readonly = input<boolean>(false);
  autocomplete = input<string>('off');
  maxLength = input<number>();
  minLength = input<number>();
  prefixIcon = input<string>('');
  suffixIcon = input<string>('');
  showPasswordToggle = input<boolean>(true);

  // Signals de Estado
  value = signal<string>('');
  disabled = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get control() {
    return this.ngControl?.control;
  }

  get inputType(): string {
    if (this.type() === 'password' && this.showPasswordToggle()) {
      return this.showPassword() ? 'text' : 'password';
    }
    return this.type();
  }

  togglePasswordVisibility(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.showPassword.update((value) => !value);
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
    if (errors['email']) {
      return 'Digite um email válido';
    }
    if (errors['senhasNaoIguais']) {
      return 'As senhas não coincidem';
    }
    if (errors['minlength']) {
      const minLength = errors['minlength'].requiredLength;
      return `Mínimo de ${minLength} caracteres`;
    }
    if (errors['maxlength']) {
      const maxLength = errors['maxlength'].requiredLength;
      return `Máximo de ${maxLength} caracteres`;
    }
    if (errors['min']) {
      return `Valor mínimo: ${errors['min'].min}`;
    }
    if (errors['max']) {
      return `Valor máximo: ${errors['max'].max}`;
    }
    if (errors['pattern']) {
      return 'Formato inválido';
    }

    return 'Campo inválido';
  }

  writeValue(value: any): void {
    this.value.set(value || '');
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
