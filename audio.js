// ==UserScript==
// @name         WhatsApp AutoResposta Áudio (controle extra anti-duplicação)
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Evita ao máximo envio duplo, com bloqueio global e checagem no DOM.
// @match        https://web.whatsapp.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const RESPONDIDOS_AUDIO_KEY = "msgs_audio_respondidas_ids";
    const MENSAGEM_AUDIO = "🔇 Olá! Não consigo ouvir áudios no momento. Por favor, envie sua mensagem por texto. 💬";

    let bloqueioEnvioGlobal = false;

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

    // Função que verifica se a mensagem já foi enviada no DOM do chat (evita duplicação)
    function mensagemJaEnviada(texto) {
        // Busca todas mensagens enviadas (message-out)
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

    function enviarMensagem(texto) {
        return new Promise((resolve, reject) => {
            if (bloqueioEnvioGlobal) {
                console.log("🚫 Envio bloqueado globalmente para evitar duplicação");
                reject("envio bloqueado");
                return;
            }
            bloqueioEnvioGlobal = true;

            const inputBox = document.querySelector('div[contenteditable="true"][data-tab="10"]');
            if (!inputBox) {
                bloqueioEnvioGlobal = false;
                reject("inputBox not found");
                return;
            }

            if (!limparInput()) {
                bloqueioEnvioGlobal = false;
                reject("falha ao limpar input");
                return;
            }

            setTimeout(() => {
                document.execCommand('insertText', false, texto);
                inputBox.dispatchEvent(new InputEvent("input", { bubbles: true }));

                setTimeout(() => {
                    const botaoEnviar = document.querySelector('button[data-tab="11"][aria-label="Enviar"]');
                    if (botaoEnviar) {
                        botaoEnviar.click();

                        // Aguarda 1.5s para garantir envio e evita envio rápido duplicado
                        setTimeout(() => {
                            bloqueioEnvioGlobal = false;
                            resolve();
                        }, 1500);
                    } else {
                        bloqueioEnvioGlobal = false;
                        reject("botão enviar não encontrado");
                    }
                }, 700);
            }, 300);
        });
    }

    async function verificarUltimaMensagem() {
        if (bloqueioEnvioGlobal) return; // evita checar se já enviando

        const mensagens = Array.from(document.querySelectorAll("div.message-in"));
        if (mensagens.length === 0) return;

        const ultimaMsg = mensagens[mensagens.length - 1];
        if (!isAudioMessage(ultimaMsg)) return;

        const idMsg = gerarIdUnico(ultimaMsg);
        if (!idMsg) return;

        const historico = getHistoricoRespondidos();
        if (historico.includes(idMsg)) {
            return; // já respondeu
        }

        if (mensagemJaEnviada(MENSAGEM_AUDIO)) {
            // Mensagem já está no chat, evita enviar duplicado
            return;
        }

        // Marca que vai enviar e salva no histórico para bloquear reenvio
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
