const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8080'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const TOKEN_KEY = 'smartcarbo-token';
const SESSION_KEY = 'smartcarbo-session';

async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      email,
      senha: password,
    }),
  });

  if (!response.ok) {
    let message = 'Não foi possível realizar o login.';

    try {
      const data = await response.json();
      message =
        data.message ||
        data.mensagem ||
        data.erro ||
        message;
    } catch {
      // A resposta não contém JSON.
    }

    throw new Error(message);
  }

  const data = await response.json();

  if (data.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }

  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      id: data.id,
      nome: data.nome,
      email: data.email,
    }),
  );

  return data;
}

function logout() {
  [
    'user',
    'smartcarbo-user',
    SESSION_KEY,
    TOKEN_KEY,
    'token',
  ].forEach((key) => localStorage.removeItem(key));
}

export default {
  login,
  logout,
};