
const formChamado = document.getElementById("form-chamado");
const mensagemStatus = document.getElementById("mensagem-status");

let idEmEdicao = null;

if (formChamado) {
    iniciarModoEdicao();

    formChamado.addEventListener("submit", function (evento) {
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

        if (idEmEdicao !== null) {
            editarChamado(idEmEdicao, {
                descricao: dadosChamado.descricao,
                prioridade: dadosChamado.prioridade,
            });
            exibirMensagem("Chamado atualizado! Voltando para a lista...", "sucesso");
            setTimeout(() => (window.location.href = "chamados.html"), 900);
            return;
        }

        const chamadoCriado = salvarChamado(dadosChamado);
        exibirMensagem(`Chamado #${chamadoCriado.id} registrado com sucesso!`, "sucesso");
        formChamado.reset();
    });
}

/** Se a URL tiver ?editar=ID, preenche o formulário com o chamado. */
function iniciarModoEdicao() {
    const idParam = new URLSearchParams(window.location.search).get("editar");
    if (idParam === null) return;

    const chamado = obterChamado(Number(idParam));
    if (!chamado) {
        exibirMensagem("Chamado não encontrado.", "erro");
        return;
    }

    idEmEdicao = chamado.id;
    document.getElementById("titulo-pagina").textContent = "Editar chamado #" + chamado.id;
    document.getElementById("subtitulo-pagina").textContent =
        "Você pode alterar a prioridade e a descrição do chamado.";
    document.getElementById("botao-enviar").textContent = "Salvar alterações";

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
    return (
        dados.nome !== "" &&
        dados.setor !== "" &&
        dados.prioridade !== "" &&
        dados.descricao !== ""
    );
}

function exibirMensagem(texto, tipo) {
    if (!mensagemStatus) return;
    mensagemStatus.textContent = texto;
    mensagemStatus.className = "mensagem-status mensagem-status-" + tipo;
}