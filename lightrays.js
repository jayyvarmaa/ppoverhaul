// lightrays.js - Vanilla WebGL translation of the React LightRays component

const DEFAULT_COLOR = '#00ffff';

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

const getAnchorAndDir = (origin, w, h) => {
  const outside = 0.2;
  switch (origin) {
    case 'top-left': return { anchor: [0, -outside * h], dir: [0, 1] };
    case 'top-right': return { anchor: [w, -outside * h], dir: [0, 1] };
    case 'left': return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
    case 'right': return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-center': return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
    default: return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
  }
};

function initLightRays(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const {
        raysOrigin = 'top-center',
        raysColor = DEFAULT_COLOR,
        raysSpeed = 1.5,
        lightSpread = 0.8,
        rayLength = 1.2,
        pulsating = false,
        fadeDistance = 1.0,
        saturation = 1.0,
        followMouse = true,
        mouseInfluence = 0.1,
        noiseAmount = 0.1,
        distortion = 0.05
    } = options;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const gl = canvas.getContext('webgl', { alpha: true });
    if (!gl) {
        console.warn('WebGL not supported');
        return;
    }

    const vertSource = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
            vUv = position * 0.5 + 0.5;
            gl_Position = vec4(position, 0.0, 1.0);
        }
    `;

    const fragSource = `
        precision highp float;

        uniform float iTime;
        uniform vec2  iResolution;

        uniform vec2  rayPos;
        uniform vec2  rayDir;
        uniform vec3  raysColor;
        uniform float raysSpeed;
        uniform float lightSpread;
        uniform float rayLength;
        uniform float pulsating;
        uniform float fadeDistance;
        uniform float saturation;
        uniform vec2  mousePos;
        uniform float mouseInfluence;
        uniform float noiseAmount;
        uniform float distortion;

        varying vec2 vUv;

        float noise(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
            vec2 sourceToCoord = coord - raySource;
            vec2 dirNorm = normalize(sourceToCoord);
            float cosAngle = dot(dirNorm, rayRefDirection);
            
            float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
            float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
            
            float distance = length(sourceToCoord);
            float maxDistance = iResolution.x * rayLength;
            float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
            
            float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
            float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;
            
            float baseStrength = clamp(
                (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
                (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
                0.0, 1.0
            );
            
            return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
        }

        void mainImage(out vec4 fragColor, in vec2 fragCoord) {
            vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
            
            vec2 finalRayDir = rayDir;
            if (mouseInfluence > 0.0) {
                vec2 mouseScreenPos = mousePos * iResolution.xy;
                vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
                finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
            }
            
            vec4 rays1 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
            vec4 rays2 = vec4(1.0) * rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
            
            fragColor = rays1 * 0.5 + rays2 * 0.4;
            
            if (noiseAmount > 0.0) {
                float n = noise(coord * 0.01 + iTime * 0.1);
                fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
            }
            
            float brightness = 1.0 - (coord.y / iResolution.y);
            fragColor.x *= 0.1 + brightness * 0.8;
            fragColor.y *= 0.3 + brightness * 0.6;
            fragColor.z *= 0.5 + brightness * 0.5;
            
            if (saturation != 1.0) {
                float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
                fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
            }
            
            fragColor.rgb *= raysColor;
        }

        void main() {
            vec4 color;
            mainImage(color, gl_FragCoord.xy);
            gl_FragColor = color;
        }
    `;

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return;
    }

    gl.useProgram(program);

    const positions = new Float32Array([
        -1.0,  1.0,
        -1.0, -1.0,
         1.0,  1.0,
         1.0, -1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
        iTime: gl.getUniformLocation(program, 'iTime'),
        iResolution: gl.getUniformLocation(program, 'iResolution'),
        rayPos: gl.getUniformLocation(program, 'rayPos'),
        rayDir: gl.getUniformLocation(program, 'rayDir'),
        raysColor: gl.getUniformLocation(program, 'raysColor'),
        raysSpeed: gl.getUniformLocation(program, 'raysSpeed'),
        lightSpread: gl.getUniformLocation(program, 'lightSpread'),
        rayLength: gl.getUniformLocation(program, 'rayLength'),
        pulsating: gl.getUniformLocation(program, 'pulsating'),
        fadeDistance: gl.getUniformLocation(program, 'fadeDistance'),
        saturation: gl.getUniformLocation(program, 'saturation'),
        mousePos: gl.getUniformLocation(program, 'mousePos'),
        mouseInfluence: gl.getUniformLocation(program, 'mouseInfluence'),
        noiseAmount: gl.getUniformLocation(program, 'noiseAmount'),
        distortion: gl.getUniformLocation(program, 'distortion')
    };

    const parsedColor = hexToRgb(raysColor);
    gl.uniform3f(uniforms.raysColor, parsedColor[0], parsedColor[1], parsedColor[2]);
    gl.uniform1f(uniforms.raysSpeed, raysSpeed);
    gl.uniform1f(uniforms.lightSpread, lightSpread);
    gl.uniform1f(uniforms.rayLength, rayLength);
    gl.uniform1f(uniforms.pulsating, pulsating ? 1.0 : 0.0);
    gl.uniform1f(uniforms.fadeDistance, fadeDistance);
    gl.uniform1f(uniforms.saturation, saturation);
    gl.uniform1f(uniforms.mouseInfluence, mouseInfluence);
    gl.uniform1f(uniforms.noiseAmount, noiseAmount);
    gl.uniform1f(uniforms.distortion, distortion);

    let w, h;
    function resize() {
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = rect.width * dpr;
        h = rect.height * dpr;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(uniforms.iResolution, w, h);
        
        const { anchor, dir } = getAnchorAndDir(raysOrigin, w, h);
        gl.uniform2f(uniforms.rayPos, anchor[0], anchor[1]);
        gl.uniform2f(uniforms.rayDir, dir[0], dir[1]);
    }
    window.addEventListener('resize', resize);
    resize();

    let mouseX = 0.5;
    let mouseY = 0.5;
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;

    if (followMouse) {
        window.addEventListener('mousemove', e => {
            const rect = container.getBoundingClientRect();
            mouseX = (e.clientX - rect.left) / rect.width;
            mouseY = (e.clientY - rect.top) / rect.height;
        });
    }

    let startTime = performance.now();
    function render(time) {
        const elapsed = (time - startTime) * 0.001;
        gl.uniform1f(uniforms.iTime, elapsed);

        if (followMouse && mouseInfluence > 0.0) {
            smoothMouseX += (mouseX - smoothMouseX) * 0.08;
            smoothMouseY += (mouseY - smoothMouseY) * 0.08;
            gl.uniform2f(uniforms.mousePos, smoothMouseX, smoothMouseY);
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
