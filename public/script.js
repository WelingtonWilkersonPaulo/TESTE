async function enviarPergunta() {
    const input = document.getElementById('user-input');
    const log = document.getElementById('chat-log');
    const texto = input.value;

    if (!texto) return;

    // Mostra o que o usuário digitou
    log.innerHTML += `<div class="msg user"><b>Você:</b> ${texto}</div>`;
    input.value = '';

    try {
        const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: textoDigitado }) // O campo deve ser 'pergunta'
        });

        const data = await response.json();
        log.innerHTML += `<div class="msg bot"><b>Dev:</b> ${data.resposta}</div>`;
        log.scrollTop = log.scrollHeight; // Scroll automático
    } catch (error) {
        log.innerHTML += `<div class="msg bot" style="background: red">Erro ao conectar com o servidor!</div>`;
    }
}