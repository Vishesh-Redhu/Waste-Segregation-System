let charts = {};
export const STATUS = {
    OFFLINE: { text: "Ready [Offline]", color: "bg-gray-400", pulse: false },
    ONLINE: { text: "Ready [Online]", color: "bg-green-500", pulse: false },
    RUNNING: { text: "Simulation Running", color: "bg-blue-500", pulse: true },
    STOPPED: { text: "Stopped", color: "bg-red-500", pulse: false }
};

export const elements = {
    statusText: document.getElementById('status-text'),
    statusDot: document.getElementById('status-dot'),
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnClear: document.getElementById('btn-clear'),
    checkFault: document.getElementById('check-fault'),
    kpiTotal: document.getElementById('kpi-total'),
    kpiAccuracy: document.getElementById('kpi-accuracy'),
    kpiThroughput: document.getElementById('kpi-throughput'),
    logContainer: document.getElementById('event-log'),
    sortingStation: document.getElementById('sorting-station'),
    scanner: document.getElementById('scanner'),
    modal: document.getElementById('item-modal'),
    modalDialog: document.getElementById('modal-dialog'),
    modalContent: document.getElementById('modal-content'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    timeFilterControls: document.getElementById('time-filter-controls'),
    sliderSpeed: document.getElementById('slider-speed'),
    sliderFaultRate: document.getElementById('slider-fault-rate'),
    faultRateValue: document.getElementById('fault-rate-value'),
    placeholders: {
        trend: document.getElementById('trend-placeholder'),
        categories: document.getElementById('categories-placeholder'),
        recycle: document.getElementById('recycle-placeholder')
    }
};

export const WASTE_DECK_CONFIG = [
    { type: 'Plastic', recyclable: true, color: '#3B82F6', position: 'row-start-1 col-start-1' },
    { type: 'Paper', recyclable: true, color: '#F59E0B', position: 'row-start-1 col-start-2' },
    { type: 'Metal', recyclable: true, color: '#6B7280', position: 'row-start-1 col-start-3' },
    { type: 'Glass', recyclable: true, color: '#10B981', position: 'row-start-2 col-start-3' },
    { type: 'Organic', recyclable: false, color: '#F97316', position: 'row-start-3 col-start-3' },
    { type: 'E-Waste', recyclable: false, color: '#8B5CF6', position: 'row-start-3 col-start-2' },
    { type: 'Textiles', recyclable: false, color: '#DB2777', position: 'row-start-3 col-start-1' },
    { type: 'Cardboard', recyclable: true, color: '#A16207', position: 'row-start-2 col-start-1' },
    { type: 'Non-Recyclable', recyclable: false, color: '#EF4444', position: 'hidden' }
];

const CHART_EMPTY_MESSAGE = 'No data for this period. Start the simulation to see live analytics.';

export function initUI(callbacks) {
    WASTE_DECK_CONFIG.forEach(config => {
        if(config.position === 'hidden') return;
        const bin = document.createElement('div');
        bin.id = `bin-${config.type}`;
        bin.className = `bin ${config.position} bg-white rounded-lg shadow flex flex-col items-center justify-center border-2 border-gray-300 transition-all duration-300`;
        bin.innerHTML = `<span class="font-bold text-sm">${config.type}</span>`;
        bin.style.setProperty('--glow-color', config.color + '80');
        elements.sortingStation.appendChild(bin);
    });
    const chartOptions = { responsive: true, maintainAspectRatio: false, animation: { duration: 500 } };
    const doughnutChartOptions = { ...chartOptions, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }, layout: { padding: 10 } };
    charts.categories = new Chart(document.getElementById('chart-categories').getContext('2d'), { type: 'doughnut', data: { labels: [], datasets: [{ data: [] }] }, options: doughnutChartOptions });
    charts.recycle = new Chart(document.getElementById('chart-recycle').getContext('2d'), { type: 'pie', data: { labels: ['Recycled', 'Dumped'], datasets: [{ data: [0,0], backgroundColor: ['#16A34A', '#DC2626'] }] }, options: doughnutChartOptions });
    charts.trend = new Chart(document.getElementById('chart-trend').getContext('2d'), { type: 'line', data: { datasets: [{ label: 'Items Processed', data: [], tension: 0.2, pointRadius: 2, fill: true, backgroundColor: 'rgba(59, 130, 246, 0.2)', borderColor: 'rgba(59, 130, 246, 1)' }] }, options: { ...chartOptions, scales: { x: { type: 'time', time: { unit: 'second', displayFormats: { second: 'h:mm:ss a'} }, ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true, title: { display: true, text: 'Count' } } } }});
    
    Object.values(callbacks).forEach(cb => {
        if (typeof cb !== 'function') console.error("Invalid callback provided to initUI");
    });

    elements.btnCloseModal.onclick = () => hideModal();
    elements.modal.onclick = (e) => { if (e.target === elements.modal) hideModal(); };
    elements.btnStart.onclick = callbacks.onStart;
    elements.btnStop.onclick = callbacks.onStop;
    elements.btnClear.onclick = callbacks.onClear;
    elements.checkFault.onchange = callbacks.onFaultToggle;
    elements.sliderSpeed.oninput = callbacks.onSpeedChange;
    elements.sliderFaultRate.oninput = callbacks.onFaultRateChange;
    elements.timeFilterControls.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const filterValue = e.target.dataset.filter;
            callbacks.onFilterChange(filterValue);
            elements.timeFilterControls.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        }
    });
    updateStatus(STATUS.OFFLINE);
}

