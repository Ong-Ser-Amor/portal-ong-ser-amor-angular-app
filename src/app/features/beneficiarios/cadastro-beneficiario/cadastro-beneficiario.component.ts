import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { CpfInputComponent } from '../../../shared/components/cpf-input/cpf-input.component';
import { BotaoComponent } from '../../../shared/components/botao/botao.component';
import { TipoContato, OPCOES_TIPO_CONTATO } from '../../../core/models/contato.model';
import {
  OPCOES_NIVEL_ESCOLARIDADE,
  OPCOES_ESTADO_CIVIL,
  OPCOES_VINCULO_EMPREGATICIO,
} from '../../../core/models/beneficiario.model';

@Component({
  selector: 'app-cadastro-beneficiario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    CabecalhoPaginaComponent,
    InputComponent,
    CpfInputComponent,
    BotaoComponent,
  ],
  templateUrl: './cadastro-beneficiario.component.html',
  styleUrl: './cadastro-beneficiario.component.scss',
})
export class CadastroBeneficiarioComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);

  limiteContatos = 3;

  tiposContato = OPCOES_TIPO_CONTATO;
  niveisEscolaridade = OPCOES_NIVEL_ESCOLARIDADE;
  estadosCivis = OPCOES_ESTADO_CIVIL;
  vinculosEmpregaticios = OPCOES_VINCULO_EMPREGATICIO;

  form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    cpf: ['', [Validators.required]],
    dataNascimento: ['', [Validators.required]],
    escolaridade: [''],
    estadoCivil: [''],
    vinculoEmpregaticio: [''],
    quantidadeFilhos: [0, [Validators.min(0)]],
    emancipado: [false],
    podeSairSozinho: [false],
    contatos: this.fb.array([], [Validators.required, Validators.minLength(1)]),
  });

  ngOnInit(): void {
    // Adiciona 1 contato inicial por padrão
    this.adicionarContato();
  }

  get contatos(): FormArray {
    return this.form.get('contatos') as FormArray;
  }

  adicionarContato(): void {
    if (this.contatos.length < this.limiteContatos) {
      const ehPrimeiro = this.contatos.length === 0;
      const grupoContato = this.fb.group({
        tipoContato: ['CELULAR' as TipoContato, Validators.required],
        valor: ['', Validators.required],
        ehPrincipal: [ehPrimeiro],
      });
      this.contatos.push(grupoContato);
    }
  }

  removerContato(index: number): void {
    const eraPrincipal = this.contatos.at(index).get('ehPrincipal')?.value;
    this.contatos.removeAt(index);
    if (eraPrincipal && this.contatos.length > 0) {
      this.contatos.at(0).get('ehPrincipal')?.setValue(true);
    }
  }

  marcarPrincipal(indexSelecionado: number): void {
    this.contatos.controls.forEach((control, idx) => {
      control.get('ehPrincipal')?.setValue(idx === indexSelecionado);
    });
  }

  voltar(): void {
    this.router.navigate(['/beneficiarios']);
  }
}
