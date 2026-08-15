import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from '../../ui/select/select.component';
import { CheckboxComponent } from '../../ui/checkbox/checkbox.component';
import { OPCOES_FAIXA_RENDA, OPCOES_TIPO_MORADIA } from '../../../../core/models/familia.model';

@Component({
  selector: 'app-formulario-dados-familia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SelectComponent,
    CheckboxComponent,
  ],
  templateUrl: './formulario-dados-familia.component.html',
  styleUrl: './formulario-dados-familia.component.scss',
})
export class FormularioDadosFamiliaComponent {
  /** FormGroup contendo os controles de família (faixaRenda, tipoMoradia, possuiBeneficioSocial) */
  formGroup = input.required<FormGroup>();

  readonly faixasRenda = OPCOES_FAIXA_RENDA;
  readonly tiposMoradia = OPCOES_TIPO_MORADIA;
}
