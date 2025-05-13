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
    function showModalInput(title, placeholder, onConfirm) {
            const overlay = document.getElementById("modal-overlay-input");
            const input = document.getElementById("modal-input");
            const label = document.getElementById("modal-label");
            const closeBtn = document.getElementById("close-modal-input");

            label.textContent = title;
            input.placeholder = placeholder;
            input.value = "";
            const closeModal = () => {
                overlay.classList.remove("show");
                setTimeout(() => {
                    input.value = "";
                }, 200);

                document.getElementById("confirm-input").onclick = null;
                document.getElementById("cancel-input").onclick = null;
                closeBtn.onclick = null;
                overlay.onclick = null;
                input.onkeydown = null;
            };

            overlay.style.display = "flex";
            requestAnimationFrame(() => overlay.classList.add("show"));
            input.focus();
            const confirm = () => {
                const value = input.value.trim();
                if (value) {
                    closeModal();
                    onConfirm(value);
                }
            };
document.getElementById("confirm-input").onclick = confirm;
document.getElementById("cancel-input").onclick = closeModal;
closeBtn.onclick = closeModal;
input.onkeydown = (e) => {
    if (e.key === "Enter") confirm();
};
overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
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
    // Получаем данные программы
    console.log(data.programId, data.moduleId, data.sectionId);
    fetch('/get-program-name', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ programId: data.programId }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Ошибка получения названия программы');
        }
        return response.json();
    })
    .then(programData => {
        if (!programData.name) {
            window.location.href = '/Administrator/Learningprograms/html/lprograms.html';
            return; // код не продолжится, если программа не найдена
        }

        // Обновляем название программы на странице
        document.querySelectorAll('.text1span').forEach(span => {
            span.textContent = programData.name;
        });
        // Получаем модули для программы
        fetch('/get-modules', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                programId: data.programId
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при получении модулей');
            }
            return response.json();
        })
        .then(modules => {
            const overContainer = document.querySelector('.overcontainer');

            if (modules) {
                const moduleMap = {};  // Маппинг idmodule на соответствующие элементы

                // Перебор всех модулей
                modules.forEach(module => {
                    const moduleWrapper = document.createElement('div');
                    moduleWrapper.classList.add('modulecontainer');

                    const moduleBlock = document.createElement('div');
                    moduleBlock.classList.add('moduleblock');

                    const moduleTimeHTML = (module.moduletime && module.moduletime !== "0" && module.moduletime !== 0)
                        ? `<p class="moduletime">Время выделенное на модуль: <span class="moduletimespan">${module.moduletime}</span></p>`
                        : '';

                    moduleBlock.innerHTML = `
                        <div class="plusmoduledelete">
                            <div class="upperblock">
                                <div class="uppblockadd">
                                    <p class="modulename">${module.name}</p>
                                    ${moduleTimeHTML}
                                </div>
                                <div class="modulechangers">
                                    <button class="buttonchangemodulename">Изменить название </button>
                                    <button class="buttonchangetime">Изменить время</button>
                                </div>
                            </div>
                            <button class="deletemodule">Удалить модуль</button>
                        </div>
                        <div class="buttonchapter">
                            <button class="addchapter">Добавить раздел</button>
                        </div>
                        <div class="underblock">
                            <p class="showmore">
                                <img class="score-icon" src="/Projectresources/up.svg" alt="Logo">
                                Свернуть
                            </p>
                        </div>
                    `;

                    moduleWrapper.appendChild(moduleBlock);
                    overContainer.appendChild(moduleWrapper);

                    moduleMap[module.idmodule] = moduleBlock;  // Запоминаем блок для последующего добавления разделов
                });
                if (modules.length === 0){
                    // Добавляем обработчики для развертывания блоков
                    document.querySelectorAll(".moduleblock").forEach(moduleBlock => {
                    const underblock = moduleBlock.querySelector(".underblock");
                    const underblockText = moduleBlock.querySelector(".showmore");
                    const chaptersAndButton = moduleBlock.querySelectorAll(".pluschapterdelete, .buttonchapter");

                    // Скрываем блоки сразу при загрузке
                    chaptersAndButton.forEach(el => el.style.display = "none");
                    underblockText.innerHTML = `
                        <img class="score-icon" src="/Projectresources/down.svg" alt="Logo">
                        Развернуть
                    `;

                    function toggleVisibility(event) {
                        if (
                            event.target.closest('.buttonchangemodulename') ||
                            event.target.closest('.buttonchangetime')
                        ) {
                            return;  // Если клик по кнопке — ничего не делаем
                        }
                        const isHidden = chaptersAndButton[0].style.display === "none";

                        if (isHidden) {
                            chaptersAndButton.forEach(el => el.style.display = "");
                            underblockText.innerHTML = `
                                <img class="score-icon" src="/Projectresources/up.svg" alt="Logo">
                                Свернуть
                            `;
                        } else {
                            chaptersAndButton.forEach(el => el.style.display = "none");
                            underblockText.innerHTML = `
                                <img class="score-icon" src="/Projectresources/down.svg" alt="Logo">
                                Развернуть
                            `;
                        }
                    }

                    underblock.addEventListener("click", toggleVisibility);

                    const modult = moduleBlock.querySelector(".upperblock");
                    if (modult) {
                        modult.addEventListener("click", toggleVisibility);
                    }
                 });

                 // Обработчик для кнопки "Удалить раздел" и наведения
                 document.querySelectorAll('.pluschapterdelete').forEach(chapter => {
                    const deleteButton = chapter.querySelector('.deletechapter');
                    deleteButton.style.display = 'none'; 
                    chapter.addEventListener('mouseenter', () => {
                        deleteButton.style.display = 'block';  // Показываем кнопку при наведении
                    });

                    chapter.addEventListener('mouseleave', () => {
                        deleteButton.style.display = 'none';  // Скрываем кнопку, когда мышка уходит
                    });
                 });
                  // Показываем страницу только после получения данных
                    // Отображаем приветствие
                    const userData = {
                        userName: data.userName,
                        birthDate: data.birthDate
                    };
                    updateUserGreeting(userData);
                    // Получаем изображение профиля
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
                    return;
                }
             else{
                // Загружаем данные о разделах
                fetch('/get-sections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        programId: data.programId,
                        moduleNames: modules.map(module => module.name)
                    })
                })
                .then(response => response.json())
                .then(sectionData => {
                    // Для каждого модуля добавляем соответствующие разделы
                    sectionData.forEach(moduleSections => {
                        const moduleBlock = moduleMap[moduleSections.idmodule];
                        const buttonChapter = moduleBlock.querySelector('.buttonchapter');  // Находим кнопку "Добавить раздел"

                        moduleSections.sections.forEach(section => {

                            const sectionTimeHTML = (section.sectiontime && section.sectiontime !== "0" && section.sectiontime !== 0)
                                ? `<p class="chaptertime">Время на <span class="chaptertimespan">раздел</span>: <span class="ctimespan">${section.sectiontime}</span></p>`
                                : '';

                            const sectionHTML = `
                                <div class="pluschapterdelete">
                                    <div class="chapterblock">
                                        <div class="chapblockadd">
                                            <p class="chaptertext">Раздел: "<span class="chaptertextspan">${section.name}</span>"</p>
                                            ${sectionTimeHTML}
                                        </div>
                                    </div>
                                    <button class="deletechapter">Удалить раздел</button>
                                </div>
                            `;
                            // Вставляем раздел перед кнопкой "Добавить раздел"
                            buttonChapter.insertAdjacentHTML('beforebegin', sectionHTML);
                        });
                    });
                    // Добавляем обработчики для развертывания блоков
                 document.querySelectorAll(".moduleblock").forEach(moduleBlock => {
                    const underblock = moduleBlock.querySelector(".underblock");
                    const underblockText = moduleBlock.querySelector(".showmore");
                    const chaptersAndButton = moduleBlock.querySelectorAll(".pluschapterdelete, .buttonchapter");

                    // Скрываем блоки сразу при загрузке
                    chaptersAndButton.forEach(el => el.style.display = "none");
                    underblockText.innerHTML = `
                        <img class="score-icon" src="/Projectresources/down.svg" alt="Logo">
                        Развернуть
                    `;

                    function toggleVisibility(event) {
                        if (
                            event.target.closest('.buttonchangemodulename') ||
                            event.target.closest('.buttonchangetime')
                        ) {
                            return;  // Если клик по кнопке — ничего не делаем
                        }
                        const isHidden = chaptersAndButton[0].style.display === "none";

                        if (isHidden) {
                            chaptersAndButton.forEach(el => el.style.display = "");
                            underblockText.innerHTML = `
                                <img class="score-icon" src="/Projectresources/up.svg" alt="Logo">
                                Свернуть
                            `;
                        } else {
                            chaptersAndButton.forEach(el => el.style.display = "none");
                            underblockText.innerHTML = `
                                <img class="score-icon" src="/Projectresources/down.svg" alt="Logo">
                                Развернуть
                            `;
                        }
                    }

                    underblock.addEventListener("click", toggleVisibility);

                    const modult = moduleBlock.querySelector(".upperblock");
                    if (modult) {
                        modult.addEventListener("click", toggleVisibility);
                    }
                 });

                 // Обработчик для кнопки "Удалить раздел" и наведения
                 document.querySelectorAll('.pluschapterdelete').forEach(chapter => {
                    const deleteButton = chapter.querySelector('.deletechapter');
                    deleteButton.style.display = 'none'; 
                    chapter.addEventListener('mouseenter', () => {
                        deleteButton.style.display = 'block';  // Показываем кнопку при наведении
                    });

                    chapter.addEventListener('mouseleave', () => {
                        deleteButton.style.display = 'none';  // Скрываем кнопку, когда мышка уходит
                    });
                 });
                  // Показываем страницу только после получения данных
                    // Отображаем приветствие
                    const userData = {
                        userName: data.userName,
                        birthDate: data.birthDate
                    };
                    updateUserGreeting(userData);
                    // Получаем изображение профиля
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
                    // Обработчик для кнопки "Добавить раздел"
                    document.querySelectorAll(".addchapter").forEach(button => {
                        button.addEventListener("click", () => {
                            const moduleBlock = button.closest(".moduleblock");
                            const moduleName = moduleBlock.querySelector(".modulename").textContent;

                            showModalInput(`Введите название раздела для модуля "${moduleName}"`, "Например: Введение", (sectionName) => {
                                sectionName = sectionName.trim();

                                showModalInput("Введите время на раздел", "Например: 10 Минут, 3 Дня или 0", (sectionTime) => {
                                    sectionTime = sectionTime.trim();

                                    fetch('/add-section', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            programId: data.programId,
                                            moduleName: moduleName,
                                            sectionName: sectionName,
                                            sectionTime: sectionTime,
                                        }),
                                    })
                                    .then(response => response.json().then(data => ({ status: response.status, body: data })))
                                    .then(({ status, body }) => {
                                        if (status === 200) {
                                            const sectionTimeHTML = (sectionTime && sectionTime !== "0" && sectionTime !== 0)
                                                ? `<p class="chaptertime">Время на <span class="chaptertimespan">раздел</span> <span class="ctimespan">${sectionTime}</span></p>`
                                                : '';

                                            const sectionHTML = `
                                                <div class="pluschapterdelete">
                                                    <div class="chapterblock">
                                                        <div class="chapblockadd">
                                                            <p class="chaptertext">Раздел: "<span class="chaptertextspan">${sectionName}</span>"</p>
                                                            ${sectionTimeHTML}
                                                        </div>
                                                    </div>
                                                    <button class="deletechapter">Удалить раздел</button>
                                                </div>
                                            `;

                                            const buttonChapterBlock = moduleBlock.querySelector(".buttonchapter");
                                            buttonChapterBlock.insertAdjacentHTML('beforebegin', sectionHTML);

                                            const newSection = buttonChapterBlock.previousElementSibling;
                                            const deleteButton = newSection.querySelector('.deletechapter');
                                            deleteButton.style.display = 'none';

                                            newSection.addEventListener('mouseenter', () => {
                                                deleteButton.style.display = 'block';
                                            });
                                            newSection.addEventListener('mouseleave', () => {
                                                deleteButton.style.display = 'none';
                                            });

                                        } else {
                                            showModal(body.message || "Ошибка при добавлении раздела", false);
                                            console.error("Ошибка:", body.message || "Неизвестная ошибка");
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Ошибка при добавлении раздела:', error);
                                    });
                                });
                            });
                        });
                    });
                    // Делегирование событий для кнопок "Удалить раздел"
                    document.querySelector(".overcontainer").addEventListener("click", function(event) {
                        // Проверяем, что клик был по кнопке "Удалить раздел"
                        if (event.target && event.target.classList.contains("deletechapter")) {
                            const deleteButton = event.target;
                            const sectionBlock = deleteButton.closest(".pluschapterdelete"); // Находим сам раздел
                            const sectionName = sectionBlock.querySelector(".chaptertextspan").textContent;  // Извлекаем название раздела
                            const moduleBlock = deleteButton.closest(".moduleblock"); // Находим модуль, к которому относится раздел
                            const moduleName = moduleBlock.querySelector(".modulename").textContent; // Извлекаем название модуля
                            const programId = data.programId; // id программы, передаваемый с сервером

                            // Используем модалку для подтверждения
                            showConfirmationModal(`Вы уверены, что хотите удалить раздел "${sectionName}"?`, () => {
                                // Отправляем запрос на удаление раздела
                                fetch('/delete-section', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        programId: programId,
                                        moduleName: moduleName,
                                        sectionName: sectionName,
                                    })
                                })
                                .then(response => response.json()) // Преобразуем ответ в JSON
                                .then(({ message }) => { // Деструктурируем объект, полученный от сервера
                                    if (message === 'Раздел успешно удален') {
                                        // Удаляем раздел из DOM
                                        sectionBlock.remove();
                                    } else {
                                        showModal(`Ошибка: ${message}`, false); // Используем showModal для отображения ошибки
                                    }
                                })
                                .catch(error => {
                                    console.error('Ошибка при удалении раздела:', error);
                                    showModal('Ошибка при удалении раздела', false); // Показываем ошибку в модалке
                                });
                            });
                        }
                    });
                    // Делегирование событий для блока chapterblock
                        document.querySelector(".overcontainer").addEventListener("click", function(event) {
                            // Проверяем, что клик был по элементу .chapterblock
                            if (event.target && event.target.closest(".chapterblock")) {
                                const chapterBlock = event.target.closest(".chapterblock"); // Находим блок chapterblock
                                const moduleBlock = chapterBlock.closest(".moduleblock"); // Находим модуль
                                const moduleName = moduleBlock.querySelector(".modulename").textContent; // Извлекаем имя модуля
                                const sectionName = chapterBlock.querySelector(".chaptertextspan").textContent; // Извлекаем имя раздела
                                const programId = data.programId; // Получаем programId из глобальной переменной

                                // Отправляем все данные на сервер в одном запросе
                                fetch('/set-current-chapter', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        programId: programId,
                                        moduleName: moduleName,
                                        sectionName: sectionName
                                    })
                                })
                                .then(response => response.json())
                                .then(result => {
                                    if (result.success) {
                                        // После успешного ответа выполняем редирект
                                        window.location.href = '/Administrator/Adminchapter/html/achapter.html';
                                    } else {
                                        alert(result.message || 'Ошибка при установке текущего раздела.');
                                    }
                                })
                                .catch(error => {
                                    console.error('Ошибка при установке текущего раздела:', error);
                                    alert('Ошибка при установке текущего раздела.');
                                });
                            }
                        });
                })
                .catch(error => console.error('Ошибка при получении разделов:', error));
             }          
            }
        })
        .catch(error => console.error('Ошибка при получении модулей:', error));
        document.querySelector(".addmodule").addEventListener("click", () => {
        showModalInput("Введите название модуля", "Например: Первый", (moduleName) => {
            showModalInput("Введите время на модуль", "Например: 10 Минут, 3 Дня или 0", (moduleTime) => {
                fetch('/add-module', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        programId: data.programId,
                        name: moduleName,
                        moduletime: moduleTime,
                    }),
                })
                .then(response => response.json().then(data => ({ status: response.status, body: data })))
                .then(({ status, body }) => {
                    if (status === 200) {
                        setTimeout(() => {
                            location.reload();
                        }, 200);
                    } else if (status === 409) {
                        showModal(body.message || "Такой модуль уже существует", false);
                    } else {
                        showModal(body.message || "Ошибка при добавлении", false);
                    }
                })
                .catch(error => {
                    console.error("Ошибка:", error);
                });
            });
        });
    });
    document.querySelector('.overcontainer').addEventListener('click', (event) => {
            if (event.target.classList.contains('deletemodule')) {
                const moduleBlock = event.target.closest('.moduleblock');
                const moduleName = moduleBlock.querySelector('.modulename').textContent;
                
                // Показываем модалку с подтверждением
                showConfirmationModal(`Вы уверены, что хотите удалить модуль "${moduleName}"?`, () => {
                    fetch('/delete-module', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: moduleName,
                            programId: data.programId // добавляем сюда programId
                        }),
                    })
                    .then(response => response.json().then(data => ({ status: response.status, body: data })))
                    .then(({ status, body }) => {
                        if (status === 200) {
                            setTimeout(() => {
                                location.reload();
                            }, 200);
                        } else {
                            showModal(body.message || "Ошибка при удалении модуля", false); // Показываем ошибку в модалке
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при удалении модуля:', error);
                    });
                });
            }
        });
        document.querySelector('.overcontainer').addEventListener('click', (event) => {
            if (event.target.classList.contains('buttonchangemodulename')) {
                event.stopPropagation();

                const moduleBlock = event.target.closest('.moduleblock');
                const oldModuleName = moduleBlock.querySelector('.modulename').textContent;

                showModalInput(`Новое название для модуля "${oldModuleName}"`, "Например: Первый", (newModuleName) => {
                    newModuleName = newModuleName.trim();
                    // Проверка на дублирующееся название
                    const existingNames = Array.from(document.querySelectorAll('.moduleblock .modulename'))
                        .map(el => el.textContent.trim().toLowerCase());

                    if (existingNames.includes(newModuleName.toLowerCase())) {
                        showModal("Это название модуля уже занято", false);
                        return;
                    }

                    fetch('/change-module-name', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            oldName: oldModuleName,
                            newName: newModuleName,
                            programId: data.programId
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            setTimeout(() => {
                                location.reload();
                            }, 200);
                        } else {
                            showModal(data.message || "Ошибка при изменении названия модуля", false);
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при изменении названия модуля:', error);
                    });
                });
            }
        });
        document.querySelector('.overcontainer').addEventListener('click', (event) => {
            if (event.target.classList.contains('buttonchangetime')) {
                event.stopPropagation();

                const moduleBlock = event.target.closest('.moduleblock');
                const moduleName = moduleBlock.querySelector('.modulename').textContent;

                showModalInput(`Новое время для модуля "${moduleName}"`, "Например: 10 Минут, 3 Дня или 0", (newModuleTime) => {
                    newModuleTime = newModuleTime.trim();

                    fetch('/change-module-time', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: moduleName,
                            newTime: newModuleTime,
                            programId: data.programId
                        }),
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            setTimeout(() => {
                                location.reload();
                            }, 200);
                        } else {
                            showModal(data.message || "Ошибка при изменении времени модуля", false);
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при изменении времени модуля:', error);
                        showModal("Ошибка при изменении времени модуля", false);
                    });
                });
            }
        });
    })
    .catch(error => {
        console.error('Ошибка при получении названия программы:', error);
        window.location.href = '/Administrator/Learningprograms/html/lprograms.html';
    });
}
})
.catch(error => {
console.error('Ошибка проверки авторизации:', error);
window.location.href = '/Enteringpage/html/entering.html';
});
    
        document.querySelector(".buttonback").addEventListener("click", () => {
            window.location.href = '/Administrator/Administratormainmenu/html/amainmenu.html';
        });
        document.querySelector(".buttonback2").addEventListener("click", () => {
            window.location.href = '/Administrator/Learningprograms/html/lprograms.html';
        });
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
      
    });