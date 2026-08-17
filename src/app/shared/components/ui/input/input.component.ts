import {
  Component,
  input,
  signal,
  inject,
  output,
  DoCheck,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  ReactiveFormsModule,
  FormsModule,
  NgControl,
  AbstractControl,
  FormGroupDirective,
  NgForm,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput, MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AppMaskDirective, formatarComMascara, InputMaskType } from '../../../directives/app-mask.directive';

export class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private getControl: () => AbstractControl | null | undefined) { }

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const parentControl = this.getControl();
    return !!(parentControl && parentControl.invalid && (parentControl.touched || parentControl.dirty));
  }
}

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search';

export type InputErrorMessage = string | ((error: any) => string);

export type InputErrorMessages = Record<string, InputErrorMessage>;

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
    AppMaskDirective,
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
})
export class InputComponent implements ControlValueAccessor, DoCheck {
  public ngControl = inject(NgControl, {
    optional: true,
    self: true,
  });

  @ViewChild(MatInput) matInput?: MatInput;

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
  min = input<number>();
  max = input<number>();
  step = input<number>();

  prefixIcon = input<string>('');
  suffixIcon = input<string>('');
  showPasswordToggle = input<boolean>(true);
  subscriptSizing = input<'fixed' | 'dynamic'>('fixed');

  /** Tipo de máscara a ser aplicada ('cpf' | 'cep' | 'celular' | 'telefone_fixo') */
  mask = input<InputMaskType>();

  /** Mensagens de erro personalizadas para sobrescrever ou estender as mensagens padrão */
  errorMessages = input<InputErrorMessages>({});

  value = input<string>('');

  blur = output<FocusEvent>();
  valueChange = output<string>();

  // Signals de Estado
  valorInterno = signal<string>('');
  disabled = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  readonly matcher = new CustomErrorStateMatcher(() => this.control);

  private readonly defaultErrorMessages: InputErrorMessages = {
    required: () => `${this.label()} é obrigatório`,
    email: 'Digite um email válido',
    minlength: (error) => `Mínimo de ${error?.requiredLength ?? ''} caracteres`,
    maxlength: (error) => `Máximo de ${error?.requiredLength ?? ''} caracteres`,
    min: (error) => `Valor mínimo: ${error?.min ?? ''}`,
    max: (error) => `Valor máximo: ${error?.max ?? ''}`,
    pattern: 'Formato inválido',
  };

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

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

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valorInterno.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.blur.emit(event);
  }

  get control(): AbstractControl | null | undefined {
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
    return !!(
      this.control?.invalid &&
      (this.control.touched || this.control.dirty)
    );
  }

  get errorMessage(): string {
    const errors = this.control?.errors;

    if (!errors) {
      return '';
    }

    const messages: InputErrorMessages = {
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

  writeValue(value: any): void {
    const val = value ?? '';
    const mask = this.mask();

    this.valorInterno.set(
      mask && typeof val === 'string'
        ? formatarComMascara(val, mask)
        : val
    );
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
