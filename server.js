const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const http = require('http');
const WebSocket = require('ws');
dotenv.config();
const app = express();
const port = 3000;
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static('node_modules'));
app.use(express.json());
app.use(cookieParser());
const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';
const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'users3',
    timezone: 'Z',
    multipleStatements: true
});
connection.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err);
    } else {
        console.log('Подключение к базе данных успешно');
    }
});
app.get('/', (req, res) => {
    res.redirect('/Enteringpage/html/entering.html');
});
// Авторизация
const bcrypt = require('bcrypt');
app.post('/login', (req, res) => {
    const { fullName, password } = req.body;
    if (fullName === 'Администратор Администратор' && password === '123456789000') {
        connection.query('SELECT * FROM allusers WHERE ID = 1', (err, results) => {
            if (err) return res.status(500).json({ error: 'Ошибка сервера' });

            if (results.length === 0) {
                return res.status(401).json({ error: 'Администратор не найден!' });
            }

            const { Name, Surname, Fathername, Sex, Birth, Role } = results[0];
            const userData = {
                role: 'admin',
                userName: Name,
                userSurname: Surname,
                fatherName: Fathername,
                sex: Sex,
                birthDate: Birth,
                roleMain: Role,
            };

            const token = jwt.sign(userData, SECRET_KEY);
            res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'Strict' });

            return res.json(userData);
        });
        return;
    }

    // Валидация имени (только буквы и пробел)
    const nameRegex = /^[А-ЯЁа-яёA-Za-z]+ [А-ЯЁа-яёA-Za-z]+( [А-ЯЁа-яёA-Za-z]+)?$/;
    if (!nameRegex.test(fullName)) {
        return res.status(400).json({ error: 'Некорректный ввод. Используйте только буквы и пробел.' });
    }

    const [surname, name, fathername] = fullName.split(' ');
    const isFathernameNull = fathername === undefined;
    const fathernameValue = isFathernameNull ? null : fathername;
    connection.query(`SELECT * FROM allusers WHERE surname = ? AND name = ? ${isFathernameNull ? 'AND Fathername IS NULL' : 'AND Fathername = ?'}`, [surname, name, fathernameValue], (err, results) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });

        if (results.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль!' });
        }

        const storedPassword = results[0].Password;

        if (storedPassword.length === 60) {
            bcrypt.compare(password, storedPassword, (err, isMatch) => {
                if (err) {
                    console.error('Ошибка при сравнении пароля:', err);
                    return res.status(500).json({ error: 'Ошибка при проверке пароля' });
                }

                if (!isMatch) {
                    return res.status(401).json({ error: 'Неверный логин или пароль!' });
                }

                const { Name, Surname, Fathername, Sex, Birth, Role } = results[0];
                const roleToSend = Role === 'admin' ? 'admin' : 'user';

                const userData = {
                    role: roleToSend,
                    userName: Name,
                    userSurname: Surname,
                    fatherName: Fathername,
                    sex: Sex,
                    birthDate: Birth,
                    roleMain: Role,
                };

                const token = jwt.sign(userData, SECRET_KEY);
                res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'Strict' });

                res.json(userData);
            });
        } else {
            if (storedPassword === password) {
                const { Name, Surname, Fathername, Sex, Birth, Role } = results[0];
                const roleToSend = Role === 'admin' ? 'admin' : 'user';

                const userData = {
                    role: roleToSend,
                    userName: Name,
                    userSurname: Surname,
                    fatherName: Fathername,
                    sex: Sex,
                    birthDate: Birth,
                    roleMain: Role,
                };

                const token = jwt.sign(userData, SECRET_KEY);
                res.cookie('authToken', token, { httpOnly: true, secure: false, sameSite: 'Strict' });

                res.json(userData);
            } else {
                return res.status(401).json({ error: 'Неверный логин или пароль!' });
            }
        }
    });
});
app.get('/check-auth', (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.json({
            role: null,
            userName: null,
            userSurname: null,
            fatherName: null,
            sex: null,
            birthDate: null,
            roleMain: null,
            programId: null,
            moduleId: null,  // Добавляем moduleId
            sectionId: null  // Добавляем sectionId
        });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.json({
                role: null,
                userName: null,
                userSurname: null,
                fatherName: null,
                sex: null,
                birthDate: null,
                roleMain: null,
                programId: null,
                moduleId: null,  // Добавляем moduleId
                sectionId: null  // Добавляем sectionId
            });
        }

        // Добавляем вывод в консоль для отладки
        console.log('Decoded token:', decoded); // Выводим весь декодированный токен
        console.log('Program ID:', decoded.programId); // Выводим только programId
        console.log('Module ID:', decoded.moduleId); // Выводим только moduleId
        console.log('Section ID:', decoded.sectionId); // Выводим только sectionId

        // Отправляем все данные, которые есть в токене, включая moduleId и sectionId
        res.json({
            role: decoded.role,
            userName: decoded.userName,
            userSurname: decoded.userSurname,
            fatherName: decoded.fatherName,
            sex: decoded.sex,
            birthDate: decoded.birthDate,
            roleMain: decoded.roleMain,
            programId: decoded.programId || null,  // Возвращаем programId, если он есть
            moduleId: decoded.moduleId || null,    // Возвращаем moduleId, если он есть
            sectionId: decoded.sectionId || null   // Возвращаем sectionId, если он есть
        });
    });
});
app.post('/get-allowed', (req, res) => {
    const { userName, userSurname, fatherName, programId } = req.body;

    console.log('Получены данные:', req.body); // Логируем весь body

  // Проверка на наличие обязательных данных
  if (!userName || !userSurname || !programId) {
    return res.status(400).json({ allowed: false, message: 'Некорректные данные' });
}

    console.log(userName, userSurname, fatherName, programId);

    // Находим ID пользователя в таблице allusers
    const getUserIdQuery = `SELECT ID FROM allusers WHERE name = ? AND surname = ? AND (Fathername = ? OR Fathername IS NULL)`;

    connection.query(getUserIdQuery, [userName, userSurname, fatherName], (err, userResult) => {
        if (err) {
            console.error('Ошибка при поиске пользователя:', err);
            return res.status(500).json({ allowed: false, message: 'Ошибка сервера' });
        }

        if (userResult.length === 0) {
            return res.status(404).json({ allowed: false, message: 'Пользователь не найден' });
        }
        const userId = userResult[0].ID;
        console.log(userResult);
        console.log(userId, programId);
        // Проверяем, есть ли запись в user_program для данного пользователя и программы
        const checkAccessQuery = `SELECT iduser_program FROM user_program WHERE IDusers = ? AND programid = ?`;

        connection.query(checkAccessQuery, [userId, programId], (err, accessResult) => {
            if (err) {
                console.error('Ошибка при проверке доступа:', err);
                return res.status(500).json({ allowed: false, message: 'Ошибка сервера' });
            }

            if (accessResult.length > 0) {
                res.json({ allowed: true });
            } else {
                res.json({ allowed: false, message: 'Нет доступа к программе' });
            }
        });
    });
});
// Новый маршрут для загрузки изображения пользователя
app.post('/get-profile-picture', (req, res) => {
    const { role, userName, userSurname, fatherName, sex } = req.body;
    console.log(role, userName, userSurname, fatherName, sex);
    // Строим запрос на поиск изображения и мини-изображения по данным пользователя
    connection.query(
        'SELECT Picture, Minipicture FROM allusers WHERE surname = ? AND name = ? AND (fatherName IS NULL OR fatherName = ?) AND (sex IS NULL OR sex= ?)',
        [userSurname, userName, fatherName, sex], 
        (err, results) => {
            console.log(results);
            if (err) {
                return res.status(500).json({ error: 'Ошибка сервера' });
            }

            if (results.length === 0 || !results[0].Picture) {
                return res.status(404).json({ error: 'Изображение не найдено' });
            }

            // Извлекаем оба изображения (BLOB)
            const picture = results[0].Picture;
            const miniPicture = results[0].Minipicture;
            console.log(picture, miniPicture);

            // Преобразуем BLOB в строку Base64 для обоих изображений
            const base64Image = picture.toString('base64');
            const base64MiniImage = miniPicture.toString('base64');

            // Отправляем изображения как строки Base64
            res.json({ 
                picture: `data:image/png;base64,${base64Image}`,
                miniPicture: `data:image/png;base64,${base64MiniImage}`
            });
        }
    );
});
app.post('/update-profile', (req, res) => {
    const { surname, name, fathername, sex, birthDate } = req.body;
    // Регулярное выражение: только буквы, одно слово
    const nameRegex = /^[A-Za-zА-Яа-яЁё]+$/;

    if (!nameRegex.test(surname) || !nameRegex.test(name) || (fathername && !nameRegex.test(fathername))) {
        return res.status(400).json({ error: 'Некорректные данные: только одно слово, без цифр и символов' });
    }

    // Получаем токен из cookies
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        // Извлекаем старые данные из токена
        const userSurname = decoded.userSurname;
        const userName = decoded.userName;
        const userFathername = decoded.fatherName;

        // Логирование данных перед запросом
        console.log('Обновление профиля для:', userSurname, userName, userFathername);

        // Формируем запрос для обновления данных
        const query = `
            UPDATE allusers
            SET Surname = ?, Name = ?, Fathername = ?, Sex = ?, Birth = ?
            WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)
        `;

        // Выполняем запрос для обновления данных
        connection.query(query, [surname, name, fathername, sex, birthDate, userSurname, userName, userFathername], (err, results) => {
            if (err) {
                console.error('Ошибка обновления данных:', err);
                return res.status(500).json({ error: 'Ошибка обновления данных' });
            }

            if (results.affectedRows === 0) {
                return res.status(400).json({ error: 'Пользователь не найден или нет изменений' });
            }

            console.log('Данные успешно обновлены:', results);

            // Создаем новый токен с обновленными данными
            const updatedUserData = {
                role: decoded.role,
                userName: name,  // Используем новое имя
                userSurname: surname,  // Используем новую фамилию
                fatherName: fathername,  // Используем новое отчество
                sex: sex,  // Новый пол
                birthDate: birthDate,  // Новая дата рождения
                roleMain: decoded.roleMain,
                programId: decoded.programId || null,  // Возвращаем programId, если он есть
                moduleId: decoded.moduleId || null,    // Возвращаем moduleId, если он есть
                sectionId: decoded.sectionId || null   // Возвращаем sectionId, если он есть
            };

            // Создаём новый токен (без срока действия)
            const newToken = jwt.sign(updatedUserData, SECRET_KEY);

            // Обновляем JWT в HttpOnly cookie
            res.cookie('authToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' });

            // Отправляем успех
            res.json({ success: true });
        });
    });
});
app.post('/update-userprofile', (req, res) => {
    const {sex, birthDate } = req.body;

    // Получаем токен из cookies
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        // Извлекаем старые данные из токена
        const userSurname = decoded.userSurname;
        const userName = decoded.userName;
        const userFathername = decoded.fatherName;

        // Логирование данных перед запросом
        console.log('Обновление профиля для:', userSurname, userName, userFathername);

        // Формируем запрос для обновления данных
        const query = `
            UPDATE allusers
            SET  Sex = ?, Birth = ?
            WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)
        `;

        // Выполняем запрос для обновления данных
        connection.query(query, [sex, birthDate, userSurname, userName, userFathername], (err, results) => {
            if (err) {
                console.error('Ошибка обновления данных:', err);
                return res.status(500).json({ error: 'Ошибка обновления данных' });
            }

            if (results.affectedRows === 0) {
                return res.status(400).json({ error: 'Пользователь не найден или нет изменений' });
            }

            console.log('Данные успешно обновлены:', results);

            // Создаем новый токен с обновленными данными
            const updatedUserData = {
                role: decoded.role,
                userName: decoded.userName,  // Используем новое имя
                userSurname: decoded.userSurname,  
                fatherName: decoded.fatherName,  
                sex: sex,  // Новый пол
                birthDate: birthDate,  // Новая дата рождения
                roleMain: decoded.roleMain,
                programId: decoded.programId || null,  // Возвращаем programId, если он есть
                moduleId: decoded.moduleId || null,    // Возвращаем moduleId, если он есть
                sectionId: decoded.sectionId || null   // Возвращаем sectionId, если он есть
            };

            // Создаём новый токен (без срока действия)
            const newToken = jwt.sign(updatedUserData, SECRET_KEY);

            // Обновляем JWT в HttpOnly cookie
            res.cookie('authToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' });

            // Отправляем успех
            res.json({ success: true });
        });
    });
});


