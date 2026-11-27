const form = document.getElementById("form-login");
const msg = document.getElementById("mensagem-login");
const campoNome = document.getElementById("campo-nome");
const botaoAlternar = document.getElementById("alternar-modo");
const botaoLogin = document.getElementById("botao-login");
let modoCadastro = false;

obterSessao().then((s) => { if (s) window.location.href = "index.html"; });

botaoAlternar.addEventListener("click", () => {
    modoCadastro = !modoCadastro;
    campoNome.hidden = !modoCadastro;
    document.getElementById("login-nome").required = modoCadastro;
    document.getElementById("titulo-login").textContent = modoCadastro ? "Criar conta" : "Entrar";
    botaoLogin.textContent = modoCadastro ? "Criar conta" : "Entrar";
    botaoAlternar.textContent = modoCadastro ? "Já tenho conta" : "Não tenho conta";
    msg.textContent = "";
});

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const senha = document.getElementById("login-senha").value;
    msg.className = "mensagem-status";
    msg.textContent = "Aguarde...";

    if (modoCadastro) {
        const nome = document.getElementById("login-nome").value.trim();
        const { erro, sessao } = await cadastrar(nome, email, senha);
        if (erro) {
            msg.className = "mensagem-status mensagem-status-erro";
            msg.textContent = "Não foi possível criar a conta (e-mail já usado ou senha curta).";
            return;
        }
        if (!sessao) {
            msg.className = "mensagem-status mensagem-status-sucesso";
            msg.textContent = "Conta criada! Confirme seu e-mail e depois entre.";
            return;
        }
    } else {
        const erro = await entrar(email, senha);
        if (erro) {
            msg.className = "mensagem-status mensagem-status-erro";
            msg.textContent = "E-mail ou senha incorretos.";
            return;
        }
    }
    window.location.href = "index.html";
});
