import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '../../ui/select/select.component';
import {
  OPCOES_ESTADO_CIVIL,
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_VINCULO_EMPREGATICIO,
} from '../../../../core/models/beneficiario.model';
import { InputComponent } from '../../ui/input/input.component';

@Component({
  selector: 'app-formulario-dados-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './formulario-dados-beneficiario.component.html',
  styleUrl: './formulario-dados-beneficiario.component.scss',
})
export class FormularioDadosBeneficiarioComponent {
  /** FormGroup contendo os controles especificos de beneficiario (nivelEscolaridade, estadoCivil, vinculoEmpregaticio, quantidadeFilhos) */
  formGroup = input.required<FormGroup>();

  readonly niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  readonly estadosCivis = OPCOES_ESTADO_CIVIL;
  readonly vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;
}
