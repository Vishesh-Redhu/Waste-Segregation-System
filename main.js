import { initFirebase, saveWasteData } from './firebase.js';
import { initUI, updateAnalytics, updateStatus, updateSortingAnimation, elements, STATUS } from './ui.js';
import { createSimulation } from './simulation.js';

const OFFLINE_STORAGE_KEY = 'wasteSortingData_offline';

const appState = {
    isOnline: false,
    isRunning: false,
    allData: [],
    simulation: null,
    timeFilter: 'all',
    triggerAnalyticsUpdate: () => {
        const now = Date.now();
        const filteredData = (appState.timeFilter === 'all')
            ? appState.allData
            : appState.allData.filter(item => (now - item.timestamp) < parseInt(appState.timeFilter, 10));
        updateAnalytics(filteredData);
    }
};

async function main() {
    console.log("Application initializing...");
    
    try {
        const savedData = localStorage.getItem(OFFLINE_STORAGE_KEY);
        if (savedData) {
            appState.allData = JSON.parse(savedData);
            console.log(`Loaded ${appState.allData.length} items from local storage.`);
        }
    } catch (error) {
        console.error("Failed to load offline data, clearing it.", error);
        localStorage.removeItem(OFFLINE_STORAGE_KEY);
    }

    initUI({
        onStart: startApp,
        onStop: stopApp,
        onClear: clearData,
        onFaultToggle: (e) => {
            const enabled = e.target.checked;
            appState.simulation.toggleFaults(enabled);
            elements.sliderFaultRate.disabled = !enabled;
        },
        onSpeedChange: (e) => appState.simulation.setSpeed(e.target.value),
        onFaultRateChange: (e) => {
            const rate = parseFloat(e.target.value);
            appState.simulation.setFaultRate(rate);
            elements.faultRateValue.textContent = `${(rate * 100).toFixed(0)}%`;
        },
        onFilterChange: (filterValue) => {
            appState.timeFilter = filterValue;
            appState.triggerAnalyticsUpdate();
        }
    });

    appState.isOnline = await initFirebase(appState);
    updateStatus(appState.isOnline ? STATUS.ONLINE : STATUS.OFFLINE);
    elements.btnClear.disabled = appState.isOnline; // Disable clear if online
    
    if (!appState.isOnline) {
        appState.triggerAnalyticsUpdate(); 
    }
    
    console.log(`App running in ${appState.isOnline ? 'ONLINE' : 'OFFLINE'} mode.`);
    appState.simulation = createSimulation(handleSimulationUpdate);
    elements.btnStart.disabled = false;
}

function startApp() {
    if (appState.isRunning) return;
    appState.isRunning = true;
    appState.simulation.start();
    updateStatus(STATUS.RUNNING);
    // Disable all controls during simulation
    [elements.btnStart, elements.btnClear, elements.checkFault, elements.sliderSpeed, elements.sliderFaultRate]
        .forEach(el => el.disabled = true);
    elements.btnStop.disabled = false;
}

function stopApp() {
    if (!appState.isRunning) return;
    appState.isRunning = false;
    appState.simulation.stop();
    updateStatus(appState.isOnline ? STATUS.ONLINE : STATUS.STOPPED);
    // Re-enable controls
    [elements.btnStart, elements.btnClear, elements.checkFault, elements.sliderSpeed]
        .forEach(el => el.disabled = false);
    elements.sliderFaultRate.disabled = !elements.checkFault.checked;
    elements.btnStop.disabled = true;
    elements.btnClear.disabled = appState.isOnline; // Keep clear disabled if online
    document.getElementById('current-item')?.remove();
}

function clearData() {
    if(appState.isOnline || appState.isRunning) return;
    if(confirm("Are you sure you want to clear all locally saved data? This action cannot be undone.")) {
        appState.allData = [];
        localStorage.removeItem(OFFLINE_STORAGE_KEY);
        appState.simulation.reset();
        appState.triggerAnalyticsUpdate();
        console.log("Offline data cleared.");
    }
}

function handleSimulationUpdate(item, sortedTo, processedItem) {
    updateSortingAnimation(item, sortedTo);
    if (processedItem) {
        if (appState.isOnline) {
            saveWasteData(processedItem);
        } else {
            appState.allData.push(processedItem);
            try {
                localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(appState.allData));
            } catch (error) {
                console.error("Failed to save offline data to localStorage:", error);
            }
            appState.triggerAnalyticsUpdate();
        }
    }
}

document.addEventListener('DOMContentLoaded', main);

