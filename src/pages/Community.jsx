import { useMemo, useState } from 'react';
import './Community.css';

const STORAGE_KEY = 'smartcarbo-ranking-state-v1';
const PEOPLE = [
  { id: 'ana', name: 'Ana Souza', initials: 'AS', color: '#f2d9c8', goal: 'Organizando minha alimentação', points: 980, streak: 10 },
  { id: 'gabriel', name: 'Gabriel M.', initials: 'GM', color: '#d8e7f0', goal: 'Criando hábitos mais saudáveis', points: 1250, streak: 18 },
  { id: 'lucas', name: 'Lucas R.', initials: 'LR', color: '#f2d9c8', goal: 'Acompanhando minha rotina', points: 860, streak: 8 },
  { id: 'juliana', name: 'Juliana R.', initials: 'JR', color: '#eadcf4', goal: 'Pequenas mudanças todos os dias', points: 780, streak: 10 },
  { id: 'matheus', name: 'Matheus S.', initials: 'MS', color: '#d8e7f0', goal: 'Foco na constância', points: 760, streak: 8 },
  { id: 'carla', name: 'Carla T.', initials: 'CT', color: '#f4dfe3', goal: 'Construindo uma rotina equilibrada', points: 690, streak: 6 },
  { id: 'pedro', name: 'Pedro A.', initials: 'PA', color: '#dfe5dc', goal: 'Aprendendo a comer melhor', points: 640, streak: 5 },
  { id: 'fernanda', name: 'Fernanda L.', initials: 'FL', color: '#f0e4cc', goal: 'Uma escolha saudável de cada vez', points: 580, streak: 4 },
];
function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...saved, followed: Array.isArray(saved.followed) ? saved.followed : PEOPLE.map(p => p.id) };
  } catch { return { followed: PEOPLE.map(p => p.id), points: 0, completed: [], participation: true }; }
}
function writeState(next) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* armazenamento indisponível */ } }

