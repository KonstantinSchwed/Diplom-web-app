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
        function showConfirmationModal(message, onConfirm, clickedElement) {
            const overlay = document.getElementById("confirmation-modal-overlay");
            const modalText = document.getElementById("confirmation-modal-text");
            const confirmButton = document.getElementById("confirm-yes-yes");
            const cancelButton = document.getElementById("cancel-yes");
            const closeButton = document.getElementById("close-confirmation-modal");


            modalText.textContent = message;


            overlay.style.display = "flex";
            setTimeout(() => overlay.classList.add("show"), 10);


            confirmButton.onclick = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.style.display = "none", 200);
                onConfirm(clickedElement); 
            };

            cancelButton.onclick = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.style.display = "none", 200);
            };


            closeButton.onclick = () => {
                overlay.classList.remove("show");
                setTimeout(() => overlay.style.display = "none", 200);
            };


            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove("show");
                    setTimeout(() => overlay.style.display = "none", 200);
                }
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
    function formatDateForMySQL(date) {
        const pad = num => num.toString().padStart(2, '0');
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1); 
        const day = pad(date.getDate());
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    let flagvis = false;

    function timeExpired(clickedElement) {
        console.log(
            window.userName,
            window.userSurname,
            window.fatherName,
            window.averageScore,
            window.timeReset
        );
    
        let newTime;
        if (window.timeReset) {
            const [hours, minutes, seconds] = window.timeReset.split(":").map(Number);
            const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
            newTime = new Date(Date.now() + totalMilliseconds);
        } else {
            newTime = new Date(Date.now());
        }
    
        const formattedNewTime = formatDateForMySQL(newTime);
        console.log("Отформатированное newTime:", formattedNewTime);
    
        const averageScore = (window.averageScore !== null && window.averageScore !== undefined)
            ? window.averageScore : 0;
    
        fetch('/save-user-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: window.userName,
                userSurname: window.userSurname,
                fatherName: window.fatherName,
                averageScore: averageScore,
                idtest: window.idtest,
                newTime: formattedNewTime
            }),
            keepalive: true
        })
        .then(response => response.json())
        .then(data => {
            console.log("Результат сохранения:", data);
            console.log(flagvis);
            if (flagvis) {
                return fetch('/delete-user-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userName: window.userName,
                        userSurname: window.userSurname,
                        fatherName: window.fatherName
                    })
                })
                .then(() => console.log('Пользователь удалён'));
            }
        })
        .then(() => {
            if (clickedElement === 'buttonback') {
                window.location.href = '/User/Usermainmenu/html/umainmenu.html';
            } else if (
                clickedElement === 'buttonback2' ||
                clickedElement === 'endtimetest' ||
                clickedElement === 'endtest' ||
                clickedElement === 'visibility'
            ) {
                window.location.href = '/User/Teststart/html/tstart.html';
            } else if (clickedElement === 'userlogo') {
                window.location.href = '/User/Userpersonalaccount/html/uaccount.html';
            }
        })
        .catch(error => console.error("Ошибка при сохранении или удалении пользователя:", error));
    }
        let wasPersisted = false;

        window.addEventListener('pageshow', function (event) {
            document.body.style.visibility = 'hidden';
            wasPersisted = event.persisted;

            if (wasPersisted) {
                window.location.href = '/User/Teststart/html/tstart.html';
            }
        });

window.addEventListener("beforeunload", () => {
  if (!wasPersisted) {
    timeExpired();
  }
});

