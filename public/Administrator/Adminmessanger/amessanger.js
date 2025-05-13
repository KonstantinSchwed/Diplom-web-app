function updateUserGreeting(data) {
    const userTextElement = document.querySelector('.userlogotext');
    if (!userTextElement || !data) return;
    const now = new Date();
    const hours = now.getHours();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1; 
    let greeting;
    if (data.birthDate) {
        const birthDate = new Date(data.birthDate); 
        const birthDay = birthDate.getDate();
        const birthMonth = birthDate.getMonth() + 1;

        if (todayDay === birthDay && todayMonth === birthMonth) {
            greeting = `С Днём Рождения, ${data.userName}! 🎉`;
        }
    }
    if (!greeting) {
        if (hours >= 5 && hours < 12) {
            greeting = `Доброе утро, ${data.userName}`;
        } else if (hours >= 12 && hours < 18) {
            greeting = `Хорошего дня, ${data.userName}`;
        } else if (hours >= 18 && hours < 24) {
            greeting = `Приятного вечера, ${data.userName}`;
        } else {
            greeting = `Прекрасной ночи, ${data.userName}`;
        }
    }

    userTextElement.textContent = greeting;
}
function showModal(message, isSuccess, onClose = null) {
    const overlay = document.getElementById('modal-overlay');
    const modalText = document.getElementById('modal-text');
    const logo = isSuccess ? '/Projectresources/logo+.svg' : '/Projectresources/logo-.svg';

    modalText.innerHTML = `
    ${message}
     <img id="logo" src="${logo}" alt="Logo">
    `;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('show'));

    const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
    overlay.style.display = 'none';
    if (onClose) onClose();
    }, 200);
    };

    document.getElementById('confirm-yes').onclick = close;
    document.getElementById('close-modal').onclick = close;
    overlay.onclick = (e) => {
    if (e.target === overlay) close();
    };

    }

    function showConfirmationModal(message, onConfirm) {
        const overlay = document.getElementById("confirmation-modal-overlay");
        const modalText = document.getElementById("confirmation-modal-text");
        const confirmButton = document.getElementById("confirm-yes-yes");
        const cancelButton = document.getElementById("cancel-yes");
        const closeButton = document.getElementById("close-confirmation-modal");

        // Устанавливаем текст в модалке
        modalText.textContent = message;

        // Открытие модалки
        overlay.style.display = "flex";
        setTimeout(() => overlay.classList.add("show"), 10);

        // Обработчик для подтверждения (кнопка "Да")
        confirmButton.onclick = () => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.style.display = "none", 200);
            onConfirm(); // Вызов функции при подтверждении
        };

        // Обработчик для отмены (кнопка "Нет")
        cancelButton.onclick = () => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.style.display = "none", 200);
        };

        // Обработчик для закрытия через крестик
        closeButton.onclick = () => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.style.display = "none", 200);
        };

        // Закрытие модалки при клике на оверлей
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                overlay.classList.remove("show");
                setTimeout(() => overlay.style.display = "none", 200);
            }
        };
    }
function preloadBackgroundImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });
}

window.addEventListener('pageshow', function (event) {
     if (event.persisted) {
         location.reload();
     }
 });
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
setTimeout(() => {
preloader.classList.add('show'); 
}, 2000); 
    
