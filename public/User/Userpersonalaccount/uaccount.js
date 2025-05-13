['userName', 'userSurname', 'fatherName'].forEach(key => {
    if (sessionStorage.getItem(key) !== null) {
        sessionStorage.removeItem(key);
        console.log(`Удалён ${key}`);
    }
});
function formatDateToInput(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
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
function showModal(message, isSuccess) {
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
    }, 200);
};

document.getElementById('confirm-yes').onclick = close;
document.getElementById('close-modal').onclick = close;
overlay.onclick = (e) => {
    if (e.target === overlay) close();
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
    document.querySelectorAll(".surname, .name, .fathername, .special").forEach(input => {
input.disabled = true;
});
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
        }).then(response => response.json()).then(data => {
            if (data.picture) {
                const imgElement = document.querySelector('.profile-image');
                const photoIn = document.querySelector(".photo-icon");
                const photoTt = document.querySelector(".photo-t");
                photoIcon.style.display = "none";
                photoText.style.display = "none";
                imgElement.src = data.picture;
                imgElement.style.display = 'block';
                document.querySelector('.deleteimg').style.display = 'block';
            } else {
                console.log('Изображение не найдено.');
            }

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
    fetch('/get-average-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userName: data.userName,
            userSurname: data.userSurname,
            fatherName: data.fatherName
        })
    })
    .then(response => response.json())
    .then(data => {
        const pointsElement = document.querySelector('.points');

        if (data && typeof data.averageScore === 'number') {
            pointsElement.textContent = data.averageScore.toFixed(1);
        } else {
            pointsElement.textContent = "нет оценок";
        }
    })
    .catch(error => console.error('Ошибка при получении средней оценки:', error));

    const userData = {
        userName: data.userName,
        birthDate: data.birthDate
    };
    updateUserGreeting(userData);
    
    document.querySelector('.surname').value = data.userSurname;
    document.querySelector('.name').value = data.userName;
    document.querySelector('.fathername').value = data.fatherName;
    document.querySelector('.special').value = data.roleMain;
 
    const sexSelect = document.querySelector('.sex');
    if (data.sex === 'мужской') {
        sexSelect.value = 'мужской';
    } else if (data.sex === 'женский') {
        sexSelect.value = 'женский';
    } else {
        sexSelect.value = 'none';
    }

    document.querySelector('.birth').value = data.birthDate ? formatDateToInput(data.birthDate) : '';

document.querySelector(".logout").addEventListener("click", () => {
    fetch('/logout', { method: 'POST' })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            socket.close();
            document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = '/Enteringpage/html/entering.html';
        }
    })
    .catch(error => console.error('Ошибка выхода:', error));
    });
    
    document.querySelector(".buttonback").addEventListener("click", () => {
    socket.close();
    window.location.href = '/User/Usermainmenu/html/umainmenu.html';
    });
    
}
})
.catch(error => {
console.error('Ошибка проверки авторизации:', error);
window.location.href = '/Enteringpage/html/entering.html';
});

let cropper; 
let cropperMini; 
let croppedImageBlob = null; 
let croppedMiniBlob = null; 
const fileInput = document.querySelector(".file-input");
const profileImage = document.querySelector(".profile-image");
const profileSection = document.querySelector(".profile-section");
const saveMainImageButton = document.querySelector(".save-main-image"); 
const saveMiniatureButton = document.querySelector(".save-miniature-image"); 
const photoIcon = document.querySelector(".photo-icon");
const photoText = document.querySelector(".photo-t");
const userLogo = document.querySelector(".userlogo");
let canUploadNewFile = true;


function handleProfileClick(e) {
if (e.target !== profileImage && canUploadNewFile) {
fileInput.click();
}
}

profileSection.addEventListener("click", handleProfileClick);

fileInput.addEventListener("change", (event) => {
const file = event.target.files[0];

if (file && canUploadNewFile) {
if (file.size > 5 * 1024 * 1024) {
showModal('Файл слишком большой! Максимальный размер: 5MB.', false);
return;
}

const reader = new FileReader();
reader.onload = function (e) {
const imageUrl = e.target.result;

profileImage.src = imageUrl;
profileImage.style.display = "block";
photoIcon.style.display = "none";
photoText.style.display = "none";

if (cropper) {
    cropper.destroy(); 
}

canUploadNewFile = false;


cropper = new Cropper(profileImage, {
    aspectRatio: 300 / 320,
    viewMode: 1,
    autoCropArea: 0.8,
    responsive: true,
    checkOrientation: false,
    crop(event) {
        console.log(event.detail.width, event.detail.height);
    },
    ready() {
        profileSection.removeEventListener("click", handleProfileClick);
        saveMainImageButton.style.display = "inline-block"; 
    },
    cropend() {
        profileSection.addEventListener("click", handleProfileClick);
    }
});
};
reader.readAsDataURL(file);
}

fileInput.value = "";
});


