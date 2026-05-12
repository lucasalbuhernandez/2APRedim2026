// ============================================================
// 1. CONFIGURAÇÃO E CONEXÃO FIREBASE
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyBK6fnxekD4M7IK38Mae_yYIbRh6invVfw",
    authDomain: "bike-vw.firebaseapp.com",
    databaseURL: "https://bike-vw-default-rtdb.firebaseio.com",
    projectId: "bike-vw",
    storageBucket: "bike-vw.appspot.com",
    messagingSenderId: "220121468078",
    appId: "1:220121468078:web:c579f4dfebae45e783313f"
};

try {
    firebase.initializeApp(firebaseConfig);
    var database = firebase.database();
} catch (error) {
    console.error("Erro Firebase:", error);
}

// ============================================================
// 2. LISTA OFICIAL DE OPERAÇÕES (AS 7 ETAPAS)
// ============================================================
const etapasFábrica = [
    "Preparando", 
    "Montando Quadro", 
    "Montando Banco", 
    "Montando Rodas", 
    "Montando Pé de vela", 
    "Ajuste Final", 
    "Pronto para Entrega"
];

// ============================================================
// 3. FUNÇÕES DO CONFIGURADOR (INDEX.HTML)
// ============================================================

function scrollPara(id) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selecionar(tipo, valor, event) {
    localStorage.setItem(tipo, valor);
    const elResumo = document.getElementById(`res-${tipo}`);
    if (elResumo) elResumo.innerText = valor;

    const btn = event.currentTarget;
    const container = btn.closest('.opcoes');
    if (container) {
        container.querySelectorAll('.img-btn').forEach(b => b.classList.remove('selecionada'));
        btn.classList.add('selecionada');
    }

    const ordem = ['quadro', 'banco', 'roda', 'pneu'];
    const proximoId = ordem[ordem.indexOf(tipo) + 1];
    if (proximoId) {
        setTimeout(() => { scrollPara(proximoId); }, 300);
    }
}

// ============================================================
// 4. GESTÃO DE NAVEGAÇÃO E DOM
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    ['quadro', 'banco', 'roda', 'pneu'].forEach(t => {
        const salvo = localStorage.getItem(t);
        const el = document.getElementById(`res-${t}`);
        if (salvo && el) el.innerText = salvo;
    });

    const btnFinalizar = document.getElementById('btn-ir-login');
    if (btnFinalizar) btnFinalizar.onclick = () => { window.location.href = "login.html"; };

    const btnVoltar = document.getElementById('btn-voltar-selecao');
    if (btnVoltar) btnVoltar.onclick = () => { window.location.href = "index.html"; };

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.onsubmit = function(e) {
            e.preventDefault();
            const idPedido = Date.now().toString();
            const dados = {
                id: idPedido,
                nome: document.getElementById('nome').value,
                turma: document.getElementById('unidade').value,
                quadro: localStorage.getItem('quadro') || "Padrão",
                banco: localStorage.getItem('banco') || "Padrão",
                roda: localStorage.getItem('roda') || "Padrão",
                pneu: localStorage.getItem('pneu') || "Padrão",
                status: "Preparando",
                hora: new Date().toLocaleTimeString()
            };

            database.ref('pedidos/' + idPedido).set(dados).then(() => {
                localStorage.setItem('rastreio_atual', idPedido);
                window.location.href = 'rastreio.html';
            });
        };
    }

    if (document.getElementById('container-pedidos')) carregarDadosOperador();
    if (document.getElementById('status-atual')) carregarRastreio();
});

// ============================================================
// 5. RASTREIO DO COMPRADOR (RASTREIO.HTML)
// ============================================================

function carregarRastreio() {
    const id = localStorage.getItem('rastreio_atual');
    if (!id) return;

    database.ref('pedidos/' + id).on('value', (s) => {
        const p = s.val();
        if (p) {
            if (document.getElementById('rastreio-aluno')) 
                document.getElementById('rastreio-aluno').innerText = "Olá, " + p.nome;
            
            const elStatus = document.getElementById('status-atual');
            if (elStatus) {
                if (p.status === "ENTREGUE") {
                    elStatus.innerHTML = "<span style='color: #28a745;'>✅ ENTREGUE!</span>";
                } else if (p.status === "EM RETRABALHO") {
                    elStatus.innerHTML = "<span style='color: #ff0000;'>⚠️ EM RETRABALHO</span>";
                } else {
                    elStatus.innerText = p.status.toUpperCase();
                    elStatus.style.color = "#ffcc00";
                }
            }
            
            const lista = document.getElementById('detalhes-bike');
            if (lista) {
                lista.innerHTML = `
                    <li><strong>Quadro:</strong> ${p.quadro}</li>
                    <li><strong>Banco:</strong> ${p.banco}</li>
                    <li><strong>Rodas:</strong> ${p.roda}</li>
                    <li><strong>Pneus:</strong> ${p.pneu}</li>
                    <li><strong>Turma:</strong> ${p.turma.toUpperCase()}</li>
                `;
            }
        }
    });
}

