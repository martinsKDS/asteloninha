import { NavLink } from 'react-router-dom'
import logo from '../assets/logo-smartcarbo.png'
import {
  IconHome,
  IconMeals,
  IconProgress,
  IconRanking,
  IconUsers,
  IconUser,
  IconLogout,
} from './Icons.jsx'

const itens = [
  { to: '/inicio', label: 'Início', Icon: IconHome },
  { to: '/refeicoes', label: 'Refeições', Icon: IconMeals },
  { to: '/evolucao', label: 'Evolução', Icon: IconProgress },
  { to: '/ranking', label: 'Ranking', Icon: IconRanking },
  { to: '/comunidade', label: 'Comunidade', Icon: IconUsers },
  { to: '/perfil', label: 'Perfil', Icon: IconUser },
]

export default function Sidebar() {
  function sair() {
    // Ao integrar com o Spring Security (JWT): limpar o token e redirecionar ao login.
    localStorage.removeItem('token')
    window.location.assign('/')
  }

  return (
    <aside className="sidebar">
      <div className="logo">
        <img src={logo} alt="SmartCarbo - Disciplina nutre resultados" />
      </div>

      <nav className="nav">
        {itens.map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>

      <button type="button" className="nav-logout" onClick={sair}>
        <IconLogout />
        Sair
      </button>
    </aside>
  )
}
