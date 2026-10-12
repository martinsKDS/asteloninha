import axios from "axios";

const API_URL = "http://localhost:8080/api/auth/";

const login = (email, password) => {
    return axios.post(API_URL + "login", {
        email: email,
        senha: password
    });
};

const logout = () => {
    localStorage.removeItem("user");
};

const authService = {
    login,
    logout,
};

export default authService;