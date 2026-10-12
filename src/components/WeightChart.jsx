import { useEffect, useId, useRef, useState } from 'react'

const H = 280
const PAD = { top: 14, right: 18, bottom: 28, left: 38 }

const fmt = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })

/**
 * Garante que todos os valores caibam no gráfico.
 * Se tudo já está dentro da escala informada, ela é mantida; senão o eixo é ampliado
 * e, se ficar com marcações demais, o passo é trocado por um "redondo" (1, 2, 2,5, 5, 10...).
 */
function escalaY({ min, max, passo }, valores) {
  const menor = Math.min(...valores)
  const maior = Math.max(...valores)
  if (menor >= min && maior <= max) return { min, max, passo }

  const novoMin = Math.min(min, menor)
  const novoMax = Math.max(max, maior)
  let p = passo
  if ((novoMax - novoMin) / passo > 6) {
    const alvo = (novoMax - novoMin) / 5
    const base = 10 ** Math.floor(Math.log10(alvo))
    p = [1, 2, 2.5, 5, 10].map((m) => m * base).find((c) => c >= alvo) ?? 10 * base
  }
  return { min: Math.floor(novoMin / p) * p, max: Math.ceil(novoMax / p) * p, passo: p }
}

/**
 * Gráfico de área em SVG puro.
 * props: serie [{data, valor}], eixoY {min, max, passo}, unidade
 */
export default function WeightChart({ serie, eixoY, unidade, meta }) {
  const gradId = useId().replace(/:/g, '')
  const [ativo, setAtivo] = useState(null)
  const wrapRef = useRef(null)
  const [W, setW] = useState(640)

  // Mede a largura disponível para o gráfico ocupar todo o card
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const medir = () => setW(Math.max(300, Math.round(el.clientWidth)))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // amplia o eixo Y automaticamente se algum valor (ou a meta) ficar fora da escala
  const { min, max, passo } = escalaY(eixoY, [
    ...serie.map((p) => p.valor),
    ...(meta ? [meta.valor] : []),
  ])
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom

  const x = (i) => PAD.left + (serie.length === 1 ? innerW / 2 : (i * innerW) / (serie.length - 1))
  const y = (v) => PAD.top + innerH - ((v - min) / (max - min)) * innerH

  // linha da meta só aparece se estiver dentro da escala do eixo Y
  const yMeta = meta && meta.valor >= min && meta.valor <= max ? y(meta.valor) : null

  const qtd = Math.round((max - min) / passo)
  const ticks = Array.from({ length: qtd + 1 }, (_, i) => min + i * passo)

  const pontos = serie.map((p, i) => [x(i), y(p.valor)])
  const linha = pontos.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px},${py}`).join(' ')
  const baseY = PAD.top + innerH
  const area = `${linha} L${pontos[pontos.length - 1][0]},${baseY} L${pontos[0][0]},${baseY} Z`

  return (
    <div className="chart-wrap" ref={wrapRef} style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfico de evolução">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a6b5a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1a6b5a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e8eceb" strokeWidth="1" />
            <text x={PAD.left - 10} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#8a9792">
              {fmt(t)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradId})`} />

        {yMeta !== null && (
          <g>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yMeta}
              y2={yMeta}
              stroke="#d98a1f"
              strokeWidth="1.5"
              strokeDasharray="6 5"
            />
            <text x={W - PAD.right} y={yMeta - 6} textAnchor="end" fontSize="11" fontWeight="600" fill="#b8741a">
              Meta: {fmt(meta.valor)} {unidade}
            </text>
          </g>
        )}
        <path d={linha} fill="none" stroke="#0f4a3f" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {serie.map((p, i) => (
          <text key={p.data} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8a9792">
            {p.data}
          </text>
        ))}

        {pontos.map(([px, py], i) => (
          <g key={serie[i].data}>
            <circle cx={px} cy={py} r={ativo === i ? 6 : 4} fill="#0f4a3f" stroke="#fff" strokeWidth="2" />
            {/* área de contato maior para o hover/toque */}
            <circle
              cx={px}
              cy={py}
              r="16"
              fill="transparent"
              onMouseEnter={() => setAtivo(i)}
              onMouseLeave={() => setAtivo(null)}
              onTouchStart={() => setAtivo(i)}
            />
          </g>
        ))}
      </svg>

      {ativo !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(pontos[ativo][0] / W) * 100}%`,
            top: `${(pontos[ativo][1] / H) * 100}%`,
          }}
        >
          {serie[ativo].data} · {fmt(serie[ativo].valor)} {unidade}
        </div>
      )}
    </div>
  )
}
