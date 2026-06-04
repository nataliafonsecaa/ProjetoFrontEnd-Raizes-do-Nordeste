// ---------- MOCK DATA ----------
const produtosMock = [
    { id: 1, nome: "Tapioca de Carne de Sol", preco: 25.9, unidadeDisponivel: ["Tupã","Marília","Presidente Prudente"], disponivel: true, sazonal: false, imagem: "🌮", imagem:"img/bolo-de-macaxeira-com-coco.jpg"},
    { id: 2, nome: "Cuscuz Recheado (Queijo Coalho)", preco: 29.5, unidadeDisponivel: ["Tupã","Marília"], disponivel: true, sazonal: false,  imagem:"img/bolo-de-milho.webp" },
    { id: 3, nome: "Bolo de Macaxeira com Coco", preco: 12.0, unidadeDisponivel: ["Tupã","Marília","Presidente Prudente"], disponivel: true, sazonal: false,  imagem:"img/bolo-de-rolo.jpg" },
    { id: 4, nome: "Caldo de Mocotó", preco: 26.0, unidadeDisponivel: ["Tupã"], disponivel: true, sazonal: false, imagem:"img/buchada-de-bode.jpg" },
    { id: 5, nome: "Carne de Sol com Macaxeira", preco: 45.0, unidadeDisponivel: ["Tupã","Marília","Presidente Prudente"], disponivel: true, sazonal: false,imagem:"img/caldo-de-mocoto.webp" },
    { id: 6, nome: "Bolo de Milho (Período Junino)", preco: 10.9, unidadeDisponivel: ["Marília","Presidente Prudente"], disponivel: true, sazonal: true, badge: "Sazonal - Junino", imagem:"img/carne-de-sol-com-macaxeira.jpg" },
    { id: 7, nome: "Bolo de Rolo", preco: 15.5, unidadeDisponivel: ["Tupã", "Marília"], disponivel: false, sazonal: false, imagem:"img/cuscuz-queijo.jpg" },
    { id: 8, nome: "Sarapatel", preco: 55.0, unidadeDisponivel: ["Tupã","Marília"], disponivel: true, sazonal: false, imagem:"img/sarapatel.webp" },
    { id:9, nome: "Buchada de Bode", preco: 65.5, unidadeDisponivel: ["Presidente Prudente", "Tupã", "Marília"], disponivel: true, sazonal: false, imagem:"img/tapioca-de-carne-seca.webp" }
];

// Estado da aplicação
let carrinho = []; 
let usuarioLogado = null;
let pontosFidelidade = 0;
let descontoAplicado = 0; 
let currentScreen = "home";

// Dados de usuários (mock)
let usuarios = [{ email: "cliente@raizes.com", senha: "Nordeste123", nome: "Cliente Raízes", pontos: 120 }];

// ======================= LGPD =======================
if (!localStorage.getItem("lgpdConsent")) {
    document.getElementById("lgpdModal").classList.add("active");
}

document.getElementById("aceitarCookies").onclick = () => { 
    localStorage.setItem("lgpdConsent","aceito"); 
    fecharLGPD(); 
};
document.getElementById("rejeitarCookies").onclick = () => { 
    localStorage.setItem("lgpdConsent","rejeitado"); 
    fecharLGPD(); 
};
function fecharLGPD() { 
    document.getElementById("lgpdModal").classList.remove("active"); 
}
document.getElementById("politicaLink").onclick = (e) => { 
    e.preventDefault(); 
    alert("Política de Privacidade simulada: seus dados são usados apenas para fidelidade."); 
};

function atualizarUIComUsuario() {
    const btnNavLogin = document.getElementById("openLoginModalBtn");
    if(usuarioLogado){
        pontosFidelidade = usuarioLogado.pontos;
        document.getElementById("pontosUsuario").innerText = pontosFidelidade;
        const primeiroNome = usuarioLogado.nome.split(" ")[0];
        btnNavLogin.innerHTML = `👤 Olá, ${primeiroNome}`;
    } else {
        pontosFidelidade = 0;
        document.getElementById("pontosUsuario").innerText = 0;
        btnNavLogin.innerHTML = `Login`;
    }
    renderCarrinho();
}

