import { useCallback, useEffect, useMemo, useState } from 'react'



const API_URL = (

  import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

).replace(/\/+$/, '')



const TOKEN_KEY = 'smartcarbo-token'

const STORAGE_KEY = 'smartcarbo-evolucao-pesos-v1'

const META_CALORIAS_KEY = 'smartcarbo-meta-calorias-v1'

const META_PESO_KEY = 'smartcarbo-meta-peso-v1'

const CALORIAS_LOCAL_KEY = 'smartcarbo-evolucao-calorias-v1'



const fmt = (n) =>

  Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })



const hojeISO = () => {

  const d = new Date()

  const p = (n) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`

}



const diaMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`



function lerRegistros(chave) {

  try {

    const dados = JSON.parse(localStorage.getItem(chave) || '[]')

    return Array.isArray(dados) ? dados : []

  } catch {

    return []

  }

}



function lerMeta(chave, padrao) {

  try {

    const valor = Number(localStorage.getItem(chave))

    return Number.isFinite(valor) && valor > 0 ? valor : padrao

  } catch {

    return padrao

  }

}



function cabecalhos(extra = {}) {

  const token = localStorage.getItem(TOKEN_KEY)

  return {

    Accept: 'application/json',

    ...extra,

    ...(token ? { Authorization: `Bearer ${token}` } : {}),

  }

}



async function mensagemErro(response, padrao) {

  let mensagem = padrao

  try {

    const body = await response.json()

    mensagem = body.mensagem || body.message || body.detail || padrao

  } catch {

    // A resposta pode não conter JSON.

  }

  if (response.status === 401) {

    mensagem = 'Sua sessão expirou. Entre novamente no SmartCarbo.'

  } else if (response.status === 403) {

    mensagem = 'Você não tem permissão para executar esta operação.'

  }

  return new Error(`${mensagem} (HTTP ${response.status})`)

}



async function buscarPesosAPI() {

  const response = await fetch(`${API_URL}/v1/pesos`, {

    headers: cabecalhos(),

  })

  if (!response.ok) {

    throw await mensagemErro(response, 'Não foi possível carregar o histórico de peso.')

  }

  const body = await response.json()

  if (!Array.isArray(body)) {

    throw new Error('A API de peso retornou um formato inválido.')

  }

  return body

    .map((r) => ({

      id: r.id,

      data: String(r.data || '').slice(0, 10),

      valor: Number(r.peso),

    }))

    .filter((r) => r.data && Number.isFinite(r.valor) && r.valor > 0)

    .sort((a, b) => a.data.localeCompare(b.data))

}



async function salvarPesoAPI({ data, valor }) {

  let response

  try {

    response = await fetch(`${API_URL}/v1/pesos`, {

      method: 'POST',

      headers: cabecalhos({ 'Content-Type': 'application/json' }),

      body: JSON.stringify({ data, peso: valor }),

      signal: AbortSignal.timeout(30000),

    })

  } catch (error) {

    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {

      throw new Error('O salvamento excedeu 30 segundos. Verifique a requisição POST no navegador e o terminal do backend.')

    }

    if (error?.name === 'TypeError') {

      throw new Error('Não foi possível conectar ao backend. Confira se o Spring Boot está rodando em http://localhost:8080 e se a URL da API está correta.')

    }

    throw error

  }

  if (!response.ok) {

    throw await mensagemErro(response, 'Não foi possível registrar o peso.')

  }

  return response.status === 204 ? null : response.json().catch(() => null)

}



async function buscarCaloriasAPI(inicio, fim) {

  const response = await fetch(

    `${API_URL}/v1/dashboard/calorias?inicio=${encodeURIComponent(inicio)}&fim=${encodeURIComponent(fim)}`,

    { headers: cabecalhos() },

  )

  if (!response.ok) {

    throw await mensagemErro(response, 'Não foi possível carregar a evolução calórica.')

  }



  const body = await response.json()

  if (!Array.isArray(body)) {

    throw new Error('A API de calorias retornou um formato inválido.')

  }



  return body

    .map((r) => ({

      data: String(r.data || '').slice(0, 10),

      valor: Number(r.calorias ?? 0),

    }))

    .filter((r) => r.data && Number.isFinite(r.valor) && r.valor >= 0)

    .sort((a, b) => a.data.localeCompare(b.data))

}



function obterInicio(periodo) {

  const fim = hojeISO()

  const d = new Date(`${fim}T12:00:00`)

  d.setDate(d.getDate() - (Number(periodo) - 1))

  const p = (n) => String(n).padStart(2, '0')

  const inicio = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`

  return { inicio, fim }

}



function Grafico({ dados, unidade, tipo, periodo, metaCalorias, metaPeso }) {

  const temDados = dados.length > 0

  const valores = dados.map((d) => Number(d.valor))

  const meta = tipo === 'peso' ? metaPeso : tipo === 'calorias' ? metaCalorias : 85

  const margem = tipo === 'peso' ? 2 : tipo === 'calorias' ? 100 : 5

  const passo = tipo === 'peso' ? 1 : tipo === 'calorias' ? 100 : 5

  const baseMin = temDados ? Math.min(...valores) : meta - margem

  const baseMax = temDados ? Math.max(...valores) : meta + margem

  let min = Math.floor(Math.min(baseMin - margem, meta - margem * 0.25) / passo) * passo

  let max = Math.ceil(Math.max(baseMax + margem, meta + margem * 0.25) / passo) * passo

  if (max <= min) max = min + passo



  const hoje = new Date(`${hojeISO()}T12:00:00`)

  const inicio = new Date(hoje)

  inicio.setDate(inicio.getDate() - (Number(periodo) - 1))

  const timestamp = (iso) => new Date(`${iso}T12:00:00`).getTime()

  const inicioTs = inicio.getTime()

  const fimTs = hoje.getTime()

  const x = (d) => 30 + ((timestamp(d.data) - inicioTs) / Math.max(1, fimTs - inicioTs)) * 940

  const y = (v) => 150 - ((v - min) / Math.max(1, max - min)) * 112

  const pontosOrdenados = [...dados].sort((a, b) => a.data.localeCompare(b.data))

  const points = pontosOrdenados.map((d) => `${x(d)},${y(Number(d.valor))}`).join(' ')

  const primeiroPonto = pontosOrdenados[0]
  const ultimoPonto = pontosOrdenados[pontosOrdenados.length - 1]
  const area = temDados
    ? `${x(primeiroPonto)},150 ${points} ${x(ultimoPonto)},150`
    : ''

  const metaY = y(meta)

  const metaLabel = tipo === 'peso'

    ? `Meta: ${fmt(metaPeso)} kg`

    : tipo === 'calorias'

      ? `Meta: ${fmt(metaCalorias)} kcal`

      : 'Meta: 85 pts'



  const ticks = Array.from({ length: 5 }, (_, i) => {

    const d = new Date(inicio)

    d.setDate(inicio.getDate() + Math.round(((Number(periodo) - 1) * i) / 4))

    const p = (n) => String(n).padStart(2, '0')

    return {

      data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,

      x: 30 + (i * 940) / 4,

    }

  })



  return (

    <div className="ev-chart">

      <div className="ev-y-labels">

        <span>{fmt(max)}{unidade}</span>

        <span>{fmt((max + min) / 2)}{unidade}</span>

        <span>{fmt(min)}{unidade}</span>

      </div>

      <svg viewBox="0 0 1000 184" role="img" aria-label="Gráfico de evolução" preserveAspectRatio="none">

        <defs>

          <linearGradient id={`ev-fill-${tipo}`} x1="0" x2="0" y1="0" y2="1">

            <stop offset="0%" stopColor="#16866d" stopOpacity=".22" />

            <stop offset="100%" stopColor="#16866d" stopOpacity=".015" />

          </linearGradient>

        </defs>

        {[38, 75, 112, 150].map((yy) => (

          <line key={yy} x1="30" y1={yy} x2="970" y2={yy} stroke="#e8efeb" strokeWidth="1" strokeDasharray="3 5" />

        ))}

        <line x1="30" y1={metaY} x2="970" y2={metaY} stroke="#d49a37" strokeWidth="1.8" strokeDasharray="7 5" />

        <rect x="812" y={Math.max(4, metaY - 16)} width="158" height="14" rx="4" fill="#fff8e9" />

        <text x="964" y={Math.max(14, metaY - 6)} fill="#9a6a16" fontSize="10" textAnchor="end">{metaLabel}</text>

        {temDados && (

          <>

            <polygon points={area} fill={`url(#ev-fill-${tipo})`} />

            <polyline points={points} fill="none" stroke="#167a63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {pontosOrdenados.map((d, i) => (

              <circle key={`${d.data}-${i}`} cx={x(d)} cy={y(Number(d.valor))} r="3" fill="#167a63" stroke="#fff" strokeWidth="1.2">

                <title>{`${diaMes(d.data)}: ${fmt(d.valor)} ${unidade}`}</title>

              </circle>

            ))}

          </>

        )}

        {ticks.map((t, i) => (

          <text key={t.data} x={t.x} y="174" fill="#71827b" fontSize="12" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>

            {diaMes(t.data)}

          </text>

        ))}

        {!temDados && (

          <text x="500" y="95" textAnchor="middle" fill="#71827b" fontSize="14">

            Nenhuma medição neste período.

          </text>

        )}

      </svg>

    </div>

  )

}



