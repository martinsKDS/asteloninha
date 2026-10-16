import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import EvolucaoIntegrada from './EvolucaoIntegrada.jsx';
import Community from './Community.jsx';
const TEMPLATE_KEY = 'smartcarbo-meal-templates-v1';
const SELECTED_DATE_KEY = 'smartcarbo-selected-meal-date';
const progressKey = (date) => `smartcarbo-meal-progress-v1-${date}`;
const WEIGHT_KEY = 'smartcarbo-evolucao-pesos-v1';
const WEIGHT_GOAL_KEY = 'smartcarbo-meta-peso-v1';
const fallbackImage = 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=240&q=85';
const foodCatalog = [
    { name: 'Arroz integral cozido', portion: '100g (1 porção)', calories: 124, emoji: '🍚' },
    { name: 'Peito de frango grelhado', portion: '100g (1 porção)', calories: 165, emoji: '🍗' },
    { name: 'Banana prata', portion: '1 unidade média', calories: 89, emoji: '🍌' },
    { name: 'Ovo cozido', portion: '50g (1 unidade)', calories: 78, emoji: '🥚' },
    { name: 'Batata doce cozida', portion: '100g (1 porção)', calories: 86, emoji: '🍠' },
    { name: 'Feijão cozido', portion: '100g (1 concha pequena)', calories: 76, emoji: '🫘' },
    { name: 'Aveia', portion: '30g (2 colheres)', calories: 117, emoji: '🥣' },
];
const dayNames = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const monthNames = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const suggestions = [{ title: 'Café da manhã equilibrado', category: 'Café da manhã', description: 'Aveia e banana para começar o dia.', foods: [{ name: 'Aveia', portion: '30g', calories: 117, emoji: '🥣' }, { name: 'Banana prata', portion: '1 unidade', calories: 89, emoji: '🍌' }] }, { title: 'Almoço caseiro', category: 'Almoço', description: 'Arroz integral, feijão e frango grelhado.', foods: [{ name: 'Arroz integral cozido', portion: '100g', calories: 124, emoji: '🍚' }, { name: 'Feijão cozido', portion: '100g', calories: 76, emoji: '🫘' }, { name: 'Peito de frango grelhado', portion: '100g', calories: 165, emoji: '🍗' }] }, { title: 'Lanche prático', category: 'Lanche', description: 'Uma combinação simples para o lanche.', foods: [{ name: 'Banana prata', portion: '1 unidade', calories: 89, emoji: '🍌' }, { name: 'Aveia', portion: '30g', calories: 117, emoji: '🥣' }] }, { title: 'Jantar simples', category: 'Jantar', description: 'Batata-doce e ovo cozido.', foods: [{ name: 'Batata doce cozida', portion: '100g', calories: 86, emoji: '🍠' }, { name: 'Ovo cozido', portion: '1 unidade', calories: 78, emoji: '🥚' }] }];
const localISODate = (date = new Date()) => { const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return d.toISOString().slice(0, 10); };
const formatDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); const date = new Date(y, m - 1, d); return `${dayNames[date.getDay()]}, ${d} de ${monthNames[m - 1]}`; };
function normalizarObjetivoPerfil(valor) {
    const normalizado = String(valor || '')
        .trim()
        .toLocaleLowerCase('pt-BR')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ');

    if (['perder peso', 'emagrecer'].includes(normalizado)) return 'perder-peso';
    if (normalizado === 'ganhar peso') return 'ganhar-peso';
    if (['ganhar massa muscular', 'ganhar musculos'].includes(normalizado)) return 'ganhar-massa-muscular';
    if (['manter peso', 'manter meu peso', 'manter meu peso e saude geral', 'manutencao'].includes(normalizado)) return 'manter-peso';
    if (['melhorar alimentacao', 'melhorar minha alimentacao'].includes(normalizado)) return 'melhorar-alimentacao';

    // Valores antigos do perfil que não correspondem aos cinco objetivos atuais.
    if (['acompanhar carboidratos', 'organizar minhas refeicoes', 'ter uma rotina alimentar variada'].includes(normalizado)) {
        return 'melhorar-alimentacao';
    }
    return 'melhorar-alimentacao';
}
function readJSON(key, fallback) { try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
}
catch {
    return fallback;
} }
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080')
    .replace(/\/+$/, '').replace(/\/api$/, '');