export function updateAnalytics(data) {
    const total = data.length;
    const placeholders = elements.placeholders;
    
    if(total === 0) {
         elements.kpiTotal.textContent = 0;
         elements.kpiAccuracy.textContent = '--%';
         elements.kpiThroughput.innerHTML = `0 <span class="text-xl font-medium">items/min</span>`;
         Object.values(charts).forEach(chart => {
             chart.data.labels = [];
             chart.data.datasets.forEach(dataset => dataset.data = []);
             chart.update('none');
         });
         Object.values(placeholders).forEach(p => {
             p.textContent = CHART_EMPTY_MESSAGE;
             p.classList.remove('hidden');
         });
         updateEventLog([], showModal);
         return;
    }
    Object.values(placeholders).forEach(p => p.classList.add('hidden'));

    const correct = data.filter(item => item.prediction === item.actual).length;
    const accuracy = (correct / total) * 100;
    const throughput = data.filter(item => (Date.now() - item.timestamp) < 60000).length;
    elements.kpiTotal.textContent = total;
    elements.kpiAccuracy.textContent = `${accuracy.toFixed(1)}%`;
    elements.kpiAccuracy.style.color = accuracy < 85 ? '#DC2626' : '#16A34A';
    elements.kpiThroughput.innerHTML = `${throughput} <span class="text-xl font-medium">items/min</span>`;

    const categoryCounts = data.reduce((acc, item) => { acc[item.actual] = (acc[item.actual] || 0) + 1; return acc; }, {});
    charts.categories.data.labels = Object.keys(categoryCounts);
    charts.categories.data.datasets[0].data = Object.values(categoryCounts);
    charts.categories.data.datasets[0].backgroundColor = Object.keys(categoryCounts).map(key => WASTE_DECK_CONFIG.find(c => c.type === key)?.color || '#9CA3AF');
    charts.categories.update();

    const recycleCounts = data.reduce((acc, item) => { item.recyclable ? acc.recycled++ : acc.dumped++; return acc; }, { recycled: 0, dumped: 0 });
    charts.recycle.data.datasets[0].data = [recycleCounts.recycled, recycleCounts.dumped];
    charts.recycle.update();
    
    const interval = 5000;
    const trendAggregated = data.reduce((acc, item) => { const timeKey = Math.floor(item.timestamp / interval) * interval; acc[timeKey] = (acc[timeKey] || 0) + 1; return acc; }, {});
    const trendData = Object.keys(trendAggregated).map(key => ({ x: parseInt(key), y: trendAggregated[key] })).sort((a,b) => a.x - b.x);
    charts.trend.data.datasets[0].data = trendData;
    charts.trend.update('quiet');

    updateEventLog(data, showModal);
}

