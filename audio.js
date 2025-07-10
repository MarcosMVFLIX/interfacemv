// ==UserScript==
// @name         WhatsApp AutoResposta Áudio (última mensagem áudio só 1x)
// @namespace    http://tampermonkey.net/
// @version      1.11
// @description  Responde apenas a última mensagem de áudio nova, evita múltiplas respostas.
// @match        https://web.whatsapp.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const RESPONDIDOS_AUDIO_KEY = "msgs_audio_respondidas_ids";
    const MENSAGEM_AUDIO = "🔇 Olá! Não consigo ouvir áudios no momento. Por favor, envie sua mensagem por texto. 💬";

    let bloqueioEnvioGlobal = false;
    let debounceTimeout;

    function getHistoricoRespondidos() {
        const raw = localStorage.getItem(RESPONDIDOS_AUDIO_KEY);
        return raw ? JSON.parse(raw) : [];
    }

    function salvarHistoricoRespondidos(lista) {
        localStorage.setItem(RESPONDIDOS_AUDIO_KEY, JSON.stringify(lista.slice(-500)));
    }

    function gerarIdUnico(msgElement) {
        const texto = msgElement.innerText || "";
        const timestamp = msgElement.querySelector("span[data-pre-plain-text]")?.getAttribute("data-pre-plain-text") || "";
        return btoa(texto + timestamp);
    }

    function isAudioMessage(msgDiv) {
        const btns = msgDiv.querySelectorAll('button[aria-label]');
        for (const btn of btns) {
            const label = btn.getAttribute('aria-label').toLowerCase();
            if (label.includes('voz') || label.includes('áudio') || label.includes('audio')) {
                return true;
            }
        }
        const spans = msgDiv.querySelectorAll('span[aria-label]');
        for (const span of spans) {
            const label = span.getAttribute('aria-label').toLowerCase();
            if (label.includes('voz') || label.includes('áudio') || label.includes('audio')) {
                return true;
            }
        }
        return false;
    }

    function mensagemJaEnviada(texto) {
        const mensagensEnviadas = Array.from(document.querySelectorAll('div.message-out span.selectable-text'));
        return mensagensEnviadas.some(span => span.innerText === texto);
    }

    function limparInput() {
        const inputBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
        if (!inputBox) return false;

        inputBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('delete');
        return true;
    }

    function esperarMensagemNoDOM(texto, timeout = 6000) {
        return new Promise((resolve, reject) => {
            let timer = setTimeout(() => {
                observer.disconnect();
                reject("Timeout esperando mensagem aparecer no DOM");
            }, timeout);

            const observer = new MutationObserver(() => {
                if (mensagemJaEnviada(texto)) {
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve();
                }
            });

            const main = document.querySelector('#main');
            if (!main) {
                clearTimeout(timer);
                reject("Elemento #main não encontrado");
                return;
            }

            observer.observe(main, { childList: true, subtree: true });

            // Checagem imediata caso já esteja no DOM
            if (mensagemJaEnviada(texto)) {
                clearTimeout(timer);
                observer.disconnect();
                resolve();
            }
        });
    }

    async function enviarMensagem(texto) {
        if (bloqueioEnvioGlobal) throw new Error("Envio bloqueado");

        bloqueioEnvioGlobal = true;

        const inputBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
        if (!inputBox) {
            bloqueioEnvioGlobal = false;
            throw new Error("Campo de texto não encontrado");
        }

        if (!limparInput()) {
            bloqueioEnvioGlobal = false;
            throw new Error("Falha ao limpar campo de texto");
        }

        await new Promise(r => setTimeout(r, 300));
        document.execCommand('insertText', false, texto);
        inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));

        await new Promise(r => setTimeout(r, 600));

        const botaoEnviar = document.querySelector('button[data-tab="11"][aria-label="Enviar"]');
        if (!botaoEnviar) {
            bloqueioEnvioGlobal = false;
            throw new Error("Botão enviar não encontrado");
        }

        botaoEnviar.click();

        try {
            await esperarMensagemNoDOM(texto);
        } catch (err) {
            console.warn("Mensagem não detectada no DOM dentro do timeout, prosseguindo:", err);
        }

        await new Promise(r => setTimeout(r, 1500));

        bloqueioEnvioGlobal = false;
    }

    async function verificarUltimaMensagem() {
        if (bloqueioEnvioGlobal) return;
        if (debounceTimeout) return;

        debounceTimeout = setTimeout(() => {
            debounceTimeout = null;
        }, 1500);

        // Encontra todas mensagens de entrada que são áudios
        const mensagensAudio = Array.from(document.querySelectorAll("div.message-in")).filter(isAudioMessage);
        if (mensagensAudio.length === 0) return;

        // Pega só a última mensagem áudio (mais recente)
        const ultimaMsgAudio = mensagensAudio[mensagensAudio.length - 1];
        if (!ultimaMsgAudio) return;

        const idMsg = gerarIdUnico(ultimaMsgAudio);
        if (!idMsg) return;

        const historico = getHistoricoRespondidos();

        // Se já respondeu essa última mensagem, não faz nada
        if (historico.includes(idMsg)) return;

        // Se mensagem já existe na conversa (evita duplicação)
        if (mensagemJaEnviada(MENSAGEM_AUDIO)) return;

        // Salva o ID para não responder novamente
        historico.push(idMsg);
        salvarHistoricoRespondidos(historico);

        console.log(`✅ Áudio novo detectado. Respondendo mensagem com ID: ${idMsg}`);

        try {
            await enviarMensagem(MENSAGEM_AUDIO);
        } catch (e) {
            console.error("Erro no envio:", e);
        }
    }

    setInterval(verificarUltimaMensagem, 2000);
})();
