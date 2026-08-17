import { Component, inject, input, signal, DoCheck, ViewChild } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { OpcaoSelect } from '../../../../core/models/opcao-select.model';

export class CustomErrorStateMatcher implements ErrorStateMatcher {
  constructor(private getControl: () => AbstractControl | null | undefined) { }

  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const parentControl = this.getControl();
    return !!(parentControl && parentControl.invalid && (parentControl.touched || parentControl.dirty));
  }
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
})
export class SelectComponent implements ControlValueAccessor, DoCheck {
  public ngControl = inject(NgControl, { optional: true, self: true });

  @ViewChild(MatSelect) matSelect?: MatSelect;

  // Inputs
  label = input.required<string>();
  opcoes = input.required<OpcaoSelect<any>[]>();
  placeholder = input<string>('');
  hint = input<string>('');
  required = input<boolean>(false);
  multiple = input<boolean>(false);

  // Signals de Estado
  value = signal<any>(null);
  disabled = signal<boolean>(false);

  readonly matcher = new CustomErrorStateMatcher(() => this.control);

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => { };
  onTouched: () => void = () => { };

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngDoCheck(): void {
    if (this.control && this.matSelect) {
      this.matSelect.updateErrorState();
    }
  }

  get control() {
    return this.ngControl?.control;
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

    return 'Campo inválido';
  }

  onValueChange(value: any): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: any): void {
    // null/undefined deve limpar a seleção do mat-select
    this.value.set(value ?? null);
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
