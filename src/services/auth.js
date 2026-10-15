const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8080")
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const login = (email, password) => fetch(`${API_BASE_URL}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, senha: password }),
});

const logout = () => {
  ["user", "smartcarbo-user", "smartcarbo-session", "smartcarbo-token", "token"].forEach(key => localStorage.removeItem(key));
};

export default { login, logout };
