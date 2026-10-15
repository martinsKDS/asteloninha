import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

import pantera from "../assets/smartcarbo-pantera.png";
import logoNome from "../assets/smartcarbo-nome.png";
import slogan from "../assets/smartcarbo-slogan.png";

function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // =========================
  // ETAPA 1 - CONTA
  // =========================


  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);

  // =========================
  // ETAPA 2 - SAÚDE
  // =========================

  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  // =========================
  // ETAPA 3 - OBJETIVO
  // =========================

  const [goal, setGoal] = useState("");

  // =========================
  // ETAPA 4 - PREFERÊNCIAS
  // =========================

  const [restrictions, setRestrictions] = useState([]);
  const [healthCondition, setHealthCondition] = useState("");
  const [foodRating, setFoodRating] = useState("");

  // =========================
  // ERROS
  // =========================

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // LIMPAR ERRO
  // =========================

  function clearError(field) {
    if (errors[field]) {
      setErrors((previous) => ({
        ...previous,
        [field]: "",
      }));
    }
  }

  // =========================
  // ETAPA 1
  // =========================

  function validateStep1() {
    const newErrors = {};

    if (name.trim() === "") {
      newErrors.name = "Campo obrigatório*";
    } else if (name.trim().length < 3) {
      newErrors.name = "Digite um nome válido.";
    }

    if (email.trim() === "") {
      newErrors.email = "Campo obrigatório*";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ) {
      newErrors.email = "Digite um e-mail válido.";
    }

    if (password === "") {
      newErrors.password = "Campo obrigatório*";
    } else if (password.length < 8) {
      newErrors.password =
        "A senha deve ter pelo menos 8 caracteres.";
    }

    if (confirmPassword === "") {
      newErrors.confirmPassword = "Confirme sua senha.";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "As senhas não coincidem.";
    }

    if (!terms) {
      newErrors.terms =
        "Você precisa aceitar os termos.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // =========================
  // ETAPA 2
  // =========================

  function validateStep2() {
    const newErrors = {};

    if (!birthDate) {
      newErrors.birthDate =
        "Campo obrigatório.";
    }

    if (!gender) {
      newErrors.gender = "Selecione uma opção.";
    }

    if (!height) {
      newErrors.height = "Campo obrigatório.";
    } else if (
      Number(height) < 0.5 ||
      Number(height) > 2.5
    ) {
      newErrors.height =
        "Informe uma altura válida.";
    }

    if (!weight) {
      newErrors.weight = "Campo obrigatório.";
    } else if (
      Number(weight) < 1 ||
      Number(weight) > 500
    ) {
      newErrors.weight =
        "Informe um peso válido.";
    }

    if (!activityLevel) {
      newErrors.activityLevel =
        "Campo obrigatório.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // =========================
  // ETAPA 3
  // =========================

  function validateStep3() {
    const newErrors = {};

    if (!goal) {
      newErrors.goal =
        "Campo obrigatório.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // =========================
  // ETAPA 4
  // =========================

  function validateStep4() {
    const newErrors = {};

    if (!foodRating) {
      newErrors.foodRating =
        "Campo obrigatório";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  // =========================
  // AVANÇAR
  // =========================

  async function handleNext() {
    let valid = false;

    if (step === 1) {
      valid = validateStep1();
    }

    if (step === 2) {
      valid = validateStep2();
    }

    if (step === 3) {
      valid = validateStep3();
    }

    if (step === 4) {
      valid = validateStep4();
    }

    if (!valid) {
      return;
    }

    setErrors({});

    if (step < 4) {
      setStep(step + 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      const dadosUsuario = {
        nome: name.trim(), email: email.trim(), senha: password,
        dataNascimento: birthDate, sexo: gender, altura: Number(height), peso: Number(weight),
        nivelAtividade: activityLevel, objetivo: goal,
        restricoes: restrictions.length ? restrictions.join(", ") : "Nenhuma",
        condicaoSaude: healthCondition || "Nenhuma",
        avaliacaoAlimentacao: foodRating === "ruim" ? 1 : foodRating === "regular" ? 2 : foodRating === "boa" ? 3 : 4,
      };
      setSubmitting(true);

      try {
        const baseUrl = (
          import.meta.env.VITE_API_URL || "http://localhost:8080"
        ).replace(/\/+$/, "");

        const response = await fetch(`${baseUrl}/api/v1/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosUsuario),
        });

        if (response.status === 409) {
          setErrors({
            general: "Este e-mail já está cadastrado. Tente fazer login.",
          });
          return;
        }

        if (response.status === 400) {
          let mensagem = "Confira os dados informados e tente novamente.";
          try {
            const respostaErro = await response.json();
            mensagem = respostaErro.message || respostaErro.mensagem || mensagem;
          } catch {
            // Mantém a mensagem padrão caso a API não retorne JSON.
          }
          setErrors({ general: mensagem });
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Não foi possível concluir o cadastro. Tente novamente."
          );
        }

        localStorage.removeItem("smartcarbo-user");
        localStorage.removeItem("smartcarbo-session");
        localStorage.removeItem("smartcarbo-token");
        localStorage.setItem(
          "smartcarbo-register-success",
          "Cadastro realizado com sucesso! Faça login para continuar."
        );

        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        setErrors({
          general:
            error instanceof TypeError
              ? "Não foi possível conectar ao servidor. Verifique se o backend está funcionando."
              : error.message ||
                "Ocorreu um erro ao realizar o cadastro. Tente novamente.",
        });
      } finally {
        setSubmitting(false);
      }
    }
  }

  // =========================
  // VOLTAR
  // =========================

  function handleBack() {
    if (step > 1) {
      setErrors({});
      setStep(step - 1);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  // =========================
  // RESTRIÇÕES
  // =========================

  function toggleRestriction(option) {
    if (option === "Nenhuma") {
      setRestrictions(
        restrictions.includes("Nenhuma")
          ? []
          : ["Nenhuma"]
      );

      return;
    }

    setRestrictions((current) => {
      const withoutNone = current.filter(
        (item) => item !== "Nenhuma"
      );

      if (withoutNone.includes(option)) {
        return withoutNone.filter(
          (item) => item !== option
        );
      }

      return [...withoutNone, option];
    });
  }

  // =========================
  // COMPONENTE DE ERRO
  // =========================

  function ErrorMessage({ children }) {
    if (!children) {
      return null;
    }

    return (
      <p className="error-message">
        {children}
      </p>
    );
  }

  return (
    <div className="register-page">

      {/* =========================
          HEADER
      ========================= */}

      <header className="register-header">

        <div className="header-brand">

          <img
            src={pantera}
            alt="SmartCarbo"
            className="header-panther"
          />

          <img
            src={logoNome}
            alt="SmartCarbo"
            className="header-logo"
          />

        </div>

        <img
          src={slogan}
          alt="Disciplina nutre resultados"
          className="header-slogan"
        />

      </header>


      {/* =========================
          CONTEÚDO
      ========================= */}

      <main className="register-content">

        {/* =========================
            SIDEBAR
        ========================= */}

        <aside className="register-sidebar">

          <div className="sidebar-heading">

            <div>

              <span className="sidebar-label">
                SMARTCARBO
              </span>

              <h2>
                Cadastro
              </h2>

            </div>

            <span className="step-counter">
              {step}/4
            </span>

          </div>


          <div className="steps">

            {/* ETAPA 1 */}

            <div
              className={`register-step ${
                step === 1
                  ? "active"
                  : step > 1
                  ? "completed"
                  : ""
              }`}
            >

              <span className="step-number">
                {step > 1 ? "✓" : "1"}
              </span>

              <div>
                <p>Dados da conta</p>

                <small>
                  Informações de acesso
                </small>
              </div>

            </div>


            {/* ETAPA 2 */}

            <div
              className={`register-step ${
                step === 2
                  ? "active"
                  : step > 2
                  ? "completed"
                  : ""
              }`}
            >

              <span className="step-number">
                {step > 2 ? "✓" : "2"}
              </span>

              <div>
                <p>Informações de saúde</p>

                <small>
                  Seus dados básicos
                </small>
              </div>

            </div>


            {/* ETAPA 3 */}

            <div
              className={`register-step ${
                step === 3
                  ? "active"
                  : step > 3
                  ? "completed"
                  : ""
              }`}
            >

              <span className="step-number">
                {step > 3 ? "✓" : "3"}
              </span>

              <div>
                <p>Objetivo</p>

                <small>
                  O que você deseja alcançar
                </small>
              </div>

            </div>


            {/* ETAPA 4 */}

            <div
              className={`register-step ${
                step === 4
                  ? "active"
                  : ""
              }`}
            >

              <span className="step-number">
                4
              </span>

              <div>
                <p>Preferências</p>

                <small>
                  Personalize sua experiência
                </small>
              </div>

            </div>

          </div>


          <div className="sidebar-quote">

            <span></span>

            <p>
              Disciplina nutre resultados.
            </p>

          </div>

        </aside>


        {/* =========================
            ÁREA PRINCIPAL
        ========================= */}

        <section className="register-main">


          {/* ==================================================
              ETAPA 1
          ================================================== */}

          {step === 1 && (

            <div className="register-panel">

              <div className="register-title-row">

                <div>

                  <span className="step-label">
                    ETAPA 01
                  </span>

                  <h1>
                    Crie sua conta
                  </h1>

                  <p>
                    Comece sua jornada para uma vida mais saudável.
                  </p>

                </div>

                <span className="login-link">
                  Já tem uma conta?{" "}
                  <a href="/login">
                    Fazer login
                  </a>
                </span>

              </div>


              <form
                className="register-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleNext();
                }}
                noValidate
              >

                <div className="form-group">

                  <label htmlFor="name">
                    Nome completo
                  </label>

                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    autoComplete="name"
                    onChange={(event) => {
                      setName(event.target.value);
                      clearError("name");
                    }}
                    className={
                      errors.name
                        ? "input-error"
                        : ""
                    }
                  />

                  <ErrorMessage>
                    {errors.name}
                  </ErrorMessage>

                </div>


                <div className="form-group">

                  <label htmlFor="email">
                    E-mail
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError("email");
                    }}
                    className={
                      errors.email
                        ? "input-error"
                        : ""
                    }
                  />

                  <ErrorMessage>
                    {errors.email}
                  </ErrorMessage>

                </div>


                <div className="form-group">

                  <label htmlFor="password">
                    Senha
                  </label>

                  <div className="password-field">

                    <input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={password}
                      autoComplete="new-password"
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );
                        clearError("password");
                      }}
                      className={
                        errors.password
                          ? "input-error"
                          : ""
                      }
                    />


                  </div>

                  <ErrorMessage>
                    {errors.password}
                  </ErrorMessage>

                </div>


                <div className="form-group">

                  <label htmlFor="confirmPassword">
                    Confirmar senha
                  </label>

                  <div className="password-field">

                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      autoComplete="new-password"
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        clearError(
                          "confirmPassword"
                        );
                      }}
                      className={
                        errors.confirmPassword
                          ? "input-error"
                          : ""
                      }
                    />


                  </div>

                  <ErrorMessage>
                    {errors.confirmPassword}
                  </ErrorMessage>

                </div>


                <div className="terms">

                  <input
                    id="terms"
                    type="checkbox"
                    checked={terms}
                    onChange={(event) => {
                      setTerms(
                        event.target.checked
                      );
                      clearError("terms");
                    }}
                  />

                  <label htmlFor="terms">

                    Concordo com os{" "}

                    <a href="#">
                      Termos de Uso
                    </a>{" "}

                    e{" "}

                    <a href="#">
                      Política de Privacidade
                    </a>

                  </label>

                </div>

                <ErrorMessage>
                  {errors.terms}
                </ErrorMessage>


                <div className="navigation-buttons only-next">

                  <button
                    type="submit"
                    className="primary-button"
                  >
                    Continuar
                    <span>→</span>
                  </button>

                </div>

              </form>

            </div>

          )}


          {/* ==================================================
              ETAPA 2
          ================================================== */}

          {step === 2 && (

            <div className="register-panel">

              <div className="register-title-row">

                <div>

                  <span className="step-label">
                    ETAPA 02
                  </span>

                  <h1>
                    Vamos conhecer você melhor
                  </h1>

                  <p>
                    Essas informações nos ajudam a personalizar sua experiência.
                  </p>

                </div>

              </div>


              <div className="register-form">

                <div className="form-group">

                  <label htmlFor="birthDate">
                    Data de nascimento
                  </label>

                  <input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(event) => {
                      setBirthDate(
                        event.target.value
                      );
                      clearError("birthDate");
                    }}
                    className={
                      errors.birthDate
                        ? "input-error"
                        : ""
                    }
                  />

                  <ErrorMessage>
                    {errors.birthDate}
                  </ErrorMessage>

                </div>


                <div className="form-group">

                  <label>
                    Sexo
                  </label>

                  <div className="radio-options">

                    <label className="radio-option">

                      <input
                        type="radio"
                        name="gender"
                        value="feminino"
                        checked={
                          gender === "feminino"
                        }
                        onChange={(event) => {
                          setGender(
                            event.target.value
                          );
                          clearError("gender");
                        }}
                      />

                      Feminino

                    </label>


                    <label className="radio-option">

                      <input
                        type="radio"
                        name="gender"
                        value="masculino"
                        checked={
                          gender === "masculino"
                        }
                        onChange={(event) => {
                          setGender(
                            event.target.value
                          );
                          clearError("gender");
                        }}
                      />

                      Masculino

                    </label>


                    <label className="radio-option">

                      <input
                        type="radio"
                        name="gender"
                        value="outro"
                        checked={
                          gender === "outro"
                        }
                        onChange={(event) => {
                          setGender(
                            event.target.value
                          );
                          clearError("gender");
                        }}
                      />

                      Outro

                    </label>

                  </div>

                  <ErrorMessage>
                    {errors.gender}
                  </ErrorMessage>

                </div>


                <div className="two-columns">

                  <div className="form-group">

                    <label htmlFor="height">
                      Altura
                    </label>

                    <div className="input-with-unit">

                      <input
                        id="height"
                        type="number"
                        placeholder="Ex.: 1,70"
                        value={height}
                        min="0.5"
                        max="2.5"
                        step="0.01"
                        onChange={(event) => {
                          setHeight(
                            event.target.value
                          );
                          clearError("height");
                        }}
                        className={
                          errors.height
                            ? "input-error"
                            : ""
                        }
                      />

                      <span>
                        m
                      </span>

                    </div>

                    <ErrorMessage>
                      {errors.height}
                    </ErrorMessage>

                  </div>


                  <div className="form-group">

                    <label htmlFor="weight">
                      Peso
                    </label>

                    <div className="input-with-unit">

                      <input
                        id="weight"
                        type="number"
                        placeholder="Ex.: 70"
                        value={weight}
                        min="1"
                        max="500"
                        step="0.1"
                        onChange={(event) => {
                          setWeight(
                            event.target.value
                          );
                          clearError("weight");
                        }}
                        className={
                          errors.weight
                            ? "input-error"
                            : ""
                        }
                      />

                      <span>
                        kg
                      </span>

                    </div>

                    <ErrorMessage>
                      {errors.weight}
                    </ErrorMessage>

                  </div>

                </div>


                <div className="form-group">

                  <label htmlFor="activityLevel">
                    Nível de atividade física
                  </label>

                  <select
                    id="activityLevel"
                    value={activityLevel}
                    onChange={(event) => {
                      setActivityLevel(
                        event.target.value
                      );
                      clearError(
                        "activityLevel"
                      );
                    }}
                    className={
                      errors.activityLevel
                        ? "input-error"
                        : ""
                    }
                  >

                    <option value="">
                      Selecione uma opção
                    </option>

                    <option value="sedentario">
                      Sedentário
                    </option>

                    <option value="leve">
                      Leve
                    </option>

                    <option value="moderado">
                      Moderado
                    </option>

                    <option value="intenso">
                      Intenso
                    </option>

                  </select>

                  <ErrorMessage>
                    {errors.activityLevel}
                  </ErrorMessage>

                </div>


                <div className="navigation-buttons">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleBack}
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleNext}
                  >
                    Continuar
                    <span>→</span>
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              ETAPA 3
          ================================================== */}

          {step === 3 && (

            <div className="register-panel">

              <div className="register-title-row">

                <div>

                  <span className="step-label">
                    ETAPA 03
                  </span>

                  <h1>
                    Qual é o seu objetivo?
                  </h1>

                  <p>
                    Isso nos ajuda a montar recomendações mais precisas.
                  </p>

                </div>

              </div>


              <div className="register-form">

                <div className="goal-grid">

                  <button
                    type="button"
                    className={
                      goal === "perder-peso"
                        ? "goal-card selected"
                        : "goal-card"
                    }
                    onClick={() => {
                      setGoal("perder-peso");
                      clearError("goal");
                    }}
                  >

                    <span className="goal-icon">
                      ↓
                    </span>

                    <strong>
                      Perder peso
                    </strong>

                    <p>
                      Reduzir meu peso de forma saudável.
                    </p>

                  </button>


                  <button
                    type="button"
                    className={
                      goal === "ganhar-peso"
                        ? "goal-card selected"
                        : "goal-card"
                    }
                    onClick={() => {
                      setGoal("ganhar-peso");
                      clearError("goal");
                    }}
                  >

                    <span className="goal-icon">
                      ↗
                    </span>

                    <strong>
                      Ganhar peso
                    </strong>

                    <p>
                      Aumentar meu peso de forma saudável.
                    </p>

                  </button>


                  <button
                    type="button"
                    className={
                      goal === "ganhar-massa"
                        ? "goal-card selected"
                        : "goal-card"
                    }
                    onClick={() => {
                      setGoal("ganhar-massa");
                      clearError("goal");
                    }}
                  >

                    <span className="goal-icon">
                      ♡
                    </span>

                    <strong>
                      Ganhar massa muscular
                    </strong>

                    <p>
                      Desenvolver massa muscular e força.
                    </p>

                  </button>


                  <button
                    type="button"
                    className={
                      goal === "melhorar-alimentacao"
                        ? "goal-card selected"
                        : "goal-card"
                    }
                    onClick={() => {
                      setGoal(
                        "melhorar-alimentacao"
                      );
                      clearError("goal");
                    }}
                  >

                    <span className="goal-icon">
                      ♧
                    </span>

                    <strong>
                      Melhorar minha alimentação
                    </strong>

                    <p>
                      Ter hábitos alimentares mais equilibrados.
                    </p>

                  </button>


                  <button
                    type="button"
                    className={
                      goal === "manter-peso"
                        ? "goal-card selected"
                        : "goal-card"
                    }
                    onClick={() => {
                      setGoal("manter-peso");
                      clearError("goal");
                    }}
                  >

                    <span className="goal-icon">
                      ♡
                    </span>

                    <strong>
                      Manter meu peso e saúde geral
                    </strong>

                    <p>
                      Manter meu peso e cuidar da saúde.
                    </p>

                  </button>

                </div>

                <ErrorMessage>
                  {errors.goal}
                </ErrorMessage>


                <div className="navigation-buttons">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleBack}
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleNext}
                  >
                    Continuar
                    <span>→</span>
                  </button>

                </div>

              </div>

            </div>

          )}


          {/* ==================================================
              ETAPA 4
          ================================================== */}

          {step === 4 && (

            <div className="register-panel">

              <div className="register-title-row">

                <div>

                  <span className="step-label">
                    ETAPA 04
                  </span>

                  <h1>
                    Personalize sua experiência
                  </h1>

                  <p>
                    Conte-nos mais sobre suas preferências.
                  </p>

                </div>

              </div>


              <div className="register-form">

                <div className="form-group">

                  <label>
                    Possui alguma restrição alimentar?
                  </label>

                  <div className="restriction-grid">

                    {[
                      "Lactose",
                      "Glúten",
                      "Amendoim",
                      "Frutos do mar",
                      "Outra",
                      "Nenhuma",
                    ].map((option) => (

                      <label
                        className="check-option"
                        key={option}
                      >

                        <input
                          type="checkbox"
                          checked={restrictions.includes(
                            option
                          )}
                          onChange={() =>
                            toggleRestriction(
                              option
                            )
                          }
                        />

                        <span>
                          {option}
                        </span>

                      </label>

                    ))}

                  </div>

                </div>


                <div className="form-group">

                  <label htmlFor="healthCondition">
                    Possui alguma condição de saúde?
                  </label>

                  <select
                    id="healthCondition"
                    value={healthCondition}
                    onChange={(event) =>
                      setHealthCondition(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Selecione uma opção
                    </option>

                    <option value="nenhuma">
                      Nenhuma
                    </option>

                    <option value="diabetes">
                      Diabetes
                    </option>

                    <option value="hipertensao">
                      Hipertensão
                    </option>

                    <option value="outra">
                      Outra
                    </option>

                  </select>

                </div>


                <div className="form-group">

                  <label>
                    Como você avalia sua alimentação atual?
                  </label>

                  <div className="rating-grid">

                    {[
                      {
                        value: "ruim",
                        label: "Ruim",
                        icon: "☹",
                      },
                      {
                        value: "regular",
                        label: "Regular",
                        icon: "◔",
                      },
                      {
                        value: "boa",
                        label: "Boa",
                        icon: "●",
                      },
                      {
                        value: "otima",
                        label: "Ótima",
                        icon: "☺",
                      },
                    ].map((item) => (

                      <button
                        type="button"
                        key={item.value}
                        className={
                          foodRating === item.value
                            ? "rating-card selected"
                            : "rating-card"
                        }
                        onClick={() => {
                          setFoodRating(
                            item.value
                          );

                          clearError(
                            "foodRating"
                          );
                        }}
                      >

                        <span>
                          {item.icon}
                        </span>

                        <strong>
                          {item.label}
                        </strong>

                      </button>

                    ))}

                  </div>

                  <ErrorMessage>
                    {errors.foodRating}
                  </ErrorMessage>

                </div>


                <ErrorMessage>
                  {errors.general}
                </ErrorMessage>

                <div className="navigation-buttons">

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleBack}
                    disabled={submitting}
                  >
                    ← Voltar
                  </button>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={handleNext}
                    disabled={submitting}
                  >
                    {submitting ? "Enviando cadastro..." : "Finalizar cadastro"}
                    {!submitting && <span>✓</span>}
                  </button>

                </div>

              </div>

            </div>

          )}

        </section>

      </main>

    </div>
  );
}

export default Register;