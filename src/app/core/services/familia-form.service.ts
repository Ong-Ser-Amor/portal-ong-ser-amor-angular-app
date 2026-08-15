import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CriarFamiliaDto, FaixaRenda, Familia, TipoMoradia } from '../models/familia.model';

@Injectable({
  providedIn: 'root',
})
export class FamiliaFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria o FormGroup oficial para Dados da Família com todas as validações oficiais.
   *
   * @param dados Dados pré-existentes da família (opcional)
   * @param desabilitarInicialmente Se true, cria os controles desabilitados inicialmente
   */
  criarForm(dados?: Partial<CriarFamiliaDto | Familia> | null, desabilitarInicialmente = false): FormGroup {
    return this.fb.group({
      faixaRenda: [
        { value: (dados?.faixaRenda as FaixaRenda) || null, disabled: desabilitarInicialmente },
        [Validators.required],
      ],
      tipoMoradia: [
        { value: (dados?.tipoMoradia as TipoMoradia) || null, disabled: desabilitarInicialmente },
        [Validators.required],
      ],
      possuiBeneficioSocial: [
        { value: dados?.possuiBeneficioSocial ?? false, disabled: desabilitarInicialmente },
      ],
    });
  }

  /**
   * Preenche o FormGroup de família com os dados fornecidos.
   */
  preencherForm(form: FormGroup, dados: Partial<CriarFamiliaDto | Familia>): void {
    form.patchValue(
      {
        faixaRenda: dados.faixaRenda || null,
        tipoMoradia: dados.tipoMoradia || null,
        possuiBeneficioSocial: dados.possuiBeneficioSocial ?? false,
      },
      { emitEvent: false }
    );
  }

  /**
   * Reseta o FormGroup de família mantendo o estado de disable se necessário.
   */
  resetarForm(form: FormGroup): void {
    const disabled = form.disabled;
    if (disabled) form.enable({ emitEvent: false });
    form.reset({
      faixaRenda: null,
      tipoMoradia: null,
      possuiBeneficioSocial: false,
    });
    if (disabled) form.disable({ emitEvent: false });
  }
}