function renderCardapioPorUnidade(unidade) {
    const container = document.getElementById("cardapioDinamico");
    const produtosFiltrados = produtosMock.filter(p => p.unidadeDisponivel.includes(unidade));
    if(produtosFiltrados.length === 0) { 
        container.innerHTML = "<p>Nenhum produto nesta unidade.</p>"; 
        return; 
    }
    container.innerHTML = produtosFiltrados.map(prod => {
        let disponivelNaUnidade = prod.disponivel;
        let badgeHtml = "";
        if(!disponivelNaUnidade) badgeHtml = "<span class='badge badge-indisponivel'>❌ Indisponível</span>";
        else if(prod.sazonal) badgeHtml = "<span class='badge badge-sazonal'>🌽 Sazonal (Junino)</span>";
        const disabledAttr = (!disponivelNaUnidade) ? "disabled" : "";
        const imgSrc = prod.imagem ? prod.imagem : 'img/placeholder.png';
        return `
        <div class="produto-item">
            <div class="produto-imagem-container">
                <img src="${imgSrc}" alt="${prod.nome}" class="produto-img">
            </div>
            <div class="produto-info">
                <div style="font-weight:bold;">${prod.nome}</div>
                <div style="margin-bottom:10px; color: var(--laranja-queimado); font-weight: 600;">R$ ${prod.preco.toFixed(2).replace('.', ',')}</div>
                ${badgeHtml}
            </div>
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

// ======================= FIDELIDADE =======================
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

// ======================= PAGAMENTO (PIX) =======================
document.getElementById("formaPagamento").addEventListener("change", (e) => {
    const pixContainer = document.getElementById("pixContainer");
    if(e.target.value === "pix") {
        pixContainer.style.display = "block";
    } else {
        pixContainer.style.display = "none";
    }
});

// ======================= STEPPER (sem horários, só classes) =======================
function atualizarStepperUI(stepAtual) {
    const steps = document.querySelectorAll("#stepperPedido .step");
    steps.forEach((step, idx) => {
        const stepNum = idx + 1;
        step.classList.remove("active", "completed");
        if(stepNum < stepAtual) {
            step.classList.add("completed");
        } else if (stepNum === stepAtual) {
            step.classList.add("active");
        }
    });
}

function iniciarFluxoAutomaticoPedido() {
    // Esconde o carrinho e mostra o stepper
    document.getElementById("cartContent").style.display = "none";
    document.getElementById("statusContent").style.display = "block";
    
    // Etapa 1: Recebido
    atualizarStepperUI(1);
    document.getElementById("statusMsg").innerText = "Pedido recebido com sucesso! A cozinha já foi notificada.";
    
    setTimeout(() => {
        atualizarStepperUI(2);
        document.getElementById("statusMsg").innerText = "Seu pedido está em preparação. Cheirinho de comida boa no ar!";
        setTimeout(() => {
            atualizarStepperUI(3);
            document.getElementById("statusMsg").innerHTML = "<strong>Pronto para retirada! 🎉</strong> Pode vir buscar sua delícia nordestina.";
            // Reseta após 10 segundos
            setTimeout(() => {
                document.getElementById("cartContent").style.display = "flex";
                document.getElementById("statusContent").style.display = "none";
                atualizarStepperUI(0);
            }, 10000);
        }, 5000);
    }, 4000);
}

// ======================= FLUXO DE PAGAMENTO =======================
document.getElementById("finalizarCompraBtn").addEventListener("click", () => {
    if(!usuarioLogado) { alert("Você precisa estar logado para finalizar!"); return; }
    if(carrinho.length === 0) { alert("Adicione itens ao carrinho primeiro."); return; }

    const formaPagto = document.getElementById("formaPagamento").options[document.getElementById("formaPagamento").selectedIndex].text;
    const modalPag = document.getElementById("paymentModal");
    const msgP = document.getElementById("paymentMsg");
    
    modalPag.classList.add("active");
    msgP.innerText = `Processando pagamento via ${formaPagto}...`;
    
    setTimeout(() => {
        msgP.innerText = "✅ Pagamento aprovado! Preparando seu pedido...";
        setTimeout(() => {
            modalPag.classList.remove("active");
            
            // Calcula pontos ganhos
            const totalCompra = carrinho.reduce((acc, i) => acc + (i.preco * i.quantidade), 0) - descontoAplicado;
            const pontosGanhos = Math.floor(totalCompra);
            usuarioLogado.pontos += pontosGanhos;
            pontosFidelidade = usuarioLogado.pontos;
            
            // Limpa carrinho e descontos
            carrinho = [];
            descontoAplicado = 0;
            document.getElementById("descontoInfo").innerHTML = "";
            atualizarUIComUsuario();
            
            // Inicia o Stepper
            iniciarFluxoAutomaticoPedido();
        }, 1500);
    }, 2000);
});

// ======================= LOGIN E CADASTRO =======================
const loginModal = document.getElementById("loginModal");
document.getElementById("openLoginModalBtn").onclick = () => {
    if(!usuarioLogado) loginModal.classList.add("active");
};
document.getElementById("closeLoginModal").onclick = () => loginModal.classList.remove("active");

const tabLogin = document.getElementById("tabLogin");
const tabCadastro = document.getElementById("tabCadastro");
const loginDiv = document.getElementById("loginForm");
const cadastroDiv = document.getElementById("cadastroForm");

tabLogin.onclick = () => { 
    loginDiv.style.display = "block"; 
    cadastroDiv.style.display = "none"; 
    tabLogin.style.background = "var(--laranja-queimado)"; 
    tabLogin.style.color = "white"; 
    tabCadastro.style.background = "#ddd"; 
    tabCadastro.style.color = "var(--text-dark)"; 
};
tabCadastro.onclick = () => { 
    loginDiv.style.display = "none"; 
    cadastroDiv.style.display = "block"; 
    tabCadastro.style.background = "var(--laranja-queimado)"; 
    tabCadastro.style.color = "white"; 
    tabLogin.style.background = "#ddd"; 
    tabLogin.style.color = "var(--text-dark)"; 
};

document.getElementById("btnLoginSubmit").onclick = () => {
    const email = document.getElementById("loginEmail").value;
    const senha = document.getElementById("loginSenha").value;
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if(user){
        usuarioLogado = user;
        document.getElementById("loginMsg").innerText = "";
        loginModal.classList.remove("active");
        atualizarUIComUsuario();
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
    mostrarScreen("cardapio");
};

// ======================= NAVEGAÇÃO SPA =======================
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
        const navTo = btn.dataset.nav;
        if(navTo) mostrarScreen(navTo);
    });
});

document.getElementById("unidadeSelect").addEventListener("change", (e) => renderCardapioPorUnidade(e.target.value));

// ======================= INICIALIZAÇÃO =======================
function renderHomeDestaques(){
    const destaques = produtosMock.slice(0,4);
    const containerHome = document.getElementById("destaquesHome");
    containerHome.innerHTML = destaques.map(p => {
        const imgSrc = p.imagem ? p.imagem : 'img/bolo-de-rolo.jpg';
        
        return `
        <div class="produto-item">
            <div class="produto-imagem-container">
                <img src="${imgSrc}" alt="${p.nome}" class="produto-img">
            </div>
            <div class="produto-info">
                <strong>${p.nome}</strong><br>
                <span style="color: var(--laranja-queimado); font-weight: 600;">
                    R$ ${p.preco.toFixed(2).replace('.', ',')}
                </span>
            </div>
        </div>
        `;
    }).join('');
}


renderHomeDestaques();
atualizarUIComUsuario();
mostrarScreen("home");