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
        fetch('/get-allowed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: data.userName,
                userSurname: data.userSurname,
                fatherName: data.fatherName,
                programId: data.programId
            })
        })
        .then(response => {
            console.log('Ответ от сервера:', response);
            return response.json();
        })
        .then(allowedData => {
            if (!allowedData.allowed) {
                window.location.href = '/User/Userleariningprograms/html/ulprograms.html';
            } else {
        fetch('/get-section-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ moduleId: data.moduleId, sectionId: data.sectionId }),
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка получения названия секции');
                }
                return response.json();
            })
            .then(sectionData => {
                if (!sectionData.name) {
                    window.location.href = '/User/Userchapter/html/uchapter.html';
                    return; 
                }
            fetch('/check-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sectionId: data.sectionId }) 
            })
            .then(response => response.json())
            .then(testData => {
                if (!testData.idtest) { 
                    window.location.href = '/User/Userchapter/html/uchapter.html';
                    return; 
                }
                const today = new Date();
                console.log(today);  
                document.querySelectorAll('.text1span').forEach(span => {
                    span.textContent = sectionData.name;
                });

                fetch('/get-time-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sectionId: data.sectionId, 
                    })
                })
                .then(response => response.json())
                .then(responseData => {
                    if (responseData.success) {
                        let timeToDisplay = responseData.time;

                     
                        if (timeToDisplay === '00:00' || timeToDisplay === null) {
                            document.querySelector('.ttest').textContent = "Неограничено";
                        } else {
                  
                            let [hours, minutes] = timeToDisplay.split(':');

                         
                            hours = parseInt(hours, 10); 
                            minutes = parseInt(minutes, 10); 

                
                            function getCorrectHourForm(hour) {
                                if (hour === 1) {
                                    return `${hour} час`; 
                                } else if ([2, 3, 4].includes(hour)) {
                                    return `${hour} часа`; 
                                } else {
                                    return `${hour} часов`; 
                                }
                            }

            
                            function getCorrectMinuteForm(minute) {
                                if (minute === 1) {
                                    return `${minute} минута`; 
                                } else if ([2, 3, 4].includes(minute)) {
                                    return `${minute} минуты`; 
                                } else {
                                    return `${minute} минут`; 
                                }
                            }

                         
                            if (hours === 0 && minutes === 0) {
                                document.querySelector('.ttest').textContent = "Неограничено";
                            } else if (hours === 0) {
                                document.querySelector('.ttest').textContent = getCorrectMinuteForm(minutes);
                            } else if (minutes === 0) {
                                document.querySelector('.ttest').textContent = getCorrectHourForm(hours);
                            } else {
                                document.querySelector('.ttest').textContent = `${getCorrectHourForm(hours)} ${getCorrectMinuteForm(minutes)}`;
                            }
                        }
                    } else {
                        console.error("Ошибка при получении времени");
                    }
                })
                .catch(error => {
                    console.error("Ошибка при запросе времени:", error);
                });
                fetch("/get-question-count", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        idtest: testData.idtest
                    })
                })
                .then(response => response.json())
                .then(result => {
                    const spanElement = document.querySelector(".nquest");
                    if (spanElement) {
                        spanElement.textContent = result.count !== null ? result.count : "0";
                    } else {
                        console.error("Элемент .nquest не найден в DOM.");
                    }
                })
                .catch(error => {
                    console.error("Ошибка при получении количества вопросов:", error);
                });
                fetch("/get-max-score", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        idtest: testData.idtest
                    })
                })
                .then(response => response.json())
                .then(result => {
                    const spanElement = document.querySelector(".mxscore");
                    if (spanElement) {
                        spanElement.textContent = result.totalScore !== null ? result.totalScore : "0";
                    } else {
                        console.error("Элемент .mxscore не найден в DOM.");
                    }
                })
                .catch(error => {
                    console.error("Ошибка при получении максимального балла:", error);
                });
            
