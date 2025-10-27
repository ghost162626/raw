// Array global para armazenar os raws
let raws = [];
let currentUser = null;

// Inicializar Firebase
const database = firebase.database();

// Função para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// No carregamento dos raws - MOSTRAR TODOS, inclusive privados
async function loadRaws() {
    const rawList = document.getElementById('rawList');
    if (!rawList) {
        console.error('Elemento rawList não encontrado!');
        return;
    }
    
    rawList.innerHTML = '<p class="text-center">Carregando raws...</p>';
    
    try {
        const rawsRef = database.ref('raws').orderByChild('createdAt');
        
        rawsRef.once('value', (snapshot) => {
            if (!snapshot.exists()) {
                rawList.innerHTML = '<p class="text-center">Nenhum raw encontrado. Seja o primeiro a criar um!</p>';
                return;
            }
            
            rawList.innerHTML = '';
            raws = [];
            
            // Converter snapshot em array e ordenar por data (mais recentes primeiro)
            const rawsArray = [];
            snapshot.forEach((childSnapshot) => {
                const raw = childSnapshot.val();
                raw.id = childSnapshot.key; // Adicionar ID ao objeto
                rawsArray.push(raw);
            });
            
            // Ordenar por data (mais recentes primeiro)
            rawsArray.sort((a, b) => b.createdAt - a.createdAt);
            
            rawsArray.forEach((raw) => {
                raws.push(raw);
                
                const rawItem = document.createElement('div');
                rawItem.className = 'raw-item';
                
                // Formatar data
                const createdAt = new Date(raw.createdAt).toLocaleDateString('pt-BR');
                
                rawItem.innerHTML = `
                    <div class="raw-header">
                        <div class="raw-title">${escapeHtml(raw.title)}</div>
                        <span class="raw-visibility ${raw.visibility}">${raw.visibility === 'public' ? 'Público' : 'Privado'}</span>
                    </div>
                    <div class="raw-description">${escapeHtml(raw.description || 'Sem descrição')}</div>
                    <div class="raw-meta">
                        <small class="text-muted">Por ${escapeHtml(raw.author)} • ${createdAt}</small>
                        ${raw.visibility === 'private' ? '<small class="text-muted">🔒 Privado - Necessita chave</small>' : ''}
                    </div>
                    <div class="raw-actions mt-2">
                        <button class="btn btn-outline btn-sm view-raw" data-id="${raw.id}" data-visibility="${raw.visibility}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${currentUser && raw.authorId === currentUser.uid ? `
                        <button class="btn btn-outline btn-sm edit-raw" data-id="${raw.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm copy-loadstring" data-id="${raw.id}" data-visibility="${raw.visibility}">
                            <i class="fas fa-copy"></i> Loadstring
                        </button>
                    </div>
                `;
                
                rawList.appendChild(rawItem);
            });
            
            // Adicionar event listeners aos botões
            document.querySelectorAll('.view-raw').forEach(button => {
                button.addEventListener('click', function() {
                    const rawId = this.getAttribute('data-id');
                    const visibility = this.getAttribute('data-visibility');
                    viewRaw(rawId, visibility);
                });
            });
            
            document.querySelectorAll('.edit-raw').forEach(button => {
                button.addEventListener('click', function() {
                    const rawId = this.getAttribute('data-id');
                    editRaw(rawId);
                });
            });
            
            document.querySelectorAll('.copy-loadstring').forEach(button => {
                button.addEventListener('click', function() {
                    const rawId = this.getAttribute('data-id');
                    const visibility = this.getAttribute('data-visibility');
                    copyLoadstring(rawId, visibility);
                });
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar raws:', error);
        rawList.innerHTML = '<p class="text-center">Erro ao carregar raws. Tente recarregar a página.</p>';
    }
}

// Visualizar raw - VERIFICAR CHAVE SE FOR PRIVADO
function viewRaw(rawId, visibility) {
    const raw = raws.find(r => r.id === rawId);
    if (!raw) {
        alert('Raw não encontrado!');
        return;
    }
    
    // Se for privado e usuário não é o autor, pedir chave
    if (visibility === 'private' && (!currentUser || raw.authorId !== currentUser.uid)) {
        const userKey = prompt('Este raw é privado. Digite a chave de acesso:');
        if (!userKey) {
            alert('Chave não fornecida!');
            return;
        }
        
        // Abrir com a chave fornecida
        window.open(`raw.html?id=${rawId}&key=${userKey}`, '_blank');
    } else {
        // Se for público ou usuário é o autor, abrir normalmente
        let url = `raw.html?id=${rawId}`;
        if (visibility === 'private' && raw.privateKey) {
            url += `&key=${raw.privateKey}`;
        }
        window.open(url, '_blank');
    }
    
    // Incrementar visualizações no Realtime Database
    database.ref('raws/' + rawId + '/views').transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
    
    // Atualizar estatísticas
    updateStats();
}

// Copiar loadstring - INCLUIR CHAVE SE FOR PRIVADO
function copyLoadstring(rawId, visibility) {
    const raw = raws.find(r => r.id === rawId);
    if (!raw) {
        alert('Raw não encontrado!');
        return;
    }
    
    // Se for privado e usuário não é o autor, pedir chave
    if (visibility === 'private' && (!currentUser || raw.authorId !== currentUser.uid)) {
        const userKey = prompt('Este raw é privado. Digite a chave de acesso para gerar o loadstring:');
        if (!userKey) {
            alert('Chave não fornecida!');
            return;
        }
        
        // Criar loadstring com a chave fornecida
        const loadstring = `loadstring(game:HttpGet("${window.location.origin}/raw.html?id=${rawId}&key=${userKey}"))()`;
        
        // Copiar para a área de transferência
        navigator.clipboard.writeText(loadstring).then(() => {
            alert('Loadstring copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Erro ao copiar loadstring!');
        });
    } else {
        // Se for público ou usuário é o autor, copiar normalmente
        let loadstring = `loadstring(game:HttpGet("${window.location.origin}/raw.html?id=${rawId}"))()`;
        
        // Se for privado, adicionar chave automaticamente (apenas autor)
        if (visibility === 'private' && raw.privateKey) {
            loadstring = `loadstring(game:HttpGet("${window.location.origin}/raw.html?id=${rawId}&key=${raw.privateKey}"))()`;
        }
        
        // Copiar para a área de transferência
        navigator.clipboard.writeText(loadstring).then(() => {
            alert('Loadstring copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar:', err);
            alert('Erro ao copiar loadstring!');
        });
    }
}

// Função para atualizar estatísticas
function updateStats() {
    // Implementar atualização de estatísticas se necessário
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    loadRaws();
    
    // Observar mudanças no auth state
    firebase.auth().onAuthStateChanged((user) => {
        currentUser = user;
        if (user) {
            // Usuário logado
            console.log('Usuário logado:', user.email);
        } else {
            // Usuário deslogado
            console.log('Usuário deslogado');
        }
    });
});