app.post('/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        const { userSurname, userName, fatherName } = decoded;

        // Проверяем текущий пароль в базе данных
        connection.query(
            'SELECT Password FROM allusers WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)',
            [userSurname, userName, fatherName],
            (err, results) => {
                if (err || results.length === 0) {
                    return res.status(500).json({ error: 'Ошибка проверки пароля' });
                }

                const storedPassword = results[0].Password;

                // Проверяем, хеширован ли текущий пароль в базе данных
                if (storedPassword.length === 60) {
                    // Пароль хеширован, используем bcrypt для сравнения
                    bcrypt.compare(currentPassword, storedPassword, (err, isMatch) => {
                        if (err) {
                            return res.status(500).json({ error: 'Ошибка при проверке пароля' });
                        }

                        if (!isMatch) {
                            return res.status(401).json({ success: false, error: 'Неверный текущий пароль' });
                        }

                        // Хэшируем новый пароль и обновляем в базе данных
                        bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
                            if (err) {
                                return res.status(500).json({ error: 'Ошибка хеширования нового пароля' });
                            }

                            // Обновляем пароль в базе данных
                            connection.query(
                                'UPDATE allusers SET Password = ? WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)',
                                [hashedNewPassword, userSurname, userName, fatherName],
                                (err, updateResults) => {
                                    if (err) {
                                        return res.status(500).json({ error: 'Ошибка обновления пароля' });
                                    }

                                    res.json({ success: true });
                                }
                            );
                        });
                    });
                } else {
                    // Пароль не хеширован, сравниваем строки
                    if (storedPassword !== currentPassword) {
                        return res.status(401).json({ success: false, error: 'Неверный текущий пароль' });
                    }
                    // Хэшируем новый пароль и обновляем в базе данных
                    bcrypt.hash(newPassword, 10, (err, hashedNewPassword) => {
                        if (err) {
                            return res.status(500).json({ error: 'Ошибка хеширования нового пароля' });
                        }
                        // Обновляем пароль в базе данных
                        connection.query(
                            'UPDATE allusers SET Password = ? WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)',
                            [hashedNewPassword, userSurname, userName, fatherName],
                            (err, updateResults) => {
                                if (err) {
                                    console.error('Ошибка при обновлении пароля:', err);  // Логируем подробности ошибки
                                    return res.status(500).json({ error: 'Ошибка обновления пароля' });
                                }
                        
                                if (updateResults.affectedRows === 0) {
                                    console.log('Пароль не был обновлён, возможно, пользователь не найден');
                                    return res.status(404).json({ error: 'Пользователь не найден' });
                                }
                        
                                res.json({ success: true });
                            }
                        );
                    });
                }
            }
        );
    });
});
// Сброс пароля на исходный (не хэшированный)
app.post('/reset-original-password', (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        const { userSurname, userName, fatherName, role } = decoded;
        let originalPassword = '';
        if (role === 'admin'){
            originalPassword = '12345';
        }
        if (role === 'user'){
            originalPassword = '11111';
        }
        // Новый пароль


        // Обновляем пароль в базе данных (без хэширования)
        connection.query(
            'UPDATE allusers SET Password = ? WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)',
            [originalPassword, userSurname, userName, fatherName],
            (err, updateResults) => {
                if (err) {
                    console.error('Ошибка при сбросе пароля:', err);
                    return res.status(500).json({ error: 'Ошибка сброса пароля' });
                }

                if (updateResults.affectedRows === 0) {
                    return res.status(404).json({ error: 'Пользователь не найден' });
                }

                res.json({ success: true });
            }
        );
    });
});

// Настройка multer для загрузки изображений
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
    { name: 'picture' }, 
    { name: 'minipicture' },
    { name: 'file' } // Добавляем поддержку загрузки файла Word
]);
// Маршрут для загрузки изображений профиля
app.post('/upload-profile-image', upload, (req, res) => {
    const { picture, minipicture } = req.files;

    if (!picture && !minipicture) {
        return res.status(400).json({ error: 'Не загружены изображения' });
    }
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        const userSurname = decoded.userSurname;
        const userName = decoded.userName;
        const userFathername = decoded.fatherName;

        const pictureBlob = picture ? picture[0].buffer : null;
        const minipictureBlob = minipicture ? minipicture[0].buffer : null;

        const query = `
            UPDATE allusers
            SET Picture = ?, Minipicture = ?
            WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)
        `;

        connection.query(query, [pictureBlob, minipictureBlob, userSurname, userName, userFathername], (err, results) => {
            if (err) {
                console.error('Ошибка обновления изображений:', err);
                return res.status(500).json({ success: false, message: 'Ошибка обновления изображений' });
            }
        
            if (results.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Пользователь не найден или нет изменений' });
            }
        
            res.json({ success: true, message: 'Изображения успешно обновлены' });
        });
    });
});
app.post('/delete-profile-image', (req, res) => {
    const token = req.cookies.authToken;

    if (!token) {
        return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Неверный токен' });
        }

        const userSurname = decoded.userSurname;
        const userName = decoded.userName;
        const userFathername = decoded.fatherName;

        const query = `
            UPDATE allusers
            SET Picture = NULL, Minipicture = NULL
            WHERE Surname = ? AND Name = ? AND (Fathername = ? OR Fathername IS NULL)
        `;

        connection.query(query, [userSurname, userName, userFathername], (err, results) => {
            if (err) {
                console.error('Ошибка удаления изображений:', err);
                return res.status(500).json({ success: false, message: 'Ошибка удаления изображений' });
            }

            if (results.affectedRows === 0) {
                return res.status(400).json({ success: false, message: 'Пользователь не найден или изображения уже удалены' });
            }

            res.json({ success: true, message: 'Изображения успешно удалены' });
        });
    });
});

app.post('/get-admin-programs', (req, res) => {
    const { userName, userSurname, fatherName } = req.body;

    const sql = `
        SELECT p.name AS ProgramName
        FROM allusers au
        JOIN user_program up ON au.ID = up.IDUsers
        JOIN program p ON up.programid = p.idprogram
        WHERE au.Name = ? AND au.Surname = ? AND (au.fatherName IS NULL OR au.fatherName = ?) 
    `;

    connection.query(sql, [userName, userSurname, fatherName], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        const programs = results.map(row => row.ProgramName);
        res.json({ programs });
    });
});



app.post('/get-user-programs', (req, res) => {
    const { userName, userSurname, fatherName } = req.body;
    const sql = `
    SELECT 
        p.name AS ProgramName,
        CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM user_program up
                JOIN allusers au ON up.IDUsers = au.ID
                WHERE up.programid = p.idprogram
                  AND au.Name = ?
                  AND au.Surname = ?
                  AND (au.fatherName IS NULL OR au.fatherName = ?) 
            ) THEN 1
            ELSE 0
        END AS isAvailable
    FROM program p
`;
    connection.query(sql, [userName, userSurname, fatherName], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        const programs = results.map(row => ({
            name: row.ProgramName,
            isAvailable: row.isAvailable === 1
        }));
        res.json({ programs });
    });
});

app.post('/add-program', (req, res) => {
    const { programName, userName, userSurname, fatherName } = req.body;

    // Сначала проверяем, существует ли программа с таким названием
    const checkProgramQuery = 'SELECT * FROM program WHERE name = ?';

    connection.query(checkProgramQuery, [programName], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Ошибка проверки существования программы' });
        }

        if (results.length > 0) {
            // Если программа с таким названием уже существует
            return res.status(400).json({ success: false, message: 'Программа с таким названием уже существует' });
        }

        // Если программа не существует, добавляем новую программу
        const insertProgramQuery = 'INSERT INTO program (name) VALUES (?)';

        connection.query(insertProgramQuery, [programName], (err, programResult) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Ошибка добавления программы' });
            }

            const newProgramId = programResult.insertId;

            // Теперь находим ID пользователя
            const getUserIdQuery = `
                SELECT ID FROM allusers 
                WHERE Name = ? AND Surname = ? AND (Fathername = ? OR Fathername IS NULL)
            `;

            connection.query(getUserIdQuery, [userName, userSurname, fatherName], (err, userResults) => {
                if (err || userResults.length === 0) {
                    console.error(err || 'Пользователь не найден');
                    return res.status(500).json({ success: false, message: 'Пользователь не найден' });
                }

                const userId = userResults[0].ID;

                // Добавляем связь в user_program
                const insertUserProgramQuery = `
                    INSERT INTO user_program (IDUsers, programid) VALUES (?, ?)
                `;

                connection.query(insertUserProgramQuery, [userId, newProgramId], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ success: false, message: 'Ошибка добавления в user_program' });
                    }

                    res.json({ success: true });
                });
            });
        });
    });
});
app.post('/update-program-name', (req, res) => {
    const { oldProgramName, newProgramName } = req.body;

    // Здесь выполняем запрос к базе данных для обновления названия программы
    const query = 'UPDATE program SET name = ? WHERE name = ?';
    
    connection.query(query, [newProgramName, oldProgramName], (err, result) => {
        if (err) {
            console.error('Ошибка при обновлении программы:', err);
            return res.json({ success: false, message: 'Ошибка при обновлении программы.' });
        }

        if (result.affectedRows > 0) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false, message: 'Программа с таким названием не найдена.' });
        }
    });
});
app.post('/delete-program', (req, res) => {
    const token = req.cookies.authToken;  // Получаем токен из cookies
    const { programName } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Ошибка проверки токена' });
        }

        // Сначала находим программу по имени
        const getProgramIdQuery = 'SELECT idprogram FROM program WHERE name = ?';

        connection.query(getProgramIdQuery, [programName], (err, programResults) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: 'Ошибка поиска программы' });
            }

            if (programResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Программа не найдена' });
            }

            const programId = programResults[0].idprogram;
            const deleteProgramQuery = 'DELETE FROM program WHERE idprogram = ?';

            // Удаляем программу
            connection.query(deleteProgramQuery, [programId], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ success: false, message: 'Ошибка удаления программы' });
                }

                // Если programId из токена совпадает с удаляемой программой, обнуляем programId в токене
                if (decoded.programId === programId) {
                    const newToken = jwt.sign(
                        {
                            ...decoded,
                            programId: null  // Обнуляем programId
                        },
                        SECRET_KEY,
                    );

                    // Обновляем токен в cookies
                    res.cookie('authToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' });
                }

                res.json({ success: true });
            });
        });
    });
});



app.post('/set-current-program', (req, res) => {
    const token = req.cookies.authToken;  // Получаем токен из cookies
    const { programName } = req.body;  // Получаем имя программы из тела запроса

    if (!token) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
    }

    // Проверяем токен и получаем информацию о пользователе
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Ошибка проверки токена' });
        }

        const getProgramIdQuery = 'SELECT idprogram FROM program WHERE name = ?';  // SQL запрос для получения id программы
        connection.query(getProgramIdQuery, [programName], (err, results) => {
            if (err || results.length === 0) {
                console.error(err || 'Программа не найдена');
                return res.status(404).json({ success: false, message: 'Программа не найдена' });
            }

            const programId = results[0].idprogram;  // Извлекаем id программы из результатов запроса

            // Создаем новый токен без срока действия
            const newToken = jwt.sign(
                {
                    ...decoded,  // Сохраняем остальные данные из декодированного токена
                    programId: programId  // Добавляем новый параметр programId
                },
                SECRET_KEY
                // Без expiresIn, токен будет бессрочным
            );
            console.log(programId);
            // Устанавливаем новый токен в cookies
            res.cookie('authToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' });

            // Отправляем успешный ответ
            res.json({ success: true, message: 'Программа выбрана', programId });
        });
    });
});