fetch('/get-user-test-result', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
userName: data.userName,
userSurname: data.userSurname,
fatherName: data.fatherName,
testId: testData.idtest
})
})
.then(response => response.json())
.then(result => {
if (result.success) {
const topSection = document.querySelector('.top-section');
const score = result.score;

console.log(score);
if (score === null || score === undefined) return;

const logo = score >= 6 ? '/Projectresources/logo+.svg' : '/Projectresources/logo-.svg';

let bottomSection = document.querySelector('.bottom-section');
if (!bottomSection) {
    bottomSection = document.createElement('div');
    bottomSection.classList.add('bottom-section');
    topSection.insertAdjacentElement('afterend', bottomSection);
}

bottomSection.innerHTML = `
    <p class="reachedscore">Вы прошли на оценку: 
        <span class="rscore">${score}</span> из 10
        <object class="score-icon" type="image/svg+xml" data="${logo}"></object>
        ${score >= 6 ? "(Пройден)" : "(Не пройден)"}
    </p>
`;

window.dateReset = result.DateReset;

const now = new Date();
const currentTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
console.log("Дата сброса:", new Date(window.dateReset));
console.log("Текущее время:", currentTime);

if (new Date(window.dateReset) > currentTime) {
    const updateTimer = () => {
        const now = new Date();
        const currentTime2 = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        const remainingTime = new Date(window.dateReset) - currentTime2;

        if (remainingTime <= 1000) {
            clearInterval(timerInterval);
            const timerElement = document.querySelector('.timereset');
            if (timerElement) timerElement.remove();
            toggleButtonState(false);
        } else {
            const hours = Math.floor(remainingTime / 3600000);
            const minutes = Math.floor((remainingTime % 3600000) / 60000);
            const seconds = Math.floor((remainingTime % 60000) / 1000);

            let resetTimeStr = [];
            if (hours > 0) resetTimeStr.push(`${hours} ${getDeclension(hours, "час", "часа", "часов")}`);
            if (minutes > 0) resetTimeStr.push(`${minutes} ${getDeclension(minutes, "минуту", "минуты", "минут")}`);
            if (seconds > 0) resetTimeStr.push(`${seconds} ${getDeclension(seconds, "секунду", "секунды", "секунд")}`);

            document.querySelector('.treset').textContent = resetTimeStr.join(' и ');
        }
    };

    function getDeclension(n, one, few, many) {
        if (n % 10 === 1 && n % 100 !== 11) return one;
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return few;
        return many;
    }

    toggleButtonState(true);

    bottomSection.insertAdjacentHTML('beforeend', `
        <p class="timereset">*Следующая попытка будет доступна через <span class="treset"></span></p>
    `);

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
} else {
    toggleButtonState(false);
}
} else {
console.error("Ошибка при получении данных:", result.message);
}
})
.catch(error => console.error("Ошибка при запросе:", error));
document.querySelector('.testbegin')?.addEventListener('click', () => startTest());
let socket;
function startTest() {
    const now = new Date();
    const currentTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    
  
    if (window.dateReset && new Date(window.dateReset) > currentTime) {
        return;
    }
    socket.close();
    window.location.href = '/User/Usertest/html/utest.html';
}
function toggleButtonState(isDisabled) {
    const testButton = document.querySelector('.testbegin');
    if (isDisabled) {
        testButton.disabled = true;
        testButton.style.opacity = '0.6';
        testButton.style.cursor = 'not-allowed';
        testButton.removeEventListener('click', startTest);
    } else {
        testButton.disabled = false;
        testButton.style.opacity = '1';
        testButton.style.cursor = 'pointer';
        
    }
}

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
                                    document.querySelector(".buttonback").addEventListener("click", () => {
                                        socket.close();
                                        window.location.href = '/User/Usermainmenu/html/umainmenu.html';
                                    });
                                    document.querySelector(".buttonback2").addEventListener("click", () => {
                                        socket.close();
                                        window.location.href = '/User/Userchapter/html/uchapter.html';
                                    });
                                    document.querySelector(".userlogo").addEventListener("click", () => {
                                        socket.close();
                                        window.location.href = '/User/Userpersonalaccount/html/uaccount.html';
                                    });
                    })
                    .catch(error => console.error('Ошибка при проверке теста:', error));                                     
            })
            .catch(error => {
                console.error('Ошибка при получении названия секции:', error);
                window.location.href = '/User/Usermodule/html/umodule.html';
            });
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        window.location.href = '/User/Userleariningprograms/html/ulprograms.html';
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