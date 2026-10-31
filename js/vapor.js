// Vapor saindo do tubo da válvula, desenhado em WebGL (shader de fumaça com ruído fractal).
// Uso: var vapor = NEW.criarVapor(canvas); se WebGL não existir, devolve null.
(function (global) {
  var VERT = 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }';

  // Camadas de fumaça que se aproximam de quem olha (a escala diminui com o tempo),
  // deformadas por ruído para girar e se desfazer. Presas à elipse do furo.
  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;',     // tamanho do canvas em pixels
    'uniform vec2 uC;',       // centro do furo (pixels, origem embaixo)
    'uniform vec2 uR;',       // raios da elipse do furo (pixels)
    'uniform float uT;',      // tempo
    'uniform float uDens;',   // densidade (abertura da válvula)
    'uniform float uZ;',      // mergulho 0..1
    'float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'float fbm(vec2 p) {',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }',
    '  return v;',
    '}',
    'void main() {',
    '  vec2 q = (gl_FragCoord.xy - uC) / uR;',
    '  float d = length(q);',
    '  float borda = 1.0 - smoothstep(0.86, 1.0, d);',
    '  if (borda <= 0.0) { gl_FragColor = vec4(0.0); return; }',
    '  float vel = 0.10 + uZ * 0.55;',
    '  float fumaca = 0.0;',
    '  for (int k = 0; k < 3; k++) {',
    '    float s = fract(uT * vel + float(k) / 3.0);',
    '    float esc = mix(5.0, 0.7, s);',               // a camada cresce: vem em direção a quem olha
    '    vec2 w = q * esc + float(k) * 13.1;',
    '    vec2 giro = vec2(fbm(w + uT * 0.15), fbm(w - uT * 0.12 + 4.0));',
    '    fumaca += fbm(w + 1.8 * giro) * sin(3.14159 * s);',
    '  }',
    '  fumaca /= 1.5;',
    '  float nucleo = 1.0 - smoothstep(0.0, 0.9, d);',
    '  float a = smoothstep(0.32, 0.85, fumaca + nucleo * 0.25) * uDens * borda;',
    '  vec3 frio = vec3(0.62, 0.68, 0.65), quente = vec3(0.96, 1.0, 0.98), verde = vec3(0.29, 0.77, 0.5);',
    '  vec3 cor = mix(frio, quente, smoothstep(0.35, 0.9, fumaca + nucleo * 0.35));',
    '  cor = mix(cor, verde, (1.0 - fumaca) * 0.22);',
    '  gl_FragColor = vec4(cor * a, a);',
    '}',
  ].join('\n');

  function compilar(gl, tipo, fonte) {
    var sh = gl.createShader(tipo);
    gl.shaderSource(sh, fonte);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  }

  function criarVapor(canvas) {
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
    if (!gl) return null;
    var vs = compilar(gl, gl.VERTEX_SHADER, VERT), fs = compilar(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var u = {};
    ['uRes', 'uC', 'uR', 'uT', 'uDens', 'uZ'].forEach(function (k) { u[k] = gl.getUniformLocation(prog, k); });
    var escala = 0.5; // vapor é macio: metade da resolução basta e poupa a placa de vídeo

    return {
      modo: 'vapor',
      redimensionar: function (w, h) {
        canvas.width = Math.max(1, Math.round(w * escala));
        canvas.height = Math.max(1, Math.round(h * escala));
        gl.viewport(0, 0, canvas.width, canvas.height);
      },
      // geo em pixels CSS do palco: centro (cx, cy) e raios (rx, ry); altura h do palco.
      desenhar: function (geo, t, densidade, mergulho) {
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        if (densidade <= 0.01) return;
        gl.uniform2f(u.uRes, canvas.width, canvas.height);
        gl.uniform2f(u.uC, geo.cx * escala, (geo.h - geo.cy) * escala);
        gl.uniform2f(u.uR, geo.rx * escala, geo.ry * escala);
        gl.uniform1f(u.uT, t);
        gl.uniform1f(u.uDens, densidade);
        gl.uniform1f(u.uZ, mergulho);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }

  global.NEW = global.NEW || {};
  global.NEW.criarVapor = criarVapor;
})(window);
