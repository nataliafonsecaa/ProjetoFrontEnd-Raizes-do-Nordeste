// ---------- MOCK DATA ----------
const produtosMock = [
    { id: 1, nome: "Tapioca de Carne de Sol", preco: 18.9, unidadeDisponivel: ["Recife","Caruaru","São Paulo"], disponivel: true, sazonal: false, imagem: "🌮" },
    { id: 2, nome: "Cuscuz Recheado (Queijo Coalho)", preco: 16.5, unidadeDisponivel: ["Recife","Caruaru"], disponivel: true, sazonal: false },
    { id: 3, nome: "Bolo de Macaxeira com Coco", preco: 12.0, unidadeDisponivel: ["Recife","Caruaru","São Paulo"], disponivel: true, sazonal: false },
    { id: 4, nome: "Caldo de Mocotó", preco: 14.0, unidadeDisponivel: ["Recife"], disponivel: false, sazonal: false, msgIndisponivel: "Indisponível" },
    { id: 5, nome: "Paçoca de Carne com Pirão", preco: 22.0, unidadeDisponivel: ["Caruaru","São Paulo"], disponivel: true, sazonal: false },
    { id: 6, nome: "Bolo de Milho (Período Junino)", preco: 9.9, unidadeDisponivel: ["Recife","Caruaru","São Paulo"], disponivel: true, sazonal: true, badge: "Sazonal - Junino" },
    { id: 7, nome: "Cocada Nordestina", preco: 7.5, unidadeDisponivel: ["São Paulo"], disponivel: true, sazonal: false },
    { id: 8, nome: "Arrumadinho", preco: 24.0, unidadeDisponivel: ["Recife","Caruaru"], disponivel: false, sazonal: false }
];

// Estado da aplicação
let carrinho = []; 
let usuarioLogado = null;
let pontosFidelidade = 0;
let descontoAplicado = 0; 
let currentScreen = "home";

// Dados de usuários (mock)
let usuarios = [{ email: "cliente@raizes.com", senha: "Nordeste123", nome: "Cliente Raízes", pontos: 120 }];

// LGPD
if (!localStorage.getItem("lgpdConsent")) {
    document.getElementById("lgpdModal").classList.add("active");
}

document.getElementById("aceitarCookies").onclick = () => { localStorage.setItem("lgpdConsent","aceito"); fecharLGPD(); };
document.getElementById("rejeitarCookies").onclick = () => { localStorage.setItem("lgpdConsent","rejeitado"); fecharLGPD(); };
function fecharLGPD() { document.getElementById("lgpdModal").classList.remove("active"); }
document.getElementById("politicaLink").onclick = (e) => { e.preventDefault(); alert("Política de Privacidade simulada: seus dados são usados apenas para fidelidade."); };

// ---------- RENDER E UI ----------
function atualizarUIComUsuario() {
    const btnNavLogin = document.getElementById("openLoginModalBtn");
    
    if(usuarioLogado){
        pontosFidelidade = usuarioLogado.pontos;
        document.getElementById("pontosUsuario").innerText = pontosFidelidade;
        
        // Exibe o primeiro nome do usuário na Navbar
        const primeiroNome = usuarioLogado.nome.split(" ")[0];
        btnNavLogin.innerHTML = `👤 Olá, ${primeiroNome}`;
    } else {
        pontosFidelidade = 0;
        document.getElementById("pontosUsuario").innerText = 0;
        btnNavLogin.innerHTML = `⭐ Login`;
    }
    renderCarrinho();
}

