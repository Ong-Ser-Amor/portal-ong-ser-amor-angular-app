import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../ui/input/input.component';
import { DateInputComponent } from '../../ui/date-input/date-input.component';

@Component({
  selector: 'app-formulario-dados-pessoa',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    DateInputComponent,
  ],
  templateUrl: './formulario-dados-pessoa.component.html',
  styleUrl: './formulario-dados-pessoa.component.scss',
})
export class FormularioDadosPessoaComponent {
  /** FormGroup contendo os controles de pessoa (nome, cpf, dataNascimento) */
  formGroup = input.required<FormGroup>();

  /** Evento emitido quando o campo de CPF perde o foco ou é alterado */
  cpfAlterado = output<FocusEvent>();
}
