import { brParaIso, isoParaBr, mascaraData, partesDaData } from '../src/datas';

describe('mascaraData', () => {
  test.each([
    ['1', '1'],
    ['15', '15'],
    ['151', '15/1'],
    ['1512', '15/12'],
    ['15122', '15/12/2'],
    ['15122026', '15/12/2026'],
    ['15/12/2026', '15/12/2026'],
    ['15122026999', '15/12/2026'],
    ['ab15-12x2026', '15/12/2026'],
    ['', ''],
    [undefined, ''],
  ])('%p -> %p', (entrada, esperado) => {
    expect(mascaraData(entrada)).toBe(esperado);
  });
});

describe('brParaIso', () => {
  test('converte uma data válida para o formato da API', () => {
    expect(brParaIso('15/12/2026')).toBe('2026-12-15');
    expect(brParaIso('01/01/2027')).toBe('2027-01-01');
  });

  test('aceita 29/02 somente em ano bissexto', () => {
    expect(brParaIso('29/02/2028')).toBe('2028-02-29');
    expect(brParaIso('29/02/2027')).toBeNull();
  });

  test.each(['31/02/2026', '32/01/2026', '00/10/2026', '10/13/2026', '10/00/2026', '15/12/26', '2026-12-15', '', null, undefined])(
    'rejeita %p',
    (entrada) => {
      expect(brParaIso(entrada)).toBeNull();
    }
  );
});

describe('isoParaBr', () => {
  test('converte do formato da API para DD/MM/AAAA', () => {
    expect(isoParaBr('2026-12-15')).toBe('15/12/2026');
  });
  test('vazio retorna string vazia', () => {
    expect(isoParaBr('')).toBe('');
    expect(isoParaBr(undefined)).toBe('');
  });
  test('ida e volta preserva a data', () => {
    expect(brParaIso(isoParaBr('2026-03-09'))).toBe('2026-03-09');
  });
});

describe('partesDaData', () => {
  test('separa dia, mês abreviado e ano sem depender de fuso horário', () => {
    expect(partesDaData('2026-12-20')).toEqual({ dia: '20', mes: 'dez', ano: '2026' });
    expect(partesDaData('2026-01-01')).toEqual({ dia: '01', mes: 'jan', ano: '2026' });
  });
});
