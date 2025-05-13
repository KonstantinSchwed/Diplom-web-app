function updateUserGreeting(data) {
    const userTextElement = document.querySelector('.userlogotext');
    if (!userTextElement || !data) return;
    const now = new Date();
    const hours = now.getHours();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1; // Месяцы в JS начинаются с 0
    let greeting;
    if (data.birthDate) {
        const birthDate = new Date(data.birthDate); // Преобразуем дату рождения в объект Date
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
document.removeEventListener('keydown', handleKeydown);
};

const handleKeydown = (e) => {
if (e.key === 'Enter') close();
};

document.getElementById('confirm-yes').onclick = close;
document.getElementById('close-modal').onclick = close;
overlay.onclick = (e) => {
if (e.target === overlay) close();
};
document.addEventListener('keydown', handleKeydown);
}

function showAddModal(onConfirm) {
const overlay = document.getElementById("modal-overlay-add");
const input = document.getElementById("input-program-add");

const closeModal = () => {
overlay.classList.remove("show");
setTimeout(() => {
overlay.style.display = "none";
input.value = "";
}, 200);
document.removeEventListener("keydown", handleKeydown);
};

const confirm = () => {
closeModal();
onConfirm(input.value);
};

const handleKeydown = (e) => {
if (e.key === "Enter") confirm();
};

input.value = "";
overlay.style.display = "flex";
requestAnimationFrame(() => overlay.classList.add("show"));
input.focus();

document.getElementById("confirm-add").onclick = confirm;
document.getElementById("cancel-add").onclick = closeModal;
document.getElementById("close-modal-add").onclick = closeModal;
overlay.onclick = (e) => {
if (e.target === overlay) closeModal();
};
document.addEventListener("keydown", handleKeydown);
}

function showDeleteModal(onConfirm) {
const overlay = document.getElementById("modal-overlay-delete");
const input = document.getElementById("input-program-delete");

const closeModal = () => {
overlay.classList.remove("show");
setTimeout(() => {
overlay.style.display = "none";
input.value = "";
}, 200);
document.removeEventListener("keydown", handleKeydown);
};

const confirm = () => {
closeModal();
onConfirm(input.value);
};

const handleKeydown = (e) => {
if (e.key === "Enter") confirm();
};

input.value = "";
overlay.style.display = "flex";
requestAnimationFrame(() => overlay.classList.add("show"));
input.focus();

document.getElementById("confirm-delete").onclick = confirm;
document.getElementById("cancel-delete").onclick = closeModal;
document.getElementById("close-modal-delete").onclick = closeModal;
overlay.onclick = (e) => {
if (e.target === overlay) closeModal();
};
document.addEventListener("keydown", handleKeydown);
}

