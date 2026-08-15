import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CriarEnderecoDto, Endereco, UF } from '../models/endereco.model';

@Injectable({
  providedIn: 'root',
})
export class EnderecoFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria o FormGroup oficial para Endereço com todas as validações oficiais.
   *
   * @param dados Dados pré-existentes do endereço (opcional)
   * @param desabilitarInicialmente Se true, cria os controles desabilitados inicialmente
   */
  criarForm(dados?: Partial<CriarEnderecoDto | Endereco> | null, desabilitarInicialmente = false): FormGroup {
    return this.fb.group({
      cep: [
        { value: dados?.cep || '', disabled: desabilitarInicialmente },
        [Validators.required, Validators.pattern(/^(\d{8}|\d{5}-\d{3})$/)],
      ],
      logradouro: [
        { value: dados?.logradouro || '', disabled: desabilitarInicialmente },
        [Validators.required],
      ],
      numero: [{ value: dados?.numero || '', disabled: desabilitarInicialmente }],
      complemento: [{ value: dados?.complemento || '', disabled: desabilitarInicialmente }],
      bairro: [
        { value: dados?.bairro || '', disabled: desabilitarInicialmente },
        [Validators.required],
      ],
      cidade: [
        { value: dados?.cidade || '', disabled: desabilitarInicialmente },
        [Validators.required],
      ],
      uf: [
        { value: (dados?.uf as UF) || null, disabled: desabilitarInicialmente },
        [Validators.required],
      ],
    });
  }

  /**
   * Preenche o FormGroup de endereço com os dados fornecidos.
   */
  preencherForm(form: FormGroup, dados: Partial<CriarEnderecoDto | Endereco>): void {
    form.patchValue(
      {
        cep: dados.cep || '',
        logradouro: dados.logradouro || '',
        numero: dados.numero || '',
        complemento: dados.complemento || '',
        bairro: dados.bairro || '',
        cidade: dados.cidade || '',
        uf: dados.uf || null,
      },
      { emitEvent: false }
    );
  }

  /**
   * Reseta o FormGroup de endereço mantendo o estado de disable se necessário.
   */
  resetarForm(form: FormGroup): void {
    const disabled = form.disabled;
    if (disabled) form.enable({ emitEvent: false });
    form.reset({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: null,
    });
    if (disabled) form.disable({ emitEvent: false });
  }
}
