// Inicialização dos raws
document.addEventListener('DOMContentLoaded', function() {
    initializeRaws();
});

// Inicializar eventos dos raws
function initializeRaws() {
    // Botões de criar raw
    const heroCreateBtn = document.getElementById('heroCreateBtn');
    const createRawBtn = document.getElementById('createRawBtn');
    const communityCreateBtn = document.getElementById('communityCreateBtn');
    const cancelCreateBtn = document.getElementById('cancelCreateBtn');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const rawForm = document.getElementById('rawForm');

    if (heroCreateBtn) {
        heroCreateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                showCreateRawSection();
            } else {
                document.getElementById('loginModal').style.display = 'flex';
            }
        });
    }

    if (createRawBtn) {
        createRawBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showCreateRawSection();
        });
    }

    if (communityCreateBtn) {
        communityCreateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (currentUser) {
                showCreateRawSection();
            } else {
                document.getElementById('loginModal').style.display = 'flex';
            }
        });
    }

    // Cancelar criação de raw
    if (cancelCreateBtn) {
        cancelCreateBtn.addEventListener('click', function() {
            document.getElementById('createRawSection').style.display = 'none';
            resetRawForm();
        });
    }

    // Visibilidade do raw
    document.querySelectorAll('input[name="visibility"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const privateKeyGroup = document.getElementById('privateKeyGroup');
            if (privateKeyGroup) {
                if (this.value === 'private') {
                    privateKeyGroup.style.display = 'block';
                } else {
                    privateKeyGroup.style.display = 'none';
                }
            }
        });
    });

    // Formulário de criação de raw
    if (rawForm) {
        rawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createRaw();
        });
    }

    // Botão de copiar código
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function() {
            const rawCode = document.getElementById('rawCode');
            if (rawCode) {
                const code = rawCode.innerText;
                navigator.clipboard.writeText(code).then(() => {
                    alert('Código copiado para a área de transferência!');
                });
            }
        });
    }

    // Botão de carregar mais raws
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadRaws();
        });
    }
}

// Resetar formulário do raw
function resetRawForm() {
    const rawForm = document.getElementById('rawForm');
    const rawCode = document.getElementById('rawCode');
    const privateKeyGroup = document.getElementById('privateKeyGroup');
    
    if (rawForm) rawForm.reset();
    if (rawCode) rawCode.innerText = '-- Seu código Lua aqui\nfunction main()\n    print("Olá, CodeRaw 2025!")\nend\n\nmain()';
    if (privateKeyGroup) privateKeyGroup.style.display = 'none';
    
    // Remover modo de edição se existir
    if (rawForm && rawForm.dataset.editing) {
        delete rawForm.dataset.editing;
        const submitButton = rawForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar Raw';
        }
    }
}

