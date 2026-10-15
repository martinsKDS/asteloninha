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
    general: "",
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Campo obrigatório.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Digite um e-mail válido.";
    }

    if (!password) {
      newErrors.password = "Campo obrigatório.";
    } else if (password.length < 8) {
      newErrors.password = "A senha deve ter pelo menos 8 caracteres.";
    }

    setErrors({ ...newErrors, general: "" });

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8080"
      ).replace(/\/+$/, "");

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          senha: password,
        }),
      });

      if (response.status === 400) {
        setErrors((previous) => ({
          ...previous,
          general: "Preencha corretamente o e-mail e a senha.",
        }));
        return;
      }

      if (response.status === 401) {
        setErrors((previous) => ({
          ...previous,
          general: "E-mail ou senha incorretos.",
        }));
        return;
      }

      if (!response.ok) {
        throw new Error("Não foi possível realizar o login.");
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error("A API não retornou o token de autenticação.");
      }

      localStorage.setItem("smartcarbo-token", data.token);

      localStorage.setItem(
        "smartcarbo-session",
        JSON.stringify({
          id: data.id,
          nome: data.nome,
          email: data.email,
        })
      );

      navigate("/app", { replace: true });
    } catch (error) {
      console.error("Erro no login:", error);

      setErrors((previous) => ({
        ...previous,
        general:
          error instanceof TypeError
            ? "Não foi possível conectar ao servidor. Verifique se o backend está funcionando."
            : error.message || "Ocorreu um erro ao realizar o login.",
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
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

      <section className="login-right">
        <div className="login-container">
          <div className="login-title">
            <h2>Bem-vindo de volta!</h2>
            <p>Faça login para continuar sua jornada.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="form-group">
              <label htmlFor="email">E-mail</label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((previous) => ({
                    ...previous,
                    email: "",
                    general: "",
                  }));
                }}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
              />

              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>

              <div className="password-input">
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((previous) => ({
                      ...previous,
                      password: "",
                      general: "",
                    }));
                  }}
                  className={errors.password ? "input-error" : ""}
                  disabled={loading}
                />
              </div>

              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {errors.general && (
              <p className="error-message" role="alert">
                {errors.general}
              </p>
            )}

            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" id="remember" />
                <span>Lembrar de mim</span>
              </label>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
              >
                Esqueci minha senha
              </a>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <div className="divider">
            <span></span>
            <p>ou continue com</p>
            <span></span>
          </div>

          <div
            className="social-login"
            aria-label="Outras opções de login"
          >
            <button
              type="button"
              className="social-button"
              onClick={() =>
                window.alert("Login com Google ainda não implementado.")
              }
            >
              <span className="social-icon social-icon--google" aria-hidden="true">
                G
              </span>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="social-button"
              onClick={() =>
                window.alert("Login com Apple ainda não implementado.")
              }
            >
              <span className="social-icon social-icon--apple" aria-hidden="true">
                ●
              </span>
              <span>Apple</span>
            </button>

            <button
              type="button"
              className="social-button"
              onClick={() =>
                window.alert("Login com Microsoft ainda não implementado.")
              }
            >
              <span
                className="social-icon social-icon--microsoft"
                aria-hidden="true"
              >
                <i></i><i></i><i></i><i></i>
              </span>
              <span>Microsoft</span>
            </button>
          </div>

          <div className="register">
            <span>Ainda não tem uma conta?</span>
            <a href="/register">Criar conta</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;