function renderCardapioPorUnidade(unidade) {
    const container = document.getElementById("cardapioDinamico");
    const produtosFiltrados = produtosMock.filter(p => p.unidadeDisponivel.includes(unidade));
    
    if(produtosFiltrados.length === 0) { container.innerHTML = "<p>Nenhum produto nesta unidade.</p>"; return; }
    
    container.innerHTML = produtosFiltrados.map(prod => {
        let disponivelNaUnidade = prod.disponivel;
        let badgeHtml = "";
        if(!disponivelNaUnidade) badgeHtml = "<span class='badge badge-indisponivel'>❌ Indisponível</span>";
        else if(prod.sazonal) badgeHtml = "<span class='badge badge-sazonal'>🌽 Sazonal (Junino)</span>";
        
        const disabledAttr = (!disponivelNaUnidade) ? "disabled" : "";
        
        return `
        <div class="produto-item">
            <div style="font-weight:bold;">${prod.nome}</div>
            <div style="margin-bottom:10px;">R$ ${prod.preco.toFixed(2).replace('.', ',')}</div>
            ${badgeHtml}
            <button class="addCarrinhoBtn btn-primary" data-id="${prod.id}" data-nome="${prod.nome}" data-preco="${prod.preco}" ${disabledAttr}>Adicionar</button>
        </div>
        `;
    }).join('');

    document.querySelectorAll(".addCarrinhoBtn").forEach(btn => {
        if(!btn.disabled) btn.addEventListener("click", () => {
            const id = parseInt(btn.dataset.id);
            const nome = btn.dataset.nome;
            const preco = parseFloat(btn.dataset.preco);
            adicionarAoCarrinho(id, nome, preco);
        });
    });
}

function adicionarAoCarrinho(id, nome, preco) {
    const existe = carrinho.find(item => item.id === id);
    if(existe) existe.quantidade += 1;
    else carrinho.push({ id, nome, preco, quantidade: 1 });
    renderCarrinho();
    alert(`${nome} adicionado ao carrinho!`);
}

function renderCarrinho() {
    const container = document.getElementById("carrinhoLista");
    
    if(carrinho.length === 0) { 
        container.innerHTML = "<p>🛍️ Carrinho vazio. Adicione produtos do cardápio!</p>"; 
        document.getElementById("totalCarrinho").innerHTML = `Total: R$ 0,00`; 
        return; 
    }
    
    let html = `<ul style="list-style:none;">`;
    let subtotal = 0;
    
    carrinho.forEach((item, idx) => {
        const totalItem = item.preco * item.quantidade;
        subtotal += totalItem;
        html += `<li style="display:flex; justify-content:space-between; margin-bottom:15px; border-bottom:1px dashed #ccc; padding-bottom:10px;">
            <span><strong>${item.quantidade}x</strong> ${item.nome}</span>
            <span>R$ ${totalItem.toFixed(2).replace('.', ',')} 
                <button class="alterarQtd" data-idx="${idx}" data-op="menos">-</button>
                <button class="alterarQtd" data-idx="${idx}" data-op="mais">+</button>
                <button class="removerItem" data-idx="${idx}">🗑️</button>
            </span>
        </li>`;
    });
    html += `</ul>`;
    container.innerHTML = html;
    
    let totalFinal = subtotal - descontoAplicado;
    if(totalFinal < 0) totalFinal = 0;
    
    document.getElementById("totalCarrinho").innerHTML = `Subtotal: R$ ${subtotal.toFixed(2).replace('.', ',')} 
    ${descontoAplicado > 0 ? `<br>Desconto Fidelidade: -R$ ${descontoAplicado.toFixed(2).replace('.', ',')}` : ""}
    <br><strong style="font-size:1.2rem; color:var(--laranja-queimado)">Total a Pagar: R$ ${totalFinal.toFixed(2).replace('.', ',')}</strong>`;

    document.querySelectorAll(".alterarQtd").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            const op = btn.dataset.op;
            if(op === "mais") carrinho[idx].quantidade += 1;
            else if(op === "menos" && carrinho[idx].quantidade > 1) carrinho[idx].quantidade -= 1;
            else if(op === "menos" && carrinho[idx].quantidade === 1) carrinho.splice(idx,1);
            renderCarrinho();
        });
    });

    document.querySelectorAll(".removerItem").forEach(btn => {
        btn.addEventListener("click", () => {
            const idx = parseInt(btn.dataset.idx);
            carrinho.splice(idx,1);
            renderCarrinho();
        });
    });
}

