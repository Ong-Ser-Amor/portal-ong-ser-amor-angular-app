/**
 * Formata um CPF no padrão de segurança LGPD: '123.***.***-00'
 * Exibe os 3 primeiros dígitos e os 2 dígitos verificadores finais.
 */
export function ofuscarCpf(cpf: string | null | undefined): string {
  if (!cpf) return '';

  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return cpf;

  const inicio = limpo.substring(0, 3);
  const fim = limpo.substring(9, 11);

  return `${inicio}.***.***-${fim}`;
}
