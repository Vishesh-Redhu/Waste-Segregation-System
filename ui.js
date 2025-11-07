let charts = {};
export const STATUS = {
    OFFLINE: { text: "Ready [Offline]", color: "bg-gray-400", pulse: false },
    ONLINE: { text: "Ready [Online]", color: "bg-green-500", pulse: false },
    RUNNING: { text: "Simulation Running", color: "bg-blue-500", pulse: true },
    STOPPED: { text: "Stopped", color: "bg-red-500", pulse: false }
};

// --- START: Dark Mode Additions ---
const ICON_SUN = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 4.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`;
const ICON_MOON = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`;

const DARK_MODE_COLORS = {
    text: '#E5E7EB', // gray-200
    grid: 'rgba(255, 255, 255, 0.1)', // White with 10% opacity
    placeholder: '#6B7280' // gray-500
};
const LIGHT_MODE_COLORS = {
    text: '#374151', // gray-700
    grid: 'rgba(0, 0, 0, 0.1)', // Black with 10% opacity
    placeholder: '#9CA3AF' // gray-400
};
// --- END: Dark Mode Additions ---

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
    // 1. --- ADDITION ---
    // We need to select the <h2> tag inside the modal to change its title
    modalTitle: document.querySelector('#item-modal h2'),
    timeFilterControls: document.getElementById('time-filter-controls'),
    sliderSpeed: document.getElementById('slider-speed'),
    sliderFaultRate: document.getElementById('slider-fault-rate'),
    faultRateValue: document.getElementById('fault-rate-value'),
    // START: Dark Mode Additions
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    iconTheme: document.getElementById('icon-theme'),
    // END: Dark Mode Additions
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

// --- START: Dark Mode Function ---
function getThemeColors() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    return isDarkMode ? DARK_MODE_COLORS : LIGHT_MODE_COLORS;
}

function updateChartTheme() {
    const colors = getThemeColors();
    
    // Update Chart.js global defaults
    Chart.defaults.color = colors.text;
    Chart.defaults.borderColor = colors.grid;

    const chartOptions = {
        scales: {
            x: {
                ticks: { color: colors.text },
                grid: { color: colors.grid }
            },
            y: {
                ticks: { color: colors.text },
                grid: { color: colors.grid },
                title: { display: true, text: 'Count', color: colors.text }
            }
        },
        plugins: {
            legend: {
                labels: { color: colors.text }
            }
        }
    };
    
    const doughnutOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: colors.text, boxWidth: 12 }
            }
        }
    };

    // Update all charts
    if (charts.trend) {
        charts.trend.options.scales.x.ticks.color = colors.text;
        charts.trend.options.scales.x.grid.color = colors.grid;
        charts.trend.options.scales.y.ticks.color = colors.text;
        charts.trend.options.scales.y.grid.color = colors.grid;
        charts.trend.options.scales.y.title.color = colors.text;
        charts.trend.options.plugins.legend.labels.color = colors.text;
        charts.trend.update();
    }
    if (charts.categories) {
        charts.categories.options.plugins.legend = doughnutOptions.plugins.legend;
        charts.categories.update();
    }
    if (charts.recycle) {
        charts.recycle.options.plugins.legend = doughnutOptions.plugins.legend;
        charts.recycle.update();
    }
    
    // Update placeholders
    Object.values(elements.placeholders).forEach(p => {
        if (p) p.style.color = colors.placeholder;
    });
}

function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    
    if (html.classList.contains('dark')) {
        localStorage.theme = 'dark';
        elements.iconTheme.innerHTML = ICON_SUN;
    } else {
        localStorage.theme = 'light';
        elements.iconTheme.innerHTML = ICON_MOON;
    }
    
    // Update charts with new theme colors
    updateChartTheme();
}
// --- END: Dark Mode Function ---


