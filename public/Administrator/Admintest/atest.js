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

window.addEventListener('pageshow', function (event) {
         if (event.persisted) {
             location.reload();
         }
     });
     function preloadBackgroundImage(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = url;
                img.onload = resolve;
                img.onerror = reject;
            });
        }
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
        // Получаем данные программы
        console.log(data.programId, data.moduleId, data.sectionId);
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
            window.location.href = '/Administrator/Adminmodule/html/amodule.html';
            return; // код не продолжится, если секция не найдена
        }
        fetch('/check-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sectionId: data.sectionId }) // Отправляем sectionId
        })
        .then(response => response.json())
        .then(testData => {
            if (!testData.idtest) { // Проверяем idtest, а не exists
                window.location.href = '/Administrator/Adminchapter/html/achapter.html';
                return; 
            }

            document.querySelectorAll('.text1span').forEach(span => {
                span.textContent = sectionData.name;
            });

            console.log('ID теста:', testData.idtest);
                    fetch('/get-time-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sectionId: data.sectionId, // Передаем sectionId
                    })
                })
                .then(response => response.json())
                .then(responseData => {
                    if (responseData.success) {
                        let timeToDisplay = responseData.time;

                        // Если время равно "00:00" или NULL, отображаем "Неограничено"
                        if (timeToDisplay === '00:00' || timeToDisplay === null) {
                            document.querySelector('.ttest').textContent = "Неограничено";
                        } else {
                            // Если время существует, обрабатываем его
                            let [hours, minutes] = timeToDisplay.split(':');

                            // Убираем ведущие нули с часов и минут
                            hours = parseInt(hours, 10); // Убираем ведущий ноль у часов
                            minutes = parseInt(minutes, 10); // Убираем ведущий ноль у минут

                            // Функция для правильного склонения слова "час"
                            function getCorrectHourForm(hour) {
                                if (hour === 1) {
                                    return `${hour} час`; // 1 час
                                } else if ([2, 3, 4].includes(hour)) {
                                    return `${hour} часа`; // 2-4 часа
                                } else {
                                    return `${hour} часов`; // 5 и более часов
                                }
                            }

                            // Функция для правильного склонения слова "минута"
                            function getCorrectMinuteForm(minute) {
                                if (minute === 1) {
                                    return `${minute} минута`; // 1 минута
                                } else if ([2, 3, 4].includes(minute)) {
                                    return `${minute} минуты`; // 2-4 минуты
                                } else {
                                    return `${minute} минут`; // 5 и более минут
                                }
                            }

                            // Логика для отображения времени
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

                fetch('/get-reloadtime-test', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sectionId: data.sectionId, // Передаем sectionId
                    })
                })
                .then(response => response.json())
                .then(responseData => {
                    if (responseData.success) {
                        let timeToDisplay = responseData.time;

                        // Если время равно "00:00" или NULL, отображаем "Неограничено"
                        if (timeToDisplay === '00:00' || timeToDisplay === null) {
                            document.querySelector('.timetotest').textContent = "Неограничено";
                        } else {
                            // Если время существует, обрабатываем его
                            let [hours, minutes] = timeToDisplay.split(':');

                            // Убираем ведущие нули с часов и минут
                            hours = parseInt(hours, 10); // Убираем ведущий ноль у часов
                            minutes = parseInt(minutes, 10); // Убираем ведущий ноль у минут

                            // Функция для правильного склонения слова "час"
                            function getCorrectHourForm(hour) {
                                if (hour === 1) {
                                    return `${hour} час`; // 1 час
                                } else if ([2, 3, 4].includes(hour)) {
                                    return `${hour} часа`; // 2-4 часа
                                } else {
                                    return `${hour} часов`; // 5 и более часов
                                }
                            }

                            // Функция для правильного склонения слова "минута"
                            function getCorrectMinuteForm(minute) {
                                if (minute === 1) {
                                    return `${minute} минута`; // 1 минута
                                } else if ([2, 3, 4].includes(minute)) {
                                    return `${minute} минуты`; // 2-4 минуты
                                } else {
                                    return `${minute} минут`; // 5 и более минут
                                }
                            }

                            // Логика для отображения времени
                            if (hours === 0 && minutes === 0) {
                                document.querySelector('.timetotest').textContent = "Неограничено";
                            } else if (hours === 0) {
                                document.querySelector('.timetotest').textContent = getCorrectMinuteForm(minutes);
                            } else if (minutes === 0) {
                                document.querySelector('.timetotest').textContent = getCorrectHourForm(hours);
                            } else {
                                document.querySelector('.timetotest').textContent = `${getCorrectHourForm(hours)} ${getCorrectMinuteForm(minutes)}`;
                            }
                        }
                    } else {
                        console.error("Ошибка при получении времени");
                    }
                })
                .catch(error => {
                    console.error("Ошибка при запросе времени:", error);
                });

            const getquestions = fetch("/get-questions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ testId: testData.idtest }) // Отправляем testId
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const overTestContainer = document.querySelector(".overtestcontainer");
                    overTestContainer.innerHTML = ""; // Очищаем контейнер перед загрузкой
                    data.questions.forEach((question, qIndex) => {
                        const questionNumber = qIndex + 1;
                        const questionText = question.text;
                        const questionVar = question.varQuest;
                        const points = question.points;
                        const answerType = question.isMultiple ? "checkbox" : "radio"; // Определяем тип input

                        // Создаём контейнер для вопроса
                        const questionHTML = `
                            <div class="testcontainer">
                                <div class="testblock">
                                    <div class="plustestdelete">
                                        <div class="upptestblock">
                                            <div class="righttestadd">
                                                <p class="questnumb">${questionVar}</p>
                                                <p class="questname">${questionText}</p>
                                                <button class="questchange">Изменить</button>
                                            </div>
                                            <div class="lefttestadd">
                                                <p class="questpoints">Баллы за вопрос: <span class="questpointsspan">${points}</span></p>
                                                <button class="pointschange">Изменить</button>
                                            </div>
                                        </div>
                                        <button class="deletequest">Удалить вопрос</button>
                                    </div>
                                    <div class="undertestblock">
                                        <button class="addanswer">Добавить вариант ответа</button>

                                    </div>
                                </div>
                            </div>
                        `;

                        overTestContainer.insertAdjacentHTML("beforeend", questionHTML);
                        const currentTestContainer = overTestContainer.querySelector(".testcontainer:last-child");

                        // Вставляем варианты ответов
                        question.answers.forEach((answer, aIndex) => {
                            const answerNumber = aIndex + 1;
                            const isChecked = answer.is_correct ? "checked" : "";
                            console.log(answerNumber);
                            const answerHTML = `
                                <div class="plusanswerdelete">
                                    <div class="answerblock">
                                        <div class="answblockadd">
                                            <p class="variant">${answerNumber}</p>
                                            <p class="answertext">${answer.answer_text}</p>
                                            <input type="${answerType}" name="${answerNumber}${questionNumber}" value="option${answerNumber}" ${isChecked}>
                                            <button class="answerchange">Изменить</button>
                                            <button class="answerdelete">Удалить</button>
                                        </div>
                                    </div>
                                </div>
                            `;

                            currentTestContainer.querySelector(".undertestblock").insertAdjacentHTML("beforebegin", answerHTML);
                        });
                    });
                } else {
                    console.error("Ошибка при загрузке вопросов:", data.message);
                }
            })
            .catch(err => {
                console.error("Ошибка запроса:", err);
            });
            document.querySelector(".addquest").addEventListener("click", () => {
            const overTestContainer = document.querySelector(".overtestcontainer");
            const addQuestButton = document.querySelector(".addquest");
            addQuestButton.disabled = true;
            addQuestButton.classList.add("disabled-button");
            // Определяем номер нового вопроса
            const questionNumber = overTestContainer.querySelectorAll(".testcontainer").length + 1;
            const questionTextStart = `Текст вопроса`;
            const startPoints = 10;
            // Создаем HTML-код для нового вопроса
            overTestContainer.insertAdjacentHTML("beforeend", `
                <div class="testcontainer">
                    <div class="testblock">
                        <div class="plustestdelete">
                            <div class="upptestblock">
                                <div class="righttestadd">
                                    <p class="questnumb">${questionNumber}</p>
                                    <p class="questname">${questionTextStart}</p>
                                    <button class="questchange">Изменить</button>
                                </div>
                                <div class="lefttestadd">
                                    <p class="questpoints">Баллы за вопрос: <span class="questpointsspan">${startPoints}</span></p>
                                    <button class="pointschange">Изменить</button>
                                </div>
                            </div>
                            <button class="deletequest">Удалить вопрос</button>
                        </div>

                        <!-- Изначальный блок с выбором типа ответа -->
                        <div class="undertestblock">
                            <p class="answertype">Выберите тип ответа</p>
                            <select class="answer-type" name="options">
                                <option value="single">Одиночный</option>
                                <option value="multiple">Множественный</option>
                            </select>
                            <button class="addtype">Добавить</button>
                        </div>
                    </div>
                </div>
            `);
            const newQuestion = overTestContainer.querySelector(".testcontainer:last-child");


            // Делегируем обработчик для добавления вариантов
            const selectElement = newQuestion.querySelector(".answer-type");

            newQuestion.addEventListener("click", (event) => {
                const target = event.target;
                const currentTestContainer = target.closest(".testcontainer");

                const finalTextToAdd  = currentTestContainer.querySelector(".questname");
                const questionText = finalTextToAdd ? finalTextToAdd.textContent.trim() : "";
                const finalPointsToAdd = newQuestion.querySelector(".questpointsspan");
                const points = finalPointsToAdd ? parseInt(finalPointsToAdd.textContent.trim(), 10) : 10;
                if (!currentTestContainer) return;

                // Если нажали на кнопку "Добавить"
                if (target && target.classList.contains("addtype")) {
                    addQuestButton.disabled = false;
                    addQuestButton.classList.remove("disabled-button");
                    const selectedAnswerType = selectElement.value;
                    const undertestblock = currentTestContainer.querySelector(".undertestblock");

                    undertestblock.innerHTML = `
                        <button class="addanswer">Добавить вариант ответа</button>

                    `;

                    // Считаем количество уже добавленных вариантов для текущего вопроса
                    const plustestdeleteBlocks = currentTestContainer.querySelectorAll(".plusanswerdelete").length;
                    const answerNumber = plustestdeleteBlocks + 1;

                    // Функция для создания блока ответа
                    const createAnswerBlock = (index, type, isCorrect = false) => {
                        const answerBlock = document.createElement('div');
                        answerBlock.classList.add('plusanswerdelete');
                        answerBlock.innerHTML = `
                            <div class="answerblock">
                                <div class="answblockadd">
                                    <p class="variant">${index}</p>
                                    <p class="answertext">Текст — зафиксированная на каком-либо материальном носителе человеческая мысль;</p>
                                    <input type="${type}" name="${index}${questionNumber}" value="option${index}" ${isCorrect ? 'checked' : ''}>
                                    <button class="answerchange">Изменить</button>
                                </div>
                            </div>
                        `;
                        return answerBlock;
                    };

                    // Добавляем варианты в зависимости от выбранного типа
                    if (selectedAnswerType === "single") {
                        // Добавляем два варианта с радиокнопками для одиночного выбора
                        const firstAnswerBlock = createAnswerBlock(answerNumber, "radio", true);  // Первый вариант всегда выбран
                        const secondAnswerBlock = createAnswerBlock(answerNumber + 1, "radio");

                        undertestblock.insertAdjacentElement('beforebegin', firstAnswerBlock);
                        undertestblock.insertAdjacentElement('beforebegin', secondAnswerBlock);
                    } else if (selectedAnswerType === "multiple") {
                        // Добавляем два варианта с чекбоксами для множественного выбора
                        const firstAnswerBlock = createAnswerBlock(answerNumber, "checkbox", true);  // Первый вариант всегда выбран
                        const secondAnswerBlock = createAnswerBlock(answerNumber + 1, "checkbox");

                        undertestblock.insertAdjacentElement('beforebegin', firstAnswerBlock);
                        undertestblock.insertAdjacentElement('beforebegin', secondAnswerBlock);
                    }

                    // После нажатия на "Добавить", отправляем запрос на сервер с данными вопроса и вариантов
                    const answers = [];
                    currentTestContainer.querySelectorAll(".plusanswerdelete").forEach((variantBlock, index) => {
                        const answerVariant = variantBlock.querySelector(".variant").textContent;
                        const answerText = variantBlock.querySelector(".answertext").textContent;
                        const isCorrect = index === 0 ? 1 : 0;  // Первый вариант будет правильным

                        answers.push({variant: answerVariant, answer_text: answerText, is_correct: isCorrect });
                    });

                    // Отправка данных на сервер
                    fetch("/add-question", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            testId: testData.idtest,
                            text: questionText,
                            varquest: questionNumber,
                            points: points,
                            answers: answers
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            console.log("Вопрос и ответы успешно добавлены", data);
                        } else {
                            console.error("Ошибка при добавлении:", data.message);
                        }
                    })
                    .catch(err => {
                        console.error("Ошибка запроса:", err);
                    });
                }

            });
        });

