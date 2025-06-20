// ==UserScript==

// @name WhatsApp Web - Auto Resposta Áudio Automática

// @namespace http://tampermonkey.net/

// @version 1.2

// @description Ativa automaticamente a auto resposta a áudios no WhatsApp Web, sem botão.

// @author YourName

// @match https://web.whatsapp.com/

// @grant none

// ==/UserScript==

(function () {

    'use strict';



    let lastAudioId = null;

    let messageObserver = null;

    let debounceTimer = null; // Novo timer para evitar chamadas múltiplas rápidas



    const MESSAGE_TO_SEND = "🔇 *Olá! Não consigo ouvir áudios no momento.* Por favor, envie sua mensagem por texto.";



    function getLastAudioId(msg) {

        const id = msg.getAttribute('data-id') || msg.dataset.id || msg.innerText?.slice(0, 30);

        return id; 

    }



    async function sendMessage(message) {

        const textarea = document.querySelector('#main div[contenteditable="true"]');

        if (!textarea) { 

            console.error("[Auto Resposta Áudio] Campo de texto não encontrado.");

            return false;

        }



        // --- SOLUÇÃO AQUI: Limpar o campo de texto antes de inserir ---

        textarea.innerHTML = ''; // Limpa o conteúdo HTML do textarea

        textarea.focus();

        // --- FIM DA SOLUÇÃO ---



        document.execCommand('insertText', false, message);

        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        await new Promise(r => setTimeout(r, 300));

        const sendButton = document.querySelector('#main [aria-label="Enviar"]');

        if (sendButton) {

            sendButton.click();

            return true;

        }

        console.error("[Auto Resposta Áudio] Botão de enviar não encontrado.");

        return false;

    }



    async function handleNewMessage() {

        const main = document.querySelector("#main");

        if (!main) return;



        const messages = main.querySelectorAll('.message-in');

        if (!messages.length) return;



        const lastMsg = messages[messages.length - 1];

        const isAudio = lastMsg.querySelector('[data-icon="ptt-status"]');

        if (!isAudio) return;



        const msgId = getLastAudioId(lastMsg);

        

        if (msgId === lastAudioId) {

            console.log("[Auto Resposta Áudio] Áudio já processado. Ignorando.");

            return;

        }



        lastAudioId = msgId;



        console.log("[Auto Resposta Áudio] Novo áudio detectado.");

        const sent = await sendMessage(MESSAGE_TO_SEND);

        if (sent) {

            console.log("[Auto Resposta Áudio] Mensagem enviada.");

        } else {

            console.warn("[Auto Resposta Áudio] Falha ao enviar.");

            // Opcional: Para permitir retentar em caso de falha de envio, descomente a linha abaixo.

            // lastAudioId = null; 

        }

    }



    function observeMessages() {

        const msgList = document.querySelector("#main .copyable-area");

        if (!msgList) {

            console.warn("[Auto Resposta Áudio] '.copyable-area' não encontrado para observação de mensagens.");

            return;

        }



        if (messageObserver) {

            messageObserver.disconnect();

            console.log("[Auto Resposta Áudio] Observador de mensagens existente desconectado.");

        }



        messageObserver = new MutationObserver((mutations) => {

            clearTimeout(debounceTimer); 

            debounceTimer = setTimeout(() => {

                const hasNewMessage = mutations.some(mutation => mutation.addedNodes.length > 0);

                if (hasNewMessage) {

                    handleNewMessage();

                }

            }, 100); 

        });



        messageObserver.observe(msgList, {

            childList: true,

            subtree: true,

        });



        console.log("[Auto Resposta Áudio] Observador de mensagens reiniciado.");

    }



    function observeMainPanel() {

        const app = document.getElementById('app');

        if (!app) {

            console.error("[Auto Resposta Áudio] Elemento 'app' do WhatsApp não encontrado.");

            return;

        }



        const mainObserver = new MutationObserver(() => {

            setTimeout(observeMessages, 500); 

        });



        mainObserver.observe(app, {

            childList: true,

            subtree: true,

        });



        console.log("[Auto Resposta Áudio] Observador do painel principal iniciado.");

    }



    if (document.readyState === 'loading') {

        document.addEventListener('DOMContentLoaded', observeMainPanel);

    } else {

        observeMainPanel();

    }

})(); 
 

