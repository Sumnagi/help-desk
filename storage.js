// ===== Conexão com o Supabase =====
const SUPABASE_URL = "https://dsnznzqijyiqoqcfhgfq.supabase.co";
const SUPABASE_CHAVE = "sb_publishable_EAVcAw47A_4P7Aavdw6C2Q_BCy5Kb01";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_CHAVE);

/** Converte uma linha do banco para o formato usado pelo site. */
function converterLinha(l) {
    return {
        id: l.id,
        nome: l.nome,
        setor: l.setor,
        prioridade: l.prioridade,
        descricao: l.descricao,
        status: l.status,
        dataCriacao: l.data_criacao,
        dataEdicao: l.data_edicao,
    };
}

/** Busca todos os chamados. Retorna [] em caso de erro. */
async function listarChamados() {
    const { data, error } = await db.from("chamados").select("*").order("id", { ascending: false });
    if (error) {
        console.error("Erro ao listar chamados:", error);
        return [];
    }
    return data.map(converterLinha);
}

/** Busca um chamado pelo ID (ou null). */
async function obterChamado(id) {
    const { data, error } = await db.from("chamados").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return converterLinha(data);
}

/** Cadastra um novo chamado com status "Aberto". */
async function salvarChamado(dados) {
    const { data, error } = await db
        .from("chamados")
        .insert({
            nome: dados.nome,
            setor: dados.setor,
            prioridade: dados.prioridade,
            descricao: dados.descricao,
        })
        .select()
        .single();
    if (error) throw error;
    return converterLinha(data);
}

/** Atualiza o status de um chamado. */
async function atualizarStatus(id, novoStatus) {
    const { error } = await db.from("chamados").update({ status: novoStatus }).eq("id", id);
    if (error) console.error("Erro ao atualizar status:", error);
    return !error;
}

/** Altera descrição e prioridade. */
async function editarChamado(id, novosDados) {
    const { error } = await db
        .from("chamados")
        .update({
            descricao: novosDados.descricao,
            prioridade: novosDados.prioridade,
            data_edicao: new Date().toISOString(),
        })
        .eq("id", id);
    if (error) console.error("Erro ao editar chamado:", error);
    return !error;
}

/** Remove um chamado pelo ID. */
async function removerChamado(id) {
    const { error } = await db.from("chamados").delete().eq("id", id);
    if (error) console.error("Erro ao excluir chamado:", error);
    return !error;
}

/** Filtro combinado + busca (feito no navegador sobre a lista carregada). */
function filtrarLista(lista, { status = "Todos", prioridade = "Todas", termo = "" } = {}) {
    const busca = (termo || "").trim().toLowerCase();
    return lista.filter((c) => {
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

/** Ordena (devolve uma NOVA lista). */
function ordenarChamados(lista, criterio = "recentes") {
    const peso = { Alta: 3, Media: 2, Baixa: 1 };
    const copia = [...lista];
    if (criterio === "antigos") return copia.sort((a, b) => a.id - b.id);
    if (criterio === "prioridade") {
        return copia.sort((a, b) => (peso[b.prioridade] || 0) - (peso[a.prioridade] || 0) || b.id - a.id);
    }
    return copia.sort((a, b) => b.id - a.id);
}

/** Quantidade de chamados por status. */
function contarPorStatus(lista) {
    const contagem = { Aberto: 0, "Em andamento": 0, Resolvido: 0 };
    lista.forEach((c) => {
        if (contagem[c.status] !== undefined) contagem[c.status]++;
    });
    return contagem;
}

/** Gera o texto CSV (separador ";" e BOM para o Excel brasileiro). */
function gerarCSV(lista) {
    const cabecalho = ["ID", "Solicitante", "Setor", "Prioridade", "Status", "Descrição", "Data de criação"];

    const escapar = (valor) => {
        let texto = String(valor === undefined || valor === null ? "" : valor);
        if (/^[=+\-@]/.test(texto)) texto = "'" + texto;
        return '"' + texto.replace(/"/g, '""') + '"';
    };

    const linhas = lista.map((c) =>
        [c.id, c.nome, c.setor, c.prioridade, c.status, c.descricao, new Date(c.dataCriacao).toLocaleString("pt-BR")]
            .map(escapar)
            .join(";")
    );

    return "\uFEFF" + [cabecalho.map(escapar).join(";"), ...linhas].join("\r\n");
}