function getApiToken() {
    return localStorage.getItem('smartcarbo-token');
}
async function apiRequest(path, options = {}) {
    const token = getApiToken();
    if (!token)
        throw new Error('Sua sessão não foi encontrada. Entre novamente.');
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!response.ok) {
        let message = `Erro na API (${response.status}).`;
        try {
            const body = await response.json();
            message = body.message || body.mensagem || message;
        }
        catch { }
        if (response.status === 401 || response.status === 403) {
            message = 'Sua sessão expirou ou não tem permissão. Entre novamente.';
        }
        throw new Error(message);
    }
    if (response.status === 204)
        return null;
    return response.json();
}
const carbsByFoodName = {
    'Arroz integral cozido': 23,
    'Peito de frango grelhado': 0,
    'Banana prata': 23,
    'Ovo cozido': 0.6,
    'Batata doce cozida': 20,
    'Feijão cozido': 14,
    'Aveia': 20,
};
function toApiFoodRecord(food, mealTitle, date, refeicaoId) {
    const quantity = Number(food.quantity) > 0 ? Number(food.quantity) : 1;
    const nutrient = (value) => Math.round((Number(value) || 0) * quantity * 100) / 100;
    return {
        nomeAlimento: food.name,
        quantidade: quantity,
        tipoRefeicao: mealTitle,
        refeicaoId,
        // Os valores enviados representam o total da quantidade selecionada.
        calorias: nutrient(food.baseCalories ?? food.calories / quantity),
        carboidratos: nutrient(food.baseCarbs ?? food.carbs ?? carbsByFoodName[food.name]),
        proteinas: nutrient(food.baseProteins ?? food.proteins),
        gorduras: nutrient(food.baseFats ?? food.fats),
        fibras: nutrient(food.baseFiber ?? food.fiber),
        sodio: nutrient(food.baseSodium ?? food.sodium),
        dataHora: `${date}T12:00:00`,
    };
}
function Icon({ children }) { return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>; }
function HomeDashboard({ profileName, meals, progress, waterMl, waterLoading, waterError, onAddWater, onUndoWater, setActivePage, calorieGoal, calorieGoalLoading, calorieGoalMessage }) {
    const today = localISODate();
    const goalAvailable = Number(calorieGoal) > 0;
    const goal = goalAvailable ? Number(calorieGoal) : 0;
    const weightGoal = Math.max(1, Number(localStorage.getItem(WEIGHT_GOAL_KEY)) || 55);
    let weight = null;
    try {
        const records = JSON.parse(localStorage.getItem(WEIGHT_KEY) || '[]');
        const latest = [...records].sort((a, b) => String(b.data).localeCompare(String(a.data)))[0];
        if (latest && Number(latest.valor) > 0)
            weight = Number(latest.valor);
    }
    catch { /* mantém o estado vazio se o histórico estiver inválido */ }
    const loggedMeals = meals.filter(m => (m.components || []).length > 0);
    const calories = loggedMeals.reduce((sum, m) => sum + (m.components || []).reduce((n, f) => n + (Number(f.calories) || 0), 0), 0);
    const carbsByName = { 'Arroz integral cozido': 23, 'Peito de frango grelhado': 0, 'Banana prata': 23, 'Ovo cozido': 0.6, 'Batata doce cozida': 20, 'Feijão cozido': 14, 'Aveia': 20 };
    const carbs = loggedMeals.reduce((sum, m) => sum + (m.components || []).reduce((n, f) => n + (Number(f.carbs) || carbsByName[f.name] || 0), 0), 0);
    const waterGoal = 2000;
    const percent = goalAvailable ? Math.min(100, Math.round(calories / goal * 100)) : 0;
    const dateLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; const daily = (() => { try {
        return JSON.parse(localStorage.getItem(`smartcarbo-meal-progress-v1-${key}`) || '{}');
    }
    catch {
        return {};
    } })(); const total = meals.filter(m => daily[m.id]).reduce((sum, m) => sum + (Number.parseInt(m.calories, 10) || 0), 0); return { label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), total }; });
    const maxChart = Math.max(goal, ...last7.map(x => x.total), 1);
    return <section className="home-dashboard">
    <div className="home-welcome"><div><span className="home-eyebrow">SEU RESUMO DIÁRIO</span><h1>Olá, {profileName || 'por aqui'}! <span>👋</span></h1><p>Vamos acompanhar sua alimentação de hoje?</p></div><div className="home-date">▦ <span>{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</span></div></div>
    <div className="home-metrics">
      <article className="home-metric home-metric--calories">
        <div className="home-metric__top"><span className="home-metric__icon">◉</span><span>Calorias de hoje</span></div>
        <strong>{calories.toLocaleString('pt-BR')} <small>{calorieGoalLoading ? '/ calculando...' : goalAvailable ? `/ ${goal.toLocaleString('pt-BR')} kcal` : '/ meta indisponível'}</small></strong>
        <div className="home-progress"><span style={{ width: `${percent}%` }}/></div>
        <p>{calorieGoalLoading
            ? 'Carregando estimativa energética...'
            : goalAvailable
                ? `${Math.max(0, goal - calories).toLocaleString('pt-BR')} kcal restantes para a estimativa diária`
                : calorieGoalMessage || 'Complete os dados do perfil para consultar a estimativa.'}</p>
      </article>
      <article className="home-metric"><div className="home-metric__top"><span className="home-metric__icon">⚖</span><span>Peso atual</span></div><strong>{weight === null ? '—' : `${weight.toLocaleString('pt-BR')} kg`}</strong><p>{weight === null ? 'Registre seu peso na tela Evolução' : `Meta pessoal: ${weightGoal.toLocaleString('pt-BR')} kg`}</p><button className="home-text-action" onClick={() => setActivePage('Evolução')}>Acompanhar evolução →</button></article>
      <article className="home-metric"><div className="home-metric__top"><span className="home-metric__icon">⌁</span><span>Carboidratos</span></div><strong>{Math.round(carbs).toLocaleString('pt-BR')} <small>g estimados</small></strong><p>{loggedMeals.length ? 'Estimativa pelos alimentos registrados' : 'Seus dados aparecerão após registrar alimentos'}</p></article>
      <article className="home-metric home-metric--water"><div className="home-metric__top"><span className="home-metric__icon">💧</span><span>Consumo de água</span></div><strong>{(waterMl / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} <small>/ 2 L</small></strong><div className="home-progress home-progress--water"><span style={{ width: `${Math.min(100, waterMl / waterGoal * 100)}%` }}/></div><div className="home-water-actions"><button type="button" onClick={onAddWater} disabled={waterLoading}>{waterLoading ? 'Salvando...' : '+ 250 ml'}</button><button type="button" onClick={onUndoWater} disabled={waterLoading || waterMl <= 0}>{waterLoading ? 'Aguarde...' : '− último registro'}</button></div>{waterError && <p className="meal-form__error" role="alert">{waterError}</p>}</article>
    </div>
    <div className="home-section-heading"><div><h2>Suas refeições</h2><p>Apenas refeições em que você já registrou alimentos.</p></div><button className="home-text-action" onClick={() => setActivePage('Refeições')}>Ver refeições →</button></div>
    {loggedMeals.length ? <div className="home-meals">{loggedMeals.slice(0, 4).map(meal => <article className="home-meal" key={meal.id}><div className="home-meal__emoji">🍽️</div><div className="home-meal__copy"><strong>{meal.title}</strong><span>{(meal.components || []).length} alimento(s) registrado(s)</span></div><strong className="home-meal__calories">{(meal.components || []).reduce((n, f) => n + (Number(f.calories) || 0), 0).toLocaleString('pt-BR')} kcal</strong><button aria-label={`Abrir ${meal.title}`} onClick={() => setActivePage('Refeições')}>→</button></article>)}</div> : <div className="home-empty"><span>🥗</span><div><strong>Seu diário começa aqui</strong><p>Você ainda não registrou alimentos nas refeições. Adicione alimentos para ver seu resumo atualizado aqui.</p></div><button className="primary-button" onClick={() => setActivePage('Refeições')}>Registrar refeição</button></div>}
    <div className="home-bottom-grid"><article className="home-chart-card"><div className="home-section-heading"><div><h2>Seu progresso</h2><p>Calorias das refeições marcadas como concluídas.</p></div><span className="home-chart-badge">Últimos 7 dias</span></div><div className="home-chart">{last7.map(day => <div className="home-chart__column" key={day.label}><span className="home-chart__value">{day.total || ''}</span><div className="home-chart__bar-wrap"><i style={{ height: `${Math.max(day.total ? 4 : 0, day.total / maxChart * 100)}%` }}/></div><small>{day.label}</small></div>)}</div><div className="home-chart-legend"><span /> Consumo registrado {goalAvailable && <><i /> Estimativa diária ({goal.toLocaleString('pt-BR')} kcal)</>}</div></article><article className="home-shortcuts"><h2>Atalhos</h2><div className="home-shortcut-grid"><button onClick={() => setActivePage('Refeições')}><span>＋</span><strong>Registrar refeição</strong><small>Adicione alimentos ao seu diário.</small></button><button onClick={() => setActivePage('Evolução')}><span>↗</span><strong>Ver evolução</strong><small>Acompanhe peso e calorias.</small></button></div></article></div>
  </section>;
}
export default function Dashboard() {
    const navigate = useNavigate();
    const [calorieGoal, setCalorieGoal] = useState(null);
    const [calorieGoalMessage, setCalorieGoalMessage] = useState('');
    const [calorieGoalLoading, setCalorieGoalLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(() => { const saved = localStorage.getItem(SELECTED_DATE_KEY); return saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) ? saved : localISODate(); });
    const [meals, setMeals] = useState(() => readJSON(TEMPLATE_KEY, []));
    const [apiFoodRecords, setApiFoodRecords] = useState([]);
    const [foodApiError, setFoodApiError] = useState('');
    const [foodApiSaving, setFoodApiSaving] = useState(false);
    const [progress, setProgress] = useState(() => readJSON(progressKey(localStorage.getItem(SELECTED_DATE_KEY) || localISODate()), {}));
    const [search, setSearch] = useState('');
    const [mealDialog, setMealDialog] = useState(false);
    const [mealName, setMealName] = useState('');
    const [mealDescription, setMealDescription] = useState('');
    const [mealError, setMealError] = useState('');
    const [menuId, setMenuId] = useState(null);
    const [renameTarget, setRenameTarget] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [removeTarget, setRemoveTarget] = useState(null);
    const [activeMealId, setActiveMealId] = useState(null);
    const [foodSearch, setFoodSearch] = useState('');
    const [activeComponents, setActiveComponents] = useState([]);
    const [customFoodName, setCustomFoodName] = useState('');
    const [customFoodPortion, setCustomFoodPortion] = useState('');
    const [customFoodCalories, setCustomFoodCalories] = useState('');
    const [activeTab, setActiveTab] = useState('Hoje');
    const [activePage, setActivePage] = useState(() => {
        const paginasValidas = ['Refeições', 'Evolução', 'Perfil', 'Início', 'Comunidade'];
        const paginaSalva = localStorage.getItem('smartcarbo-ultima-pagina');
        return paginasValidas.includes(paginaSalva) ? paginaSalva : 'Início';
    });
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
    const [waterMl, setWaterMl] = useState(0);
    const [waterRecords, setWaterRecords] = useState([]);
    const [waterLoading, setWaterLoading] = useState(false);
    const [waterError, setWaterError] = useState('');
    const [profileName, setProfileName] = useState(() => localStorage.getItem('smartcarbo-profile-name') || 'Mariana');
    const [profileEmail, setProfileEmail] = useState(() => localStorage.getItem('smartcarbo-profile-email') || 'mariana@email.com');
    const [profileGoal, setProfileGoal] = useState(() => normalizarObjetivoPerfil(localStorage.getItem('smartcarbo-profile-goal') || 'melhorar-alimentacao'));
    const [profileSaved, setProfileSaved] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileTab, setProfileTab] = useState('Dados pessoais');
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileGender, setProfileGender] = useState(() => localStorage.getItem('smartcarbo-profile-gender') || '');
    const [profileHeight, setProfileHeight] = useState(() => localStorage.getItem('smartcarbo-profile-height') || '');
    const [profileBirth, setProfileBirth] = useState(() => localStorage.getItem('smartcarbo-profile-birth') || '');
    const [profileWeight, setProfileWeight] = useState(() => localStorage.getItem('smartcarbo-profile-weight') || '');
    const [profileActivity, setProfileActivity] = useState(() => localStorage.getItem('smartcarbo-profile-activity') || '');
    const [profileRestrictions, setProfileRestrictions] = useState(() => localStorage.getItem('smartcarbo-profile-restrictions') || '');
    const [profileHealthCondition, setProfileHealthCondition] = useState(() => localStorage.getItem('smartcarbo-profile-health-condition') || '');
    const [profileFoodAssessment, setProfileFoodAssessment] = useState(() => localStorage.getItem('smartcarbo-profile-food-assessment') || '');
    const [profileFoodPreference, setProfileFoodPreference] = useState(() => localStorage.getItem('smartcarbo-profile-food-preference') || 'Sem preferência específica');
    const [profileNotifications, setProfileNotifications] = useState(() => localStorage.getItem('smartcarbo-profile-notifications') !== 'false');
    const mealDialogRef = useRef(null);
    const detailDialogRef = useRef(null);
    const renameDialogRef = useRef(null);
    const removeDialogRef = useRef(null);
    useEffect(() => {
        const token = localStorage.getItem('smartcarbo-token');
        if (!token)
            return;
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '').replace(/\/api$/, '');
        fetch(`${baseUrl}/api/v1/usuarios/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (response) => {
            if (!response.ok)
                return;
            const user = await response.json();
            if (user.nome)
                setProfileName(user.nome);
            if (user.email)
                setProfileEmail(user.email);
            if (user.objetivo)
                setProfileGoal(normalizarObjetivoPerfil(user.objetivo));
            if (user.sexo)
                setProfileGender(user.sexo);
            if (user.altura != null) {
                const altura = Number(user.altura);
                setProfileHeight(String(altura > 3 ? altura : altura * 100));
            }
            if (user.dataNascimento)
                setProfileBirth(String(user.dataNascimento).slice(0, 10));
            if (user.peso != null) {
                setProfileWeight(String(user.peso));
                localStorage.setItem('smartcarbo-profile-weight', String(user.peso));
            }
            if (user.nivelAtividade != null) {
                setProfileActivity(String(user.nivelAtividade));
                localStorage.setItem('smartcarbo-profile-activity', String(user.nivelAtividade));
            }
            if (user.restricoes != null) {
                setProfileRestrictions(String(user.restricoes));
                localStorage.setItem('smartcarbo-profile-restrictions', String(user.restricoes));
            }
            if (user.condicaoSaude != null) {
                setProfileHealthCondition(String(user.condicaoSaude));
                localStorage.setItem('smartcarbo-profile-health-condition', String(user.condicaoSaude));
            }
            if (user.avaliacaoAlimentacao != null) {
                setProfileFoodAssessment(String(user.avaliacaoAlimentacao));
                localStorage.setItem('smartcarbo-profile-food-assessment', String(user.avaliacaoAlimentacao));
            }
            localStorage.setItem('smartcarbo-profile-name', user.nome || '');
            localStorage.setItem('smartcarbo-profile-email', user.email || '');
        })
            .catch(error => console.warn('Não foi possível carregar o perfil da API:', error));
    }, []);
    useEffect(() => {
        let cancelled = false;

        async function carregarMetaCalorica() {
            if (!getApiToken()) {
                setCalorieGoal(null);
                setCalorieGoalMessage('Entre na sua conta para consultar a estimativa energética.');
                setCalorieGoalLoading(false);
                return;
            }

            setCalorieGoalLoading(true);
            try {
                const resultado = await apiRequest('/api/v1/usuarios/me/meta-calorica');
                if (cancelled) return;

                if (resultado?.status === 'ESTIMATIVA_DISPONIVEL' && Number(resultado.estimativaKcal) > 0) {
                    setCalorieGoal(Number(resultado.estimativaKcal));
                } else {
                    setCalorieGoal(null);
                }
                setCalorieGoalMessage(resultado?.mensagem || 'Não foi possível definir a estimativa energética.');
            } catch (error) {
                if (!cancelled) {
                    setCalorieGoal(null);
                    setCalorieGoalMessage(error.message || 'Não foi possível carregar a estimativa energética.');
                }
            } finally {
                if (!cancelled) setCalorieGoalLoading(false);
            }
        }

        carregarMetaCalorica();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        let cancelled = false;
        async function loadFoodRecords() {
            if (!getApiToken()) {
                setFoodApiError('Entre na sua conta para sincronizar os alimentos.');
                return;
            }
            try {
                const [records, apiMeals] = await Promise.all([
                    apiRequest('/api/v1/registros-alimentacao'),
                    apiRequest('/api/v1/refeicoes'),
                ]);
                if (!cancelled) {
                    setApiFoodRecords(Array.isArray(records) ? records : []);
                    const savedLocalMeals = readJSON(TEMPLATE_KEY, []);
                    const legacyMeals = savedLocalMeals.filter(meal => !meal.apiId);
                    const normalizedApiMeals = (Array.isArray(apiMeals) ? apiMeals : []).map(meal => {
                        // Reconstrói os alimentos e as calorias a partir dos registros persistidos.
                        // O vínculo principal é o ID da refeição, nunca o nome.
                        const linkedRecords = (Array.isArray(records) ? records : []).filter(record =>
                            Number(record.refeicaoId) === Number(meal.id)
                        );
                        const totalCalories = linkedRecords.reduce(
                            (sum, record) => sum + (Number(record.calorias) || 0), 0
                        );
                        const components = linkedRecords.map(record => {
                            const quantity = Number(record.quantidade) > 0 ? Number(record.quantidade) : 1;
                            const calories = Number(record.calorias) || 0;
                            const carbs = Number(record.carboidratos) || 0;
                            const proteins = Number(record.proteinas) || 0;
                            const fats = Number(record.gorduras) || 0;
                            const fiber = Number(record.fibras) || 0;
                            const sodium = Number(record.sodio) || 0;
                            return {
                                id: `api-${record.id}`,
                                apiId: record.id,
                                name: record.nomeAlimento,
                                portion: `${quantity} porção(ões)`,
                                quantity,
                                calories,
                                baseCalories: calories / quantity,
                                carbs,
                                baseCarbs: carbs / quantity,
                                proteins,
                                baseProteins: proteins / quantity,
                                fats,
                                baseFats: fats / quantity,
                                fiber,
                                baseFiber: fiber / quantity,
                                sodium,
                                baseSodium: sodium / quantity,
                                emoji: '🍽️',
                            };
                        });
                        return {
                            id: `api-meal-${meal.id}`,
                            apiId: meal.id,
                            title: meal.nome,
                            description: meal.descricao || '',
                            dateRefeicao: meal.dataRefeicao,
                            time: '--:--',
                            calories: `${totalCalories} kcal`,
                            image: fallbackImage,
                            components,
                        };
                    });
                    setMeals([...normalizedApiMeals, ...legacyMeals]);
                    setFoodApiError('');
                }
            }
            catch (error) {
                if (!cancelled)
                    setFoodApiError(error.message || 'Não foi possível carregar os alimentos.');
            }
        }
        loadFoodRecords();
        return () => { cancelled = true; };
    }, []);
    async function handleProfileSubmit(event) {
        event.preventDefault();
        setProfileError('');
        setProfileSaved(false);
        const token = localStorage.getItem('smartcarbo-token');
        let session = {};
        try {
            session = JSON.parse(localStorage.getItem('smartcarbo-session') || '{}');
        }
        catch {
            session = {};
        }
        if (!token || !session.id) {
            setProfileError('Faça login novamente para salvar as alterações na sua conta.');
            return;
        }
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '').replace(/\/api$/, '');
        const payload = {
            nome: profileName.trim(), email: profileEmail.trim(), objetivo: profileGoal,
            sexo: profileGender || null,
            altura: profileHeight.trim() ? Number(profileHeight.replace(',', '.')) / 100 : null,
            dataNascimento: profileBirth || null,
            peso: profileWeight.trim() ? Number(profileWeight.replace(',', '.')) : null,
            nivelAtividade: profileActivity || null,
            restricoes: profileRestrictions.trim() || null,
            condicaoSaude: profileHealthCondition.trim() || null,
            avaliacaoAlimentacao: profileFoodAssessment.trim() ? Number(profileFoodAssessment) : null
        };
        if (!payload.nome || !payload.email) {
            setProfileError('Nome e e-mail são obrigatórios.');
            return;
        }
        if (payload.altura !== null && (!Number.isFinite(payload.altura) || payload.altura <= 0)) {
            setProfileError('Informe uma altura válida.');
            return;
        }
        if (payload.peso !== null && (!Number.isFinite(payload.peso) || payload.peso <= 0)) {
            setProfileError('Informe um peso válido.');
            return;
        }
        if (payload.avaliacaoAlimentacao !== null && (!Number.isInteger(payload.avaliacaoAlimentacao) || payload.avaliacaoAlimentacao < 1 || payload.avaliacaoAlimentacao > 10)) {
            setProfileError('A avaliação alimentar deve ser um número inteiro entre 1 e 10.');
            return;
        }
        setProfileSaving(true);
        try {
            const response = await fetch(`${baseUrl}/api/v1/usuarios/${session.id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
            });
            if (!response.ok) {
                let message = 'Não foi possível salvar o perfil.';
                try {
                    const body = await response.json();
                    message = body.message || body.mensagem || message;
                }
                catch { }
                if (response.status === 401 || response.status === 403)
                    message = 'Sua sessão expirou ou você não tem permissão. Entre novamente.';
                throw new Error(message);
            }
            [['name', payload.nome], ['email', payload.email], ['goal', profileGoal], ['gender', profileGender], ['height', profileHeight], ['birth', profileBirth], ['weight', profileWeight], ['activity', profileActivity], ['restrictions', profileRestrictions], ['health-condition', profileHealthCondition], ['food-assessment', profileFoodAssessment], ['food-preference', profileFoodPreference], ['notifications', String(profileNotifications)]].forEach(([key, value]) => localStorage.setItem(`smartcarbo-profile-${key}`, value ?? ''));
            localStorage.setItem('smartcarbo-session', JSON.stringify({ ...session, nome: payload.nome, email: payload.email }));
            setProfileName(payload.nome);
            setProfileEmail(payload.email);
            setProfileSaved(true);
            setProfileEditing(false);
        }
        catch (error) {
            setProfileError(error.message || 'Erro ao salvar o perfil. Verifique a conexão com o backend.');
        }
        finally {
            setProfileSaving(false);
        }
    }
    useEffect(() => { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(meals)); }, [meals]);
    useEffect(() => { localStorage.setItem(SELECTED_DATE_KEY, selectedDate); }, [selectedDate]);
    useEffect(() => { localStorage.setItem('smartcarbo-ultima-pagina', activePage); }, [activePage]);
    useEffect(() => {
        let cancelled = false;
        async function loadWaterForToday() {
            if (!getApiToken()) {
                setWaterRecords([]);
                setWaterMl(0);
                setWaterError('Entre na sua conta para sincronizar o consumo de água.');
                return;
            }
            try {
                setWaterError('');
                const records = await apiRequest(`/api/v1/agua/data/${localISODate()}`);
                if (cancelled) return;
                const safeRecords = Array.isArray(records) ? records : [];
                setWaterRecords(safeRecords);
                setWaterMl(safeRecords.reduce((total, record) => total + (Number(record.quantidadeMl) || 0), 0));
            } catch (error) {
                if (!cancelled) {
                    setWaterError(error.message || 'Não foi possível carregar o consumo de água.');
                }
            }
        }
        loadWaterForToday();
        return () => { cancelled = true; };
    }, []);

    async function addWaterRecord() {
        if (waterLoading) return;
        setWaterLoading(true);
        setWaterError('');
        try {
            const created = await apiRequest('/api/v1/agua', {
                method: 'POST',
                body: JSON.stringify({ quantidadeMl: 250 }),
            });
            setWaterRecords(old => [created, ...old]);
            setWaterMl(old => old + (Number(created.quantidadeMl) || 250));
        } catch (error) {
            setWaterError(error.message || 'Não foi possível registrar água.');
        } finally {
            setWaterLoading(false);
        }
    }

    async function undoLastWaterRecord() {
        if (waterLoading || waterRecords.length === 0) return;
        setWaterLoading(true);
        setWaterError('');
        try {
            const latest = [...waterRecords].sort((a, b) =>
                String(b.dataHora || '').localeCompare(String(a.dataHora || ''))
            )[0];
            await apiRequest(`/api/v1/agua/${latest.id}`, { method: 'DELETE' });
            setWaterRecords(old => old.filter(record => record.id !== latest.id));
            setWaterMl(old => Math.max(0, old - (Number(latest.quantidadeMl) || 0)));
        } catch (error) {
            setWaterError(error.message || 'Não foi possível excluir o último registro de água.');
        } finally {
            setWaterLoading(false);
        }
    }
    useEffect(() => { setProgress(readJSON(progressKey(selectedDate), {})); }, [selectedDate]);
    useEffect(() => { localStorage.setItem(progressKey(selectedDate), JSON.stringify(progress)); }, [progress, selectedDate]);
    useEffect(() => {
        const pairs = [[mealDialogRef, mealDialog], [detailDialogRef, activeMealId !== null], [renameDialogRef, renameTarget !== null], [removeDialogRef, removeTarget !== null]];
        pairs.forEach(([ref, open]) => { const el = ref.current; if (!el)
            return; if (open && !el.open)
            el.showModal(); if (!open && el.open)
            el.close(); });
    }, [mealDialog, activeMealId, renameTarget, removeTarget]);
    const visibleMeals = useMemo(() => meals.filter(meal => `${meal.title} ${meal.description}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR'))), [meals, search]);
    const activeMeal = meals.find(meal => meal.id === activeMealId);
    const foodResults = foodCatalog.filter(food => `${food.name} ${food.portion}`.toLocaleLowerCase('pt-BR').includes(foodSearch.trim().toLocaleLowerCase('pt-BR')));
    const foodTotal = activeComponents.reduce((sum, food) => sum + (Number(food.calories) || 0), 0);
    async function createMeal(event) {
        event.preventDefault();
        const title = mealName.trim();
        if (!title) {
            setMealError('Preencha o nome da refeição.');
            return;
        }
        setMealError('');
        const description = mealDescription.trim();
        try {
            const saved = await apiRequest('/api/v1/refeicoes', {
                method: 'POST',
                body: JSON.stringify({ nome: title, descricao: description || null, dataRefeicao: selectedDate }),
            });
            setMeals(old => [...old, {
                id: `api-meal-${saved.id}`, apiId: saved.id, title: saved.nome,
                description: saved.descricao || '', dateRefeicao: saved.dataRefeicao,
                time: '--:--', calories: '0 kcal', image: fallbackImage, components: [],
            }]);
            setMealDialog(false);
            setMealName('');
            setMealDescription('');
        } catch (error) {
            setMealError(error.message || 'Não foi possível salvar a refeição no servidor.');
        }
    }
    function toggleComplete(id, checked) { setProgress(old => ({ ...old, [id]: checked })); }
    async function addSuggestion(item) {
        try {
            const saved = await apiRequest('/api/v1/refeicoes', {
                method: 'POST',
                body: JSON.stringify({ nome: item.title, descricao: item.description, dataRefeicao: selectedDate }),
            });
            const id = `api-meal-${saved.id}`;
            setMeals(old => [...old, {
                id, apiId: saved.id, title: saved.nome, description: saved.descricao || '',
                dateRefeicao: saved.dataRefeicao, time: '--:--',
                calories: `${item.foods.reduce((n, f) => n + f.calories, 0)} kcal`,
                image: fallbackImage, components: item.foods.map((f, i) => ({ ...f, id: `${id}-${i}` })),
            }]);
            setActiveTab('Hoje');
            setSearch('');
        } catch (error) {
            setFoodApiError(error.message || 'Não foi possível adicionar a sugestão no servidor.');
        }
    }
    async function ensureApiMeal(meal) {
        if (meal.apiId) return meal;
        const saved = await apiRequest('/api/v1/refeicoes', {
            method: 'POST',
            body: JSON.stringify({ nome: meal.title, descricao: meal.description || null, dataRefeicao: selectedDate }),
        });
        const upgraded = { ...meal, id: `api-meal-${saved.id}`, apiId: saved.id, dateRefeicao: saved.dataRefeicao };
        setMeals(old => old.map(item => item.id === meal.id ? upgraded : item));
        setActiveMealId(upgraded.id);
        return upgraded;
    }
    function historyDate(offset) { const d = new Date(`${selectedDate}T12:00:00`); d.setDate(d.getDate() + offset); return localISODate(d); }
    function openDetails(meal) {
        setActiveMealId(meal.id);
        const records = apiFoodRecords.filter(record => {
            if (meal.apiId) return Number(record.refeicaoId) === Number(meal.apiId);
            // Compatibilidade temporária com registros antigos sem refeicaoId.
            return !record.refeicaoId && record.tipoRefeicao === meal.title &&
                String(record.dataHora || '').slice(0, 10) === selectedDate;
        });
        setActiveComponents(records.length ? records.map(record => ({
            id: `api-${record.id}`, apiId: record.id, name: record.nomeAlimento,
            portion: `${record.quantidade} porção(ões)`, quantity: Number(record.quantidade) > 0 ? Number(record.quantidade) : 1,
            calories: Number(record.calorias) || 0,
            baseCalories: (Number(record.calorias) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            carbs: Number(record.carboidratos) || 0,
            baseCarbs: (Number(record.carboidratos) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            proteins: Number(record.proteinas) || 0,
            baseProteins: (Number(record.proteinas) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            fats: Number(record.gorduras) || 0,
            baseFats: (Number(record.gorduras) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            fiber: Number(record.fibras) || 0,
            baseFiber: (Number(record.fibras) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            sodium: Number(record.sodio) || 0,
            baseSodium: (Number(record.sodio) || 0) / (Number(record.quantidade) > 0 ? Number(record.quantidade) : 1),
            emoji: '🍽️',
        })) : (meal.components || []).map(item => {
            const quantity = Number(item.quantity) > 0 ? Number(item.quantity) : 1;
            const calories = Number(item.calories) || 0;
            return { ...item, quantity, baseCalories: Number(item.baseCalories) || calories / quantity };
        }));
        setFoodSearch('');
        setFoodApiError('');
    }
    async function saveComponents() {
        let meal = meals.find(item => item.id === activeMealId);
        if (!meal) return;
        setFoodApiError('');
        const componentsToSave = activeComponents;
        const total = componentsToSave.reduce((sum, food) => sum + (Number(food.calories) || 0), 0);
        setFoodApiSaving(true);
        try {
            meal = await ensureApiMeal(meal);
            const existing = apiFoodRecords.filter(record =>
                Number(record.refeicaoId) === Number(meal.apiId)
            );
            const created = [];
            for (const food of componentsToSave) {
                const record = await apiRequest('/api/v1/registros-alimentacao', {
                    method: 'POST',
                    body: JSON.stringify(toApiFoodRecord(food, meal.title, selectedDate, meal.apiId)),
                });
                created.push(record);
            }
            // Só remove os registros antigos desta refeição depois de criar os novos.
            await Promise.all(existing.map(record => apiRequest(
                `/api/v1/registros-alimentacao/${record.id}`, { method: 'DELETE' }
            )));
            setApiFoodRecords(old => [
                ...old.filter(record => !existing.some(item => item.id === record.id)),
                ...created,
            ]);
            setMeals(old => old.map(item => item.id === meal.id
                ? { ...item, components: componentsToSave, calories: `${total} kcal` }
                : item));
            setActiveMealId(null);
        } catch (error) {
            setFoodApiError(error.message || 'Não foi possível sincronizar a refeição com o servidor.');
        } finally {
            setFoodApiSaving(false);
        }
    }
    function addFood(food) {
        const baseCalories = Number(food.calories) || 0;
        setActiveComponents(old => [...old, {
                ...food,
                quantity: 1,
                baseCalories,
                calories: baseCalories,
                id: `food-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            }]);
    }
    function updateFoodQuantity(index, value) {
        const quantity = Number(value);
        if (!Number.isFinite(quantity) || quantity <= 0)
            return;
        setActiveComponents(old => old.map((food, i) => {
            if (i !== index)
                return food;
            const baseCalories = Number(food.baseCalories ?? food.calories) || 0;
            return { ...food, quantity, baseCalories, calories: Math.round(baseCalories * quantity) };
        }));
    }
    function addCustomFood(event) {
        event.preventDefault();
        if (!customFoodName.trim())
            return;
        addFood({ name: customFoodName.trim(), portion: customFoodPortion.trim() || 'Porção não informada', calories: Number(customFoodCalories) || 0, emoji: '🍽️' });
        setCustomFoodName('');
        setCustomFoodPortion('');
        setCustomFoodCalories('');
    }
    async function confirmRename(event) {
        event.preventDefault();
        const title = renameValue.trim();
        if (!title || !renameTarget) return;
        try {
            let updated = null;
            if (renameTarget.apiId) {
                updated = await apiRequest(`/api/v1/refeicoes/${renameTarget.apiId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        nome: title,
                        descricao: renameTarget.description || null,
                        dataRefeicao: renameTarget.dateRefeicao || selectedDate,
                    }),
                });
            }
            setMeals(old => old.map(meal => meal.id === renameTarget.id
                ? { ...meal, title: updated?.nome || title, description: updated?.descricao ?? meal.description }
                : meal));
            setRenameTarget(null);
        } catch (error) {
            setFoodApiError(error.message || 'Não foi possível renomear a refeição.');
        }
    }
    async function confirmRemove() {
        if (!removeTarget) return;
        const mealToRemove = removeTarget;
        setFoodApiError('');
        try {
            if (mealToRemove.apiId) {
                // A API remove a refeição e apenas os registros vinculados pelo refeicaoId.
                await apiRequest(`/api/v1/refeicoes/${mealToRemove.apiId}`, { method: 'DELETE' });
                setApiFoodRecords(old => old.filter(record =>
                    Number(record.refeicaoId) !== Number(mealToRemove.apiId)
                ));
            }
            // Refeições locais antigas não possuem ID no servidor; não apagamos registros
            // antigos por nome/data porque isso poderia atingir outra refeição.
            setMeals(old => old.filter(meal => meal.id !== mealToRemove.id));
            setProgress(old => {
                const next = { ...old };
                delete next[mealToRemove.id];
                return next;
            });
            if (activeMealId === mealToRemove.id) setActiveMealId(null);
            setRemoveTarget(null);
        } catch (error) {
            setFoodApiError(error.message || 'Não foi possível excluir a refeição no servidor.');
            console.error('Erro ao excluir refeição:', error);
        }
    }
    return <div className="app-shell">
    <aside className="sidebar" aria-label="Navegação principal">
      <a className="brand" href="#inicio" aria-label="SmartCarbo - Início"><img src="/smartinho.png" alt="SmartCarbo — Disciplina nutre resultados" className="brand__logo"/></a>
      <nav className="sidebar__nav">
        <a className={`sidebar__item ${activePage === "Início" ? "sidebar__item--active" : ""}`} href="#inicio" onClick={e => { e.preventDefault(); setActivePage("Início"); setSearch(""); setNotificationsOpen(false); }}><Icon><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></Icon><span>Início</span></a>
        <a className={`sidebar__item ${activePage === "Refeições" ? "sidebar__item--active" : ""}`} href="#refeicoes" onClick={e => { e.preventDefault(); setActivePage("Refeições"); }}><Icon><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></Icon><span>Refeições</span></a>
        <a className={`sidebar__item ${activePage === "Evolução" ? "sidebar__item--active" : ""}`} href="#evolucao" onClick={e => { e.preventDefault(); setActivePage("Evolução"); setSearch(""); setNotificationsOpen(false); }}><Icon><path d="M3 20h18M5 16l5-5 4 3 6-8M15 6h5v5"/></Icon><span>Evolução</span></a>
        <a className={`sidebar__item ${activePage === "Comunidade" ? "sidebar__item--active" : ""}`} href="#comunidade" onClick={e => { e.preventDefault(); setActivePage('Comunidade'); setSearch(''); setNotificationsOpen(false); }}><Icon><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2zM16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2h-4"/></Icon><span>Comunidade</span></a>
        <a className={`sidebar__item ${activePage === "Perfil" ? "sidebar__item--active" : ""}`} href="#perfil" onClick={e => { e.preventDefault(); setActivePage("Perfil"); setNotificationsOpen(false); }}><Icon><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></Icon><span>Perfil</span></a>
      </nav>
      <button type="button" className="sidebar__item sidebar__logout" onClick={() => setLogoutConfirmOpen(true)}><Icon><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></Icon><span>Sair</span></button>
    </aside>


    {logoutConfirmOpen && <div className="logout-confirm-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget)
            setLogoutConfirmOpen(false); }}>
      <section className="logout-confirm-card" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
        <button className="logout-confirm-close" type="button" aria-label="Fechar" onClick={() => setLogoutConfirmOpen(false)}>×</button>
        <div className="logout-confirm-icon"><Icon><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></Icon></div>
        <span className="logout-confirm-eyebrow">SMARTCARBO</span>
        <h2 id="logout-confirm-title">Já vai sair?</h2>
        <p>Tem certeza de que deseja sair da sua conta? Seus registros salvos neste navegador continuarão aqui quando você voltar.</p>
        <div className="logout-confirm-actions">
          <button type="button" className="logout-stay-button" onClick={() => setLogoutConfirmOpen(false)}>Continuar no SmartCarbo</button>
          <button type="button" className="logout-leave-button" onClick={() => { localStorage.removeItem('smartcarbo-auth'); localStorage.removeItem('token'); localStorage.removeItem('smartcarbo-token'); localStorage.removeItem('smartcarbo-session'); localStorage.removeItem('smartcarbo-ultima-pagina'); setLogoutConfirmOpen(false); navigate('/login', { replace: true }); }}>Sim, quero sair</button>
        </div>
      </section>
    </div>}

    <main className={`main ${activePage === 'Perfil' ? 'main--profile' : activePage === 'Evolução' ? 'main--evolution' : activePage === 'Início' ? 'main--home' : activePage === 'Comunidade' ? 'main--community' : ''}`} id="refeicoes">
      <header className="topbar"><div className="topbar__spacer"/><div className="search-wrap"><label className="search"><Icon><circle cx="10.8" cy="10.8" r="6.5"/><path d="m16 16 4.5 4.5"/></Icon><input type="search" placeholder={activePage === 'Perfil' ? 'Buscar no perfil...' : activePage === 'Evolução' ? 'Buscar na evolução...' : activePage === 'Início' ? 'Buscar alimentos, refeições...' : 'Buscar refeições...'} aria-label={activePage === 'Perfil' ? 'Buscar informações do perfil' : activePage === 'Evolução' ? 'Buscar na evolução' : 'Buscar refeições'} autoComplete="off" value={search} onChange={e => setSearch(e.target.value)}/></label>{activePage === 'Perfil' && search.trim() && <div className="profile-search-results">{(() => { const q = search.trim().toLocaleLowerCase('pt-BR'); const entries = [{ tab: 'Dados pessoais', title: 'Nome completo', keywords: 'nome completo mariana' }, { tab: 'Dados pessoais', title: 'E-mail', keywords: 'email e-mail endereço eletrônico' }, { tab: 'Dados pessoais', title: 'Sexo', keywords: 'sexo gênero' }, { tab: 'Dados pessoais', title: 'Altura', keywords: 'altura cm' }, { tab: 'Dados pessoais', title: 'Data de nascimento', keywords: 'data nascimento aniversário idade' }, { tab: 'Dados pessoais', title: 'Peso', keywords: 'peso kg' }, { tab: 'Objetivos', title: 'Objetivos alimentares', keywords: 'objetivo objetivos meta metas' }, { tab: 'Preferências', title: 'Preferências alimentares', keywords: 'preferência preferencias alimentar vegetariana vegana lactose glúten' }, { tab: 'Configurações', title: 'Configurações e notificações', keywords: 'configuração configuracoes notificações privacidade' }]; const matches = entries.filter(item => (item.title + ' ' + item.keywords).toLocaleLowerCase('pt-BR').includes(q)); return matches.length ? matches.map(item => <button key={item.title} type="button" className="profile-search-result" onClick={() => { setProfileTab(item.tab); setProfileEditing(false); setSearch(''); }}><span>{item.title}</span><small>{item.tab}</small></button>) : <p className="profile-search-empty">Nenhuma informação do perfil encontrada.</p>; })()}</div>}</div><div className="notification-wrap"><button className={`icon-button notification ${notificationsOpen ? 'notification--open' : ''}`} aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(v => !v)}><Icon><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></Icon><i /></button>{notificationsOpen && <div className="notification-popover"><div className="notification-popover__head"><strong>Notificações</strong><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Fechar notificações">×</button></div><div className="notification-item"><span className="notification-item__icon">✓</span><div><strong>Seu espaço está pronto</strong><p>Registre suas refeições para acompanhar sua rotina.</p></div></div><div className="notification-item"><span className="notification-item__icon">✦</span><div><strong>Uma dica para hoje</strong><p>Explore a página Sugestões para encontrar ideias de refeições.</p></div></div></div>}</div><button type="button" className="user-chip" onClick={() => { setActivePage('Perfil'); setNotificationsOpen(false); }} aria-label="Abrir meu perfil"><span className="user-chip__avatar">{(profileName.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2) || 'SC').toUpperCase()}</span><span className="user-chip__copy"><strong>Olá, {profileName}</strong><small>Plano Gratuito</small></span></button></header>
      {activePage === 'Início' && <HomeDashboard profileName={profileName} meals={meals} progress={readJSON(progressKey(localISODate()), {})} waterMl={waterMl} waterLoading={waterLoading} waterError={waterError} onAddWater={addWaterRecord} onUndoWater={undoLastWaterRecord} setActivePage={setActivePage} calorieGoal={calorieGoal} calorieGoalLoading={calorieGoalLoading} calorieGoalMessage={calorieGoalMessage}/>}
      {activePage === 'Evolução' && <EvolucaoIntegrada profileName={profileName} searchTerm={search}/>}
      {activePage === 'Comunidade' && <Community profileName={profileName} searchTerm={search}/>}

      <section className="profile-page">
    <div className="profile-heading"><h1>Meu perfil</h1><p>Gerencie suas informações e preferências.</p></div>
    <div className="profile-tabs" role="tablist" aria-label="Seções do perfil">{['Dados pessoais', 'Objetivos', 'Preferências', 'Configurações'].map(tab => <button key={tab} type="button" role="tab" aria-selected={profileTab === tab} className={`profile-tab ${profileTab === tab ? 'profile-tab--active' : ''}`} onClick={() => { setProfileTab(tab); setProfileSaved(false); }}>{tab}</button>)}</div>
    <form className="profile-form" onSubmit={handleProfileSubmit}>
    <div className="profile-form__heading"><div className="profile-avatar-wrap"><div className="profile-avatar-large">{(profileName.trim().split(/\s+/).map(x => x[0]).join('').slice(0, 2) || 'SC').toUpperCase()}</div><span className="profile-camera">◎</span></div><div className="profile-form__heading-copy"><span className="profile-plan">Plano Gratuito</span><h2>{profileName || 'Seu nome'}</h2><p>{profileEmail}</p></div><button type="button" className="profile-edit-button" onClick={() => { setProfileEditing(v => !v); setProfileSaved(false); }}>{profileEditing ? 'Cancelar edição' : '✎ Editar informações'}</button></div>
    {profileTab === 'Dados pessoais' && <div className="profile-panel"><div className="profile-panel-title"><h2>Dados pessoais</h2><p>Informações básicas da sua conta.</p></div><div className="profile-fields"><label>Nome completo<input disabled={!profileEditing} value={profileName} onChange={e => setProfileName(e.target.value)} required maxLength={80}/></label><label>Sexo<select disabled={!profileEditing} value={profileGender} onChange={e => setProfileGender(e.target.value)}><option value="">Selecione</option><option>Feminino</option><option>Masculino</option><option>Prefiro não informar</option><option>Outro</option></select></label><label>E-mail<input disabled={!profileEditing} type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} required/></label><label>Altura (cm)<input disabled={!profileEditing} type="number" min="1" max="300" value={profileHeight} onChange={e => setProfileHeight(e.target.value)} placeholder="Ex.: 165"/></label><label>Data de nascimento<input disabled={!profileEditing} type="date" value={profileBirth} onChange={e => setProfileBirth(e.target.value)}/></label><label>Peso (kg)<input disabled={!profileEditing} type="number" min="1" max="500" step=".1" value={profileWeight} onChange={e => setProfileWeight(e.target.value)} placeholder="Ex.: 60"/></label></div></div>}
    {profileTab === 'Objetivos' && <div className="profile-panel"><div className="profile-panel-title"><h2>Objetivos</h2><p>O que você quer priorizar?</p></div><div className="profile-fields profile-fields--single"><label>Objetivo principal<select disabled={!profileEditing} value={profileGoal} onChange={e => setProfileGoal(e.target.value)}><option value="perder-peso">Perder peso</option><option value="ganhar-peso">Ganhar peso</option><option value="ganhar-massa-muscular">Ganhar massa muscular</option><option value="melhorar-alimentacao">Melhorar minha alimentação</option><option value="manter-peso">Manter meu peso e saúde geral</option></select></label><p className="profile-tip">Escolha o objetivo que melhor representa o que você quer priorizar. As estimativas são informativas e não substituem orientação nutricional.</p></div></div>}
    {profileTab === 'Preferências' && <div className="profile-panel"><div className="profile-panel-title"><h2>Preferências e saúde</h2><p>Informações usadas para personalizar sua experiência.</p></div><div className="profile-fields"><label>Preferência alimentar<select disabled={!profileEditing} value={profileFoodPreference} onChange={e => setProfileFoodPreference(e.target.value)}><option>Sem preferência específica</option><option>Vegetariana</option><option>Vegana</option><option>Sem lactose</option><option>Sem glúten</option></select></label><label>Nível de atividade<select disabled={!profileEditing} value={profileActivity} onChange={e => setProfileActivity(e.target.value)}><option value="">Selecione</option><option value="SEDENTARIO">Sedentário</option><option value="LEVE">Leve</option><option value="MODERADO">Moderado</option><option value="INTENSO">Intenso</option><option value="MUITO_INTENSO">Muito intenso</option></select></label><label>Restrições alimentares<input disabled={!profileEditing} value={profileRestrictions} onChange={e => setProfileRestrictions(e.target.value)} maxLength={250} placeholder="Ex.: lactose, glúten" /></label><label>Condição de saúde<input disabled={!profileEditing} value={profileHealthCondition} onChange={e => setProfileHealthCondition(e.target.value)} maxLength={250} placeholder="Se desejar informar" /></label><label>Avaliação alimentar (1 a 10)<input disabled={!profileEditing} type="number" min="1" max="10" step="1" value={profileFoodAssessment} onChange={e => setProfileFoodAssessment(e.target.value)} placeholder="Ex.: 7" /></label></div><p className="profile-tip">A preferência alimentar e as notificações locais não são enviadas ao backend, a menos que exista um campo correspondente na API.</p></div>}
    {profileTab === 'Configurações' && <div className="profile-panel"><div className="profile-panel-title"><h2>Configurações</h2><p>Controle as opções do aplicativo.</p></div><label className="profile-toggle"><span><strong>Notificações no aplicativo</strong><small>Receber avisos e dicas no sininho.</small></span><input type="checkbox" disabled={!profileEditing} checked={profileNotifications} onChange={e => setProfileNotifications(e.target.checked)}/></label><p className="profile-tip">Os dados desta página são salvos somente neste navegador.</p></div>}
    <div className="profile-form__footer">{profileError && <span className="profile-error" role="alert">{profileError}</span>}{profileSaved && <span className="profile-saved">✓ Alterações salvas na sua conta</span>}{profileEditing && <button type="submit" className="primary-button" disabled={profileSaving}>{profileSaving ? 'Salvando...' : 'Salvar alterações'}</button>}</div></form>
    </section>
      <section className="page-heading"><div><h1>Refeições</h1><p>Registre e acompanhe suas refeições diárias.</p></div><label className="date-picker"><Icon><rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M7.5 3v4M16.5 3v4M4 9h16M8 13h3M8 16h3"/></Icon><span>{formatDate(selectedDate)}</span><input className="date-picker__input" type="date" aria-label="Selecionar data das refeições" value={selectedDate} onChange={e => e.target.value && setSelectedDate(e.target.value)}/><Icon><path d="m7 10 5 5 5-5"/></Icon></label></section>
      <section className="meal-toolbar"><div className="tabs" role="tablist" aria-label="Visualização de refeições">{['Hoje', 'Histórico', 'Sugestões'].map(tab => <button key={tab} className={`tabs__item ${activeTab === tab ? 'tabs__item--active' : ''}`} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div><button className="primary-button" type="button" onClick={() => { setMealName(''); setMealDescription(''); setMealError(''); setMealDialog(true); }}><Icon><path d="M12 5v14M5 12h14"/></Icon>Adicionar refeição</button></section>
      {activeTab === 'Sugestões' ? <section className="suggestions-page">
        <div className="feature-banner"><div><span className="section-eyebrow">IDEIAS PARA SUA ROTINA</span><h2>O que vamos comer hoje?</h2><p>Inspirações simples para variar suas refeições. Você pode adicionar uma sugestão e personalizar os alimentos depois.</p></div><span className="feature-banner__emoji">✦</span></div>
        <div className="section-title-row"><div><h2>Ideias de refeições</h2><p>Valores aproximados, apenas para referência.</p></div></div>
        <div className="suggestion-grid">{suggestions.map((item, i) => <article className="suggestion-card" key={item.title}><div className={`suggestion-card__art suggestion-card__art--${i + 1}`}><span>{['🥣', '🍛', '🍌', '🍠'][i]}</span><small>{item.category}</small></div><div className="suggestion-card__body"><h3>{item.title}</h3><p>{item.description}</p><div className="suggestion-card__foods">{item.foods.map(food => <span key={food.name}>{food.emoji} {food.name}</span>)}</div><strong className="suggestion-card__calories">~{item.foods.reduce((n, f) => n + f.calories, 0)} kcal <small>estimadas</small></strong><button className="primary-button suggestion-add" type="button" onClick={() => addSuggestion(item)}>＋ Adicionar às refeições</button></div></article>)}</div><p className="suggestions-note">Sugestões gerais de alimentação; não substituem orientação individual de nutricionista.</p>
      </section> : activeTab === 'Histórico' ? <section className="history-page">
        <div className="history-summary"><div><span className="section-eyebrow">SEU CAMINHO, DIA APÓS DIA</span><h2>Histórico de refeições</h2><p>Escolha uma data e consulte o que foi marcado como concluído.</p></div><label className="history-date"><span>Consultar data</span><input type="date" value={selectedDate} onChange={e => e.target.value && setSelectedDate(e.target.value)}/></label></div>
        {(() => { const daily = readJSON(progressKey(selectedDate), {}); const done = meals.filter(m => daily[m.id]); const kcal = done.reduce((n, m) => n + (Number.parseInt(m.calories, 10) || 0), 0); return <><div className="history-stats"><article className="history-stat"><span>Refeições concluídas</span><strong>{done.length}<small> / {meals.length}</small></strong><p>no dia selecionado</p></article><article className="history-stat"><span>Calorias registradas</span><strong>{kcal}<small> kcal</small></strong><p>das refeições concluídas</p></article><article className="history-stat"><span>Data consultada</span><strong className="history-stat__date">{selectedDate.split('-').reverse().join('/')}</strong><p>{formatDate(selectedDate)}</p></article></div><div className="history-list-panel"><div className="section-title-row"><div><h2>Últimos 7 dias</h2><p>Toque em um dia para consultar os registros.</p></div></div><div className="history-days">{Array.from({ length: 7 }, (_, i) => historyDate(i - 6)).map(date => { const dp = readJSON(progressKey(date), {}); const completed = meals.filter(m => dp[m.id]); const total = completed.reduce((n, m) => n + (Number.parseInt(m.calories, 10) || 0), 0); return <button type="button" key={date} className={`history-day ${date === selectedDate ? 'history-day--selected' : ''}`} onClick={() => setSelectedDate(date)}><span>{date.slice(8, 10)}</span><small>{monthNames[Number(date.slice(5, 7)) - 1].slice(0, 3)}</small><i className={`history-day__dot ${completed.length ? 'history-day__dot--filled' : ''}`}/><strong>{total}<small> kcal</small></strong></button>; })}</div><div className="history-records"><h3>Registro de {formatDate(selectedDate)}</h3>{meals.length === 0 ? <p className="meal-list__empty">Você ainda não cadastrou refeições. Vá para Hoje para começar.</p> : meals.map(meal => { const checked = Boolean(daily[meal.id]); return <article className="history-record" key={meal.id}><span className={`history-record__status ${checked ? 'history-record__status--done' : ''}`}>{checked ? '✓' : '○'}</span><div><strong>{meal.title}</strong><p>{meal.description || 'Sem descrição'}</p></div><span className="history-record__kcal">{meal.calories || '0 kcal'}</span><span className={`history-record__label ${checked ? 'history-record__label--done' : ''}`}>{checked ? 'Concluída' : 'Não concluída'}</span></article>; })}</div></div></>; })()}
      </section> : visibleMeals.length === 0 ? <p className="meal-list__empty">{search ? 'Nenhuma refeição encontrada.' : 'Nenhuma refeição cadastrada. Adicione sua primeira refeição para começar.'}</p> : <section className="meal-list" aria-label="Refeições cadastradas">{visibleMeals.map(meal => <article key={meal.id} className="meal-card" tabIndex="0" role="button" aria-label={`Abrir ${meal.title} e adicionar alimentos`} onClick={() => openDetails(meal)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openDetails(meal);
        } }}><img className="meal-card__image" src={meal.image || fallbackImage} alt={meal.title} onError={e => { e.currentTarget.src = fallbackImage; }}/><div className="meal-card__content"><div className="meal-card__title-line"><h2>{meal.title}</h2><time>{meal.time || '--:--'}</time></div><p>{meal.description || 'Sem descrição'}</p><strong className="meal-card__calories">{meal.calories || '0 kcal'}</strong></div><label className="meal-check" onClick={e => e.stopPropagation()} aria-label={`Marcar ${meal.title} como concluída`}><input type="checkbox" checked={Boolean(progress[meal.id])} onChange={e => toggleComplete(meal.id, e.target.checked)}/><span /></label><button className="more-button" type="button" aria-label={`Mais opções para ${meal.title}`} aria-expanded={menuId === meal.id} onClick={e => { e.stopPropagation(); setMenuId(menuId === meal.id ? null : meal.id); }}>···</button>{menuId === meal.id && <div className="meal-actions-menu" role="menu" onClick={e => e.stopPropagation()}><button className="meal-actions-menu__item" role="menuitem" onClick={() => { setRenameTarget(meal); setRenameValue(meal.title); setMenuId(null); }}>Renomear refeição</button><button className="meal-actions-menu__item meal-actions-menu__item--danger" role="menuitem" onClick={() => { setRemoveTarget(meal); setMenuId(null); }}>Retirar refeição</button></div>}</article>)}</section>}
    </main>

    <dialog className="meal-dialog" ref={mealDialogRef} onClick={e => { if (e.target === mealDialogRef.current)
        setMealDialog(false); }}><form className="meal-form" onSubmit={createMeal}><div className="meal-form__header"><div><h2>Adicionar refeição</h2><p>Adicione à sua rotina alimentar compartilhada.</p></div><button className="meal-form__close" type="button" aria-label="Fechar" onClick={() => setMealDialog(false)}>×</button></div><label className="form-field"><span>Nome da refeição *</span><input autoFocus name="title" required maxLength="60" placeholder="Ex.: Café da manhã" value={mealName} onChange={e => setMealName(e.target.value)}/></label><label className="form-field"><span>Descrição (opcional)</span><input name="description" maxLength="120" placeholder="Ex.: Primeira refeição do dia" value={mealDescription} onChange={e => setMealDescription(e.target.value)}/></label>{mealError && <p className="meal-form__error">{mealError}</p>}<div className="meal-form__actions"><button className="secondary-button" type="button" onClick={() => setMealDialog(false)}>Cancelar</button><button className="primary-button" type="submit">Salvar refeição</button></div></form></dialog>

    <dialog className="detail-dialog" ref={detailDialogRef} onClick={e => { if (e.target === detailDialogRef.current)
        setActiveMealId(null); }}><div className="detail-page"><header className="detail-header"><button className="detail-back" type="button" onClick={() => setActiveMealId(null)} aria-label="Voltar">←</button><div className="detail-heading"><h2 id="detail-title">{activeMeal?.title || 'Adicionar componentes'}</h2><p>{activeMeal?.description || 'Monte sua refeição adicionando os alimentos.'}</p></div><button className="meal-form__close" type="button" onClick={() => setActiveMealId(null)} aria-label="Fechar">×</button></header><div className="detail-columns"><section className="food-browser"><div className="food-tabs"><span className="food-tab food-tab--active">Buscar alimentos</span><span className="food-tab">Meus alimentos</span><span className="food-tab">Escanear (IA)</span></div><label className="food-search"><span>⌕</span><input type="search" placeholder="Buscar alimento (ex.: arroz, banana, frango...)" value={foodSearch} onChange={e => setFoodSearch(e.target.value)}/></label><h3>Resultados</h3><div className="food-results">{foodResults.length ? foodResults.map(food => <div className="food-result" key={food.name}><span className="food-emoji">{food.emoji}</span><div className="food-result__copy"><strong>{food.name}</strong><small>{food.portion}</small></div><span className="food-kcal">{food.calories} kcal</span><button className="food-add" type="button" onClick={() => addFood(food)}>+</button></div>) : <p className="food-no-results">Nenhum alimento encontrado. Você pode adicioná-lo abaixo.</p>}</div><form className="custom-food-form" onSubmit={addCustomFood}><h3>Adicionar outro alimento</h3><div className="custom-food-fields"><input required maxLength="70" placeholder="Nome do alimento" value={customFoodName} onChange={e => setCustomFoodName(e.target.value)}/><input maxLength="40" placeholder="Porção (ex.: 1 unidade)" value={customFoodPortion} onChange={e => setCustomFoodPortion(e.target.value)}/><input type="number" min="0" max="10000" placeholder="kcal" value={customFoodCalories} onChange={e => setCustomFoodCalories(e.target.value)}/></div><button className="secondary-button" type="submit">+ Adicionar alimento personalizado</button></form></section><aside className="selected-foods"><div className="selected-foods__top"><h3>Itens adicionados ({activeComponents.length})</h3><button type="button" onClick={() => setActiveComponents([])}>Limpar tudo</button></div><div className="selected-food-list">{activeComponents.map((food, index) => <div className="selected-food" key={food.id || `${food.name}-${index}`}><span className="food-emoji">{food.emoji || '🍽️'}</span><div className="selected-food__copy"><strong>{food.name}</strong><small>{food.portion || 'Porção não informada'}</small><label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.85rem' }}>Quantidade <input aria-label={`Quantidade de ${food.name}`} type="number" min="0.1" max="1000" step="0.1" value={food.quantity ?? 1} onChange={e => updateFoodQuantity(index, e.target.value)} style={{ width: '76px', padding: '5px 7px', border: '1px solid #d8ded7', borderRadius: '8px' }}/></label><small>{Number(food.calories) || 0} kcal no total</small></div><button className="food-remove" type="button" aria-label={`Remover ${food.name}`} onClick={() => setActiveComponents(old => old.filter((_, i) => i !== index))}>×</button></div>)}</div><div className="food-total">Total: <strong>{foodTotal} kcal</strong></div>{foodApiError && <p className="meal-form__error" role="alert">{foodApiError}</p>}<button className="primary-button detail-save" type="button" onClick={saveComponents} disabled={foodApiSaving}>{foodApiSaving ? 'Salvando...' : 'Salvar refeição'}</button></aside></div></div></dialog>

    <dialog className="rename-dialog" ref={renameDialogRef} onClick={e => { if (e.target === renameDialogRef.current)
        setRenameTarget(null); }}><form className="rename-form" onSubmit={confirmRename}><div className="rename-hero"><span className="rename-hero__icon">✎</span><button type="button" className="rename-close" onClick={() => setRenameTarget(null)} aria-label="Fechar">×</button></div><p className="rename-eyebrow">ORGANIZE SUAS REFEIÇÕES</p><h2 id="rename-title">Como vamos chamar?</h2><p className="rename-description">Dê um nome fácil de reconhecer para esta refeição.</p><label className="rename-label" htmlFor="rename-input">Nome da refeição</label><input id="rename-input" className="rename-input" type="text" maxLength="60" required autoComplete="off" placeholder="Ex.: Café da manhã" value={renameValue} onChange={e => setRenameValue(e.target.value)}/><p className="rename-hint">✦ Você pode mudar esse nome quando quiser.</p><div className="rename-actions"><button type="button" className="rename-cancel" onClick={() => setRenameTarget(null)}>Cancelar</button><button type="submit" className="rename-confirm">✓ Salvar nome</button></div></form></dialog>

    <dialog className="remove-dialog" ref={removeDialogRef} onClick={e => { if (e.target === removeDialogRef.current)
        setRemoveTarget(null); }}><div className="remove-dialog__content"><div className="remove-dialog__top"><div className="remove-dialog__icon">!</div><button type="button" className="remove-dialog__close" onClick={() => setRemoveTarget(null)} aria-label="Fechar">×</button></div><p className="remove-dialog__eyebrow">GERENCIAR REFEIÇÃO</p><h2 id="remove-title">Retirar esta refeição?</h2><p className="remove-dialog__description">Você está prestes a retirar <strong>“{removeTarget?.title || 'esta refeição'}”</strong> da sua rotina compartilhada. Essa ação não pode ser desfeita.</p><div className="remove-dialog__actions"><button type="button" className="remove-dialog__cancel" onClick={() => setRemoveTarget(null)}>Manter refeição</button><button type="button" className="remove-dialog__confirm" onClick={confirmRemove}>⌫ Retirar refeição</button></div></div></dialog>
  </div>;
}