document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
const target = event.target;

if (target.classList.contains("addanswer")) {
const currentTestContainer = target.closest(".testcontainer");
const undertestblock = currentTestContainer.querySelector(".undertestblock");

const questionNumber = currentTestContainer.querySelector(".questnumb").textContent;
const answerType = currentTestContainer.querySelector("input[type='radio'], input[type='checkbox']")
    ? currentTestContainer.querySelector("input[type='radio'], input[type='checkbox']").type
    : "radio"; 

const answerCount = currentTestContainer.querySelectorAll(".plusanswerdelete").length;
const answerNumber = answerCount + 1;

const newAnswerBlock = document.createElement("div");
newAnswerBlock.classList.add("plusanswerdelete");
newAnswerBlock.innerHTML = `
    <div class="answerblock">
        <div class="answblockadd">
            <p class="variant">${answerNumber}</p>
            <p class="answertext">Новый вариант ответа</p>
            <input type="${answerType}" name="${answerNumber}${questionNumber}" value="option${answerNumber}">
            <button class="answerchange">Изменить</button>
            <button class="answerdelete">Удалить</button>
        </div>
    </div>
`;

undertestblock.insertAdjacentElement("beforebegin", newAnswerBlock);

fetch("/add-more-answers", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        varquest: questionNumber,
        answerText: "Новый вариант ответа",
        testId: testData.idtest,
        answerVariant: answerNumber
    })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        console.log("Ответ успешно добавлен", data);
    } else {
        console.error("Ошибка при добавлении:", data.message);
    }
})
.catch(err => {
    console.error("Ошибка запроса:", err);
});
}
});
// === Обработчик изменения правильности ответа ===
document.querySelector(".overtestcontainer").addEventListener("change", (event) => {
const target = event.target;
if (target.tagName === "INPUT" && (target.type === "radio" || target.type === "checkbox")) {
const currentTestContainer = target.closest(".testcontainer");

// Если это радио-кнопка, сбрасываем все is_correct в 0
if (target.type === "radio") {
    currentTestContainer.querySelectorAll("input[type='radio']").forEach((radio) => {
        if (radio !== target) {
            radio.checked = false;
        }
    });
}

const questionNumber = currentTestContainer.querySelector(".questnumb").textContent;
const answerVariant = target.closest(".answerblock").querySelector(".variant").textContent;
const isCorrect = target.checked ? 1 : 0;

fetch("/update-answer", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        varquest: questionNumber,
        answerVariant: answerVariant,
        isCorrect: isCorrect,
        testId: testData.idtest,
        isRadio: target.type === "radio" // Передаем флаг
    })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
        console.log("Ответ обновлен в базе данных", data);
    } else {
        console.error("Ошибка при обновлении ответа:", data.message);
    }
})
.catch(err => {
    console.error("Ошибка запроса при обновлении:", err);
});
}
});
// === Обработчик удаления последнего варианта ответа (кроме первого и второго) ===
document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
const target = event.target;

