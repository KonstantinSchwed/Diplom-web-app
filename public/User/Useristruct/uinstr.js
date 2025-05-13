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
if (data.role !== 'user') {
    window.location.href = '/Enteringpage/html/entering.html';
} else {
    const fetchWordUser = fetch('/get-word-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.status === 204) { 
            console.log("Файл не найден или пустой в БД, редактор остается пустым");
            return; 
        }
        if (!response.ok) {
            throw new Error("Файл не найден или ошибка сервера");
        }
        return response.blob();
    })
    .then(blob => {
        if (!blob || blob.size === 0) { 
            return; 
        }

        var reader = new FileReader();
        reader.onload = function (event) {
            var arrayBuffer = reader.result;


            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function (result) {
                    let content = result.value;

                    content = content.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); 
                    quill.clipboard.dangerouslyPasteHTML(content.replace(/\n/g, '<br>')); 
                })
                .catch(function (err) {
                    console.error("Ошибка при обработке Word файла:", err);
                });
        };

        reader.readAsArrayBuffer(blob); 
    })
    .catch(error => console.error("Ошибка при загрузке файла из БД:", error));
    var quill = new Quill('#editor-container', {
    readOnly: true,
    theme: 'snow',
    modules: { toolbar: [] }
});
    const editor = document.querySelector('#editor-container');
    if (editor) {
        editor.style.userSelect = 'none'; 
    }
var BlockEmbed = Quill.import('blots/block/embed');
class AudioBlot extends BlockEmbed {
    static create(url) {
        let node = super.create();
        node.innerHTML = `
            <audio controls>
                <source src="${url}" type="audio/mpeg">
                Ваш браузер не поддерживает аудио.
            </audio>
        `;
        return node;
    }

    static value(node) {
        return node.querySelector("source").getAttribute("src");
    }
}
    AudioBlot.blotName = "audio";
    AudioBlot.tagName = "div";
    Quill.register(AudioBlot);

    quill.getModule('toolbar').addHandler('video', function() {
        var videoUrl = prompt('Введите URL видео (например, YouTube, Vimeo, VK, RuTube или Facebook)');
        
        if (videoUrl) {
            var embedUrl = videoUrl;
            var youtubeMatch = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/[^\/]+|(?:v|e(?:mbed)?)\/|(?:.*\?v=))([^"&?\/\s]*))/);
            if (youtubeMatch) {
                embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
            }
            var vimeoMatch = videoUrl.match(/(?:vimeo\.com\/)([0-9]{7,10})/);
            if (vimeoMatch) {
                embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            }
            var iframeEmbed = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
            quill.clipboard.dangerouslyPasteHTML(quill.getSelection().index, iframeEmbed + '<br>');
        }
    });
function processInsertedHtml(content) {
    var div = document.createElement('div');
    div.innerHTML = content;
    Array.from(div.querySelectorAll('img, iframe')).forEach(function(node) {

        if (node.nodeName === 'IMG') {
            const img = node;
            const width = img.getAttribute('width') || img.style.width || '';
            const height = img.getAttribute('height') || img.style.height || '';

            img.removeAttribute('style');
            
     
            if (width && height) {
                img.setAttribute('width', width);
                img.setAttribute('height', height);
            }
        }
        if (node.nodeName === 'IFRAME') {
            const iframe = node;
            const width = iframe.getAttribute('width') || iframe.style.width || '';
            const height = iframe.getAttribute('height') || iframe.style.height || '';
            
          
            iframe.removeAttribute('style');
            
      
            if (width && height) {
                iframe.setAttribute('width', width);
                iframe.setAttribute('height', height);
            }
        }
    });
    return div.innerHTML;
}

    const editorContainer = document.querySelector('#editor-container');
    let draggedElement = null;

    editorContainer.addEventListener('mousedown', function (event) {
        const element = event.target.closest('img'); 
        if (element) {
            draggedElement = element; 
            let offsetX = event.clientX - element.getBoundingClientRect().right;
            let offsetY = event.clientY - element.getBoundingClientRect().bottom;
            const onMouseMove = function (moveEvent) {
                const newWidth = moveEvent.clientX - draggedElement.getBoundingClientRect().left - offsetX;
                const newHeight = moveEvent.clientY - draggedElement.getBoundingClientRect().top - offsetY;
                if (newWidth > 100 && newHeight > 100) {
                    draggedElement.style.width = newWidth + 'px';
                    draggedElement.style.height = newHeight + 'px';
                    draggedElement.setAttribute('width', newWidth);
                    draggedElement.setAttribute('height', newHeight);
                }
            };
            const onMouseUp = function () {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    });
        const editorWrapper = document.getElementById("editor-wrapper");
        const buttonsContainer = document.getElementById("buttonsContainer2");
        const fullscreenToggle = document.getElementById("fullscreenToggle");
        const body = document.body;
        const mainEditor = document.querySelector('.maineditor');
        let isFullscreen = false;
        let overlay = null;
        let darkenBackground = null;

        fullscreenToggle.addEventListener("click", function () {
            if (!isFullscreen) {
                darkenBackground = document.createElement("div");
                darkenBackground.classList.add("fullscreen-darken");
                document.body.appendChild(darkenBackground);
                darkenBackground.style.display = "block"; 
                overlay = document.createElement("div");
                overlay.classList.add("fullscreen-overlay");
                overlay.appendChild(buttonsContainer);
                overlay.appendChild(editorWrapper);
                document.body.appendChild(overlay); 
                body.classList.add("fullscreen");
                fullscreenToggle.textContent = "Скрыть";

                isFullscreen = true;
            } else {
                mainEditor.appendChild(buttonsContainer);  
                mainEditor.appendChild(editorWrapper);    
                overlay.remove();
                darkenBackground.remove();
                body.classList.remove("fullscreen");
                fullscreenToggle.textContent = "Полноэкранный режим";
                isFullscreen = false;
            }
        });
        document.addEventListener("click", function (e) {
            if (isFullscreen && e.target === darkenBackground) {
                fullscreenToggle.click();
            }
        });
    const userData = {
        userName: data.userName,
        birthDate: data.birthDate
    };
    updateUserGreeting(userData);
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
                    Promise.all([fetchWordUser, fetchProfilePicture, backgroundImage, getadminfo])
                    .then(() => {
                 
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
                        window.location.href = '/User/Usermainmenu/html/umainmenu.html';
                    });
                    document.querySelector(".userlogo").addEventListener("click", () => {
                        socket.close();
                        window.location.href = '/User/Userpersonalaccount/html/uaccount.html';
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