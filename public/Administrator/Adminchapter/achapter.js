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
    // Обновляем название секции на странице
    console.log(sectionData.sectiontime);
    console.log(sectionData.isReadVisible);
    const  getwordfile = fetch('/get-word-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            moduleId: data.moduleId,
            sectionId: data.sectionId
        })
    })
    .then(response => {
        if (response.status === 204) { // Если статус 204 (No Content), то файл отсутствует
            console.log("Файл не найден или пустой в БД, редактор остается пустым");
            return; // Не продолжаем обработку
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

            // Преобразуем Word-документ в чистый текст
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(function (result) {
                    let content = result.value;

                    content = content.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); // Восстанавливаем табуляцию
                    quill.clipboard.dangerouslyPasteHTML(content.replace(/\n/g, '<br>')); // Вставляем в Quill
                })
                .catch(function (err) {
                    console.error("Ошибка при обработке Word файла:", err);
                });
        };

        reader.readAsArrayBuffer(blob); // Читаем файл как ArrayBuffer
    })
    .catch(error => console.error("Ошибка при загрузке файла из БД:", error));
    const checktest = fetch('/check-test', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sectionId: data.sectionId }) // Отправляем sectionId
    })
    .then(response => response.json())
    .then(testData => {
        const endlineWrapper = document.querySelector('.endline-wrapper');

        // Обновляем текст кнопки
        document.querySelectorAll('.addtestchapter').forEach(button => {
            button.textContent = testData.idtest ? 'Изменить тест' : 'Добавить тест';
        });

        // Если testData.idtest существует, удаляем p и input
        if (testData.idtest) {
            const radioText = endlineWrapper.querySelector('.radiochecktext');
            const radioInput = endlineWrapper.querySelector('.readVisibilityRadio');

            if (radioText) radioText.remove();
            if (radioInput) radioInput.remove();

            console.log("Элементы для отметки прочтения удалены, так как testData.idtest существует.");
        } 
        // Если testData.idtest не существует, добавляем p и input обратно
        else {
            if (!endlineWrapper.querySelector('.radiochecktext')) {
                const newRadioText = document.createElement('p');
                newRadioText.classList.add('radiochecktext');
                newRadioText.innerHTML = "Необходимо помечать <br>как прочитанное";
                endlineWrapper.appendChild(newRadioText);
            }

            if (!endlineWrapper.querySelector('.readVisibilityRadio')) {
                const newRadioInput = document.createElement('input');
                newRadioInput.type = "radio";
                newRadioInput.classList.add('readVisibilityRadio');
                endlineWrapper.appendChild(newRadioInput);
            }

            console.log("Элементы для отметки прочтения добавлены, так как testData.idtest отсутствует.");
        }
    })
    .catch(error => console.error('Ошибка при проверке теста:', error));
    document.querySelectorAll('.readVisibilityRadio').forEach(radio => {
            // Проверяем, должно ли радио быть отмечено
            radio.checked = sectionData.isReadVisible === 1;
            console.log(`Устанавливаем состояние radio: ${radio.checked ? 'checked' : 'unchecked'}`);

            // Сохраняем актуальное значение в data-value
            radio.setAttribute('data-value', sectionData.isReadVisible);

            // Проверяем, нужно ли удалить кнопку
            const endlineWrapper = document.querySelector('.endline-wrapper');
            const existingButton = endlineWrapper.querySelector('.addtestchapter');

            if (sectionData.isReadVisible === 1 && existingButton) {
                existingButton.remove(); // Удаляем кнопку, если isReadVisible = 1
                console.log("Кнопка 'Добавить тест' удалена, так как isReadVisible = 1");
            }
        });
        document.querySelectorAll('.timetoread').forEach(span => {
        span.textContent = sectionData.sectiontime && sectionData.sectiontime !== "0" ? sectionData.sectiontime : "0";
    });
    document.querySelectorAll('.text1span').forEach(span => {
        span.textContent = sectionData.name;
    });
    var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline'],
            ['link', 'image'],
            ['video'], // Вставка медиа
            [{ 'align': [] }],
            ['clean']
        ],
    }
});
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

    document.getElementById("audioUpload").addEventListener("change", function (event) {
        var file = event.target.files[0];
        if (file) {
            var reader = new FileReader();
            
            reader.onload = function () {
                // Читаем файл как DataURL
                var audioDataUrl = reader.result;

                // Вставляем аудиофайл как вложение
                let range = quill.getSelection();
                if(range){
                    quill.insertEmbed(range.index, "audio", audioDataUrl);
                }
            };
            
            reader.readAsDataURL(file); // Чтение файла в формате DataURL
        }
        event.target.value = "";
    });
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
        // Для изображений
        if (node.nodeName === 'IMG') {
            const img = node;
            const width = img.getAttribute('width') || img.style.width || '';
            const height = img.getAttribute('height') || img.style.height || '';
            
            // Убираем стили из самого элемента
            img.removeAttribute('style');
            
            // Обновляем атрибуты с размерами
            if (width && height) {
                img.setAttribute('width', width);
                img.setAttribute('height', height);
            }
        }
        if (node.nodeName === 'IFRAME') {
            const iframe = node;
            const width = iframe.getAttribute('width') || iframe.style.width || '';
            const height = iframe.getAttribute('height') || iframe.style.height || '';
            
            // Убираем стили из самого элемента
            iframe.removeAttribute('style');
            
            // Обновляем атрибуты с размерами
            if (width && height) {
                iframe.setAttribute('width', width);
                iframe.setAttribute('height', height);
            }
        }
    });
    return div.innerHTML;
}
document.getElementById('saveWord').addEventListener('click', function () {
    var htmlContent = quill.root.innerHTML;  // Получаем HTML-содержимое редактора
    htmlContent = htmlContent.replace(/ {4}/g, "\t");
    htmlContent = processInsertedHtml(htmlContent);
    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: [
                    new docx.Paragraph({
                        children: [
                            new docx.TextRun(htmlContent)  
                        ],
                    }),
                ],
            },
        ],
    });

    // Конвертация в файл Word
    docx.Packer.toBlob(doc).then(function (blob) {
        saveAs(blob, "document.docx");
    });
});
document.getElementById('saveDB').addEventListener('click', function () {
        var htmlContent = quill.root.innerHTML.trim(); // Получаем HTML-содержимое

        // Регулярка для проверки "пустого" документа
        const emptyContentRegex = /^(<p><br><\/p>)+$/;
        // Проверяем, пустой ли редактор (только <p><br></p>)
        if (!htmlContent || emptyContentRegex.test(htmlContent)) { 
            console.log("Редактор пуст, отправляем NULL в БД");

            fetch('/save-word-file', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isEmpty: true // Флаг, что контент пустой
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showModal('Файл успешно сохранен в БД как NULL', true);
                } else {
                    showModal('Ошибка при сохранении NULL в БД: ' + result.message, false);
                }
                })
                .catch(error => console.error('Ошибка при отправке файла:', error));

            return; // Прерываем выполнение
        }
        htmlContent = htmlContent.replace(/ {4}/g, "\t");
        // Если текст не пустой — создаем Word-документ
        htmlContent = processInsertedHtml(htmlContent);

        const doc = new docx.Document({
            sections: [
                {
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            children: [
                                new docx.TextRun(htmlContent)
                            ],
                        }),
                    ],
                },
            ],
        });
        docx.Packer.toBlob(doc).then(function (blob) {
            const formData = new FormData();
            formData.append('file', blob, 'document.docx');
            formData.append('moduleId', data.moduleId);
            formData.append('sectionId', data.sectionId);
            fetch('/save-word-file', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    showModal('Файл успешно сохранен в БД', true);
                } else {
                    showModal('Ошибка при сохранении в БД: ' + result.message, false);
                }
                })
                .catch(error => console.error('Ошибка при отправке файла:', error));
        });
    });