app.post('/get-program-name', (req, res) => {
    const { programId } = req.body;
    console.log(programId );
    // Проверяем, что programId был передан
    if (!programId) {
        return res.status(400).json({ success: false, message: 'programId не передан' });
    }

    // Запрос к базе данных для получения названия программы по programId
    const query = 'SELECT name FROM program WHERE idprogram = ?';
    connection.query(query, [programId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Ошибка получения данных программы' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Программа не найдена' });
        }

        // Возвращаем название программы
        res.json({ name: results[0].name });
    });
});
app.post('/get-modules', (req, res) => {
    const { programId } = req.body;

    if (!programId) {
        return res.status(400).json({ error: 'Program ID is required' });
    }

    console.log('Получаем модули для программы с ID:', programId);

    // Выводим данные, чтобы убедиться, что мы передаем правильный programId
    console.log('Program ID из запроса:', programId);

    // Запрос для получения модулей
    const query = 'SELECT idmodule, name, moduletime FROM module WHERE progid = ?';

    connection.query(query, [programId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении модулей:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Выводим результаты для отладки
        console.log('Результаты из базы данных:', results);

        // Возвращаем результаты (модули)
        res.json(results);
    });
});
app.post('/get-sections', (req, res) => {
    const { programId, moduleNames } = req.body;

    if (!programId || !Array.isArray(moduleNames) || moduleNames.length === 0) {
        return res.status(400).json({ error: 'Некорректные данные запроса' });
    }

    const placeholders = moduleNames.map(() => '?').join(',');
    const queryModules = `SELECT idmodule FROM module WHERE progid = ? AND name IN (${placeholders})`;
    const queryModulesParams = [programId, ...moduleNames];

    connection.query(queryModules, queryModulesParams, (err, modulesResult) => {
        if (err) {
            console.error('Ошибка при получении id модулей:', err);
            return res.status(500).json({ error: 'Ошибка сервера при получении модулей' });
        }

        if (modulesResult.length === 0) {
            return res.json([]); // Нет модулей — нет разделов
        }

        const moduleIds = modulesResult.map(module => module.idmodule);
        const sectionPlaceholders = moduleIds.map(() => '?').join(',');
        const querySections = `SELECT idsection, moduleid, name, sectiontime FROM section WHERE moduleid IN (${sectionPlaceholders})`;

        connection.query(querySections, moduleIds, (err, sectionsResult) => {
            if (err) {
                console.error('Ошибка при получении разделов:', err);
                return res.status(500).json({ error: 'Ошибка сервера при получении разделов' });
            }

            const sectionsByModule = moduleIds.map(idmodule => ({
                idmodule,
                sections: sectionsResult
                    .filter(section => section.moduleid === idmodule)
                    .map(section => ({
                        idsection: section.idsection,
                        name: section.name,
                        sectiontime: section.sectiontime
                    }))
            }));

            res.json(sectionsByModule);
        });
    });
});
app.post('/add-module', (req, res) => {
    const { programId, name, moduletime } = req.body;
    console.log(programId, name, moduletime);

    if (!programId || !name || !moduletime) {
        return res.status(400).json({ message: 'Недостаточно данных для добавления модуля' });
    }

    // Проверяем, есть ли уже модуль с таким именем в этой программе
    const checkQuery = 'SELECT COUNT(*) AS count FROM module WHERE progid = ? AND name = ?';
    connection.query(checkQuery, [programId, name], (err, results) => {
        if (err) {
            console.error('Ошибка при проверке модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при проверке модуля' });
        }

        if (results[0].count > 0) {
            return res.status(409).json({ message: 'Модуль с таким названием уже существует в этой программе' });
        }

        // Если такого модуля нет, добавляем
        const insertQuery = 'INSERT INTO module (progid, name, moduletime) VALUES (?, ?, ?)';
        connection.query(insertQuery, [programId, name, moduletime], (err, result) => {
            if (err) {
                console.error('Ошибка при добавлении модуля:', err);
                return res.status(500).json({ message: 'Ошибка сервера при добавлении модуля' });
            }

            res.status(200).json({ message: 'Модуль успешно добавлен', moduleId: result.insertId });
        });
    });
});
app.post('/delete-module', (req, res) => {
    const { name, programId } = req.body;

    if (!name || !programId) {
        return res.status(400).json({ message: 'Не указано название модуля или programId для удаления' });
    }

    const query = 'DELETE FROM module WHERE name = ? AND progid = ?';
    connection.query(query, [name, programId], (err, result) => {
        if (err) {
            console.error('Ошибка при удалении модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при удалении модуля' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Модуль не найден' });
        }
    });
});

app.post('/change-module-name', (req, res) => {
    const { oldName, newName, programId } = req.body;

    if (!oldName || !newName || !programId) {
        return res.status(400).json({ message: 'Недостаточно данных для изменения названия модуля' });
    }

    const query = 'UPDATE module SET name = ? WHERE name = ? AND progid = ?';
    connection.query(query, [newName, oldName, programId], (err, result) => {
        if (err) {
            console.error('Ошибка при изменении названия модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при изменении названия модуля' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Модуль не найден' });
        }
    });
});
app.post('/change-section-name', (req, res) => {
    const token = req.cookies.authToken;
    const { moduleId, sectionId, newSectionName } = req.body;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
    }

    if (!moduleId || !sectionId || !newSectionName.trim()) {
        return res.status(400).json({ success: false, message: 'Некорректные данные' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Ошибка проверки токена' });
        }

        // Шаг 1: Проверка, существует ли уже раздел с таким именем в этом модуле
        const checkQuery = 'SELECT COUNT(*) AS count FROM section WHERE name = ? AND moduleid = ?';
        connection.query(checkQuery, [newSectionName.trim(), moduleId], (err, result) => {
            if (err) {
                console.error('Ошибка при проверке существования раздела:', err);
                return res.status(500).json({ success: false, message: 'Ошибка сервера' });
            }

            // Если такой раздел уже существует
            if (result[0].count > 0) {
                return res.status(400).json({ success: false, message: 'Раздел с таким названием уже существует в этом модуле' });
            }

            // Шаг 2: Если такого раздела нет, обновляем название
            const query = 'UPDATE section SET name = ? WHERE idsection = ? AND moduleid = ?';
            connection.query(query, [newSectionName.trim(), sectionId, moduleId], (err, result) => {
                if (err) {
                    console.error('Ошибка при изменении названия раздела:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Раздел не найден' });
                }

                res.json({ success: true, message: 'Название раздела успешно изменено' });
            });
        });
    });
});