// ---------- INTERAÇÕES DE FIDELIDADE ----------
document.getElementById("aplicarDescontoBtn").addEventListener("click", () => {
    if(!usuarioLogado) { alert("Faça login para resgatar pontos!"); return; }
    
    const select = document.getElementById("resgateSelect");
    const pontosReq = parseInt(select.value);
    
    if(!pontosReq || pontosReq === 0) { alert("Selecione um benefício válido"); return; }
    
    let descontoValor = 0;
    if(pontosReq === 50) descontoValor = 5;
    else if(pontosReq === 100) descontoValor = 12;
    else if(pontosReq === 200) descontoValor = 30;
    
    if(pontosFidelidade >= pontosReq) {
        pontosFidelidade -= pontosReq;
        usuarioLogado.pontos = pontosFidelidade;
        descontoAplicado += descontoValor;
        document.getElementById("descontoInfo").innerHTML = `✅ Desconto de R$ ${descontoValor.toFixed(2).replace('.',',')} aplicado!`;
        atualizarUIComUsuario();
        renderCarrinho();
    } else {
        alert("Pontos insuficientes!");
    }
});

// ---------- OPÇÕES DE PAGAMENTO ----------
document.getElementById("formaPagamento").addEventListener("change", (e) => {
    const pixContainer = document.getElementById("pixContainer");
    if(e.target.value === "pix") {
        pixContainer.style.display = "block";
    } else {
        pixContainer.style.display = "none";
    }
});

// ---------- FLUXO DE PAGAMENTO E STATUS AUTOMÁTICO ----------
document.getElementById("finalizarCompraBtn").addEventListener("click", () => {
    if(!usuarioLogado) { alert("Você precisa estar logado para finalizar!"); return; }
    if(carrinho.length === 0) { alert("Adicione itens ao carrinho primeiro."); return; }

    const formaPagto = document.getElementById("formaPagamento").options[document.getElementById("formaPagamento").selectedIndex].text;
    const modalPag = document.getElementById("paymentModal");
    const msgP = document.getElementById("paymentMsg");
    
    modalPag.classList.add("active");
    msgP.innerText = `Processando pagamento via ${formaPagto}...`;
    
    // Simula API de pagamento
    setTimeout(() => {
        msgP.innerText = "✅ Pagamento aprovado! Preparando seu pedido...";
        
        setTimeout(() => {
            modalPag.classList.remove("active");
            
            // Lógica Pós-Pagamento
            const totalCompra = carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0) - descontoAplicado;
            const pontosGanhos = Math.floor(totalCompra);
            
            usuarioLogado.pontos += pontosGanhos;
            pontosFidelidade = usuarioLogado.pontos;
            
            carrinho = [];
            descontoAplicado = 0;
            document.getElementById("descontoInfo").innerHTML = "";
            atualizarUIComUsuario();
            
            // Inicia o Stepper Automático
            iniciarFluxoAutomaticoPedido();
        }, 1500);
    }, 2000);
});

function iniciarFluxoAutomaticoPedido() {
    // Esconde o layout do carrinho e mostra o Stepper
    document.getElementById("cartContent").style.display = "none";
    document.getElementById("statusContent").style.display = "block";
    
    // Etapa 1: Recebido
    atualizarStepperUI(1);
    document.getElementById("statusMsg").innerText = "Pedido recebido com sucesso! A cozinha já foi notificada.";

    // Passa para Etapa 2 (Em Preparação) após 4 segundos
    setTimeout(() => {
        atualizarStepperUI(2);
        document.getElementById("statusMsg").innerText = "Seu pedido está em preparação. Cheirinho de comida boa no ar!";
        
        // Passa para Etapa 3 (Pronto) após mais 5 segundos
        setTimeout(() => {
            atualizarStepperUI(3);
            document.getElementById("statusMsg").innerHTML = "<strong>Pronto para retirada! 🎉</strong> Pode vir buscar sua delícia nordestina.";
            
            // Reseta a interface após 10 segundos para permitir nova compra
            setTimeout(() => {
                document.getElementById("cartContent").style.display = "flex";
                document.getElementById("statusContent").style.display = "none";
                atualizarStepperUI(0); // Limpa o visual
            }, 10000);

        }, 5000);
    }, 4000);
}

function atualizarStepperUI(stepAtual) {
    const steps = document.querySelectorAll("#stepperPedido .step");
    steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        
        // Limpa classes anteriores
        step.classList.remove("active", "completed");
        
        if(stepNum < stepAtual) {
            // Se já passou, fica verde (completed)
            step.classList.add("completed");
        } else if (stepNum === stepAtual) {
            // Se é o atual, fica laranja e pulsa (active)
            step.classList.add("active");
        }
    });
}

