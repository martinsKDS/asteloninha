import { useCallback, useEffect, useState } from 'react'
import { useEvolucaoStore } from '../store/useEvolucaoStore.js'
import WeightChart from '../components/WeightChart.jsx'
import StatCard from '../components/StatCard.jsx'
import RegistrarPesoModal from '../components/RegistrarPesoModal.jsx'
import { IconCalendar, IconChevronDown } from '../components/Icons.jsx'

const ABAS = [
  { id: 'peso', label: 'Peso' },
  { id: 'calorias', label: 'Calorias' },
  { id: 'health-score', label: 'Health Score' },
]

const PERIODOS = [
  { valor: 7, label: 'Últimos 7 dias' },
  { valor: 30, label: 'Últimos 30 dias' },
  { valor: 90, label: 'Últimos 90 dias' },
]

export default function Evolucao() {
  const { tipo, periodo, dados, carregando, erro, setTipo, setPeriodo, carregar, registrarPeso } =
    useEvolucaoStore()

  const [modalAberto, setModalAberto] = useState(false)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    carregar()
  }, [carregar])

  // some o aviso de sucesso depois de 3 segundos
  useEffect(() => {
    if (!aviso) return undefined
    const t = setTimeout(() => setAviso(''), 3000)
    return () => clearTimeout(t)
  }, [aviso])

  const fecharModal = useCallback(() => setModalAberto(false), [])

  async function salvarPeso(registro) {
    await registrarPeso(registro) // se falhar, o erro é mostrado dentro do modal
    setModalAberto(false)
    setAviso('Peso registrado com sucesso!')
  }

  return (
    <>
      <div className="page-header">
        <h1>Evolução</h1>
        <p>Acompanhe seu progresso e veja sua evolução ao longo do tempo.</p>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              aria-selected={tipo === aba.id}
              className={`tab ${tipo === aba.id ? 'active' : ''}`}
              onClick={() => setTipo(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div className="toolbar-actions">
          {tipo === 'peso' && (
            <button type="button" className="btn-primary" onClick={() => setModalAberto(true)}>
              + Registrar peso
            </button>
          )}

          <label className="periodo">
            <IconCalendar />
            <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} aria-label="Período">
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.label}
                </option>
              ))}
            </select>
            <IconChevronDown />
          </label>
        </div>
      </div>

      {erro && <div className="card estado erro">{erro}</div>}

      {!erro && (
        <>
          <section className="card">
            <h2 className="card-title">{dados?.titulo ?? ' '}</h2>
            {carregando && !dados && <div className="estado">Carregando...</div>}
            {dados && (
              <div style={{ opacity: carregando ? 0.5 : 1, transition: 'opacity .2s' }}>
                <WeightChart
                  serie={dados.serie}
                  eixoY={dados.eixoY}
                  unidade={dados.unidade}
                  meta={dados.meta}
                />
              </div>
            )}
          </section>

          {dados && (
            <section className="stats" style={{ opacity: carregando ? 0.5 : 1, transition: 'opacity .2s' }}>
              {dados.resumo.map((item) => (
                <StatCard key={item.rotulo} {...item} />
              ))}
            </section>
          )}
        </>
      )}

      {modalAberto && <RegistrarPesoModal onFechar={fecharModal} onSalvar={salvarPeso} />}
      {aviso && (
        <div className="toast" role="status">
          {aviso}
        </div>
      )}
    </>
  )
}
