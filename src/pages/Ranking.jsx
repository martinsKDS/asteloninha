import { useMemo, useState } from 'react';
import './Ranking.css';

const STORAGE_KEY = 'smartcarbo-ranking-state-v1';
const DEFAULT_PEOPLE = [
  { id: 'ana', name: 'Ana Souza', initials: 'AS', color: '#f2d9c8', points: 980, missions: 7, challenges: 3, streak: 10, badges: ['🥗', '💧'], followed: true },
  { id: 'gabriel', name: 'Gabriel M.', initials: 'GM', color: '#d8e7f0', points: 1250, missions: 12, challenges: 5, streak: 18, badges: ['🏃', '🏅'], followed: true },
  { id: 'lucas', name: 'Lucas R.', initials: 'LR', color: '#f2d9c8', points: 860, missions: 9, challenges: 4, streak: 8, badges: ['💪', '💧'], followed: true },
  { id: 'juliana', name: 'Juliana R.', initials: 'JR', color: '#eadcf4', points: 780, missions: 7, challenges: 3, streak: 10, badges: ['🥗', '🔥'], followed: true },
  { id: 'matheus', name: 'Matheus S.', initials: 'MS', color: '#d8e7f0', points: 760, missions: 6, challenges: 2, streak: 8, badges: ['💧', '🏅'], followed: true },
  { id: 'mariana', name: 'Mariana (você)', initials: 'MA', color: '#cde9df', points: 760, missions: 8, challenges: 3, streak: 12, badges: ['🏃', '🥗'], followed: true, isMe: true },
  { id: 'carla', name: 'Carla T.', initials: 'CT', color: '#f4dfe3', points: 690, missions: 5, challenges: 2, streak: 6, badges: ['🔥'], followed: true },
  { id: 'pedro', name: 'Pedro A.', initials: 'PA', color: '#dfe5dc', points: 640, missions: 5, challenges: 1, streak: 5, badges: ['🏅'], followed: true },
  { id: 'fernanda', name: 'Fernanda L.', initials: 'FL', color: '#f0e4cc', points: 580, missions: 4, challenges: 1, streak: 4, badges: ['💧'], followed: true },
];
const MISSIONS = [
  { id: 'meal-day', title: 'Dia registrado', description: 'Registre pelo menos uma refeição hoje.', points: 10, icon: '🥗', type: 'meal' },
  { id: 'three-days', title: 'Diário alimentar', description: 'Registre refeições em 3 dias diferentes.', points: 20, icon: '📅', type: 'days' },
  { id: 'challenge-water', title: 'Desafio hidratação', description: 'Acompanhe sua hidratação durante o dia.', points: 15, icon: '💧', type: 'manual' },
  { id: 'walk', title: 'Movimente-se', description: 'Registre uma caminhada ou atividade física.', points: 20, icon: '👟', type: 'manual' },
];
const PERIODS = [{ value: 'week', label: 'Esta semana' }, { value: 'month', label: 'Este mês' }, { value: 'all', label: 'Histórico geral' }];
function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { points: Number(saved.points) || 0, completed: Array.isArray(saved.completed) ? saved.completed : [], participation: saved.participation !== false, followed: Array.isArray(saved.followed) ? saved.followed : ['ana','gabriel','lucas','juliana','matheus','carla','pedro','fernanda'] };
  } catch { return { points: 0, completed: [], participation: true, followed: ['ana','gabriel','lucas','juliana','matheus','carla','pedro','fernanda'] }; }
}
function saveState(state) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* armazenamento pode estar indisponível */ } }