saveMainImageButton.addEventListener("click", () => {
if (cropper) {
const canvas = cropper.getCroppedCanvas({
width: 300,
height: 320,
imageSmoothingEnabled: true,
imageSmoothingQuality: 'high'
});

canvas.toBlob(function (blob) {
croppedImageBlob = blob;


cropper.destroy();


profileImage.src = URL.createObjectURL(blob);
profileImage.style.display = "block";
saveMainImageButton.style.display = "none"; 
saveMiniatureButton.style.display = "inline-block";


if (cropperMini) {
    cropperMini.destroy();
}

cropperMini = new Cropper(profileImage, {
    aspectRatio: 1,
    viewMode: 1,
    autoCropArea: 0.5,
    responsive: true,
    checkOrientation: false,
    crop(event) {
        console.log(event.detail.width, event.detail.height);
    },
    ready() {
        saveMiniatureButton.style.display = "inline-block"; 
    },
    cropend() {
        saveMiniatureButton.textContent = "Загрузить оба изображения";
    }
});
}, 'image/jpeg');
}
});


saveMiniatureButton.addEventListener("click", () => {
if (cropperMini) {
const canvasMini = cropperMini.getCroppedCanvas({
width: 100,
height: 100,
imageSmoothingEnabled: true,
imageSmoothingQuality: 'high'
});

canvasMini.toBlob(function (blob) {
croppedMiniBlob = blob;

const formData = new FormData();
formData.append("picture", croppedImageBlob); 
formData.append("minipicture", croppedMiniBlob); 

fetch('/upload-profile-image', {
    method: 'POST',
    body: formData,
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        showModal('Изображения успешно загружены!', true);
        const pictureURL = URL.createObjectURL(croppedImageBlob);
        const miniPictureURL = URL.createObjectURL(croppedMiniBlob);
        document.querySelector('.deleteimg').style.display = 'block';
        userLogo.innerHTML = `<img src="${miniPictureURL}" alt="User Logo" style="width: 10vh; height: 10vh; object-fit: cover; border-radius: 50%;">`;

        profileImage.src = pictureURL;
        profileImage.style.objectFit = "cover";

        if (cropperMini) {
            cropperMini.destroy();  
        }

        saveMiniatureButton.style.display = "none";
        canUploadNewFile = true;
    } else {
        showModal('Ошибка при загрузке изображений!', false);
    }
})
.catch(error => {
    console.error('Ошибка при загрузке изображений:', error);
});
}, 'image/jpeg');
}
});

profileImage.addEventListener("click", () => {
if (canUploadNewFile) {
fileInput.click();
}
});
document.querySelector(".deleteimg").addEventListener("click", () => {
fetch('/delete-profile-image', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify({
action: 'delete'
})
})
.then(response => response.json())
.then(data => {
if (data.success) {
showModal('Изображение успешно удалено', true);
document.querySelector(".deleteimg").style.display = 'none';
document.querySelector('.profile-image').src = '';
document.querySelector('.profile-image').style.display = 'none';
document.querySelector(".photo-icon").style.display = 'block';
document.querySelector(".photo-t").style.display = 'block';
document.querySelector(".userlogo").innerHTML = `
    <img class="admin-icon" src="/Projectresources/iconsmall.png" alt="Admin Icon">
`;
} else {
console.error('Ошибка при удалении изображения');
}
})
.catch(error => {
console.error('Ошибка:', error);
});
});
document.querySelector(".save").addEventListener("click", () => {
const sex = document.querySelector('.sex').value;
const birthDate = document.querySelector('.birth').value;

const birthDateValue = birthDate === '' || birthDate === null ? null : birthDate;


const sexValue = sex === 'none' ? null : sex;

fetch('/update-userprofile', {
method: 'POST',
headers: {
    'Content-Type': 'application/json'
},
body: JSON.stringify({
    sex: sexValue,
    birthDate: birthDateValue
})
})
.then(response => response.json())
.then(data => {
if (data.success) {
    showModal('Информация успешно обновлена!', true);
} else {
    showModal('Ошибка при обновлении информации!', false);
}
})
.catch(error => {
console.error('Ошибка обновления данных:', error);
});
});
document.querySelector(".reset").addEventListener("click", () => {
document.querySelector('.sex').value = 'none';
document.querySelector('.birth').value = '';
showModal('Информация сброшена до значений по умолчанию!', true);
});

document.querySelector(".save-password-btn").addEventListener("click", () => {
const currentPassword = document.querySelector("#current-password").value.trim();
const newPassword = document.querySelector("#new-password").value.trim();
const errorMessage = document.querySelector(".error-message");




if (!newPassword) {
errorMessage.textContent = "Введите новый пароль!";
errorMessage.style.display = "block";
return;
}
if (!currentPassword) {
errorMessage.textContent = "Введите старый пароль!";
errorMessage.style.display = "block";
return;
}


fetch('/change-password', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify({ currentPassword, newPassword })
})
.then(response => response.json())
.then(data => {
if (data.success) {
errorMessage.textContent = "Пароль успешно изменён!";
} else {
errorMessage.textContent = "Неверный текущий пароль!";
}
errorMessage.style.display = "block"; 
})
.catch(error => {
console.error('Ошибка смены пароля:', error);
errorMessage.textContent = "Ошибка сервера! Попробуйте позже.";
});
});
document.querySelector(".reset-original-password").addEventListener("click", () => {
const errorMessage = document.querySelector(".error-message");
fetch('/reset-original-password', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
})
.then(response => response.json())
.then(data => {
if (data.success) {
errorMessage.textContent = "Пароль сброшен на исходный!";
} else {
errorMessage.textContent = "Ошибка сброса пароля!";
}
errorMessage.style.display = "block"; 
})
.catch(error => {
console.error('Ошибка смены пароля:', error);
errorMessage.textContent = "Ошибка сервера! Попробуйте позже.";
});
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