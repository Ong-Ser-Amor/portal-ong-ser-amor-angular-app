import { Component, inject, signal, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize, map, merge, startWith } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { CardSelecaoBeneficiarioComponent } from '../../../components/card-selecao-beneficiario/card-selecao-beneficiario.component';
import { FormularioDadosFamiliaComponent } from '../../../../../shared/components/formularios/formulario-dados-familia/formulario-dados-familia.component';
import { FormularioEnderecoComponent } from '../../../../../shared/components/formularios/formulario-endereco/formulario-endereco.component';
import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import { FamiliaFormService } from '../../../../../core/services/familia-form.service';
import { EnderecoFormService } from '../../../../../core/services/endereco-form.service';
import { NotificacaoService } from '../../../../../core/services/notificacao.service';
import { Beneficiario, BeneficiarioResumo, TransferirFamiliaDto } from '../../../../../core/models/beneficiario.model';
import { BotaoComponent } from '../../../../../shared/components/ui/botao/botao.component';

export interface DadosModalTransferenciaFamilia {
  beneficiario: Beneficiario;
  ehUnicoMembro?: boolean;
}

type TipoTransferencia = 'EXISTENTE' | 'NOVA';

@Component({
  selector: 'app-modal-transferencia-familia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatRadioModule,
    MatIconModule,
    ModalComponent,
    BotaoComponent,
    CardSelecaoBeneficiarioComponent,
    FormularioDadosFamiliaComponent,
    FormularioEnderecoComponent,
  ],
  templateUrl: './modal-transferencia-familia.component.html',
  styleUrl: './modal-transferencia-familia.component.scss',
})
export class ModalTransferenciaFamiliaComponent {
  private readonly dialogRef = inject(MatDialogRef<ModalTransferenciaFamiliaComponent>);
  private readonly notificacao = inject(NotificacaoService);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly familiaFormService = inject(FamiliaFormService);
  private readonly enderecoFormService = inject(EnderecoFormService);

  readonly data = inject<DadosModalTransferenciaFamilia>(MAT_DIALOG_DATA);

  salvando = signal<boolean>(false);
  tipoTransferencia = signal<TipoTransferencia>('EXISTENTE');
  familiarDestinoSelecionado = signal<BeneficiarioResumo | null>(null);

  readonly ehUnicoMembro = computed(() => Boolean(this.data.ehUnicoMembro));

  readonly formFamilia: FormGroup = this.familiaFormService.criarForm();
  readonly formEndereco: FormGroup = this.enderecoFormService.criarForm();

  readonly formFamiliaValida = toSignal(
    merge(this.formFamilia.statusChanges, this.formFamilia.valueChanges).pipe(
      map(() => this.formFamilia.valid),
      startWith(this.formFamilia.valid)
    ),
    { initialValue: false }
  );

  readonly formEnderecoValido = toSignal(
    merge(this.formEndereco.statusChanges, this.formEndereco.valueChanges).pipe(
      map(() => this.formEndereco.valid),
      startWith(this.formEndereco.valid)
    ),
    { initialValue: false }
  );

  formularioValido = computed(() => {
    if (this.tipoTransferencia() === 'EXISTENTE') {
      const familiar = this.familiarDestinoSelecionado();
      return Boolean(familiar && familiar.familiaId);
    } else {
      return !this.ehUnicoMembro() && this.formFamiliaValida() && this.formEnderecoValido();
    }
  });

  selecionarTipo(tipo: TipoTransferencia): void {
    if (tipo === 'NOVA' && this.ehUnicoMembro()) {
      return;
    }
    this.tipoTransferencia.set(tipo);
  }

  aoSelecionarFamiliarDestino(familiar: BeneficiarioResumo): void {
    if (!familiar.familiaId) {
      this.notificacao.aviso('O beneficiário selecionado não possui uma família vinculada.');
      return;
    }
    if (this.data.beneficiario.familia && familiar.familiaId === this.data.beneficiario.familia.id) {
      this.notificacao.aviso('O beneficiário já pertence a esta mesma família.');
      return;
    }
    this.familiarDestinoSelecionado.set(familiar);
  }

  aoDesvincularFamiliarDestino(): void {
    this.familiarDestinoSelecionado.set(null);
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  salvar(): void {
    if (!this.formularioValido()) {
      if (this.tipoTransferencia() === 'NOVA') {
        this.formFamilia.markAllAsTouched();
        this.formEndereco.markAllAsTouched();
      }
      return;
    }

    let dto: TransferirFamiliaDto;

    if (this.tipoTransferencia() === 'EXISTENTE') {
      const familiaId = this.familiarDestinoSelecionado()!.familiaId!;
      dto = { familiaId };
    } else {
      const formFamiliaVal = this.formFamilia.value;
      const formEnderecoVal = this.formEndereco.value;

      dto = {
        novaFamilia: {
          faixaRenda: formFamiliaVal.faixaRenda,
          tipoMoradia: formFamiliaVal.tipoMoradia,
          possuiBeneficioSocial: Boolean(formFamiliaVal.possuiBeneficioSocial),
          endereco: {
            logradouro: formEnderecoVal.logradouro,
            numero: formEnderecoVal.numero || null,
            complemento: formEnderecoVal.complemento || null,
            bairro: formEnderecoVal.bairro,
            cep: (formEnderecoVal.cep || '').replace(/\D/g, ''),
            cidade: formEnderecoVal.cidade,
            uf: formEnderecoVal.uf,
          },
        },
      };
    }

    this.salvando.set(true);

    this.beneficiarioService
      .transferirFamilia(this.data.beneficiario.id, dto)
      .pipe(finalize(() => this.salvando.set(false)))
      .subscribe({
        next: () => {
          this.notificacao.sucesso('Beneficiário transferido de família com sucesso!');
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao transferir beneficiário de família:', err);
          this.notificacao.erro('Erro ao transferir beneficiário de família. Tente novamente.');
        },
      });
  }
}
