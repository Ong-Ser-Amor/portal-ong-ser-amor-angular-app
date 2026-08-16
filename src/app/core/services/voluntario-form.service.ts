import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  NivelFormacao,
  TipoVoluntario,
  Voluntario,
  VoluntarioResumo,
} from '../models/voluntario.model';

@Injectable({
  providedIn: 'root',
})
export class VoluntarioFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria e retorna os controles padronizados com as validações oficiais dos atributos de Voluntário
   * (tipoVoluntario, formacaoAcademica, statusFormacao).
   *
   * @param dados Dados pré-existentes do voluntário (opcional, para edição)
   */
  criarControles(dados?: Partial<Voluntario | VoluntarioResumo>) {
    return {
      tipoVoluntario: [
        (dados?.tipoVoluntario as TipoVoluntario) || '',
        [Validators.required],
      ],
      formacaoAcademica: [dados?.formacaoAcademica ?? ''],
      statusFormacao: [(dados?.statusFormacao as NivelFormacao) || ''],
    };
  }

  /**
   * Cria um FormGroup completo apenas com os dados específicos de voluntário.
   */
  criarForm(dados?: Partial<Voluntario | VoluntarioResumo>) {
    return this.fb.group(this.criarControles(dados));
  }

  /**
   * Preenche um FormGroup de Voluntário com os dados de um voluntário existente.
   */
  preencherForm(
    form: FormGroup,
    dados: Partial<Voluntario | VoluntarioResumo>
  ): void {
    form.patchValue(
      {
        tipoVoluntario: dados.tipoVoluntario || '',
        formacaoAcademica: dados.formacaoAcademica ?? '',
        statusFormacao: dados.statusFormacao || '',
      },
      { emitEvent: false }
    );
  }
}

