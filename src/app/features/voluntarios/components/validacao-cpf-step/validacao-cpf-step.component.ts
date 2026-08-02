import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  inject,
  input,
  output,
  OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BotaoComponent } from '../../../../shared/components/botao/botao.component';
import { CpfInputComponent } from '../../../../shared/components/cpf-input/cpf-input.component';

@Component({
  selector: 'app-validacao-cpf-step',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    BotaoComponent,
    CpfInputComponent,
  ],
  templateUrl: './validacao-cpf-step.component.html',
  styleUrl: './validacao-cpf-step.component.scss',
})
export class ValidacaoCpfStepComponent implements OnInit {
  private fb = inject(FormBuilder);

  cpf = input<string>('');
  modoEdicao = input<boolean>(false);
  carregando = input<boolean>(false);

  verificacaoCpfSolicitada = output<string>();
  cancelamentoSolicitado = output<void>();

  // A validação de tamanho mínimo costuma ser mais segura que Regex se o input usar máscara internamente
  form = this.fb.group({
    cpf: ['', [Validators.required, Validators.minLength(11)]],
  });

  ngOnInit() {
    // Configuração inicial limpa e previsível
    const valorInicial = this.cpf();
    this.form.patchValue({ cpf: valorInicial });

    if (this.modoEdicao()) {
      this.form.disable();
    }
  }

  aoSubmeter(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Limpa a máscara garantindo que só envia números
    const cpfLimpo = (this.form.getRawValue().cpf ?? '').replace(/\D/g, '');
    this.verificacaoCpfSolicitada.emit(cpfLimpo);
  }

  aoCancelar(): void {
    this.cancelamentoSolicitado.emit();
  }

  get botaoTexto(): string {
    return this.modoEdicao() ? 'Continuar' : 'Verificar CPF';
  }
}