// ---------- LOGIN E CADASTRO ----------
const loginModal = document.getElementById("loginModal");

// Se clicar em Login na Nav, e não estiver logado, abre modal.
document.getElementById("openLoginModalBtn").onclick = () => {
    if(!usuarioLogado) loginModal.classList.add("active");
};

document.getElementById("closeLoginModal").onclick = () => loginModal.classList.remove("active");

const tabLogin = document.getElementById("tabLogin"), tabCadastro = document.getElementById("tabCadastro");
const loginDiv = document.getElementById("loginForm"), cadastroDiv = document.getElementById("cadastroForm");

tabLogin.onclick = () => { loginDiv.style.display = "block"; cadastroDiv.style.display = "none"; tabLogin.style.background = "var(--laranja-queimado)"; tabLogin.style.color = "white"; tabCadastro.style.background = "#ddd"; tabCadastro.style.color = "var(--text-dark)"; };
tabCadastro.onclick = () => { loginDiv.style.display = "none"; cadastroDiv.style.display = "block"; tabCadastro.style.background = "var(--laranja-queimado)"; tabCadastro.style.color = "white"; tabLogin.style.background = "#ddd"; tabLogin.style.color = "var(--text-dark)"; };

document.getElementById("btnLoginSubmit").onclick = () => {
    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    
    if(user){
        usuarioLogado = user;
        document.getElementById("loginMsg").innerText = "";
        loginModal.classList.remove("active");
        atualizarUIComUsuario();
        
        // Redireciona para o cardápio após o login
        mostrarScreen("cardapio");
    } else {
        document.getElementById("loginMsg").innerText = "E-mail ou senha inválidos";
    }
};

document.getElementById("btnCadastroSubmit").onclick = () => {
    const nome = document.getElementById("cadNome").value;
    const email = document.getElementById("cadEmail").value;
    const senha = document.getElementById("cadSenha").value;
    const consent = document.getElementById("consentimentoLGPD").checked;
    
    if(!nome || !email || !senha){ document.getElementById("cadMsg").innerText = "Preencha todos os campos."; return; }
    if(!consent){ document.getElementById("cadMsg").innerText = "Você precisa aceitar a LGPD e o programa de fidelidade."; return; }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){ document.getElementById("cadMsg").innerText = "E-mail inválido."; return; }
    if(senha.length < 6 || !/\d/.test(senha)){ document.getElementById("cadMsg").innerText = "Senha fraca: mínimo 6 caracteres e um número."; return; }
    if(usuarios.find(u=>u.email===email)){ document.getElementById("cadMsg").innerText = "E-mail já cadastrado."; return; }
    
    const novoUsuario = { email, senha, nome, pontos: 50 };
    usuarios.push(novoUsuario);
    usuarioLogado = novoUsuario;
    
    loginModal.classList.remove("active");
    atualizarUIComUsuario();
    alert(`Bem-vindo ${nome}! Você ganhou 50 pontos de boas-vindas.`);
    
    // Redireciona para o cardápio
    mostrarScreen("cardapio");
};

// ---------- NAVEGAÇÃO ENTRE TELAS (SPA) ----------
function mostrarScreen(screenId){
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active-screen"));
    document.getElementById(`${screenId}Screen`).classList.add("active-screen");
    currentScreen = screenId;
    
    if(screenId === "cardapio"){
        const unidade = document.getElementById("unidadeSelect").value;
        renderCardapioPorUnidade(unidade);
    }
    if(screenId === "carrinho") renderCarrinho();
    
    window.scrollTo(0, 0);
}

document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
        mostrarScreen(btn.dataset.nav);
    });
});

document.getElementById("unidadeSelect").addEventListener("change", (e) => renderCardapioPorUnidade(e.target.value));

// ---------- INICIALIZAÇÃO ----------
function renderHomeDestaques(){
    const destaques = produtosMock.slice(0,3);
    const containerHome = document.getElementById("destaquesHome");
    containerHome.innerHTML = destaques.map(p => `
        <div class="produto-item">
            <strong>${p.nome}</strong><br>R$ ${p.preco.toFixed(2).replace('.', ',')}
        </div>
    `).join('');
}

renderHomeDestaques();
atualizarUIComUsuario();

// Variável global para guardar o pedido atual e exibir na nota
let ultimoPedido = [];