export function initUI(callbacks) {
    WASTE_DECK_CONFIG.forEach(config => {
        if(config.position === 'hidden') return;
        const bin = document.createElement('div');
        bin.id = `bin-${config.type}`;
        bin.className = `bin ${config.position} bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col items-center justify-center border-2 border-gray-300 dark:border-gray-600 transition-all duration-300`;
        bin.innerHTML = `<span class="font-bold text-sm dark:text-gray-200">${config.type}</span>`;
        bin.style.setProperty('--glow-color', config.color + '80');
        elements.sortingStation.appendChild(bin);
    });

    // --- START: Dark Mode Edit ---
    // Set initial theme for charts before creating them
    updateChartTheme();
    // --- END: Dark Mode Edit ---
    
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

    // --- START: Dark Mode Additions ---
    elements.btnThemeToggle.onclick = toggleTheme;
    // Set initial icon
    if (document.documentElement.classList.contains('dark')) {
        elements.iconTheme.innerHTML = ICON_SUN;
    } else {
        elements.iconTheme.innerHTML = ICON_MOON;
    }
    // --- END: Dark Mode Additions ---

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

    /*
     * ===================================================================================
     * EFFICIENCY FIX (MAJOR)
     * ===================================================================================
     * NEW CODE (O(N)):
     * We use a *single* `forEach` loop to calculate all statistics at once.
     * ===================================================================================
     */

    let correct = 0;
    let throughputCount = 0;
    const categoryCounts = {};
    const recycleCounts = { recycled: 0, dumped: 0 };
    const trendAggregated = {};

    const now = Date.now();
    const trendInterval = 5000; // 5 seconds
    
    data.forEach(item => {
        // 1. Accuracy
        if (item.prediction === item.actual) {
            correct++;
        }

        // 2. Throughput (items in the last 60s)
        if ((now - item.timestamp) < 60000) {
            throughputCount++;
        }

        // 3. Category Counts
        categoryCounts[item.actual] = (categoryCounts[item.actual] || 0) + 1;

        // 4. Recycle Counts
        item.recyclable ? recycleCounts.recycled++ : recycleCounts.dumped++;
        
        // 5. Trend Data (aggregated into 5s buckets)
        const timeKey = Math.floor(item.timestamp / trendInterval) * trendInterval;
        trendAggregated[timeKey] = (trendAggregated[timeKey] || 0) + 1;
    });

    // ----- END EFFICIENCY FIX -----

    const accuracy = (correct / total) * 100;
    elements.kpiTotal.textContent = total;
    elements.kpiAccuracy.textContent = `${accuracy.toFixed(1)}%`;
    // --- START: Dark Mode Edit ---
    elements.kpiAccuracy.style.color = accuracy < 85 
        ? (document.documentElement.classList.contains('dark') ? '#EF4444' : '#DC2626') // red-500 / red-600
        : (document.documentElement.classList.contains('dark') ? '#22C55E' : '#16A34A'); // green-500 / green-600
    // --- END: Dark Mode Edit ---
    elements.kpiThroughput.innerHTML = `${throughputCount} <span class="text-xl font-medium">items/min</span>`;

    // Update Category Chart
    charts.categories.data.labels = Object.keys(categoryCounts);
    charts.categories.data.datasets[0].data = Object.values(categoryCounts);
    charts.categories.data.datasets[0].backgroundColor = Object.keys(categoryCounts).map(key => WASTE_DECK_CONFIG.find(c => c.type === key)?.color || '#9CA3AF');
    charts.categories.update();

    // Update Recycle Chart
    charts.recycle.data.datasets[0].data = [recycleCounts.recycled, recycleCounts.dumped];
    charts.recycle.update();
    
    // Update Trend Chart
    const trendData = Object.keys(trendAggregated).map(key => ({ x: parseInt(key), y: trendAggregated[key] })).sort((a,b) => a.x - b.x);
    charts.trend.data.datasets[0].data = trendData;
    charts.trend.update('quiet');

    // Update log
    updateEventLog(data, showModal);
}

