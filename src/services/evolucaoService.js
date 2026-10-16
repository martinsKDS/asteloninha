import { MOCK } from '../mocks/evolucaoMock.js';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
).replace(/\/$/, '');

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const TOKEN_KEY = 'smartcarbo-token';

const formatNumber = (value) =>
  Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
  });

const round1 = (value) => Math.round(value * 10) / 10;

const dateLabel = (iso) =>
  `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function headers(extra = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  return {
    Accept: 'application/json',
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response, fallback) {
  let message = fallback;

  try {
    const body = await response.json();

    if (body?.message) {
      message = body.message;
    } else if (body?.mensagem) {
      message = body.mensagem;
    }
  } catch {
    // A resposta não contém JSON.
  }

  if (response.status === 401) {
    message = 'Sua sessão expirou. Entre novamente no SmartCarbo.';
  }

  if (response.status === 403) {
    message = 'Você não tem permissão para acessar estes dados.';
  }

  return new Error(`${message} (HTTP ${response.status})`);
}

function filterPeriod(records, period) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (Number(period) - 1));

  return records
    .filter((record) => {
      if (!record.data) return false;

      const date = new Date(`${record.data}T12:00:00`);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= start &&
        date <= today
      );
    })
    .sort((a, b) => a.data.localeCompare(b.data));
}

function buildWeightEvolution(records, period) {
  const filtered = filterPeriod(records, period);

  const serie = filtered.map((record) => ({
    data: dateLabel(record.data),
    valor: Number(record.peso),
  }));

  const eixoY = serie.length
    ? {
        min: Math.floor(
          Math.min(...serie.map((p) => p.valor)) - 2
        ),
        max: Math.ceil(
          Math.max(...serie.map((p) => p.valor)) + 2
        ),
        passo: 1,
      }
    : {
        min: 40,
        max: 100,
        passo: 10,
      };

  if (!serie.length) {
    return {
      titulo: 'Seu peso (kg)',
      unidade: 'kg',
      eixoY,
      meta: null,
      serie,
      resumo: [
        {
          rotulo: 'Peso atual',
          valor: '—',
          legenda: 'registre uma medição',
          icone: 'up',
        },
        {
          rotulo: 'Variação',
          valor: '—',
          legenda: `últimos ${period} dias`,
          icone: 'trend-up',
        },
        {
          rotulo: 'Meta',
          valor: 'Não definida',
          legenda: 'defina uma meta no perfil',
          icone: 'flag',
        },
      ],
    };
  }

  const first = serie[0].valor;
  const current = serie[serie.length - 1].valor;
  const variation = round1(current - first);

  return {
    titulo: 'Seu peso (kg)',
    unidade: 'kg',
    eixoY,
    meta: null,
    serie,
    resumo: [
      {
        rotulo: 'Peso atual',
        valor: `${formatNumber(current)} kg`,
        legenda: 'último registro',
        icone: variation > 0 ? 'up' : 'down',
      },
      {
        rotulo: 'Variação',
        valor: `${variation > 0 ? '+' : ''}${formatNumber(variation)} kg`,
        legenda: `últimos ${period} dias`,
        icone: variation > 0 ? 'trend-up' : 'trend-down',
      },
      {
        rotulo: 'Registros',
        valor: String(serie.length),
        legenda: `últimos ${period} dias`,
        icone: 'flag',
      },
    ],
  };
}

/**
 * Busca dados de evolução.
 * O histórico de peso utiliza a API real do backend.
 * Calorias e Health Score aguardam endpoints próprios.
 */
export async function buscarEvolucao({ tipo, periodo }) {
  if (USE_MOCK) {
    const modulo = await import('../mocks/evolucaoMock.js');

    const delay =
      modulo.delay ??
      ((ms) =>
        new Promise((resolve) => setTimeout(resolve, ms)));

    await delay(250);

    const data = MOCK[tipo]?.[periodo];

    if (!data) {
      throw new Error(
        'Dados demonstrativos indisponíveis para este filtro.'
      );
    }

    return data;
  }

  if (tipo !== 'peso') {
    throw new Error(
      tipo === 'calorias'
        ? 'O histórico de calorias ainda precisa de um endpoint agregado no backend.'
        : 'O histórico de Health Score ainda precisa de uma regra de cálculo e um endpoint no backend.'
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/pesos`,
    {
      headers: headers(),
    }
  );

  if (!response.ok) {
    throw await parseError(
      response,
      'Não foi possível carregar o histórico de peso.'
    );
  }

  const records = await response.json();

  if (!Array.isArray(records)) {
    throw new Error(
      'A API de peso retornou um formato inesperado.'
    );
  }

  return buildWeightEvolution(records, Number(periodo));
}

/**
 * Registra uma medição de peso.
 */
export async function registrarPeso({ data, valor }) {
  if (USE_MOCK) {
    const key = 'smartcarbo:mock:pesos';

    const records = JSON.parse(
      localStorage.getItem(key) || '[]'
    ).filter((record) => record.data !== data);

    records.push({ data, valor });

    localStorage.setItem(key, JSON.stringify(records));

    return { data, valor };
  }

  const response = await fetch(
    `${API_BASE_URL}/v1/pesos`,
    {
      method: 'POST',
      headers: headers({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        data,
        peso: valor,
      }),
    }
  );

  if (!response.ok) {
    throw await parseError(
      response,
      'Não foi possível registrar o peso.'
    );
  }

  const body =
    response.status === 204
      ? null
      : await response.json().catch(() => null);

  return body
    ? {
        data: body.data,
        valor: body.peso,
      }
    : { data, valor };
}