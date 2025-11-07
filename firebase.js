// --- Constants and Configuration ---

/*
 * ===================================================================================
 * CRITICAL SECURITY WARNING
 * ===================================================================================
 * This configuration object contains sensitive API keys and project identifiers.
 * Hard-coding this in client-side JavaScript exposes your Firebase project to abuse.
 *
 * ANYONE can view this code, find your keys, and start writing data to your database,
 * potentially incurring costs or corrupting your data.
 *
 * BEST PRACTICE:
 * 1.  Implement Firebase Security Rules (in the Firebase console) to properly
 * restrict read/write access (e.g., ensure users can only write to their own data).
 * 2.  Use Firebase Hosting, which can securely inject this configuration for you.
 * 3.  If not using Firebase Hosting, set up a secure backend endpoint to serve this
 * config, or use environment variables in a build process (e.g., Vite, React).
 *
 * For this review, the keys are left as-is, but this is the #1 priority to fix.
 * ===================================================================================
 */
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
    } catch (error)
    {
        console.error("Error saving data to Firestore:", error);
    }
}

/**
 * Sets up a real-time listener on the user's waste_items collection
 * to receive data updates automatically.
 *
 * EFFICIENCY V2 (Doc Changes):
 * This version uses snapshot.docChanges() to intelligently add, modify, or remove
 * items from the local state. This is VASTLY more efficient than the previous
 * method of rebuilding the entire 1000-item array on every single change.
 *
 * @param {object} appState - The main application state object.
 */
function setupDataListener(appState) {
    if (!db || !auth.currentUser) return;
    const user = auth.currentUser;

    db.collection("users").doc(user.uid).collection("waste_items")
      .orderBy("timestamp", "desc") // Get newest items first
      .limit(1000) // Limit to the most recent 1000
      .onSnapshot((snapshot) => {
          console.log("Firebase: Data snapshot received.");

          let dataChanged = false;
          
          snapshot.docChanges().forEach(change => {
              dataChanged = true;
              const docData = { id: change.doc.id, ...change.doc.data() };
              const index = appState.allData.findIndex(item => item.id === change.doc.id);

              if (change.type === "added") {
                  // Add new items. Note: This logic assumes we might get 'added'
                  // events for existing items on init, so we check index.
                  if (index === -1) {
                      // We insert at the beginning to maintain reverse-chronological order
                      // for a moment, but we will sort it all at the end.
                       appState.allData.push(docData);
                  }
              }
              if (change.type === "modified") {
                  if (index > -1) {
                      appState.allData[index] = docData; // Update in place
                  }
              }
              if (change.type === "removed") {
                  if (index > -1) {
                      appState.allData.splice(index, 1); // Remove
                  }
              }
          });

          if (dataChanged) {
              // Re-sort the entire array by timestamp (oldest to newest)
              // This is necessary because docChanges() doesn't guarantee order
              // for the initial load, and it keeps our state consistent.
              appState.allData.sort((a, b) => a.timestamp - b.timestamp);
              
              // If we have more than 1000 items (e.g., from multiple 'added' events),
              // trim the array to keep only the newest 1000.
              if (appState.allData.length > 1000) {
                  appState.allData = appState.allData.slice(appState.allData.length - 1000);
              }

              appState.triggerAnalyticsUpdate(); // Refresh UI with new data
          }
      }, (error) => {
          console.error("Error with Firestore listener:", error);
      });
}