document.getElementById('uploadWord').addEventListener('change', function(event) {
    var reader = new FileReader();

    reader.onload = function(event) {
        var arrayBuffer = reader.result;
        
        mammoth.extractRawText({ arrayBuffer: arrayBuffer })
            .then(function(result) {
                let content = result.value;
                
                content = content.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;'); // Восстанавливаем табуляцию
                
                quill.clipboard.dangerouslyPasteHTML(content.replace(/\n/g, '<br>'));
            })
            .catch(function(err) {
                console.log("Ошибка при загрузке Word файла:", err);
            });
    };

    var file = event.target.files[0];
    if (file) {
        reader.readAsArrayBuffer(file);
    }
});
// Функция для изменения размера изображений и видео
    const editorContainer = document.querySelector('#editor-container');
    let draggedElement = null;

    editorContainer.addEventListener('mousedown', function (event) {
        const element = event.target.closest('img'); 
        if (element) {
            draggedElement = element; // Сохраняем элемент, который будем изменять
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
        document.querySelectorAll('.text1, .namechangerchapter').forEach(element => {
            element.addEventListener('click', () => {
                showModalInput(
                    "Введите новое название раздела",
                    "Введите название...",
                    (newSectionName) => {
                        if (!newSectionName.trim()) return;

                        fetch('/change-section-name', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                moduleId: data.moduleId,
                                sectionId: data.sectionId,
                                newSectionName: newSectionName.trim()
                            }),
                        })
                        .then(response => response.json())
                        .then(result => {
                            if (result.success) {
                                showModal("Название раздела успешно изменено", true, () => location.reload());
                            } else {
                                showModal(result.message || "Ошибка при изменении названия", false, () => location.reload());
                                console.error('Ошибка при изменении названия раздела:', result.message);
                            }
                        })
                        .catch(error => {
                            showModal("Ошибка при изменении названия раздела", false);
                            console.error('Ошибка при изменении названия раздела:', error);
                        });
                    }
                );
            });
        });
        document.querySelectorAll('.changetimetoread').forEach(button => {
            button.addEventListener('click', () => {
                showModalInput(
                    "Введите новое время для раздела",
                    "например, 10 Минут, 3 Дня или 0",
                    (newTime) => {
                        if (!newTime.trim()) return;

                        var htmlContent = quill.root.innerHTML.trim();
                        const emptyContentRegex = /^(<p><br><\/p>)+$/;

                        if (!data.moduleId || !data.sectionId) {
                            showModal("Ошибка: отсутствуют moduleId или sectionId", false);
                            return;
                        }

                        if (!htmlContent || emptyContentRegex.test(htmlContent)) {
                            fetch('/save-word-file', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    moduleId: data.moduleId,
                                    sectionId: data.sectionId,
                                    isEmpty: true
                                })
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    showModal('Время изменено. Автосохранение', true, () => location.reload());
                                } else {
                                    showModal('Ошибка при сохранении NULL в БД: ' + result.message, false, () => location.reload());
                                }

                                fetch('/change-section-time', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        moduleId: data.moduleId,
                                        sectionId: data.sectionId,
                                        sectionTime: newTime
                                    })
                                })
                                .then(response => response.json())
                                .then(result => {
                                    if (!result.success) {
                                        console.error('Ошибка при изменении времени:', result.message);
                                    }
                                })
                                .catch(error => console.error('Ошибка при изменении времени:', error));
                            })
                            .catch(error => console.error('Ошибка при отправке NULL в БД: ' + error));

                            return;
                        }

                        htmlContent = processInsertedHtml(htmlContent);

                        const doc = new docx.Document({
                            sections: [
                                {
                                    properties: {},
                                    children: [
                                        new docx.Paragraph({
                                            children: [new docx.TextRun(htmlContent)],
                                        }),
                                    ],
                                },
                            ],
                        });

                        docx.Packer.toBlob(doc).then(function (blob) {
                            const formData = new FormData();
                            formData.append('file', blob, 'document.docx');
                            formData.append('moduleId', data.moduleId);
                            formData.append('sectionId', data.sectionId);

                            fetch('/save-word-file', {
                                method: 'POST',
                                body: formData
                            })
                            .then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    showModal('Время изменено. Автосохранение', true, () => location.reload());
                                } else {
                                    showModal('Ошибка при сохранении файла в БД: ' + result.message, false, () => location.reload());
                                }

                                fetch('/change-section-time', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        moduleId: data.moduleId,
                                        sectionId: data.sectionId,
                                        sectionTime: newTime
                                    })
                                })
                                .then(response => response.json())
                                .then(result => {
                                    if (!result.success) {
                                        console.error('Ошибка при изменении времени:', result.message);
                                    }
                                })
                                .catch(error => console.error('Ошибка при изменении времени:', error));
                            })
                            .catch(error => console.error('Ошибка при отправке файла: ' + error));
                        });
                    }
                );
            });
        });
    // Обработчик для изменения состояния радио
    document.querySelectorAll('.readVisibilityRadio').forEach(radio => {
            radio.addEventListener('click', () => {
                // Получаем текущее значение состояния из атрибута data-value
                const currentValue = radio.getAttribute('data-value');
                const newValue = currentValue === '1' ? '0' : '1'; // Переключаем 1 на 0 или наоборот

                console.log(`Текущее значение: ${currentValue}, новое значение: ${newValue}`);

                // Отправляем новое значение на сервер
                fetch('/change-read-visibility', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moduleId: data.moduleId,
                        sectionId: data.sectionId,
                        isReadVisible: newValue
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        console.log(`Статус isReadVisible изменен на ${newValue}`);
                        radio.setAttribute('data-value', newValue); // Обновляем атрибут data-value
                        radio.checked = newValue === '1'; // Обновляем состояние радио

                        const endlineWrapper = document.querySelector('.endline-wrapper');
                        const existingButton = endlineWrapper.querySelector('.addtestchapter');

                        if (newValue === '0') {
                            if (!existingButton) { // Если кнопки нет, создаем
                                const addTestButton = document.createElement('button');
                                addTestButton.classList.add('addtestchapter');
                                fetch('/check-test', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ sectionId: data.sectionId }) // Отправляем sectionId
                                })
                                .then(response => response.json())
                                .then(testData => {
                                    document.querySelectorAll('.addtestchapter').forEach(addTestButton => {
                                        addTestButton.textContent = testData.idtest? 'Изменить тест' : 'Добавить тест';
                                    });
                                })
                                .catch(error => console.error('Ошибка при проверке теста:', error));
                                endlineWrapper.insertBefore(addTestButton, endlineWrapper.firstChild); // Вставляем перед всеми элементами
                            }
                        } else {
                            if (existingButton) {
                                existingButton.remove(); // Удаляем кнопку, если значение 1
                            }
                        }
                    } else {
                        console.error('Ошибка при изменении isReadVisible:', result.message);
                    }
                })
                .catch(error => console.error('Ошибка при изменении isReadVisible:', error));
            });
        });  
        document.querySelector('.endline-wrapper').addEventListener('click', (event) => {
        const target = event.target;

        // Проверяем, кликнули ли именно по кнопке "Добавить тест"
        if (target.classList.contains('addtestchapter')) {
            fetch('/handle-test-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionId: data.sectionId })
            })
            .then(response => response.json())
            .then(result => {
                window.location.href = '/Administrator/Admintest/html/atest.html';
            })
            .catch(error => console.error('Ошибка при обработке теста:', error));
        }
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
                        Promise.all([getwordfile, fetchProfilePicture, backgroundImage, checktest])
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
.catch(error => {
    console.error('Ошибка при получении названия секции:', error);
    window.location.href = '/Administrator/Adminmodule/html/amodule.html';
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
            window.location.href = '/Administrator/Adminmodule/html/amodule.html';
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