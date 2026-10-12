import { IconArrowDown, IconArrowUp, IconTrendDown, IconTrendUp, IconFlag } from './Icons.jsx'

const ICONES = {
  down: IconArrowDown,
  up: IconArrowUp,
  'trend-down': IconTrendDown,
  'trend-up': IconTrendUp,
  flag: IconFlag,
}

export default function StatCard({ rotulo, valor, legenda, icone, progresso }) {
  const Icon = ICONES[icone]
  return (
    <div className="card stat">
      <div>
        <small className="label">{rotulo}</small>
        <div className="value">{valor}</div>
        <small className="sub">{legenda}</small>

        {typeof progresso === 'number' && (
          <div className="progress">
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progresso}
              aria-label={`${rotulo}: ${progresso}% concluído`}
            >
              <div className="progress-bar" style={{ width: `${progresso}%` }} />
            </div>
            <small>{progresso}% do caminho concluído</small>
          </div>
        )}
      </div>
      {Icon && <Icon />}
    </div>
  )
}
