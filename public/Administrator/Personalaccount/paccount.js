 // Преобразуем строку даты из ISO формата в формат YYYY-MM-DD
 function formatDateToInput(value) {
    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // месяц начинается с 0, поэтому +1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
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
// Проверка авторизации и заполнение данных
const preloader = document.getElementById('preloader');
    setTimeout(() => {
    preloader.classList.add('show'); 
    }, 2000); 
fetch('/check-auth')
    .then(response => response.json())
    .then(data => {
        console.log(data.role, data.userName, data.userSurname,  data.fatherName, data.sex,  data.birthDate, data.roleMain);
        if (data.role !== 'admin') {
            window.location.href = '/Enteringpage/html/entering.html';
        } else {
                // Получаем изображения пользователя с сервера
                const fetchProfilePicture =  fetch('/get-profile-picture', {
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
                    if (data.picture) {
                        console.log(data.picture);
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
            const userData = {
                userName: data.userName,
                birthDate: data.birthDate
            };
            updateUserGreeting(userData);

            
            console.log(data.userSurname, data.fatherName, data.sex, data.birthDate);
            
            // Заполняем поля данными из куки
            document.querySelector('.surname').value = data.userSurname;
            document.querySelector('.name').value = data.userName;
            document.querySelector('.fathername').value = data.fatherName;
           
            // Заполняем поле пола как выпадающий список
            const sexSelect = document.querySelector('.sex');
            if (data.sex === 'мужской') {
                sexSelect.value = 'мужской';
            } else if (data.sex === 'женский') {
                sexSelect.value = 'женский';
            } else {
                sexSelect.value = 'none';
            }

            // Преобразуем дату в формат YYYY-MM-DD и заполняем поле
            document.querySelector('.birth').value = data.birthDate ? formatDateToInput(data.birthDate) : '';
            console.log(data.birthDate);
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
        }
    })
    .catch(error => {
        console.error('Ошибка проверки авторизации:', error);
        window.location.href = '/Enteringpage/html/entering.html';
    });
    
let cropper; // Для сохранения экземпляра Cropper.js
let cropperMini; // Для миниатюры
let croppedImageBlob = null; // Для хранения обрезанного основного изображения
let croppedMiniBlob = null; // Для хранения миниатюры

const fileInput = document.querySelector(".file-input");
const profileImage = document.querySelector(".profile-image");
const profileSection = document.querySelector(".profile-section");
const saveMainImageButton = document.querySelector(".save-main-image"); // Кнопка для основного изображения
const saveMiniatureButton = document.querySelector(".save-miniature-image"); // Кнопка для миниатюры
const photoIcon = document.querySelector(".photo-icon");
const photoText = document.querySelector(".photo-t");
const userLogo = document.querySelector(".userlogo");

// Переменная, которая будет отслеживать, разрешено ли загружать новый файл
let canUploadNewFile = true;

// Обработчик клика на профиле
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
            cropper.destroy(); // Уничтожаем старый cropper
        }

        canUploadNewFile = false;

        // Инициализируем первый cropper для основного изображения
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
                saveMainImageButton.style.display = "inline-block"; // Показываем кнопку для основного изображения
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

// Сохраняем основное изображение
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

        // Останавливаем cropper для основного изображения
        cropper.destroy();

        // Создаём новый cropper для миниатюры
        profileImage.src = URL.createObjectURL(blob);
        profileImage.style.display = "block";
        saveMainImageButton.style.display = "none"; // Прячем кнопку для основного изображения
        saveMiniatureButton.style.display = "inline-block"; // Показываем кнопку для миниатюры

        // Уничтожаем cropper миниатюры, если он был
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
                saveMiniatureButton.style.display = "inline-block"; // Убедимся, что кнопка миниатюры показана
            },
            cropend() {
                saveMiniatureButton.textContent = "Загрузить оба изображения";
            }
        });
    }, 'image/jpeg');
}
});

