/**
 * Main Application Entry Point
 * Initializes the Commemorative Coin Designer application
 */

import './main.css';
import {createCoinEditor} from './CoinEditor';
import {mountDonateWidget} from './DonateWidget';

/**
 * Initialize the application when DOM is ready
 */
function initializeApp(): void {
  try {
    // Create the main app container
    const appContainer = document.getElementById('app');
    
    if (!appContainer) {
      throw new Error('App container element not found');
    }

    // Initialize the coin editor
    const coinDesign = createCoinEditor('app');

    // Floating donation card; sits outside the editor so it stays put as the
    // page scrolls, and stays hidden once dismissed.
    mountDonateWidget();

    console.log('Commemorative Coin Designer initialized successfully');
    console.log('Current design:', coinDesign);

  } catch (error) {
    console.error('Failed to initialize application:', error);
    
    // Show error message to user
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="bg-white p-8 rounded-xl shadow-lg max-w-md">
            <h1 class="text-2xl font-bold text-red-600 mb-4">Application Error</h1>
            <p class="text-gray-700 mb-4">
              Failed to initialize the Coin Designer application.
            </p>
            <p class="text-gray-600 text-sm">
              ${error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
            <button
              onclick="window.location.reload()"
              class="btn-primary mt-6">
              Reload Application
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for potential module usage
export {createCoinEditor};
