// Inicialização da autenticação
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    checkAuthState();
});

// Inicializar eventos de autenticação
function initializeAuth() {
    // Event listeners para modais
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginModal').style.display = 'flex';
    });

    document.getElementById('registerBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerModal').style.display = 'flex';
    });

    document.getElementById('communityRegisterBtn').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerModal').style.display = 'flex';
    });

    document.getElementById('switchToRegister').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('loginModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'flex';
    });

    document.getElementById('switchToLogin').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('registerModal').style.display = 'none';
        document.getElementById('loginModal').style.display = 'flex';
    });

    // Fechar modais
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        });
    });

    // Formulário de login
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        loginUser(email, password);
    });

    // Formulário de registro
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        if (!document.getElementById('acceptTerms').checked) {
            alert('Você precisa aceitar os termos de uso!');
            return;
        }
        
        registerUser(name, email, password);
    });

    // Botão de logout
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logoutUser();
    });
}

// Verificar estado de autenticação
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Usuário está logado
            await loadUserData(user);
            currentUser = {
                uid: user.uid,
                email: user.email,
                name: user.displayName || 'Usuário'
            };
            checkUserStatus();
            loadRaws();
            updateStats();
        } else {
            // Usuário não está logado
            currentUser = null;
            checkUserStatus();
            loadRaws();
            updateStats();
        }
    });
}

// Carregar dados do usuário
async function loadUserData(user) {
    try {
        const userRef = database.ref('users/' + user.uid);
        const snapshot = await userRef.once('value');
        
        if (!snapshot.exists()) {
            // Criar usuário se não existir
            await userRef.set({
                name: user.displayName || 'Usuário',
                email: user.email,
                createdAt: Date.now(),
                isAdmin: false
            });
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

// Verificar status do usuário
function checkUserStatus() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userInfo').style.display = 'flex';
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('registerBtn').style.display = 'none';
        document.getElementById('createRawBtn').style.display = 'inline-flex';
        document.getElementById('logoutBtn').style.display = 'inline-flex';
    } else {
        document.getElementById('userInfo').style.display = 'none';
        document.getElementById('loginBtn').style.display = 'inline-flex';
        document.getElementById('registerBtn').style.display = 'inline-flex';
        document.getElementById('createRawBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';
        document.getElementById('adminLink').style.display = 'none';
    }
}

// Registrar usuário
async function registerUser(name, email, password) {
    const submitBtn = document.getElementById('registerSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loading = submitBtn.querySelector('.loading');
    
    try {
        btnText.style.display = 'none';
        loading.style.display = 'inline-block';
        submitBtn.disabled = true;

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Atualizar perfil do usuário
        await user.updateProfile({
            displayName: name
        });
        
        // Criar usuário no Realtime Database
        await database.ref('users/' + user.uid).set({
            name: name,
            email: email,
            createdAt: Date.now(),
            isAdmin: false
        });
        
        // Fechar modal
        document.getElementById('registerModal').style.display = 'none';
        alert('Conta criada com sucesso!');
        
    } catch (error) {
        console.error('Erro no registro:', error);
        let errorMessage = 'Erro ao criar conta. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'Este email já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Senha muito fraca.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Login de usuário
async function loginUser(email, password) {
    const submitBtn = document.getElementById('loginSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const loading = submitBtn.querySelector('.loading');
    
    try {
        btnText.style.display = 'none';
        loading.style.display = 'inline-block';
        submitBtn.disabled = true;

        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('loginModal').style.display = 'none';
        
    } catch (error) {
        console.error('Erro no login:', error);
        let errorMessage = 'Erro ao fazer login. ';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage += 'Usuário não encontrado.';
                break;
            case 'auth/wrong-password':
                errorMessage += 'Senha incorreta.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Email inválido.';
                break;
            default:
                errorMessage += error.message;
        }
        
        alert(errorMessage);
    } finally {
        btnText.style.display = 'inline';
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

// Logout de usuário
async function logoutUser() {
    try {
        await auth.signOut();
        alert('Logout realizado com sucesso!');
    } catch (error) {
        console.error('Erro no logout:', error);
        alert('Erro ao fazer logout.');
    }
}
