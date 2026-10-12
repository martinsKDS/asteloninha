import { IconSearch, IconBell } from './Icons.jsx'

// Quando houver autenticação, estes dados virão do usuário logado (store/contexto).
const usuario = { nome: 'Mariana', iniciais: 'LA', plano: 'Plano Gratuito' }

export default function Header() {
  return (
    <header className="header">
      <label className="search">
        <IconSearch />
        <input type="search" placeholder="Buscar..." aria-label="Buscar" />
      </label>

      <button type="button" className="icon-btn" aria-label="Notificações">
        <IconBell />
      </button>

      <div className="user">
        <div className="avatar">{usuario.iniciais}</div>
        <div className="user-info">
          <strong>Olá, {usuario.nome}</strong>
          <small>{usuario.plano}</small>
        </div>
      </div>
    </header>
  )
}
