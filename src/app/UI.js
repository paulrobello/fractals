import Stats from 'stats.js';

export class UI {
  constructor(app) {
    this.app = app;
    this.stats = null;

    this.setupStats();
    this.addProfileHelpers();
  }

  updateLoadingProgress(percent, status) {
    const progressBar = document.getElementById('loading-progress-bar');
    const statusText = document.getElementById('loading-status');

    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    if (statusText) {
      statusText.textContent = status;
    }
  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(this.stats.dom);
    // Only show FPS panel - GPU and RES panels removed for cleaner UI
    // Custom panels can be added back if needed for debugging
  }

  addProfileHelpers() {
    // Add a simple toast notification system
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '5px',
      zIndex: 10003,
      opacity: 0,
      transition: 'opacity 0.3s',
      pointerEvents: 'none',
      fontFamily: 'sans-serif',
      fontSize: '14px',
    });
    document.body.appendChild(toast);
    let toastTimeout = null;
    this.app.showToast = (message, duration = 3000) => {
      toast.textContent = message;
      toast.style.opacity = 1;
      if (toastTimeout) clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.style.opacity = 0;
      }, duration);
    };

    // Add a global helper for triggering a benchmark run from the console
    window.runBenchmark = (modal = true) => {
      if (this.app.runPerformanceTest) {
        this.app.runPerformanceTest(modal);
      } else {
        console.warn('PerformanceTest not available.');
      }
    };
    // Add a global helper for DEC autofit
    window.autoFitDEC = () => {
      try {
        if (this.app.saveCameraPosition) {
          const camData = JSON.parse(localStorage.getItem('fractalExplorer_cameraPosition'));
          if (camData && camData.autoFitDEC) {
            // Re-create the function from its string representation
            const fn = new Function(`return ${camData.autoFitDEC}`)();
            fn.call(this.app);
          }
        }
      } catch (e) {
        console.warn('autoFitDEC helper failed:', e);
      }
    };
  }
}
