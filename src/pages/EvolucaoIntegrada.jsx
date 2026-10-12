import { useMemo, useState } from 'react'

const STORAGE_KEY = 'smartcarbo-evolucao-pesos-v1'
const CALORIAS_STORAGE_KEY = 'smartcarbo-evolucao-calorias-v1'
const META_CALORIAS_KEY = 'smartcarbo-meta-calorias-v1'
const META_PESO_KEY = 'smartcarbo-meta-peso-v1'

const basePesos = [
  { data: '2026-09-15', valor: 57.4 },
  { data: '2026-09-18', valor: 57.4 },
  { data: '2026-09-21', valor: 57.5 },
  { data: '2026-09-24', valor: 57.4 },
  { data: '2026-09-27', valor: 57.5 },
  { data: '2026-09-30', valor: 57.4 },
  { data: '2026-10-03', valor: 57.5 },
  { data: '2026-10-06', valor: 57.3 },
  { data: '2026-10-08', valor: 65.0 },
  { data: '2026-10-10', valor: 61.0 },
]
const baseCalorias = [
  { data: '2026-09-15', valor: 1660 }, { data: '2026-09-18', valor: 1680 },
  { data: '2026-09-21', valor: 1690 }, { data: '2026-09-24', valor: 1710 },
  { data: '2026-09-27', valor: 1700 }, { data: '2026-09-30', valor: 1730 },
  { data: '2026-10-03', valor: 1720 }, { data: '2026-10-06', valor: 1740 },
  { data: '2026-10-08', valor: 1750 }, { data: '2026-10-10', valor: 1780 },
]
const baseScore = [
  { data: '2026-09-15', valor: 66 }, { data: '2026-09-18', valor: 67 },
  { data: '2026-09-21', valor: 68 }, { data: '2026-09-24', valor: 69 },
  { data: '2026-09-27', valor: 68 }, { data: '2026-09-30', valor: 70 },
  { data: '2026-10-03', valor: 69 }, { data: '2026-10-06', valor: 70 },
  { data: '2026-10-08', valor: 72 }, { data: '2026-10-10', valor: 74 },
]
const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })
const diaMes = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

