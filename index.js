import { fetchShader, include } from './src/ShaderUtils.js';
import Material from './src/Material.js';
import Compute from './src/Compute.js';

import Drop from './src/objects/Drop.js';

class Main {
    constructor() {
        this.canvas = document.querySelector('canvas');
        this.gridSize = { x: 512, y: 512 };
        this.gridCoord = { x: 0, y: 0 };
        this.mouseDown = false;
        this.drops = [];
        this.maxDrops = 250;
        this.detail = 500;
    }

    async initialize() {
        if (!navigator.gpu) {
            console.error("WebGPU not supported on this browser.");
            return;
        }

        const adapter = await navigator.gpu.requestAdapter();
        const device = await adapter.requestDevice();
        const context = this.canvas.getContext('webgpu');
        const format = navigator.gpu.getPreferredCanvasFormat();

        context.configure({
            device,
            format,
            alphaMode: 'opaque',
        });

        this.device = device;
        this.context = context;
        this.format = format;

        await this.setupShaders();
        this.createBuffers();
        this.createMaterial();
        this.createComputeShader();
        this.setupEventListeners();
        this.resize();
        this.loop();
    }

    async setupShaders() {
        this.vertexShaderCode = await include('./src/shader/vertex.wgsl');
        this.fragmentShaderCode = await include('./src/shader/fragment.wgsl');
    }

    createBuffers() {
        // Initial buffer size for max drops
        this.dropsBuffer = this.device.createBuffer({
            size: this.maxDrops * this.detail * 2 * 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
    }    

    createMaterial() {
        this.material = new Material(this.device, this.vertexShaderCode, this.fragmentShaderCode, {
            0: { size: 8, usage: GPUBufferUsage.UNIFORM },  // Resolution
            1: { size: 4, usage: GPUBufferUsage.UNIFORM },  // numDrops
            2: { size: 4, usage: GPUBufferUsage.UNIFORM },  // detail
        }, {
            3: this.dropsBuffer,                            // Drops data
        });
    
        this.material.createPipeline(this.format);
    }

    createComputeShader() {

    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        this.canvas.addEventListener("mousedown", (event) => this.onMouseDown(event));
        this.canvas.addEventListener("mouseup", (event) => this.onMouseUp(event));
        this.canvas.addEventListener("wheel", (event) => this.onWheel(event));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.material.updateUniform('0', new Uint32Array([this.canvas.width, this.canvas.height]));
        this.render();
    }

    onMouseMove(event) {
        const canvasRect = this.canvas.getBoundingClientRect();
        const mouse = {x: event.clientX - canvasRect.left, y: event.clientY - canvasRect.top};
    }

    onMouseDown(event) {
        this.mouseDown = true;
    
        const canvasRect = this.canvas.getBoundingClientRect();
        const mouse = { x: event.clientX - canvasRect.left, y: event.clientY - canvasRect.top };
    
        const radius = 100;
        var drop = new Drop(mouse, radius, this.detail);

        for (let i = 0; i < this.drops.length; i++) {
            const other = this.drops[i];
            other.Marble(drop);
        }
    
        if (this.drops.length >= this.maxDrops) {
            this.drops.shift();
        }
    
        this.drops.push(drop);
    
        this.updateDropsBuffer();
    }
    
    
    updateDropsBuffer() {
        const flattenedDrops = new Float32Array(this.drops.length * this.detail * 2);

        this.drops.forEach((drop, index) => {
            for (let i = 0; i < drop.vertices.length; i++) {
                flattenedDrops[index * this.detail * 2 + i*2] = drop.vertices[i].x;
                flattenedDrops[index * this.detail * 2 + i*2+1] = drop.vertices[i].y;
            }
        });

        this.device.queue.writeBuffer(this.dropsBuffer, 0, flattenedDrops);
    
        this.material.updateUniform('1', new Uint32Array([this.drops.length]));
    }
    

    onMouseUp(event) {
        this.mouseDown = false
    }

    onWheel(event) {
        
    }

    render() {
        const commandEncoder = this.device.createCommandEncoder();

        const textureView = this.context.getCurrentTexture().createView();
        this.material.render(commandEncoder, textureView);

        this.device.queue.submit([commandEncoder.finish()]);
    }

    loop() {
        let lastFrameTime = performance.now();
        let counter = 0;

        this.material.updateUniform('2', new Uint32Array([this.detail]))

        const frameLoop = () => {
            const currentFrameTime = performance.now();
            const deltaTime = currentFrameTime - lastFrameTime;
            const fps = 1000 / deltaTime;

            if ((counter += deltaTime) >= 5000) {
                console.log(`Delta time: ${deltaTime.toFixed(2)} ms, FPS: ${fps.toFixed(2)}`);
                counter = 0;
            }

            lastFrameTime = currentFrameTime;

            this.render();
            requestAnimationFrame(frameLoop);
        };

        frameLoop();
    }
}

const app = new Main();
app.initialize();