app.post('/change-module-time', (req, res) => {
    const { name, newTime, programId } = req.body;

    if (!name || !newTime || !programId) {
        return res.status(400).json({ message: 'Недостаточно данных для изменения времени модуля' });
    }

    const query = 'UPDATE module SET moduletime = ? WHERE name = ? AND progid = ?';
    connection.query(query, [newTime, name, programId], (err, result) => {
        if (err) {
            console.error('Ошибка при изменении времени модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при изменении времени модуля' });
        }

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Модуль не найден' });
        }
    });
});
app.post('/change-section-time', (req, res) => {
    const { moduleId, sectionId, sectionTime } = req.body;

    if (!moduleId || !sectionId || sectionTime === undefined) {
        return res.status(400).json({ success: false, message: 'Некорректные данные' });
    }

    const query = 'UPDATE section SET sectiontime = ? WHERE moduleid = ? AND idsection = ?';
    connection.query(query, [sectionTime, moduleId, sectionId], (err, results) => {
        if (err) {
            console.error('Ошибка при изменении времени:', err);
            return res.status(500).json({ success: false, message: 'Ошибка базы данных' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Раздел не найден' });
        }

        res.json({ success: true, message: 'Время успешно изменено' });
    });
});
app.post('/add-section', (req, res) => {
    const { programId, moduleName, sectionName, sectionTime } = req.body;
    console.log(programId, moduleName, sectionName, sectionTime);

    if (!programId || !moduleName || !sectionName || !sectionTime) {
        return res.status(400).json({ message: 'Недостаточно данных для добавления раздела' });
    }

    // Сначала находим id модуля
    const getModuleQuery = 'SELECT idmodule FROM module WHERE progid = ? AND name = ?';
    connection.query(getModuleQuery, [programId, moduleName], (err, moduleResults) => {
        if (err) {
            console.error('Ошибка при поиске модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при поиске модуля' });
        }

        if (moduleResults.length === 0) {
            return res.status(404).json({ message: 'Модуль не найден' });
        }

        const idmodule = moduleResults[0].idmodule;

        // Проверяем, есть ли уже раздел с таким именем в этом модуле
        const checkSectionQuery = 'SELECT COUNT(*) AS count FROM section WHERE moduleid = ? AND name = ?';
        connection.query(checkSectionQuery, [idmodule, sectionName], (err, sectionResults) => {
            if (err) {
                console.error('Ошибка при проверке раздела:', err);
                return res.status(500).json({ message: 'Ошибка сервера при проверке раздела' });
            }

            if (sectionResults[0].count > 0) {
                return res.status(409).json({ message: 'Раздел с таким названием уже существует в этом модуле' });
            }

            // Если раздела нет, добавляем
            const insertSectionQuery = 'INSERT INTO section (moduleid, name, sectiontime) VALUES (?, ?, ?)';
            connection.query(insertSectionQuery, [idmodule, sectionName, sectionTime], (err, result) => {
                if (err) {
                    console.error('Ошибка при добавлении раздела:', err);
                    return res.status(500).json({ message: 'Ошибка сервера при добавлении раздела' });
                }

                res.status(200).json({ message: 'Раздел успешно добавлен', sectionId: result.insertId });
            });
        });
    });
});
app.post('/delete-section', (req, res) => {
    const { programId, moduleName, sectionName } = req.body;

    if (!programId || !moduleName || !sectionName) {
        return res.status(400).json({ message: 'Не указаны данные для удаления раздела' });
    }

    // Находим id модуля по programId и moduleName
    const moduleQuery = 'SELECT idmodule FROM module WHERE progid = ? AND name = ?';
    connection.query(moduleQuery, [programId, moduleName], (err, moduleResult) => {
        if (err) {
            console.error('Ошибка при поиске модуля:', err);
            return res.status(500).json({ message: 'Ошибка сервера при поиске модуля' });
        }

        if (moduleResult.length === 0) {
            return res.status(404).json({ message: 'Модуль не найден' });
        }

        const idmodule = moduleResult[0].idmodule;

        // Находим id раздела по moduleId и sectionName
        const sectionQuery = 'SELECT idsection FROM section WHERE moduleid = ? AND name = ?';
        connection.query(sectionQuery, [idmodule, sectionName], (err, sectionResult) => {
            if (err) {
                console.error('Ошибка при поиске раздела:', err);
                return res.status(500).json({ message: 'Ошибка сервера при поиске раздела' });
            }

            if (sectionResult.length === 0) {
                return res.status(404).json({ message: 'Раздел не найден' });
            }

            const idsection = sectionResult[0].idsection;

            // Удаляем раздел
            const deleteQuery = 'DELETE FROM section WHERE idsection = ?';
            connection.query(deleteQuery, [idsection], (err, deleteResult) => {
                if (err) {
                    console.error('Ошибка при удалении раздела:', err);
                    return res.status(500).json({ message: 'Ошибка сервера при удалении раздела' });
                }

                if (deleteResult.affectedRows > 0) {
                    res.status(200).json({ message: 'Раздел успешно удален' });
                } else {
                    res.status(404).json({ message: 'Не удалось удалить раздел' });
                }
            });
        });
    });
});
app.post('/set-current-chapter', (req, res) => {
    const token = req.cookies.authToken;  // Получаем токен из cookies
    const { programId, moduleName, sectionName } = req.body;  // Получаем данные из тела запроса
    console.log( programId, moduleName, sectionName );
    if (!token) {
        return res.status(401).json({ success: false, message: 'Пользователь не авторизован' });
    }

    // Проверяем токен и получаем информацию о пользователе
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Ошибка проверки токена' });
        }

        // Получаем id модуля по moduleName и programId
        const getModuleIdQuery = 'SELECT idmodule FROM module WHERE name = ? AND progid = ?';
        connection.query(getModuleIdQuery, [moduleName, programId], (err, moduleResults) => {
            if (err || moduleResults.length === 0) {
                return res.status(404).json({ success: false, message: 'Модуль не найден' });
            }

            const moduleId = moduleResults[0].idmodule;

            // Получаем id раздела по sectionName, moduleId и programId
            const getSectionIdQuery = 'SELECT idsection FROM section WHERE name = ? AND moduleid = ?';
            connection.query(getSectionIdQuery, [sectionName, moduleId], (err, sectionResults) => {
                if (err || sectionResults.length === 0) {
                    return res.status(404).json({ success: false, message: 'Раздел не найден' });
                }

                const sectionId = sectionResults[0].idsection;

                // Создаем новый токен с добавленными параметрами moduleId и sectionId
                const newToken = jwt.sign(
                    {
                        ...decoded,  // Сохраняем остальные данные из декодированного токена
                        moduleId: moduleId,    // Добавляем moduleId
                        sectionId: sectionId   // Добавляем sectionId
                    },
                    SECRET_KEY
                    // Без expiresIn, токен будет бессрочным
                );

                // Устанавливаем новый токен в cookies
                res.cookie('authToken', newToken, { httpOnly: true, secure: false, sameSite: 'Strict' });

                // Отправляем успешный ответ
                res.json({ success: true, message: 'Раздел установлен', moduleId, sectionId });
            });
        });
    });
});
app.post('/get-section-name', (req, res) => {
    const { moduleId, sectionId } = req.body;
    console.log(moduleId, sectionId);

    // Проверяем, что moduleId и sectionId были переданы
    if (!moduleId || !sectionId) {
        return res.status(400).json({ success: false, message: 'moduleId или sectionId не переданы' });
    }

    // Запрос к базе данных для получения названия секции по moduleId и sectionId
    const query = 'SELECT name, sectiontime, isReadVisible FROM section WHERE moduleid = ? AND idsection = ?';
    connection.query(query, [moduleId, sectionId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: 'Ошибка получения данных секции' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Секция не найдена' });
        }

        // Возвращаем название секции
        res.json({ name: results[0].name, sectiontime: results[0].sectiontime,  isReadVisible: results[0].isReadVisible});
    });
});
app.post('/change-read-visibility', (req, res) => {
    const { moduleId, sectionId, isReadVisible } = req.body;

    if (!moduleId || !sectionId || isReadVisible === undefined) {
        return res.status(400).json({ success: false, message: 'Некорректные данные' });
    }

    const query = 'UPDATE section SET isReadVisible = ? WHERE moduleid = ? AND idsection = ?';
    connection.query(query, [isReadVisible, moduleId, sectionId], (err, results) => {
        if (err) {
            console.error('Ошибка при изменении isReadVisible:', err);
            return res.status(500).json({ success: false, message: 'Ошибка базы данных' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Секция не найдена' });
        }

        res.json({ success: true, message: 'Статус isReadVisible успешно изменен' });
    });
});
app.post('/save-word-file', upload, (req, res) => {
    console.log("Пришли данные:", req.body);
    console.log("Файл:", req.files);

    const { moduleId, sectionId, isEmpty } = req.body;

    if (!moduleId || !sectionId) {
        console.error("Ошибка: отсутствуют moduleId или sectionId");
        return res.status(400).json({ success: false, message: 'Отсутствуют необходимые данные' });
    }

    // Приводим isEmpty к булевому типу
    const isFileEmpty = isEmpty === "true" || isEmpty === true;  

    // Если флаг isEmpty установлен, записываем NULL
    if (isFileEmpty) {
        console.log("Сохраняем NULL в БД");
        const query = 'UPDATE section SET file = NULL WHERE moduleid = ? AND idsection = ?';

        connection.query(query, [moduleId, sectionId], (err, result) => {
            if (err) {
                console.error('Ошибка при сохранении NULL в БД:', err);
                return res.status(500).json({ success: false, message: 'Ошибка при сохранении NULL' });
            }

            res.json({ success: true, message: 'Файл успешно сохранен как NULL' });
        });

        return; // Прерываем выполнение, чтобы дальше код не выполнялся
    }

    // Если файла нет, но isEmpty не передали
    if (!req.files || !req.files['file']) {
        console.error("Ошибка: отсутствует файл");
        return res.status(400).json({ success: false, message: 'Файл не найден' });
    }

    const fileBuffer = req.files['file'][0].buffer;

    // SQL-запрос на обновление поля file в таблице section
    const query = 'UPDATE section SET file = ? WHERE moduleid = ? AND idsection = ?';

    connection.query(query, [fileBuffer, moduleId, sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при сохранении файла в БД:', err);
            return res.status(500).json({ success: false, message: 'Ошибка при сохранении файла' });
        }

        res.json({ success: true, message: 'Файл успешно сохранен' });
    });
});
app.post('/save-word-admin', upload, (req, res) => {
    console.log("Пришли данные:", req.body);
    console.log("Файл:", req.files);

    const { isEmpty } = req.body;

    // Приводим isEmpty к булевому типу
    const isFileEmpty = isEmpty === "true" || isEmpty === true;  

    // Если флаг isEmpty установлен, записываем NULL
    if (isFileEmpty) {
        console.log("Сохраняем NULL в БД");
        const query = 'UPDATE instructions SET instr_admin = NULL WHERE id = 1';

        connection.query(query, (err, result) => {
            if (err) {
                console.error('Ошибка при сохранении NULL в БД:', err);
                return res.status(500).json({ success: false, message: 'Ошибка при сохранении NULL' });
            }

            res.json({ success: true, message: 'Файл успешно сохранен как NULL' });
        });

        return; // Прерываем выполнение, чтобы дальше код не выполнялся
    }

    // Если файла нет, но isEmpty не передали
    if (!req.files || !req.files['file']) {
        console.error("Ошибка: отсутствует файл");
        return res.status(400).json({ success: false, message: 'Файл не найден' });
    }

    const fileBuffer = req.files['file'][0].buffer;

    // SQL-запрос на обновление поля file в таблице section
    const query = 'UPDATE instructions SET instr_admin = ? WHERE id = 1';

    connection.query(query, [fileBuffer], (err, result) => {
        if (err) {
            console.error('Ошибка при сохранении файла в БД:', err);
            return res.status(500).json({ success: false, message: 'Ошибка при сохранении файла' });
        }

        res.json({ success: true, message: 'Файл успешно сохранен' });
    });
});
app.post('/save-word-user', upload, (req, res) => {
    console.log("Пришли данные:", req.body);
    console.log("Файл:", req.files);

    const { isEmpty } = req.body;

    // Приводим isEmpty к булевому типу
    const isFileEmpty = isEmpty === "true" || isEmpty === true;  

    // Если флаг isEmpty установлен, записываем NULL
    if (isFileEmpty) {
        console.log("Сохраняем NULL в БД");
        const query = 'UPDATE instructions SET instr_user = NULL WHERE id = 1';

        connection.query(query, (err, result) => {
            if (err) {
                console.error('Ошибка при сохранении NULL в БД:', err);
                return res.status(500).json({ success: false, message: 'Ошибка при сохранении NULL' });
            }

            res.json({ success: true, message: 'Файл успешно сохранен как NULL' });
        });

        return; // Прерываем выполнение, чтобы дальше код не выполнялся
    }

    // Если файла нет, но isEmpty не передали
    if (!req.files || !req.files['file']) {
        console.error("Ошибка: отсутствует файл");
        return res.status(400).json({ success: false, message: 'Файл не найден' });
    }

    const fileBuffer = req.files['file'][0].buffer;

    // SQL-запрос на обновление поля file в таблице section
    const query = 'UPDATE instructions SET instr_user = ? WHERE id = 1';

    connection.query(query, [fileBuffer], (err, result) => {
        if (err) {
            console.error('Ошибка при сохранении файла в БД:', err);
            return res.status(500).json({ success: false, message: 'Ошибка при сохранении файла' });
        }

        res.json({ success: true, message: 'Файл успешно сохранен' });
    });
});
app.post('/get-word-file', (req, res) => {
    const { moduleId, sectionId } = req.body;
    if (!moduleId || !sectionId) {
        return res.status(400).json({ success: false, message: 'moduleId или sectionId отсутствуют' });
    }
    const query = 'SELECT file FROM section WHERE moduleid = ? AND idsection = ?';
    connection.query(query, [moduleId, sectionId], (err, results) => {
        if (err) {
            console.error("Ошибка запроса:", err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        if (results.length === 0 || !results[0].file) {
            return res.status(204).json({ success: true, file: null });  // Вместо 404 возвращаем 204 для пустого ответа
        }
        const fileBuffer = results[0].file;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
        res.send(fileBuffer);
    });
});

app.post('/get-word-admin', (req, res) => {
    const query = 'SELECT instr_admin FROM instructions WHERE id = 1';
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Ошибка запроса:", err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (results.length === 0 || !results[0].instr_admin) { // Тут исправлено
            return res.status(204).json({ success: true, file: null });
        }

        const fileBuffer = results[0].instr_admin; // Тут тоже исправлено

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
        res.send(fileBuffer);
    });
});
app.post('/get-word-user', (req, res) => {
    const query = 'SELECT instr_user FROM instructions WHERE id = 1';
    connection.query(query, (err, results) => {
        if (err) {
            console.error("Ошибка запроса:", err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (results.length === 0 || !results[0].instr_user) { // Тут исправлено
            return res.status(204).json({ success: true, file: null });
        }

        const fileBuffer = results[0].instr_user; // Тут тоже исправлено

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', 'attachment; filename="document.docx"');
        res.send(fileBuffer);
    });
});
app.post('/check-test', (req, res) => {
    const { sectionId } = req.body;

    if (!sectionId) {
        return res.status(400).json({ idtest: null, message: 'Некорректные данные' });
    }

    const checkTestQuery = `SELECT idtest FROM test WHERE secid = ?`;

    connection.query(checkTestQuery, [sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при проверке теста:', err);
            return res.status(500).json({ idtest: null, message: 'Ошибка сервера' });
        }

        if (result.length > 0) {
            res.json({ idtest: result[0].idtest }); // Возвращаем ID теста
        } else {
            res.json({ idtest: null }); // Если теста нет, возвращаем null
        }
    });
});
app.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
});
// Проверка наличия теста при клике на кнопку
app.post('/handle-test-click', (req, res) => {
    const { sectionId } = req.body;
    if (!sectionId) {
        return res.status(400).json({ exists: false, message: 'Некорректный sectionId' });
    }

    const checkQuery = 'SELECT 1 FROM test WHERE secid = ? LIMIT 1';
    connection.query(checkQuery, [sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при проверке теста:', err);
            return res.status(500).json({ exists: false, message: 'Ошибка сервера' });
        }

        if (result.length > 0) {
            return res.json({ exists: true }); // Тест уже есть, просто переходим на страницу
        }

        // Если теста нет, создаём запись
        const insertQuery = 'INSERT INTO test (secid) VALUES (?)';
        connection.query(insertQuery, [sectionId], (err, insertResult) => {
            if (err) {
                console.error('Ошибка при создании теста:', err);
                return res.status(500).json({ exists: false, message: 'Ошибка сервера' });
            }

            res.json({ exists: false }); // Тест успешно создан
        });
    });
});
app.post('/delete-test', (req, res) => {
    const { sectionId } = req.body;
    if (!sectionId) {
        return res.status(400).json({ success: false, message: 'Некорректный sectionId' });
    }

    // Получаем idtest по secid
    const getTestIdQuery = 'SELECT idtest FROM test WHERE secid = ?';
    connection.query(getTestIdQuery, [sectionId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении idtest:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Тест не найден' });
        }

        const testIds = results.map(row => row.idtest); // Собираем все idtest (если их несколько)

        // Удаляем записи из user_results, связанные с idtest
        const deleteUserResultsQuery = 'DELETE FROM user_results WHERE tid IN (?)';
        connection.query(deleteUserResultsQuery, [testIds], (err, result) => {
            if (err) {
                console.error('Ошибка при удалении результатов пользователей:', err);
                return res.status(500).json({ success: false, message: 'Ошибка сервера' });
            }

            // Удаляем тест(ы) из test
            const deleteTestQuery = 'DELETE FROM test WHERE idtest IN (?)';
            connection.query(deleteTestQuery, [testIds], (err, result) => {
                if (err) {
                    console.error('Ошибка при удалении теста:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка сервера' });
                }

                res.json({ success: true, message: 'Тест и связанные данные успешно удалены' });
            });
        });
    });
});
app.post('/set-time-test', (req, res) => {
    const { sectionId, time } = req.body;

    if (!sectionId || !time) {
        return res.status(400).json({ success: false, message: "Некорректные данные" });
    }

    const updateQuery = `UPDATE test SET time = ? WHERE secid= ?`;

    connection.query(updateQuery, [time, sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при обновлении времени:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Запись с таким sectionId не найдена' });
        }
    });
});
app.post('/get-time-test', (req, res) => {
    const { sectionId } = req.body; 

    const query = 'SELECT time FROM test WHERE secid = ?';

    connection.query(query, [sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при получении времени:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        if (result.length === 0 || result[0].time === null || result[0].time === '00:00:00') {
            return res.json({ success: true, time: '00:00' }); 
        }

        // Если время существует, возвращаем его
        return res.json({ success: true, time: result[0].time });
    });
});
app.post('/get-time-testnew', (req, res) => {
    const { sectionId } = req.body; 

    const query = 'SELECT time, timeReset FROM test WHERE secid = ?';

    connection.query(query, [sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при получении времени:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: 'Секция не найдена' });
        }

        const { time, timeReset } = result[0];

        return res.json({
            success: true,
            time: time === null ? '00:00:00' : time,
            timeReset: timeReset === null ? '00:00:00' : timeReset
        });
    });
});
app.post('/set-reloadtime-test', (req, res) => {
    const { sectionId, reloadId, time } = req.body;

    if (!sectionId || !time) {
        return res.status(400).json({ success: false, message: "Некорректные данные" });
    }

    const updateTestQuery = 'UPDATE test SET timeReset = ? WHERE secid = ?';
    const updateUserResultsQuery = 'UPDATE user_results SET DateReset = NULL WHERE tid = ?';

    // Сначала обновим таблицу test
    connection.query(updateTestQuery, [time, sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при обновлении времени в test:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера при обновлении test' });
        }

        if (result.affectedRows > 0) {
            // Устанавливаем DateReset = NULL всем записям с tid = reloadId
            connection.query(updateUserResultsQuery, [reloadId], (err2, result2) => {
                if (err2) {
                    console.error('Ошибка при обнулении DateReset в user_results:', err2);
                    return res.status(500).json({ success: false, message: 'Ошибка сервера при обновлении user_results' });
                }

                console.log(`Обновлено записей в user_results: ${result2.affectedRows}`);
                res.json({ success: true });
            });
        } else {
            res.json({ success: false, message: 'Запись с таким sectionId не найдена в test' });
        }
    });
});
app.post('/get-reloadtime-test', (req, res) => {
    const { sectionId } = req.body; 

    const query = 'SELECT timeReset FROM test WHERE secid = ?';

    connection.query(query, [sectionId], (err, result) => {
        if (err) {
            console.error('Ошибка при получении времени:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
        // Используем timeReset, а не time
        if (result.length === 0 || result[0].timeReset === null || result[0].timeReset === '00:00:00') {
            return res.json({ success: true, time: '00:00' }); 
        }

        // Если время существует, возвращаем его
        return res.json({ success: true, time: result[0].timeReset });
    });
});
app.post("/add-question", (req, res) => {
    const { testId, text, points, answers, varquest } = req.body;

    const query = "INSERT INTO question (testid, text, points, varquest) VALUES (?, ?, ?, ?)";

    connection.query(query, [testId, text, points, varquest], (err, result) => {
        if (err) {
            console.error("Ошибка при добавлении вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера" });
        }

        const insertedId = result.insertId;

        if (answers && answers.length > 0) {
            // Первому ответу ставим is_correct = 1
            answers[0].is_correct = 1;

            const answerQuery = "INSERT INTO answers (question_id, variant, answer_text, is_correct) VALUES ?";
            const answerValues = answers.map(answer => [insertedId, answer.variant, answer.answer_text, answer.is_correct]);

            connection.query(answerQuery, [answerValues], (err) => {
                if (err) {
                    console.error("Ошибка при добавлении ответов:", err);
                    return res.status(500).json({ success: false, message: "Ошибка при добавлении ответов" });
                }

                res.json({ success: true, question: { id: insertedId, testId, text, points, answers } });
            });
        } else {
            res.json({ success: true, question: { id: insertedId, testId, text, points } });
        }
    });
});
app.post("/add-more-answers", (req, res) => {
    const { varquest, answerText, testId, answerVariant } = req.body;

    // Запрос для получения id вопроса по его тексту и testId
    const getQuestionIdQuery = "SELECT idquestion FROM question WHERE varQuest = ? AND testid = ?";

    connection.query(getQuestionIdQuery, [ varquest, testId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении id вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера при получении questionId" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Вопрос не найден" });
        }

        const questionId = result[0].idquestion; // Получаем id вопроса

        // Теперь вставляем новый ответ в таблицу answers с найденным questionId
        const query = "INSERT INTO answers (question_id, answer_text, variant) VALUES (?, ?, ?)";

        connection.query(query, [questionId, answerText, answerVariant], (err, result) => {
            if (err) {
                console.error("Ошибка при добавлении ответа:", err);
                return res.status(500).json({ success: false, message: "Ошибка сервера при добавлении ответа" });
            }

            // Возвращаем успешный ответ
            res.json({ success: true, answer: { questionId, answerText, id: result.insertId } });
        });
    });
});
app.post("/update-answer", (req, res) => {
    const { varquest, answerVariant, isCorrect, testId, isRadio } = req.body; // Передаем isRadio с фронта

    const getQuestionIdQuery = "SELECT idquestion FROM question WHERE varQuest = ? AND testid = ?";

    connection.query(getQuestionIdQuery, [ varquest, testId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении id вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера при получении questionId" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Вопрос не найден" });
        }

        const questionId = result[0].idquestion;

        const getAnswerIdQuery = "SELECT idanswer FROM answers WHERE variant = ? AND question_id = ?";

        connection.query(getAnswerIdQuery, [answerVariant, questionId], (err, result) => {
            if (err) {
                console.error("Ошибка при получении id ответа:", err);
                return res.status(500).json({ success: false, message: "Ошибка при получении ответа" });
            }

            if (result.length === 0) {
                return res.status(404).json({ success: false, message: "Ответ не найден" });
            }

            const answerId = result[0].idanswer;

            function updateAnswer() {
                const updateAnswerQuery = "UPDATE answers SET is_correct = ? WHERE idanswer = ?";
                connection.query(updateAnswerQuery, [isCorrect, answerId], (err) => {
                    if (err) {
                        console.error("Ошибка при обновлении ответа:", err);
                        return res.status(500).json({ success: false, message: "Ошибка при обновлении ответа" });
                    }
                    res.json({ success: true, message: "Ответ успешно обновлен" });
                });
            }

            // Если это радио-кнопка, сначала обнуляем все is_correct = 0
            if (isRadio) {
                const resetQuery = "UPDATE answers SET is_correct = 0 WHERE question_id = ?";
                connection.query(resetQuery, [questionId], (err) => {
                    if (err) {
                        console.error("Ошибка при сбросе правильных ответов:", err);
                        return res.status(500).json({ success: false, message: "Ошибка при сбросе правильных ответов" });
                    }
                    updateAnswer();
                });
            } else {
                updateAnswer();
            }
        });
    });
});