// Função auxiliar para capturar a hora atual (ex: "14:30")
function obterHoraAtual() {
    const agora = new Date();
    return agora.getHours().toString().padStart(2, '0') + ':' + agora.getMinutes().toString().padStart(2, '0');
}

// ---------- FLUXO DE PAGAMENTO E STATUS AUTOMÁTICO ----------
document.getElementById("finalizarCompraBtn").addEventListener("click", () => {
    if(!usuarioLogado) { alert("Você precisa estar logado para finalizar!"); return; }
    if(carrinho.length === 0) { alert("Adicione itens ao carrinho primeiro."); return; }

    const formaPagto = document.getElementById("formaPagamento").options[document.getElementById("formaPagamento").selectedIndex].text;
    const modalPag = document.getElementById("paymentModal");
    const msgP = document.getElementById("paymentMsg");
    
    modalPag.classList.add("active");
    msgP.innerText = `Processando pagamento via ${formaPagto}...`;
    
    // Simula API de pagamento
    setTimeout(() => {
        msgP.innerText = "✅ Pagamento aprovado! Preparando seu pedido...";
        
        setTimeout(() => {
            modalPag.classList.remove("active");
            
            // 1. Salva o carrinho atual em ultimoPedido antes de limpar
            ultimoPedido = [...carrinho];
            renderResumoItensPedido(); // Preenche o cartão branco
            
            // 2. Lógica Pós-Pagamento
            const totalCompra = carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0) - descontoAplicado;
            const pontosGanhos = Math.floor(totalCompra);
            
            usuarioLogado.pontos += pontosGanhos;
            pontosFidelidade = usuarioLogado.pontos;
            
            carrinho = [];
            descontoAplicado = 0;
            document.getElementById("descontoInfo").innerHTML = "";
            atualizarUIComUsuario();
            
            // 3. Inicia o Stepper Automático
            iniciarFluxoAutomaticoPedido();
        }, 1500);
    }, 2000);
});

// Preenche a lista do cartão branco "Itens do Pedido"
function renderResumoItensPedido() {
    const container = document.getElementById("orderSummaryList");
    let html = '';
    
    ultimoPedido.forEach(item => {
        // Tenta achar a imagem mockada ou usa um emoji padrão de prato
        const produtoMock = produtosMock.find(p => p.id === item.id);
        const icone = produtoMock && produtoMock.imagem ? produtoMock.imagem : "🍲";
        
        html += `
            <div class="order-item-row">
                <div class="order-item-info">
                    <span>${icone}</span>
                    <span>${item.nome} &times; ${item.quantidade}</span>
                </div>
                <div class="order-item-price">
                    R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function iniciarFluxoAutomaticoPedido() {
    // Esconde o layout do carrinho e mostra a tela de Status
    document.getElementById("cartContent").style.display = "none";
    document.getElementById("statusContent").style.display = "block";
    
    // Limpa horários antigos
    document.getElementById("time1").innerText = "--:--";
    document.getElementById("time2").innerText = "--:--";
    document.getElementById("time3").innerText = "--:--";
    
    // Etapa 1: Recebido
    atualizarStepperUI(1);

    // Passa para Etapa 2 (Em Preparação) após 3 segundos
    setTimeout(() => {
        atualizarStepperUI(2);
        
        // Passa para Etapa 3 (Pronto) após mais 4 segundos
        setTimeout(() => {
            atualizarStepperUI(3);
            
            // Reseta para a tela de carrinho limpa após 15 segundos (para nova compra)
            setTimeout(() => {
                document.getElementById("cartContent").style.display = "flex";
                document.getElementById("statusContent").style.display = "none";
            }, 15000);

        }, 4000);
    }, 3000);
}

function atualizarStepperUI(stepAtual) {
    const steps = document.querySelectorAll("#stepperPedido .step");
    
    steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        
        // Remove classes
        step.classList.remove("active", "completed");
        
        if(stepNum < stepAtual) {
            // Se já passou, fica verde com texto riscado
            step.classList.add("completed");
        } else if (stepNum === stepAtual) {
            // Se é o atual, fica laranja e recebe o horário atualizado
            step.classList.add("active");
            document.getElementById(`time${stepNum}`).innerText = obterHoraAtual();
        }
    });
}