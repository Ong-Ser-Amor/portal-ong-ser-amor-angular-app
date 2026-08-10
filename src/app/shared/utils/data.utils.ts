/**
 * Formata uma data no formato ISO ('YYYY-MM-DD' ou 'YYYY-MM-DDTHH:mm:ss.sssZ')
 * para o padrão brasileiro 'DD/MM/AAAA'.
 */
export function formatarData(dataStr?: string | null): string {
  if (!dataStr) return '-';
  const dataApenas = dataStr.includes('T') ? dataStr.split('T')[0] : dataStr;
  const parts = dataApenas.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dataStr;
}

/**
 * Converte um valor de data (Date object, string ISO com hora ou 'DD/MM/AAAA')
 * para o formato ISO limpo de envio da API ('YYYY-MM-DD').
 */
export function converterParaIsoDate(dataValue?: string | Date | null): string {
  if (!dataValue) return '';

  if (dataValue instanceof Date) {
    const yyyy = dataValue.getFullYear();
    const mm = String(dataValue.getMonth() + 1).padStart(2, '0');
    const dd = String(dataValue.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof dataValue === 'string') {
    const dataApenas = dataValue.includes('T') ? dataValue.split('T')[0] : dataValue;
    if (dataApenas.includes('/')) {
      const parts = dataApenas.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    return dataApenas;
  }

  return '';
}

/**
 * Calcula a idade em anos a partir de uma data de nascimento.
 */
export function calcularIdade(dataValue?: string | Date | null): number | null {
  if (!dataValue) return null;
  let data: Date | null = null;
  const anoAtual = new Date().getFullYear();
  const anoMinimo = anoAtual - 150;
  const anoMaximo = anoAtual;

  if (dataValue instanceof Date) {
    data = dataValue;
  } else if (typeof dataValue === 'string') {
    const dataApenas = dataValue.includes('T') ? dataValue.split('T')[0] : dataValue;
    if (dataApenas.includes('-')) {
      const parts = dataApenas.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        const ano = Number(parts[0]);
        const mes = Number(parts[1]);
        const dia = Number(parts[2]);
        if (ano >= anoMinimo && ano <= anoMaximo && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
          data = new Date(ano, mes - 1, dia);
        }
      }
    } else if (dataApenas.includes('/')) {
      const parts = dataApenas.split('/');
      if (parts.length === 3 && parts[2].length === 4) {
        const dia = Number(parts[0]);
        const mes = Number(parts[1]);
        const ano = Number(parts[2]);
        if (ano >= anoMinimo && ano <= anoMaximo && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
          data = new Date(ano, mes - 1, dia);
        }
      }
    }
  }

  if (!data || isNaN(data.getTime())) return null;

  const ano = data.getFullYear();
  if (ano < anoMinimo || ano > anoMaximo) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - data.getFullYear();
  const m = hoje.getMonth() - data.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < data.getDate())) {
    idade--;
  }

  return idade;
}
