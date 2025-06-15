const supabase = supabase.createClient('https://xyz.supabase.co', 'public-anon-key');
let currentUser = null;
let currentConversation = null;

async function signup() {
  const username = document.getElementById('signup-username').value;
  const password = document.getElementById('signup-password').value;

  if (!username || !password) return alert("Champs requis");

  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password }]);

  if (error) return alert("Erreur d'inscription : " + error.message);

  alert("Inscription réussie, connecte-toi.");
}

async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (data) {
    currentUser = data;
    loadConversations();
  } else {
    alert('Utilisateur non trouvé');
  }
}

async function loadConversations() {
  const { data, error } = await supabase
    .from('conversation_participants')
    .select('conversation_id, conversations(name, is_group)')
    .eq('user_id', currentUser.id);

  const list = document.getElementById('conversation-list');
  list.innerHTML = '';

  data.forEach(entry => {
    const div = document.createElement('div');
    div.classList.add('conversation');
    div.textContent = entry.conversations.name || 'Discussion privée';
    div.onclick = () => openConversation(entry.conversation_id, entry.conversations.name);
    list.appendChild(div);
  });
}

async function openConversation(conversationId, name) {
  currentConversation = conversationId;
  document.getElementById('chat').style.display = 'block';
  document.getElementById('conversation-title').textContent = name || 'Discussion';
  loadMessages();
}

async function loadMessages() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', currentConversation)
    .order('created_at', { ascending: true });

  const { data: deleted } = await supabase
    .from('deleted_messages')
    .select('message_id')
    .eq('user_id', currentUser.id);

  const deletedIds = deleted.map(d => d.message_id);

  const container = document.getElementById('messages');
  container.innerHTML = '';

  data.forEach(msg => {
    if (deletedIds.includes(msg.id)) return;
    const div = document.createElement('div');
    div.classList.add('message');
    div.textContent = msg.content;
    container.appendChild(div);
  });
}

async function sendMessage() {
  const content = document.getElementById('message-input').value;
  if (!content) return;

  await supabase.from('messages').insert([
    {
      conversation_id: currentConversation,
      sender_id: currentUser.id,
      content,
    }
  ]);
  document.getElementById('message-input').value = '';
  loadMessages();
}
