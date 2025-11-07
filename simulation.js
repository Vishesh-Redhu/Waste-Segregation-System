import { WASTE_DECK_CONFIG } from './ui.js';

let simulationTimeout = null;
const simulationState = {
    running: false,
    itemCounter: 0,
    simulateFaults: false,
    speed: 1.0,
    faultRate: 0.25,
    onUpdate: null
};

const WASTE_DECK = WASTE_DECK_CONFIG.filter(c => c.position !== 'hidden');
let shuffledDeck = [];

export function createSimulation(onUpdate) {
    simulationState.onUpdate = onUpdate;
    return {
        start: startSimulation,
        stop: stopSimulation,
        reset: () => { simulationState.itemCounter = 0; },
        toggleFaults: (enabled) => { simulationState.simulateFaults = enabled; },
        setSpeed: (newSpeed) => { simulationState.speed = parseFloat(newSpeed); },
        setFaultRate: (newRate) => { simulationState.faultRate = parseFloat(newRate); }
    };
}

function startSimulation() {
    if (simulationState.running) return;
    simulationState.running = true;
    console.log("Simulation started.");
    simulationTick();
}

function stopSimulation() {
    if (!simulationState.running) return;
    simulationState.running = false;
    console.log("Simulation stopped.");
    clearTimeout(simulationTimeout);
}

function simulationTick() {
    if (!simulationState.running) return;
    if (shuffledDeck.length === 0) {
        shuffledDeck = [...WASTE_DECK, ...WASTE_DECK, ...WASTE_DECK].sort(() => 0.5 - Math.random());
    }
    const itemTemplate = shuffledDeck.pop();
    const currentItem = {
        id: `item-${String(simulationState.itemCounter++).padStart(3, '0')}`,
        type: itemTemplate.type,
        recyclable: itemTemplate.recyclable
    };
    simulationState.onUpdate(currentItem, null, null);
    
    const SCANNING_TIME = 1000;
    setTimeout(() => {
        if(!simulationState.running) return;
        
        let prediction = currentItem.type;
        let confidence = 0.9 + Math.random() * 0.09;
        
        if (simulationState.simulateFaults && Math.random() < simulationState.faultRate) {
            const otherTypes = WASTE_DECK.filter(w => w.type !== currentItem.type);
            prediction = otherTypes[Math.floor(Math.random() * otherTypes.length)].type;
            confidence = 0.55 + Math.random() * 0.2;
        }
        const processedItem = { ...currentItem, timestamp: Date.now(), actual: currentItem.type, prediction, confidence };
        simulationState.onUpdate(currentItem, prediction, processedItem);
        
        const BASE_DELAY = 1500;
        const RANDOM_FACTOR = 1000;
        const nextItemDelay = (Math.random() * RANDOM_FACTOR + BASE_DELAY) / simulationState.speed;
        simulationTimeout = setTimeout(simulationTick, nextItemDelay);
    }, SCANNING_TIME / simulationState.speed);
}

