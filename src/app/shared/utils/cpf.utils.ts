/**
 * Remove toda a pontuação e caracteres não numéricos do CPF.
 */
export function limparCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/\D/g, '');
}

/**
 * Formata um CPF no padrão de segurança LGPD: '123.***.***-00'
 * Exibe os 3 primeiros dígitos e os 2 dígitos verificadores finais.
 */
export function ofuscarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';

  const limpo = limparCpf(cpf);
  if (limpo.length !== 11) return cpf;

  const inicio = limpo.substring(0, 3);
  const fim = limpo.substring(9, 11);

  return `${inicio}.***.***-${fim}`;
}

/**
 * Formata um CPF no padrão '000.000.000-00'
 */
export function formatarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';

  const limpo = limparCpf(cpf);
  if (limpo.length !== 11) return cpf;

  return `${limpo.substring(0, 3)}.${limpo.substring(3, 6)}.${limpo.substring(6, 9)}-${limpo.substring(9, 11)}`;
}
