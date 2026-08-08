import { FormBuilder, FormGroup, Validators } from '@angular/forms';

/**
 * Cria e retorna o FormGroup completo com as validações da entidade Pessoa.
 *
 * @param fb Instância do FormBuilder
 */
export function criarFormGroupPessoa(fb: FormBuilder): FormGroup {
  return fb.group({
    nome: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    cpf: ['', [Validators.required, Validators.pattern(/^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/)]],
    dataNascimento: ['', [Validators.required]],
  });
}
