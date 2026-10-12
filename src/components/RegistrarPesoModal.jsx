import { useEffect, useRef, useState } from 'react'

// Data de hoje no fuso local (toISOString usaria UTC e erraria o dia à noite no Brasil).
function hoje() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function RegistrarPesoModal({ onFechar, onSalvar }) {
  const [data, setData] = useState(hoje())
  const [peso, setPeso] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const pesoRef = useRef(null)

  useEffect(() => {
    pesoRef.current?.focus()
  }, [])

  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [onFechar])

  async function enviar(e) {
    e.preventDefault()
    const valor = Number(peso.replace(',', '.'))

    if (!data) return setErro('Informe a data.')
    if (data > hoje()) return setErro('A data não pode ser no futuro.')
    if (!Number.isFinite(valor) || valor < 20 || valor > 400) {
      return setErro('Informe um peso válido, entre 20 e 400 kg.')
    }

    setErro('')
    setSalvando(true)
    try {
      await onSalvar({ data, valor: Math.round(valor * 10) / 10 })
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar. Tente novamente.')
      setSalvando(false)
    }
  }

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onFechar()
      }}
    >
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-modal" onSubmit={enviar}>
        <h2 id="titulo-modal">Registrar peso</h2>
        <p className="desc">Informe seu peso para atualizar o gráfico de evolução.</p>

        <div className="field">
          <label htmlFor="peso-data">Data</label>
          <input id="peso-data" type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="peso-valor">Peso (kg)</label>
          <input
            id="peso-valor"
            ref={pesoRef}
            type="text"
            inputMode="decimal"
            placeholder="Ex.: 57,5"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            autoComplete="off"
          />
        </div>

        {erro && (
          <p className="form-erro" role="alert">
            {erro}
          </p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onFechar} disabled={salvando}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