function updateEventLog(data, onLogClick) {
    elements.logContainer.innerHTML = '';
    data.slice(-10).reverse().forEach(item => {
        const isCorrect = item.prediction === item.actual;
        const logEntry = document.createElement('div');
        logEntry.className = `p-1.5 border-b text-sm ${isCorrect ? '' : 'bg-red-100'} cursor-pointer hover:bg-gray-200 transition-colors`;
        logEntry.innerHTML = `<span class="font-mono text-xs">${new Date(item.timestamp).toLocaleTimeString()}</span>: Actual: <strong>${item.actual}</strong>, Predicted: ${item.prediction}`;
        logEntry.onclick = () => onLogClick(item);
        elements.logContainer.appendChild(logEntry);
    });
}

function showModal(item) {
    const isCorrect = item.prediction === item.actual;
    elements.modalContent.innerHTML = `<p><strong>Item ID:</strong> <span class="font-mono text-sm">${item.id}</span></p><p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p><hr class="my-3"><p><strong>Actual Material:</strong> <span class="font-semibold">${item.actual}</span></p><p><strong>ML Prediction:</strong> <span class="font-semibold">${item.prediction}</span></p><p><strong>Confidence Score:</strong> <span class="font-semibold">${(item.confidence * 100).toFixed(1)}%</span></p><p class="mt-2"><strong>Result:</strong> <span class="font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-600'}">${isCorrect ? '✓ Correctly Sorted' : '✗ Incorrectly Sorted'}</span></p>`;
    elements.modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => { elements.modalDialog.classList.remove('opacity-0', 'scale-95'); }, 10);
}

function hideModal() {
    elements.modalDialog.classList.add('opacity-0', 'scale-95');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => { elements.modal.classList.add('hidden'); }, 300);
}

export function updateStatus(status) {
    elements.statusText.textContent = status.text;
    elements.statusDot.className = `w-4 h-4 ${status.color} rounded-full transition-colors`;
    status.pulse ? elements.statusDot.classList.add('animate-pulse') : elements.statusDot.classList.remove('animate-pulse');
}

export function updateSortingAnimation(item, sortedTo) {
    document.getElementById('current-item')?.remove();
    if (item) {
        const itemEl = document.createElement('div');
        itemEl.id = 'current-item';
        const config = WASTE_DECK_CONFIG.find(c => c.type === item.type);
        itemEl.className = `w-20 h-20 text-white flex flex-col items-center justify-center rounded-lg shadow-lg border-2 border-white/20 absolute z-10`;
        itemEl.style.backgroundColor = config.color;
        itemEl.innerHTML = `<span class="font-bold text-lg">${item.type}</span><span class="text-xs font-mono">${item.id}</span>`;
        document.body.appendChild(itemEl);
        const scannerRect = elements.scanner.getBoundingClientRect();
        itemEl.style.left = `${scannerRect.left + window.scrollX + (scannerRect.width / 2) - 40}px`;
        itemEl.style.top = `${scannerRect.top + window.scrollY + (scannerRect.height / 2) - 40}px`;
        itemEl.style.transition = 'all 0.8s ease-in-out';
        if (sortedTo) {
            const binEl = document.getElementById(`bin-${sortedTo}`);
            const binRect = binEl.getBoundingClientRect();
            setTimeout(() => {
                itemEl.style.left = `${binRect.left + window.scrollX + (binRect.width / 2) - 20}px`;
                itemEl.style.top = `${binRect.top + window.scrollY + (binRect.height / 2) - 20}px`;
                itemEl.style.transform = 'scale(0.3)';
                itemEl.style.opacity = '0';
                binEl.classList.add('sorted');
                setTimeout(() => binEl.classList.remove('sorted'), 500);
            }, 200);
            setTimeout(() => itemEl.remove(), 1200);
        }
    }
}

