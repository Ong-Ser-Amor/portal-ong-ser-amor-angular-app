import { Component, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CheckboxComponent } from '../../ui/checkbox/checkbox.component';
import { calcularIdade } from '../../../utils/data.utils';

@Component({
  selector: 'app-formulario-permissoes-menor',
  standalone: true,
  imports: [ReactiveFormsModule, CheckboxComponent],
  templateUrl: './formulario-permissoes-menor.component.html',
  styleUrl: './formulario-permissoes-menor.component.scss',
})
export class FormularioPermissoesMenorComponent {
  /** FormGroup contendo os controles de pessoa (dataNascimento, emancipado, podeSairSozinho) */
  formGroup = input.required<FormGroup>();

  get formControlEmancipado() {
    return this.formGroup().get('emancipado') || this.formGroup().parent?.get('emancipado');
  }

  get formControlPodeSairSozinho() {
    return this.formGroup().get('podeSairSozinho') || this.formGroup().parent?.get('podeSairSozinho');
  }

  get idadeAtual(): number | null {
    const dataNasc = this.formGroup().get('dataNascimento')?.value;
    return calcularIdade(dataNasc);
  }

  get podeSerEmancipado(): boolean {
    const idade = this.idadeAtual;
    return idade !== null && idade >= 16 && idade < 18;
  }

  get ehMenorNaoEmancipado(): boolean {
    const idade = this.idadeAtual;
    const emancipado = !!this.formControlEmancipado?.value;
    return idade !== null && idade < 18 && !emancipado;
  }
}
