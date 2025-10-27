import * as THREE from 'three';

export class Renderer {
  constructor(app) {
    this.app = app;
    this.canvas = app.canvas;
    this.camera = null;
    this.renderer = null;
    this.scene = null;

    this.setupRenderer();
    this.setupCamera();
    this.setupScene();
    this.setupEventListeners();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });

    // Ensure canvas can receive focus for reliable keyboard events on macOS/Chrome
    try {
      if (this.canvas && typeof this.canvas.setAttribute === 'function') {
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.style.outline = 'none';
        this.canvas.addEventListener('click', () => {
          try {
            this.canvas.focus();
          } catch (_) {}
        });
      }
    } catch (_) {}

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

    const gl = this.renderer.getContext();
    this.app._gpu = { gl, ext: null, query: null, lastMs: null, active: false };

    // Install GL compile/link hooks to surface shader errors during loading
    this.installGLCompileHooks();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const savedCamera = this.loadCameraPosition();
    if (savedCamera) {
      const pos = savedCamera.position;
      this.camera.position.set(pos.x, pos.y, pos.z);

      if (savedCamera.rotation) {
        const rot = savedCamera.rotation;
        this.camera.rotation.set(rot.x, rot.y, rot.z);
      }

      console.log('📷 Restored camera:', savedCamera);
    } else {
      this.camera.position.set(0, 0, 7.0);
      this.camera.lookAt(new THREE.Vector3(0, 0, 0));
    }

    setInterval(() => {
      this.saveCameraPosition();
    }, 1000);
  }

  setupScene() {
    this.scene = new THREE.Scene();
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    if (this.app.uniforms && this.app.uniforms.u_resolution) {
      this.app.uniforms.u_resolution.value.x = window.innerWidth;
      this.app.uniforms.u_resolution.value.y = window.innerHeight;
    }
    // Resize offscreen target if present (owned by ShaderManager)
    try {
      const sm = this.app.shaderManager;
      if (sm && sm.rtScene) sm.rtScene.setSize(window.innerWidth, window.innerHeight);
    } catch (_) {}
  }

  saveCameraPosition() {
    const data = {
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      rotation: {
        x: this.camera.rotation.x,
        y: this.camera.rotation.y,
        z: this.camera.rotation.z,
      },
    };
    localStorage.setItem('fractalExplorer_cameraPosition', JSON.stringify(data));
  }

  loadCameraPosition() {
    try {
      const saved = localStorage.getItem('fractalExplorer_cameraPosition');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.position) {
          return data;
        } else {
          return { position: data, rotation: null };
        }
      }
    } catch (e) {
      console.warn('Failed to load camera position:', e);
    }
    return null;
  }

  // Mirror of original main.js compile/link hooks (trimmed):
  // Captures shader sources and infologs; updates loading status and shows error overlay.
  installGLCompileHooks() {
    const gl = this.renderer.getContext();
    if (!gl || gl.__fractalHooksInstalled) return;

    const shaderTypeMap = new WeakMap();
    const shaderSourceMap = new WeakMap();
    const self = this;

    function updateForStage(pct, msg) {
      // Clamp to compile window (visual only). Use UI method to update loading progress.
      const clamped = Math.max(45, Math.min(60, pct));
      if (self.app && self.app.ui && typeof self.app.ui.updateLoadingProgress === 'function') {
        try {
          self.app.ui.updateLoadingProgress(clamped, msg);
        } catch (e) {
          console.warn('Failed to update loading progress:', e);
        }
      }
    }
    function nameForType(type) {
      if (type === gl.VERTEX_SHADER) return 'Vertex';
      if (type === gl.FRAGMENT_SHADER) return 'Fragment';
      return 'Unknown';
    }

    const origCreateShader = gl.createShader.bind(gl);
    gl.createShader = function (type) {
      const shader = origCreateShader(type);
      try {
        shaderTypeMap.set(shader, type);
      } catch (_) {}
      return shader;
    };

    const origShaderSource = gl.shaderSource.bind(gl);
    gl.shaderSource = function (shader, source) {
      try {
        shaderSourceMap.set(shader, source);
      } catch (_) {}
      origShaderSource(shader, source);
    };

    const origCompileShader = gl.compileShader.bind(gl);
    gl.compileShader = function (shader) {
      const type = shaderTypeMap.get(shader);
      const stageName = nameForType(type);
      updateForStage(type === gl.VERTEX_SHADER ? 48 : 56, `Compiling ${stageName} shader...`);

      origCompileShader(shader);

      const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!ok) {
        const log = gl.getShaderInfoLog(shader) || 'Unknown compile error';
        const src = shaderSourceMap.get(shader) || '[no source captured]';
        const full = [
          `${stageName} shader compile error:`,
          log.trim(),
          '',
          `--- ${stageName} Shader Source ---`,
          src,
          `--- end ${stageName} Shader Source ---`,
        ].join('\n');
        console.error(full);
        updateForStage(50, `${stageName} shader error`);
        // Call showShaderError to display error panel
        if (self.app && typeof self.app.showShaderError === 'function') {
          try {
            self.app.showShaderError(`${stageName} Shader Compile Error`, full);
          } catch (e) {
            console.error('Failed to show shader error dialog:', e);
          }
        } else {
          console.error('showShaderError method not found on app');
        }
      } else {
        updateForStage(type === gl.VERTEX_SHADER ? 52 : 58, `${stageName} shader compiled`);
      }
    };

    const origLinkProgram = gl.linkProgram.bind(gl);
    gl.linkProgram = function (program) {
      updateForStage(59, 'Linking shader program...');
      origLinkProgram(program);
      const ok = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (!ok) {
        const linkLog = gl.getProgramInfoLog(program) || 'Unknown link error';
        let full = [`Program link error:`, linkLog.trim(), ''];
        try {
          const shaders = gl.getAttachedShaders(program) || [];
          shaders.forEach((sh) => {
            const t = shaderTypeMap.get(sh);
            const name =
              t === gl.VERTEX_SHADER ? 'Vertex' : t === gl.FRAGMENT_SHADER ? 'Fragment' : 'Unknown';
            const src = shaderSourceMap.get(sh) || '[no source captured]';
            const slog = gl.getShaderInfoLog(sh) || '';
            full.push(`--- ${name} Shader InfoLog ---`);
            full.push(slog.trim());
            full.push('');
            full.push(`--- ${name} Shader Source ---`);
            full.push(src);
            full.push(`--- end ${name} Shader Source ---`);
            full.push('');
          });
        } catch (e) {
          console.warn('Failed to get attached shader info:', e);
        }
        const fullText = full.join('\n');
        console.error(fullText);
        updateForStage(59, 'Shader link error');
        // Call showShaderError to display error panel
        if (self.app && typeof self.app.showShaderError === 'function') {
          try {
            self.app.showShaderError('Program Link Error', fullText);
          } catch (e) {
            console.error('Failed to show shader error dialog:', e);
          }
        } else {
          console.error('showShaderError method not found on app');
        }
      } else {
        updateForStage(60, 'Shaders compiled ✓');
        // Clear error state and attempt to finish loading
        if (self.app) {
          self.app.hasShaderError = false;
          if (typeof self.app.attemptFinishLoading === 'function') {
            try {
              self.app.attemptFinishLoading();
            } catch (e) {
              console.error('Failed to call attemptFinishLoading:', e);
            }
          }
        }
      }
    };

    gl.__fractalHooksInstalled = true;
  }
}