export default function EvolucaoIntegrada({ profileName = 'Usuário', searchTerm = '' }) {

  const [tipo, setTipo] = useState('peso')

  const [periodo, setPeriodo] = useState('30')

  const [registros, setRegistros] = useState([])

  const [registrosCalorias, setRegistrosCalorias] = useState([])

  const [registrosCaloriasLocais, setRegistrosCaloriasLocais] = useState(() => lerRegistros(CALORIAS_LOCAL_KEY))

  const [metaCalorias, setMetaCalorias] = useState(() => lerMeta(META_CALORIAS_KEY, 1800))

  const [metaPeso, setMetaPeso] = useState(() => lerMeta(META_PESO_KEY, 55))

  const [carregando, setCarregando] = useState(true)

  const [carregandoCalorias, setCarregandoCalorias] = useState(false)

  const [erroAPI, setErroAPI] = useState('')

  const [erroCalorias, setErroCalorias] = useState('')

  const [modoLocal, setModoLocal] = useState(false)

  const [metaAberta, setMetaAberta] = useState(false)

  const [metaRascunho, setMetaRascunho] = useState('1800')

  const [metaPesoAberta, setMetaPesoAberta] = useState(false)

  const [metaPesoRascunho, setMetaPesoRascunho] = useState('55')

  const [modal, setModal] = useState(false)

  const [salvandoPeso, setSalvandoPeso] = useState(false)

  const [valor, setValor] = useState('')

  const [refeicao, setRefeicao] = useState('Almoço')

  const [alimentos, setAlimentos] = useState('')

  const [editandoPeso, setEditandoPeso] = useState(null)

  const [exclusaoPendente, setExclusaoPendente] = useState(null)

  const [data, setData] = useState(hojeISO)

  const [erro, setErro] = useState('')

  const [aviso, setAviso] = useState('')



  const carregarPesos = useCallback(async () => {

    setCarregando(true)

    setErroAPI('')

    setModoLocal(false)

    try {

      setRegistros(await buscarPesosAPI())

    } catch (e) {

      setErroAPI(e.message || 'Não foi possível carregar os pesos.')

      setModoLocal(true)

      setRegistros(lerRegistros(STORAGE_KEY))

    } finally {

      setCarregando(false)

    }

  }, [])



  const carregarCalorias = useCallback(async () => {

    const { inicio, fim } = obterInicio(periodo)

    setCarregandoCalorias(true)

    setErroCalorias('')

    try {

      const dados = await buscarCaloriasAPI(inicio, fim)

      setRegistrosCalorias(dados)

    } catch (e) {

      setErroCalorias(e.message || 'Não foi possível carregar a evolução calórica.')

      setRegistrosCalorias([])

    } finally {

      setCarregandoCalorias(false)

    }

  }, [periodo])



  useEffect(() => {

    carregarPesos()

  }, [carregarPesos])



  useEffect(() => {

    carregarCalorias()

  }, [carregarCalorias])



  useEffect(() => {

    try { localStorage.setItem(CALORIAS_LOCAL_KEY, JSON.stringify(registrosCaloriasLocais)) } catch { /* armazenamento local indisponível */ }

  }, [registrosCaloriasLocais])



  useEffect(() => {

    if (!aviso) return undefined

    const timer = setTimeout(() => setAviso(''), 3000)

    return () => clearTimeout(timer)

  }, [aviso])



  const dentroPeriodo = useCallback((r) => {

    if (!r.data) return false

    const { inicio, fim } = obterInicio(periodo)

    return r.data >= inicio && r.data <= fim

  }, [periodo])



  const dados = useMemo(() => {

    if (tipo === 'peso') {

      return registros

        .filter(dentroPeriodo)

        .map((r) => ({ ...r, valor: Number(r.valor), dia: diaMes(r.data) }))

        .sort((a, b) => a.data.localeCompare(b.data))

    }

    if (tipo === 'calorias') {

      const porDia = new Map()

      registrosCalorias.filter(dentroPeriodo).forEach((r) => porDia.set(r.data, (porDia.get(r.data) || 0) + Number(r.valor)))

      registrosCaloriasLocais.filter(dentroPeriodo).forEach((r) => porDia.set(r.data, (porDia.get(r.data) || 0) + Number(r.calorias)))

      return [...porDia.entries()]

        .map(([data, valor]) => ({ data, valor, dia: diaMes(data) }))

        .sort((a, b) => a.data.localeCompare(b.data))

    }

    return []

  }, [tipo, registros, registrosCalorias, registrosCaloriasLocais, dentroPeriodo])



  const pesosVisiveis = useMemo(

    () => [...registros].sort((a, b) => b.data.localeCompare(a.data)),

    [registros],

  )



  const atual = dados.length ? Number(dados[dados.length - 1].valor) : 0

  const mediaCalorias = dados.length

    ? Math.round(dados.reduce((s, d) => s + Number(d.valor), 0) / dados.length)

    : 0

  const unidade = tipo === 'peso' ? ' kg' : tipo === 'calorias' ? ' kcal' : ' pts'



  const resumo = tipo === 'peso'

    ? [

        { label: 'Peso atual', value: dados.length ? `${fmt(atual)} kg` : '—', sub: 'última medição no período', icon: '↘' },

        { label: 'Variação', value: dados.length > 1 ? `${atual - Number(dados[0].valor) > 0 ? '+' : ''}${fmt(atual - Number(dados[0].valor))} kg` : '— kg', sub: `nos últimos ${periodo} dias`, icon: '⌁' },

        { label: 'Meta de peso', value: `${fmt(metaPeso)} kg`, sub: !dados.length ? 'registre seu peso' : atual <= metaPeso ? 'meta numérica atingida' : `faltam ${fmt(atual - metaPeso)} kg`, icon: '⚑' },

      ]

    : tipo === 'calorias'

      ? [

          { label: 'Média diária', value: `${fmt(mediaCalorias)} kcal`, sub: 'média diária no período selecionado', icon: '◉' },

          { label: 'Variação', value: dados.length > 1 ? `${fmt(Number(dados[dados.length - 1].valor) - Number(dados[0].valor))} kcal` : '— kcal', sub: `nos últimos ${periodo} dias`, icon: '⌁' },

          { label: 'Meta diária', value: `${fmt(metaCalorias)} kcal`, sub: mediaCalorias ? mediaCalorias > metaCalorias ? `${fmt(mediaCalorias - metaCalorias)} kcal acima da meta` : `${fmt(metaCalorias - mediaCalorias)} kcal abaixo da meta` : 'sem consumo registrado', icon: '⚑' },

        ]

      : [

          { label: 'Health Score atual', value: 'Indisponível', sub: 'cálculo real ainda não implementado', icon: '✦' },

          { label: 'Variação', value: '—', sub: 'sem histórico real', icon: '⌁' },

          { label: 'Objetivo', value: '85 pts', sub: 'referência futura', icon: '⚑' },

        ]



  const resultadosBusca = useMemo(() => {

    const q = searchTerm.trim().toLocaleLowerCase('pt-BR')

    if (!q) return []

    const entradas = [

      ...registros.map((r) => ({

        tipo: 'peso',

        rotulo: 'Peso',

        data: r.data,

        detalhe: `${fmt(r.valor)} kg`,

        texto: `peso ${r.data} ${r.valor} kg`,

      })),

      ...registrosCalorias.map((r) => ({ tipo: 'calorias', rotulo: 'Calorias', data: r.data, detalhe: `${fmt(r.valor)} kcal`, texto: `calorias ${r.data} ${r.valor} kcal` })),

      ...registrosCaloriasLocais.map((r) => ({ tipo: 'calorias', rotulo: 'Calorias', data: r.data, detalhe: `${fmt(r.calorias)} kcal`, texto: `calorias ${r.data} ${r.calorias} kcal ${r.refeicao || ''} ${r.alimentos || ''}` })),

    ]

    return entradas

      .filter((r) => r.texto.toLocaleLowerCase('pt-BR').includes(q))

      .sort((a, b) => b.data.localeCompare(a.data))

      .slice(0, 8)

  }, [searchTerm, registros, registrosCalorias, registrosCaloriasLocais])



  function salvarMetaPeso(e) {

    e.preventDefault()

    const n = Number(String(metaPesoRascunho).replace(',', '.'))

    if (!Number.isFinite(n) || n < 1 || n > 500) return

    setMetaPeso(n)

    try {

      localStorage.setItem(META_PESO_KEY, String(n))

    } catch {

      // Armazenamento local indisponível.

    }

    setMetaPesoAberta(false)

    setAviso('Meta de peso salva neste navegador.')

  }



  function salvarMeta(e) {

    e.preventDefault()

    const n = Number(String(metaRascunho).replace(',', '.'))

    if (!Number.isFinite(n) || n < 1 || n > 10000) return

    setMetaCalorias(n)

    try {

      localStorage.setItem(META_CALORIAS_KEY, String(n))

    } catch {

      // Armazenamento local indisponível.

    }

    setMetaAberta(false)

    setAviso('Meta diária salva neste navegador.')

  }



  function iniciarEdicaoPeso(registro) {

    if (!modoLocal) {

      setErroAPI('A edição de peso no servidor ainda exige um endpoint PUT no backend.')

      return

    }

    setEditandoPeso(registro.data)

    setData(registro.data)

    setValor(String(registro.valor).replace('.', ','))

    setErro('')

    setModal(true)

  }



  function excluirPesoLocal(dataRegistro) {

    if (!modoLocal) {

      setErroAPI('A API atual não oferece exclusão de peso. Nenhum dado foi removido do servidor.')

      return

    }

    const novo = registros.filter((r) => r.data !== dataRegistro)

    setRegistros(novo)

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(novo)) } catch { /* armazenamento local indisponível */ }

    setAviso('Registro removido deste navegador.')

  }



  async function salvarPeso(e) {

    e.preventDefault()

    if (salvandoPeso) return



    setErro('')

    setAviso('')



    const n = Number(String(valor).trim().replace(',', '.'))



    if (!Number.isFinite(n) || n < 20 || n > 400) {

      setErro('Informe um peso válido entre 20 e 400 kg. Exemplo: 57,5.')

      return

    }



    if (!data || data > hojeISO()) {

      setErro('Selecione uma data válida, até hoje.')

      return

    }



    setSalvandoPeso(true)



    try {

      if (modoLocal) {

        const novo = [

          ...registros.filter((r) => r.data !== data && r.data !== editandoPeso),

          { data, valor: Math.round(n * 10) / 10 },

        ].sort((a, b) => a.data.localeCompare(b.data))



        try {

          localStorage.setItem(STORAGE_KEY, JSON.stringify(novo))

        } catch {

          throw new Error('O navegador não permitiu salvar o peso localmente.')

        }



        setRegistros(novo)

        setAviso(editandoPeso

          ? 'Peso atualizado somente neste navegador.'

          : 'Peso salvo somente neste navegador. Para salvar na conta, verifique a conexão com o servidor.')

      } else {

        if (editandoPeso) {

          throw new Error('A edição de peso no servidor ainda não está implementada. Nenhuma alteração foi enviada.')

        }



        const resposta = await salvarPesoAPI({ data, valor: Math.round(n * 10) / 10 })

        if (resposta && resposta.data) {
          const registroSalvo = {
            id: resposta.id,
            data: String(resposta.data).slice(0, 10),
            valor: Number(resposta.peso),
          }

          setRegistros((anteriores) => {
            const semMesmoDia = anteriores.filter((r) => r.data !== registroSalvo.data)
            return [...semMesmoDia, registroSalvo].sort((a, b) => a.data.localeCompare(b.data))
          })
        }

        setAviso('Peso salvo no servidor.')
        setModal(false)
        // Atualiza o histórico em segundo plano sem bloquear o fechamento do modal.
        void carregarPesos().catch((erro) => {
          console.error('Erro ao atualizar histórico de peso:', erro)
        })
      }



      setValor('')

      setErro('')

      setEditandoPeso(null)

      setModal(false)

    } catch (e2) {

      const mensagem = e2?.message || 'Não foi possível salvar o peso.'

      setErro(

        mensagem.includes('Failed to fetch') || mensagem.includes('NetworkError')

          ? 'Não foi possível conectar ao backend. Confira se o Spring Boot está rodando em http://localhost:8080 e se a URL da API está correta.'

          : mensagem,

      )

    } finally {

      setSalvandoPeso(false)

    }

  }



  function salvarConsumo(e) {

    e.preventDefault()

    const n = Number(String(valor).replace(',', '.'))

    if (!Number.isFinite(n) || n <= 0 || n > 10000) {

      setErro('Informe calorias entre 1 e 10.000 kcal.')

      return

    }

    if (!data || data > hojeISO()) {

      setErro('Selecione uma data válida, até hoje.')

      return

    }

    const novo = [...registrosCaloriasLocais, {

      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,

      data, refeicao, alimentos: alimentos.trim(), calorias: n,

    }].sort((a, b) => a.data.localeCompare(b.data))

    setRegistrosCaloriasLocais(novo)

    setValor('')

    setAlimentos('')

    setErro('')

    setModal(false)

    setAviso('Consumo salvo somente neste navegador. Para persistir no banco, registre pelo Diário alimentar.')

  }



  function abrirModalRegistro() {

    setValor('')

    setErro('')

    setData(hojeISO())

    setEditandoPeso(null)

    setRefeicao('Almoço')

    setAlimentos('')

    setModal(true)

  }



  return (

    <section className="evolution-page">

      <div className="ev-heading">

        <div>

          <h1>Evolução</h1>

          <p>Acompanhe seu progresso e veja sua evolução ao longo do tempo.</p>

        </div>

      </div>



      <div className="ev-toolbar">

        <div className="ev-tabs" role="tablist" aria-label="Tipo de evolução">

          {[

            ['peso', 'Peso'],

            ['calorias', 'Calorias'],

            ['health-score', 'Health Score'],

          ].map(([id, label]) => (

            <button key={id} type="button" className={tipo === id ? 'active' : ''} role="tab" aria-selected={tipo === id} onClick={() => setTipo(id)}>

              {label}

            </button>

          ))}

        </div>

        <label className="ev-period">

          <span className="ev-period__icon" aria-hidden="true">▦</span>

          <span className="ev-period__label">Período</span>

          <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período">

            <option value="7">7 dias</option>

            <option value="30">30 dias</option>

            <option value="90">90 dias</option>

          </select>

          <span className="ev-period__chevron" aria-hidden="true">⌄</span>

        </label>

      </div>



      {tipo === 'peso' && (

        <div className="ev-goal-action">

          <span>Defina seu peso-alvo para acompanhar a evolução.</span>

          <button type="button" onClick={() => { setMetaPesoRascunho(String(metaPeso)); setMetaPesoAberta(true) }}>⚙ Alterar meta de peso</button>

        </div>

      )}



      {tipo === 'calorias' && (

        <div className="ev-goal-action">

          <span>Consumo calculado a partir dos registros alimentares do servidor.</span>

          <button type="button" onClick={() => { setMetaRascunho(String(metaCalorias)); setMetaAberta(true) }}>⚙ Alterar meta diária</button>

        </div>

      )}



      {tipo === 'peso' && carregando && <p className="ev-note">Carregando histórico de peso...</p>}

      {tipo === 'peso' && erroAPI && (

        <div className="ev-note" role="alert">

          <p>{erroAPI}</p>

          <button type="button" onClick={carregarPesos}>Tentar novamente</button>

        </div>

      )}

      {tipo === 'calorias' && carregandoCalorias && <p className="ev-note">Carregando evolução calórica do servidor...</p>}

      {tipo === 'calorias' && erroCalorias && (

        <div className="ev-note" role="alert">

          <p>{erroCalorias}</p>

          <button type="button" onClick={carregarCalorias}>Tentar novamente</button>

        </div>

      )}



      {searchTerm.trim() && (

        <section className="ev-search-results" aria-live="polite">

          <div className="ev-search-results__heading">

            <strong>Resultados da busca</strong>

            <span>{resultadosBusca.length} resultado(s)</span>

          </div>

          {resultadosBusca.length ? (

            <div className="ev-search-results__list">

              {resultadosBusca.map((item, index) => (

                <button type="button" className="ev-search-result" key={`${item.tipo}-${item.data}-${index}`} onClick={() => setTipo(item.tipo)}>

                  <span className="ev-search-result__icon">{item.tipo === 'peso' ? '↗' : '◉'}</span>

                  <span className="ev-search-result__main">

                    <strong>{item.rotulo}</strong>

                    <small>{diaMes(item.data)} · {item.detalhe}</small>

                  </span>

                  <span className="ev-search-result__arrow">Ver →</span>

                </button>

              ))}

            </div>

          ) : <p className="ev-search-results__empty">Nenhum registro encontrado para “{searchTerm.trim()}”.</p>}

        </section>

      )}



      <section className="ev-chart-card">

        <div className="ev-card-heading">

          <div>

            <h2>{tipo === 'peso' ? 'Seu peso (kg)' : tipo === 'calorias' ? 'Consumo de calorias (kcal)' : 'Health Score'}</h2>

            <p>{tipo === 'peso' ? 'Acompanhe as mudanças no seu peso' : tipo === 'calorias' ? 'Veja seu consumo diário registrado' : 'O cálculo real ainda não está disponível'}</p>

          </div>

          {(tipo === 'peso' || tipo === 'calorias') && <button type="button" className="ev-register" onClick={abrirModalRegistro}>＋ {tipo === 'peso' ? 'Registrar peso' : 'Registrar consumo'}</button>}

        </div>

        <Grafico dados={dados} unidade={unidade} tipo={tipo} periodo={periodo} metaCalorias={metaCalorias} metaPeso={metaPeso} />

      </section>



      <div className="ev-stats">

        {resumo.map((item) => (

          <article className="ev-stat" key={item.label}>

            <div><span>{item.label}</span><strong>{item.value}</strong><small>{item.sub}</small></div>

            <b aria-hidden="true">{item.icon}</b>

          </article>

        ))}

      </div>



      {tipo === 'peso' && (

        <section className="ev-history-card">

          <div className="ev-history-heading">

            <div><h2>Histórico de peso</h2><p>Consulte as medições carregadas do servidor.</p></div>

            <span>{pesosVisiveis.length} {pesosVisiveis.length === 1 ? 'registro' : 'registros'}</span>

          </div>

          {pesosVisiveis.length ? (

            <div className="ev-history-list">

              {pesosVisiveis.map((r) => (

                <div className="ev-history-row" key={`${r.data}-${r.id ?? ''}`}>

                  <div className="ev-history-date"><span>{diaMes(r.data)}</span><small>{r.data.slice(0, 4)}</small></div>

                  <div className="ev-history-value">

                    <strong>{fmt(r.valor)} kg</strong>

                    <small>{r.valor <= metaPeso ? 'Meta numérica atingida' : `${fmt(r.valor - metaPeso)} kg acima da sua meta de ${fmt(metaPeso)} kg`}</small>

                  </div>

                  <div className="ev-history-actions">

                    <button type="button" onClick={() => iniciarEdicaoPeso(r)}>Editar</button>

                    <button type="button" className="ev-delete" onClick={() => excluirPesoLocal(r.data)}>Excluir</button>

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="ev-history-empty"><span>◷</span><strong>Nenhuma medição encontrada</strong><p>Use “Registrar peso” para adicionar uma medição.</p></div>

          )}

        </section>

      )}



      {tipo === 'calorias' && (

        <p className="ev-note">

          Olá, {profileName}. Os valores são obtidos dos registros alimentares do usuário autenticado.

          Dias sem registros aparecem como 0 kcal e não significam necessariamente ausência de consumo.

        </p>

      )}



      {tipo === 'health-score' && (

        <p className="ev-note">Olá, {profileName}. O Health Score ainda não possui cálculo real implementado e, por isso, não exibimos valores fictícios.</p>

      )}



      {metaPesoAberta && (

        <div className="ev-modal-backdrop ev-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setMetaPesoAberta(false) }}>

          <form className="ev-dialog ev-goal-dialog" onSubmit={salvarMetaPeso}>

            <div className="ev-dialog-icon">⚖</div>

            <button type="button" className="ev-dialog-close" aria-label="Fechar" onClick={() => setMetaPesoAberta(false)}>×</button>

            <h2>Meta de peso</h2><p>Defina o peso-alvo que deseja acompanhar.</p>

            <label>Meta personalizada (kg)

              <input autoFocus type="number" min="1" max="500" step="0.1" value={metaPesoRascunho} onChange={(e) => setMetaPesoRascunho(e.target.value)} required />

            </label>

            <div className="ev-dialog-hint">A meta é salva neste navegador.</div>

            <div className="ev-dialog-actions">

              <button type="button" className="ev-dialog-cancel" onClick={() => setMetaPesoAberta(false)}>Cancelar</button>

              <button type="submit" className="ev-dialog-primary">Salvar meta</button>

            </div>

          </form>

        </div>

      )}



      {metaAberta && (

        <div className="ev-modal-backdrop ev-dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setMetaAberta(false) }}>

          <form className="ev-dialog ev-goal-dialog" onSubmit={salvarMeta}>

            <div className="ev-dialog-icon">⚙</div>

            <button type="button" className="ev-dialog-close" aria-label="Fechar" onClick={() => setMetaAberta(false)}>×</button>

            <h2>Meta diária de calorias</h2><p>Escolha a meta usada como referência.</p>

            <label>Meta personalizada (kcal)

              <input autoFocus type="number" min="1" max="10000" step="1" value={metaRascunho} onChange={(e) => setMetaRascunho(e.target.value)} required />

            </label>

            <div className="ev-dialog-hint">A meta é salva neste navegador.</div>

            <div className="ev-dialog-actions">

              <button type="button" className="ev-dialog-cancel" onClick={() => setMetaAberta(false)}>Cancelar</button>

              <button type="submit" className="ev-dialog-primary">Salvar meta</button>

            </div>

          </form>

        </div>

      )}



      {modal && (

        <div className="ev-modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) { setModal(false); setEditandoPeso(null) } }}>

          {tipo === 'peso' ? (

            <form className="ev-modal" onSubmit={salvarPeso}>

              <button type="button" className="ev-close" aria-label="Fechar" onClick={() => { setModal(false); setEditandoPeso(null) }}>×</button>

              <h2>{editandoPeso ? 'Editar medição' : 'Registrar peso'}</h2><p>Registre seu peso para acompanhar sua evolução.</p>

              <label>Data da medição

                <input type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} required />

              </label>

              <label>Peso (kg)

                <input type="text" inputMode="decimal" placeholder="Ex.: 57,5" value={valor} onChange={(e) => setValor(e.target.value)} required />

              </label>

              {erro && <small className="ev-error" role="alert">{erro}</small>}

              <div className="ev-modal-actions">

                <button type="button" disabled={salvandoPeso} onClick={() => { setModal(false); setErro(''); setEditandoPeso(null) }}>Cancelar</button>

                <button type="submit" disabled={salvandoPeso}>

                  {salvandoPeso ? 'Salvando...' : editandoPeso ? 'Salvar alterações' : 'Salvar peso'}

                </button>

              </div>

            </form>

          ) : (

            <form className="ev-modal" onSubmit={salvarConsumo}>

              <button type="button" className="ev-close" aria-label="Fechar" onClick={() => setModal(false)}>×</button>

              <h2>Registrar consumo</h2><p>Este registro será salvo apenas neste navegador; para sincronizar com sua conta, use o Diário alimentar.</p>

              <label>Data do consumo

                <input type="date" value={data} max={hojeISO()} onChange={(e) => setData(e.target.value)} required />

              </label>

              <label>Tipo de refeição

                <select value={refeicao} onChange={(e) => setRefeicao(e.target.value)}>

                  <option>Café da manhã</option><option>Almoço</option><option>Jantar</option><option>Lanche</option>

                </select>

              </label>

              <label>Alimentos (opcional)

                <input type="text" maxLength={180} value={alimentos} onChange={(e) => setAlimentos(e.target.value)} placeholder="Ex.: arroz, feijão e frango" />

              </label>

              <label>Calorias (kcal)

                <input type="number" min="1" max="10000" step="1" value={valor} onChange={(e) => setValor(e.target.value)} required />

              </label>

              {erro && <small className="ev-error" role="alert">{erro}</small>}

              <div className="ev-modal-actions">

                <button type="button" onClick={() => { setModal(false); setErro('') }}>Cancelar</button>

                <button type="submit">Salvar consumo</button>

              </div>

            </form>

          )}

        </div>

      )}



      {aviso && <div className="toast" role="status">{aviso}</div>}

    </section>

  )

}
