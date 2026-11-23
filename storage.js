
const CHAVE_STORAGE = "chamados";

/** Busca todos os chamados salvos. Retorna [] se vazio ou corrompido. */
function listarChamados() {
    try {
        const dados = localStorage.getItem(CHAVE_STORAGE);
        return dados ? JSON.parse(dados) : [];
    } catch (erro) {
        console.error("Erro ao ler o LocalStorage:", erro);
        return [];
    }
}

/** Salva a lista completa de chamados. */
function salvarListaCompleta(chamados) {
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(chamados));
}

/** Gera um novo ID incremental. */
function gerarNovoID() {
    const chamados = listarChamados();
    if (chamados.length === 0) return 1;
    return Math.max(...chamados.map((c) => c.id)) + 1;
}

/** Busca um chamado pelo ID (ou null). */
function obterChamado(id) {
    return listarChamados().find((c) => c.id === id) || null;
}

/** Cadastra um novo chamado com status "Aberto". */
function salvarChamado(dadosChamado) {
    const chamados = listarChamados();

    const novoChamado = {
        id: gerarNovoID(),
        nome: dadosChamado.nome,
        setor: dadosChamado.setor,
        prioridade: dadosChamado.prioridade,
        descricao: dadosChamado.descricao,
        status: "Aberto",
        dataCriacao: new Date().toISOString(),
    };

    chamados.push(novoChamado);
    salvarListaCompleta(chamados);
    return novoChamado;
}

/**
 * Atualiza o status de um chamado.
 * @param {Number} id
 * @param {String} novoStatus - "Aberto" | "Em andamento" | "Resolvido"
 * @return {Boolean}
 */
function atualizarStatus(id, novoStatus) {
    const chamados = listarChamados();
    const chamado = chamados.find((c) => c.id === id);

    if (!chamado) {
        console.warn(`Chamado com id ${id} não encontrado`);
        return false;
    }

    chamado.status = novoStatus;
    salvarListaCompleta(chamados);
    return true;
}

/**
 * EDITAR CHAMADO - altera descrição e prioridade.
 * @param {Number} id
 * @param {{descricao: String, prioridade: String}} novosDados
 * @return {Boolean}
 */
function editarChamado(id, novosDados) {
    const chamados = listarChamados();
    const chamado = chamados.find((c) => c.id === id);

    if (!chamado) {
        console.warn(`Chamado com id ${id} não encontrado`);
        return false;
    }

    chamado.descricao = novosDados.descricao;
    chamado.prioridade = novosDados.prioridade;
    chamado.dataEdicao = new Date().toISOString();
    salvarListaCompleta(chamados);
    return true;
}

/** Filtra por status. "Todos" ou vazio devolve tudo. */
function filtrarPorStatus(status) {
    return filtrarChamados({ status });
}

/**
 * FILTRO COMBINADO + BUSCA - todos os critérios são opcionais e se somam.
 * @param {{status?: String, prioridade?: String, termo?: String}} criterios
 * @return {Array}
 */
function filtrarChamados({ status = "Todos", prioridade = "Todas", termo = "" } = {}) {
    const busca = (termo || "").trim().toLowerCase();

    return listarChamados().filter((c) => {
        const okStatus = !status || status === "Todos" || c.status === status;
        const okPrioridade = !prioridade || prioridade === "Todas" || c.prioridade === prioridade;
        const okTexto =
            busca === "" ||
            [c.nome, c.setor, c.descricao].some((campo) =>
                String(campo || "").toLowerCase().includes(busca)
            );
        return okStatus && okPrioridade && okTexto;
    });
}

/** BUSCA POR TEXTO - solicitante, setor ou descrição (combina com status). */
function buscarPorTexto(termo, status = "Todos") {
    return filtrarChamados({ termo, status });
}

/**
 * ORDENAR - devolve uma NOVA lista ordenada.
 * @param {Array} lista
 * @param {String} criterio - "recentes" | "antigos" | "prioridade"
 */
function ordenarChamados(lista, criterio = "recentes") {
    const peso = { Alta: 3, Media: 2, Baixa: 1 };
    const copia = [...lista];

    if (criterio === "antigos") {
        return copia.sort((a, b) => a.id - b.id);
    }
    if (criterio === "prioridade") {
        return copia.sort((a, b) => (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0) || b.id - a.id);
    }
    return copia.sort((a, b) => b.id - a.id); // recentes primeiro
}

/** CONTADOR - quantidade de chamados por status. */
function contarPorStatus() {
    const contagem = { Aberto: 0, "Em andamento": 0, Resolvido: 0 };
    listarChamados().forEach((c) => {
        if (contagem[c.status] !== undefined) contagem[c.status]++;
    });
    return contagem;
}

/**
 * EXPORTAR CSV - devolve o texto CSV de todos os chamados
 * (separador ";" e BOM para abrir direto no Excel brasileiro).
 * Valores que começam com = + - @ ganham um apóstrofo para evitar
 * injeção de fórmulas na planilha.
 * @return {String}
 */
function gerarCSV() {
    const cabecalho = ["ID", "Solicitante", "Setor", "Prioridade", "Status", "Descrição", "Data de criação"];

    const escapar = (valor) => {
        let texto = String(valor === undefined || valor === null ? "" : valor);
        if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
        return '"' + texto.replace(/"/g, '""') + '"';
    };

    const linhas = listarChamados().map((c) =>
        [
            c.id,
            c.nome,
            c.setor,
            c.prioridade,
            c.status,
            c.descricao,
            new Date(c.dataCriacao).toLocaleString("pt-BR"),
        ]
            .map(escapar)
            .join(";")
    );

    return "\uFEFF" + [cabecalho.map(escapar).join(";"), ...linhas].join("\r\n");
}

/** EXCLUIR - remove um chamado pelo ID. */
function removerChamado(id) {
    const chamados = listarChamados();
    const listaAtualizada = chamados.filter((c) => c.id !== id);

    if (listaAtualizada.length === chamados.length) {
        console.warn(`Chamado com id ${id} não encontrado`);
        return false;
    }
    salvarListaCompleta(listaAtualizada);
    return true;
}

/** Limpa todos os chamados. */
function limparTodosChamados() {
    localStorage.removeItem(CHAVE_STORAGE);
}