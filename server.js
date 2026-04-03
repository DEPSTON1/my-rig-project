const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Подключение к MongoDB (ссылка берется из настроек Render)
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('База данных успешно подключена!'))
    .catch(err => console.error('Ошибка подключения к БД:', err));

// Описание структуры данных (Схема)
const RecordSchema = new mongoose.Schema({
    daVinciNumber: String,
    name: String,
    company: String,
    division: String,
    supervisorName: String,
    mentorName: String,
    sacRanking: String,
    rig: String,
    daysOnRig: Number,
    dateIn: String,
    dateOut: String,
    dateOnboard: String,
    sseRate: String
});

const Record = mongoose.model('Record', RecordSchema);

// 1. Получить все данные из базы
app.get('/api/data', async (req, res) => {
    try {
        const data = await Record.find();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 2. Добавить новую строку
app.post('/api/data', async (req, res) => {
    try {
        const newRow = new Record(req.body);
        await newRow.save();
        res.json(newRow);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// 3. Удалить строку (ЗАЩИТА ПАРОЛЕМ 201214)
app.delete('/api/data/:id', async (req, res) => {
    const userPassword = req.headers['x-admin-password'];
    const MASTER_PASSWORD = "201214"; // Твой секретный код

    if (userPassword === MASTER_PASSWORD) {
        try {
            await Record.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: "Запись удалена" });
        } catch (e) {
            res.status(500).json({ error: "Ошибка при удалении из базы" });
        }
    } else {
        // Если пароль неверный
        res.status(403).json({ error: "Доступ запрещен: неверный пароль" });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));