function updateEventLog(data, onLogClick) {
    elements.logContainer.innerHTML = ''; // This is inefficient but simple
    data.slice(-10).reverse().forEach(item => {
        const isCorrect = item.prediction === item.actual;
        const logEntry = document.createElement('div');
        // --- START: Dark Mode Edit ---
        logEntry.className = `p-1.5 border-b dark:border-gray-600 text-sm ${isCorrect ? 'dark:text-gray-200' : 'bg-red-100 dark:bg-red-900/50 dark:text-gray-100'} cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`;
        // --- END: Dark Mode Edit ---
        logEntry.innerHTML = `<span class="font-mono text-xs">${new Date(item.timestamp).toLocaleTimeString()}</span>: Actual: <strong>${item.actual}</strong>, Predicted: ${item.prediction}`;
        logEntry.onclick = () => onLogClick(item);
        elements.logContainer.appendChild(logEntry);
    });
}

function showModal(item) {
    const isCorrect = item.prediction === item.actual;
    // 2. --- MODIFICATION ---
    // Make sure the title is reset to "Item Inspection"
    elements.modalTitle.textContent = "Item Inspection";

    // --- START: Dark Mode Edit ---
    elements.modalContent.innerHTML = `<p><strong>Item ID:</strong> <span class="font-mono text-sm">${item.id}</span></p>
        <p><strong>Timestamp:</strong> ${new Date(item.timestamp).toLocaleString()}</p>
        <hr class="my-3 dark:border-gray-700">
        <p><strong>Actual Material:</strong> <span class="font-semibold">${item.actual}</span></p>
        <p><strong>ML Prediction:</strong> <span class="font-semibold">${item.prediction}</span></p>
        <p><strong>Confidence Score:</strong> <span class="font-semibold">${(item.confidence * 100).toFixed(1)}%</span></p>
        <p class="mt-2"><strong>Result:</strong> 
            <span class="font-bold text-lg ${isCorrect ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}">
                ${isCorrect ? '✓ Correctly Sorted' : '✗ Incorrectly Sorted'}
            </span>
        </p>`;
    // --- END: Dark Mode Edit ---
    
    // 3. --- MODIFICATION ---
    // Clean up any buttons from the confirmation modal, just in case
    document.getElementById('modal-buttons')?.remove();
    
    elements.modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => { elements.modalDialog.classList.remove('opacity-0', 'scale-95'); }, 10);
}

function hideModal() {
    elements.modalDialog.classList.add('opacity-0', 'scale-95');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => { 
        elements.modal.classList.add('hidden'); 
        // 4. --- MODIFICATION ---
        // Always clean up buttons when modal is hidden
        document.getElementById('modal-buttons')?.remove();
    }, 300);
}

// 5. --- NEW FUNCTION ---
/**
 * Displays a confirmation modal using the existing modal UI.
 * @param {string} title - The title for the modal.
 * @param {string} message - The confirmation message.
 * @param {function} onConfirm - Callback function to run if "Confirm" is clicked.
 */
export function showConfirmationModal(title, message, onConfirm) {
    // Set the title and message
    elements.modalTitle.textContent = title;
    elements.modalContent.innerHTML = `<p class="dark:text-gray-300">${message}</p>`;

    // Clean up old buttons just in case
    document.getElementById('modal-buttons')?.remove();

    // Create new button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'modal-buttons';
    buttonContainer.className = 'flex justify-end gap-3 mt-5';

    // Create Cancel Button
    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Cancel';
    btnCancel.className = 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg transition-colors';
    btnCancel.onclick = () => hideModal();

    // Create Confirm Button (styled to be more "dangerous")
    const btnConfirm = document.createElement('button');
    btnConfirm.textContent = 'Confirm';
    btnConfirm.className = 'bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors';
    btnConfirm.onclick = () => {
        onConfirm(); // Run the callback function
        hideModal(); // Close the modal
    };

    // Add buttons to the modal
    buttonContainer.appendChild(btnCancel);
    buttonContainer.appendChild(btnConfirm);
    elements.modalContent.appendChild(buttonContainer);

    // Show the modal
    elements.modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    setTimeout(() => { elements.modalDialog.classList.remove('opacity-0', 'scale-95'); }, 10);
}
// --- END NEW FUNCTION ---


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