if (target.classList.contains("answerdelete")) {
const currentTestContainer = target.closest(".testcontainer");
const answerBlocks = currentTestContainer.querySelectorAll(".plusanswerdelete");

// Удаляем только если есть более двух вариантов (чтобы первый и второй оставались)
if (answerBlocks.length > 2) {
    const lastAnswerBlock = answerBlocks[answerBlocks.length - 1]; // Последний вариант
    const answerVariant = lastAnswerBlock.querySelector(".variant").textContent;
    const questionNumber = currentTestContainer.querySelector(".questnumb").textContent;

    // Отправляем запрос на удаление из БД
    fetch("/delete-answer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            varquest: questionNumber,
            answerVariant: answerVariant,
            testId: testData.idtest
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Ответ успешно удален", data);
            lastAnswerBlock.remove(); // Удаляем из HTML только после успешного удаления из БД
        } else {
            console.error("Ошибка при удалении:", data.message);
        }
    })
    .catch(err => {
        console.error("Ошибка запроса при удалении:", err);
    });
} else {
    console.log("Нельзя удалить первый и второй вариант ответа!");
}
}
});

document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
const target = event.target;

if (target.classList.contains("answerchange")) {
const currentAnswerBlock = target.closest(".plusanswerdelete");
const answerTextElement = currentAnswerBlock.querySelector(".answertext");

if (!currentAnswerBlock.classList.contains("editing")) {
    // === Режим редактирования ===
    currentAnswerBlock.classList.add("editing");

    // Получаем текущий текст ответа
    const currentText = answerTextElement.textContent;

    // Создаём textarea и вставляем текущее значение
    const textarea = document.createElement("textarea");
    textarea.value = currentText;
    textarea.classList.add("edit-textarea");

    // Настройки стилей
    textarea.style.width = "100%"; // Заполняет всю ширину контейнера
    textarea.style.minHeight = "4vh"; // Минимальная высота
    textarea.style.padding = "0.8vh"; // Внутренний отступ
    textarea.style.fontSize = "1.6vh"; // Увеличенный шрифт для удобства
    textarea.style.resize = "none"; // Запрещаем ручное изменение размера

    // Автоматическое изменение высоты при вводе текста
    textarea.style.overflow = "hidden";
    textarea.addEventListener("input", function () {
        this.style.height = "auto"; // Сбрасываем высоту
        this.style.height = this.scrollHeight + "px"; // Подстраиваем под контент
    });

    // Устанавливаем высоту textarea по текущему тексту
    textarea.style.height = textarea.scrollHeight + "px";

    // Заменяем текст на textarea
    answerTextElement.replaceWith(textarea);

    // Меняем текст кнопки
    target.textContent = "Сохранить";

} else {
    // === Режим сохранения ===
    const textarea = currentAnswerBlock.querySelector(".edit-textarea");
    const newText = textarea.value.trim();

    if (newText === "") {
        alert("Ответ не может быть пустым!");
        return;
    }

    const questionNumber = currentAnswerBlock.closest(".testcontainer").querySelector(".questnumb").textContent;
    const answerVariant = currentAnswerBlock.querySelector(".variant").textContent;
    
    // Отправляем обновление на сервер
    fetch("/update-answer-text", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            varquest: questionNumber,
            answerVariant: answerVariant,
            testId: testData.idtest,
            newText: newText
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Ответ успешно обновлён", data);

            // Создаём новый <p> и вставляем в него новый текст
            const newAnswerText = document.createElement("p");
            newAnswerText.classList.add("answertext");
            newAnswerText.textContent = newText;

            // Заменяем textarea на новый <p>
            textarea.replaceWith(newAnswerText);

            // Меняем кнопку обратно на "Изменить"
            target.textContent = "Изменить";

            // Убираем класс "editing"
            currentAnswerBlock.classList.remove("editing");
        } else {
            console.error("Ошибка при обновлении:", data.message);
        }
    })
    .catch(err => {
        console.error("Ошибка запроса при обновлении:", err);
    });
}
}
});

