// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBrkKTDKcKA16a1fL4mR3VKjArmxBUb8ho",
    authDomain: "coderaw-2025.firebaseapp.com",
    databaseURL: "https://coderaw-2025-default-rtdb.firebaseio.com",
    projectId: "coderaw-2025",
    storageBucket: "coderaw-2025.firebasestorage.app",
    messagingSenderId: "134498624143",
    appId: "1:134498624143:web:706e250b656061732046fa",
    measurementId: "G-GV2X7STJQD"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências do Firebase
const auth = firebase.auth();
const database = firebase.database();

// Estado da aplicação
let currentUser = null;
let raws = [];