// ============================================================
// 6. PAINEL DO OPERADOR (OPERADOR.HTML)
// ============================================================

function carregarDadosOperador() {
    database.ref('pedidos').on('value', (snapshot) => {
        const pedidos = snapshot.val();
        const containerAtivos = document.getElementById('container-pedidos');
        const containerHistorico = document.getElementById('container-historico'); 
        
        if (!containerAtivos) return;
        
        containerAtivos.innerHTML = "";
        if (containerHistorico) containerHistorico.innerHTML = "";

        if (pedidos) {
            Object.keys(pedidos).forEach(id => {
                const p = pedidos[id];
                const card = document.createElement('div');
                card.className = 'card-producao';

                if (p.status === "ENTREGUE") {
                    if (containerHistorico) {
                        card.style.opacity = "0.7";
                        card.style.borderLeft = "5px solid #28a745";
                        card.style.marginBottom = "10px";
                        card.innerHTML = `
                            <div style="padding:10px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <h4 style="margin:0;">${p.nome} - FINALIZADO</h4>
                                    <p style="margin:0;"><small>${p.quadro} | ${p.roda}</small></p>
                                </div>
                                <button onclick="apagarPedido('${id}')" style="background:#ff4444; color:white; border:none; padding:5px 10px; border-radius:3px; cursor:pointer;">APAGAR</button>
                            </div>
                        `;
                        containerHistorico.appendChild(card);
                    }
                } else {
                    if (p.status === "EM RETRABALHO") {
                        card.style.border = "4px solid red";
                        card.style.backgroundColor = "#fff0f0";
                    }

                    card.innerHTML = `
                        <div style="padding: 15px;">
                            <h3 style="margin:0;">${p.nome} (${p.turma})</h3>
                            <p style="margin: 5px 0;">Status: <b style="${p.status === 'EM RETRABALHO' ? 'color:red' : 'color:#ffcc00'}">${p.status}</b></p>
                            
                            <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; margin: 10px 0; font-size: 0.9em; color: #333; line-height: 1.6;">
                                <strong>CONFIGURAÇÃO:</strong><br>
                                Quadro: ${p.quadro}<br>
                                Banco: ${p.banco}<br>
                                Rodas: ${p.roda}<br>
                                Pneu: ${p.pneu}
                            </div>

                            <button onclick="proximaEtapa('${id}', '${p.status}')" style="width:100%; padding:12px; cursor:pointer; font-weight:bold; background:#333; color:#fff; border:none; margin-bottom:5px; border-radius:4px;">
                                ${p.status === "EM RETRABALHO" ? "VOLTAR PARA A LINHA" : "PRÓXIMA ETAPA"}
                            </button>
                            
                            <div style="display: flex; gap: 5px;">
                                <button onclick="retrabalho('${id}')" style="flex:1; background:#ffcc00; border:none; padding:10px; cursor:pointer; font-weight:bold; border-radius:4px;">RETRABALHO</button>
                                <button onclick="concluirPedido('${id}')" style="flex:1; background:#28a745; color:white; border:none; padding:10px; cursor:pointer; font-weight:bold; border-radius:4px;">CONCLUIR</button>
                            </div>
                        </div>
                    `;
                    containerAtivos.appendChild(card);
                }
            });
        }
    });
}

function proximaEtapa(id, atual) {
    if (atual === "EM RETRABALHO") {
        database.ref('pedidos/' + id).update({ status: "Preparando" });
        return;
    }
    const i = etapasFábrica.indexOf(atual);
    if (i < etapasFábrica.length - 1) {
        database.ref('pedidos/' + id).update({ status: etapasFábrica[i + 1] });
    }
}

function retrabalho(id) {
    database.ref('pedidos/' + id).update({ status: "EM RETRABALHO" });
}

function concluirPedido(id) {
    database.ref('pedidos/' + id).update({ status: "ENTREGUE" });
}

// NOVA FUNÇÃO PARA APAGAR DO HISTÓRICO
function apagarPedido(id) {
    if(confirm("Deseja apagar permanentemente este registro do histórico?")) {
        database.ref('pedidos/' + id).remove();
    }
}