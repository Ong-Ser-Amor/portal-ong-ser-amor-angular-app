import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../../ui/input/input.component';
import { SelectComponent } from '../../ui/select/select.component';
import { OPCOES_UF } from '../../../../core/models/endereco.model';

@Component({
  selector: 'app-formulario-endereco',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputComponent,
    SelectComponent,
  ],
  templateUrl: './formulario-endereco.component.html',
  styleUrl: './formulario-endereco.component.scss',
})
export class FormularioEnderecoComponent {
  /** FormGroup contendo os controles de endereço (cep, logradouro, numero, complemento, bairro, cidade, uf) */
  formGroup = input.required<FormGroup>();

  readonly ufs = OPCOES_UF;
}
