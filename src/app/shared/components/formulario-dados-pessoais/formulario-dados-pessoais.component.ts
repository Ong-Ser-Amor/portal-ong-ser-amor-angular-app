import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { DateInputComponent } from '../date-input/date-input.component';
import { CheckboxComponent } from '../checkbox/checkbox.component';
import { calcularIdade } from '../../utils/data.utils';

@Component({
  selector: 'app-formulario-dados-pessoais',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    DateInputComponent,
    CheckboxComponent,
  ],
  templateUrl: './formulario-dados-pessoais.component.html',
  styleUrl: './formulario-dados-pessoais.component.scss',
})
export class FormularioDadosPessoaisComponent {
  /** FormGroup contendo os controles de pessoa (nome, cpf, dataNascimento) e opcionalmente emancipado, podeSairSozinho */
  formGroup = input.required<FormGroup>();

  /** Evento emitido quando o campo de CPF perde o foco ou é alterado */
  cpfAlterado = output<FocusEvent>();

  get formControlEmancipado() {
    return this.formGroup().get('emancipado') || this.formGroup().parent?.get('emancipado');
  }

  get formControlPodeSairSozinho() {
    return this.formGroup().get('podeSairSozinho') || this.formGroup().parent?.get('podeSairSozinho');
  }

  get idadeAtual(): number | null {
    const dataNasc = this.formGroup().get('dataNascimento')?.value;
    return calcularIdade(dataNasc);
  }

  get podeSerEmancipado(): boolean {
    const idade = this.idadeAtual;
    return idade !== null && idade >= 16 && idade < 18;
  }

  get ehMenorNaoEmancipado(): boolean {
    const idade = this.idadeAtual;
    const emancipado = !!this.formControlEmancipado?.value;
    return idade !== null && idade < 18 && !emancipado;
  }
}