app.post("/get-questions", (req, res) => {
    const { testId } = req.body;

    if (!testId) {
        return res.status(400).json({ success: false, message: "Отсутствует testId" });
    }

    const query = `
        SELECT q.idquestion, q.text, q.points, q.varQuest, 
               a.idanswer, a.answer_text, a.is_correct
        FROM question q
        LEFT JOIN answers a ON q.idquestion = a.question_id
        WHERE q.testid = ?
        ORDER BY q.varQuest ASC, a.idanswer ASC;
    `;

    connection.query(query, [testId], (err, results) => {
        if (err) {
            console.error("Ошибка при получении вопросов:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера" });
        }

        const questionsMap = new Map();

        results.forEach(row => {
            if (!questionsMap.has(row.idquestion)) {
                questionsMap.set(row.idquestion, {
                    id: row.idquestion,
                    text: row.text,
                    points: row.points,
                    varQuest: row.varQuest,
                    answers: [],
                    correctCount: 0 // Считаем правильные ответы
                });
            }

            if (row.idanswer) {
                const isCorrect = row.is_correct === 1;
                questionsMap.get(row.idquestion).answers.push({
                    id: row.idanswer,
                    answer_text: row.answer_text,
                    is_correct: isCorrect
                });

                if (isCorrect) {
                    questionsMap.get(row.idquestion).correctCount += 1;
                }
            }
        });

        // Устанавливаем тип input
        questionsMap.forEach(q => {
            q.isMultiple = q.correctCount > 1; // Если больше 1 правильного ответа — чекбоксы
        });

        res.json({ success: true, questions: Array.from(questionsMap.values()) });
    });
});
app.post("/delete-answer", (req, res) => {
    const { testId, varquest, answerVariant } = req.body;

    if (!testId || !varquest || !answerVariant) {
        return res.status(400).json({ success: false, message: "Недостаточно данных для удаления" });
    }

    // Находим ID вопроса
    const getQuestionIdQuery = "SELECT idquestion FROM question WHERE varQuest = ? AND testid = ?";

    connection.query(getQuestionIdQuery, [varquest, testId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении id вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера при получении questionId" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Вопрос не найден" });
        }

        const questionId = result[0].idquestion; // Получаем ID вопроса

        // Удаляем вариант ответа из таблицы answers
        const deleteQuery = "DELETE FROM answers WHERE question_id = ? AND variant = ?";

        connection.query(deleteQuery, [questionId, answerVariant], (err, deleteResult) => {
            if (err) {
                console.error("Ошибка при удалении ответа:", err);
                return res.status(500).json({ success: false, message: "Ошибка сервера при удалении ответа" });
            }

            if (deleteResult.affectedRows > 0) {
                res.json({ success: true, message: "Вариант ответа удалён" });
            } else {
                res.status(404).json({ success: false, message: "Ответ не найден" });
            }
        });
    });
});
app.post("/update-answer-text", (req, res) => {
    const { varquest, answerVariant, testId, newText } = req.body;
    console.log("Полученные данные:", req.body); 

    if (!varquest || !answerVariant || !testId || !newText) {
        return res.status(400).json({ success: false, message: "Недостаточно данных для обновления ответа" });
    }

    // Получаем question_id
    const getQuestionIdQuery = "SELECT idquestion FROM question WHERE varQuest = ? AND testid = ?";

    connection.query(getQuestionIdQuery, [varquest, testId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении id вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Вопрос не найден" });
        }

        const questionId = result[0].idquestion;

        // Обновляем текст ответа
        const updateAnswerQuery = `
            UPDATE answers
            SET answer_text = ? 
            WHERE question_id = ? AND variant = ?
        `;

        connection.query(updateAnswerQuery, [newText, questionId, answerVariant], (err, updateResult) => {
            if (err) {
                console.error("Ошибка при обновлении ответа:", err);
                return res.status(500).json({ success: false, message: "Ошибка сервера при обновлении ответа" });
            }

            res.json({ success: true, message: "Ответ успешно обновлён" });
        });
    });
});
app.post("/delete-question", (req, res) => {
    const { testId, variant } = req.body;

    if (!testId || !variant) {
        return res.status(400).json({ success: false, message: "Недостаточно данных для удаления вопроса" });
    }

    // Запрос для удаления вопроса из базы данных
    const deleteQuery = "DELETE FROM question WHERE testid = ? AND varQuest = ?";

    connection.query(deleteQuery, [testId, variant], (err, result) => {
        if (err) {
            console.error("Ошибка при удалении вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера при удалении вопроса" });
        }

        if (result.affectedRows > 0) {
            // Если удалён последний вопрос, то обновление номеров не требуется
            const getQuestionsQuery = "SELECT varQuest FROM question WHERE testid = ? ORDER BY varQuest ASC";

            connection.query(getQuestionsQuery, [testId], (err, result) => {
                if (err) {
                    console.error("Ошибка при получении вопросов:", err);
                    return res.status(500).json({ success: false, message: "Ошибка сервера при получении вопросов" });
                }

                // Если нет вопросов, возвращаем успешный ответ
                if (result.length === 0) {
                    return res.json({ success: true, message: "Вопрос успешно удалён, нет других вопросов для обновления номеров" });
                }

                // Получаем список всех номеров вопросов
                const questions = result.map(row => row.varQuest);

                // Ищем индекс удалённого вопроса
                const deletedIndex = questions.indexOf(variant);

                // Выполняем обновление только для тех вопросов, которые идут после удалённого
                const updateQuery = `
                    UPDATE question
                    SET varQuest = varQuest - 1
                    WHERE testid = ? AND varQuest > ?
                `;

                connection.query(updateQuery, [testId, variant], (err, result) => {
                    if (err) {
                        console.error("Ошибка при обновлении номеров вопросов:", err);
                        return res.status(500).json({ success: false, message: "Ошибка при обновлении номеров вопросов" });
                    }

                    // Если удаление прошло успешно, отправляем успешный ответ
                    res.json({ success: true, message: "Вопрос успешно удалён и номера обновлены" });
                });
            });
        } else {
            res.status(404).json({ success: false, message: "Вопрос не найден" });
        }
    });
});
app.post("/update-question", (req, res) => {
    const { varquest, testId, newText } = req.body;

    if (!varquest || !testId || !newText) {
        return res.status(400).json({ success: false, message: "Недостаточно данных для обновления вопроса" });
    }

    // Сначала получаем `idquestion` по `varQuest` и `testId`
    const getIdQuery = "SELECT idquestion FROM question WHERE varQuest = ? AND testid = ?";

    connection.query(getIdQuery, [varquest, testId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении ID вопроса:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера при получении ID вопроса" });
        }

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Вопрос не найден" });
        }

        const idquestion = result[0].idquestion;

        // Теперь обновляем текст вопроса
        const updateQuery = "UPDATE question SET text = ? WHERE idquestion = ?";

        connection.query(updateQuery, [newText, idquestion], (err, updateResult) => {
            if (err) {
                console.error("Ошибка при обновлении вопроса:", err);
                return res.status(500).json({ success: false, message: "Ошибка сервера при обновлении вопроса" });
            }

            res.json({ success: true, message: "Вопрос успешно обновлён" });
        });
    });
});