document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
// Проверяем, был ли клик на кнопку "Удалить вопрос"
if (event.target.classList.contains("deletequest")) {
const currentTestContainer = event.target.closest(".testcontainer"); // Находим текущий контейнер вопроса
const questionVariant = currentTestContainer.querySelector(".questnumb").textContent; // Получаем значение вопроса
const testId = testData.idtest; // Получаем ID теста (например, из testData)
const addQuestButton = document.querySelector(".addquest");
addQuestButton.disabled = false;
addQuestButton.classList.remove("disabled-button");

if (!testId || !questionVariant) {
    console.error("Не удалось получить необходимые данные для удаления вопроса.");
    return;
}

// Проверяем, содержит ли контейнер .plusanswerdelete
const containsPlusAnswerDelete = currentTestContainer.querySelector(".plusanswerdelete") !== null;

if (containsPlusAnswerDelete) {
    // Если вопрос содержит .plusanswerdelete, то отправляем запрос на удаление из БД
    fetch("/delete-question", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            testId: testId,
            variant: questionVariant // Используем значение из .questnumb
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Вопрос успешно удален", data);

            // Обновляем нумерацию вопросов в HTML
            const remainingQuestions = document.querySelectorAll(".testcontainer");
            remainingQuestions.forEach(testContainer => {
                // Находим элемент с номером вопроса
                const questNumberElement = testContainer.querySelector(".questnumb");
                let questNumber = parseInt(questNumberElement.textContent);

                // Если номер вопроса больше, чем тот, который мы удаляем, то обновляем номер
                if (questNumber > parseInt(questionVariant)) {
                    questNumberElement.textContent = questNumber - 1; // Уменьшаем номер вопроса на 1

                    // Находим все инпуты внутри контейнера
                    const inputElements = testContainer.querySelectorAll("input");

                    // Проходим по каждому инпуту
                    inputElements.forEach(inputElement => {
                        // Проверяем тип инпута, чтобы обработать только checkbox или radio
                        if (inputElement.type === "checkbox" || inputElement.type === "radio") {
                            // Получаем значение атрибута name
                            const inputName = inputElement.getAttribute("name");

                            // Извлекаем число из строки name
                            const inputNumber = parseInt(inputName.match(/\d+/)[0]); // Извлекаем первое число

                            // Обновляем атрибут name, уменьшая число в name
                            inputElement.setAttribute("name", inputName.replace(inputNumber, inputNumber - 1));
                        }
                    });
                }
            });
            // Удаляем вопрос из DOM
            currentTestContainer.remove();
        } else {
            console.error("Ошибка при удалении вопроса:", data.message);
        }
    })
    .catch(err => {
        console.error("Ошибка запроса при удалении вопроса:", err);
    });
} else {
    // Если контейнер не содержит .plusanswerdelete, удаляем только из DOM без обращения к БД
    currentTestContainer.remove();
}
}
});
document.querySelector(".overtestcontainer").addEventListener("mouseover", (event) => {
const answBlock = event.target.closest(".answerblock");

if (!answBlock) return;

const currentTestContainer = answBlock.closest(".testcontainer");
const allAnswerBlocks = currentTestContainer.querySelectorAll(".answerblock");
const lastAnswerBlock = allAnswerBlocks[allAnswerBlocks.length - 1]; // Последний блок ответа в текущем вопросе

const changeButton = answBlock.querySelector(".answerchange");
const deleteButton = answBlock.querySelector(".answerdelete");

// Показываем кнопку "Изменить" всегда
if (changeButton) {
changeButton.style.display = "block";
}

// Показываем кнопку "Удалить" только в последнем блоке, если вариантов больше двух
if (deleteButton) {
deleteButton.style.display = (answBlock === lastAnswerBlock && allAnswerBlocks.length > 2) ? "block" : "none";
}
});

