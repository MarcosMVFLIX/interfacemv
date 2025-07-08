// ==UserScript==
// @name          Botão de Menu Dinâmico Flutuante para WhatsApp Web
// @namespace     http://tampermonkey.net/
// @version       2.1
// @description   Adiciona um botão flutuante com menu dinâmico para envio de mensagens no WhatsApp Web.
// @author        ChatGPT, Gemini e Seu Master Super Top Programador
// @match         https://web.whatsapp.com/
// @grant         none
// ==/UserScript==

(function() {
    'use strict';

    // SVG para o ícone de Salgado
    const SALGADO_SVG = `📋`;

    // SVG para o ícone de Lista/Menu
    const LIST_SVG = `<svg viewBox="0 0 24 24" height="24" width="24" preserveAspectRatio="xMidYMid meet" fill="currentColor">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zm0-8h14V7H7v2z"/>
    </svg>`;

    // SVG para o ícone de Configurações (engrenagem)
    const SETTINGS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-320q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47Zm0 240q-143 0-241.5-98.5T140-480q0-143 98.5-241.5T480-820q143 0 241.5 98.5T820-480q0 143-98.5 241.5T480-140Zm0 80q174 0 297-123t123-297q0-174-123-297t-297-123q-174 0-297 123T80-480q0 174 123 297t297 123Zm0-320Z"/></svg>`;

    // Estrutura de dados para armazenar as listas de menu
    let menusData = JSON.parse(localStorage.getItem('whatsappDynamicMenus')) || {
        activeMenuId: null,
        menus: []
    };

    // Garante que sempre há pelo menos um menu
    if (menusData.menus.length === 0) {
        const defaultMenuId = Date.now().toString();
        menusData.menus.push({
            id: defaultMenuId,
            name: 'Salgados (Padrão)',
            title: '*Cardápio de Salgados*',
            footer: '_Aguardamos seu pedido!_',
            items: [],
            isActive: true
        });
        menusData.activeMenuId = defaultMenuId;
        saveMenusData();
    } else if (!menusData.activeMenuId && menusData.menus.length > 0) {
        menusData.activeMenuId = menusData.menus[0].id;
        saveMenusData();
    }

    function saveMenusData() {
        localStorage.setItem('whatsappDynamicMenus', JSON.stringify(menusData));
    }

    function getMenuById(id) {
        return menusData.menus.find(m => m.id === id);
    }

    // Função para criar o botão flutuante principal
    function createFloatingButton() {
        if (document.getElementById('floating-menu-button')) return;

        const floatingButton = document.createElement('button');
        floatingButton.id = 'floating-menu-button';
        floatingButton.style.cssText = `
            position: fixed;
            bottom: 590px;
            right: 250px;
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background-color: #25D366;
            color: white;
            border: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: all 0.3s ease;
font-size: 16px; /* Tamanho aumentado para o emoji */
line-height: 1; /* Garante alinhamento vertical */
        `;
        floatingButton.innerHTML = SALGADO_SVG;

        // Efeito de hover
        floatingButton.onmouseover = () => {
            floatingButton.style.transform = 'scale(1.1)';
            floatingButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.3)';
        };
        floatingButton.onmouseout = () => {
            floatingButton.style.transform = 'scale(1)';
            floatingButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
        };

        // --- Evento de CLIQUE ESQUERDO ---
        floatingButton.onclick = async () => {
            const activeMenu = getMenuById(menusData.activeMenuId);

            if (!activeMenu || activeMenu.items.length === 0) {
                openInstructionsModal();
                return;
            }

            const ativosLista = activeMenu.items.filter(s => s.active).map(s => s.name).join('\n');
            const inativosLista = activeMenu.items.filter(s => !s.active).map(s => s.name).join('\n');

            let message = '';
            if (activeMenu.title) {
                message += `${activeMenu.title}\n\n`;
            }

            message += ativosLista ? ativosLista : "Nenhum item disponível no momento.";

            if (inativosLista && inativosLista.trim() !== '') {
                message += `\n\n*Itens indisponíveis no momento:*\n`;
                message += inativosLista;
            }

            if (activeMenu.footer) {
                message += `\n\n${activeMenu.footer}`;
            }

            const messageInput = document.querySelector('div.x1hx0egp.x6ikm8r.x1odjw0f.x1k6rcq7.x6prxxf[contenteditable="true"][data-tab="10"]');

            if (messageInput) {
                messageInput.focus();
                try {
                    messageInput.innerHTML = '<p><br></p>';
                    const dataTransfer = new DataTransfer();
                    dataTransfer.setData('text/plain', message);
                    const pasteEvent = new ClipboardEvent('paste', {
                        bubbles: true,
                        cancelable: true,
                        dataType: 'text/plain',
                        data: message,
                        clipboardData: dataTransfer
                    });
                    messageInput.dispatchEvent(pasteEvent);
                } catch (e) {
                    console.error("Erro ao simular colagem:", e);
                    messageInput.innerText = message;
                    const inputEvent = new Event('input', { bubbles: true });
                    messageInput.dispatchEvent(inputEvent);
                }

                setTimeout(() => {
                    const sendButton = document.querySelector('button[aria-label="Enviar"]');
                    if (sendButton) sendButton.click();
                }, 200);
            } else {
                alert('Não foi possível encontrar o campo de mensagem. Mensagem gerada:\n\n' + message);
            }
        };

        // --- Evento de CLIQUE DIREITO ---
        floatingButton.oncontextmenu = (e) => {
            e.preventDefault();
            openMainSettingsModal();
        };

        document.body.appendChild(floatingButton);
    }

    // Função para abrir o modal principal de configurações
    function openMainSettingsModal() {
        const existingModal = document.getElementById('main-settings-modal');
        if (existingModal) existingModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'main-settings-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999999;
            backdrop-filter: blur(2px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 500px;
            max-height: 80%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.3s ease-out;
        `;

        if (!document.getElementById('salgado-modal-styles')) {
            const style = document.createElement('style');
            style.id = 'salgado-modal-styles';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

        const modalHeader = document.createElement('h3');
        modalHeader.textContent = 'Gerenciar Menus';
        modalHeader.style.cssText = 'margin-top: 0; margin-bottom: 20px; color: #25D366; text-align: center;';

        const menuListContainer = document.createElement('div');
        menuListContainer.id = 'main-menu-list-container';
        menuListContainer.style.cssText = 'flex-grow: 1; margin-bottom: 20px;';

        const addNewMenuButton = document.createElement('button');
        addNewMenuButton.textContent = 'Adicionar Novo Menu';
        addNewMenuButton.style.cssText = `
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 15px;
            cursor: pointer;
            font-size: 15px;
            font-weight: bold;
            transition: background-color 0.2s ease;
            align-self: center;
            margin-bottom: 20px;
        `;
        addNewMenuButton.onmouseover = () => addNewMenuButton.style.backgroundColor = '#0056b3';
        addNewMenuButton.onmouseout = () => addNewMenuButton.style.backgroundColor = '#007bff';
        addNewMenuButton.onclick = () => {
            const newMenuId = Date.now().toString();
            const newMenu = {
                id: newMenuId,
                name: `Novo Menu ${menusData.menus.length + 1}`,
                title: '*Seu Título do Menu*',
                footer: '_Rodapé do Menu_',
                items: [],
                isActive: false
            };
            menusData.menus.push(newMenu);
            saveMenusData();
            renderMainSettingsList();
            openMenuEditorModal(newMenuId);
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar';
        closeButton.style.cssText = `
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            align-self: flex-end;
            margin-top: 10px;
            transition: background-color 0.2s ease;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#5a6268';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = '#6c757d';
        closeButton.onclick = () => modalOverlay.remove();

        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        };

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(menuListContainer);
        modalContent.appendChild(addNewMenuButton);
        modalContent.appendChild(closeButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        renderMainSettingsList();
    }

    // Função para renderizar a lista de menus na tela principal
    function renderMainSettingsList() {
        const menuListContainer = document.getElementById('main-menu-list-container');
        if (!menuListContainer) return;

        menuListContainer.innerHTML = '';

        if (menusData.menus.length === 0) {
            menuListContainer.innerHTML = '<p style="text-align: center; color: #666; font-size: 14px;">Nenhum menu cadastrado. Adicione um!</p>';
            return;
        }

        menusData.menus.forEach((menu, index) => {
            const menuItemDiv = document.createElement('div');
            menuItemDiv.className = 'main-menu-item';
            menuItemDiv.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 10px;
                background-color: #f0f2f5;
                padding: 12px;
                border-radius: 8px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                position: relative;
            `;

            const radioInput = document.createElement('input');
            radioInput.type = 'radio';
            radioInput.name = 'activeMenu';
            radioInput.checked = (menusData.activeMenuId === menu.id);
            radioInput.style.marginRight = '12px';
            radioInput.style.minWidth = '22px';
            radioInput.style.minHeight = '22px';
            radioInput.style.cursor = 'pointer';
            radioInput.style.accentColor = '#25D366';
            radioInput.onchange = () => {
                menusData.activeMenuId = menu.id;
                saveMenusData();
            };

            const menuInfoSpan = document.createElement('span');
            menuInfoSpan.textContent = menu.name;
            menuInfoSpan.style.cssText = `
                flex-grow: 1;
                font-size: 16px;
                color: #333;
                font-weight: bold;
                margin-right: 15px;
            `;

            const editButton = document.createElement('button');
            editButton.innerHTML = SETTINGS_SVG;
            editButton.title = `Editar "${menu.name}"`;
            editButton.style.cssText = `
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.2s ease;
                margin-right: 8px;
                flex-shrink: 0;
            `;
            editButton.onmouseover = () => editButton.style.backgroundColor = '#0056b3';
            editButton.onmouseout = () => editButton.style.backgroundColor = '#007bff';
            editButton.onclick = () => openMenuEditorModal(menu.id);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Remover';
            deleteButton.style.cssText = `
                background-color: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 6px 10px;
                cursor: pointer;
                font-size: 13px;
                font-weight: bold;
                transition: background-color 0.2s ease;
                flex-shrink: 0;
            `;
            deleteButton.onmouseover = () => deleteButton.style.backgroundColor = '#c82333';
            deleteButton.onmouseout = () => deleteButton.style.backgroundColor = '#dc3545';
            deleteButton.onclick = () => {
                if (menusData.menus.length === 1) {
                    alert('Você não pode remover o último menu. Crie um novo antes de tentar remover este.');
                    return;
                }
                if (confirm(`Tem certeza que deseja remover o menu "${menu.name}"?`)) {
                    menusData.menus = menusData.menus.filter(m => m.id !== menu.id);
                    if (menusData.activeMenuId === menu.id && menusData.menus.length > 0) {
                        menusData.activeMenuId = menusData.menus[0].id;
                    } else if (menusData.menus.length === 0) {
                        menusData.activeMenuId = null;
                    }
                    saveMenusData();
                    renderMainSettingsList();
                }
            };

            menuItemDiv.appendChild(radioInput);
            menuItemDiv.appendChild(menuInfoSpan);
            menuItemDiv.appendChild(editButton);
            menuItemDiv.appendChild(deleteButton);
            menuListContainer.appendChild(menuItemDiv);
        });
    }

    // Função para abrir o editor de um menu específico
    function openMenuEditorModal(menuId) {
        const existingModal = document.getElementById('menu-editor-modal');
        if (existingModal) existingModal.remove();

        const currentMenu = getMenuById(menuId);
        if (!currentMenu) return;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'menu-editor-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999999;
            backdrop-filter: blur(2px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 550px;
            max-height: 80%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.3s ease-out;
        `;

        const modalHeader = document.createElement('h3');
        modalHeader.textContent = `Editando: ${currentMenu.name}`;
        modalHeader.style.cssText = 'margin-top: 0; margin-bottom: 20px; color: #25D366; text-align: center;';

        // Campo para Nome do Menu
        const menuNameLabel = document.createElement('label');
        menuNameLabel.textContent = 'Nome do Menu:';
        menuNameLabel.style.cssText = 'font-size: 14px; margin-bottom: 5px; color: #555;';
        const menuNameInput = document.createElement('input');
        menuNameInput.type = 'text';
        menuNameInput.value = currentMenu.name;
        menuNameInput.placeholder = 'Ex: Almoço, Salgados da Noite';
        menuNameInput.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
            margin-bottom: 15px;
            box-sizing: border-box;
        `;
        menuNameInput.oninput = (e) => {
            currentMenu.name = e.target.value.trim();
            saveMenusData();
            modalHeader.textContent = `Editando: ${currentMenu.name}`;
            renderMainSettingsList();
        };

        // Campo para Título da Mensagem
        const titleLabel = document.createElement('label');
        titleLabel.textContent = 'Título da Mensagem:';
        titleLabel.style.cssText = 'font-size: 14px; margin-bottom: 5px; color: #555;';
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.value = currentMenu.title.replace(/\*/g, '');
        titleInput.placeholder = 'Seu Título Aqui';
        titleInput.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
            margin-bottom: 15px;
            box-sizing: border-box;
        `;
        titleInput.oninput = (e) => {
            const value = e.target.value.trim();
            currentMenu.title = value ? `*${value}*` : '';
            saveMenusData();
        };

        // Campo para Rodapé da Mensagem
        const footerLabel = document.createElement('label');
        footerLabel.textContent = 'Rodapé da Mensagem:';
        footerLabel.style.cssText = 'font-size: 14px; margin-bottom: 5px; color: #555;';
        const footerInput = document.createElement('input');
        footerInput.type = 'text';
        footerInput.value = currentMenu.footer;
        footerInput.placeholder = '_Seu Rodapé Aqui_';
        footerInput.style.cssText = `
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
            margin-bottom: 15px;
            box-sizing: border-box;
        `;
        footerInput.oninput = (e) => {
            currentMenu.footer = e.target.value;
            saveMenusData();
        };

        // Container para a lista de itens
        const listContainer = document.createElement('div');
        listContainer.id = 'menu-items-list-container';
        listContainer.style.cssText = 'flex-grow: 1; margin-bottom: 20px; border: 1px solid #eee; padding: 10px; border-radius: 8px; background-color: #fafafa;';

        const addInputContainer = document.createElement('div');
        addInputContainer.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px;';

        const newItemInput = document.createElement('input');
        newItemInput.type = 'text';
        newItemInput.placeholder = 'Nome do novo item';
        newItemInput.style.cssText = `
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 5px;
            font-size: 14px;
        `;
        newItemInput.onkeypress = (e) => {
            if (e.key === 'Enter' && newItemInput.value.trim() !== '') {
                addItemButton.click();
            }
        };

        const addItemButton = document.createElement('button');
        addItemButton.textContent = 'Adicionar Item';
        addItemButton.style.cssText = `
            background-color: #25D366;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 8px 15px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: background-color 0.2s ease;
            white-space: nowrap;
        `;
        addItemButton.onmouseover = () => addItemButton.style.backgroundColor = '#1DA851';
        addItemButton.onmouseout = () => addItemButton.style.backgroundColor = '#25D366';
        addItemButton.onclick = () => {
            const name = newItemInput.value.trim();
            if (name) {
                currentMenu.items.push({ name: name, active: true });
                newItemInput.value = '';
                saveMenusData();
                renderMenuItems(menuId);
            }
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Voltar para Menus';
        closeButton.style.cssText = `
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            align-self: flex-end;
            margin-top: 10px;
            transition: background-color 0.2s ease;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#5a6268';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = '#6c757d';
        closeButton.onclick = () => {
            modalOverlay.remove();
            openMainSettingsModal();
        };

        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
                openMainSettingsModal();
            }
        };

        addInputContainer.appendChild(newItemInput);
        addInputContainer.appendChild(addItemButton);

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(menuNameLabel);
        modalContent.appendChild(menuNameInput);
        modalContent.appendChild(titleLabel);
        modalContent.appendChild(titleInput);
        modalContent.appendChild(footerLabel);
        modalContent.appendChild(footerInput);
        modalContent.appendChild(addInputContainer);
        modalContent.appendChild(listContainer);
        modalContent.appendChild(closeButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        renderMenuItems(menuId);
    }

    // Função para renderizar os itens de um menu
    function renderMenuItems(menuId) {
        const currentMenu = getMenuById(menuId);
        if (!currentMenu) return;

        const listContainer = document.getElementById('menu-items-list-container');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (currentMenu.items.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; color: #666; font-size: 14px;">Nenhum item adicionado a esta lista ainda.</p>';
            return;
        }

        currentMenu.items.forEach((item, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'menu-list-item';
            listItem.style.cssText = `
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                background-color: #f0f2f5;
                padding: 8px;
                border-radius: 8px;
                position: relative;
            `;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = item.active;
            checkbox.style.marginRight = '10px';
            checkbox.style.minWidth = '20px';
            checkbox.style.minHeight = '20px';
            checkbox.style.cursor = 'pointer';
            checkbox.onchange = () => {
                item.active = checkbox.checked;
                saveMenusData();
            };

            const textInput = document.createElement('input');
            textInput.type = 'text';
            textInput.value = item.name;
            textInput.style.cssText = `
                flex-grow: 1;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 6px;
                font-size: 14px;
                margin-right: 10px;
                background-color: white;
                box-sizing: border-box;
            `;
            textInput.oninput = (e) => {
                item.name = e.target.value;
                saveMenusData();
            };

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.style.cssText = `
                background-color: #ff4d4d;
                color: white;
                border: none;
                border-radius: 50%;
                width: 24px;
                height: 24px;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
                flex-shrink: 0;
            `;
            deleteButton.onmouseover = () => deleteButton.style.backgroundColor = '#cc0000';
            deleteButton.onmouseout = () => deleteButton.style.backgroundColor = '#ff4d4d';
            deleteButton.onclick = () => {
                currentMenu.items.splice(index, 1);
                saveMenusData();
                renderMenuItems(menuId);
            };

            listItem.appendChild(checkbox);
            listItem.appendChild(textInput);
            listItem.appendChild(deleteButton);
            listContainer.appendChild(listItem);
        });
    }

    // Função para abrir o modal de instruções
    function openInstructionsModal() {
        const existingModal = document.getElementById('menu-instructions-modal');
        if (existingModal) existingModal.remove();

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'menu-instructions-modal';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999999;
            backdrop-filter: blur(2px);
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background-color: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 450px;
            max-height: 80%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            animation: fadeIn 0.3s ease-out;
        `;

        const modalHeader = document.createElement('h3');
        modalHeader.textContent = 'Bem-vindo ao Botão de Menu Dinâmico!';
        modalHeader.style.cssText = 'margin-top: 0; margin-bottom: 15px; color: #25D366; text-align: center;';

        const instructionsText = document.createElement('p');
        instructionsText.style.cssText = 'font-size: 15px; line-height: 1.5; margin-bottom: 20px; color: #333;';
        instructionsText.innerHTML = `
            Parece que você está começando ou não tem menus configurados. Para começar, siga estes passos:<br><br>
            1. Clique com o **botão DIREITO** do mouse sobre o botão flutuante.<br>
            2. Irá abrir a tela de configurações onde você pode:<br>
            - **Adicionar novos menus** (ex: "Almoço", "Salgados da Noite")<br>
            - **Editar cada menu** (título, rodapé e itens)<br>
            - **Definir qual menu** deve estar ativo para envio<br><br>
            Depois de configurar, clique com o **botão ESQUERDO** no botão flutuante para enviar a lista do menu ativo!
        `;

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Entendi!';
        closeButton.style.cssText = `
            background-color: #25D366;
            color: white;
            border: none;
            border-radius: 5px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            align-self: center;
            margin-top: 10px;
            transition: background-color 0.2s ease;
        `;
        closeButton.onmouseover = () => closeButton.style.backgroundColor = '#1DA851';
        closeButton.onmouseout = () => closeButton.style.backgroundColor = '#25D366';
        closeButton.onclick = () => modalOverlay.remove();

        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        };

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(instructionsText);
        modalContent.appendChild(closeButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
    }

    // Inicia o script
    createFloatingButton();

    // Observa mudanças na página para recriar o botão se necessário
    const observer = new MutationObserver(() => {
        if (!document.getElementById('floating-menu-button')) {
            createFloatingButton();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();