app.post("/update-question-points", (req, res) => {
    const { varquest, testId, points } = req.body;

    if (!varquest || !testId || typeof points !== "number" || points < 1 || points > 10) {
        return res.status(400).json({ success: false, message: "Некорректные данные" });
    }

    // Здесь должна быть логика обновления в БД
    const query = "UPDATE question SET points = ? WHERE testid = ? AND varQuest = ?";
    connection.query(query, [points, testId, varquest], (err, result) => {
        if (err) {
            console.error("Ошибка обновления баллов в БД:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера" });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true, message: "Баллы успешно обновлены" });
        } else {
            res.status(404).json({ success: false, message: "Вопрос не найден" });
        }
    });
});
app.post("/check-read-visibility", (req, res) => {
    const { moduleId, sectionId } = req.body;

    if (!moduleId || !sectionId) {
        return res.status(400).json({ success: false, message: "Отсутствуют moduleId или sectionId" });
    }

    // Проверяем isReadVisible в таблице section
    const query1 = "SELECT isReadVisible FROM section WHERE moduleid = ? AND idsection = ?";
    connection.query(query1, [moduleId, sectionId], (err, sectionResults) => {
        if (err) {
            console.error("Ошибка при проверке isReadVisible:", err);
            return res.status(500).json({ success: false, message: "Ошибка сервера" });
        }

        if (sectionResults.length > 0) {
            const isReadVisible = sectionResults[0].isReadVisible;

            // Проверяем наличие idtest в таблице test
            const query2 = "SELECT idtest FROM test WHERE secid = ?";
            connection.query(query2, [sectionId], (err, testResults) => {
                if (err) {
                    console.error("Ошибка при проверке idtest:", err);
                    return res.status(500).json({ success: false, message: "Ошибка сервера" });
                }

                const idtestExists = testResults.length > 0;

                // Если isReadVisible == 1 и нет idtest, возвращаем информацию для добавления радио кнопки
                if (isReadVisible === 1) {
                    return res.json({ success: true, isReadVisible: 1, addTestButton: false });
                } 
                // Если isReadVisible == 0 или нет, но есть idtest, возвращаем информацию для добавления кнопки теста
                else if (idtestExists) {
                    return res.json({ success: true, isReadVisible: 0, addTestButton: true });
                }
                // Если нет ни isReadVisible, ни idtest, ничего не добавляем
                else {
                    return res.json({ success: true, isReadVisible: 0, addTestButton: false });
                }
            });
        } else {
            return res.status(404).json({ success: false, message: "Раздел не найден" });
        }
    });
});
app.post('/change-readen', (req, res) => {
    const { userName, userSurname, fatherName, sectionId, isReadVisible } = req.body;

    if (!userName || !userSurname || !fatherName || !sectionId || isReadVisible === undefined) {
        return res.status(400).json({ success: false, message: 'Некорректные данные' });
    }

    // 1. Находим ID пользователя по его данным
    const query1 = 'SELECT id FROM allusers WHERE Name = ? AND Surname = ? AND (Fathername = ? OR Fathername IS NULL)';
    connection.query(query1, [userName, userSurname, fatherName], (err, userResults) => {
        if (err) {
            console.error('Ошибка при получении ID пользователя:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        const userId = userResults[0].id;

        // 2. Проверяем, нужно ли вставлять или удалять запись в iduser_results
        if (isReadVisible === "1") {
            // Вставляем запись в таблицу iduser_results
            const insertQuery = 'INSERT INTO user_results (IDuser, sectionid) VALUES (?, ?)';
            connection.query(insertQuery, [userId, sectionId], (err, results) => {
                if (err) {
                    console.error('Ошибка при добавлении записи в iduser_results:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка базы данных' });
                }

                res.json({ success: true, message: 'Запись успешно добавлена в iduser_results' });
            });
        } else {
            // Удаляем запись из таблицы iduser_results
            const deleteQuery = 'DELETE FROM user_results WHERE IDuser = ? AND sectionid = ?';
            connection.query(deleteQuery, [userId, sectionId], (err, results) => {
                if (err) {
                    console.error('Ошибка при удалении записи из iduser_results:', err);
                    return res.status(500).json({ success: false, message: 'Ошибка базы данных' });
                }

                if (results.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Запись не найдена' });
                }

                res.json({ success: true, message: 'Запись успешно удалена из iduser_results' });
            });
        }
    });
});
app.post('/check-user-read-status', (req, res) => {
    const { userName, userSurname, fatherName, sectionId } = req.body;

    if (!userName || !userSurname || !fatherName || !sectionId) {
        return res.status(400).json({ success: false, message: 'Некорректные данные' });
    }

    // Проверка на ID пользователя
    const query1 = `SELECT id FROM allusers WHERE Name = ? AND Surname = ? AND (Fathername = ? OR Fathername IS NULL)`;
    connection.query(query1, [userName, userSurname, fatherName], (err, userResults) => {
        if (err) {
            console.error('Ошибка при получении ID пользователя:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (userResults.length === 0) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        const userId = userResults[0].id;

        // Проверка на наличие записи в user_results для этого userId и sectionId
        const query2 = `SELECT iduser_results FROM user_results WHERE IDuser = ? AND sectionid = ?`;
        connection.query(query2, [userId, sectionId], (err, resultResults) => {
            if (err) {
                console.error('Ошибка при проверке записи в user_results:', err);
                return res.status(500).json({ success: false, message: 'Ошибка сервера' });
            }
            console.log(resultResults);
            const iduserResults = resultResults.length > 0 ? 1:0;
            console.log(iduserResults);
            // Возвращаем данные
            return res.json({
                success: true,
                iduserResults: iduserResults  // iduser_results или null
            });
        });
    });
});
app.post("/get-question-count", (req, res) => {
    const { idtest } = req.body;

    if (!idtest) {
        return res.status(400).json({ success: false, message: "Отсутствует idtest" });
    }

    const query = "SELECT COUNT(*) AS questionCount FROM question WHERE testid = ?";
    
    connection.query(query, [idtest], (err, results) => {
        if (err) {
            console.error("Ошибка при подсчёте вопросов:", err);
            return res.status(500).json({ success: false, message: "Ошибка базы данных" });
        }

        const count = results.length > 0 ? results[0].questionCount : null;
        res.json({ success: true, count });
    });
});
app.post("/get-max-score", (req, res) => {
    const { idtest } = req.body;

    if (!idtest) {
        return res.status(400).json({ success: false, message: "Отсутствует idtest" });
    }

    const query = "SELECT SUM(points) AS totalScore FROM question WHERE testid = ?";
    
    connection.query(query, [idtest], (err, results) => {
        if (err) {
            console.error("Ошибка при подсчёте суммы баллов:", err);
            return res.status(500).json({ success: false, message: "Ошибка базы данных" });
        }

        const totalScore = results[0].totalScore; // Получаем сумму баллов
        res.json({ success: true, totalScore: totalScore !== null ? totalScore : null });
    });
});
// app.post('/get-user-test-result') — Один запрос для получения всех данных
app.post('/get-user-test-result', (req, res) => {
    const { userName, userSurname, fatherName, testId } = req.body;

    // Получаем ID пользователя
    const queryUserId = `SELECT id FROM allusers WHERE Name = ? AND Surname = ? AND (Fathername = ? OR Fathername IS NULL)`;
    connection.query(queryUserId, [userName, userSurname, fatherName], (err, results) => {
        if (err) {
            console.error('Ошибка при получении ID пользователя:', err);
            return res.json({ success: false, message: 'Ошибка при получении ID пользователя' });
        }
        if (results.length > 0) {
            const userId = results[0].id;
            console.log(userId, testId);
            // Теперь получаем данные из user_results на основе ID пользователя и ID теста
            const queryTestResult = `SELECT score, DateReset FROM user_results WHERE iduser = ? AND tid = ?`;
            connection.query(queryTestResult, [userId, testId], (err, results) => {
                if (err) {
                    console.error('Ошибка при получении результатов теста:', err);
                    return res.json({ success: false, message: 'Ошибка при получении данных теста' });
                }
                if (results.length > 0) {
                    return res.json({ success: true, score: results[0].score, DateReset: results[0].DateReset });
                }
                return res.json({ success: true, message: 'Результаты теста не найдены' });
            });
        } else {
            return res.json({ success: false, message: 'Пользователь не найден' });
        }
    });
});

// Получение вопросов для теста
app.post('/get-questionstoanswer', (req, res) => {
    const { testId } = req.body; // Получаем testId от клиента
    if (!testId) return res.status(400).json({ success: false, error: "Нет testId" });

    const query = 'SELECT idquestion, text, points FROM question WHERE testid = ?';
    connection.query(query, [testId], (error, results) => {
        if (error) {
            console.error('Ошибка при получении вопросов:', error);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Вопросы не найдены" });
        }
        // Сортировка вопросов случайным образом
        results.sort(() => Math.random() - 0.5);

        res.json(results);
    });
});


app.post('/get-answerstoanswer', (req, res) => {
    const { questionId } = req.body;
    if (!questionId) return res.status(400).json({ success: false, error: "Нет questionId" });

    const query = 'SELECT answer_text, is_correct FROM answers WHERE question_id = ?';
    connection.query(query, [questionId], (error, results) => {
        if (error) {
            console.error('Ошибка при получении ответов:', error);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Ответы не найдены" });
        }

        let questionAnswersCache = []; // Делаем массив, а не объект

        const encryptedAnswers = results.map(answer => {
            const isCorrectValue = answer.is_correct !== null ? answer.is_correct.toString() : '0';
            const hashedIsCorrect = bcrypt.hashSync(isCorrectValue, 10);

            if (answer.is_correct === 1) {
                questionAnswersCache.push(hashedIsCorrect); // Теперь сохраняем **все** правильные ответы
            }

            return {
                answer_text: answer.answer_text,
                is_correct: hashedIsCorrect,
                correct_value: answer.is_correct
            };
        });

        console.log(`Кэш для вопроса ${questionId}:`, questionAnswersCache);

        // Сортируем ответы случайным образом
        encryptedAnswers.sort(() => Math.random() - 0.5);

        res.json({
            answers: encryptedAnswers,
            correctAnswers: questionAnswersCache // Теперь это массив всех правильных ответов
        });
    });
});

// Подсчет баллов за ответы
app.post('/submit-answers', (req, res) => {
    const { answers, testId, correctAnswersCache } = req.body;
    if (!answers || !testId || !correctAnswersCache) {
        return res.status(400).json({ success: false, error: "Отсутствуют данные" });
    }

    let totalPoints = 0;

    // Группируем ответы пользователя по вопросам
    let userAnswersGrouped = {};
    answers.forEach(userAnswer => {
        if (!userAnswersGrouped[userAnswer.questionId]) {
            userAnswersGrouped[userAnswer.questionId] = [];
        }
        userAnswersGrouped[userAnswer.questionId].push(userAnswer.answerId);
    });

    // Проверяем каждый вопрос
    Object.keys(userAnswersGrouped).forEach(questionId => {
        const userSelectedAnswers = userAnswersGrouped[questionId]; // Ответы пользователя
        const correctAnswers = Object.values(correctAnswersCache[questionId]); // Все правильные ответы (хэши)

        // Проверяем: 
        // 1. Количество выбранных ответов должно совпадать с количеством правильных
        // 2. Каждый выбранный ответ должен быть в списке правильных
        const allCorrect = userSelectedAnswers.length === correctAnswers.length && 
                           userSelectedAnswers.every(answer => correctAnswers.includes(answer));

        if (allCorrect) {
            // Берём баллы из сохранённых значений на сервере
            const questionPoints = answers.find(a => a.questionId === questionId).points || 0;
            totalPoints += questionPoints;
        }
    });

    res.json({ totalPoints });
});
app.post('/save-user-result', (req, res) => {
    const { userName, userSurname, fatherName, averageScore, idtest, newTime } = req.body;

    if (!userName || !userSurname || !idtest || !newTime) {
        return res.status(400).json({ success: false, error: "Отсутствуют необходимые данные" });
    }
    // Находим ID пользователя в таблице allusers
    const findUserQuery = 'SELECT ID FROM allusers WHERE name = ? AND surname = ? AND (Fathername = ? OR Fathername IS NULL)';
    connection.query(findUserQuery, [userName, userSurname, fatherName], (err, userResults) => {
        if (err) {
            console.error("Ошибка при поиске пользователя:", err);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }
        if (userResults.length === 0) {
            return res.status(404).json({ success: false, error: "Пользователь не найден" });
        }
        const userId = userResults[0].ID;
        const checkResultQuery = 'SELECT * FROM user_results WHERE IDuser = ? AND tid = ?';
        connection.query(checkResultQuery, [userId, idtest], (err, result) => {
            if (err) {
                console.error("Ошибка при проверке существующих результатов:", err);
                return res.status(500).json({ success: false, error: "Ошибка сервера" });
            }

            if (result.length > 0) {
                const updateQuery = 'UPDATE user_results SET score = ?, DateReset = ? WHERE IDuser = ? AND tid = ?';
                connection.query(updateQuery, [averageScore, newTime, userId, idtest], (err, updateResult) => {
                    if (err) {
                        console.error("Ошибка при обновлении результата:", err);
                        return res.status(500).json({ success: false, error: "Ошибка при обновлении" });
                    }
                    res.json({ success: true, message: "Результат обновлён" });
                });
            } else {
                // Вставляем новую запись
                const insertQuery = 'INSERT INTO user_results (IDuser, tid, score, DateReset) VALUES (?, ?, ?, ?)';
                connection.query(insertQuery, [userId, idtest, averageScore, newTime], (err, insertResult) => {
                    if (err) {
                        console.error("Ошибка при вставке нового результата:", err);
                        return res.status(500).json({ success: false, error: "Ошибка при вставке" });
                    }
                    res.json({ success: true, message: "Результат сохранён" });
                });
            }
        });
    });
});
app.post('/get-date-reset', (req, res) => {
    const { userName, userSurname, fatherName, idtest } = req.body;

    if (!userName || !userSurname || !idtest) {
        return res.status(400).json({ success: false, error: "Отсутствуют обязательные параметры" });
    }

    // Запрос для получения ID пользователя из allusers
    const getUserIdQuery = `
        SELECT ID FROM allusers
        WHERE Name = ? AND Surname = ? AND (Fathername = ? OR Fathername IS NULL)
    `;

    connection.query(getUserIdQuery, [userName, userSurname, fatherName], (error, results) => {
        if (error) {
            console.error("Ошибка при получении ID пользователя:", error);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "Пользователь не найден" });
        }

        const userId = results[0].ID;

        // Запрос для получения DateReset из user_results
        const getDateResetQuery = `
            SELECT DateReset FROM user_results
            WHERE IDuser = ? AND tid = ?
        `;

        connection.query(getDateResetQuery, [userId, idtest], (error, results) => {
            if (error) {
                console.error("Ошибка при получении DateReset:", error);
                return res.status(500).json({ success: false, error: "Ошибка сервера" });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, error: "Запись в user_results не найдена" });
            }

            res.json({ success: true, dateReset: results[0].DateReset });
        });
    });
});
app.post('/get-average-score', (req, res) => {
    const { userName, userSurname, fatherName } = req.body;

    if (!userName || !userSurname) {
        return res.status(400).json({ success: false, error: "Не хватает данных" });
    }

    const getUserIdQuery = `
        SELECT id FROM allusers 
        WHERE name = ? AND surname = ? AND (Fathername = ? OR Fathername IS NULL)
        LIMIT 1
    `;

    connection.query(getUserIdQuery, [userName, userSurname, fatherName], (error, results) => {
        if (error) {
            console.error('Ошибка при получении userId:', error);
            return res.status(500).json({ success: false, error: "Ошибка сервера" });
        }
        if (results.length === 0) {
            return res.json({ averageScore: null }); // Возвращаем null, если пользователь не найден
        }

        const userId = results[0].id;
        console.log(userId);
        const getAverageScoreQuery = `
            SELECT AVG(score) AS averageScore 
            FROM user_results 
            WHERE IDuser = ? AND score IS NOT NULL
        `;

        connection.query(getAverageScoreQuery, [userId], (error, results) => {
            console.log(results);
            if (error) {
                console.error('Ошибка при вычислении среднего балла:', error);
                return res.status(500).json({ success: false, error: "Ошибка сервера" });
            }
            // Проверяем, есть ли результаты
            if (!results.length || results[0].averageScore === null) {
                return res.json({ averageScore: null }); // Если нет данных
            }

            res.json({ averageScore: parseFloat(results[0].averageScore) }); // Округляем на клиенте
        });
    });
});


