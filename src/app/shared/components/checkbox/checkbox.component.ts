import { Component, inject, input, signal } from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatCheckboxModule,
  ],
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.scss',
})
export class CheckboxComponent implements ControlValueAccessor {
  public ngControl = inject(NgControl, { optional: true, self: true });

  // Inputs
  label = input.required<string>();
  color = input<'primary' | 'accent' | 'warn'>('primary');

  // Signals de Estado
  checked = signal<boolean>(false);
  disabled = signal<boolean>(false);

  // ControlValueAccessor callbacks
  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  get control() {
    return this.ngControl?.control;
  }

  onCheckChange(value: boolean): void {
    this.checked.set(value);
    this.onChange(value);
    this.onTouched();
  }

  writeValue(value: boolean): void {
    this.checked.set(!!value);
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
