const formChamado = document.getElementById("form-chamado");
const mensagemStatus = document.getElementById("mensagem-status");
const botaoEnviar = document.getElementById("botao-enviar");

let idEmEdicao = null;

if (formChamado) {
    iniciarModoEdicao();

    formChamado.addEventListener("submit", async function (evento) {
        evento.preventDefault();

        const dadosChamado = {
            nome: document.getElementById("nome").value.trim(),
            setor: document.getElementById("setor").value.trim(),
            prioridade: document.getElementById("prioridade").value,
            descricao: document.getElementById("descricao").value.trim(),
        };

        if (!validarDadosChamado(dadosChamado)) {
            exibirMensagem("Preencha todos os campos antes de enviar.", "erro");
            return;
        }

        botaoEnviar.disabled = true;
        try {
            if (idEmEdicao !== null) {
                const ok = await editarChamado(idEmEdicao, {
                    descricao: dadosChamado.descricao,
                    prioridade: dadosChamado.prioridade,
                });
                if (!ok) throw new Error("falha ao editar");
                exibirMensagem("Chamado atualizado! Voltando para a lista...", "sucesso");
                setTimeout(() => (window.location.href = "chamados.html"), 900);
                return;
            }

            const chamadoCriado = await salvarChamado(dadosChamado);
            exibirMensagem(`Chamado #${chamadoCriado.id} registrado com sucesso!`, "sucesso");
            formChamado.reset();
        } catch (erro) {
            console.error(erro);
            exibirMensagem("Não foi possível salvar. Verifique a conexão e tente de novo.", "erro");
        } finally {
            botaoEnviar.disabled = false;
        }
    });
}

/** Se a URL tiver ?editar=ID, preenche o formulário com o chamado. */
async function iniciarModoEdicao() {
    const idParam = new URLSearchParams(window.location.search).get("editar");
    if (idParam === null) return;

    const chamado = await obterChamado(Number(idParam));
    if (!chamado) {
        exibirMensagem("Chamado não encontrado.", "erro");
        return;
    }

    idEmEdicao = chamado.id;
    document.getElementById("titulo-pagina").textContent = "Editar chamado #" + chamado.id;
    document.getElementById("subtitulo-pagina").textContent =
        "Você pode alterar a prioridade e a descrição do chamado.";
    botaoEnviar.textContent = "Salvar alterações";

    const campoNome = document.getElementById("nome");
    const campoSetor = document.getElementById("setor");
    campoNome.value = chamado.nome || "";
    campoSetor.value = chamado.setor;
    campoNome.readOnly = true;
    campoSetor.readOnly = true;
    document.getElementById("prioridade").value = chamado.prioridade;
    document.getElementById("descricao").value = chamado.descricao;
}

function validarDadosChamado(dados) {
    return dados.nome !== "" && dados.setor !== "" && dados.prioridade !== "" && dados.descricao !== "";
}

function exibirMensagem(texto, tipo) {
    if (!mensagemStatus) return;
    mensagemStatus.textContent = texto;
    mensagemStatus.className = "mensagem-status mensagem-status-" + tipo;
}