function lerRegistros(chave) {
  try {
    const v = JSON.parse(localStorage.getItem(chave) || '[]')
    return Array.isArray(v) ? v : []
  } catch { return [] }
}
const nomeDia = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` }

function Grafico({ dados, unidade, tipo, periodo, metaCalorias = 1800, metaPeso = 55 }) {
  const valores = dados.map(d => d.valor)
  const temDados = dados.length > 0
  const meta = tipo === 'peso' ? metaPeso : tipo === 'calorias' ? metaCalorias : 85
  const margem = tipo === 'peso' ? 1.5 : tipo === 'calorias' ? 100 : 5
  const passo = tipo === 'peso' ? 1 : 10
  const baseMin = temDados ? Math.min(...valores) : meta - margem
  const baseMax = temDados ? Math.max(...valores) : meta + margem
  const min = Math.floor((Math.min(baseMin - margem, meta - margem * 0.25)) / passo) * passo
  const max = Math.ceil((Math.max(baseMax + margem, meta + margem * 0.25)) / passo) * passo
  const hoje = new Date(`${hojeISO()}T12:00:00`)
  const inicio = new Date(hoje)
  inicio.setDate(inicio.getDate() - (Number(periodo) - 1))
  const timestamp = iso => new Date(`${iso}T12:00:00`).getTime()
  const inicioTs = inicio.getTime()
  const fimTs = hoje.getTime()
  const x = d => 30 + ((timestamp(d.data) - inicioTs) / Math.max(1, fimTs - inicioTs)) * 940
  const y = v => 150 - ((v - min) / Math.max(1, max - min)) * 112
  const points = dados.map(d => `${x(d)},${y(d.valor)}`).join(' ')
  const area = temDados ? `30,150 ${points} 970,150` : ''
  const metaY = y(meta)
  const metaLabel = tipo === 'peso' ? `Meta: ${fmt(metaPeso)} kg` : tipo === 'calorias' ? `Meta: ${fmt(metaCalorias)} kcal` : 'Meta: 85 pts'
  const label = tipo === 'peso' ? 'peso' : tipo === 'calorias' ? 'consumo de calorias' : 'Health Score'
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + Math.round((Number(periodo) - 1) * i / 4))
    return { data: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`, x: 30 + i * 940 / 4 }
  })

  return <div className="ev-chart">
    <div className="ev-y-labels">
      <span>{fmt(max)}{unidade}</span>
      <span>{fmt((max + min) / 2)}{unidade}</span>
      <span>{fmt(min)}{unidade}</span>
    </div>
    <svg viewBox="0 0 1000 184" role="img" aria-label={`Gráfico de evolução de ${label}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`ev-fill-${tipo}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#16866d" stopOpacity=".22" />
          <stop offset="100%" stopColor="#16866d" stopOpacity=".015" />
        </linearGradient>
      </defs>
      {[38, 75, 112, 150].map(yy => <line key={yy} x1="30" y1={yy} x2="970" y2={yy} stroke="#e8efeb" strokeWidth="1" strokeDasharray="3 5" />)}
      <line x1="30" y1={metaY} x2="970" y2={metaY} stroke="#d49a37" strokeWidth="1.8" strokeDasharray="7 5" />
      <rect x="812" y={Math.max(4, metaY - 16)} width="158" height="14" rx="4" fill="#fff8e9" />
      <text x="964" y={Math.max(14, metaY - 6)} fill="#9a6a16" fontSize="10" fontWeight="400" textAnchor="end">{metaLabel}</text>
      {temDados && <>
        <polygon points={area} fill={`url(#ev-fill-${tipo})`} />
        <polyline points={points} fill="none" stroke="#167a63" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {dados.map((d, i) => <circle key={`${d.data}-${i}`} cx={x(d)} cy={y(d.valor)} r="2.5" fill="#167a63" stroke="#ffffff" strokeWidth="1.2" />)}
      </>}
      {ticks.map((t, i) => <text key={t.data} x={t.x} y="174" fill="#71827b" fontSize="10" fontWeight="400" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'}>{diaMes(t.data)}</text>)}
    </svg>
    {!temDados && <p className="ev-chart-empty">Nenhuma medição neste período. Registre seus dados para acompanhar sua evolução.</p>}
  </div>
}

export default function EvolucaoIntegrada({ profileName = 'Mariana', searchTerm = '' }) {
  const [tipo, setTipo] = useState('peso')
  const [periodo, setPeriodo] = useState('30')
  const [registros, setRegistros] = useState(() => lerRegistros(STORAGE_KEY))
  const [registrosCalorias, setRegistrosCalorias] = useState(() => lerRegistros(CALORIAS_STORAGE_KEY))
  const [metaCalorias, setMetaCalorias] = useState(() => { try { const n = Number(localStorage.getItem(META_CALORIAS_KEY)); return Number.isFinite(n) && n >= 1 ? n : 1800 } catch { return 1800 } })
  const [metaPeso, setMetaPeso] = useState(() => { try { const n = Number(localStorage.getItem(META_PESO_KEY)); return Number.isFinite(n) && n > 0 ? n : 55 } catch { return 55 } })
  const [metaAberta, setMetaAberta] = useState(false)
  const [metaRascunho, setMetaRascunho] = useState('1800')
  const [metaPesoAberta, setMetaPesoAberta] = useState(false)
  const [metaPesoRascunho, setMetaPesoRascunho] = useState('55')
  const [exclusaoPendente, setExclusaoPendente] = useState(null)
  const [modal, setModal] = useState(false)
  const [editandoPeso, setEditandoPeso] = useState(null)
  const [valor, setValor] = useState('')
  const [data, setData] = useState(hojeISO)
  const [erro, setErro] = useState('')
  const [refeicao, setRefeicao] = useState('Almoço')
  const [alimentos, setAlimentos] = useState('')

  const dados = useMemo(() => {
    const hoje = new Date(`${hojeISO()}T12:00:00`)
    const inicio = new Date(hoje)
    inicio.setDate(inicio.getDate() - (Number(periodo) - 1))
    const dentroPeriodo = r => {
      if (!r.data) return false
      const d = new Date(`${r.data}T12:00:00`)
      return !Number.isNaN(d.getTime()) && d >= inicio && d <= hoje
    }
    if (tipo === 'calorias') {
      const porDia = new Map()
      registrosCalorias.forEach(r => {
        if (dentroPeriodo(r)) porDia.set(r.data, (porDia.get(r.data) || 0) + Number(r.calorias))
      })

      // Antes de haver registros reais, exibe os dados demonstrativos.
      // Após o primeiro registro, usa apenas os dados informados pela pessoa.
      const fonte = registrosCalorias.length > 0
        ? [...porDia.entries()].map(([data, valor]) => ({ data, valor }))
        : baseCalorias.filter(dentroPeriodo).map(r => ({ ...r }))

      return fonte
        .sort((a, b) => a.data.localeCompare(b.data))
        .map(r => ({ dia: diaMes(r.data), data: r.data, valor: r.valor }))
    }
    if (tipo === 'health-score') {
      return baseScore.filter(dentroPeriodo).map(r => ({ ...r, dia: diaMes(r.data) }))
    }
    const todos = [...basePesos, ...registros]
      .filter(dentroPeriodo)
      .map(r => ({ ...r, dia: diaMes(r.data) }))
    return [...new Map(todos.map(d => [d.data, d])).values()]
      .sort((a, b) => a.data.localeCompare(b.data))
  }, [tipo, periodo, registros, registrosCalorias])

  const resultadosBusca = useMemo(() => {
    const q = searchTerm.trim().toLocaleLowerCase('pt-BR')
    if (!q) return []
    const formatData = iso => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
    const entradas = [
      ...[...basePesos, ...registros].map(r => ({ tipo: 'peso', rotulo: 'Peso', data: r.data, valor: r.valor, detalhe: `${fmt(r.valor)} kg`, texto: `peso ${formatData(r.data)} ${r.valor} kg meta 55 kg` })),
      ...[...baseCalorias, ...registrosCalorias].map(r => ({ tipo: 'calorias', rotulo: 'Calorias', data: r.data, valor: r.valor ?? r.calorias, detalhe: r.refeicao ? `${r.refeicao} · ${r.calorias} kcal${r.alimentos ? ` · ${r.alimentos}` : ''}` : `${fmt(r.valor)} kcal`, texto: `calorias consumo ${formatData(r.data)} ${r.valor ?? r.calorias} kcal ${r.refeicao || ''} ${r.alimentos || ''} meta 1800 kcal` })),
      ...baseScore.map(r => ({ tipo: 'health-score', rotulo: 'Health Score', data: r.data, valor: r.valor, detalhe: `${r.valor} pontos`, texto: `health score pontuação ${formatData(r.data)} ${r.valor} pontos meta 85` })),
    ]
    const unicos = [...new Map(entradas.map(r => [`${r.tipo}-${r.data}-${r.detalhe}`, r])).values()]
    return unicos.filter(r => r.texto.toLocaleLowerCase('pt-BR').includes(q)).sort((a,b) => b.data.localeCompare(a.data)).slice(0, 8)
  }, [searchTerm, registros, registrosCalorias])

  const mediaCalorias = dados.length ? Math.round(dados.reduce((s, d) => s + d.valor, 0) / dados.length) : 0
  const pesosVisiveis = [...registros].sort((a, b) => b.data.localeCompare(a.data))
  const atual = tipo === 'peso'
    ? (dados.length ? dados[dados.length - 1].valor : 0)
    : tipo === 'calorias' ? (dados.length ? dados[dados.length - 1].valor : 0) : 74
  const unidade = tipo === 'peso' ? ' kg' : tipo === 'calorias' ? '' : ' pts'
  const resumo = tipo === 'peso' ? [
    { label: 'Peso atual', value: `${fmt(atual)} kg`, sub: 'última medição', icon: '↘' },
    { label: 'Variação', value: dados.length > 1 ? `${atual - dados[0].valor > 0 ? '+' : ''}${fmt(atual - dados[0].valor)} kg` : '— kg', sub: `nos últimos ${periodo} dias`, icon: '⌁' },
    { label: 'Meta de peso', value: `${fmt(metaPeso)} kg`, sub: atual <= metaPeso ? 'meta atingida' : `faltam ${fmt(atual - metaPeso)} kg`, icon: '⚑' },
  ] : tipo === 'calorias' ? [
    { label: 'Média diária', value: `${fmt(mediaCalorias)} kcal`, sub: 'consumo médio diário', icon: '◉' },
    { label: 'Variação', value: dados.length > 1 ? `${fmt(dados[dados.length - 1].valor - dados[0].valor)} kcal` : '— kcal', sub: `nos últimos ${periodo} dias`, icon: '⌁' },
    { label: 'Meta diária', value: `${fmt(metaCalorias)} kcal`, sub: mediaCalorias ? (mediaCalorias > metaCalorias ? `${fmt(mediaCalorias - metaCalorias)} kcal acima da meta média` : `${fmt(metaCalorias - mediaCalorias)} kcal abaixo da meta média`) : 'meta personalizada', icon: '⚑' },
  ] : [
    { label: 'Health Score atual', value: '74 pts', sub: 'pontuação atual', icon: '✦' },
    { label: 'Variação', value: '+8 pts', sub: `nos últimos ${periodo} dias`, icon: '⌁' },
    { label: 'Objetivo', value: '85 pts', sub: 'continue evoluindo', icon: '⚑' },
  ]

  function iniciarEdicaoPeso(registro) {
    setEditandoPeso(registro.data)
    setData(registro.data)
    setValor(String(registro.valor).replace('.', ','))
    setErro('')
    setModal(true)
  }

  function excluirPeso(dia) {
    const registro = registros.find(r => r.data === dia)
    if (registro) setExclusaoPendente(registro)
  }

  function confirmarExclusaoPeso() {
    if (!exclusaoPendente) return
    const novo = registros.filter(r => r.data !== exclusaoPendente.data)
    setRegistros(novo)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(novo)) } catch {}
    setExclusaoPendente(null)
  }

  function abrirMeta() { setMetaRascunho(String(metaCalorias)); setMetaAberta(true) }
  function abrirMetaPeso() { setMetaPesoRascunho(String(metaPeso)); setMetaPesoAberta(true) }
  function salvarMetaPeso(e) {
    e.preventDefault()
    const n = Number(String(metaPesoRascunho).replace(',', '.'))
    if (!Number.isFinite(n) || n < 1 || n > 500) return
    setMetaPeso(n)
    try { localStorage.setItem(META_PESO_KEY, String(n)) } catch {}
    setMetaPesoAberta(false)
  }
  function salvarMeta(e) {
    e.preventDefault()
    const n = Number(String(metaRascunho).replace(',', '.'))
    if (!Number.isFinite(n) || n < 1 || n > 10000) return
    setMetaCalorias(n)
    try { localStorage.setItem(META_CALORIAS_KEY, String(n)) } catch {}
    setMetaAberta(false)
  }

  function salvar(e) {
    e.preventDefault()
    const n = Number(String(valor).replace(',', '.'))
    if (!valor || !Number.isFinite(n) || n < 20 || n > 400) {
      setErro('Informe um peso válido entre 20 e 400 kg.')
      return
    }
    if (!data) { setErro('Selecione a data da medição.'); return }
    const dataExistente = registros.some(r => r.data === data)
    if (dataExistente && editandoPeso !== data && !window.confirm('Já existe uma medição nesta data. Deseja substituí-la?')) return
    const novo = [...registros.filter(r => r.data !== data && r.data !== editandoPeso), { data, valor: n }].sort((a, b) => a.data.localeCompare(b.data))
    setRegistros(novo)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(novo)) } catch {}
    setValor('')
    setErro('')
    setEditandoPeso(null)
    setModal(false)
  }

  function salvarCalorias(e) {
    e.preventDefault()
    const n = Number(String(valor).replace(',', '.'))
    if (!valor || !Number.isFinite(n) || n <= 0 || n > 10000) { setErro('Informe uma quantidade de calorias entre 1 e 10.000 kcal.'); return }
    if (!data) { setErro('Selecione a data do consumo.'); return }
    const novoRegistro = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, data, refeicao, alimentos: alimentos.trim(), calorias: n }
    const novos = [...registrosCalorias, novoRegistro].sort((a,b) => a.data.localeCompare(b.data))
    setRegistrosCalorias(novos)
    try { localStorage.setItem(CALORIAS_STORAGE_KEY, JSON.stringify(novos)) } catch {}
    setValor(''); setAlimentos(''); setErro(''); setData(hojeISO()); setModal(false)
  }

  return <section className="evolution-page">
    <div className="ev-heading">
      <div>
        <h1>Evolução</h1>
        <p>Acompanhe seu progresso e veja sua evolução ao longo do tempo.</p>
      </div>
    </div>
    <div className="ev-toolbar">
      <div className="ev-tabs" role="tablist" aria-label="Tipo de evolução">
        {[['peso', 'Peso'], ['calorias', 'Calorias'], ['health-score', 'Health Score']].map(([id, label]) =>
          <button key={id} className={tipo === id ? 'active' : ''} role="tab" aria-selected={tipo === id} onClick={() => setTipo(id)}>{label}</button>
        )}
      </div>
      <label className="ev-period"><span className="ev-period__icon" aria-hidden="true">▦</span><span className="ev-period__label">Período</span><select value={periodo} onChange={e => setPeriodo(e.target.value)} aria-label="Período"><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option></select><span className="ev-period__chevron" aria-hidden="true">⌄</span></label>
    </div>
    {searchTerm.trim() && <section className="ev-search-results" aria-live="polite">
      <div className="ev-search-results__heading"><strong>Resultados da busca</strong><span>{resultadosBusca.length} {resultadosBusca.length === 1 ? 'resultado' : 'resultados'}</span></div>
      {resultadosBusca.length ? <div className="ev-search-results__list">{resultadosBusca.map((item, index) => <button type="button" className="ev-search-result" key={`${item.tipo}-${item.data}-${index}`} onClick={() => setTipo(item.tipo)}><span className="ev-search-result__icon">{item.tipo === 'peso' ? '↗' : item.tipo === 'calorias' ? '◉' : '✦'}</span><span className="ev-search-result__main"><strong>{item.rotulo}</strong><small>{diaMes(item.data)} · {item.detalhe}</small></span><span className="ev-search-result__arrow">Ver →</span></button>)}</div> : <p className="ev-search-results__empty">Nenhum registro encontrado para “{searchTerm.trim()}”. Tente buscar por peso, calorias, Health Score, uma data ou um valor.</p>}
    </section>}
    {tipo === 'calorias' && <div className="ev-goal-action"><span>Personalize sua meta diária de calorias para acompanhar seu objetivo.</span><button type="button" onClick={abrirMeta}>⚙ Alterar meta diária</button></div>}
    {tipo === 'peso' && <div className="ev-goal-action"><span>Defina seu peso-alvo. A meta será atualizada no cartão e na linha do gráfico.</span><button type="button" onClick={abrirMetaPeso}>⚙ Alterar meta de peso</button></div>}
    <section className="ev-chart-card">
      <div className="ev-card-heading">
        <div><h2>{tipo === 'peso' ? 'Seu peso (kg)' : tipo === 'calorias' ? 'Consumo de calorias (kcal)' : 'Health Score'}</h2><p>{tipo === 'peso' ? 'Acompanhe as mudanças no seu peso' : tipo === 'calorias' ? 'Veja como está seu consumo diário' : 'Acompanhe sua pontuação de saúde'}</p></div>
        {(tipo === 'peso' || tipo === 'calorias') && <button className="ev-register" onClick={() => { setValor(''); setErro(''); setData(hojeISO()); setEditandoPeso(null); setModal(true) }}>{tipo === 'peso' ? '＋ Registrar peso' : '＋ Registrar consumo'}</button>}
      </div>
      <Grafico dados={dados} unidade={unidade} tipo={tipo} periodo={periodo} metaCalorias={metaCalorias} metaPeso={metaPeso} />
    </section>
    <div className="ev-stats">{resumo.map(item => <article className="ev-stat" key={item.label}>
      <div><span>{item.label}</span><strong>{item.value}</strong><small>{item.sub}</small></div><b aria-hidden="true">{item.icon}</b>
    </article>)}</div>
    {tipo === 'peso' && <section className="ev-history-card">
      <div className="ev-history-heading"><div><h2>Histórico de peso</h2><p>Edite ou remova uma medição. O gráfico e os indicadores são atualizados automaticamente.</p></div><span>{pesosVisiveis.length} {pesosVisiveis.length === 1 ? 'registro' : 'registros'}</span></div>
      {pesosVisiveis.length ? <div className="ev-history-list">{pesosVisiveis.map(r => <div className="ev-history-row" key={r.data}><div className="ev-history-date"><span>{diaMes(r.data)}</span><small>{r.data.slice(0,4)}</small></div><div className="ev-history-value"><strong>{fmt(r.valor)} kg</strong><small>{r.valor <= metaPeso ? 'Meta numérica atingida' : `${fmt(r.valor - metaPeso)} kg acima da sua meta de ${fmt(metaPeso)} kg`}</small></div><div className="ev-history-actions"><button type="button" onClick={() => iniciarEdicaoPeso(r)} aria-label={`Editar peso de ${diaMes(r.data)}`}>Editar</button><button type="button" className="ev-delete" onClick={() => excluirPeso(r.data)} aria-label={`Excluir peso de ${diaMes(r.data)}`}>Excluir</button></div></div>)}</div> : <div className="ev-history-empty"><span>◷</span><strong>Nenhuma medição registrada</strong><p>Use “Registrar peso” para adicionar sua primeira medição.</p></div>}
    </section>}
    <p className="ev-note">Olá, {profileName}. Os dados demonstrativos podem ser substituídos pelos seus registros.</p>
    {metaPesoAberta && <div className="ev-modal-backdrop ev-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setMetaPesoAberta(false) }}><form className="ev-dialog ev-goal-dialog" onSubmit={salvarMetaPeso}><div className="ev-dialog-icon">⚖</div><button type="button" className="ev-dialog-close" aria-label="Fechar" onClick={() => setMetaPesoAberta(false)}>×</button><h2>Meta de peso</h2><p>Defina o peso-alvo que deseja acompanhar nos cartões e no gráfico.</p><label>Meta personalizada (kg)<input autoFocus type="number" min="1" max="500" step="0.1" value={metaPesoRascunho} onChange={e => setMetaPesoRascunho(e.target.value)} required /></label><div className="ev-dialog-hint">A meta fica salva neste navegador e pode ser alterada quando quiser.</div><div className="ev-dialog-actions"><button type="button" className="ev-dialog-cancel" onClick={() => setMetaPesoAberta(false)}>Cancelar</button><button type="submit" className="ev-dialog-primary">Salvar meta</button></div></form></div>}
    {metaAberta && <div className="ev-modal-backdrop ev-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setMetaAberta(false) }}><form className="ev-dialog ev-goal-dialog" onSubmit={salvarMeta}><div className="ev-dialog-icon">⚙</div><button type="button" className="ev-dialog-close" aria-label="Fechar" onClick={() => setMetaAberta(false)}>×</button><h2>Meta diária de calorias</h2><p>Escolha quantas calorias deseja usar como referência nos cartões e no gráfico.</p><label>Meta personalizada (kcal)<input autoFocus type="number" min="1" max="10000" step="1" value={metaRascunho} onChange={e => setMetaRascunho(e.target.value)} required /></label><div className="ev-dialog-hint">Sua meta fica salva neste navegador e pode ser alterada quando quiser.</div><div className="ev-dialog-actions"><button type="button" className="ev-dialog-cancel" onClick={() => setMetaAberta(false)}>Cancelar</button><button type="submit" className="ev-dialog-primary">Salvar meta</button></div></form></div>}
    {exclusaoPendente && <div className="ev-modal-backdrop ev-dialog-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setExclusaoPendente(null) }}><div className="ev-dialog ev-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ev-delete-title"><div className="ev-dialog-icon ev-dialog-icon--danger">⌫</div><button type="button" className="ev-dialog-close" aria-label="Fechar" onClick={() => setExclusaoPendente(null)}>×</button><h2 id="ev-delete-title">Excluir medição de peso?</h2><p>Você está prestes a remover este registro do seu histórico.</p><div className="ev-delete-preview"><span>Data da medição</span><strong>{diaMes(exclusaoPendente.data)}/{exclusaoPendente.data.slice(0,4)}</strong><span>Peso registrado</span><strong>{fmt(exclusaoPendente.valor)} kg</strong></div><div className="ev-dialog-hint">Essa ação não pode ser desfeita. O histórico e os indicadores serão atualizados.</div><div className="ev-dialog-actions"><button type="button" className="ev-dialog-cancel" onClick={() => setExclusaoPendente(null)}>Manter registro</button><button type="button" className="ev-dialog-danger" onClick={confirmarExclusaoPeso}>Sim, excluir</button></div></div></div>}
    {modal && <div className="ev-modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}>
      {tipo === 'peso' ? <form className="ev-modal" onSubmit={salvar}>
        <button type="button" className="ev-close" aria-label="Fechar" onClick={() => setModal(false)}>×</button>
        <h2>{editandoPeso ? 'Editar medição' : 'Registrar peso'}</h2><p>{editandoPeso ? 'Altere a data ou o valor. O gráfico será atualizado ao salvar.' : 'Registre seu peso para acompanhar sua evolução.'}</p>
        <label>Data da medição<input type="date" value={data} onChange={e => setData(e.target.value)} required /></label>
        <label>Peso (kg)<input type="number" min="20" max="400" step=".1" placeholder="Ex.: 57,0" value={valor} onChange={e => setValor(e.target.value)} required /></label>
        {erro && <small className="ev-error">{erro}</small>}
        <div className="ev-modal-actions"><button type="button" onClick={() => { setModal(false); setEditandoPeso(null) }}>Cancelar</button><button type="submit">{editandoPeso ? 'Salvar alterações' : 'Salvar peso'}</button></div>
      </form> : <form className="ev-modal" onSubmit={salvarCalorias}>
        <button type="button" className="ev-close" aria-label="Fechar" onClick={() => setModal(false)}>×</button>
        <h2>Registrar consumo</h2><p>Adicione uma refeição para atualizar seu consumo diário.</p>
        <label>Data do consumo<input type="date" value={data} onChange={e => setData(e.target.value)} max={hojeISO()} required /></label>
        <label>Tipo de refeição<select value={refeicao} onChange={e => setRefeicao(e.target.value)}><option>Café da manhã</option><option>Almoço</option><option>Jantar</option><option>Lanche</option></select></label>
        <label>Alimentos (opcional)<input type="text" value={alimentos} onChange={e => setAlimentos(e.target.value)} placeholder="Ex.: arroz, feijão e frango" maxLength={180} /></label>
        <label>Calorias (kcal)<input type="number" min="1" max="10000" step="1" placeholder="Ex.: 650" value={valor} onChange={e => setValor(e.target.value)} required /></label>
        {erro && <small className="ev-error">{erro}</small>}
        <div className="ev-modal-actions"><button type="button" onClick={() => setModal(false)}>Cancelar</button><button type="submit">Salvar consumo</button></div>
      </form>}
    </div>}
  </section>
}