// Сохраняем миниатюру и отправляем оба изображения на сервер
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

        // Отправляем оба изображения на сервер
        const formData = new FormData();
        formData.append("picture", croppedImageBlob); // Основное изображение
        formData.append("minipicture", croppedMiniBlob); // Миниатюра

        fetch('/upload-profile-image', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showModal('Изображения успешно загружены!', true);
                // Отображаем изображения в userlogo
                const pictureURL = URL.createObjectURL(croppedImageBlob);
                const miniPictureURL = URL.createObjectURL(croppedMiniBlob);
                document.querySelector('.deleteimg').style.display = 'block';
                // Устанавливаем изображение в .userlogo
                userLogo.innerHTML = `<img src="${miniPictureURL}" alt="User Logo" style="width: 10vh; height: 10vh; object-fit: cover; border-radius: 50%;">`;

                // Обновляем основной блок профиля
                profileImage.src = pictureURL;
                profileImage.style.objectFit = "cover";

                // Уничтожаем cropper mini после отправки
                if (cropperMini) {
                    cropperMini.destroy();  // Уничтожаем cropper mini, чтобы не было выделения
                }

                // Скрываем кнопку сохранения
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

// Добавляем возможность загружать новое изображение при клике по изображению
profileImage.addEventListener("click", () => {
if (canUploadNewFile) {
    fileInput.click();
}
});
document.querySelector(".deleteimg").addEventListener("click", () => {
// Отправляем запрос на сервер для удаления изображений
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
        // После удаления скрываем кнопку
        document.querySelector(".deleteimg").style.display = 'none';
        // Дополнительно можно сбросить изображение в UI, например:
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
// Обработчик для сохранения изменений
document.querySelector(".save").addEventListener("click", () => {
    const surname = document.querySelector('.surname').value.trim();
    const name = document.querySelector('.name').value.trim();
    const fathername = document.querySelector('.fathername').value.trim();
    const sex = document.querySelector('.sex').value;
    const birthDate = document.querySelector('.birth').value;
    console.log(birthDate);
    // Валидация: если имя и фамилия пустые
    if (!surname || !name) {
        showModal('Фамилия и имя обязательны для ввода!', false);
        return;
    }
    console.log(birthDate);

    const birthDateValue = birthDate === '' || birthDate === null ? null : birthDate;

    // Преобразуем пол, если выбрано "none", то делаем его null
    const sexValue = sex === 'none' ? null : sex;

    // Преобразуем пол, если выбрано "none", то делаем его null
    const fathernameValue = fathername === '' || fathername === null ? null : fathername;


    // Отправляем данные на сервер для обновления
    fetch('/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            surname,
            name,
            fathername: fathernameValue ,
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
        document.querySelector('.surname').value = 'Админ';
        document.querySelector('.name').value = 'Админ';
        document.querySelector('.fathername').value = '';
        document.querySelector('.birth').value = '';
        showModal('Информация сброшена до значений по умолчанию!', true);
});

document.querySelector(".save-password-btn").addEventListener("click", () => {
const currentPassword = document.querySelector("#current-password").value.trim();
const newPassword = document.querySelector("#new-password").value.trim();
const errorMessage = document.querySelector(".error-message");



// Проверка, что новый пароль введён
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

// Отправка запроса на сервер
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
    errorMessage.style.display = "block"; // Показываем сообщение
})
.catch(error => {
    console.error('Ошибка смены пароля:', error);
    errorMessage.textContent = "Ошибка сервера! Попробуйте позже.";
});
});
document.querySelector(".reset-original-password").addEventListener("click", () => {
const errorMessage = document.querySelector(".error-message");
// Отправка запроса на сервер для сброса пароля
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
// Обработчик для выхода из аккаунта
document.querySelector(".logout").addEventListener("click", () => {
    fetch('/logout', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/Enteringpage/html/entering.html';
            }
        })
        .catch(error => console.error('Ошибка выхода:', error));
});

// Обработчик для перехода в главное меню
document.querySelector(".buttonback").addEventListener("click", () => {
    window.location.href = '/Administrator/Administratormainmenu/html/amainmenu.html';
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