app.post("/get-table-data", (req, res) => {
    const setMaxLen = "SET SESSION group_concat_max_len = 100000;";

const getColumnsYesNo = "SELECT GROUP_CONCAT(CONCAT('IF(COUNT(CASE WHEN p.name = ''', LEFT(p.name, 50), ''' THEN 1 END) > 0, ''да'', ''нет'') AS `', LEFT(p.name, 50), '`')) AS columns_yes_no FROM program p;";

const getColumnsAvgScore = "SELECT GROUP_CONCAT(CONCAT('AVG(CASE WHEN p.name = ''', LEFT(p.name, 50), ''' THEN ur.score END) AS среднее_', REPLACE(REPLACE(LEFT(p.name, 50), ' ', '_'), '-', '_'))) AS columns_avg_score FROM program p;";

    const createFinalQuery = (columnsYesNo, columnsAvgScore) => {
        return `
            DROP TEMPORARY TABLE IF EXISTS temp_table_yes_no;
            CREATE TEMPORARY TABLE temp_table_yes_no AS
            SELECT u.id AS user_id, u.surname, u.name, u.fathername, u.password, u.role, u.picture, ${columnsYesNo}
            FROM allusers u
            LEFT JOIN user_program up ON u.id = up.idusers
            LEFT JOIN program p ON up.programid = p.idprogram
            LEFT JOIN user_results ur ON u.id = ur.IDuser
            LEFT JOIN section s ON ur.sectionid = s.idsection
            LEFT JOIN module m ON s.moduleid = m.idmodule
            LEFT JOIN program prog ON m.progid = prog.idprogram
            GROUP BY u.id
            ORDER BY u.id;

            DROP TEMPORARY TABLE IF EXISTS temp_table_avg_score;
            CREATE TEMPORARY TABLE temp_table_avg_score AS
            SELECT al.ID AS user_id, ${columnsAvgScore}
            FROM allusers al
            LEFT JOIN user_results ur ON al.ID = ur.IDuser
            LEFT JOIN test t ON ur.tid = t.idtest
            LEFT JOIN section s ON t.secid = s.idsection
            LEFT JOIN module m ON s.moduleid = m.idmodule
            LEFT JOIN program p ON m.progid = p.idprogram
            GROUP BY al.ID;

            SELECT t1.*, t2.*
            FROM temp_table_yes_no t1
            LEFT JOIN temp_table_avg_score t2 ON t1.user_id = t2.user_id;
        `;
    };

    connection.query(setMaxLen, err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }

       
        connection.query(getColumnsYesNo, (err, resultYesNo) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: err.message });
            }

            const columnsYesNo = resultYesNo[0].columns_yes_no;


            connection.query(getColumnsAvgScore, (err, resultAvgScore) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: err.message });
                }

                const columnsAvgScore = resultAvgScore[0].columns_avg_score;

                const finalQuery = createFinalQuery(columnsYesNo, columnsAvgScore);

                connection.query(finalQuery, (err, results) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ success: true, rows: results[results.length-1] });
                });
            });
        });
    });
});
app.post('/read-table-user', (req, res) => {
    let sql = `
        SET @sql = NULL;
        
        SELECT GROUP_CONCAT(
            CONCAT('MAX(CASE WHEN p.name = ''', p.name, ''' THEN ''да'' ELSE ''нет'' END) AS \`прочитано_', REPLACE(p.name, '\`', '\\\`'), '\`')
        ) INTO @sql
        FROM program p;

        SET @sql = CONCAT('
        SELECT ur.IDuser, ur.sectionid, ', @sql, '
        FROM user_results ur
        JOIN section s ON ur.sectionid = s.idsection
        JOIN module m ON s.moduleid = m.idmodule
        LEFT JOIN program p ON m.progid = p.idprogram
        GROUP BY ur.IDuser, ur.sectionid;');

        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    `;

    connection.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
        res.json({ success: true, rows: results[results.length-2] });
    });
});
app.post("/table-add-user", (req, res) => {
    const Name = 'Имя';
    const Password = '11111';
    const Surname = 'Фамилия';
    const Role = 'Роль';
    const Fathername = 'Отчество';
  
    const query = "INSERT INTO allusers (Name, Password, Surname, Role, Fathername) VALUES (?, ?, ?, ?, ?)";
    connection.query(query, [Name, Password, Surname, Role, Fathername], (err, result) => {
      if (err) {
        console.error("Error inserting user: ", err);
        return res.status(500).json({ error: "Database error." });
      }
      res.json({ success: true,  userId: result.insertId});
    });
  });
  app.post("/delete-all-users-except-1", (req, res) => {
    const { excludeId } = req.body; 
  
    const sqlDeleteUsers = "DELETE FROM allusers WHERE ID != ?";
  
    connection.query(sqlDeleteUsers, [excludeId], function (err, result) {
      if (err) {
        console.error("Ошибка при удалении пользователей:", err);
        return res.json({ success: false, message: "Ошибка при удалении пользователей" });
      }
  
      console.log("Пользователи, кроме ID = 1, успешно удалены");
      return res.json({ success: true, message: "Все пользователи, кроме ID = 1, были удалены." });
    });
  });
