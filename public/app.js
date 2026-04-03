const API_URL = '/api/data';

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        daVinciNumber: document.getElementById('daVinciNumber').value,
        name: document.getElementById('name').value,
        company: document.getElementById('company').value,
        division: document.getElementById('division').value,
        supervisorName: document.getElementById('supervisorName').value,
        mentorName: document.getElementById('mentorName').value,
        sseRate: document.getElementById('sseRate').value,
        rig: document.getElementById('rig').value,
        daysOnRig: Number(document.getElementById('daysOnRig').value) || 0,
        dateIn: document.getElementById('dateIn').value,
        dateOut: document.getElementById('dateOut').value || null,
        dateOnboard: document.getElementById('dateOnboard').value || null
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            location.reload(); 
        } else {
            const errData = await response.json();
            alert("Server Error: " + errData.error);
        }
    } catch (err) {
        alert("Connection Error! Check MONGO_URI in Render settings.");
    }
});

async function loadData() {
    try {
        const res = await fetch(API_URL);
        const rawData = await res.json();
        renderTable(rawData);
    } catch (err) {
        console.error("Load Error:", err);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    const today = new Date();
    today.setHours(0,0,0,0);

    const totalsByDaVinci = {};
    data.forEach(item => {
        totalsByDaVinci[item.daVinciNumber] = (totalsByDaVinci[item.daVinciNumber] || 0) + (Number(item.daysOnRig) || 0);
    });

    data.forEach((row) => {
        const dIn = new Date(row.dateIn);
        const dOut = row.dateOut ? new Date(row.dateOut) : today;
        const sseDays = Math.max(0, Math.floor((dOut - dIn) / (1000 * 60 * 60 * 24)));

        const daysMap = { 'LOW': 14, 'MEDIUM': 56, 'HIGH': 86 };
        const daysToComplete = daysMap[row.sseRate] || 0;
        const dateToComplete = new Date(dIn.getTime() + (daysToComplete * 24 * 60 * 60 * 1000));
        
        const isPastDate = today >= dateToComplete;
        const totalRig = totalsByDaVinci[row.daVinciNumber];
        const isHighlight = totalRig >= sseDays;

        const tr = document.createElement('tr');
        if (isHighlight) tr.style.backgroundColor = '#1a3a5a'; // Subtle dark blue highlight

        tr.innerHTML = `
            <td>${row.daVinciNumber}</td>
            <td>${row.name}</td>
            <td>${row.company}</td>
            <td>${row.division}</td>
            <td>${row.supervisorName}</td>
            <td>${row.mentorName}</td>
            <td class="rate-${row.sseRate.toLowerCase()}">${row.sseRate}</td>
            <td>${sseDays}</td>
            <td>${row.rig}</td>
            <td>${row.daysOnRig}</td>
            <td>${row.dateIn}</td>
            <td>${row.dateOut || '-'}</td>
            <td>${row.dateOnboard || '-'}</td>
            <td>${daysToComplete}</td>
            <td>${dateToComplete.toISOString().split('T')[0]}</td>
            <td style="font-weight: bold">${isHighlight ? 'COMPLETE' : (isPastDate ? 'YES' : 'NO')}</td>
            <td><button onclick="deleteRow('${row._id}')">🗑️</button></td>
        `;
        tbody.appendChild(tr);
    });
}

async function deleteRow(id) {
    const password = prompt("Admin Password Required:");
    if (!password) return;

    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password }
    });

    if (res.ok) location.reload();
    else alert("Access Denied: Wrong Password!");
}

document.getElementById('pdfBtn').onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.autoTable({ html: '#mainTable', theme: 'dark' });
    doc.save('SSE_Rig_Report.pdf');
};

loadData();