export default function Community({ profileName = 'Mariana', searchTerm = '' }) {
  const [network, setNetwork] = useState(readState);
  const [tab, setTab] = useState('Descobrir');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postCategory, setPostCategory] = useState('Conquista do dia');
  const [imageError, setImageError] = useState('');
  const [posts, setPosts] = useState(() => { try { return JSON.parse(localStorage.getItem('smartcarbo-community-posts-v1') || '[]'); } catch { return []; } });
  const followed = useMemo(() => PEOPLE.filter(p => network.followed.includes(p.id)), [network.followed]);
  const filter = `${query} ${searchTerm}`.trim().toLocaleLowerCase('pt-BR');
  const discover = PEOPLE.filter(p => !network.followed.includes(p.id)).filter(p => !filter || `${p.name} ${p.goal}`.toLocaleLowerCase('pt-BR').includes(filter));
  const following = followed.filter(p => !filter || `${p.name} ${p.goal}`.toLocaleLowerCase('pt-BR').includes(filter));
  function toggleFollow(person) {
    const nextFollowed = network.followed.includes(person.id) ? network.followed.filter(id => id !== person.id) : [...network.followed, person.id];
    const next = { ...network, followed: nextFollowed };
    setNetwork(next); writeState(next);
    setNotice(nextFollowed.includes(person.id) ? `Agora você está seguindo ${person.name}.` : `Você deixou de seguir ${person.name}.`);
    window.setTimeout(() => setNotice(''), 2800);
  }
  function publish(event) {
    event.preventDefault();
    const text = postText.trim();
    if (!text && !postImage) return;
    const next = [{ id: `post-${Date.now()}`, author: profileName, text, image: postImage || '', category: postCategory, createdAt: new Date().toISOString(), likes: 0 }, ...posts];
    try {
      localStorage.setItem('smartcarbo-community-posts-v1', JSON.stringify(next));
      setPosts(next); setPostText(''); setPostImage(''); setPostCategory('Conquista do dia'); setImageError('');
    } catch {
      setImageError('Não foi possível salvar a publicação. Tente uma imagem menor.');
      return;
    }
    setTab('Publicações'); setNotice('Publicação salva neste navegador.'); window.setTimeout(() => setNotice(''), 2800);
  }
  function likePost(postId) {
    const next = posts.map(post => post.id === postId ? { ...post, likes: post.likes ? 0 : 1 } : post);
    setPosts(next); try { localStorage.setItem('smartcarbo-community-posts-v1', JSON.stringify(next)); } catch { /* armazenamento indisponível */ }
  }
  function deletePost(postId) {
    const post = posts.find(item => item.id === postId);
    if (!post) return;
    if (!window.confirm('Deseja excluir esta publicação? Essa ação não pode ser desfeita.')) return;
    const next = posts.filter(item => item.id !== postId);
    setPosts(next);
    try { localStorage.setItem('smartcarbo-community-posts-v1', JSON.stringify(next)); } catch { /* armazenamento indisponível */ }
    setNotice('Publicação excluída.');
    window.setTimeout(() => setNotice(''), 2800);
  }
  return <section className="community-page">
    <header className="community-heading"><div><span className="community-eyebrow">CONEXÕES QUE INCENTIVAM</span><h1>Comunidade</h1><p>Encontre pessoas, compartilhe pequenas conquistas e mantenha a motivação.</p></div><div className="community-count"><span>♧</span><div><strong>{followed.length}</strong><small>pessoas seguindo</small></div></div></header>
    <div className="community-hero"><div className="community-hero__icon">✦</div><div><strong>Um passo de cada vez.</strong><p>Compartilhe sua jornada sem precisar expor informações pessoais de saúde.</p></div><span className="community-hero__sparkle">✧</span></div>
    <div className="community-toolbar"><div className="community-tabs" role="tablist" aria-label="Seções da comunidade">{['Descobrir','Seguindo','Publicações'].map(item=><button type="button" role="tab" aria-selected={tab===item} className={tab===item?'is-active':''} key={item} onClick={()=>setTab(item)}>{item}{item==='Seguindo'&&<span>{followed.length}</span>}</button>)}</div><label className="community-search"><span>⌕</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar pessoas..." aria-label="Buscar pessoas"/></label></div>
    {tab === 'Descobrir' && <><div className="community-section-title"><div><h2>Pessoas para conhecer</h2><p>Perfis demonstrativos para testar as conexões neste protótipo.</p></div><span>{discover.length} disponíveis</span></div>{discover.length ? <div className="community-people-grid">{discover.map(person=><PersonCard key={person.id} person={person} followed={false} onToggle={()=>toggleFollow(person)}/>)}</div> : <Empty icon="✓" title={filter?'Nenhuma pessoa encontrada':'Você já segue todas as pessoas sugeridas'} text={filter?'Tente outro nome ou termo de busca.':'Volte mais tarde para descobrir novas conexões.'}/>}</>}
    {tab === 'Seguindo' && <><div className="community-section-title"><div><h2>Sua rede</h2><p>As pessoas que você segue também podem aparecer no Ranking.</p></div><span>{following.length} pessoas</span></div>{following.length ? <div className="community-people-grid">{following.map(person=><PersonCard key={person.id} person={person} followed onToggle={()=>toggleFollow(person)}/>)}</div> : <Empty icon="♧" title="Sua rede está vazia" text="Encontre pessoas para acompanhar suas jornadas e tornar o Ranking mais interessante." action="Encontrar pessoas" onAction={()=>setTab('Descobrir')}/>}</>}
    {tab === 'Publicações' && <div className="community-feed-layout"><div className="community-feed-main"><form className="community-compose" onSubmit={publish}><div className="community-avatar community-avatar--me">{profileName.trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'SC'}</div><div className="community-compose__body"><label htmlFor="community-post">Compartilhe uma pequena conquista</label><textarea id="community-post" maxLength={500} rows={3} placeholder="Ex.: Fiz uma caminhada hoje ou preparei uma refeição gostosa!" value={postText} onChange={e=>setPostText(e.target.value)}/><div className="community-photo-tools"><label className="community-photo-button">▧ Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e=>{const file=e.target.files?.[0];setImageError('');if(!file)return;if(!file.type.startsWith('image/')){setImageError('Escolha um arquivo de imagem.');e.target.value='';return;}if(file.size>3*1024*1024){setImageError('A imagem deve ter no máximo 5 MB.');e.target.value='';return;}const reader=new FileReader();reader.onload=()=>setPostImage(String(reader.result||''));reader.onerror=()=>setImageError('Não foi possível ler essa imagem.');reader.readAsDataURL(file);e.target.value='';}}/></label><label className="community-category-label">Tipo de publicação<select value={postCategory} onChange={e=>setPostCategory(e.target.value)}><option>Conquista do dia</option><option>Atividade física</option><option>Comida do dia</option></select></label></div>{postImage&&<div className="community-image-preview"><img src={postImage} alt="Prévia da publicação"/><button type="button" onClick={()=>setPostImage('')} aria-label="Remover foto">Remover foto ×</button></div>}{imageError&&<p className="community-form-error" role="alert">{imageError}</p>}<div className="community-compose__footer"><small>{postText.length}/500 · Imagem de até 3 MB. Evite compartilhar dados pessoais.</small><button type="submit" disabled={!postText.trim()&&!postImage}>Publicar</button></div></div></form>{posts.length ? posts.map(post=><article className="community-post" key={post.id}><div className="community-post__head"><div className="community-avatar community-avatar--me">{post.author.trim().split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'SC'}</div><div><strong>{post.author}</strong><small>{new Date(post.createdAt).toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'})}</small></div><span className="community-post__tag">Minha publicação</span></div><span className="community-post__category">{post.category || 'Conquista do dia'}</span>{post.text&&<p>{post.text}</p>}{post.image&&<img className="community-post__image" src={post.image} alt={post.category==='Comida do dia'?'Foto de comida compartilhada':post.category==='Atividade física'?'Foto de atividade física compartilhada':'Foto da publicação'} loading="lazy"/>}<div className="community-post__actions"><button type="button" onClick={()=>likePost(post.id)}>{post.likes?'♥ Curtido':'♡ Curtir'}</button><span>{post.likes} curtida(s)</span><button type="button" className="community-post__delete" onClick={()=>deletePost(post.id)} aria-label={`Excluir publicação de ${post.author}`}>Excluir publicação</button></div></article>) : <Empty icon="✎" title="Sua comunidade começa com você" text="Você ainda não publicou nada. Compartilhe uma pequena conquista ou uma dica que tenha ajudado na sua rotina."/>}</div><aside className="community-feed-aside"><span className="community-aside-icon">♧</span><h3>Um espaço de incentivo</h3><p>As publicações ficam salvas somente neste navegador. Ainda não são compartilhadas com outros usuários.</p><button type="button" onClick={()=>setTab('Descobrir')}>Encontrar pessoas →</button></aside></div>}
    <footer className="community-privacy"><span>♧</span><p><strong>Privacidade em primeiro lugar</strong><br/>Esta versão usa dados demonstrativos e armazenamento local. Seguir alguém e publicar não envia dados para outros usuários nem para um servidor.</p></footer>
    {notice&&<div className="community-toast" role="status">✓ {notice}</div>}
  </section>;
}
function PersonCard({ person, followed, onToggle }) { return <article className="community-person-card"><div className="community-person-card__top"><span className="community-avatar" style={{'--person-color':person.color}}>{person.initials}</span><span className="community-person-card__status">{followed?'Na sua rede':'Sugestão'}</span></div><h3>{person.name}</h3><p>{person.goal}</p><div className="community-person-stats"><span><strong>{person.points.toLocaleString('pt-BR')}</strong><small>pontos demonstrativos</small></span><span><strong>{person.streak} dias</strong><small>sequência</small></span></div><button type="button" className={followed?'community-follow-button is-following':'community-follow-button'} onClick={onToggle}>{followed?'✓ Seguindo':'＋ Seguir'}</button></article>; }
function Empty({ icon, title, text, action, onAction }) { return <div className="community-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action&&<button type="button" onClick={onAction}>{action}</button>}</div>; }
