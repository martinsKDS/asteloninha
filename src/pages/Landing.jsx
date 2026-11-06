
import { Link } from "react-router-dom";

import pantera from "../assets/smartcarbo-pantera.png";
import logo from "../assets/smartcarbo-nome.png";

import "./Landing.css";

const recursos = [
  {
    icon: "🍽",
    titulo: "Alimentação",
    descricao: "Registre refeições e acompanhe seus hábitos alimentares."
  },
  {
    icon: "↗",
    titulo: "Evolução",
    descricao: "Visualize seus registros de peso e atividade física."
  },
  {
    icon: "◎",
    titulo: "Metas pessoais",
    descricao: "Acompanhe objetivos definidos conforme seu perfil."
  }
];

export default function Landing() {
  return (
    <div className="landing">

      {/* CABEÇALHO */}
      <header className="landing-header">

        <Link to="/" className="landing-brand">
          <img
            src={pantera}
            alt=""
            className="header-panther"
          />

          <img
            src={logo}
            alt="SmartCarbo"
            className="header-logo"
          />
        </Link>

        <nav className="landing-nav">
          <a href="#inicio">Início</a>
          <a href="#sobre">Sobre</a>
          <a href="#recursos">Recursos</a>
        </nav>

        <div className="landing-actions">

          <Link
            to="/login"
            className="landing-login-link"
          >
            Entrar
          </Link>

          <Link
            to="/register"
            className="landing-register-link"
          >
            Criar conta
          </Link>

        </div>
      </header>

      <main>

        {/* APRESENTAÇÃO */}
        <section className="landing-hero" id="inicio">

          <div className="hero-content">

            <div className="hero-label">
              <span />
              ALIMENTAÇÃO • CONHECIMENTO • EVOLUÇÃO
            </div>

            <h1>
              Sua alimentação,
              <br />
              <strong>seu equilíbrio.</strong>
            </h1>

            <p className="hero-description">
              O SmartCarbo ajuda você a acompanhar sua alimentação,
              compreender seus hábitos e construir uma rotina
              mais saudável e consciente.
            </p>

            <div className="hero-buttons">

              <Link
                to="/register"
                className="landing-register-link hero-button"
              >
                Começar agora <span>→</span>
              </Link>

              <a href="#sobre" className="about-link">
                Conheça o projeto
              </a>

            </div>

            {/* DESTAQUES */}
            <div className="hero-highlights">

              {recursos.map((item) => (
                <div
                  className="highlight-item"
                  key={item.titulo}
                >

                  <div className="highlight-icon">
                    {item.icon}
                  </div>

                  <div>
                    <strong>{item.titulo}</strong>
                    <span>{item.descricao}</span>
                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* PANTERA */}
          <div className="hero-visual">

            <div className="visual-shape visual-shape-one" />
            <div className="visual-shape visual-shape-two" />
            <div className="visual-ring" />

            <div className="visual-caption">
              <span>SMARTCARBO</span>
              <small>DISCIPLINA NUTRE RESULTADOS</small>
            </div>

            <img
              src={pantera}
              alt="Pantera símbolo do SmartCarbo"
              className="hero-panther"
            />

            <div className="visual-decoration">
              <span />
              <span />
              <span />
            </div>

          </div>

        </section>

        {/* SOBRE */}
        <section className="landing-about" id="sobre">

          <div className="about-label">
            <span>01</span>
            SOBRE O PROJETO
          </div>

          <div className="about-content">

            <h2>
              Tecnologia a favor
              <br />
              de hábitos melhores.
            </h2>

            <p>
              O SmartCarbo é uma plataforma desenvolvida para facilitar
              o acompanhamento alimentar e incentivar escolhas mais
              conscientes. Reunimos ferramentas que ajudam o usuário
              a acompanhar sua evolução e compreender melhor sua rotina.
            </p>

          </div>

          <div className="about-bottom">

            <div>
              <strong>Mais organização</strong>
              <span>Informações reunidas em um só lugar.</span>
            </div>

            <div>
              <strong>Mais conhecimento</strong>
              <span>Entenda melhor seus hábitos alimentares.</span>
            </div>

            <div>
              <strong>Mais consciência</strong>
              <span>Construa uma rotina equilibrada.</span>
            </div>

          </div>

        </section>

        {/* RECURSOS */}
        <section className="landing-features" id="recursos">

          <div className="features-heading">

            <div>
              <div className="about-label">
                <span>02</span>
                FUNCIONALIDADES
              </div>

              <h2>
                Tudo para acompanhar
                <br />
                sua evolução.
              </h2>
            </div>

            <p>
              Conheça alguns dos recursos que fazem parte
              da experiência SmartCarbo.
            </p>

          </div>

          <div className="features-grid">

            {recursos.map((item, index) => (
              <article
                className="feature-card"
                key={item.titulo}
              >

                <div className="feature-card-top">

                  <span className="feature-number">
                    0{index + 1}
                  </span>

                  <span className="feature-icon">
                    {item.icon}
                  </span>

                </div>

                <h3>{item.titulo}</h3>

                <p>{item.descricao}</p>

                <div className="feature-line" />

              </article>
            ))}

          </div>

        </section>

        {/* CHAMADA FINAL */}
        <section className="landing-cta">

          <div>
            <span>COMECE SUA JORNADA</span>

            <h2>Disciplina nutre resultados.</h2>

            <p>
              Conheça o SmartCarbo e acompanhe sua evolução.
            </p>
          </div>

          <Link
            to="/register"
            className="landing-register-link"
          >
            Criar minha conta →
          </Link>

        </section>

      </main>

      {/* RODAPÉ */}
      <footer className="landing-footer">

        <div className="footer-brand">

          <img src={logo} alt="SmartCarbo" />

          <span>Disciplina nutre resultados.</span>

        </div>

        <span>
          © {new Date().getFullYear()} SmartCarbo.
          Todos os direitos reservados.
        </span>

      </footer>

    </div>
  );
}