// Скрываем кнопки при уходе мыши
document.querySelector(".overtestcontainer").addEventListener("mouseout", (event) => {
const answBlock = event.target.closest(".answerblock");

if (!answBlock) return;

const changeButton = answBlock.querySelector(".answerchange");
const deleteButton = answBlock.querySelector(".answerdelete");

if (changeButton) {
changeButton.style.display = "none";
}
if (deleteButton) {
deleteButton.style.display = "none";
}
});
document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
const target = event.target;

if (target.classList.contains("questchange")) {
const currentTestContainer = target.closest(".testcontainer");
const questionTextElement = currentTestContainer.querySelector(".questname");

if (!currentTestContainer.classList.contains("editing")) {
    // === Режим редактирования ===
    currentTestContainer.classList.add("editing");

    // Получаем текущий текст вопроса
    const currentText = questionTextElement.textContent;

    // Создаём textarea и вставляем туда текст
    const textarea = document.createElement("textarea");
    textarea.value = currentText;
    textarea.classList.add("edit-textarea");

    // Стили для удобства ввода
    textarea.style.width = "100%";
    textarea.style.minHeight = "4vh";
    textarea.style.padding = "0.8vh";
    textarea.style.fontSize = "1.6vh";
    textarea.style.resize = "none";
    textarea.style.overflow = "hidden";
    textarea.style.marginRight = "2vh"
    // Автоизменение высоты
    textarea.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = this.scrollHeight + "px";
    });

    // Устанавливаем высоту textarea сразу
    textarea.style.height = textarea.scrollHeight + "px";

    // Заменяем <p> на textarea
    questionTextElement.replaceWith(textarea);

    // Меняем текст кнопки
    target.textContent = "Сохранить";
} else {
    // === Режим сохранения ===
    const textarea = currentTestContainer.querySelector(".edit-textarea");
    const newText = textarea.value.trim();

    if (newText === "") {
        alert("Текст вопроса не может быть пустым!");
        return;
    }

    // Получаем номер вопроса
    const questionNumber = currentTestContainer.querySelector(".questnumb").textContent;

    // Проверяем, есть ли .plusanswerdelete (т.е. вопрос есть в БД)
    const containsPlusAnswerDelete = currentTestContainer.querySelector(".plusanswerdelete") !== null;

    if (containsPlusAnswerDelete) {
        // Отправляем изменения в БД
        fetch("/update-question", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                varquest: questionNumber,
                testId: testData.idtest,
                newText: newText
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("Вопрос успешно обновлён", data);

                // Создаём новый <p> и вставляем в него новый текст
                const newQuestionText = document.createElement("p");
                newQuestionText.classList.add("questname");
                newQuestionText.textContent = newText;

                // Заменяем textarea на новый <p>
                textarea.replaceWith(newQuestionText);

                // Меняем кнопку обратно на "Изменить"
                target.textContent = "Изменить";

                // Убираем класс "editing"
                currentTestContainer.classList.remove("editing");
            } else {
                console.error("Ошибка при обновлении:", data.message);
            }
        })
        .catch(err => {
            console.error("Ошибка запроса при обновлении:", err);
        });
    } else {
        // Вопрос только в HTML, меняем локально
        const newQuestionText = document.createElement("p");
        newQuestionText.classList.add("questname");
        newQuestionText.textContent = newText;

        textarea.replaceWith(newQuestionText);
        target.textContent = "Изменить";
        currentTestContainer.classList.remove("editing");
    }
}
}
});
document.querySelector(".overtestcontainer").addEventListener("click", (event) => {
    const target = event.target;

    if (target.classList.contains("pointschange")) {
        const currentTestContainer = target.closest(".testcontainer");
        const pointsSpan = currentTestContainer.querySelector(".questpointsspan");

        const currentPoints = pointsSpan.textContent;

        showModalInput(
            "Изменение баллов за вопрос",
            "Введите баллы от 1 до 10",
            (inputValue) => {
                if (inputValue === null) return;

                const trimmed = inputValue.trim();
                const newPoints = parseInt(trimmed, 10);

                if (isNaN(newPoints) || newPoints < 1 || newPoints > 10) {
                    showModal("Недопустимое значение! Введите число от 1 до 10.", false);
                    return;
                }

                pointsSpan.textContent = newPoints;

                const containsPlusAnswerDelete = currentTestContainer.querySelector(".plusanswerdelete") !== null;

                if (containsPlusAnswerDelete) {
                    fetch("/update-question-points", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            varquest: currentTestContainer.querySelector(".questnumb").textContent,
                            testId: testData.idtest,
                            points: newPoints
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            showModal("Баллы успешно обновлены!", true);
                        } else {
                            showModal("Ошибка при обновлении баллов: " + data.message, false);
                        }
                    })
                    .catch(err => {
                        console.error("Ошибка запроса:", err);
                        showModal("Произошла ошибка при отправке данных.", false);
                    });
                }
            },
            currentPoints // Передаём текущее значение в input по умолчанию
        );
    }
});
            document.querySelector('.settimetest').addEventListener('click', function () {
                showModalInput(
                    "Введите время для прохождения теста",
                    "Формат: ЧЧ:ММ (02:30) или 0",
                    (timeInput) => {
                        if (timeInput === null) return;

                        timeInput = timeInput.trim();

                        if (timeInput === "0") {
                            timeInput = "00:00";
                        }

                        const timeRegex = /^([0-9]{2}):([0-9]{2})$/;

                        function getCorrectHourForm(hour) {
                            if (hour % 10 === 1 && hour % 100 !== 11) {
                                return `${hour} час`;
                            } else if ([2, 3, 4].includes(hour % 10) && ![12, 13, 14].includes(hour % 100)) {
                                return `${hour} часа`;
                            } else {
                                return `${hour} часов`;
                            }
                        }

                        function getCorrectMinuteForm(minute) {
                            if (minute % 10 === 1 && minute % 100 !== 11) {
                                return `${minute} минута`;
                            } else if ([2, 3, 4].includes(minute % 10) && ![12, 13, 14].includes(minute % 100)) {
                                return `${minute} минуты`;
                            } else {
                                return `${minute} минут`;
                            }
                        }

                        if (timeRegex.test(timeInput)) {
                            let [, hours, minutes] = timeInput.match(timeRegex);
                            hours = parseInt(hours, 10);
                            minutes = parseInt(minutes, 10);

                            if (hours === 0 && minutes === 0) {
                                document.querySelector('.ttest').textContent = "Неограничено";
                            } else if (hours === 0) {
                                document.querySelector('.ttest').textContent = getCorrectMinuteForm(minutes);
                            } else if (minutes === 0) {
                                document.querySelector('.ttest').textContent = getCorrectHourForm(hours);
                            } else {
                                document.querySelector('.ttest').textContent = `${getCorrectHourForm(hours)} ${getCorrectMinuteForm(minutes)}`;
                            }

                            fetch('/set-time-test', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    sectionId: data.sectionId,
                                    time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
                                })
                            })
                                .then(response => response.json())
                                .then(responseData => {
                                    if (responseData.success) {
                                        showModal("Время успешно обновлено!", true);
                                    } else {
                                        showModal("Ошибка при обновлении времени.", false);
                                    }
                                })
                                .catch(error => {
                                    console.error("Ошибка:", error);
                                    showModal("Ошибка при подключении к серверу.", false);
                                });
                        } else {
                            showModal("Неверный формат времени. Используйте формат ЧЧ:MM", false);
                        }
                    }
                );
            });
            document.querySelector('.changetimetotest').addEventListener('click', function () {
                showModalInput(
                    "Введите время до повторного прохождения",
                    "Формат: ЧЧ:ММ (02:30) или 0",
                    (timeInput) => {
                        if (timeInput === null) return;

                        timeInput = timeInput.trim();
                        if (timeInput === "0") {
                            timeInput = "00:00";
                        }

                        const timeRegex = /^([0-9]{2}):([0-9]{2})$/;

                        function getCorrectHourForm(hour) {
                            if (hour % 10 === 1 && hour % 100 !== 11) {
                                return `${hour} час`;
                            } else if ([2, 3, 4].includes(hour % 10) && ![12, 13, 14].includes(hour % 100)) {
                                return `${hour} часа`;
                            } else {
                                return `${hour} часов`;
                            }
                        }

                        function getCorrectMinuteForm(minute) {
                            if (minute % 10 === 1 && minute % 100 !== 11) {
                                return `${minute} минута`;
                            } else if ([2, 3, 4].includes(minute % 10) && ![12, 13, 14].includes(minute % 100)) {
                                return `${minute} минуты`;
                            } else {
                                return `${minute} минут`;
                            }
                        }

                        if (timeRegex.test(timeInput)) {
                            let [, hours, minutes] = timeInput.match(timeRegex);
                            hours = parseInt(hours, 10);
                            minutes = parseInt(minutes, 10);

                            if (hours === 0 && minutes === 0) {
                                document.querySelector('.timetotest').textContent = "Неограничено";
                            } else if (hours === 0) {
                                document.querySelector('.timetotest').textContent = getCorrectMinuteForm(minutes);
                            } else if (minutes === 0) {
                                document.querySelector('.timetotest').textContent = getCorrectHourForm(hours);
                            } else {
                                document.querySelector('.timetotest').textContent = `${getCorrectHourForm(hours)} ${getCorrectMinuteForm(minutes)}`;
                            }

                            fetch('/set-reloadtime-test', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    sectionId: data.sectionId,
                                    reloadId: testData.idtest,
                                    time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
                                })
                            })
                                .then(response => response.json())
                                .then(responseData => {
                                    if (responseData.success) {
                                        showModal("Время успешно обновлено!", true);
                                    } else {
                                        showModal("Ошибка при обновлении времени.", false);
                                    }
                                })
                                .catch(error => {
                                    console.error("Ошибка:", error);
                                    showModal("Произошла ошибка при отправке данных.", false);
                                });
                        } else {
                            showModal("Неверный формат времени. Используйте формат ЧЧ:MM", false);
                        }
                    }
                );
            });
            document.querySelector('.deltetest').addEventListener('click', () => {
            showConfirmationModal(
                "Вы уверены, что хотите удалить тест?",
                () => {
                    // Отправляем запрос на удаление
                    fetch('/delete-test', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sectionId: data.sectionId })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            showModal("Тест успешно удалён!", true, () => {
                                window.location.href = '/Administrator/Adminchapter/html/achapter.html';
                            });
                        } else {
                            showModal('Ошибка при удалении теста', false);
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка при удалении теста:', error);
                        showModal('Ошибка соединения с сервером', false);
                    });
                }
            );
        });
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
                            Promise.all([fetchProfilePicture, backgroundImage, getquestions])
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
    })
    .catch(error => console.error('Ошибка при проверке теста:', error));
    })
    .catch(error => {
        console.error('Ошибка при получении названия секции:', error);
        window.location.href = '/Administrator/Adminchapter/html/achapter.html';
    });
    document.querySelector(".buttonback").addEventListener("click", () => {
        window.location.href = '/Administrator/Administratormainmenu/html/amainmenu.html';
    });
    document.querySelector(".buttonback2").addEventListener("click", () => {
        window.location.href = '/Administrator/Adminchapter/html/achapter.html';
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
    }
})
.catch(error => {
    console.error('Ошибка проверки авторизации:', error);
    window.location.href = '/Enteringpage/html/entering.html';
});     
});