document.addEventListener("visibilitychange", function(){
    if(document.hidden){
        if (flagvis) {
        fetch('/delete-user-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: window.userName,
                userSurname: window.userSurname,
                fatherName: window.fatherName
            }), 
            keepalive: true
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка при удалении пользователя');
            }
            console.log('Пользователь удалён');
            window.location.href = '/User/Teststart/html/tstart.html';
        })
        .catch(error => {
            console.error('Ошибка при удалении пользователя:', error);
            window.location.href = '/User/Teststart/html/tstart.html';
        });
       }
    }
});
        
    document.addEventListener('DOMContentLoaded', () => {
        const nav2 = performance.getEntriesByType('navigation')[0];  
        if (nav2.type === 'reload') {
            console.log('Это перезагрузка страницы!');
            document.body.style.display = 'none';
            window.userName = window.userName || sessionStorage.getItem('userName');
            window.userSurname = window.userSurname || sessionStorage.getItem('userSurname');
            window.fatherName = window.fatherName || sessionStorage.getItem('fatherName');
            fetch('/delete-user-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userName: window.userName,
                    userSurname: window.userSurname,
                    fatherName: window.fatherName
                }), 
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Ошибка при удалении пользователя');
                }
                console.log('Пользователь удалён');
                window.location.href = '/User/Teststart/html/tstart.html';
            })
            .catch(error => {
                console.error('Ошибка при удалении пользователя:', error);
                window.location.href = '/User/Teststart/html/tstart.html';
            });
        } 
        const preloader = document.getElementById('preloader');
        setTimeout(() => {
        preloader.classList.add('show'); 
        }, 2000); 
        const fakeButton = document.createElement('button');
        fakeButton.style.display = 'none'; 
        fakeButton.classList.add('endtimetest');
        document.body.appendChild(fakeButton);
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
                    window.userName = data.userName;
                    window.userSurname = data.userSurname;
                    window.fatherName = data.fatherName;
                    sessionStorage.setItem('userName', window.userName);
                    sessionStorage.setItem('userSurname', window.userSurname);
                    sessionStorage.setItem('fatherName', window.fatherName);
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
                    const dres = fetch('/get-date-reset', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userName: window.userName,
                            userSurname: window.userSurname,
                            fatherName: window.fatherName,
                            idtest: testData.idtest
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            const now = new Date();
                            const currentTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
                            console.log("Дата сброса:", new Date(data.dateReset));
                            console.log("Текущее время:", currentTime);
                    
                            if (new Date(data.dateReset) > currentTime) {
                                window.location.href = '/User/Teststart/html/tstart.html';
                            } else {
                                fetch('/check-user-test', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        userName: window.userName,
                                        userSurname: window.userSurname,
                                        fatherName: window.fatherName
                                    })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (!data.created) {
                                        console.warn("Пользователь уже существует. Перенаправление...");
                                        window.location.href = '/User/Teststart/html/tstart.html';
                                    } else {
                                        console.log("Пользователь добавлен успешно");
                                        flagvis = true;
                                    }
                                })
                                .catch(err => {
                                    console.error("Ошибка при check-user-test:", err);
                                });
                            }
                        } else {
                            console.error("Ошибка:", data.error);
                        }
                    })
                    .catch(error => console.error("Ошибка при получении DateReset:", error));
                    window.idtest = testData.idtest;
                    const today = new Date();
                    console.log(today);  
                    document.querySelectorAll('.text1span').forEach(span => {
                        span.textContent = sectionData.name;
                    });
                    const gettime = fetch('/get-time-testnew', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sectionId: data.sectionId, }) 
                        })
                        .then(response => response.json())
                        .then(responseData => {
                            if (!responseData.success) {
                                console.error("Ошибка при получении времени");
                                return;
                            }
                            const reset = responseData.timeReset;
                            console.log(reset);
                            console.log(responseData.time);
                            window.timeReset = reset;
                            let timeToDisplay = responseData.time;
                            console.log(timeToDisplay);

                            if (timeToDisplay === '00:00:00' || timeToDisplay === null) {
                                document.querySelector('.ttest').textContent = "Неограничено";
                                return;
                            }

      
                            let [hours, minutes, seconds] = timeToDisplay.split(':').map(num => parseInt(num, 10));
      
                            function declension(num, one, few, many) {
                                if (num % 10 === 1 && num % 100 !== 11) return `${num} ${one}`;
                                if (num % 10 >= 2 && num % 10 <= 4 && (num % 100 < 10 || num % 100 >= 20)) return `${num} ${few}`;
                                return `${num} ${many}`;
                            }
       
                            function updateTimer() {
                                if (hours === 0 && minutes === 0 && seconds === 1) {
                                    clearInterval(timerInterval);
                                    document.querySelector('.ttest').textContent = "Время вышло!";
                                        setTimeout(() => {
                                            fakeButton.click();
                                    }, 100);  
                                    return;
                                }

                                if (seconds === 0) {
                                    if (minutes === 0) {
                                        hours--;
                                        minutes = 59;
                                    } else {
                                        minutes--;
                                    }
                                    seconds = 59;
                                } else {
                                    seconds--;
                                }

                                let displayText = [];
                                if (hours > 0) displayText.push(declension(hours, "час", "часа", "часов"));
                                if (minutes > 0) displayText.push(declension(minutes, "минута", "минуты", "минут"));
                                if (seconds > 0 || (hours === 0 && minutes === 0)) displayText.push(declension(seconds, "секунда", "секунды", "секунд"));

                                document.querySelector('.ttest').textContent = displayText.join(' ');
                            }

                            updateTimer();
                            let timerInterval = setInterval(updateTimer, 1000);
                        })
                        .catch(error => console.error("Ошибка при запросе времени:", error));
                        const correctAnswersCache = {};
                        const getquests = fetch('/get-questionstoanswer', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ testId: testData.idtest }) 
                        })
                        .then(response => response.json())
                        .then(questions => {
                            const testContainer = document.querySelector('.overtestcontainer'); 
                            testContainer.innerHTML = ''; 

                            questions.forEach(question => {
                                const questionBlock = document.createElement('div');
                                questionBlock.classList.add('testcontainer');
                                questionBlock.dataset.questionId = question.idquestion; 
                                questionBlock.innerHTML = `
                                    <div class="testblock">
                                        <div class="plustestdelete">
                                            <div class="upptestblock">
                                                <div class="lefttestadd">
                                                    <p class="questname">${question.text}</p>
                                                </div>
                                                <div class="righttestadd">
                                                    <p class="questpoints">Баллы за вопрос: <span class="questpointsspan">${question.points}</span></p>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="answers-container"></div> <!-- Контейнер для вариантов ответа -->
                                    </div>
                                `;
                                testContainer.appendChild(questionBlock);
                                fetch('/get-answerstoanswer', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ questionId: question.idquestion })
                                })
                                .then(response => response.json())
                                .then(({ answers, correctAnswers }) => { 
                                    const answersContainer = questionBlock.querySelector('.answers-container');

                                    let isMultipleChoice = answers.filter(a => a.correct_value === 1).length > 1;
                                    answers.forEach(answer => {
                                        const answerBlock = document.createElement('div');
                                        answerBlock.classList.add('plusanswerdelete');
                                        answerBlock.innerHTML = `
                                            <div class="answerblock">
                                                <div class="answblockadd">
                                                    <p class="answertext">${answer.answer_text}</p>
                                                    <input type="${isMultipleChoice ? 'checkbox' : 'radio'}" name="question_${question.idquestion}" value="${answer.is_correct}">
                                                </div>
                                            </div>
                                        `;
                                        answersContainer.appendChild(answerBlock);
                                    });
                                    correctAnswersCache[question.idquestion] = correctAnswers;
                                    questionBlock.dataset.points = question.points; 
                                });

                                        });


                        })
                        .catch(error => console.error('Ошибка при загрузке вопросов:', error));
                    document.querySelectorAll('.endtest, .buttonback, .buttonback2, .userlogo, .endtimetest').forEach(element => {
                element.addEventListener('click', (event) => {
                    const target = event.currentTarget;
                    let clickedElement = '';
                    let skipConfirm = false;

                    if (target.classList.contains('endtest')) {
                        clickedElement = 'endtest';
                    } else if (target.classList.contains('buttonback')) {
                        clickedElement = 'buttonback';
                    } else if (target.classList.contains('buttonback2')) {
                        clickedElement = 'buttonback2';
                    } else if (target.classList.contains('userlogo')) {
                        clickedElement = 'userlogo';
                    } else if (target.classList.contains('endtimetest')) {
                        clickedElement = 'endtimetest';
                        skipConfirm = true;
                    }
                    const proceedWithSubmission = (clickedElement) => {
                        let userAnswers = [];
                        document.querySelectorAll('.testcontainer').forEach(questionBlock => {
                            let selectedAnswers = questionBlock.querySelectorAll('input:checked');
                            let questionId = questionBlock.dataset.questionId;
                            let questionPoints = parseInt(questionBlock.dataset.points);

                            selectedAnswers.forEach(answer => {
                                userAnswers.push({
                                    questionId: questionId,
                                    answerId: answer.value,
                                    points: questionPoints
                                });
                            });
                        });
                        fetch('/delete-user-test', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                userName: window.userName,
                                userSurname: window.userSurname,
                                fatherName: window.fatherName
                            })
                        })
                        .then(() => {
                            console.log('Пользователь удалён');
                        })
                        .catch(error => console.error("Ошибка при удалении пользователя:", error));
                        fetch('/submit-answers', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                answers: userAnswers,
                                testId: testData.idtest,
                                correctAnswersCache: correctAnswersCache
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            const totalQuestions = document.querySelectorAll('.overtestcontainer .testcontainer').length;
                            const averageScore = totalQuestions > 0 ? Math.ceil(data.totalPoints / totalQuestions) : 0;
                            window.averageScore = averageScore;

                            timeExpired(clickedElement); 
                        })
                        .catch(error => console.error('Ошибка при отправке ответов:', error));
                    };
                    if (!skipConfirm) {
                        showConfirmationModal("Вы действительно хотите выйти?", () => proceedWithSubmission(clickedElement), clickedElement);
                    } else {
                        proceedWithSubmission(clickedElement); 
                    }
                });
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
                                Promise.all([fetchProfilePicture, backgroundImage, getquests, gettime, dres])
                                .then(() => {
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