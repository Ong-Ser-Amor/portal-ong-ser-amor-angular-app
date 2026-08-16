import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '../../ui/select/select.component';
import { InputComponent } from '../../ui/input/input.component';
import {
  OPCOES_NIVEL_FORMACAO,
  OPCOES_TIPO_VOLUNTARIO,
} from '../../../../core/models/voluntario.model';

@Component({
  selector: 'app-formulario-dados-voluntario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './formulario-dados-voluntario.component.html',
  styleUrl: './formulario-dados-voluntario.component.scss',
})
export class FormularioDadosVoluntarioComponent {
  /** FormGroup contendo os controles especificos de voluntario (tipoVoluntario, formacaoAcademica, statusFormacao) */
  formGroup = input.required<FormGroup>();

  readonly tiposVoluntario = OPCOES_TIPO_VOLUNTARIO;
  readonly niveisFormacao = OPCOES_NIVEL_FORMACAO;
}
