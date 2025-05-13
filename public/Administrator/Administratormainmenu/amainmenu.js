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
    // Приветствие по времени суток
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
                    // Задержка перед отображением прелоудера (например, 2-3 секунды)
        setTimeout(() => {
            preloader.classList.add('show'); // Показываем прелоудер

        }, 2000); // Прелоудер появится через 2 секунды
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.role !== 'admin') {
                window.location.href = '/Enteringpage/html/entering.html';
            } else {
             // Инициализация канала для синхронизации между вкладками
                const syncChannel = new BroadcastChannel('chat-sync');

                // Инициализация WebSocket
                updateUnreadBadge();

                let tabId = sessionStorage.getItem('chatTabId');
                if (!tabId) {
                    tabId = `${Date.now()}-${Math.random()}`;
                    sessionStorage.setItem('chatTabId', tabId);
                }
                
                const socket = new WebSocket('ws://192.168.100.2:3000');
                
                socket.addEventListener('open', () => {
                    socket.send(JSON.stringify({ type: 'init', userId: 1, tabId }));
                });


                // Слушаем сообщения
                socket.addEventListener('message', (event) => {
                    const data = JSON.parse(event.data);

                    if (data.type === 'new-message') {
                        updateUnreadBadge(); // Проверка непрочитанных
                        // Синхронизируем все вкладки
                        syncChannel.postMessage({
                            type: 'new-message',
                            message: data.message 
                        });
                    }
                });

                // Слушаем события синхронизации между вкладками
                syncChannel.onmessage = (e) => {
                    if (e.data.type === 'new-message') {
                        updateUnreadBadge(); // Обновление бейджа на других вкладках
                    }
                };

                // Функция для обновления бейджа с количеством непрочитанных сообщений
                function updateUnreadBadge() {
                    fetch('/get-unread-messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ receiverId: 1 })
                    })
                    .then(res => res.json())
                    .then(unread => {
                        const messages = unread.messages;
                        console.log('Ответ от сервера:', messages);

                        if (!Array.isArray(messages)) return;

                        const unreadFromUsers = new Set();
                        messages.forEach(msg => {
                            unreadFromUsers.add(msg);
                        });

                        const count = unreadFromUsers.size;
                        const button = document.querySelector('.button5');
                        if (!button) return;

                        // Удалить старый бейдж
                        const existingBadge = button.querySelector('.unread-badge');
                        if (existingBadge) existingBadge.remove();

                        if (count > 0) {
                            const badge = document.createElement('div');
                            badge.className = 'unread-badge';
                            badge.textContent = count;

                            // Обеспечим относительное позиционирование кнопки
                            button.style.position = 'relative';
                            button.appendChild(badge);
                        }
                    })
                    .catch(err => {
                        console.error('Ошибка при проверке непрочитанных сообщений:', err);
                    });
                }

                 // Получаем изображения пользователя с сервера
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
            .then(data => {
                if (data.miniPicture) {
                    console.log(data.miniPicture);
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
               // Теперь код выполнится, когда страница загрузится
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
    window.location.href = '/Administrator/Personalaccount/html/paccount.html';
     });
    document.querySelector(".button3").addEventListener("click", () => {
        socket.close();
    window.location.href = '/Administrator/Learningprograms/html/lprograms.html';
     });
    document.querySelector(".button1").addEventListener("click", () => {
    socket.close();
    window.location.href = '/Administrator/Admininstruct/html/ainst.html';
     });
     document.querySelector(".button4").addEventListener("click", () => {
        socket.close();
    window.location.href = '/Administrator/Adminuserinstruct/html/auinstruct.html';
     });
     document.querySelector(".button5").addEventListener("click", () => {
        socket.close();
        window.location.href = '/Administrator/Adminmessanger/html/amessanger.html';
         });
    document.querySelector(".userlogo").addEventListener("click", () => {
        socket.close();
    window.location.href = '/Administrator/Personalaccount/html/paccount.html';
    });
    document.querySelector(".button2").addEventListener("click", () => {
        socket.close();
    window.location.href =
        "/Administrator/Listofusers/html/lusers.html";
    });
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
            window.location.href = '/Enteringpage/html/entering.html';
        });
    document.querySelector('.clickable-footer').addEventListener('click', function() {
        var filename = "Пользовательское соглашение.txt"; // Укажите нужное имя файла
        var downloadLink = document.createElement('a');
        downloadLink.href = "/Projectresources/" + filename;  // Путь к файлу
        downloadLink.download = filename;  // Имя файла для скачивания
        document.body.appendChild(downloadLink);
        downloadLink.click();  // Инициируем скачивание
        document.body.removeChild(downloadLink);  // Убираем ссылку из DOM
    });
});