export default function Ranking({ profileName = 'Mariana', searchTerm = '' }) {
  const [state, setState] = useState(readState);
  const [tab, setTab] = useState('Geral');
  const [period, setPeriod] = useState('month');
  const [showPeople, setShowPeople] = useState(false);
  const [notice, setNotice] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const me = { ...DEFAULT_PEOPLE.find(person => person.isMe), name: `${profileName} (você)`, points: 760 + state.points, followed: true };
  const people = useMemo(() => DEFAULT_PEOPLE.filter(person => !person.isMe).filter(person => state.followed.includes(person.id)).concat(state.participation ? [me] : []).sort((a,b) => b.points-a.points || b.missions-a.missions || b.challenges-a.challenges), [state, profileName]);
  const visiblePeople = useMemo(() => {
    const q = (searchTerm || '').trim().toLocaleLowerCase('pt-BR');
    let result = people;
    if (tab === 'Missões') result = [...result].sort((a,b) => b.missions-a.missions || b.points-a.points);
    if (tab === 'Desafios') result = [...result].sort((a,b) => b.challenges-a.challenges || b.points-a.points);
    if (tab === 'Sequência') result = [...result].sort((a,b) => b.streak-a.streak || b.points-a.points);
    if (q) result = result.filter(p => `${p.name} ${p.points} ${p.missions} ${p.challenges} ${p.streak}`.toLocaleLowerCase('pt-BR').includes(q));
    return result;
  }, [people, tab, searchTerm]);
  const ranked = visiblePeople.map((person, index) => ({ ...person, position: index + 1 }));
  const podium = [...ranked].slice(0, 3).sort((a,b) => ({2:0,1:1,3:2}[a.position] ?? a.position) - ({2:0,1:1,3:2}[b.position] ?? b.position));
  const myRank = ranked.find(person => person.isMe)?.position;
  const totalPoints = me.points;
  const doneMissions = state.completed.length;
  const updateState = (patch) => setState(old => { const next = { ...old, ...patch }; saveState(next); return next; });
  function completeMission(mission) {
    if (state.completed.includes(mission.id)) return;
    const completed = [...state.completed, mission.id];
    updateState({ completed, points: state.points + mission.points });
    setNotice(`Missão concluída! Você ganhou ${mission.points} pontos.`);
    window.setTimeout(() => setNotice(''), 3200);
  }
  function followPerson(person) {
    if (person.isMe) return;
    const followed = state.followed.includes(person.id) ? state.followed.filter(id => id !== person.id) : [...state.followed, person.id];
    updateState({ followed });
    setNotice(followed.includes(person.id) ? `${person.name} adicionado às pessoas que você segue.` : `Você deixou de seguir ${person.name}.`);
    window.setTimeout(() => setNotice(''), 3200);
  }
  const hasPeople = ranked.length > 0;

  return <section className="ranking-page">
    <div className="ranking-heading"><div><span className="ranking-eyebrow">SEU PROGRESSO, SUA JORNADA</span><h1>Ranking</h1><p>Veja quem está se destacando entre seus amigos e pessoas que você segue.</p></div><div className="ranking-heading__actions"><label className="ranking-period"><span>▦</span><select aria-label="Período do ranking" value={period} onChange={e => setPeriod(e.target.value)}>{PERIODS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><button className="ranking-settings-button" type="button" onClick={() => setShowSettings(v => !v)} aria-expanded={showSettings}>⚙ Preferências</button></div></div>
    {showSettings && <div className="ranking-settings"><div><strong>Participar do ranking</strong><p>Quando desativado, sua pontuação deixa de aparecer para outras pessoas.</p></div><label className="ranking-switch"><input type="checkbox" checked={state.participation} onChange={e => updateState({ participation: e.target.checked })}/><span/></label></div>}
    <div className="ranking-tabs" role="tablist" aria-label="Tipo de classificação">{['Geral','Missões','Desafios','Sequência'].map(item => <button key={item} type="button" role="tab" aria-selected={tab===item} className={tab===item?'is-active':''} onClick={() => setTab(item)}>{item}</button>)}</div>
    {!hasPeople ? <div className="ranking-empty"><div className="ranking-empty__art"><span>♧</span><i>+</i></div><h2>Você ainda não segue ninguém</h2><p>Siga amigos e outras pessoas para ver o ranking e se inspirar com a evolução delas.</p><button className="ranking-primary" type="button" onClick={() => setShowPeople(v => !v)}>{showPeople ? 'Fechar sugestões' : 'Encontrar pessoas'}</button>{showPeople && <div className="ranking-discover"><h3>Pessoas para conhecer</h3>{DEFAULT_PEOPLE.filter(p=>!p.isMe).map(person=><div className="ranking-discover__row" key={person.id}><Avatar person={person}/><div><strong>{person.name}</strong><small>{person.missions} missões concluídas</small></div><button type="button" onClick={()=>followPerson(person)}>{state.followed.includes(person.id)?'Seguindo':'Seguir'}</button></div>)}</div>}</div> : <>
      <div className="ranking-layout"><div className="ranking-main-column">
        <section className="ranking-podium-card"><div className="ranking-section-heading"><div><h2>Quem está no topo</h2><p>{PERIODS.find(item=>item.value===period)?.label} · pontuação demonstrativa + suas recompensas</p></div><span className="ranking-trophy">♛</span></div><div className="ranking-podium">{podium.map(person=><button type="button" key={person.id} className={`ranking-podium-person ranking-podium-person--${person.position} ${person.isMe?'is-me':''}`} onClick={()=>setSelectedPerson(person)}><span className="ranking-crown">{person.position===1?'♛':person.position===2?'♜':'♟'}</span><Avatar person={person} large/><strong>{person.name}</strong><small>{person.position}º lugar</small><b>{person.points.toLocaleString('pt-BR')} pts</b></button>)}</div></section>
        <section className="ranking-table-card"><div className="ranking-section-heading"><div><h2>Classificação</h2><p>{ranked.length} participantes visíveis para você</p></div><span className="ranking-lock">♧ Apenas sua rede</span></div><div className="ranking-table-wrap"><table className="ranking-table"><thead><tr><th>#</th><th>Usuário</th><th>Pontos</th><th>Missões</th><th>Desafios</th><th>Sequência</th><th>Conquistas</th><th/></tr></thead><tbody>{ranked.map(person=><tr key={person.id} className={person.isMe?'is-me':''}><td>{person.position}</td><td><button className="ranking-user-cell" type="button" onClick={()=>setSelectedPerson(person)}><Avatar person={person}/><span>{person.name}</span></button></td><td><strong>{person.points.toLocaleString('pt-BR')} pts</strong></td><td>{person.missions}</td><td>{person.challenges}</td><td>{person.streak} dias</td><td><span className="ranking-badges">{person.badges.map((badge,i)=><span key={`${badge}-${i}`} title="Conquista">{badge}</span>)}</span></td><td>{!person.isMe&&<button type="button" className="ranking-more" onClick={()=>setSelectedPerson(person)} aria-label={`Ver perfil de ${person.name}`}>···</button>}</td></tr>)}</tbody></table>{ranked.length===0&&<p className="ranking-no-results">Nenhum resultado para essa pesquisa.</p>}</div></section>
      </div><aside className="ranking-side-column"><section className="ranking-performance"><div className="ranking-section-heading"><div><h2>Meu desempenho</h2><p>Seu resumo no período</p></div><span className="ranking-performance-icon">✦</span></div><div className="ranking-place"><span className="ranking-medal">🏅</span><div><strong>{state.participation && myRank ? `${myRank}º lugar` : 'Fora do ranking'}</strong><small>{state.points ? `+${state.points} pontos ganhos por você` : 'Complete missões para pontuar'}</small></div></div><div className="ranking-metrics"><article><span>⭐</span><strong>{totalPoints.toLocaleString('pt-BR')}</strong><small>Pontos totais</small></article><article><span>◎</span><strong>{doneMissions}</strong><small>Missões concluídas</small></article><article><span>🏆</span><strong>{me.challenges}</strong><small>Desafios</small></article><article><span>🔥</span><strong>{me.streak} dias</strong><small>Maior sequência</small></article></div></section>
        <section className="ranking-missions"><div className="ranking-section-heading"><div><h2>Missões disponíveis</h2><p>Conclua para ganhar pontos</p></div><span className="ranking-mission-count">{MISSIONS.filter(m=>state.completed.includes(m.id)).length}/{MISSIONS.length}</span></div>{MISSIONS.map(mission=>{const completed=state.completed.includes(mission.id);return <article className={`ranking-mission ${completed?'is-completed':''}`} key={mission.id}><span className="ranking-mission__icon">{mission.icon}</span><div className="ranking-mission__copy"><strong>{mission.title}</strong><p>{mission.description}</p><small>+{mission.points} pontos</small></div><button type="button" disabled={completed} onClick={()=>completeMission(mission)}>{completed?'✓':'Concluir'}</button></article>})}<p className="ranking-demo-note">Protótipo: as missões manuais simulam a conclusão. A validação automática será conectada à Alimentação e ao backend posteriormente.</p></section>
        <section className="ranking-how"><span>♧</span><div><strong>Como funciona?</strong><p>Ganhe pontos ao concluir missões. O ranking mostra apenas sua rede, e você pode desativar sua participação nas preferências.</p></div></section>
      </aside></div>
    </>}
    {notice && <div className="ranking-toast" role="status">✓ {notice}</div>}
    {selectedPerson && <div className="ranking-modal-backdrop" role="presentation" onClick={()=>setSelectedPerson(null)}><section className="ranking-person-modal" role="dialog" aria-modal="true" aria-label={`Perfil de ${selectedPerson.name}`} onClick={e=>e.stopPropagation()}><button className="ranking-modal-close" type="button" onClick={()=>setSelectedPerson(null)} aria-label="Fechar">×</button><Avatar person={selectedPerson} large/><h2>{selectedPerson.name}</h2><p>{selectedPerson.isMe?'Esse é o seu desempenho neste protótipo.':'Participante da sua rede SmartCarbo.'}</p><div className="ranking-modal-stats"><span><strong>{selectedPerson.points.toLocaleString('pt-BR')}</strong><small>pontos</small></span><span><strong>{selectedPerson.missions}</strong><small>missões</small></span><span><strong>{selectedPerson.challenges}</strong><small>desafios</small></span></div>{!selectedPerson.isMe&&<button className="ranking-primary" type="button" onClick={()=>followPerson(selectedPerson)}>{state.followed.includes(selectedPerson.id)?'Deixar de seguir':'Seguir pessoa'}</button>}</section></div>}
  </section>;
}
function Avatar({ person, large = false }) { return <span className={`ranking-avatar ${large?'ranking-avatar--large':''}`} style={{ '--avatar-color': person.color }}>{person.initials}</span>; }
