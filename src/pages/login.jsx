import "./login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import pantera from "../assets/smartcarbo-pantera.png";
import logoNome from "../assets/smartcarbo-nome.png";
import slogan from "../assets/smartcarbo-slogan.png";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // VALIDAÇÃO DO E-MAIL
    if (email.trim() === "") {
      newErrors.email = "Campo obrigatório*";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      newErrors.email = "Digite um e-mail válido.";
    }

    // VALIDAÇÃO DA SENHA
    if (password.trim() === "") {
      newErrors.password = "Campo obrigatório*";
    } else if (password.length < 6) {
      newErrors.password =
        "A senha deve ter pelo menos 6 caracteres.";
    }

    setErrors(newErrors);

    // Se houver erro, não tenta fazer login
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Frontend temporário: não chama API nem backend.
    // Permite entrar com qualquer e-mail/senha que passem pela validação visual.
    const usuario = JSON.parse(localStorage.getItem("smartcarbo-user") || "null");
    localStorage.setItem("smartcarbo-session", JSON.stringify({ email: email.trim(), nome: usuario?.nome || email.split("@")[0] }));
    navigate("/app", { replace: true });
  };

  return (
    <div className="login-page">

      {/* LADO ESQUERDO */}
      <section className="login-left">

        <div className="brand">

          <img
            src={pantera}
            alt="Pantera SmartCarbo"
            className="login-panther"
          />

          <img
            src={logoNome}
            alt="SmartCarbo"
            className="login-brand-logo"
          />

          <img
            src={slogan}
            alt="Disciplina nutre resultados"
            className="login-brand-slogan"
          />

        </div>

      </section>

      {/* LADO DIREITO */}
      <section className="login-right">

        <div className="login-container">

          <div className="login-title">
            <h2>
              Bem-vindo de volta!
            </h2>

            <p>
              Faça login para continuar sua jornada.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleLogin}
            noValidate
          >

            {/* E-MAIL */}
            <div className="form-group">

              <label htmlFor="email">
                E-mail
              </label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (errors.email) {
                    setErrors({
                      ...errors,
                      email: "",
                    });
                  }
                }}
                className={
                  errors.email ? "input-error" : ""
                }
              />

              {errors.email && (
                <span className="error-message">
                  {errors.email}
                </span>
              )}

            </div>

            {/* SENHA */}
            <div className="form-group">

              <label htmlFor="password">
                Senha
              </label>

              <div className="password-input">

                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (errors.password) {
                      setErrors({
                        ...errors,
                        password: "",
                      });
                    }
                  }}
                  className={
                    errors.password
                      ? "input-error"
                      : ""
                  }
                />

              </div>

              {errors.password && (
                <span className="error-message">
                  {errors.password}
                </span>
              )}

            </div>

            {/* OPÇÕES */}
            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  id="remember"
                />

                <span>
                  Lembrar de mim
                </span>

              </label>

              <a
                href="#"
                onClick={(e) =>
                  e.preventDefault()
                }
              >
                Esqueci minha senha
              </a>

            </div>

            {/* BOTÃO */}
            <button
              type="submit"
              className="login-button"
            >
              Entrar
            </button>

          </form>

          {/* DIVISOR */}
          <div className="divider">

            <span></span>

            <p>
              ou continue com
            </p>

            <span></span>

          </div>

          {/* LOGIN SOCIAL */}
          <div className="social-login" aria-label="Outras opções de login">
            <button type="button" className="social-button" onClick={() => window.alert('Login com Google estará disponível quando a autenticação for configurada.')}>
              <span className="social-icon social-icon--google" aria-hidden="true">G</span>
              <span>Google</span>
            </button>
            <button type="button" className="social-button" onClick={() => window.alert('Login com Apple estará disponível quando a autenticação for configurada.')}>
              <span className="social-icon social-icon--apple" aria-hidden="true">●</span>
              <span>Apple</span>
            </button>
            <button type="button" className="social-button" onClick={() => window.alert('Login com Microsoft estará disponível quando a autenticação for configurada.')}>
              <span className="social-icon social-icon--microsoft" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span>Microsoft</span>
            </button>
          </div>

          {/* CADASTRO */}
          <div className="register">

            <span>
              Ainda não tem uma conta?
            </span>

            <a href="/cadastro">
              Criar conta
            </a>

          </div>

        </div>

      </section>

    </div>
  );
}

export default Login;