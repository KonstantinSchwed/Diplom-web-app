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
function showModal(message, isSuccess = true, onClose = null) {
const overlay = document.getElementById("modal-overlay-info");
const messageElem = document.getElementById("modal-message-info");
const logo = isSuccess ? '/Projectresources/logo+.svg' : '/Projectresources/logo-.svg';
messageElem.innerHTML = `${message} <img id="logo" src="${logo}" alt="Logo">`;
overlay.style.display = "flex";

// Плавно показать
requestAnimationFrame(() => overlay.classList.add("show"));

const close = () => {
overlay.classList.remove("show");
setTimeout(() => {
overlay.style.display = "none";
if (onClose) onClose();
}, 200);

// Очистка обработчиков
document.getElementById("confirm-info").onclick = null;
document.getElementById("close-modal-info").onclick = null;
overlay.onclick = null;
};

document.getElementById("confirm-info").onclick = close;
document.getElementById("close-modal-info").onclick = close;

overlay.onclick = (e) => {
if (e.target === overlay) close();
};
}
function showConfirmModal(message, onConfirm) {
const overlay = document.getElementById("modal-overlay-confirm");
const messageElem = document.getElementById("modal-message-confirm");

messageElem.innerHTML = `${message}`;
overlay.style.display = "flex";

requestAnimationFrame(() => overlay.classList.add("show"));

const close = () => {
overlay.classList.remove("show");
setTimeout(() => {
overlay.style.display = "none";
}, 200);

document.getElementById("confirm-yes").onclick = null;
document.getElementById("confirm-no").onclick = null;
document.getElementById("close-modal-confirm").onclick = null;
overlay.onclick = null;
};

document.getElementById("confirm-yes").onclick = () => {
close();
onConfirm();
};
document.getElementById("confirm-no").onclick = close;
document.getElementById("close-modal-confirm").onclick = close;

overlay.onclick = (e) => {
if (e.target === overlay) close();
};
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
fetch("/check-auth")
  .then((response) => response.json())
  .then((data) => {
    if (data.role !== "admin") {
      window.location.href = "/Enteringpage/html/entering.html";
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
                const userData = {
                    userName: data.userName,
                    birthDate: data.birthDate
                };
    updateUserGreeting(userData);
    //Основной код страницы
    const table = document.querySelector(".user-table");
    // Создаем тело таблицы
    const tbody = table.createTBody();
const tabldata = fetch("/get-table-data", { method: "POST" })
.then(response => response.json()) 
.then(data => {
    if (data.success) {
        console.log(data);
        // Создаем заголовок таблицы
        const headerRow = document.createElement("tr");
        const headers = Object.keys(data.rows[0]); // Получаем ключи из первого объекта массива

        // Объект для замены названий ключей на русские
        const keyTranslations = {
            user_id: "№",
            name: "Имя",
            surname: "Фамилия",
            password: "Пароль",
            role: "Роль",
            picture: "Изображение",
            fathername: "Отчество"
        };

        // Добавляем th элементы для каждого ключа
        headers.forEach((key) => {
            const th = document.createElement("th");
            th.textContent = keyTranslations[key] || key; // Заменяем ключи, если есть перевод
            headerRow.appendChild(th);
        });

        // Создаем Set для заголовков read_
        const readHeaders = new Set();

        // Получаем дополнительные столбцы read_
        fetch("/read-table-user", { method: "POST" })
            .then(response => response.json()) 
            .then(readData => {
                if (readData.success) {
                  console.log(readData);
                    readData.rows.forEach(row => {
                        Object.keys(row).forEach(key => {
                            if (key.startsWith("прочитано_")) {
                                readHeaders.add(key);
                            }
                        });
                    });

                    // Добавляем новые заголовки read_
                    readHeaders.forEach(header => {
                        const th = document.createElement("th");
                        th.textContent = header; // Убираем префикс read_
                        headerRow.appendChild(th);
                    });

                    // Добавляем заголовок "Удалить"
                    const thDelete = document.createElement("th");
                    thDelete.textContent = "Удалить";
                    headerRow.appendChild(thDelete);

                    // Добавляем заголовок в таблицу
                    const thead = table.createTHead();
                    thead.appendChild(headerRow);

                  

                    // Заполняем строки таблицы
                    data.rows.forEach((rowData, index) => {
                        const row = document.createElement("tr");
                        row.setAttribute("data-user-id", rowData.user_id); 

                        // Добавляем данные из data.rows
                        headers.forEach((key) => {
                            const td = document.createElement("td");
                            td.contentEditable = !(key === "user_id" || key.startsWith("среднее"));
                            if(td.contentEditable === "false" && key!="user_id"){
                              td.classList.add("blockedFields");
                            }
                            // Обрабатываем разные типы данных
                            td.textContent = key === "user_id" ? index + 1 :
                                             key === "picture" ? (rowData[key] ? "да" : "нет") :
                                             rowData[key] || "";

                            // Добавляем обработчик сохранения изменений
                            if (td.contentEditable === "true") {
                                td.addEventListener("blur", function () {
                                    const updatedData = {
                                        user_id: rowData.user_id,
                                        field: key,
                                        value: td.textContent.trim()
                                    };

                                    fetch("/table-update-user", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(updatedData)
                                    })
                                    .then(response => response.json())
                                    .then(result => {
                                        if (!result.success) {
                                          console.error("Ошибка при обновлении данных");
                                        }
                                    })
                                    .catch(error => console.error("Ошибка:", error));
                                });
                            }

                            row.appendChild(td);
                        });

                        // Добавляем ячейки read_, если их нет, ставим "нет"
                        let flag = false;
                        readHeaders.forEach((header, index) => {
                          const td = document.createElement("td");
                          readData.rows.forEach(row => {
                            if (row.IDuser === rowData.user_id) {
                                // Check if the header matches one of the 'read_' keys and the value is 'да'
                                console.log("совпало", row.IDuser)
                                const key = Object.keys(row).find(key => key === header);

                                if (key && row[key] === 'да') {
                                    flag = true;
                                } 
                            }
                        });
                        if(flag) td.textContent = 'да';
                        else td.textContent = 'нет';
                        td.classList.add("blockedFields");
                        row.appendChild(td);
                        flag = false;
                      });
                        const deleteTd = document.createElement("td");
                        if(index!=0){
                        const deleteButton = document.createElement("button");
                        deleteButton.textContent = "Удалить";
                        deleteButton.classList.add("delete-btn");
                        deleteButton.addEventListener("click", function () {
                            showConfirmModal(`Вы уверены, что хотите удалить пользователя ${index + 1}?`, () => {
                              fetch("/table-delete-user", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ user_id: rowData.user_id })
                              })
                                .then((response) => response.json())
                                .then((result) => {
                                  if (result.success) {
                                    row.remove();
                                    showModal("Запись удалена", true);
                                  } else {
                                    showModal("Ошибка при удалении записи", false);
                                  }
                                })
                                .catch((error) => console.error("Ошибка:", error));
                            });
                        });

                        deleteTd.appendChild(deleteButton);
                      }
                      row.appendChild(deleteTd);
                        // Добавляем строку в таблицу
                        tbody.appendChild(row);
                    });

                    // Добавляем tbody в таблицу
                    table.appendChild(tbody);
                }
            });

            document.querySelector(".add-user").addEventListener("click", function () {
              fetch("/table-add-user", { method: "POST" })
              .then((response) => response.json()) // Parse the JSON response
              .then((data) => {
                if (data.success) {
                  console.log(data);
                const newRow = document.createElement("tr");
                const newUserId = tbody.rows.length + 1; // Generate a new user_id
                newRow.setAttribute("data-user-id", data.userId);

                headers.forEach((key) => {
                  const td = document.createElement("td");
                  td.contentEditable = !(key === "user_id" || key.startsWith("среднее"));
                  if(td.contentEditable === "false" && key!="user_id"){
                    td.classList.add("blockedFields");
                  }
                  const fieldMappings = {
                    'user_id': newUserId,
                    'name': 'Имя',
                    'password': '11111',
                    'surname': 'Фамилия',
                    'role': 'Роль',
                    'fathername': 'Отчество'
                  };
                  
                  if (fieldMappings[key]) {
                    td.textContent = fieldMappings[key];
                  } else if (key.includes("среднее")) {
                    td.textContent = "";
                  } else {
                    td.textContent = "нет";
                  }
                 
                  if (td.contentEditable === "true") {
                    td.addEventListener("blur", function () {
                      const updatedData = {
                        user_id: data.userId,
                        field: key,
                        value: td.textContent.trim()
                      };
      
                      fetch("/table-update-user", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedData)
                      })
                      .then((response) => response.json())
                      .then((result) => {
                        if (!result.success) {
                          console.error("Ошибка при обновлении данных");
                        }
                      })
                      .catch((error) => console.error("Ошибка:", error));
                    });
                  }

                  newRow.appendChild(td);
                });
                readHeaders.forEach((header, index) => {
                  const td = document.createElement("td");
                  td.classList.add("blockedFields");
                  newRow.appendChild(td);
                });
                const deleteTd = document.createElement("td");
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Удалить";
                deleteButton.classList.add("delete-btn");
                
                deleteButton.addEventListener("click", function () {
                  showConfirmModal(`Вы уверены, что хотите удалить запись ${newUserId}?`, () => {
                    fetch("/table-delete-user", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ user_id: data.userId })
                    })
                      .then((response) => response.json())
                      .then((result) => {
                        if (result.success) {
                          newRow.remove();
                          showModal("Запись удалена", true);
                        } else {
                          showModal("Ошибка при удалении записи", false);
                        }
                      })
                      .catch((error) => console.error("Ошибка:", error));
                  });
                });
        
                deleteTd.appendChild(deleteButton);
                newRow.appendChild(deleteTd);

                tbody.appendChild(newRow);
              };
            });
          });
      document.querySelector(".delete-all").addEventListener("click", function () {
        showConfirmModal("Вы уверены, что хотите удалить всех пользователей, кроме пользователя с ID = 1?", () => {
        fetch("/delete-all-users-except-1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ excludeId: 1 })
        })
          .then((response) => response.json())
          .then((result) => {
            if (result.success) {
              showModal("Все пользователи, кроме ID = 1, были удалены.", true, () => location.reload());
            } else {
              showModal("Ошибка при удалении пользователей", false);
            }
          })
          .catch((error) => console.error("Ошибка:", error));
      });
      });     
    }
});
const backgroundImage = preloadBackgroundImage("/Projectresources/Skypicture.jpg");
Promise.all([tabldata, fetchProfilePicture, backgroundImage])
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
.catch((error) => {
console.error("Ошибка проверки авторизации:", error);
window.location.href = "/Enteringpage/html/entering.html";
});
// Обработчик для перехода в личный кабинет (по аватарке)
document.querySelector(".userlogo").addEventListener("click", () => {
window.location.href = '/Administrator/Personalaccount/html/paccount.html';
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