fetch('/check-auth')
.then(response => {
if (!response.ok) {
    throw new Error('Ошибка проверки авторизации');
}
return response.json();
})
.then(data => {
if (data.role !== 'admin') {
    window.location.href = '/Enteringpage/html/entering.html';
} else {

    const userId = 1;
    let selectedReceiverId = null;
    let activeMessage = null;
    let isChatOpen = false;
    const lastMessageIds = {};
    const syncChannel = new BroadcastChannel('chat-sync'); 
    let tabId = sessionStorage.getItem('chatTabId');
    if (!tabId) {
        tabId = `${Date.now()}-${Math.random()}`;
        sessionStorage.setItem('chatTabId', tabId);
    }
    
    const socket = new WebSocket('ws://192.168.100.2:3000');
    
    socket.addEventListener('open', () => {
        socket.send(JSON.stringify({ type: 'init', userId, tabId }));
    });
    
    socket.addEventListener('message', (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'new-message') {
            const msg = data.message;
            console.log('AAAAAAA');
            console.log(msg.sender_id, msg.content);
            updateMessagePreview(msg.sender_id, msg.content);
            moveUserToTop(msg.sender_id); // ⬆️ перемещаем чат вверх
    
            // Синхронизируем обновление на других вкладках
            syncChannel.postMessage({ type: 'new-message', message: msg });
    
            if (
                (msg.sender_id === selectedReceiverId && msg.receiver_id === userId) ||
                (msg.sender_id === userId && msg.receiver_id === selectedReceiverId)
            ) {
                loadChatHistory(true);
            }
        }
    });
    syncChannel.onmessage = (e) => {
        if (e.data.type === 'new-message') {
            const msg = e.data.message;
            console.log('HAHHAHA');
            console.log(msg.sender_id, msg.content);
            // Обновляем превью и перемещаем пользователя на всех вкладках
            updateMessagePreview(msg.sender_id, msg.content);
            moveUserToTop(msg.sender_id);
    
            // Если это сообщение для выбранного получателя, загружаем историю
            if (
                (msg.sender_id === selectedReceiverId && msg.receiver_id === userId) ||
                (msg.sender_id === userId && msg.receiver_id === selectedReceiverId)
            ) {
                loadChatHistory(true);
            }
        }
    };
    
    fetch('/get-user-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
    })
    .then(response => response.json())
    .then(data => {
        const container = document.querySelector('.incontainer');
        container.innerHTML = '';
    
        data.forEach(user => {
            const { senderId, surname, name, fatherName, miniPicture, content, role, birth } = user;
    
            if (container.querySelector(`[data-id="${senderId}"]`)) return;
    
            const today = new Date();
            const birthDate = new Date(birth);
            const isBirthday = today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
            const displayRole = isBirthday ? "Сегодня день рождения" : role || 'Не указана роль';
    
            const userElement = document.createElement('div');
            userElement.classList.add('user-message');
            userElement.setAttribute("data-id", senderId);
    
            const avatarHTML = miniPicture
                ? `<img class="admin-icon" src="${miniPicture}" alt="User Avatar" style="object-fit: contain; width: 100%; height: 100%; border-radius: 50%;">`
                : `<img class="admin-icon" src="/Projectresources/iconsmall.png" alt="Admin Icon">`;
    
            userElement.innerHTML = `
                <div class="user-avatar">${avatarHTML}</div>
                <div class="message-content">
                    <strong class="user-name">${surname} ${name} ${fatherName}</strong>
                    <p class="message-preview">${content || 'Новых сообщений не получено!'}</p>
                </div>
            `;
    
            container.appendChild(userElement);
    
            userElement.addEventListener("click", () => {
                selectedReceiverId = senderId;
    
                const operatorContainer = document.querySelector(".operator-container");
                const operatorAvatar = operatorContainer.querySelector(".operator-user-avatar img");
                const operatorName = operatorContainer.querySelector(".operator-name");
                const operatorRole = operatorContainer.querySelector(".operator-position");
    
                operatorName.textContent = `${surname} ${name} ${fatherName}`;
                operatorRole.textContent = displayRole;
                operatorAvatar.outerHTML = avatarHTML;
    
                loadChatHistory(true);
    
                if (activeMessage === userElement && operatorContainer.classList.contains("show")) {
                    operatorContainer.classList.remove("show");
                    activeMessage = null;
                    isChatOpen = false;
                } else {
                    operatorContainer.classList.add("show");
                    activeMessage = userElement;
                    isChatOpen = true;
                }
            });
        });
    });
    
    function moveUserToTop(senderId) {
        const container = document.querySelector('.incontainer');
        const userElement = container.querySelector(`[data-id="${senderId}"]`);
        if (userElement) {
            container.prepend(userElement);
        }
    }
    
    function loadChatHistory(forceScroll = false) {
        const chatContainer = document.querySelector(".operator-chat-content");
    
        fetch('/get-chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: userId,
                receiverId: selectedReceiverId
            })
        })
        .then(res => res.json())
        .then(messages => {
            if (!Array.isArray(messages)) return;
    
            const newLastMessageId = messages[messages.length - 1]?.id;
            const shouldScroll = forceScroll || newLastMessageId !== lastMessageIds[selectedReceiverId];
            lastMessageIds[selectedReceiverId] = newLastMessageId;
    
            if (isChatOpen) {
                fetch('/mark-messages-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        senderId: selectedReceiverId,
                        receiverId: userId
                    })
                }).then(() => updateMessagePreview(selectedReceiverId, null));
            }
    
            chatContainer.innerHTML = '';
    
            if (messages.length === 0) {
                chatContainer.textContent = 'В данный момент сообщений нет!';
                return;
            }
    
            messages.forEach(msg => {
                const msgElem = document.createElement('div');
                msgElem.classList.add('chat-message', msg.sender_id === userId ? 'sent' : 'received');
    
                const messageTime = new Date(msg.timestamp);
                const hours = messageTime.getUTCHours().toString().padStart(2, '0');
                const minutes = messageTime.getUTCMinutes().toString().padStart(2, '0');
                const day = messageTime.getUTCDate().toString().padStart(2, '0');
                const month = (messageTime.getUTCMonth() + 1).toString().padStart(2, '0');
                const year = messageTime.getUTCFullYear();
    
                msgElem.innerHTML = `
                    <div class="text" lang="ru">${msg.content}</div>
                    <div class="timestamp">
                        <div>${hours}:${minutes}</div>
                        <div>${day}.${month}.${year}</div>
                    </div>
                `;
    
                chatContainer.appendChild(msgElem);
            });
    
            if (shouldScroll) {
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        });
    }
    
    function updateMessagePreview(senderId, content) {
        const userElement = document.querySelector(`[data-id="${senderId}"]`);
        if (userElement) {
            const preview = userElement.querySelector('.message-preview');
            preview.textContent = content || 'Новых сообщений не получено!';
        }
    }
    
    document.querySelector('.operator-message-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    function sendMessage() {
        const messageInput = document.querySelector('.operator-message-input');
        const messageContent = messageInput.value.trim();
    
        if (!messageContent || !selectedReceiverId) {
            alert('Пожалуйста, выберите получателя и введите сообщение');
            return;
        }
    
        socket.send(JSON.stringify({
            type: 'message',
            senderId: userId,
            receiverId: selectedReceiverId,
            content: messageContent
        }));
    
        messageInput.value = '';
    }
    
    document.querySelector('.operator-delete-button').addEventListener('click', () => {
        const chatContent = document.querySelector('.operator-chat-content');
    
        if (chatContent && chatContent.textContent.trim() === "В данный момент сообщений нет!") {
            showModal('Чат пустой! Удалять нечего.', false);
            return;
        }
    
        if (!selectedReceiverId) return showModal("Выберите пользователя!", false);
    
        showConfirmationModal("Вы уверены, что хотите удалить переписку?", () => {
            fetch('/delete-chat-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: userId,
                    receiverId: selectedReceiverId
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showModal('Переписка успешно удалена!', true, () => {
                        loadChatHistory(true);
                    });
                } else {
                    showModal('Не удалось удалить переписку', false);
                }
            });
        });
    });
    
    document.querySelector(".operator-close-button").addEventListener("click", () => {
        document.querySelector(".operator-container").classList.remove("show");
        activeMessage = null;
        isChatOpen = false;
    });
    
    document.querySelector(".close-operator-container").addEventListener("click", () => {
        document.querySelector(".operator-container").classList.remove("show");
        activeMessage = null;
        isChatOpen = false;
    });
    
    
    const userData = {
        userName: data.userName,
        birthDate: data.birthDate
    };
    updateUserGreeting(userData);
    const fetchProfilePicture = fetch('/get-profile-picture', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            role: data.role,
                            userName: data.userName,
                            userSurname: data.userSurname,
                            fatherName: data.fatherName,
                            sex: data.sex,
                            birthDate: data.birthDate
                        })
                    })
                    .then(response => response.json())
                    .then(profileData => {
                        if (profileData.miniPicture) {
                            const userLogo1 = document.querySelector(".userlogo");
                            userLogo1.innerHTML = `<img src="${profileData.miniPicture}" alt="User Logo" style="width: 10vh; height: 10vh; object-fit: cover; border-radius: 50%;">`;

                        }
                    })
                    .catch(error => console.error('Ошибка при получении изображения:', error));
                    const backgroundImage = preloadBackgroundImage("/Projectresources/Skypicture.jpg");
                    Promise.all([fetchProfilePicture, backgroundImage])
                    .then(() => {
                        // Удаляем прелоудер из DOM после загрузки
                        preloader.remove();
                        document.body.style.visibility = 'visible';
                    })
                    .catch(error => {
                        console.error('Ошибка при загрузке:', error);
                        preloader.remove();
                        document.body.style.visibility = 'visible';
                    });
                    document.querySelector(".buttonback").addEventListener("click", () => {
                        socket.close();
                        window.location.href = '/Administrator/Administratormainmenu/html/amainmenu.html';
                    });
                    document.querySelector(".userlogo").addEventListener("click", () => {
                        socket.close();
                        window.location.href = '/Administrator/Personalaccount/html/paccount.html';
                    });
}
})
.catch(error => {
console.error('Ошибка проверки авторизации:', error);

}); 
        document.querySelector('.clickable-footer').addEventListener('click', function() {
            var filename = "Пользовательское соглашение.txt"; 
            var downloadLink = document.createElement('a');
            downloadLink.href = "/Projectresources/" + filename; 
            downloadLink.download = filename;  
            document.body.appendChild(downloadLink);
            downloadLink.click();  
            document.body.removeChild(downloadLink);  
        });
});
