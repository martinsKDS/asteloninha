// Dados de exemplo (usados quando VITE_USE_MOCK=true).
// O formato é o mesmo que o backend Spring Boot deve devolver em
// GET /api/evolucao?tipo={peso|calorias|health-score}&periodo={7|30|90}
//
// {
//   titulo, unidade,
//   eixoY: { min, max, passo },
//   meta: { valor },                         // desenha a linha tracejada da meta
//   serie: [{ data: 'dd/MM', valor: number }],
//   resumo: [{ rotulo, valor, legenda, icone, progresso? }]   // progresso: 0-100
// }

const pontos = (datas, valores) => datas.map((data, i) => ({ data, valor: valores[i] }))

export const MOCK = {
  peso: {
    7: {
      titulo: 'Seu peso (kg)',
      unidade: 'kg',
      eixoY: { min: 50, max: 65, passo: 5 },
      meta: { valor: 55 },
      serie: pontos(
        ['22/09', '23/09', '24/09', '25/09', '26/09', '27/09', '28/09'],
        [57.5, 57.4, 57.3, 57.2, 57.2, 57.1, 57],
      ),
      resumo: [
        { rotulo: 'Peso atual', valor: '57 kg', legenda: 'desde o início', icone: 'down' },
        { rotulo: 'Variação', valor: '-0,5 kg', legenda: 'últimos 7 dias', icone: 'trend-down' },
        { rotulo: 'Meta', valor: '55 kg', legenda: 'faltam 2 kg', icone: 'flag', progresso: 20 },
      ],
    },
    30: {
      titulo: 'Seu peso (kg)',
      unidade: 'kg',
      eixoY: { min: 50, max: 65, passo: 5 },
      meta: { valor: 55 },
      serie: pontos(['01/09', '08/09', '15/09', '22/09', '28/09'], [59, 58.5, 58, 57.5, 57]),
      resumo: [
        { rotulo: 'Peso atual', valor: '57 kg', legenda: 'desde o início', icone: 'down' },
        { rotulo: 'Variação', valor: '-2 kg', legenda: 'últimos 30 dias', icone: 'trend-down' },
        { rotulo: 'Meta', valor: '55 kg', legenda: 'faltam 2 kg', icone: 'flag', progresso: 50 },
      ],
    },
    90: {
      titulo: 'Seu peso (kg)',
      unidade: 'kg',
      eixoY: { min: 50, max: 65, passo: 5 },
      meta: { valor: 55 },
      serie: pontos(
        ['01/07', '15/07', '01/08', '15/08', '01/09', '15/09', '28/09'],
        [62, 60.5, 59.5, 58.5, 58, 57.5, 57],
      ),
      resumo: [
        { rotulo: 'Peso atual', valor: '57 kg', legenda: 'desde o início', icone: 'down' },
        { rotulo: 'Variação', valor: '-5 kg', legenda: 'últimos 90 dias', icone: 'trend-down' },
        { rotulo: 'Meta', valor: '55 kg', legenda: 'faltam 2 kg', icone: 'flag', progresso: 71 },
      ],
    },
  },

  calorias: {
    7: {
      titulo: 'Suas calorias (kcal)',
      unidade: 'kcal',
      eixoY: { min: 1000, max: 2500, passo: 500 },
      meta: { valor: 1800 },
      serie: pontos(
        ['22/09', '23/09', '24/09', '25/09', '26/09', '27/09', '28/09'],
        [1850, 1720, 1900, 1650, 1780, 2010, 1760],
      ),
      resumo: [
        { rotulo: 'Média diária', valor: '1.810 kcal', legenda: 'últimos 7 dias', icone: 'down' },
        { rotulo: 'Variação', valor: '-90 kcal', legenda: 'últimos 7 dias', icone: 'trend-down' },
        { rotulo: 'Meta diária', valor: '1.800 kcal', legenda: 'dentro da meta', icone: 'flag' },
      ],
    },
    30: {
      titulo: 'Suas calorias (kcal)',
      unidade: 'kcal',
      eixoY: { min: 1000, max: 2500, passo: 500 },
      meta: { valor: 1800 },
      serie: pontos(['01/09', '08/09', '15/09', '22/09', '28/09'], [1850, 1720, 1900, 1650, 1780]),
      resumo: [
        { rotulo: 'Média diária', valor: '1.780 kcal', legenda: 'últimos 30 dias', icone: 'down' },
        { rotulo: 'Variação', valor: '-70 kcal', legenda: 'últimos 30 dias', icone: 'trend-down' },
        { rotulo: 'Meta diária', valor: '1.800 kcal', legenda: 'dentro da meta', icone: 'flag' },
      ],
    },
    90: {
      titulo: 'Suas calorias (kcal)',
      unidade: 'kcal',
      eixoY: { min: 1000, max: 2500, passo: 500 },
      meta: { valor: 1800 },
      serie: pontos(
        ['01/07', '15/07', '01/08', '15/08', '01/09', '15/09', '28/09'],
        [2150, 2050, 1980, 1900, 1850, 1900, 1780],
      ),
      resumo: [
        { rotulo: 'Média diária', valor: '1.950 kcal', legenda: 'últimos 90 dias', icone: 'down' },
        { rotulo: 'Variação', valor: '-370 kcal', legenda: 'últimos 90 dias', icone: 'trend-down' },
        { rotulo: 'Meta diária', valor: '1.800 kcal', legenda: 'dentro da meta', icone: 'flag' },
      ],
    },
  },

  'health-score': {
    7: {
      titulo: 'Seu Health Score',
      unidade: 'pts',
      eixoY: { min: 50, max: 100, passo: 10 },
      meta: { valor: 85 },
      serie: pontos(
        ['22/09', '23/09', '24/09', '25/09', '26/09', '27/09', '28/09'],
        [74, 75, 75, 76, 77, 77, 78],
      ),
      resumo: [
        { rotulo: 'Score atual', valor: '78 pts', legenda: 'hoje', icone: 'up' },
        { rotulo: 'Variação', valor: '+4 pts', legenda: 'últimos 7 dias', icone: 'trend-up' },
        { rotulo: 'Meta', valor: '85 pts', legenda: 'faltam 7 pts', icone: 'flag', progresso: 36 },
      ],
    },
    30: {
      titulo: 'Seu Health Score',
      unidade: 'pts',
      eixoY: { min: 50, max: 100, passo: 10 },
      meta: { valor: 85 },
      serie: pontos(['01/09', '08/09', '15/09', '22/09', '28/09'], [62, 68, 71, 75, 78]),
      resumo: [
        { rotulo: 'Score atual', valor: '78 pts', legenda: 'hoje', icone: 'up' },
        { rotulo: 'Variação', valor: '+16 pts', legenda: 'últimos 30 dias', icone: 'trend-up' },
        { rotulo: 'Meta', valor: '85 pts', legenda: 'faltam 7 pts', icone: 'flag', progresso: 70 },
      ],
    },
    90: {
      titulo: 'Seu Health Score',
      unidade: 'pts',
      eixoY: { min: 50, max: 100, passo: 10 },
      meta: { valor: 85 },
      serie: pontos(
        ['01/07', '15/07', '01/08', '15/08', '01/09', '15/09', '28/09'],
        [55, 58, 60, 64, 62, 71, 78],
      ),
      resumo: [
        { rotulo: 'Score atual', valor: '78 pts', legenda: 'hoje', icone: 'up' },
        { rotulo: 'Variação', valor: '+23 pts', legenda: 'últimos 90 dias', icone: 'trend-up' },
        { rotulo: 'Meta', valor: '85 pts', legenda: 'faltam 7 pts', icone: 'flag', progresso: 77 },
      ],
    },
  },
}
