/**
 * Photopea Live Messaging Bridge (Client-Side)
 * Manages the background Photopea iframe for zero-latency, high-fidelity
 * PSD rendering directly inside the web interface.
 */

class PhotopeaBridge {
  constructor(iframeElementOrId = 'photopeaIframe') {
    this.iframe = typeof iframeElementOrId === 'string'
      ? document.getElementById(iframeElementOrId)
      : iframeElementOrId;
    this.isReady = false;
    this.readyCallbacks = [];
    this.currentTask = null;
    this.messageQueue = [];

    this._setupListener();
  }

  _setupListener() {
    window.addEventListener('message', (e) => {
      // Photopea communications
      if (e.data === 'done') {
        if (!this.isReady) {
          this.isReady = true;
          console.log('[PhotopeaBridge] Background Photopea engine initialized and ready!');
          while (this.readyCallbacks.length) {
            this.readyCallbacks.shift()();
          }
        }
        if (this.currentTask) {
          const task = this.currentTask;
          this.currentTask = null;
          task.resolve(task.resultData || 'done');
        }
      } else if (e.data instanceof ArrayBuffer) {
        if (this.currentTask) {
          this.currentTask.resultData = e.data;
        }
      } else if (typeof e.data === 'string') {
        if (this.currentTask && this.currentTask.onEcho) {
          this.currentTask.onEcho(e.data);
        }
      }
    });
  }

  /**
   * Ensures Photopea iframe has completed initialization
   */
  async waitForReady(timeoutMs = 45000) {
    if (this.isReady) return true;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout waiting for Photopea iframe initialization'));
      }, timeoutMs);

      this.readyCallbacks.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }

  /**
   * Loads a PSD file into Photopea as an ArrayBuffer
   */
  async loadPsd(arrayBuffer, timeoutMs = 35000) {
    await this.waitForReady();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentTask = null;
        reject(new Error('Timeout loading PSD into Photopea'));
      }, timeoutMs);

      this.currentTask = {
        type: 'load_file',
        resolve: () => {
          clearTimeout(timer);
          resolve(true);
        },
        reject
      };

      this.iframe.contentWindow.postMessage(arrayBuffer, '*');
    });
  }

  /**
   * Executes an ExtendScript inside Photopea
   */
  async runScript(scriptText, timeoutMs = 40000, onEcho = null) {
    await this.waitForReady();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentTask = null;
        reject(new Error('Timeout executing script in Photopea'));
      }, timeoutMs);

      this.currentTask = {
        type: 'script',
        onEcho,
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject
      };

      this.iframe.contentWindow.postMessage(scriptText, '*');
    });
  }

  /**
   * Exports document in specified format (e.g. 'png', 'psd', 'pdf')
   */
  async exportFormat(format = 'png', timeoutMs = 40000) {
    await this.waitForReady();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.currentTask = null;
        reject(new Error(`Timeout exporting ${format} from Photopea`));
      }, timeoutMs);

      this.currentTask = {
        type: 'export',
        resolve: (data) => {
          clearTimeout(timer);
          resolve(data); // Returns ArrayBuffer
        },
        reject
      };

      const script = `app.activeDocument.saveToOE("${format}");`;
      this.iframe.contentWindow.postMessage(script, '*');
    });
  }
}

// Attach to window
window.PhotopeaBridge = PhotopeaBridge;
