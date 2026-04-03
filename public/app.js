const API_URL = '/api/data';

// Функция добавления данных из формы
document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        daVinciNumber: document.getElementById('daVinciNumber').value,
        name: document.getElementById('name').value,
        company: document.getElementById('company').value,
        division: document.getElementById('division').value,
        supervisorName: document.getElementById('supervisorName').value,
        mentorName: document.getElementById('mentorName').value,
        sacRanking: document.getElementById('sacRanking').value,
        rig: document.getElementById('rig').value,
        daysOnRig: Number(document.getElementById('daysOnRig').value) || 0,
        dateIn: document.getElementById('dateIn').value,
        dateOut: document.getElementById('dateOut').value,
        dateOnboard: document.getElementById('dateOnboard').value,
        sseRate: document.getElementById('sseRate').value
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (response.ok) {
        location.reload(); // Перезагружаем страницу, чтобы увидеть новую строку
    } else {
        alert("Ошибка при сохранении данных!");
    }
});

// Загрузка данных при открытии сайта
async function loadData() {
    try {
        const res = await fetch(API_URL);
        const rawData = await res.json();
        renderTable(rawData);
    } catch (err) {
        console.error("Не удалось загрузить данные:", err);
    }
}

// Отрисовка таблицы и расчеты
function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const today = new Date();
    today.setHours(0,0,0,0);

    // Считаем общую сумму Days on Rig для каждого DaVinci Number
    const totalsByDaVinci = {};
    data.forEach(item => {
        const num = item.daVinciNumber;
        totalsByDaVinci[num] = (totalsByDaVinci[num] || 0) + (Number(item.daysOnRig) || 0);
    });

    data.forEach((row) => {
        // Расчет SSE Days
        const dIn = new Date(row.dateIn);
        const dOut = row.dateOut ? new Date(row.dateOut) : today;
        const sseDays = Math.max(0, Math.floor((dOut - dIn) / (1000 * 60 * 60 * 24)));

        // Расчет Days to Complete SAC по рейтингу
        const sacDaysMap = { 'low': 14, 'medium': 56, 'high': 86 };
        const daysToSAC = sacDaysMap[row.sacRanking] || 0;
        
        // Расчет даты завершения SAC
        const dateToSAC = new Date(dIn.getTime() + (daysToSAC * 24 * 60 * 60 * 1000));
        
        // Условия для статуса и цвета
        const isPastSacDate = today >= dateToSAC;
        const totalRig = totalsByDaVinci[row.daVinciNumber];
        const isHighlight = totalRig >= sseDays;

        const tr = document.createElement('tr');
        if (isHighlight) tr.style.backgroundColor = '#cce5ff'; // Голубой фон

        tr.innerHTML = `
            <td>${row.daVinciNumber}</td>
            <td>${row.name}</td>
            <td>${row.company}</td>
            <td>${row.division}</td>
            <td>${row.supervisorName}</td>
            <td>${row.mentorName}</td>
            <td style="text-transform: capitalize">${row.sacRanking}</td>
            <td>${sseDays}</td>
            <td>${row.rig}</td>
            <td>${row.daysOnRig}</td>
            <td>${row.dateIn}</td>
            <td>${row.dateOut || '-'}</td>
            <td>${row.dateOnboard || '-'}</td>
            <td>${daysToSAC}</td>
            <td>${dateToSAC.toISOString().split('T')[0]}</td>
            <td style="font-weight: bold">${isHighlight ? 'COMPLETE' : (isPastSacDate ? 'yes' : 'no')}</td>
            <td class="rate-${row.sseRate.toLowerCase()}">${row.sseRate}</td>
            <td><button class="del-btn" onclick="deleteRow('${row._id}')">❌</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Функция удаления с запросом пароля
async function deleteRow(id) {
    const password = prompt("Введите пароль администратора (201214) для удаления:");
    
    if (!password) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
    });

    if (res.ok) {
        location.reload();
    } else {
        alert("Неверный пароль! Доступ запрещен.");
    }
}

// Экспорт в PDF
document.getElementById('pdfBtn').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text("SAC & Rig Tracker Report", 14, 10);
    doc.autoTable({ html: '#mainTable', startY: 15, styles: { fontSize: 8 } });
    doc.save('SAC_Report.pdf');
};

// Запуск при старте
loadData();