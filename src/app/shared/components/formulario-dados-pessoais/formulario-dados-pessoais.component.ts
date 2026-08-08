import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../input/input.component';
import { DateInputComponent } from '../date-input/date-input.component';

@Component({
  selector: 'app-formulario-dados-pessoais',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    DateInputComponent,
  ],
  templateUrl: './formulario-dados-pessoais.component.html',
  styleUrl: './formulario-dados-pessoais.component.scss',
})
export class FormularioDadosPessoaisComponent {
  // FormGroup pai contendo os controles nome, cpf e dataNascimento
  formGroup = input.required<FormGroup>();

  // Evento emitido quando o campo de CPF perde o foco
  cpfAlterado = output<FocusEvent>();
}
