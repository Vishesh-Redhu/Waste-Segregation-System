import { initFirebase, saveWasteData } from './firebase.js';
// 1. Import the new 'showConfirmationModal' function
import { initUI, updateAnalytics, updateStatus, updateSortingAnimation, elements, STATUS, showConfirmationModal } from './ui.js';
import { createSimulation } from './simulation.js';

const OFFLINE_STORAGE_KEY = 'wasteSortingData_offline';

const appState = {
    isOnline: false,
    isRunning: false,
    allData: [],
    simulation: null,
    timeFilter: 'all',
    hasUnsavedChanges: false, // EFFICIENCY: Flag for offline saving
    triggerAnalyticsUpdate: () => {
        // BUG FIX: Was Date.Gethours(), corrected to Date.now()
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
        onClear: clearData, // This remains the same
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
    
    // --- THIS IS THE CHANGE ---
    // Instead of disabling the button, we now add/remove Tailwind's 'hidden' class
    elements.btnClear.classList.toggle('hidden', appState.isOnline); // Hide if online
    
    if (!appState.isOnline) {
        appState.triggerAnalyticsUpdate(); 
    }
    
    // EFFICIENCY: Add a listener to save offline data before the user leaves.
    window.addEventListener('beforeunload', saveOfflineData);

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

    // EFFICIENCY: Save offline data only when the simulation stops.
    saveOfflineData();

    // Re-enable controls
    [elements.btnStart, elements.btnClear, elements.checkFault, elements.sliderSpeed]
        .forEach(el => el.disabled = false);
    elements.sliderFaultRate.disabled = !elements.checkFault.checked;
    elements.btnStop.disabled = true;
    
    // --- THIS IS THE CHANGE ---
    // We also apply the same show/hide logic here
    elements.btnClear.classList.toggle('hidden', appState.isOnline); // Hide if online

    document.getElementById('current-item')?.remove();
}

/**
 * EFFICIENCY: Saves offline data to localStorage.
 * Only writes if there are unsaved changes.
 */
function saveOfflineData() {
    if (appState.isOnline || !appState.hasUnsavedChanges) return;

    try {
        localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(appState.allData));
        appState.hasUnsavedChanges = false; // Reset flag
        console.log("Offline data saved to localStorage.");
    } catch (error) {
        console.error("Failed to save offline data to localStorage:", error);
    }
}


function clearData() {
    if(appState.isOnline || appState.isRunning) return;
    
    // 2. --- THIS IS THE FIX ---
    // Instead of using if(confirm(...)), we call our new modal function.
    // We pass it a title, a message, and a callback function
    // that will ONLY run if the user clicks "Confirm".
    showConfirmationModal(
        "Clear Local Data", // Title
        "Are you sure you want to clear all locally saved data? This action cannot be undone.", // Message
        () => {
            // This is the code that was previously inside the if-statement
            appState.allData = [];
            appState.hasUnsavedChanges = true; // Mark for saving (clearing)
            saveOfflineData(); // This will save the empty array
            appState.simulation.reset();
            appState.triggerAnalyticsUpdate();
            console.log("Offline data cleared.");
        }
    );
}

function handleSimulationUpdate(item, sortedTo, processedItem) {
    updateSortingAnimation(item, sortedTo);
    if (processedItem) {
        if (appState.isOnline) {
            saveWasteData(processedItem);
        } else {
            appState.allData.push(processedItem);
            
            /*
             * ===================================================================================
             * EFFICIENCY FIX
             * ===================================================================================
             * We just set a "dirty" flag. The data will be saved in a batch
             * when the simulation is stopped or the user closes the tab.
             * ===================================================================================
             */
            appState.hasUnsavedChanges = true;
            
            // We still trigger analytics update to keep the UI live
            appState.triggerAnalyticsUpdate();
        }
    }
}

document.addEventListener('DOMContentLoaded', main);