function showUpdateModal(onConfirm) {
const overlay = document.getElementById("modal-overlay-update");
const inputOldName = document.getElementById("input-program-old-name");
const inputNewName = document.getElementById("input-program-new-name");

const closeModal = () => {
overlay.classList.remove("show");
setTimeout(() => {
overlay.style.display = "none";
inputOldName.value = "";
inputNewName.value = "";
}, 200);
document.removeEventListener("keydown", handleKeydown);
};

const confirm = () => {
closeModal();
onConfirm(inputOldName.value, inputNewName.value);
};

const handleKeydown = (e) => {
if (e.key === "Enter") confirm();
};

inputOldName.value = "";
inputNewName.value = "";
overlay.style.display = "flex";
requestAnimationFrame(() => overlay.classList.add("show"));
inputOldName.focus();

document.getElementById("confirm-update").onclick = confirm;
document.getElementById("cancel-update").onclick = closeModal;
document.getElementById("close-modal-update").onclick = closeModal;
overlay.onclick = (e) => {
if (e.target === overlay) closeModal();
};
document.addEventListener("keydown", handleKeydown);
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
            if (data.role !== 'admin') {
                window.location.href = '/Enteringpage/html/entering.html';
            } else {
                console.log(data.programId, data.moduleId, data.sectionId);
                 // Получаем изображения пользователя с сервера
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
                    birthDate: data.birthDate,
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
            // Получаем программы для администратора
            const adminProg = fetch('/get-admin-programs', {
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
            .then(programData => {
                console.log(programData); // Выводим данные, полученные от сервера

                const buttonsContainer = document.querySelector('.buttons-container');
                buttonsContainer.innerHTML = ''; // очищаем контейнер

                if (programData.programs.length > 0) {
                    programData.programs.forEach(program => {
                        const button = document.createElement('button');
                        button.id = "programbuttons";
                        button.className = program; // можно использовать уникальные идентификаторы для классов
                        button.textContent = program;

                        // Добавляем обработчик нажатия
                        button.addEventListener("click", () => {
                            fetch('/set-current-program', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    programName: program // передаем название программы
                                })
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    console.log(result.programId);
                                    window.location.href = '/Administrator/Adminmodule/html/amodule.html';
                                } else {
                                    console.error(result.message || 'Ошибка выбора программы.');
                                }
                            })
                            .catch(error => {
                                console.error('Ошибка при выборе программы:', error);
                            });
                        });

                        buttonsContainer.appendChild(button); // добавляем кнопку в контейнер
                    });
                } else {
                    buttonsContainer.innerHTML = '<p>Нет доступных программ.</p>';
                }
            })
            .catch(error => {
                console.error('Ошибка при получении программ:', error);
            });
            document.querySelector(".newprogadd").addEventListener("click", () => {
                showAddModal((programName) => {
                    const trimmedName = programName.trim();
            
                    if (!trimmedName) return;
            
                    if (trimmedName.length > 40) {
                        showModal("Название программы не должно превышать 40 символов.", false);
                        return;
                    }
            
                    if (/^\d+$/.test(trimmedName)) {
                        showModal("Название программы не может состоять только из цифр.", false);
                        return;
                    }
            
                    fetch('/add-program', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            programName: trimmedName,
                            userName: data.userName,
                            userSurname: data.userSurname,
                            fatherName: data.fatherName
                        })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            showModal("Программа успешно добавлена!", true, () => {
                                location.reload();
                            });
                        } else {
                            showModal(result.message || "Ошибка добавления программы.", false);
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при добавлении программы:', error);
                        showModal("Ошибка при подключении к серверу.", false);
                    });
                });
            });
            document.querySelector(".deletealtprog").addEventListener("click", () => {
                showDeleteModal((programName) => {
                    if (!programName.trim()) return;

                    fetch('/delete-program', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ programName })
                    })
                    .then(response => response.json())
                    .then(result => {
                    if (result.success) {
                        showModal('Программа успешно удалена!', true, () => {
                        location.reload();
                        });
                    } else {
                        showModal('Ошибка удаления программы: ' + result.message, false);
                    }
                    })
                    .catch(error => {
                    console.error('Ошибка при удалении программы:', error);
                    showModal("Ошибка при подключении к серверу.", false);
                    });
                });
                });

                document.querySelector(".updateprogname").addEventListener("click", () => {
                    showUpdateModal((oldProgramName, newProgramName) => {
                        const trimmedOldName = oldProgramName.trim();
                        const trimmedNewName = newProgramName.trim();
                
                        if (!trimmedOldName || !trimmedNewName) return;
                
                        if (trimmedNewName.length > 40) {
                            showModal("Новое название программы не должно превышать 40 символов.", false);
                            return;
                        }
                
                        if (/^\d+$/.test(trimmedNewName)) {
                            showModal("Новое название программы не может состоять только из цифр.", false);
                            return;
                        }
                
                        fetch('/update-program-name', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                oldProgramName: trimmedOldName,
                                newProgramName: trimmedNewName
                            })
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                showModal('Название программы успешно обновлено!', true, () => {
                                    location.reload();
                                });
                            } else {
                                showModal('Ошибка изменения названия программы: ' + result.message, false);
                            }
                        })
                        .catch(error => {
                            console.error('Ошибка при изменении названия программы:', error);
                            showModal("Ошибка при подключении к серверу.", false);
                        });
                    });
                });
                 const userData = {
                    userName: data.userName,
                    birthDate: data.birthDate
                };
                updateUserGreeting(userData);
                const backgroundImage = preloadBackgroundImage("/Projectresources/Skypicture.jpg");
                Promise.all([fetchProfilePicture, backgroundImage, adminProg])
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
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
            window.location.href = '/Enteringpage/html/entering.html';
        });
    // Обработчик для перехода в личный кабинет (по аватарке)
    document.querySelector(".userlogo").addEventListener("click", () => {
    window.location.href = '/Administrator/Personalaccount/html/paccount.html';
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
    // Обработчик для перехода в главное меню
    document.querySelector(".buttonback").addEventListener("click", () => {
    window.location.href = '/Administrator/Administratormainmenu/html/amainmenu.html';
});
});