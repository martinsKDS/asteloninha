import { useEffect, useMemo, useState } from 'react';
import './Community.css';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');
const TOKEN_KEY = 'smartcarbo-token';
const PALETTE = ['#f2d9c8', '#d8e7f0', '#eadcf4', '#f4dfe3', '#dfe5dc', '#f0e4cc'];

function initials(name = '') {
  return String(name).trim().split(/\s+/).map((part) => part[0] || '').join('').slice(0, 2).toUpperCase() || 'SC';
}

function normalizePost(post) {
  return {
    id: post.id,
    authorId: post.authorId,
    author: post.author || 'Usuário SmartCarbo',
    text: post.text || '',
    image: post.image || '',
    category: post.category || 'Conquista do dia',
    createdAt: post.createdAt,
    likes: Number(post.likes) || 0,
    likedByMe: Boolean(post.likedByMe),
    mine: Boolean(post.mine),
  };
}

function normalizeProfile(profile, index) {
  const name = profile.name || 'Usuário SmartCarbo';
  return {
    id: profile.id,
    name,
    initials: initials(name),
    color: PALETTE[index % PALETTE.length],
    goal: profile.goal || 'Membro da comunidade SmartCarbo',
    followed: Boolean(profile.followed),
  };
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error('Sua sessão não foi encontrada. Entre novamente no SmartCarbo.');

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error('Não foi possível conectar ao backend. Confira se o Spring Boot está rodando.');
  }

  if (!response.ok) {
    let message = `Erro na API (${response.status}).`;
    try {
      const body = await response.json();
      message = body.erro || body.message || body.mensagem || message;
    } catch { /* Resposta sem JSON. */ }
    if (response.status === 401) message = 'Sua sessão expirou. Entre novamente no SmartCarbo.';
    if (response.status === 403) message = 'Você não tem permissão para executar esta ação.';
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export default function Community({ profileName = 'Usuário', searchTerm = '' }) {
  const [tab, setTab] = useState('Descobrir');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [apiError, setApiError] = useState('');
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [postCategory, setPostCategory] = useState('Conquista do dia');
  const [imageError, setImageError] = useState('');
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [busyProfileId, setBusyProfileId] = useState(null);
  const [busyPostId, setBusyPostId] = useState(null);

  const followed = useMemo(() => profiles.filter((person) => person.followed), [profiles]);
  const filter = `${query} ${searchTerm}`.trim().toLocaleLowerCase('pt-BR');
  const discover = useMemo(() => profiles
    .filter((person) => !person.followed)
    .filter((person) => !filter || `${person.name} ${person.goal}`.toLocaleLowerCase('pt-BR').includes(filter)), [profiles, filter]);
  const following = useMemo(() => followed
    .filter((person) => !filter || `${person.name} ${person.goal}`.toLocaleLowerCase('pt-BR').includes(filter)), [followed, filter]);

  async function loadCommunity() {
    setLoading(true);
    setApiError('');
    try {
      const [postData, profileData, currentUser] = await Promise.all([
        apiRequest('/api/v1/comunidade/publicacoes'),
        apiRequest('/api/v1/comunidade/perfis'),
        apiRequest('/api/v1/usuarios/me'),
      ]);
      setPosts(Array.isArray(postData) ? postData.map(normalizePost) : []);
      setProfiles(Array.isArray(profileData) ? profileData.map(normalizeProfile) : []);
      setCurrentUserId(Number(currentUser?.id) || null);
    } catch (error) {
      setApiError(error.message || 'Não foi possível carregar a Comunidade.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCommunity(); }, []);

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  }

  async function toggleFollow(person) {
    if (busyProfileId !== null) return;
    setApiError('');
    setBusyProfileId(person.id);
    const newFollowed = !person.followed;
    try {
      await apiRequest(`/api/v1/comunidade/perfis/${person.id}/seguir`, {
        method: newFollowed ? 'POST' : 'DELETE',
      });
      setProfiles((previous) => previous.map((item) => item.id === person.id
        ? { ...item, followed: newFollowed }
        : item));
      showNotice(newFollowed ? `Agora você está seguindo ${person.name}.` : `Você deixou de seguir ${person.name}.`);
    } catch (error) {
      setApiError(error.message || 'Não foi possível atualizar essa conexão.');
    } finally {
      setBusyProfileId(null);
    }
  }

  async function publish(event) {
    event.preventDefault();
    const text = postText.trim();
    if (!text && !postImage) {
      setImageError('Escreva uma mensagem ou adicione uma imagem.');
      return;
    }
    setPublishing(true);
    setApiError('');
    setImageError('');
    try {
      const created = await apiRequest('/api/v1/comunidade/publicacoes', {
        method: 'POST',
        body: JSON.stringify({ text, image: postImage || null, category: postCategory }),
      });
      setPosts((previous) => [normalizePost(created), ...previous.filter((item) => item.id !== created.id)].slice(0, 20));
      setPostText('');
      setPostImage('');
      setPostCategory('Conquista do dia');
      setTab('Publicações');
      showNotice('Publicação compartilhada com a comunidade.');
    } catch (error) {
      setApiError(error.message || 'Não foi possível publicar. Tente novamente.');
    } finally {
      setPublishing(false);
    }
  }

  async function likePost(post) {
    if (busyPostId !== null) return;
    setBusyPostId(post.id);
    setApiError('');
    const method = post.likedByMe ? 'DELETE' : 'POST';
    try {
      await apiRequest(`/api/v1/comunidade/publicacoes/${post.id}/curtida`, { method });
      setPosts((previous) => previous.map((item) => item.id === post.id
        ? { ...item, likedByMe: !post.likedByMe, likes: Math.max(0, item.likes + (post.likedByMe ? -1 : 1)) }
        : item));
    } catch (error) {
      setApiError(error.message || 'Não foi possível registrar a curtida.');
    } finally {
      setBusyPostId(null);
    }
  }

  async function deletePost(post) {
    if (!post.mine) return;
    if (!window.confirm('Deseja excluir esta publicação? Essa ação não pode ser desfeita.')) return;
    setApiError('');
    setBusyPostId(post.id);
    try {
      await apiRequest(`/api/v1/comunidade/publicacoes/${post.id}`, { method: 'DELETE' });
      setPosts((previous) => previous.filter((item) => item.id !== post.id));
      showNotice('Publicação excluída do servidor.');
    } catch (error) {
      setApiError(error.message || 'Não foi possível excluir a publicação.');
    } finally {
      setBusyPostId(null);
    }
  }

  return <section className="community-page">
    <header className="community-heading">
      <div><span className="community-eyebrow">CONEXÕES QUE INCENTIVAM</span><h1>Comunidade</h1><p>Encontre pessoas, compartilhe pequenas conquistas e mantenha a motivação.</p></div>
      <div className="community-count"><span>♧</span><div><strong>{followed.length}</strong><small>pessoas seguindo</small></div></div>
    </header>

    <div className="community-hero"><div className="community-hero__icon">✦</div><div><strong>Um passo de cada vez.</strong><p>Compartilhe sua jornada sem precisar expor informações pessoais de saúde.</p></div><span className="community-hero__sparkle">✧</span></div>

    {apiError && <div className="community-form-error" role="alert"><span>{apiError}</span><button type="button" onClick={() => void loadCommunity()}>Tentar novamente</button></div>}

    <div className="community-toolbar">
      <div className="community-tabs" role="tablist" aria-label="Seções da comunidade">
        {['Descobrir', 'Seguindo', 'Publicações'].map((item) => <button type="button" role="tab" aria-selected={tab === item} className={tab === item ? 'is-active' : ''} key={item} onClick={() => setTab(item)}>{item}{item === 'Seguindo' && <span>{followed.length}</span>}</button>)}
      </div>
      <label className="community-search"><span>⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pessoas..." aria-label="Buscar pessoas" /></label>
    </div>

    {loading && <p className="community-note" role="status">Carregando dados da comunidade...</p>}

    {!loading && tab === 'Descobrir' && <>
      <div className="community-section-title"><div><h2>Pessoas para conhecer</h2><p>Perfis de usuários cadastrados no SmartCarbo.</p></div><span>{discover.length} disponíveis</span></div>
      {discover.length ? <div className="community-people-grid">{discover.map((person) => <PersonCard key={person.id} person={person} followed={false} busy={busyProfileId === person.id} onToggle={() => void toggleFollow(person)} />)}</div> : <Empty icon="♧" title={filter ? 'Nenhuma pessoa encontrada' : 'Ainda não há outros perfis para descobrir'} text={filter ? 'Tente outro nome ou termo de busca.' : 'Quando outras pessoas tiverem uma conta no SmartCarbo, elas aparecerão aqui.'} />}
    </>}

    {!loading && tab === 'Seguindo' && <>
      <div className="community-section-title"><div><h2>Sua rede</h2><p>Perfis que você escolheu acompanhar.</p></div><span>{following.length} pessoas</span></div>
      {following.length ? <div className="community-people-grid">{following.map((person) => <PersonCard key={person.id} person={person} followed busy={busyProfileId === person.id} onToggle={() => void toggleFollow(person)} />)}</div> : <Empty icon="♧" title="Sua rede está vazia" text="Encontre usuários cadastrados para começar a acompanhar a comunidade." action="Encontrar pessoas" onAction={() => setTab('Descobrir')} />}
    </>}

    {!loading && tab === 'Publicações' && <div className="community-feed-layout">
      <div className="community-feed-main">
        <form className="community-compose" onSubmit={publish}>
          <div className="community-avatar community-avatar--me">{initials(profileName)}</div>
          <div className="community-compose__body">
            <label htmlFor="community-post">Compartilhe uma pequena conquista</label>
            <textarea id="community-post" maxLength={500} rows={3} placeholder="Ex.: Fiz uma caminhada hoje ou preparei uma refeição gostosa!" value={postText} onChange={(event) => setPostText(event.target.value)} />
            <div className="community-photo-tools">
              <label className="community-photo-button">▧ Adicionar foto<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
                const file = event.target.files?.[0];
                setImageError('');
                if (!file) return;
                if (!file.type.startsWith('image/')) { setImageError('Escolha um arquivo de imagem.'); event.target.value = ''; return; }
                if (file.size > 3 * 1024 * 1024) { setImageError('A imagem deve ter no máximo 3 MB.'); event.target.value = ''; return; }
                const reader = new FileReader();
                reader.onload = () => setPostImage(String(reader.result || ''));
                reader.onerror = () => setImageError('Não foi possível ler essa imagem.');
                reader.readAsDataURL(file);
                event.target.value = '';
              }} /></label>
              <label className="community-category-label">Tipo de publicação<select value={postCategory} onChange={(event) => setPostCategory(event.target.value)}><option>Conquista do dia</option><option>Atividade física</option><option>Comida do dia</option></select></label>
            </div>
            {postImage && <div className="community-image-preview"><img src={postImage} alt="Prévia da publicação" /><button type="button" onClick={() => setPostImage('')} aria-label="Remover foto">Remover foto ×</button></div>}
            {imageError && <p className="community-form-error" role="alert">{imageError}</p>}
            <div className="community-compose__footer"><small>{postText.length}/500 · Imagem de até 3 MB. Evite compartilhar dados pessoais.</small><button type="submit" disabled={publishing || (!postText.trim() && !postImage)}>{publishing ? 'Publicando...' : 'Publicar'}</button></div>
          </div>
        </form>

        {posts.length ? posts.map((post) => <article className="community-post" key={post.id}>
          <div className="community-post__head"><div className="community-avatar community-avatar--me">{initials(post.author)}</div><div><strong>{post.author}</strong><small>{new Date(post.createdAt).toLocaleString('pt-BR', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><span className="community-post__tag">{post.mine ? 'Minha publicação' : 'Comunidade'}</span></div>
          <span className="community-post__category">{post.category}</span>
          {post.text && <p>{post.text}</p>}
          {post.image && <img className="community-post__image" src={post.image} alt={post.category === 'Comida do dia' ? 'Foto de comida compartilhada' : post.category === 'Atividade física' ? 'Foto de atividade física compartilhada' : 'Foto da publicação'} loading="lazy" />}
          <div className="community-post__actions"><button type="button" disabled={busyPostId === post.id} onClick={() => void likePost(post)}>{post.likedByMe ? '♥ Curtido' : '♡ Curtir'}</button><span>{post.likes} curtida(s)</span>{post.mine && <button type="button" className="community-post__delete" disabled={busyPostId === post.id} onClick={() => void deletePost(post)} aria-label={`Excluir publicação de ${post.author}`}>Excluir publicação</button>}</div>
        </article>) : <Empty icon="✎" title="Sua comunidade começa com você" text="Ainda não há publicações. Compartilhe uma pequena conquista para que outras pessoas também possam vê-la." />}
      </div>
      <aside className="community-feed-aside"><span className="community-aside-icon">♧</span><h3>Um espaço de incentivo</h3><p>As publicações, curtidas e conexões são armazenadas no servidor e ficam disponíveis aos usuários autenticados.</p><button type="button" onClick={() => setTab('Descobrir')}>Encontrar pessoas →</button></aside>
    </div>}

    <footer className="community-privacy"><span>♧</span><p><strong>Privacidade em primeiro lugar</strong><br />O feed não exibe dados médicos, restrições alimentares, peso nem data de nascimento. Compartilhe apenas o que gostaria de tornar visível à comunidade.</p></footer>
    {notice && <div className="community-toast" role="status">✓ {notice}</div>}
  </section>;
}

function PersonCard({ person, followed, onToggle, busy }) {
  return <article className="community-person-card">
    <div className="community-person-card__top"><span className="community-avatar" style={{ '--person-color': person.color }}>{person.initials}</span><span className="community-person-card__status">{followed ? 'Na sua rede' : 'Sugestão'}</span></div>
    <h3>{person.name}</h3><p>{person.goal}</p>
    <div className="community-person-stats"><span><strong>Membro</strong><small>da comunidade</small></span><span><strong>{followed ? 'Seguindo' : 'Disponível'}</strong><small>conexão</small></span></div>
    <button type="button" className={followed ? 'community-follow-button is-following' : 'community-follow-button'} disabled={busy} onClick={onToggle}>{busy ? 'Salvando...' : followed ? '✓ Seguindo' : '＋ Seguir'}</button>
  </article>;
}

function Empty({ icon, title, text, action, onAction }) {
  return <div className="community-empty"><span>{icon}</span><h3>{title}</h3><p>{text}</p>{action && <button type="button" onClick={onAction}>{action}</button>}</div>;
}
