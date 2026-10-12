import { MOCK } from '../mocks/evolucaoMock.js'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

const CHAVE_REGISTROS = 'smartcarbo:mock:pesos'

const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const arredondar = (n) => Math.round(n * 10) / 10
const espera = (ms) => new Promise((r) => setTimeout(r, ms))

function headers(extra = {}) {
  const token = localStorage.getItem('token') // JWT emitido pelo Spring Security
  return {
    Accept: 'application/json',
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ---------- Modo mock: pesos registrados ficam salvos no navegador ----------

function lerRegistros() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVE_REGISTROS))
    return Array.isArray(lista) ? lista : []
  } catch {
    return []
  }
}

function salvarRegistros(lista) {
  try {
    localStorage.setItem(CHAVE_REGISTROS, JSON.stringify(lista))
  } catch {
    /* sem acesso ao storage: o registro só não persiste */
  }
}

const rotulo = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // yyyy-MM-dd -> dd/MM

function progressoMeta(inicio, atual, meta) {
  if (inicio === meta) return 100
  const p = ((inicio - atual) / (inicio - meta)) * 100
  return Math.round(Math.min(100, Math.max(0, p)))
}

// Junta os pesos registrados pelo usuário à série de exemplo e recalcula os cards.
function pesoComRegistros(base, periodo) {
  const limite = new Date()
  limite.setDate(limite.getDate() - periodo)
  limite.setHours(0, 0, 0, 0)

  const registros = lerRegistros()
    .filter((r) => new Date(`${r.data}T00:00:00`) >= limite)
    .sort((a, b) => a.data.localeCompare(b.data))
  if (registros.length === 0) return base

  const serie = [...base.serie, ...registros.map((r) => ({ data: rotulo(r.data), valor: r.valor }))]
  const inicio = serie[0].valor
  const atual = serie[serie.length - 1].valor
  const variacao = arredondar(atual - inicio)
  const meta = base.meta.valor

  const resumo = [
    { rotulo: 'Peso atual', valor: `${fmt(atual)} kg`, legenda: 'último registro', icone: 'down' },
    {
      rotulo: 'Variação',
      valor: `${variacao > 0 ? '+' : ''}${fmt(variacao)} kg`,
      legenda: `últimos ${periodo} dias`,
      icone: variacao > 0 ? 'trend-up' : 'trend-down',
    },
    {
      rotulo: 'Meta',
      valor: `${fmt(meta)} kg`,
      legenda: atual <= meta ? 'meta atingida' : `faltam ${fmt(arredondar(atual - meta))} kg`,
      icone: 'flag',
      progresso: progressoMeta(inicio, atual, meta),
    },
  ]

  return { ...base, serie, resumo }
}

// ---------- API pública do serviço ----------

/**
 * Busca a evolução do usuário.
 * @param {{ tipo: 'peso'|'calorias'|'health-score', periodo: 7|30|90 }} params
 */
export async function buscarEvolucao({ tipo, periodo }) {
  if (USE_MOCK) {
    await espera(350) // simula latência da rede
    const dados = MOCK[tipo]?.[periodo]
    if (!dados) throw new Error('Dados indisponíveis para este filtro.')
    return tipo === 'peso' ? pesoComRegistros(dados, periodo) : dados
  }

  const resposta = await fetch(`${API_URL}/evolucao?tipo=${tipo}&periodo=${periodo}`, {
    headers: headers(),
  })
  if (!resposta.ok) {
    throw new Error(`Erro ao carregar a evolução (${resposta.status}).`)
  }
  return resposta.json()
}

/**
 * Registra um peso.
 * @param {{ data: string, valor: number }} registro  data no formato yyyy-MM-dd
 */
export async function registrarPeso({ data, valor }) {
  if (USE_MOCK) {
    await espera(300)
    const lista = lerRegistros().filter((r) => r.data !== data) // mesmo dia: substitui
    lista.push({ data, valor })
    salvarRegistros(lista)
    return { data, valor }
  }

  const resposta = await fetch(`${API_URL}/evolucao/peso`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ data, valor }),
  })
  if (!resposta.ok) {
    throw new Error(`Erro ao registrar o peso (${resposta.status}).`)
  }
  return resposta.json().catch(() => ({ data, valor }))
}
