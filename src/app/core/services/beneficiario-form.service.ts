import { inject, Injectable } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  Beneficiario,
  EstadoCivil,
  NivelEscolaridade,
  VinculoEmpregaticio,
} from '../models/beneficiario.model';

@Injectable({
  providedIn: 'root',
})
export class BeneficiarioFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria e retorna os controles padronizados com as validações oficiais dos atributos de Beneficiário
   * (nivelEscolaridade, estadoCivil, vinculoEmpregaticio, quantidadeFilhos).
   *
   * @param dados Dados pré-existentes do beneficiário (opcional, para edição)
   */
  criarControles(dados?: Partial<Beneficiario>) {
    return {
      nivelEscolaridade: [
        (dados?.nivelEscolaridade as NivelEscolaridade) || '',
        [Validators.required],
      ],
      estadoCivil: [(dados?.estadoCivil as EstadoCivil) || ''],
      vinculoEmpregaticio: [(dados?.vinculoEmpregaticio as VinculoEmpregaticio) || ''],
      quantidadeFilhos: [
        dados?.quantidadeFilhos ?? null,
        [Validators.min(0), Validators.max(30), Validators.pattern(/^[0-9]+$/)],
      ],
    };
  }
}
