import { inject, Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CriarPessoaDto } from '../models/pessoa.model';
import { formatarCpf } from '../../shared/utils/cpf.utils';

@Injectable({
  providedIn: 'root',
})
export class PessoaFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria e retorna o FormGroup padronizado com as validações oficiais da entidade Pessoa.
   * Aceita os dados de uma CriarPessoaDto para preenchimento na edição.
   *
   * @param dados Dados pré-existentes da pessoa (opcional, para edição)
   */
  criarForm(dados?: CriarPessoaDto): FormGroup {
    const dataNascimentoOriginal = dados?.dataNascimento
      ? (dados.dataNascimento.includes('T') ? dados.dataNascimento.split('T')[0] : dados.dataNascimento)
      : '';

    return this.fb.group({
      nome: [dados?.nome || '', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      cpf: [dados?.cpf ? formatarCpf(dados.cpf) : '', [Validators.required, Validators.pattern(/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/)]],
      dataNascimento: [dataNascimentoOriginal, [Validators.required]],
      emancipado: [dados?.emancipado ?? false],
      podeSairSozinho: [dados?.podeSairSozinho ?? false],
    });
  }

  /**
   * Preenche um FormGroup de Pessoa com os dados de uma entidade pré-existente.
   *
   * @param form FormGroup de Pessoa a ser atualizado
   * @param pessoa Dados da pessoa a serem aplicados no formulário
   */
  preencherForm(form: FormGroup, pessoa: CriarPessoaDto): void {
    const dataNascimentoOriginal = pessoa.dataNascimento
      ? (pessoa.dataNascimento.includes('T') ? pessoa.dataNascimento.split('T')[0] : pessoa.dataNascimento)
      : '';

    form.patchValue({
      nome: pessoa.nome,
      cpf: pessoa.cpf ? formatarCpf(pessoa.cpf) : '',
      dataNascimento: dataNascimentoOriginal,
      emancipado: pessoa.emancipado ?? false,
      podeSairSozinho: pessoa.podeSairSozinho ?? false,
    });
  }

  /**
   * Reseta o FormGroup de Pessoa para os valores iniciais padrão.
   *
   * @param form FormGroup de Pessoa a ser resetado
   */
  resetarForm(form: FormGroup): void {
    form.reset({
      nome: '',
      cpf: '',
      dataNascimento: '',
      emancipado: false,
      podeSairSozinho: false,
    });
  }

  /**
   * Bloqueia os campos cadastrais de Pessoa para impedir edição acidental de pessoa pré-existente.
   * Mantém obrigatoriamente o campo de CPF HABILITADO para permitir trocas ou correções de número.
   *
   * @param form FormGroup de Pessoa
   */
  bloquearCamposEdicao(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      if (key !== 'cpf') {
        form.get(key)?.disable({ emitEvent: false });
      } else {
        form.get(key)?.enable({ emitEvent: false });
      }
    });
  }

  /**
   * Desbloqueia todos os campos de Pessoa para o cadastro de uma nova pessoa.
   *
   * @param form FormGroup de Pessoa
   */
  desbloquearCamposEdicao(form: FormGroup): void {
    Object.keys(form.controls).forEach((key) => {
      form.get(key)?.enable({ emitEvent: false });
    });
  }
}
