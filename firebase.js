// --- Constants and Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyA7112Zj7hNpUdfNjPBoHv24X6zvJ-Jwsg",
    authDomain: "college-projects-83a0a.firebaseapp.com",
    projectId: "college-projects-83a0a",
    storageBucket: "college-projects-83a0a.firebasestorage.app",
    messagingSenderId: "110954216590",
    appId: "1:110954216590:web:07dca72de209be4adc9ddf",
    measurementId: "G-F4NHVWSY6M"
};

let db;
let auth;

/**
 * Initializes the Firebase application, signs in the user anonymously,
 * and sets up a real-time data listener.
 * @param {object} state - The main application state object.
 * @returns {Promise<boolean>} - True if connection is successful, false otherwise.
 */
export async function initFirebase(state) {
    try {
        // These global firebase variables come from the CDN scripts in index.html
        firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("Firebase initialized. Signing in...");
        
        await auth.signInAnonymously();
        const user = auth.currentUser;
        
        if (user) {
            console.log("Firebase Auth: Signed in anonymously. User ID:", user.uid);
            setupDataListener(state);
            return true;
        } else {
            throw new Error("Anonymous sign-in failed.");
        }
    } catch (error) {
        console.warn("Firebase connection failed. Running in Offline Mode.", error.message);
        return false;
    }
}

/**
 * Saves a single waste item data to the user's collection in Firestore.
 * @param {object} item - The processed waste item to save.
 */
export async function saveWasteData(item) {
    if (!db || !auth.currentUser) return;
    try {
        const user = auth.currentUser;
        await db.collection("users").doc(user.uid).collection("waste_items").add(item);
    } catch (error) {
        console.error("Error saving data to Firestore:", error);
    }
}

/**
 * Sets up a real-time listener on the user's waste_items collection
 * to receive data updates automatically.
 * @param {object} appState - The main application state object.
 */
function setupDataListener(appState) {
    if (!db || !auth.currentUser) return;
    const user = auth.currentUser;
    db.collection("users").doc(user.uid).collection("waste_items")
      .orderBy("timestamp", "desc")
      .limit(1000)
      .onSnapshot((snapshot) => {
          console.log("Firebase: Data snapshot received.");
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          appState.allData = items.reverse(); // Keep the data sorted chronologically
          appState.triggerAnalyticsUpdate(); // Refresh UI with new data
      }, (error) => {
          console.error("Error with Firestore listener:", error);
      });
}