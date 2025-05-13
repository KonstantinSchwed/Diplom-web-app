['userName', 'userSurname', 'fatherName'].forEach(key => {
    if (sessionStorage.getItem(key) !== null) {
        sessionStorage.removeItem(key);
        console.log(`Удалён ${key}`);
    }
});
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
function preloadBackgroundImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = resolve;
        img.onerror = reject;
    });
}
document.addEventListener("DOMContentLoaded", function () {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
    preloader.classList.add('show'); 
    }, 2000); 
    fetch('/check-auth')
    .then(response => response.json())
    .then(data => {
        if (data.role !== 'user') {
            window.location.href = '/Enteringpage/html/entering.html';
        } else {
            let socket;
            fetch('/get-user-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userName: data.userName,
                    userSurname: data.userSurname,
                    fatherName: data.fatherName
                })
            })
            .then(response => response.json())
            .then(idresult => {
                if (!idresult.success) return console.error("Не удалось получить ID пользователя");
                const userId = idresult.userId;
                updateUnreadBadge();
                const adminId = 1; 
                let selectedReceiverId = adminId;
                let isChatOpen = false;
                const lastMessageIds = {};
            
                let tabId = sessionStorage.getItem('chatTabId');
                if (!tabId) {
                    tabId = `${Date.now()}-${Math.random()}`;
                    sessionStorage.setItem('chatTabId', tabId);
                }
                
                socket = new WebSocket('ws://192.168.100.2:3000');
                
                socket.addEventListener('open', () => {
                    socket.send(JSON.stringify({ type: 'init', userId, tabId }));
                });
            
                const syncChannel = new BroadcastChannel('chat-sync');
                function notifyTabsAboutNewMessage() {
                    syncChannel.postMessage({ type: 'new-message' });
                }
            
                syncChannel.onmessage = (e) => {
                    if (e.data.type === 'new-message') {
                        loadChatHistory(true);
                        updateUnreadBadge();
                    }
                
                    if (e.data.type === 'messages-read') {
                        updateUnreadBadge();
                    }
                };
                socket.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'new-message') {
                        const msg = data.message;
                        if (
                            (msg.sender_id === selectedReceiverId && msg.receiver_id === userId) ||
                            (msg.sender_id === userId && msg.receiver_id === selectedReceiverId)
                        ) {
                            loadChatHistory(true);
                            updateUnreadBadge();
                            notifyTabsAboutNewMessage(); 
                        }
                    }
                });
            
 
                function updateUnreadBadge() {
                    fetch('/get-unread-messages-from-admin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ receiverId: userId })  
                    })
                    .then(res => res.json())
                    .then(unread => {
                        const messages = unread.messages;
                        if (!Array.isArray(messages)) return;
            
                        const count = messages.length;
            
                        const targets = [
                            ...document.querySelectorAll('.button4'),
                            ...document.querySelectorAll('.adminlogo')
                        ];
            
                        if (targets.length === 0) return;
            
                        targets.forEach(target => {
                            const existingBadge = target.querySelector('.unread-badge');
                            if (existingBadge) existingBadge.remove();
            
                            if (count > 0) {
                                const badge = document.createElement('div');
                                badge.className = 'unread-badge';
                                badge.textContent = count;
            
                                target.style.position = 'relative';
                                target.appendChild(badge);
                            }
                        });
                    })
                    .catch(err => {
                        console.error('Ошибка при проверке непрочитанных сообщений:', err);
                    });
                }
            
                document.querySelectorAll(".button4, .adminlogo").forEach(el => {
                    el.addEventListener("click", () => {
                        document.querySelector(".modal-operator-container").classList.add("show");
                        loadChatHistory(true);
                        isChatOpen = true;
                    });
                });
 
                document.querySelector(".operator-close-button, .close-operator-container, .modal-operator-container")
                    .addEventListener("click", function(event) {
                        if (
                            event.target === this ||
                            event.target.classList.contains("operator-close-button") ||
                            event.target.classList.contains("close-operator-container")
                        ) {
                            document.querySelector(".modal-operator-container").classList.remove("show");
                            isChatOpen = false;
                        }
                    });
            
   
                document.querySelector('.operator-message-input').addEventListener('keydown', e => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMessage();
                    }
                });
            

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
                            }).then(() => {
                   
                                updateUnreadBadge();
                        
                        
                                syncChannel.postMessage({ type: 'messages-read' });
                            });
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
            
                function sendMessage() {
                    const messageInput = document.querySelector('.operator-message-input');
                    const messageContent = messageInput.value.trim();
            
                    if (!messageContent) {
                        alert('Введите сообщение');
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
            })
            .catch(error => {
                console.error('Ошибка при получении ID пользователя:', error);
            });
            
            const getadminfo = fetch('/get-admin-info', {
                method: 'POST',  
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(res => res.json())
            .then(admin => {
                const operatorContainer = document.querySelector(".operator-container");
                const operatorAvatar = operatorContainer.querySelector(".operator-user-avatar img");
                const operatorAvatar2 = document.querySelector(".adminlogo");
                const operatorName = operatorContainer.querySelector(".operator-name");
                const operatorRole = operatorContainer.querySelector(".operator-position");
            

                const today = new Date();
                const birthDate = new Date(admin.birth);
                const isBirthday = today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
                const displayRole = isBirthday ? "Сегодня день рождения" : "Администратор" || "Не указана роль";
            
    
                const avatarHTML = admin.miniPicture
                    ? `<img src="${admin.miniPicture}" alt="Admin Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
                    : `<img class="admin-icon2" src="/Projectresources/iconsmall.png" alt="Admin Default Icon">`;
            
        
                let fullName = `${admin.surname} ${admin.name}`;
                if (admin.fatherName) {
                    fullName += ` ${admin.fatherName}`;  
                }
            
        
                operatorName.textContent = fullName;
                operatorRole.textContent = displayRole;
                operatorAvatar.outerHTML = avatarHTML;
                operatorAvatar2.innerHTML = avatarHTML;
            })
            .catch(err => {
                console.error('Ошибка при получении информации об администраторе:', err);
            });
            document.querySelectorAll(".surname, .name, .fathername, .special").forEach(input => {
            input.disabled = true;
            });
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
            }).then(response => response.json()).then(data => {
                if (data.miniPicture) {
                    const userLogo1 = document.querySelector(".userlogo");
                    userLogo1.innerHTML = `<img src="${data.miniPicture}" alt="User Logo" style="width: 10vh; height: 10vh; object-fit: cover; border-radius: 50%;">`;
                } else {
                    console.log('Мини-изображение не найдено.');
                }
            })
            .catch(error => {
                console.error('Ошибка при получении изображения:', error);
            });
            const backgroundImage = preloadBackgroundImage("/Projectresources/Skypicture.jpg");
                Promise.all([fetchProfilePicture, backgroundImage, getadminfo])
                .then(() => {
                    preloader.remove();
                    document.body.style.visibility = 'visible';
                })
                .catch(error => {
                    console.error('Ошибка при загрузке:', error);
                    preloader.remove();
                    document.body.style.visibility = 'visible';
                });
        const userData = {
            userName: data.userName,
            birthDate: data.birthDate
        };
        updateUserGreeting(userData);
        document.querySelector(".button7").addEventListener("click", () => {
            fetch('/logout', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        socket.close();
                        document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        document.cookie = "userSurname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                        window.location.href = '/Enteringpage/html/entering.html';
                    }
                })
                .catch(error => console.error('Ошибка выхода:', error));
        });
        document.querySelector(".button6").addEventListener("click", () => {
        socket.close();
        window.location.href = '/User/Userpersonalaccount/html/uaccount.html';
         });
        document.querySelector(".button3").addEventListener("click", () => {
        socket.close();
        window.location.href = '/User/Userleariningprograms/html/ulprograms.html';
         });
        document.querySelector(".userlogo").addEventListener("click", () => {
        socket.close();
        window.location.href = '/User/Userpersonalaccount/html/uaccount.html';
        });
        document.querySelector(".button1").addEventListener("click", () => {
        socket.close();
        window.location.href = '/User/Useristruct/html/uinstr.html';
         });
    }
})
.catch(error => {
    console.error('Ошибка проверки авторизации:', error);
    window.location.href = '/Enteringpage/html/entering.html';
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