app.post("/table-update-user", function (req, res) {
    const { user_id, field, value } = req.body;
    const allUserFields = ["name", "password", "surname", "role", "fathername"];
    if (!user_id || !field) {
      return res.json({ success: false, message: "Некорректные данные" });
    }
    if(allUserFields.includes(field)){
    const sql = "UPDATE allusers SET ?? = ? WHERE ID = ?";
    const values = [field, value, user_id];
  
    connection.query(sql, values, function (err, result) {
      if (err) {
        console.error("Ошибка при обновлении пользователя:", err);
        return res.json({ success: false, message: "Ошибка обновления" });
      }
  
      res.json({ success: true, message: "Данные обновлены" });
    });
    }
    else if (field === "picture") {
        if(value==="нет"){
        const sql = "UPDATE allusers SET picture = NULL, minipicture = NULL WHERE ID = ?";
        connection.query(sql, [user_id], function (err, result) {
          if (err) {
            console.error("Ошибка при удалении картинки:", err);
            return res.json({ success: false, message: "Ошибка при удалении картинки" });
          }
      
          res.json({ success: true, message: "Картинка удалена" });
        });
    }
    else {
        res.json({ success: true, message: "Данные обновлены" });
    }
      }
    else{
        // Получаем progId из таблицы program по полю name
        const sqlGetProgId = "SELECT idprogram FROM program WHERE name = ?";
        connection.query(sqlGetProgId, [field], function (err, result) {
          if (err) {
            console.error("Ошибка при получении progId:", err);
            return res.json({ success: false, message: "Ошибка получения progId" });
          }
        if (result.length > 0) {
            const progId = result[0].idprogram;
            if (value === 'да') {
                // Проверяем, существует ли уже запись с такими IDusers и programid
                const sqlCheckUserProgram = "SELECT COUNT(*) AS count FROM user_program WHERE IDusers = ? AND programid = ?";
                connection.query(sqlCheckUserProgram, [user_id, progId], function (err, results) {
                    if (err) {
                        console.error("Ошибка при проверке существующей записи в user_program:", err);
                        return res.json({ success: false, message: "Ошибка при проверке записи" });
                    }
            
                    if (results[0].count === 0) {
                        // Если записи нет, вставляем новую
                        const sqlInsertUserProgram = "INSERT INTO user_program (IDusers, programid) VALUES (?, ?)";
                        connection.query(sqlInsertUserProgram, [user_id, progId], function (err, result) {
                            if (err) {
                                console.error("Ошибка при вставке записи в user_program:", err);
                                return res.json({ success: false, message: "Ошибка при вставке записи" });
                            }
                            console.log("Запись успешно добавлена в user_program");
                            res.json({ success: true, message: "Запись добавлена" });
                        });
                    } else {
                        console.log("Запись уже существует, вставка не требуется");
                        res.json({ success: true, message: "Запись уже существует" });
                    }
                });
            }            
            else{
                    // Удаляем запись из таблицы user_program по имени и progId
                const sqlDeleteUserProgram = "DELETE FROM user_program WHERE IDusers = ? AND programid = ?";
            connection.query(sqlDeleteUserProgram, [user_id, progId], function (err, result) {
            if (err) {
            console.error("Ошибка при удалении записи из user_program:", err);
                    return res.json({ success: false, message: "Ошибка при удалении записи из user_program" });
            }

                console.log("Запись успешно удалена из user_program");
                });
            }
        }
        else {
            return res.json({ success: false, message: "Программа с таким названием не найдена" });
    }
});
    }
  });
  app.post("/table-delete-user", (req, res) => {
    const { user_id } = req.body;
  
    if (!user_id) {
      return res.json({ success: false, message: "User ID is required" });
    }
  
    const sqlDeleteUser = "DELETE FROM allusers WHERE ID = ?";
    connection.query(sqlDeleteUser, [user_id], function (err, result) {
      if (err) {
        console.error("Ошибка при удалении пользователя:", err);
        return res.json({ success: false, message: "Ошибка при удалении пользователя" });
      }
  
      if (result.affectedRows === 0) {
        return res.json({ success: false, message: "Пользователь не найден" });
      }
  
      console.log("Пользователь успешно удален");
      return res.json({ success: true, message: "Пользователь удален успешно" });
    });
  });
  app.post('/get-user-messages', (req, res) => {
    const { userId } = req.body;

    const query = `
        SELECT 
            au.ID AS senderId,
            au.surname,
            au.name,
            au.fatherName,
            au.miniPicture,
            au.role,
            au.birth,
            m.content,
            m.is_read,
            m.timestamp
        FROM allusers au
        LEFT JOIN (
            SELECT m1.*
            FROM messages m1
            INNER JOIN (
                SELECT sender_id, MAX(timestamp) AS max_time
                FROM messages
                WHERE receiver_id = ? AND is_read = 0
                GROUP BY sender_id
            ) latest ON latest.sender_id = m1.sender_id AND latest.max_time = m1.timestamp
            WHERE m1.receiver_id = ? AND m1.is_read = 0
        ) m ON m.sender_id = au.ID
        WHERE au.ID != ?
        ORDER BY 
            m.timestamp DESC
    `;

    connection.query(query, [userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Ошибка при извлечении:', err);
            return res.status(500).json({ error: 'Ошибка на сервере' });
        }

        const processed = results.map(row => {
            let messagePreview = 'Новых сообщений не получено!';
            if (row.content && row.content.trim() !== '') {
                messagePreview = row.content;
            }

            return {
                senderId: row.senderId,
                surname: row.surname,
                name: row.name,
                fatherName: row.fatherName,
                miniPicture: row.miniPicture
                    ? `data:image/png;base64,${Buffer.from(row.miniPicture).toString('base64')}`
                    : null,
                content: messagePreview,
                role: row.role,
                birth: row.birth
            };
        });

        res.json(processed);
    });
});
app.post('/get-admin-info', (req, res) => {
    const query = `
        SELECT 
            ID AS senderId,
            surname,
            name,
            fatherName,
            miniPicture,
            birth
        FROM allusers
        WHERE ID = 1
        LIMIT 1
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении администратора:', err);
            return res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Администратор не найден' });
        }

        const admin = results[0];
        res.json({
            success: true,
            senderId: admin.senderId,
            surname: admin.surname,
            name: admin.name,
            fatherName: admin.fatherName,
            miniPicture: admin.miniPicture
                ? `data:image/png;base64,${Buffer.from(admin.miniPicture).toString('base64')}`
                : null,
            role: admin.role,
            birth: admin.birth
        });
    });
});
app.post('/get-chat-history', (req, res) => {
    const { senderId, receiverId } = req.body;

    const query = `
        SELECT 
            id,
            sender_id,
            receiver_id,
            content,
            timestamp
        FROM messages
        WHERE 
            (sender_id = ? AND receiver_id = ?) OR 
            (sender_id = ? AND receiver_id = ?)
        ORDER BY timestamp ASC
    `;

    connection.query(query, [senderId, receiverId, receiverId, senderId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении истории сообщений:', err);
            return res.status(500).json({ error: 'Ошибка на сервере' });
        }

        res.json(results);
    });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map(); // userId -> Map(tabId -> ws)

wss.on('connection', (ws) => {
    let currentUserId = null;
    let currentTabId = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'init') {
                currentUserId = data.userId;
                currentTabId = data.tabId;

                if (!clients.has(currentUserId)) {
                    clients.set(currentUserId, new Map());
                }

                clients.get(currentUserId).set(currentTabId, ws);
                console.log(`🟢 Подключено: user ${currentUserId}, tab ${currentTabId}`);
            }

            if (data.type === 'message') {
                const { senderId, receiverId, content } = data;

                const query = `
                    INSERT INTO messages (sender_id, receiver_id, content, timestamp)
                    VALUES (?, ?, ?, NOW())
                `;

                connection.query(query, [senderId, receiverId, content], (err) => {
                    if (err) {
                        console.error('❌ DB error:', err);
                        ws.send(JSON.stringify({ type: 'error', message: 'DB error' }));
                        return;
                    }

                    const payload = JSON.stringify({
                        type: 'new-message',
                        message: { sender_id: senderId, receiver_id: receiverId, content }
                    });

                    // отправить всем вкладкам получателя
                    if (clients.has(receiverId)) {
                        for (const [, clientWs] of clients.get(receiverId)) {
                            if (clientWs.readyState === WebSocket.OPEN) {
                                clientWs.send(payload);
                            }
                        }
                    }

                    // отправить всем вкладкам отправителя
                    if (clients.has(senderId)) {
                        for (const [, clientWs] of clients.get(senderId)) {
                            if (clientWs.readyState === WebSocket.OPEN) {
                                clientWs.send(payload);
                            }
                        }
                    }
                });
            }
        } catch (e) {
            console.error('⚠️ Ошибка разбора сообщения:', e);
        }
    });

    ws.on('close', () => {
        if (currentUserId && currentTabId) {
            const userTabs = clients.get(currentUserId);
            if (userTabs) {
                userTabs.delete(currentTabId);
                console.log(`🔴 Отключено: user ${currentUserId}, tab ${currentTabId}`);

                if (userTabs.size === 0) {
                    clients.delete(currentUserId);
                }
            }
        }
    });
});
app.post('/delete-chat-history', (req, res) => {
    const { senderId, receiverId } = req.body;

    const query = `
        DELETE FROM messages
        WHERE 
            (sender_id = ? AND receiver_id = ?) OR
            (sender_id = ? AND receiver_id = ?)
    `;

    connection.query(query, [senderId, receiverId, receiverId, senderId], (err, result) => {
        if (err) {
            console.error('Ошибка при удалении переписки:', err);
            return res.status(500).json({ success: false, error: 'Ошибка на сервере' });
        }

        res.json({ success: true, message: 'Переписка удалена' });
    });
});
app.post('/mark-messages-read', (req, res) => {
    const { senderId, receiverId } = req.body;

    const query = `
        UPDATE messages 
        SET is_read = 1 
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `;

    connection.query(query, [senderId, receiverId], (err, result) => {
        if (err) {
            console.error('Ошибка при обновлении is_read:', err);
            return res.status(500).json({ error: 'DB error' });
        }

        res.json({ success: true });
    });
});
app.post('/get-user-id', (req, res) => {
    const { userName, userSurname, fatherName } = req.body;

    const query = `
        SELECT id FROM allusers 
        WHERE name = ? AND surname = ? AND fathername = ?
    `;

    connection.query(query, [userName, userSurname, fatherName], (err, results) => {
        if (err) {
            console.error('Ошибка при получении ID:', err);
            return res.status(500).json({ success: false, message: 'DB error' });
        }

        if (results.length > 0) {
            res.json({ success: true, userId: results[0].id });
        } else {
            res.json({ success: false, message: 'User not found' });
        }
    });
});
app.post('/get-unread-messages', (req, res) => {
    const { receiverId } = req.body;  // Получаем ID получателя (например, админа)

    if (!receiverId) {
        return res.json({ success: false, message: "Receiver ID is required" });
    }

    // SQL запрос для получения всех непрочитанных сообщений
    const sqlUnreadMessages = `
        SELECT sender_id, is_read
        FROM messages 
        WHERE receiver_id = ? AND is_read = 0
    `;

    connection.query(sqlUnreadMessages, [receiverId], (err, result) => {
        if (err) {
            console.error("Ошибка при получении непрочитанных сообщений:", err);
            return res.json({ success: false, message: "Ошибка при получении сообщений" });
        }

        if (result.length === 0) {
            return res.json({ success: true, messages: [] }); // Нет непрочитанных сообщений
        }

        // Считаем уникальных отправителей
        const unreadFromUsers = [];
        result.forEach(msg => {
            if (!unreadFromUsers.includes(msg.sender_id)) {
                unreadFromUsers.push(msg.sender_id);
            }
        });

        // Возвращаем количество уникальных отправителей
        return res.json({ success: true, messages: unreadFromUsers });
    });
});
app.post('/get-unread-messages-from-admin', (req, res) => {
    const { receiverId } = req.body;

    if (!receiverId) {
        return res.json({ success: false, message: "Receiver ID is required" });
    }

    const sql = `
        SELECT id, content, sender_id, receiver_id, is_read 
        FROM messages 
        WHERE receiver_id = ? AND sender_id = 1 AND is_read = 0
    `;

    connection.query(sql, [receiverId], (err, results) => {
        if (err) {
            console.error("Ошибка при получении непрочитанных сообщений:", err);
            return res.json({ success: false, message: "Ошибка при запросе" });
        }

        res.json({ success: true, messages: results });
    });
});
const sessions = [];

function isSameUser(a, b) {
    return a.userName === b.userName &&
           a.userSurname === b.userSurname &&
           a.fatherName === b.fatherName;
}

app.post('/check-user-test', (req, res) => {
    const newUser = req.body;
    const exists = sessions.some(user => isSameUser(user, newUser));

    if (!exists) {
        sessions.push(newUser);
        console.log(`Пользователь добавлен: ${newUser.userName} ${newUser.userSurname} ${newUser.fatherName}`);
        console.log(sessions);
        return res.json({ success: true, created: true });
    }

    res.json({ success: true, created: false });
});

app.post('/delete-user-test', (req, res) => {
    const targetUser = req.body;
    const index = sessions.findIndex(user => isSameUser(user, targetUser));

    if (index !== -1) {
        sessions.splice(index, 1);
        console.log(sessions);
        console.log(`Пользователь удалён: ${targetUser.userName} ${targetUser.userSurname} ${targetUser.fatherName}`);
        return res.json({ success: true });
    }

    res.status(404).json({ success: false, message: "Пользователь не найден" });
});
setInterval(() => {
    sessions.length = 0;
    console.log('Sessions очищены автоматически каждые 6 часов');
}, 6 * 60 * 60 * 1000); 
app.post('/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true });
});
//tests
//test2
server.listen(port, '192.168.100.2', () => {
    console.log(`HTTP/WebSocket сервер доступен по адресу http://192.168.100.2:${port}`);
});
//test3