// Mostrar seção de criação de raw
function showCreateRawSection() {
    const createRawSection = document.getElementById('createRawSection');
    if (createRawSection) {
        createRawSection.style.display = 'block';
        createRawSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Criar novo raw
async function createRaw() {
    const submitBtn = document.getElementById('submitRawBtn');
    
    // Verificar se o botão existe
    if (!submitBtn) {
        console.error('Botão submitRawBtn não encontrado!');
        alert('Erro: Elemento não encontrado. Recarregue a página.');
        return;
    }
    
    const btnText = submitBtn.querySelector('.btn-text');
    const loading = submitBtn.querySelector('.loading');
    
    const title = document.getElementById('rawTitle')?.value.trim();
    const description = document.getElementById('rawDescription')?.value.trim();
    const rawCodeElement = document.getElementById('rawCode');
    const code = rawCodeElement ? rawCodeElement.innerText.trim() : '';
    const visibilityRadio = document.querySelector('input[name="visibility"]:checked');
    const visibility = visibilityRadio ? visibilityRadio.value : 'public';
    const privateKey = visibility === 'private' ? document.getElementById('privateKey')?.value.trim() : null;
    
    console.log('Dados do formulário:', { title, description, code, visibility, privateKey });
    
    // Validações
    if (!title) {
        alert('Por favor, digite um título para o raw!');
        return;
    }
    
    if (!code) {
        alert('Por favor, digite o código!');
        return;
    }
    
    if (visibility === 'private' && !privateKey) {
        alert('Por favor, digite uma chave de acesso para o raw privado!');
        return;
    }
    
    // Verificar se usuário está logado
    if (!currentUser) {
        alert('Você precisa estar logado para criar um raw!');
        return;
    }
    
    try {
        // Mostrar loading
        if (btnText) btnText.style.display = 'none';
        if (loading) loading.style.display = 'inline-block';
        submitBtn.disabled = true;

        // Criar novo raw no Realtime Database
        const rawId = database.ref().child('raws').push().key;
        
        const rawData = {
            id: rawId,
            title: title,
            description: description,
            code: code,
            visibility: visibility,
            privateKey: privateKey,
            author: currentUser.name,
            authorId: currentUser.uid,
            createdAt: Date.now(),
            views: 0
        };
        
        console.log('Tentando criar raw:', rawData);
        
        // Salvar no Firebase
        await database.ref('raws/' + rawId).set(rawData);
        
        console.log('Raw criado com sucesso! ID:', rawId);
        
        // Limpar formulário
        resetRawForm();
        
        // Ocultar seção de criação
        const createRawSection = document.getElementById('createRawSection');
        if (createRawSection) {
            createRawSection.style.display = 'none';
        }
        
        // Atualizar lista de raws e estatísticas
        loadRaws();
        updateStats();
        
        alert('Raw criado com sucesso!');
        
    } catch (error) {
        console.error('Erro completo ao criar raw:', error);
        alert('Erro ao criar raw: ' + (error.message || 'Erro desconhecido'));
    } finally {
        // Esconder loading
        if (btnText) btnText.style.display = 'inline';
        if (loading) loading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Carregar raws
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
                rawsArray.push(childSnapshot.val());
            });
            
            // Ordenar por data (mais recentes primeiro)
            rawsArray.sort((a, b) => b.createdAt - a.createdAt);
            
            rawsArray.forEach((raw) => {
                raws.push(raw);
                
                // Se não está logado, mostrar apenas raws públicos
                if (!currentUser && raw.visibility === 'private') {
                    return;
                }
                
                // Se está logado, mostrar apenas raws públicos ou do usuário
                if (currentUser && raw.visibility === 'private' && raw.authorId !== currentUser.uid) {
                    return;
                }
                
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
                    </div>
                    <div class="raw-actions mt-2">
                        <button class="btn btn-outline btn-sm view-raw" data-id="${raw.id}">
                            <i class="fas fa-eye"></i> Ver
                        </button>
                        ${currentUser && raw.authorId === currentUser.uid ? `
                        <button class="btn btn-outline btn-sm edit-raw" data-id="${raw.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm copy-loadstring" data-id="${raw.id}">
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
                    viewRaw(rawId);
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
                    copyLoadstring(rawId);
                });
            });
        });
        
    } catch (error) {
        console.error('Erro ao carregar raws:', error);
        rawList.innerHTML = '<p class="text-center">Erro ao carregar raws. Tente recarregar a página.</p>';
    }
}

// Função para escapar HTML (segurança)
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Visualizar raw
function viewRaw(rawId) {
    const raw = raws.find(r => r.id === rawId);
    if (!raw) {
        alert('Raw não encontrado!');
        return;
    }
    
    // Verificar se é privado e usuário não é o autor
    if (raw.visibility === 'private' && (!currentUser || raw.authorId !== currentUser.uid)) {
        alert('Este raw é privado e você não tem permissão para visualizá-lo!');
        return;
    }
    
    // Incrementar visualizações no Realtime Database
    database.ref('raws/' + rawId + '/views').transaction((currentViews) => {
        return (currentViews || 0) + 1;
    });
    
    // Abrir em nova aba
    let url = `raw.html?id=${rawId}`;
    if (raw.visibility === 'private' && raw.privateKey) {
        url += `&key=${raw.privateKey}`;
    }
    
    window.open(url, '_blank');
    
    // Atualizar estatísticas
    updateStats();
}

// Editar raw
async function editRaw(rawId) {
    const raw = raws.find(r => r.id === rawId);
    if (!raw) {
        alert('Raw não encontrado!');
        return;
    }
    
    // Verificar se o usuário é o autor
    if (!currentUser || raw.authorId !== currentUser.uid) {
        alert('Você não tem permissão para editar este raw!');
        return;
    }
    
    // Preencher formulário com dados do raw
    const rawTitle = document.getElementById('rawTitle');
    const rawDescription = document.getElementById('rawDescription');
    const rawCode = document.getElementById('rawCode');
    const publicRadio = document.getElementById('public');
    const privateRadio = document.getElementById('private');
    const privateKeyGroup = document.getElementById('privateKeyGroup');
    const privateKey = document.getElementById('privateKey');
    
    if (rawTitle) rawTitle.value = raw.title;
    if (rawDescription) rawDescription.value = raw.description || '';
    if (rawCode) rawCode.innerText = raw.code;
    
    if (raw.visibility === 'private') {
        if (privateRadio) privateRadio.checked = true;
        if (privateKeyGroup) privateKeyGroup.style.display = 'block';
        if (privateKey) privateKey.value = raw.privateKey || '';
    } else {
        if (publicRadio) publicRadio.checked = true;
        if (privateKeyGroup) privateKeyGroup.style.display = 'none';
    }
    
    // Mostrar seção de criação
    showCreateRawSection();
    
    // Alterar comportamento do formulário para edição
    const form = document.getElementById('rawForm');
    if (!form) return;
    
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Remover event listeners anteriores
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Configurar novo formulário
    newForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        await updateRaw(rawId);
    });
    
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-save"></i> Atualizar Raw';
    }
    
    // Atualizar referências
    newForm.dataset.editing = rawId;
}

// Atualizar raw
async function updateRaw(rawId) {
    const submitBtn = document.getElementById('submitRawBtn');
    if (!submitBtn) {
        alert('Erro: Elemento não encontrado!');
        return;
    }
    
    const btnText = submitBtn.querySelector('.btn-text');
    const loading = submitBtn.querySelector('.loading');
    
    const title = document.getElementById('rawTitle')?.value.trim();
    const description = document.getElementById('rawDescription')?.value.trim();
    const rawCodeElement = document.getElementById('rawCode');
    const code = rawCodeElement ? rawCodeElement.innerText.trim() : '';
    const visibilityRadio = document.querySelector('input[name="visibility"]:checked');
    const visibility = visibilityRadio ? visibilityRadio.value : 'public';
    const privateKey = visibility === 'private' ? document.getElementById('privateKey')?.value.trim() : null;
    
    // Validações
    if (!title) {
        alert('Por favor, digite um título para o raw!');
        return;
    }
    
    if (!code) {
        alert('Por favor, digite o código!');
        return;
    }
    
    if (visibility === 'private' && !privateKey) {
        alert('Por favor, digite uma chave de acesso para o raw privado!');
        return;
    }
    
    try {
        if (btnText) btnText.style.display = 'none';
        if (loading) loading.style.display = 'inline-block';
        submitBtn.disabled = true;

        // Atualizar raw no Realtime Database
        const updates = {
            title: title,
            description: description,
            code: code,
            visibility: visibility,
            privateKey: privateKey,
            updatedAt: Date.now()
        };
        
        await database.ref('raws/' + rawId).update(updates);
        
        // Limpar formulário e restaurar comportamento padrão
        resetRawForm();
        
        // Ocultar seção de criação
        const createRawSection = document.getElementById('createRawSection');
        if (createRawSection) {
            createRawSection.style.display = 'none';
        }
        
        // Atualizar lista de raws
        loadRaws();
        
        alert('Raw atualizado com sucesso!');
        
    } catch (error) {
        console.error('Erro ao atualizar raw:', error);
        alert('Erro ao atualizar raw: ' + error.message);
    } finally {
        if (btnText) btnText.style.display = 'inline';
        if (loading) loading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Copiar loadstring
function copyLoadstring(rawId) {
    const raw = raws.find(r => r.id === rawId);
    if (!raw) {
        alert('Raw não encontrado!');
        return;
    }
    
    // Verificar se é privado e usuário não é o autor
    if (raw.visibility === 'private' && (!currentUser || raw.authorId !== currentUser.uid)) {
        alert('Este raw é privado e você não tem permissão para copiar o loadstring!');
        return;
    }
    
    // Criar loadstring
    let loadstring = `loadstring(game:HttpGet("${window.location.origin}/raw.html?id=${rawId}"))()`;
    
    // Se for privado, adicionar chave como parâmetro
    if (raw.visibility === 'private' && raw.privateKey) {
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

// Atualizar estatísticas
async function updateStats() {
    try {
        const rawsRef = database.ref('raws');
        const usersRef = database.ref('users');
        
        rawsRef.once('value', (rawsSnapshot) => {
            const totalRaws = rawsSnapshot.numChildren();
            const totalRawsElement = document.getElementById('totalRaws');
            const communityRawsElement = document.getElementById('communityRaws');
            
            if (totalRawsElement) totalRawsElement.textContent = totalRaws;
            if (communityRawsElement) communityRawsElement.textContent = totalRaws;
            
            // Calcular visualizações totais
            let totalViews = 0;
            let privateRaws = 0;
            
            rawsSnapshot.forEach((childSnapshot) => {
                const raw = childSnapshot.val();
                totalViews += raw.views || 0;
                if (raw.visibility === 'private') {
                    privateRaws++;
                }
            });
            
            // Calcular porcentagem de raws privados
            const privatePercentage = totalRaws > 0 ? Math.round((privateRaws / totalRaws) * 100) : 0;
            const privatePercentageElement = document.getElementById('privatePercentage');
            const communityViewsElement = document.getElementById('communityViews');
            
            if (privatePercentageElement) privatePercentageElement.textContent = `${privatePercentage}%`;
            if (communityViewsElement) communityViewsElement.textContent = totalViews;
        });
        
        usersRef.once('value', (usersSnapshot) => {
            const totalUsers = usersSnapshot.numChildren();
            const totalUsersElement = document.getElementById('totalUsers');
            const communityUsersElement = document.getElementById('communityUsers');
            
            if (totalUsersElement) totalUsersElement.textContent = totalUsers;
            if (communityUsersElement) communityUsersElement.textContent = totalUsers;
        });
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}
