const containerLista = document.getElementById("lista-chamados");
const mensagemVazia = document.getElementById("mensagem-vazia");
const filtroStatus = document.getElementById("filtro-status");
const filtroPrioridade = document.getElementById("filtro-prioridade");
const campoBusca = document.getElementById("campo-busca");
const campoOrdem = document.getElementById("campo-ordem");
const botaoExportar = document.getElementById("botao-exportar");
const areaAdmin = document.getElementById("area-admin");
const botaoSair = document.getElementById("botao-sair");

const STATUS_DISPONIVEIS = ["Aberto", "Em andamento", "Resolvido"];
const NOMES_PRIORIDADE = { Baixa: "Baixa", Media: "Média", Alta: "Alta" };

// Precisa ficar antes de iniciar() ser chamada
let souAdmin = false;

[filtroStatus, filtroPrioridade, campoOrdem].forEach((el) =>
    el.addEventListener("change", renderizarLista)
);
campoBusca.addEventListener("input", renderizarLista);
botaoExportar.addEventListener("click", exportarCSV);

botaoSair.addEventListener("click", async () => {
    await sair();
    window.location.href = "login.html";
});

/** Exige login. Admin vê tudo e pode gerenciar; usuário comum vê só os seus chamados. */
async function iniciar() {
    const sessao = await obterSessao();
    if (!sessao) {
        window.location.href = "login.html";
        return;
    }
    souAdmin = await ehAdmin();
    areaAdmin.hidden = false;
    document.getElementById("titulo-lista").textContent = souAdmin
        ? "Lista de chamados"
        : "Meus chamados";
    botaoExportar.hidden = !souAdmin;
    renderizarLista();
}

iniciar();

/** Carrega os chamados do banco, aplica filtros/ordem e desenha a lista. */
async function renderizarLista() {
    const todos = await listarChamados();
    atualizarContadores(todos);

    const filtrados = filtrarLista(todos, {
        status: filtroStatus.value,
        prioridade: filtroPrioridade.value,
        termo: campoBusca.value,
    });
    const chamados = ordenarChamados(filtrados, campoOrdem.value);

    containerLista.replaceChildren();

    if (chamados.length === 0) {
        mensagemVazia.hidden = false;
        return;
    }
    mensagemVazia.hidden = true;

    chamados.forEach((chamado) => {
        containerLista.appendChild(criarCartaoChamado(chamado));
    });
}

/** Mostra quantos chamados há em cada status (total, sem filtros). */
function atualizarContadores(todos) {
    const contagem = contarPorStatus(todos);
    const campos = {
        "contador-aberto": contagem["Aberto"],
        "contador-andamento": contagem["Em andamento"],
        "contador-resolvido": contagem["Resolvido"],
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);
        if (elemento) elemento.textContent = valor;
    });
}

/** Baixa um arquivo CSV com todos os chamados (só administrador). */
async function exportarCSV() {
    if (!souAdmin) return;

    const todos = await listarChamados();
    if (todos.length === 0) {
        alert("Não há chamados para exportar.");
        return;
    }

    const blob = new Blob([gerarCSV(todos)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chamados.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/** Cria um elemento com texto seguro (textContent). */
function criarElemento(tag, classe, texto) {
    const el = document.createElement(tag);
    if (classe) el.className = classe;
    if (texto !== undefined) el.textContent = texto;
    return el;
}

/** Cria um par "Rótulo: valor" com o valor como texto puro. */
function criarDetalhe(rotulo, valor) {
    const span = document.createElement("span");
    span.appendChild(criarElemento("strong", "", rotulo + " "));
    span.appendChild(document.createTextNode(valor));
    return span;
}

function criarCartaoChamado(chamado) {
    const cartao = criarElemento("article", "cartao-chamado");

    const topo = criarElemento("div", "cartao-chamado-topo");
    topo.appendChild(criarElemento("span", "numero-chamado", "#" + chamado.id));
    topo.appendChild(
        criarElemento(
            "span",
            "badge-prioridade prioridade-" + String(chamado.prioridade).toLowerCase(),
            NOMES_PRIORIDADE[chamado.prioridade] || chamado.prioridade
        )
    );

    const descricao = criarElemento("p", "descricao-chamado", chamado.descricao);

    const detalhes = criarElemento("div", "detalhes-chamado");
    detalhes.appendChild(criarDetalhe("Solicitante:", chamado.nome || "—"));
    detalhes.appendChild(criarDetalhe("Setor:", chamado.setor));
    detalhes.appendChild(
        criarDetalhe("Data:", new Date(chamado.dataCriacao).toLocaleDateString("pt-BR"))
    );

    const acoes = criarElemento("div", "acoes-chamado");

    if (souAdmin) {
        const selectStatus = document.createElement("select");
        selectStatus.setAttribute("aria-label", "Alterar status do chamado " + chamado.id);
        STATUS_DISPONIVEIS.forEach((status) => {
            const opcao = criarElemento("option", "", status);
            opcao.value = status;
            opcao.selected = status === chamado.status;
            selectStatus.appendChild(opcao);
        });
        selectStatus.addEventListener("change", async () => {
            await atualizarStatus(chamado.id, selectStatus.value);
            renderizarLista();
        });

        const linkEditar = criarElemento("a", "botao-editar", "Editar");
        linkEditar.href = "index.html?editar=" + chamado.id;

        const botaoExcluir = criarElemento("button", "botao-excluir", "Excluir");
        botaoExcluir.type = "button";
        botaoExcluir.addEventListener("click", async () => {
            if (confirm(`Excluir o chamado #${chamado.id}? Esta ação não pode ser desfeita.`)) {
                await removerChamado(chamado.id);
                renderizarLista();
            }
        });

        acoes.append(selectStatus, linkEditar, botaoExcluir);
    } else {
        // Usuário comum só acompanha o status
        acoes.appendChild(criarDetalhe("Status:", chamado.status));
    }

    cartao.append(topo, descricao, detalhes, acoes);
    return cartao;
}
