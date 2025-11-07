Waste Sorting System & Performance Analytics Dashboard
A real-time dashboard simulating an automated waste sorting facility with advanced controls and performance analytics.

1. Project Overview
The effective management of municipal solid waste is a critical global challenge. This project addresses the inefficiencies of manual sorting by demonstrating a modern, automated solution. It simulates a waste sorting station that uses a mock Machine Learning model to classify items into different categories (e.g., Plastic, Metal, Paper, E-Waste).

The core of the project is a sophisticated analytics dashboard that provides stakeholders with immediate, data-driven insights into the system's performance, enabling optimization of recycling processes. The entire application is built with modern web technologies and features a robust dual-mode architecture.

2. Core Features
This dashboard is packed with features designed for comprehensive simulation and analysis:

Dual Online/Offline Architecture:

Offline-First: The application is fully functional without an internet connection. All data is saved to the browser's localStorage, ensuring data persistence across sessions.

Live Online Mode: When an internet connection is available, it automatically connects to a Firebase Firestore database to log and sync all processed data in real-time.

Advanced Real-time Simulation:

A dynamic "Sorting Station" visualizes the process, showing items being scanned and sorted into their respective bins.

The simulation generates a shuffled deck of 8 different waste categories to ensure variety.

Advanced Simulation Controls:

Simulation Speed: A slider allows you to control the item processing speed from 0.5x (Slow) to 3.0x (Very Fast) to analyze throughput.

Variable ML Fault Rate: A toggle activates a fault simulation mode with a slider to control the ML model's error rate from 0% to 100%, allowing for detailed resilience testing.

Comprehensive Analytics Dashboard:

Key Performance Indicators (KPIs): Real-time stats for Total Items Processed, Sorting Accuracy, and Throughput (items/min).

Interactive Charts: All charts are dynamically updated to reflect the current data filter.

Processing Trend: A line chart showing the number of items processed over time.

Waste Categories: A doughnut chart showing the breakdown of all sorted materials.

Recycled vs. Dumped: A pie chart providing a clear proportion of recyclable vs. non-recyclable items.

Time-Based Filtering: All analytics can be filtered to show data for the "Last 5 Min," "Last 30 Min," "Last 1 Hr," "Last 24 Hr," or "All Time."

Robust and User-Friendly Interface:

Day/Night Theme: The dashboard automatically detects the user's system preference and allows manual toggling between light and dark modes.

Detailed Event Log: A live log shows every item processed. Clicking an entry opens a modal with detailed inspection data (actual vs. predicted, confidence, timestamp).

Self-Healing Offline Mode: The application can detect and clear corrupted local data to prevent crashes.

3. Technology Stack
The project is built entirely with client-side technologies, making it highly portable and easy to deploy.

Frontend: HTML5, Tailwind CSS

Core Logic: JavaScript (ES6 Modules)

Data Visualization: Chart.js

Backend & Database (Online Mode): Google Firebase (Firestore for database and Anonymous Auth for security)

4. System Architecture
The application follows a modern, modular JavaScript architecture, separating concerns for better maintainability.

index.html: The main entry point and structure of the application.

style.css: Contains all custom styling rules.

firebase.js: Handles all communication with the Firebase backend.

ui.js: Manages all DOM elements, charts, animations, and visual updates.

simulation.js: Contains the core logic for the waste sorting simulation.

main.js: The central controller that initializes the app and connects all modules.

5. Getting Started
To run the project locally, you will need a local web server, as the application uses ES6 modules.

Clone the Repository (or download the files):

git clone [https://github.com/quantum-coders-ai/Waste-Management-system.git]


Firebase Configuration:

Open the firebase.js file.

Replace the placeholder firebaseConfig object with your own Firebase project configuration.

Ensure that Firestore and Anonymous Authentication are enabled in your Firebase project.

Run a Local Server:

Navigate to the project directory in your terminal.

If you have Python 3, run: python -m http.server

Open your browser and go to http://localhost:8000.

6. Use Cases and Project Scope
Use Cases
This project serves as a powerful tool for various purposes:

Educational Tool: To teach the principles of automated waste sorting and the importance of data analytics in process optimization.

Demonstration Platform: To showcase the capabilities of modern, AI-driven sorting facilities to stakeholders, investors, or policymakers.

Analysis & Research: To simulate and analyze how variables like processing speed, material flow, and equipment error rates affect overall system efficiency and throughput.

Project Scope
In Scope: This project is a high-fidelity simulation and visualization tool. It is a frontend-only web application designed for demonstration, running entirely in the browser. It simulates the logic of a sorting facility but does not involve physical hardware.

Out of Scope: This is not a production-scale industrial control system. It does not contain an actual trained Machine Learning model (it simulates the output of one) and does not interface with any physical sensors or machinery.

7. Future Development Roadmap
The modular architecture of this project makes it easy to extend. The following are key areas for future development:

Real Machine Learning Integration:

Replace the mock ML model with a real TensorFlow.js model that can perform live classification using a device's webcam or from uploaded images. This would be the most significant step toward a functional prototype.

Hardware Connectivity:

Integrate the web dashboard with a physical prototype using a Raspberry Pi or similar microcontroller. The application could send commands to control servo motors for sorting, read data from real sensors, and create a complete cyber-physical system.

Advanced Analytics & Reporting:


Implement a feature to export the currently filtered data as a CSV file, allowing for in-depth offline analysis and record-keeping in tools like Excel or Google Sheets.

