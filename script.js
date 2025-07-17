// ==UserScript==
// @name         WhatsApp Automation MV (v5.2 - UI Ajustado)
// @namespace    http://tampermonkey.net/
// @version      5.2
// @description  Versão com ajustes de UI: barra de rolagem maior e posicionamento correto do botão Reanimar
// @author       Manus AI Assistant
// @match        https://web.whatsapp.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // =================================================================================
    // 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS
    // =================================================================================
    const CONFIG = {
        prefix: 'wa_mv_final_',
        selectors: {
            app: '#app',
            chatBox: 'div[contenteditable="true"][data-tab="10"]',
            sendButton: '[data-testid="send"], [aria-label="Enviar"]'
        },
        containerId: 'mv-automation-container',
        maxImages: 5,
        defaultColors: {
            customButtons: '#008069',
            waitButtons: '#6c757d',
            reanimateButton: '#ff6b35',
            menuButton: '#25d366'
        },
        themes: {
            default: {
                name: 'Padrão WhatsApp',
                primary: '#008069',
                secondary: '#00a884',
                accent: '#25d366',
                background: '#2a3942',
                surface: '#3b4a54'
            },
            dark: {
                name: 'Escuro Profissional',
                primary: '#1a1a1a',
                secondary: '#333333',
                accent: '#4a90e2',
                background: '#0d1117',
                surface: '#161b22'
            },
            colorful: {
                name: 'Colorido Vibrante',
                primary: '#e91e63',
                secondary: '#9c27b0',
                accent: '#ff5722',
                background: '#1a1a2e',
                surface: '#16213e'
            }
        }
    };

    // =================================================================================
    // 2. MÓDULO DE GERENCIAMENTO DE DADOS (LocalStorage)
    // =================================================================================
    const DataManager = {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(CONFIG.prefix + key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error(`[WA MV] Erro ao ler a chave ${key}:`, e);
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(CONFIG.prefix + key, JSON.stringify(value));
            } catch (e) {
                console.error(`[WA MV] Erro ao salvar a chave ${key}:`, e);
            }
        },
        loadAll: function() {
            return {
                customButtons: this.get('customButtons', [
                    { id: `btn_${Date.now()}`, name: '🚀 Pedido Saiu', message: 'Olá! Seu pedido saiu para entrega e chegará em breve! 🏍️' }
                ]),
                waitTimes: this.get('waitTimes', [
                    { text: '30 min', message: 'O tempo de espera estimado é de 30 minutos.' },
                    { text: '45 min', message: 'O tempo de espera estimado é de 45 minutos.' },
                    { text: '1h', message: 'O tempo de espera estimado é de 1 hora.' }
                ]),
                menu: this.get('menu', { text: 'Confira nosso delicioso cardápio!', images: [] }),
                reanimate: this.get('reanimate', {
                    text: 'Olá! Notamos que você estava interessado em fazer um pedido. Que tal finalizar agora? Temos uma oferta especial para você! 😊',
                    image: null
                }),
                colors: this.get('colors', CONFIG.defaultColors),
                general: this.get('general', {
                    autoHide: false,
                    autoHideDuration: 10,
                    waitTimePosition: 'top',
                    currentTheme: 'default',
                    soundEnabled: true,
                    animationsEnabled: true
                }),
                statistics: this.get('statistics', {
                    customButtonClicks: {},
                    waitTimeClicks: {},
                    menuClicks: 0,
                    reanimateClicks: 0,
                    totalClicks: 0,
                    firstUse: new Date().toISOString(),
                    lastUse: new Date().toISOString()
                }),
                quickReplies: this.get('quickReplies', [
                    { text: 'Obrigado!', message: 'Muito obrigado! 😊' },
                    { text: 'Aguarde', message: 'Por favor, aguarde um momento...' },
                    { text: 'Disponível', message: 'Sim, temos disponível!' }
                ])
            };
        },
        exportSettings: function() {
            const settings = this.loadAll();
            const exportData = {
                version: '5.2',
                timestamp: new Date().toISOString(),
                settings: settings
            };
            return JSON.stringify(exportData, null, 2);
        },
        importSettings: function(jsonData) {
            try {
                const importData = JSON.parse(jsonData);
                if (importData.settings) {
                    Object.keys(importData.settings).forEach(key => {
                        this.set(key, importData.settings[key]);
                    });
                    return true;
                }
                return false;
            } catch (e) {
                console.error('[WA MV] Erro ao importar configurações:', e);
                return false;
            }
        }
    };

    // =================================================================================
    // 3. MÓDULO DE ESTATÍSTICAS
    // =================================================================================
    const StatsManager = {
        updateStats: (type, buttonId = null) => {
            const stats = DataManager.get('statistics', {
                customButtonClicks: {},
                waitTimeClicks: {},
                menuClicks: 0,
                reanimateClicks: 0,
                totalClicks: 0,
                firstUse: new Date().toISOString(),
                lastUse: new Date().toISOString()
            });

            stats.totalClicks++;
            stats.lastUse = new Date().toISOString();

            switch (type) {
                case 'custom':
                    stats.customButtonClicks[buttonId] = (stats.customButtonClicks[buttonId] || 0) + 1;
                    break;
                case 'wait':
                    stats.waitTimeClicks[buttonId] = (stats.waitTimeClicks[buttonId] || 0) + 1;
                    break;
                case 'menu':
                    stats.menuClicks++;
                    break;
                case 'reanimate':
                    stats.reanimateClicks++;
                    break;
            }

            DataManager.set('statistics', stats);
        },

        getFormattedStats: () => {
            const stats = DataManager.get('statistics', {});
            const settings = DataManager.loadAll();

            return {
                totalClicks: stats.totalClicks || 0,
                menuClicks: stats.menuClicks || 0,
                reanimateClicks: stats.reanimateClicks || 0,
                customButtonStats: Object.entries(stats.customButtonClicks || {}).map(([id, clicks]) => {
                    const button = settings.customButtons.find(b => b.id === id);
                    return { name: button ? button.name : 'Botão removido', clicks };
                }),
                waitTimeStats: Object.entries(stats.waitTimeClicks || {}).map(([text, clicks]) => ({
                    name: text, clicks
                })),
                firstUse: stats.firstUse ? new Date(stats.firstUse).toLocaleDateString('pt-BR') : 'N/A',
                lastUse: stats.lastUse ? new Date(stats.lastUse).toLocaleDateString('pt-BR') : 'N/A'
            };
        }
    };

    // =================================================================================
    // 4. MÓDULO DE AÇÕES NO WHATSAPP
    // =================================================================================
    const WhatsAppActions = {
        waitForElement: (selector, timeout = 10000) => new Promise((resolve, reject) => {
            const el = document.querySelector(selector);
            if (el) return resolve(el);
            const observer = new MutationObserver(() => {
                const el = document.querySelector(selector);
                if (el) { observer.disconnect(); resolve(el); }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento "${selector}" não encontrado.`));
            }, timeout);
        }),

        playSound: () => {
            const settings = DataManager.loadAll();
            if (settings.general.soundEnabled) {
                // Som de notificação simples
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            }
        },

        sendText: async (message) => {
            try {
                const chatBox = await WhatsAppActions.waitForElement(CONFIG.selectors.chatBox);
                chatBox.focus();
                document.execCommand('insertText', false, message);
                chatBox.dispatchEvent(new Event('input', { bubbles: true }));
                const sendButton = await WhatsAppActions.waitForElement(CONFIG.selectors.sendButton);
                sendButton.click();
                WhatsAppActions.playSound();
                return true;
            } catch (error) {
                alert(`[WA MV] Erro ao enviar mensagem: ${error.message}\n\nPor favor, abra uma conversa antes de usar os botões.`);
                return false;
            }
        },

        sendImage: async (base64Image) => {
            try {
                const chatBox = await WhatsAppActions.waitForElement(CONFIG.selectors.chatBox);
                const blob = await (await fetch(base64Image)).blob();
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(new File([blob], "imagem.png", { type: blob.type }));
                chatBox.focus();
                chatBox.dispatchEvent(new ClipboardEvent('paste', {
                    clipboardData: dataTransfer,
                    bubbles: true
                }));
                const sendButton = await WhatsAppActions.waitForElement(`[data-testid="send-image"], [aria-label="Enviar"]`);
                sendButton.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                WhatsAppActions.playSound();
                return true;
            } catch (error) {
                console.error('[WA MV] Erro ao enviar imagem:', error);
                alert('[WA MV] Não foi possível enviar a imagem. Verifique se uma conversa está aberta.');
                return false;
            }
        }
    };

    // =================================================================================
    // 5. MÓDULO DE INTERFACE DO USUÁRIO (UI)
    // =================================================================================
    const UIManager = {
        state: { settings: DataManager.loadAll() },
        hideTimeout: null,

        injectStyles: () => {
            const style = document.createElement('style');
            const theme = CONFIG.themes[UIManager.state.settings.general.currentTheme] || CONFIG.themes.default;

            style.textContent = `
                #mv-settings-btn {
                    position: fixed !important;
                    top: 20px !important;
                    left: 20px !important;
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    z-index: 10000 !important;
                }

                .mv-fab-container {
                    position: fixed;
                    right: 20px;
                    bottom: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column-reverse;
                    gap: 12px;
                }

                .mv-fab {
                    background: linear-gradient(135deg, ${theme.primary} 0%, ${UIManager.darkenColor(theme.primary, 20)} 100%);
                    color: white;
                    border: none;
                    border-radius: 20px;
                    padding: 12px 18px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    min-width: 160px;
                    justify-content: center;
                    position: relative;
                    overflow: hidden;
                    backdrop-filter: blur(10px);
                }

                .mv-fab::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transition: left 0.5s;
                }

                .mv-fab:hover::before {
                    left: 100%;
                }

                .mv-fab:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.2), 0 4px 10px rgba(0,0,0,0.15);
                }

                .mv-fab:active {
                    transform: translateY(-1px) scale(0.98);
                    transition: all 0.1s;
                }

                .mv-fab.hidden {
                    opacity: 0;
                    pointer-events: none;
                    transform: translateY(20px) scale(0.9);
                }

                .mv-fab-settings {
                    background: linear-gradient(135deg, #6a0dad 0%, #8a2be2 100%);
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    font-size: 24px;
                    padding: 0;
                    min-width: 56px;
                    box-shadow: 0 8px 25px rgba(106, 13, 173, 0.3);
                }

                .mv-fab-wait {
                    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    min-width: 56px;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 0;
                    box-shadow: 0 6px 20px rgba(108, 117, 125, 0.3);
                }

                .mv-wait-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    width: 100%;
                    max-width: 200px;
                }

                .mv-fab-reanimate {
                    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
                    animation: pulse-reanimate 2s infinite;
                    box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
                }

                @keyframes pulse-reanimate {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                .mv-fab-menu {
                    background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
                    box-shadow: 0 6px 20px rgba(37, 211, 102, 0.3);
                }

                .mv-fab-quick {
                    background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
                    box-shadow: 0 6px 20px rgba(23, 162, 184, 0.3);
                    min-width: 120px;
                    font-size: 12px;
                }

                #mv-edge-hover-zone {
                    position: fixed;
                    right: 0;
                    bottom: 0;
                    width: 40px;
                    height: 100vh;
                    z-index: 9998;
                }

                .mv-modal-backdrop {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(5px);
                    z-index: 10000;
                    display: none;
                }

                .mv-modal {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: ${theme.background};
                    color: #e9edef;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.6);
                    z-index: 10001;
                    width: 90%;
                    max-width: 800px;
                    max-height: 90vh;
                    display: none;
                    flex-direction: column;
                }

                .mv-modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid ${theme.surface};
                }

                .mv-modal-header h3 {
                    margin: 0;
                    color: ${theme.secondary};
                    font-size: 1.5rem;
                    font-weight: 600;
                }

                .mv-modal-body {
                    padding: 0;
                    overflow-y: auto;
                    flex-grow: 1;
                }

                /* MELHORIA: Barra de rolagem mais visível e maior */
                .mv-modal-body::-webkit-scrollbar {
                    width: 16px;
                }

                .mv-modal-body::-webkit-scrollbar-track {
                    background: ${theme.background};
                    border-radius: 8px;
                }

                .mv-modal-body::-webkit-scrollbar-thumb {
                    background: ${theme.secondary};
                    border-radius: 8px;
                    border: 2px solid ${theme.background};
                }

                .mv-modal-body::-webkit-scrollbar-thumb:hover {
                    background: ${UIManager.lightenColor(theme.secondary, 20)};
                }

                .mv-tab-content::-webkit-scrollbar {
                    width: 14px;
                }

                .mv-tab-content::-webkit-scrollbar-track {
                    background: ${theme.surface};
                    border-radius: 7px;
                }

                .mv-tab-content::-webkit-scrollbar-thumb {
                    background: ${theme.secondary};
                    border-radius: 7px;
                    border: 1px solid ${theme.surface};
                }

                .mv-tab-content::-webkit-scrollbar-thumb:hover {
                    background: ${UIManager.lightenColor(theme.secondary, 20)};
                }

                .mv-modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid ${theme.surface};
                    text-align: right;
                }

                .mv-modal-btn {
                    background: linear-gradient(135deg, ${theme.secondary} 0%, ${theme.primary} 100%);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: all 0.2s;
                    box-shadow: 0 4px 12px ${UIManager.hexToRgba(theme.secondary, 0.3)};
                }

                .mv-modal-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px ${UIManager.hexToRgba(theme.secondary, 0.4)};
                }

                .mv-modal-btn-close {
                    background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
                    box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
                }

                .mv-form-group {
                    margin-bottom: 1.5rem;
                }

                .mv-form-group label {
                    display: block;
                    font-weight: 600;
                    margin-bottom: 8px;
                    color: #e9edef;
                }

                .mv-form-group input, .mv-form-group textarea, .mv-form-group select {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #54656f;
                    border-radius: 8px;
                    background: ${theme.surface};
                    color: #e9edef;
                    font-size: 1rem;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }

                .mv-form-group input:focus, .mv-form-group textarea:focus, .mv-form-group select:focus {
                    outline: none;
                    border-color: ${theme.secondary};
                    box-shadow: 0 0 0 3px ${UIManager.hexToRgba(theme.secondary, 0.1)};
                }

                .mv-color-input {
                    width: 60px !important;
                    height: 40px !important;
                    padding: 0 !important;
                    border: none !important;
                    border-radius: 8px !important;
                    cursor: pointer;
                }

                .mv-color-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 1rem;
                }

                .mv-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .mv-list-item {
                    background: ${theme.surface};
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: background-color 0.2s;
                }

                .mv-list-item:hover {
                    background: ${UIManager.lightenColor(theme.surface, 10)};
                }

                .mv-list-item-name {
                    flex-grow: 1;
                    font-weight: 600;
                }

                .mv-list-item-actions button {
                    background: none;
                    border: none;
                    color: #e9edef;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 8px;
                    border-radius: 6px;
                    transition: background-color 0.2s;
                }

                .mv-list-item-actions button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .mv-tab-container {
                    display: flex;
                    background-color: ${UIManager.darkenColor(theme.background, 10)};
                    padding: 0 1.5rem;
                    overflow-x: auto;
                }

                .mv-tab-btn {
                    background: none;
                    border: none;
                    color: #8696a0;
                    padding: 1rem 1.2rem;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    border-bottom: 3px solid transparent;
                    transition: all 0.2s;
                    white-space: nowrap;
                }

                .mv-tab-btn:hover {
                    color: #e9edef;
                }

                .mv-tab-btn.active {
                    color: ${theme.secondary};
                    border-bottom-color: ${theme.secondary};
                }

                .mv-tab-content {
                    display: none;
                    padding: 1.5rem;
                    max-height: 60vh;
                    overflow-y: auto;
                }

                .mv-tab-content.active {
                    display: block;
                }

                #mv-image-previews {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    margin-top: 12px;
                }

                .mv-preview-item {
                    position: relative;
                    width: 80px;
                    height: 80px;
                }

                .mv-preview-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 8px;
                }

                .mv-remove-img-btn {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: bold;
                }

                .mv-switch {
                    position: relative;
                    display: inline-block;
                    width: 60px;
                    height: 34px;
                }

                .mv-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }

                .mv-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #54656f;
                    transition: .4s;
                    border-radius: 34px;
                }

                .mv-slider:before {
                    position: absolute;
                    content: "";
                    height: 26px;
                    width: 26px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }

                input:checked + .mv-slider {
                    background-color: ${theme.secondary};
                }

                input:checked + .mv-slider:before {
                    transform: translateX(26px);
                }

                .mv-stats-card {
                    background: ${theme.surface};
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    border-left: 4px solid ${theme.accent};
                }

                .mv-stats-number {
                    font-size: 2rem;
                    font-weight: bold;
                    color: ${theme.accent};
                }

                .mv-stats-label {
                    color: #8696a0;
                    font-size: 0.9rem;
                }

                .mv-theme-preview {
                    display: flex;
                    gap: 8px;
                    margin: 8px 0;
                }

                .mv-theme-color {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    border: 2px solid rgba(255,255,255,0.2);
                }

                @media (max-width: 768px) {
                    .mv-fab-container {
                        right: 15px;
                        bottom: 15px;
                        gap: 10px;
                    }

                    .mv-fab {
                        min-width: 140px;
                        padding: 10px 14px;
                        font-size: 13px;
                    }

                    .mv-modal {
                        width: 95%;
                        max-height: 95vh;
                    }

                    .mv-wait-grid {
                        max-width: 180px;
                    }

                    .mv-tab-container {
                        padding: 0 1rem;
                    }

                    .mv-tab-btn {
                        padding: 1rem 0.8rem;
                        font-size: 0.8rem;
                    }

                    .mv-modal-body::-webkit-scrollbar {
                        width: 12px;
                    }

                    .mv-tab-content::-webkit-scrollbar {
                        width: 10px;
                    }
                }
            `;
            document.head.appendChild(style);
        },



        createDOM: () => {
            const container = document.createElement('div');
            container.id = CONFIG.containerId;
            container.innerHTML = `
                <div class="mv-fab-container" id="mv-fab-container"></div>
                <div id="mv-edge-hover-zone"></div>
                <button id="mv-settings-btn" class="mv-fab mv-fab-settings">⚙️</button>
                <div id="mv-modal-backdrop" class="mv-modal-backdrop"></div>
                <div id="mv-modal" class="mv-modal">
                    <div class="mv-modal-header">
                        <h3>⚙️ Configurações Avançadas v5.2</h3>
                    </div>
                    <div class="mv-modal-body">
                        <div class="mv-tab-container">
                            <button class="mv-tab-btn active" data-tab="tab-general">🔧 Geral</button>
                            <button class="mv-tab-btn" data-tab="tab-colors">🎨 Cores</button>
                            <button class="mv-tab-btn" data-tab="tab-themes">🌈 Temas</button>
                            <button class="mv-tab-btn" data-tab="tab-buttons">🔘 Botões</button>
                            <button class="mv-tab-btn" data-tab="tab-quick">⚡ Rápidas</button>
                            <button class="mv-tab-btn" data-tab="tab-menu">📋 Cardápio</button>
                            <button class="mv-tab-btn" data-tab="tab-wait">⏰ Tempos</button>
                            <button class="mv-tab-btn" data-tab="tab-reanimate">🔥 Reanimar</button>
                            <button class="mv-tab-btn" data-tab="tab-stats">📊 Estatísticas</button>
                            <button class="mv-tab-btn" data-tab="tab-backup">💾 Backup</button>
                        </div>

                        <div id="tab-general" class="mv-tab-content active">
                            <h4>⚙️ Configurações Gerais</h4>
                            <div class="mv-form-group" style="display: flex; align-items: center; gap: 15px;">
                                <label for="mv-auto-hide-toggle" style="margin-bottom: 0;">Desaparecer botões automaticamente</label>
                                <label class="mv-switch">
                                    <input type="checkbox" id="mv-auto-hide-toggle">
                                    <span class="mv-slider"></span>
                                </label>
                            </div>
                            <div class="mv-form-group">
                                <label for="mv-auto-hide-duration">Duração da visibilidade (segundos)</label>
                                <input type="number" id="mv-auto-hide-duration" min="1" max="60">
                            </div>
                            <div class="mv-form-group">
                                <label for="mv-wait-time-position">Posição dos botões de tempo</label>
                                <select id="mv-wait-time-position">
                                    <option value="top">No topo da lista</option>
                                    <option value="bottom">Na base da lista</option>
                                </select>
                            </div>
                            <div class="mv-form-group" style="display: flex; align-items: center; gap: 15px;">
                                <label for="mv-sound-toggle" style="margin-bottom: 0;">Som de notificação</label>
                                <label class="mv-switch">
                                    <input type="checkbox" id="mv-sound-toggle">
                                    <span class="mv-slider"></span>
                                </label>
                            </div>
                            <div class="mv-form-group" style="display: flex; align-items: center; gap: 15px;">
                                <label for="mv-animations-toggle" style="margin-bottom: 0;">Animações</label>
                                <label class="mv-switch">
                                    <input type="checkbox" id="mv-animations-toggle">
                                    <span class="mv-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div id="tab-colors" class="mv-tab-content">
                            <h4>🎨 Personalização de Cores</h4>
                            <div class="mv-color-group">
                                <label for="mv-color-custom">Botões Personalizados:</label>
                                <input type="color" id="mv-color-custom" class="mv-color-input">
                                <button id="mv-reset-color-custom" class="mv-modal-btn" style="padding: 8px 12px; font-size: 12px;">Resetar</button>
                            </div>
                            <div class="mv-color-group">
                                <label for="mv-color-wait">Botões de Tempo:</label>
                                <input type="color" id="mv-color-wait" class="mv-color-input">
                                <button id="mv-reset-color-wait" class="mv-modal-btn" style="padding: 8px 12px; font-size: 12px;">Resetar</button>
                            </div>
                            <div class="mv-color-group">
                                <label for="mv-color-menu">Botão Cardápio:</label>
                                <input type="color" id="mv-color-menu" class="mv-color-input">
                                <button id="mv-reset-color-menu" class="mv-modal-btn" style="padding: 8px 12px; font-size: 12px;">Resetar</button>
                            </div>
                            <div class="mv-color-group">
                                <label for="mv-color-reanimate">Botão Reanimar:</label>
                                <input type="color" id="mv-color-reanimate" class="mv-color-input">
                                <button id="mv-reset-color-reanimate" class="mv-modal-btn" style="padding: 8px 12px; font-size: 12px;">Resetar</button>
                            </div>
                        </div>

                        <div id="tab-themes" class="mv-tab-content">
                            <h4>🌈 Temas Visuais</h4>
                            <p style="color: #8696a0; margin-bottom: 1rem;">Escolha um tema visual para personalizar a aparência da interface.</p>
                            <div id="mv-themes-list"></div>
                        </div>

                        <div id="tab-buttons" class="mv-tab-content">
                            <h4>🔘 Botões Personalizados</h4>
                            <ul id="mv-button-list" class="mv-list"></ul>
                            <button id="mv-add-button-btn" class="mv-modal-btn">➕ Adicionar Novo Botão</button>
                        </div>

                        <div id="tab-quick" class="mv-tab-content">
                            <h4>⚡ Respostas Rápidas</h4>
                            <p style="color: #8696a0; margin-bottom: 1rem;">Crie respostas rápidas para mensagens comuns.</p>
                            <ul id="mv-quick-list" class="mv-list"></ul>
                            <button id="mv-add-quick-btn" class="mv-modal-btn">➕ Adicionar Resposta Rápida</button>
                        </div>

                        <div id="tab-menu" class="mv-tab-content">
                            <h4>📋 Configurar Cardápio</h4>
                            <div class="mv-form-group">
                                <label for="mv-menu-text">Mensagem do Cardápio</label>
                                <textarea id="mv-menu-text" rows="3" placeholder="Digite a mensagem que será enviada junto com o cardápio..."></textarea>
                            </div>
                            <div class="mv-form-group">
                                <label>Imagens do Cardápio (até ${CONFIG.maxImages})</label>
                                <input type="file" id="mv-menu-images-input" accept="image/*" multiple style="display:none;">
                                <button id="mv-menu-images-btn" class="mv-modal-btn">📷 Adicionar Imagens</button>
                                <div id="mv-image-previews"></div>
                            </div>
                        </div>

                        <div id="tab-wait" class="mv-tab-content">
                            <h4>⏰ Tempos de Espera</h4>
                            <p style="color: #8696a0; margin-bottom: 1rem;">Configure os tempos de espera e suas mensagens personalizadas. Os botões serão organizados em uma grade 3x3.</p>
                            <ul id="mv-wait-list" class="mv-list"></ul>
                            <button id="mv-add-wait-btn" class="mv-modal-btn">➕ Adicionar Tempo</button>
                        </div>

                        <div id="tab-reanimate" class="mv-tab-content">
                            <h4>🔥 Reanimar Clientes</h4>
                            <p style="color: #8696a0; margin-bottom: 1rem;">Configure uma mensagem especial para resgatar clientes que abandonaram o pedido.</p>
                            <div class="mv-form-group">
                                <label for="mv-reanimate-text">Mensagem de Reanimação</label>
                                <textarea id="mv-reanimate-text" rows="4" placeholder="Digite uma mensagem atrativa para resgatar o cliente..."></textarea>
                            </div>
                            <div class="mv-form-group">
                                <label>Imagem de Reanimação (opcional)</label>
                                <input type="file" id="mv-reanimate-image-input" accept="image/*" style="display:none;">
                                <button id="mv-reanimate-image-btn" class="mv-modal-btn">📷 Adicionar Imagem</button>
                                <div id="mv-reanimate-preview"></div>
                            </div>
                        </div>

                        <div id="tab-stats" class="mv-tab-content">
                            <h4>📊 Estatísticas de Uso</h4>
                            <div id="mv-stats-content"></div>
                            <button id="mv-reset-stats-btn" class="mv-modal-btn mv-modal-btn-close" style="margin-top: 1rem;">🗑️ Limpar Estatísticas</button>
                        </div>

                        <div id="tab-backup" class="mv-tab-content">
                            <h4>💾 Backup e Restauração</h4>
                            <p style="color: #8696a0; margin-bottom: 1rem;">Faça backup das suas configurações ou restaure de um arquivo anterior.</p>
                            <div class="mv-form-group">
                                <button id="mv-export-btn" class="mv-modal-btn">📤 Exportar Configurações</button>
                                <button id="mv-import-btn" class="mv-modal-btn" style="margin-left: 10px;">📥 Importar Configurações</button>
                                <input type="file" id="mv-import-input" accept=".json" style="display:none;">
                            </div>
                            <div class="mv-form-group">
                                <label for="mv-backup-text">Dados de Backup (JSON)</label>
                                <textarea id="mv-backup-text" rows="8" readonly placeholder="Os dados de backup aparecerão aqui..."></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="mv-modal-footer">
                        <button id="mv-modal-close-btn" class="mv-modal-btn">💾 Salvar e Fechar</button>
                    </div>
                </div>

                <div id="mv-edit-modal" class="mv-modal" style="max-width: 500px;">
                    <div class="mv-modal-header">
                        <h3>✏️ Editar Botão</h3>
                    </div>
                    <div class="mv-modal-body" style="padding: 1.5rem;">
                        <input type="hidden" id="mv-edit-id">
                        <div class="mv-form-group">
                            <label for="mv-edit-name">Nome do Botão</label>
                            <input type="text" id="mv-edit-name" placeholder="Ex: 🚀 Pedido Saiu">
                        </div>
                        <div class="mv-form-group">
                            <label for="mv-edit-message">Mensagem</label>
                            <textarea id="mv-edit-message" rows="4" placeholder="Digite a mensagem que será enviada..."></textarea>
                        </div>
                    </div>
                    <div class="mv-modal-footer">
                        <button id="mv-edit-cancel" class="mv-modal-btn mv-modal-btn-close">❌ Cancelar</button>
                        <button id="mv-edit-save" class="mv-modal-btn" style="margin-left: 10px;">💾 Salvar</button>
                    </div>
                </div>

                <div id="mv-wait-edit-modal" class="mv-modal" style="max-width: 500px;">
                    <div class="mv-modal-header">
                        <h3>⏰ Editar Tempo de Espera</h3>
                    </div>
                    <div class="mv-modal-body" style="padding: 1.5rem;">
                        <input type="hidden" id="mv-wait-edit-id">
                        <div class="mv-form-group">
                            <label for="mv-wait-edit-text">Texto do Botão</label>
                            <input type="text" id="mv-wait-edit-text" placeholder="Ex: 30 min">
                        </div>
                        <div class="mv-form-group">
                            <label for="mv-wait-edit-message">Mensagem Personalizada</label>
                            <textarea id="mv-wait-edit-message" rows="3" placeholder="Ex: O tempo de espera estimado é de 30 minutos."></textarea>
                        </div>
                    </div>
                    <div class="mv-modal-footer">
                        <button id="mv-wait-edit-cancel" class="mv-modal-btn mv-modal-btn-close">❌ Cancelar</button>
                        <button id="mv-wait-edit-save" class="mv-modal-btn" style="margin-left: 10px;">💾 Salvar</button>
                    </div>
                </div>

                <div id="mv-quick-edit-modal" class="mv-modal" style="max-width: 500px;">
                    <div class="mv-modal-header">
                        <h3>⚡ Editar Resposta Rápida</h3>
                    </div>
                    <div class="mv-modal-body" style="padding: 1.5rem;">
                        <input type="hidden" id="mv-quick-edit-id">
                        <div class="mv-form-group">
                            <label for="mv-quick-edit-text">Texto do Botão</label>
                            <input type="text" id="mv-quick-edit-text" placeholder="Ex: Obrigado!">
                        </div>
                        <div class="mv-form-group">
                            <label for="mv-quick-edit-message">Mensagem</label>
                            <textarea id="mv-quick-edit-message" rows="3" placeholder="Ex: Muito obrigado! 😊"></textarea>
                        </div>
                    </div>
                    <div class="mv-modal-footer">
                        <button id="mv-quick-edit-cancel" class="mv-modal-btn mv-modal-btn-close">❌ Cancelar</button>
                        <button id="mv-quick-edit-save" class="mv-modal-btn" style="margin-left: 10px;">💾 Salvar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(container);
        },

        applyCustomColors: () => {
            const { colors } = UIManager.state.settings;
            const style = document.createElement('style');
            style.id = 'mv-custom-colors';

            // Remove estilo anterior se existir
            const existingStyle = document.getElementById('mv-custom-colors');
            if (existingStyle) existingStyle.remove();

            style.textContent = `
                .mv-fab:not(.mv-fab-settings):not(.mv-fab-wait):not(.mv-fab-menu):not(.mv-fab-reanimate):not(.mv-fab-quick) {
                    background: linear-gradient(135deg, ${colors.customButtons} 0%, ${UIManager.darkenColor(colors.customButtons, 20)} 100%) !important;
                }
                .mv-fab-wait {
                    background: linear-gradient(135deg, ${colors.waitButtons} 0%, ${UIManager.darkenColor(colors.waitButtons, 20)} 100%) !important;
                    box-shadow: 0 6px 20px ${UIManager.hexToRgba(colors.waitButtons, 0.3)} !important;
                }
                .mv-fab-menu {
                    background: linear-gradient(135deg, ${colors.menuButton} 0%, ${UIManager.darkenColor(colors.menuButton, 20)} 100%) !important;
                    box-shadow: 0 6px 20px ${UIManager.hexToRgba(colors.menuButton, 0.3)} !important;
                }
                .mv-fab-reanimate {
                    background: linear-gradient(135deg, ${colors.reanimateButton} 0%, ${UIManager.darkenColor(colors.reanimateButton, 20)} 100%) !important;
                    box-shadow: 0 6px 20px ${UIManager.hexToRgba(colors.reanimateButton, 0.4)} !important;
                }
            `;
            document.head.appendChild(style);
        },

        darkenColor: (hex, percent) => {
            const num = parseInt(hex.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) - amt;
            const G = (num >> 8 & 0x00FF) - amt;
            const B = (num & 0x0000FF) - amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        },

        lightenColor: (hex, percent) => {
            const num = parseInt(hex.replace("#", ""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
                (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
        },

        hexToRgba: (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },

        // MELHORIA: Lógica de renderização com posicionamento correto do botão Reanimar
        renderFloatingButtons: () => {
            const container = document.getElementById('mv-fab-container');
            container.innerHTML = '';
            const { waitTimes, menu, customButtons, general, reanimate, quickReplies } = UIManager.state.settings;

            const createWaitButtons = () => {
                if (waitTimes.length > 0) {
                    const waitGrid = document.createElement('div');
                    waitGrid.className = 'mv-wait-grid';

                    waitTimes.slice(0, 6).forEach(timeObj => {
                        const btnEl = document.createElement('button');
                        btnEl.className = 'mv-fab mv-fab-wait';
                        btnEl.textContent = timeObj.text;
                        btnEl.title = `Enviar: ${timeObj.message}`;
                        btnEl.addEventListener('click', () => {
                            WhatsAppActions.sendText(timeObj.message);
                            StatsManager.updateStats('wait', timeObj.text);
                        });
                        waitGrid.appendChild(btnEl);
                    });

                    container.appendChild(waitGrid);
                }
            };

            const createReanimateButton = () => {
                // Botão Reanimar sempre após os tempos de espera
                const reanimateBtn = document.createElement('button');
                reanimateBtn.className = 'mv-fab mv-fab-reanimate';
                reanimateBtn.innerHTML = '🔥 Reanimar Cliente';
                reanimateBtn.title = 'Enviar mensagem de reanimação';
                reanimateBtn.addEventListener('click', async () => {
                    if (reanimate.text) await WhatsAppActions.sendText(reanimate.text);
                    if (reanimate.image) await WhatsAppActions.sendImage(reanimate.image);
                    StatsManager.updateStats('reanimate');
                });
                container.appendChild(reanimateBtn);
            };

            const createOtherButtons = () => {
                // Respostas Rápidas
                quickReplies.slice(0, 3).forEach(quick => {
                    const quickBtn = document.createElement('button');
                    quickBtn.className = 'mv-fab mv-fab-quick';
                    quickBtn.textContent = quick.text;
                    quickBtn.title = `Resposta rápida: ${quick.message}`;
                    quickBtn.addEventListener('click', () => {
                        WhatsAppActions.sendText(quick.message);
                        StatsManager.updateStats('quick', quick.text);
                    });
                    container.appendChild(quickBtn);
                });

                // Botão Cardápio
                const menuBtn = document.createElement('button');
                menuBtn.className = 'mv-fab mv-fab-menu';
                menuBtn.innerHTML = '📋 Cardápio';
                menuBtn.addEventListener('click', async () => {
                    if (menu.text) await WhatsAppActions.sendText(menu.text);
                    for (const img of menu.images) {
                        await WhatsAppActions.sendImage(img);
                    }
                    StatsManager.updateStats('menu');
                });
                container.appendChild(menuBtn);

                // Botões personalizados
                customButtons.forEach(button => {
                    const btnEl = document.createElement('button');
                    btnEl.className = 'mv-fab';
                    btnEl.textContent = button.name;
                    btnEl.addEventListener('click', () => {
                        WhatsAppActions.sendText(button.message);
                        StatsManager.updateStats('custom', button.id);
                    });
                    container.appendChild(btnEl);
                });
            };

            // ORDEM CORRETA: Outros botões -> Tempos de Espera -> Reanimar (sempre abaixo dos tempos)
            if (general.waitTimePosition === 'top') {
                createOtherButtons();
                createWaitButtons();
                createReanimateButton(); // Sempre após os tempos
            } else {
                createWaitButtons();
                createReanimateButton(); // Sempre após os tempos
                createOtherButtons();
            }

            UIManager.applyCustomColors();
            UIManager.applyAutoHide();
        },



        renderListsInModal: () => {
            // Configurações Gerais
            const general = UIManager.state.settings.general;
            document.getElementById('mv-auto-hide-toggle').checked = general.autoHide;
            document.getElementById('mv-auto-hide-duration').value = general.autoHideDuration;
            document.getElementById('mv-wait-time-position').value = general.waitTimePosition;
            document.getElementById('mv-sound-toggle').checked = general.soundEnabled;
            document.getElementById('mv-animations-toggle').checked = general.animationsEnabled;

            // Cores
            const colors = UIManager.state.settings.colors;
            document.getElementById('mv-color-custom').value = colors.customButtons;
            document.getElementById('mv-color-wait').value = colors.waitButtons;
            document.getElementById('mv-color-menu').value = colors.menuButton;
            document.getElementById('mv-color-reanimate').value = colors.reanimateButton;

            // Temas
            UIManager.renderThemes();

            // Botões Personalizados
            const btnList = document.getElementById('mv-button-list');
            btnList.innerHTML = '';
            UIManager.state.settings.customButtons.forEach((button, index) => {
                const li = document.createElement('li');
                li.className = 'mv-list-item';
                li.innerHTML = `
                    <span class="mv-list-item-name">${button.name}</span>
                    <div class="mv-list-item-actions">
                        <button class="edit-btn" title="Editar">✏️</button>
                        <button class="delete-btn" title="Excluir">🗑️</button>
                    </div>
                `;
                li.querySelector('.edit-btn').addEventListener('click', () => UIManager.showEditModal(index));
                li.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm(`Excluir o botão "${button.name}"?`)) {
                        UIManager.state.settings.customButtons.splice(index, 1);
                        UIManager.renderListsInModal();
                    }
                });
                btnList.appendChild(li);
            });

            // Respostas Rápidas
            const quickList = document.getElementById('mv-quick-list');
            quickList.innerHTML = '';
            UIManager.state.settings.quickReplies.forEach((quick, index) => {
                const li = document.createElement('li');
                li.className = 'mv-list-item';
                li.innerHTML = `
                    <div style="flex-grow: 1;">
                        <div class="mv-list-item-name">${quick.text}</div>
                        <div style="font-size: 0.9em; color: #8696a0; margin-top: 4px;">${quick.message}</div>
                    </div>
                    <div class="mv-list-item-actions">
                        <button class="edit-btn" title="Editar">✏️</button>
                        <button class="delete-btn" title="Excluir">🗑️</button>
                    </div>
                `;
                li.querySelector('.edit-btn').addEventListener('click', () => UIManager.showQuickEditModal(index));
                li.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm(`Excluir a resposta rápida "${quick.text}"?`)) {
                        UIManager.state.settings.quickReplies.splice(index, 1);
                        UIManager.renderListsInModal();
                    }
                });
                quickList.appendChild(li);
            });

            // Tempos de Espera
            const waitList = document.getElementById('mv-wait-list');
            waitList.innerHTML = '';
            UIManager.state.settings.waitTimes.forEach((timeObj, index) => {
                const li = document.createElement('li');
                li.className = 'mv-list-item';
                li.innerHTML = `
                    <div style="flex-grow: 1;">
                        <div class="mv-list-item-name">${timeObj.text}</div>
                        <div style="font-size: 0.9em; color: #8696a0; margin-top: 4px;">${timeObj.message}</div>
                    </div>
                    <div class="mv-list-item-actions">
                        <button class="edit-btn" title="Editar">✏️</button>
                        <button class="delete-btn" title="Excluir">🗑️</button>
                    </div>
                `;
                li.querySelector('.edit-btn').addEventListener('click', () => UIManager.showWaitEditModal(index));
                li.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm(`Excluir o tempo "${timeObj.text}"?`)) {
                        UIManager.state.settings.waitTimes.splice(index, 1);
                        UIManager.renderListsInModal();
                    }
                });
                waitList.appendChild(li);
            });

            // Cardápio
            document.getElementById('mv-menu-text').value = UIManager.state.settings.menu.text;
            UIManager.renderImagePreviews();

            // Reanimar
            document.getElementById('mv-reanimate-text').value = UIManager.state.settings.reanimate.text;
            UIManager.renderReanimatePreview();

            // Estatísticas
            UIManager.renderStats();
        },

        renderThemes: () => {
            const container = document.getElementById('mv-themes-list');
            const currentTheme = UIManager.state.settings.general.currentTheme;

            container.innerHTML = '';
            Object.entries(CONFIG.themes).forEach(([key, theme]) => {
                const themeItem = document.createElement('div');
                themeItem.className = 'mv-list-item';
                themeItem.style.cursor = 'pointer';
                if (key === currentTheme) {
                    themeItem.style.borderLeft = '4px solid #00a884';
                }

                themeItem.innerHTML = `
                    <div style="flex-grow: 1;">
                        <div class="mv-list-item-name">${theme.name}</div>
                        <div class="mv-theme-preview">
                            <div class="mv-theme-color" style="background-color: ${theme.primary}"></div>
                            <div class="mv-theme-color" style="background-color: ${theme.secondary}"></div>
                            <div class="mv-theme-color" style="background-color: ${theme.accent}"></div>
                            <div class="mv-theme-color" style="background-color: ${theme.background}"></div>
                        </div>
                    </div>
                    <div style="color: #00a884; font-size: 1.2em;">
                        ${key === currentTheme ? '✓' : ''}
                    </div>
                `;

                themeItem.addEventListener('click', () => {
                    UIManager.state.settings.general.currentTheme = key;
                    UIManager.renderThemes();
                    // Recarrega os estilos com o novo tema
                    const existingStyle = document.querySelector('style');
                    if (existingStyle) existingStyle.remove();
                    UIManager.injectStyles();
                });

                container.appendChild(themeItem);
            });
        },

        renderStats: () => {
            const container = document.getElementById('mv-stats-content');
            const stats = StatsManager.getFormattedStats();

            container.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                    <div class="mv-stats-card">
                        <div class="mv-stats-number">${stats.totalClicks}</div>
                        <div class="mv-stats-label">Total de Cliques</div>
                    </div>
                    <div class="mv-stats-card">
                        <div class="mv-stats-number">${stats.menuClicks}</div>
                        <div class="mv-stats-label">Cardápio Enviado</div>
                    </div>
                    <div class="mv-stats-card">
                        <div class="mv-stats-number">${stats.reanimateClicks}</div>
                        <div class="mv-stats-label">Clientes Reanimados</div>
                    </div>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h5 style="color: #00a884; margin-bottom: 0.5rem;">📊 Botões Mais Usados</h5>
                    ${stats.customButtonStats.length > 0 ?
                        stats.customButtonStats.map(btn => `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #3b4a54;">
                                <span>${btn.name}</span>
                                <span style="color: #00a884; font-weight: bold;">${btn.clicks} cliques</span>
                            </div>
                        `).join('') :
                        '<p style="color: #8696a0;">Nenhum botão personalizado usado ainda.</p>'
                    }
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <h5 style="color: #00a884; margin-bottom: 0.5rem;">⏰ Tempos Mais Enviados</h5>
                    ${stats.waitTimeStats.length > 0 ?
                        stats.waitTimeStats.map(wait => `
                            <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #3b4a54;">
                                <span>${wait.name}</span>
                                <span style="color: #00a884; font-weight: bold;">${wait.clicks} vezes</span>
                            </div>
                        `).join('') :
                        '<p style="color: #8696a0;">Nenhum tempo de espera enviado ainda.</p>'
                    }
                </div>

                <div style="display: flex; justify-content: space-between; font-size: 0.9em; color: #8696a0;">
                    <span>Primeiro uso: ${stats.firstUse}</span>
                    <span>Último uso: ${stats.lastUse}</span>
                </div>
            `;
        },

        renderImagePreviews: () => {
            const container = document.getElementById('mv-image-previews');
            container.innerHTML = '';
            UIManager.state.settings.menu.images.forEach((img, index) => {
                const item = document.createElement('div');
                item.className = 'mv-preview-item';
                item.innerHTML = `
                    <img src="${img}" alt="Preview">
                    <button class="mv-remove-img-btn" title="Remover imagem">×</button>
                `;
                item.querySelector('.mv-remove-img-btn').addEventListener('click', () => {
                    UIManager.state.settings.menu.images.splice(index, 1);
                    UIManager.renderImagePreviews();
                });
                container.appendChild(item);
            });
        },

        renderReanimatePreview: () => {
            const container = document.getElementById('mv-reanimate-preview');
            container.innerHTML = '';
            if (UIManager.state.settings.reanimate.image) {
                const item = document.createElement('div');
                item.className = 'mv-preview-item';
                item.style.marginTop = '12px';
                item.innerHTML = `
                    <img src="${UIManager.state.settings.reanimate.image}" alt="Preview Reanimar">
                    <button class="mv-remove-img-btn" title="Remover imagem">×</button>
                `;
                item.querySelector('.mv-remove-img-btn').addEventListener('click', () => {
                    UIManager.state.settings.reanimate.image = null;
                    UIManager.renderReanimatePreview();
                });
                container.appendChild(item);
            }
        },

        showEditModal: (index = null) => {
            const isAdding = index === null;
            const modal = document.getElementById('mv-edit-modal');
            modal.querySelector('h3').innerHTML = isAdding ? '➕ Adicionar Novo Botão' : '✏️ Editar Botão';
            document.getElementById('mv-edit-id').value = isAdding ? '' : index;
            document.getElementById('mv-edit-name').value = isAdding ? '' : UIManager.state.settings.customButtons[index].name;
            document.getElementById('mv-edit-message').value = isAdding ? '' : UIManager.state.settings.customButtons[index].message;
            document.getElementById('mv-modal-backdrop').style.display = 'block';
            modal.style.display = 'flex';
        },

        showWaitEditModal: (index = null) => {
            const isAdding = index === null;
            const modal = document.getElementById('mv-wait-edit-modal');
            modal.querySelector('h3').innerHTML = isAdding ? '➕ Adicionar Tempo de Espera' : '⏰ Editar Tempo de Espera';
            document.getElementById('mv-wait-edit-id').value = isAdding ? '' : index;

            if (isAdding) {
                document.getElementById('mv-wait-edit-text').value = '';
                document.getElementById('mv-wait-edit-message').value = '';
            } else {
                const timeObj = UIManager.state.settings.waitTimes[index];
                document.getElementById('mv-wait-edit-text').value = timeObj.text;
                document.getElementById('mv-wait-edit-message').value = timeObj.message;
            }

            document.getElementById('mv-modal-backdrop').style.display = 'block';
            modal.style.display = 'flex';
        },

        showQuickEditModal: (index = null) => {
            const isAdding = index === null;
            const modal = document.getElementById('mv-quick-edit-modal');
            modal.querySelector('h3').innerHTML = isAdding ? '➕ Adicionar Resposta Rápida' : '⚡ Editar Resposta Rápida';
            document.getElementById('mv-quick-edit-id').value = isAdding ? '' : index;

            if (isAdding) {
                document.getElementById('mv-quick-edit-text').value = '';
                document.getElementById('mv-quick-edit-message').value = '';
            } else {
                const quickObj = UIManager.state.settings.quickReplies[index];
                document.getElementById('mv-quick-edit-text').value = quickObj.text;
                document.getElementById('mv-quick-edit-message').value = quickObj.message;
            }

            document.getElementById('mv-modal-backdrop').style.display = 'block';
            modal.style.display = 'flex';
        },

        hideEditModal: () => {
            document.getElementById('mv-edit-modal').style.display = 'none';
            document.getElementById('mv-wait-edit-modal').style.display = 'none';
            document.getElementById('mv-quick-edit-modal').style.display = 'none';
            if (document.getElementById('mv-modal').style.display !== 'flex') {
                document.getElementById('mv-modal-backdrop').style.display = 'none';
            }
        },

        saveAndClose: () => {
            // Salva configurações gerais
            UIManager.state.settings.general.autoHide = document.getElementById('mv-auto-hide-toggle').checked;
            UIManager.state.settings.general.autoHideDuration = parseInt(document.getElementById('mv-auto-hide-duration').value);
            UIManager.state.settings.general.waitTimePosition = document.getElementById('mv-wait-time-position').value;
            UIManager.state.settings.general.soundEnabled = document.getElementById('mv-sound-toggle').checked;
            UIManager.state.settings.general.animationsEnabled = document.getElementById('mv-animations-toggle').checked;

            // Salva cores
            UIManager.state.settings.colors.customButtons = document.getElementById('mv-color-custom').value;
            UIManager.state.settings.colors.waitButtons = document.getElementById('mv-color-wait').value;
            UIManager.state.settings.colors.menuButton = document.getElementById('mv-color-menu').value;
            UIManager.state.settings.colors.reanimateButton = document.getElementById('mv-color-reanimate').value;

            // Salva cardápio
            UIManager.state.settings.menu.text = document.getElementById('mv-menu-text').value;

            // Salva reanimar
            UIManager.state.settings.reanimate.text = document.getElementById('mv-reanimate-text').value;

            // Salva no LocalStorage
            DataManager.set('general', UIManager.state.settings.general);
            DataManager.set('colors', UIManager.state.settings.colors);
            DataManager.set('customButtons', UIManager.state.settings.customButtons);
            DataManager.set('waitTimes', UIManager.state.settings.waitTimes);
            DataManager.set('quickReplies', UIManager.state.settings.quickReplies);
            DataManager.set('menu', UIManager.state.settings.menu);
            DataManager.set('reanimate', UIManager.state.settings.reanimate);

            // Re-renderiza a UI principal
            UIManager.renderFloatingButtons();

            // Fecha o modal
            document.getElementById('mv-modal-backdrop').style.display = 'none';
            document.getElementById('mv-modal').style.display = 'none';
        },

        applyAutoHide: () => {
            const { autoHide, autoHideDuration } = UIManager.state.settings.general;
            const buttons = document.querySelectorAll('.mv-fab-container .mv-fab, .mv-fab-container .mv-wait-grid');

            if (autoHide) {
                buttons.forEach(b => b.classList.add('hidden'));
                document.getElementById('mv-edge-hover-zone').style.display = 'block';
            } else {
                buttons.forEach(b => b.classList.remove('hidden'));
                document.getElementById('mv-edge-hover-zone').style.display = 'none';
            }
        },

        showButtonsTemporarily: () => {
            if (!UIManager.state.settings.general.autoHide) return;

            const buttons = document.querySelectorAll('.mv-fab-container .mv-fab, .mv-fab-container .mv-wait-grid');
            buttons.forEach(b => b.classList.remove('hidden'));

            clearTimeout(UIManager.hideTimeout);
            UIManager.hideTimeout = setTimeout(() => {
                buttons.forEach(b => b.classList.add('hidden'));
            }, UIManager.state.settings.general.autoHideDuration * 1000);
        },

        initEventListeners: () => {
            // Botão de configurações
            document.getElementById('mv-settings-btn').addEventListener('click', () => {
                document.getElementById('mv-modal-backdrop').style.display = 'block';
                document.getElementById('mv-modal').style.display = 'flex';
                UIManager.renderListsInModal();
            });

            // Fechar modal principal
            document.getElementById('mv-modal-close-btn').addEventListener('click', UIManager.saveAndClose);

            // Navegação entre abas
            document.querySelectorAll('.mv-tab-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    document.querySelectorAll('.mv-tab-btn, .mv-tab-content').forEach(el => el.classList.remove('active'));
                    e.target.classList.add('active');
                    document.getElementById(e.target.dataset.tab).classList.add('active');
                });
            });

            // Botões de reset de cores
            document.getElementById('mv-reset-color-custom').addEventListener('click', () => {
                document.getElementById('mv-color-custom').value = CONFIG.defaultColors.customButtons;
            });
            document.getElementById('mv-reset-color-wait').addEventListener('click', () => {
                document.getElementById('mv-color-wait').value = CONFIG.defaultColors.waitButtons;
            });
            document.getElementById('mv-reset-color-menu').addEventListener('click', () => {
                document.getElementById('mv-color-menu').value = CONFIG.defaultColors.menuButton;
            });
            document.getElementById('mv-reset-color-reanimate').addEventListener('click', () => {
                document.getElementById('mv-color-reanimate').value = CONFIG.defaultColors.reanimateButton;
            });

            // Adicionar botão personalizado
            document.getElementById('mv-add-button-btn').addEventListener('click', () => UIManager.showEditModal(null));

            // Adicionar resposta rápida
            document.getElementById('mv-add-quick-btn').addEventListener('click', () => UIManager.showQuickEditModal(null));

            // Salvar/cancelar edição de botão
            document.getElementById('mv-edit-save').addEventListener('click', () => {
                const index = document.getElementById('mv-edit-id').value;
                const name = document.getElementById('mv-edit-name').value.trim();
                const message = document.getElementById('mv-edit-message').value.trim();

                if (!name || !message) {
                    alert('Nome e mensagem são obrigatórios.');
                    return;
                }

                if (index === '') {
                    // Adicionar novo
                    UIManager.state.settings.customButtons.push({
                        id: `btn_${Date.now()}`,
                        name,
                        message
                    });
                } else {
                    // Editar existente
                    UIManager.state.settings.customButtons[index] = {
                        ...UIManager.state.settings.customButtons[index],
                        name,
                        message
                    };
                }

                UIManager.renderListsInModal();
                UIManager.hideEditModal();
            });

            document.getElementById('mv-edit-cancel').addEventListener('click', UIManager.hideEditModal);

            // Adicionar tempo de espera
            document.getElementById('mv-add-wait-btn').addEventListener('click', () => UIManager.showWaitEditModal(null));

            // Salvar/cancelar edição de tempo
            document.getElementById('mv-wait-edit-save').addEventListener('click', () => {
                const index = document.getElementById('mv-wait-edit-id').value;
                const text = document.getElementById('mv-wait-edit-text').value.trim();
                const message = document.getElementById('mv-wait-edit-message').value.trim();

                if (!text || !message) {
                    alert('Texto e mensagem são obrigatórios.');
                    return;
                }

                if (index === '') {
                    // Adicionar novo
                    UIManager.state.settings.waitTimes.push({ text, message });
                } else {
                    // Editar existente
                    UIManager.state.settings.waitTimes[index] = { text, message };
                }

                UIManager.renderListsInModal();
                UIManager.hideEditModal();
            });

            document.getElementById('mv-wait-edit-cancel').addEventListener('click', UIManager.hideEditModal);

            // Salvar/cancelar edição de resposta rápida
            document.getElementById('mv-quick-edit-save').addEventListener('click', () => {
                const index = document.getElementById('mv-quick-edit-id').value;
                const text = document.getElementById('mv-quick-edit-text').value.trim();
                const message = document.getElementById('mv-quick-edit-message').value.trim();

                if (!text || !message) {
                    alert('Texto e mensagem são obrigatórios.');
                    return;
                }

                if (index === '') {
                    // Adicionar novo
                    UIManager.state.settings.quickReplies.push({ text, message });
                } else {
                    // Editar existente
                    UIManager.state.settings.quickReplies[index] = { text, message };
                }

                UIManager.renderListsInModal();
                UIManager.hideEditModal();
            });

            document.getElementById('mv-quick-edit-cancel').addEventListener('click', UIManager.hideEditModal);

            // Upload de imagens do cardápio
            document.getElementById('mv-menu-images-btn').addEventListener('click', () => {
                document.getElementById('mv-menu-images-input').click();
            });

            document.getElementById('mv-menu-images-input').addEventListener('change', e => {
                const currentImages = UIManager.state.settings.menu.images.length;
                const newImages = e.target.files.length;

                if (currentImages + newImages > CONFIG.maxImages) {
                    alert(`Você pode ter no máximo ${CONFIG.maxImages} imagens.`);
                    return;
                }

                Array.from(e.target.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        UIManager.state.settings.menu.images.push(event.target.result);
                        UIManager.renderImagePreviews();
                    };
                    reader.readAsDataURL(file);
                });

                // Limpa o input
                e.target.value = '';
            });

            // Upload de imagem de reanimação
            document.getElementById('mv-reanimate-image-btn').addEventListener('click', () => {
                document.getElementById('mv-reanimate-image-input').click();
            });

            document.getElementById('mv-reanimate-image-input').addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        UIManager.state.settings.reanimate.image = event.target.result;
                        UIManager.renderReanimatePreview();
                    };
                    reader.readAsDataURL(file);
                }

                // Limpa o input
                e.target.value = '';
            });

            // Funcionalidades de backup
            document.getElementById('mv-export-btn').addEventListener('click', () => {
                const exportData = DataManager.exportSettings();
                document.getElementById('mv-backup-text').value = exportData;

                // Download automático
                const blob = new Blob([exportData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `whatsapp-automation-backup-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });

            document.getElementById('mv-import-btn').addEventListener('click', () => {
                document.getElementById('mv-import-input').click();
            });

            document.getElementById('mv-import-input').addEventListener('change', e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (DataManager.importSettings(event.target.result)) {
                            alert('Configurações importadas com sucesso! A página será recarregada.');
                            location.reload();
                        } else {
                            alert('Erro ao importar configurações. Verifique se o arquivo está correto.');
                        }
                    };
                    reader.readAsText(file);
                }
                e.target.value = '';
            });

            // Limpar estatísticas
            document.getElementById('mv-reset-stats-btn').addEventListener('click', () => {
                if (confirm('Tem certeza que deseja limpar todas as estatísticas? Esta ação não pode ser desfeita.')) {
                    DataManager.set('statistics', {
                        customButtonClicks: {},
                        waitTimeClicks: {},
                        menuClicks: 0,
                        reanimateClicks: 0,
                        totalClicks: 0,
                        firstUse: new Date().toISOString(),
                        lastUse: new Date().toISOString()
                    });
                    UIManager.renderStats();
                }
            });

            // Zona de hover para mostrar botões
            document.getElementById('mv-edge-hover-zone').addEventListener('mouseenter', UIManager.showButtonsTemporarily);

            // Fechar modal clicando no backdrop
            document.getElementById('mv-modal-backdrop').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) {
                    const mainModal = document.getElementById('mv-modal');
                    const editModal = document.getElementById('mv-edit-modal');
                    const waitEditModal = document.getElementById('mv-wait-edit-modal');
                    const quickEditModal = document.getElementById('mv-quick-edit-modal');

                    if (mainModal.style.display === 'flex') {
                        UIManager.saveAndClose();
                    } else if (editModal.style.display === 'flex' || waitEditModal.style.display === 'flex' || quickEditModal.style.display === 'flex') {
                        UIManager.hideEditModal();
                    }
                }
            });
        },

        init: function() {
            if (document.getElementById(CONFIG.containerId)) return;

            console.log('[WA MV] UI v5.2 com ajustes de UI injetada.');
            this.injectStyles();
            this.createDOM();
            this.renderFloatingButtons();
            this.initEventListeners();
        }
    };

    // =================================================================================
    // 6. INICIALIZAÇÃO DO SCRIPT
    // =================================================================================
    console.log('[WA MV] Script v5.2 com ajustes de UI carregado. Observando o DOM...');

    const observer = new MutationObserver((mutations, obs) => {
        if (document.querySelector(CONFIG.selectors.app)) {
            console.log('[WA MV] Elemento #app encontrado. Iniciando a UI com ajustes.');
            UIManager.init();
            obs.disconnect();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

})();

