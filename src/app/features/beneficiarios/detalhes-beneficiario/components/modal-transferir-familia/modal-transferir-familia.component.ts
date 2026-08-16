import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { ModalComponent } from '../../../../../shared/components/ui/modal/modal.component';
import { CardSelecaoBeneficiarioComponent } from '../../../components/card-selecao-beneficiario/card-selecao-beneficiario.component';
import { FormularioDadosFamiliaComponent } from '../../../../../shared/components/formularios/formulario-dados-familia/formulario-dados-familia.component';
import { FormularioEnderecoComponent } from '../../../../../shared/components/formularios/formulario-endereco/formulario-endereco.component';
import { BeneficiarioService } from '../../../../../core/services/beneficiario.service';
import { FamiliaFormService } from '../../../../../core/services/familia-form.service';
import { EnderecoFormService } from '../../../../../core/services/endereco-form.service';
import { Beneficiario, BeneficiarioResumo, TransferirFamiliaDto } from '../../../../../core/models/beneficiario.model';
import { BotaoComponent } from '../../../../../shared/components/ui/botao/botao.component';

export interface ModalTransferirFamiliaData {
  beneficiario: Beneficiario;
}

export type TipoTransferencia = 'EXISTENTE' | 'NOVA';

@Component({
  selector: 'app-modal-transferir-familia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatRadioModule,
    MatIconModule,
    ModalComponent,
    BotaoComponent,
    CardSelecaoBeneficiarioComponent,
    FormularioDadosFamiliaComponent,
    FormularioEnderecoComponent,
  ],
  templateUrl: './modal-transferir-familia.component.html',
  styleUrl: './modal-transferir-familia.component.scss',
})
export class ModalTransferirFamiliaComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ModalTransferirFamiliaComponent>);
  private readonly snackBar = inject(MatSnackBar);
  private readonly beneficiarioService = inject(BeneficiarioService);
  private readonly familiaFormService = inject(FamiliaFormService);
  private readonly enderecoFormService = inject(EnderecoFormService);

  readonly data = inject<ModalTransferirFamiliaData>(MAT_DIALOG_DATA);

  salvando = signal<boolean>(false);
  tipoTransferencia = signal<TipoTransferencia>('EXISTENTE');
  familiarDestinoSelecionado = signal<BeneficiarioResumo | null>(null);

  formFamilia!: FormGroup;
  formEndereco!: FormGroup;

  formularioValido = computed(() => {
    if (this.tipoTransferencia() === 'EXISTENTE') {
      const familiar = this.familiarDestinoSelecionado();
      return Boolean(familiar && familiar.familiaId);
    } else {
      return (this.formFamilia?.valid ?? false) && (this.formEndereco?.valid ?? false);
    }
  });

  ngOnInit(): void {
    this.formFamilia = this.familiaFormService.criarForm();
    this.formEndereco = this.enderecoFormService.criarForm();
  }

  selecionarTipo(tipo: TipoTransferencia): void {
    this.tipoTransferencia.set(tipo);
  }

  aoSelecionarFamiliarDestino(familiar: BeneficiarioResumo): void {
    if (!familiar.familiaId) {
      this.snackBar.open('O beneficiário selecionado não possui uma família vinculada.', 'Fechar', { duration: 4000 });
      return;
    }
    if (this.data.beneficiario.familia && familiar.familiaId === this.data.beneficiario.familia.id) {
      this.snackBar.open('O beneficiário já pertence a esta mesma família.', 'Fechar', { duration: 4000 });
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
          this.snackBar.open('Beneficiário transferido de família com sucesso!', 'Fechar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Erro ao transferir beneficiário de família:', err);
          this.snackBar.open('Erro ao transferir beneficiário de família. Tente novamente.', 'Fechar', { duration: 4000 });
        },
      });
  }
}
