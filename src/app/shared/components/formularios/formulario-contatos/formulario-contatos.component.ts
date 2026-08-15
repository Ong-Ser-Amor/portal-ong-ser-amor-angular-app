import { Component, inject, input, OnInit } from '@angular/core';
import {
  FormArray,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { InputComponent, InputType } from '../../ui/input/input.component';
import { SelectComponent } from '../../ui/select/select.component';
import { BotaoComponent } from '../../ui/botao/botao.component';
import { CardComponent } from '../../ui/card/card.component';
import {
  OPCOES_TIPO_CONTATO,
  TipoContato,
} from '../../../../core/models/contato.model';
import { ContatoFormService } from '../../../../core/services/contato-form.service';

@Component({
  selector: 'app-formulario-contatos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatRadioModule,
    InputComponent,
    SelectComponent,
    BotaoComponent,
    CardComponent,
  ],
  templateUrl: './formulario-contatos.component.html',
  styleUrl: './formulario-contatos.component.scss',
})
export class FormularioContatosComponent implements OnInit {
  private readonly contatoFormService = inject(ContatoFormService);

  /** FormArray contendo os grupos de canais de contato */
  contatos = input.required<FormArray>();

  /** Limite máximo de contatos permitidos */
  limiteContatos = input<number>(3);

  /** Define se o preenchimento de pelo menos 1 contato é obrigatório */
  ehObrigatorio = input<boolean>(true);

  /** Se true, desabilita a adição de novos contatos */
  desabilitadoAdicionar = input<boolean>(false);

  readonly tiposContato = OPCOES_TIPO_CONTATO;

  ngOnInit(): void {
    if (this.contatos().length === 0) {
      this.adicionarContato();
    }
  }

  adicionarContato(): void {
    const array = this.contatos();
    if (array.length < this.limiteContatos()) {
      const ehPrimeiro = array.length === 0;
      const obrigatorio = this.ehObrigatorio();

      const grupoContato = this.contatoFormService.criarForm(
        undefined,
        ehPrimeiro,
        obrigatorio
      );

      grupoContato.get('tipoContato')?.valueChanges.subscribe((tipo) => {
        const valorControl = grupoContato.get('valor');
        if (valorControl) {
          valorControl.setValue('', { emitEvent: false });
          this.contatoFormService.atualizarValidadoresValor(
            valorControl,
            tipo || '',
            obrigatorio
          );
        }
      });

      array.push(grupoContato);
    }
  }

  removerContato(index: number): void {
    const array = this.contatos();
    const eraPrincipal = array.at(index).get('ehPrincipal')?.value;
    array.removeAt(index);
    if (eraPrincipal && array.length > 0) {
      array.at(0).get('ehPrincipal')?.setValue(true);
    }
  }

  marcarPrincipal(indexSelecionado: number): void {
    this.contatos().controls.forEach((control, idx) => {
      control.get('ehPrincipal')?.setValue(idx === indexSelecionado);
    });
  }

  obterTipoInputContato(tipo: TipoContato | string): InputType {
    return this.contatoFormService.obterTipoInput(tipo);
  }

  obterPlaceholderContato(tipo: TipoContato | string): string {
    return this.contatoFormService.obterPlaceholder(tipo);
  }

  obterMaxLengthContato(tipo: TipoContato | string): number {
    return this.contatoFormService.obterMaxLength(tipo);
  }
}
