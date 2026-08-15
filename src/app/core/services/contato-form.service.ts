import { inject, Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CriarContatoBeneficiarioDto, TipoContato } from '../models/contato.model';
import { InputType } from '../../shared/components/ui/input/input.component';
import { InputMaskType } from '../../shared/directives/app-mask.directive';

@Injectable({
  providedIn: 'root',
})
export class ContatoFormService {
  private readonly fb = inject(FormBuilder);

  /**
   * Cria o FormGroup individual para 1 canal de contato com validadores reativos.
   *
   * @param dados Dados pré-existentes do contato (opcional)
   * @param ehPrincipal Se deve ser marcado como contato principal
   * @param obrigatorio Se o preenchimento deste contato é obrigatório
   */
  criarForm(
    dados?: Partial<CriarContatoBeneficiarioDto>,
    ehPrincipal = false,
    obrigatorio = true
  ): FormGroup {
    const grupo = this.fb.group({
      tipoContato: [
        dados?.tipoContato || ('' as TipoContato),
        obrigatorio ? [Validators.required] : [],
      ],
      valor: [
        dados?.valor || '',
        obrigatorio
          ? [Validators.required, Validators.maxLength(150)]
          : [Validators.maxLength(150)],
      ],
      ehPrincipal: [dados?.ehPrincipal ?? ehPrincipal],
    });

    // Configura validadores iniciais se já houver tipo predefinido
    if (dados?.tipoContato) {
      const valorCtrl = grupo.get('valor');
      if (valorCtrl) {
        this.atualizarValidadoresValor(valorCtrl, dados.tipoContato, obrigatorio);
      }
    }

    return grupo;
  }

  /**
   * Cria o FormArray padrão para listas de contatos com validações de obrigatoriedade.
   *
   * @param obrigatorio Se a lista deve exigir no mínimo 1 contato válido
   */
  criarArrayContatos(obrigatorio = true): FormArray {
    return this.fb.array(
      [],
      obrigatorio ? [Validators.required, Validators.minLength(1)] : []
    );
  }

  /**
   * Atualiza os validadores e máscaras do controle de valor de acordo com o tipo de contato selecionado.
   */
  atualizarValidadoresValor(
    controlValor: AbstractControl,
    tipo: TipoContato | string,
    obrigatorio = true
  ): void {
    if (!tipo) {
      if (!obrigatorio) {
        controlValor.setValidators([Validators.maxLength(150)]);
      } else {
        controlValor.setValidators([
          Validators.required,
          Validators.maxLength(150),
        ]);
      }
    } else if (tipo === 'CELULAR') {
      controlValor.setValidators([
        Validators.required,
        Validators.pattern(/^(\d{11}|\(\d{2}\)\s?\d{5}-\d{4})$/),
        Validators.maxLength(15),
      ]);
    } else if (tipo === 'TELEFONE_FIXO') {
      controlValor.setValidators([
        Validators.required,
        Validators.pattern(/^(\d{10}|\(\d{2}\)\s?\d{4}-\d{4})$/),
        Validators.maxLength(14),
      ]);
    } else {
      controlValor.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(150),
      ]);
    }

    controlValor.updateValueAndValidity();
  }

  /** Retorna o tipo de input HTML compatível ('email' ou 'tel') */
  obterTipoInput(tipo: TipoContato | string): InputType {
    return tipo === 'EMAIL' ? 'email' : 'tel';
  }

  /** Retorna o tipo de máscara a ser aplicada pelo AppMaskDirective */
  obterMascara(tipo: TipoContato | string): InputMaskType | undefined {
    if (tipo === 'CELULAR') return 'celular';
    if (tipo === 'TELEFONE_FIXO') return 'telefone_fixo';
    return undefined;
  }

  /** Retorna o placeholder adequado para o tipo de contato */
  obterPlaceholder(tipo: TipoContato | string): string {
    switch (tipo) {
      case 'CELULAR':
        return 'Ex: (11) 99999-9999';
      case 'TELEFONE_FIXO':
        return 'Ex: (11) 3333-4444';
      default:
        return 'exemplo@email.com';
    }
  }

  /** Retorna o tamanho máximo de caracteres permitido para o tipo */
  obterMaxLength(tipo: TipoContato | string): number {
    switch (tipo) {
      case 'CELULAR':
        return 15;
      case 'TELEFONE_FIXO':
        return 14;
      default:
        return 150;
    }
  }

  /** Sanitiza o valor para envio à API (remove máscaras de telefone ou aplica trim em emails) */
  sanitizarValor(tipo: TipoContato | string, valor: string): string {
    if (tipo === 'EMAIL') {
      return (valor || '').trim();
    }
    return (valor || '').replace(/\D/g, '');
  }
}
