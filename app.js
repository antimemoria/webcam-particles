// 1. Configura Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);
document.body.appendChild(renderer.domElement);

// 2. Elementos para la webcam (¡ahora visibles para TensorFlow!)
const video = document.createElement('video');
video.style.position = 'fixed';
video.style.top = '0';
video.style.left = '0';
video.style.width = '160px';
video.style.height = '90px';
video.style.opacity = '0'; // Oculto pero accesible
document.body.appendChild(video);

// 3. Solicitar webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => console.error("Error en webcam:", err));

// 4. Crear partículas (plano grid)
const gridSize = 64;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(gridSize * gridSize * 3);
const colors = new Float32Array(gridSize * gridSize * 3);

for (let i = 0; i < gridSize * gridSize; i++) {
    positions[i * 3] = (i % gridSize) / gridSize * 10 - 5;
    positions[i * 3 + 1] = Math.floor(i / gridSize) / gridSize * 10 - 5;
    positions[i * 3 + 2] = 0;
    colors[i * 3] = 0.2; // R
    colors[i * 3 + 1] = 0.5; // G
    colors[i * 3 + 2] = 1.0; // B
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
camera.position.z = 10;

// 5. Cargar TensorFlow.js y el modelo de rostros DINÁMICAMENTE
let faceModel = null;

async function loadFaceModel() {
    const tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.11.0/dist/tf.min.js');
    const faceLandmarksDetection = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-landmarks-detection@0.0.3/dist/face-landmarks-detection.js');
    
    await tf.ready();
    faceModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
    );
    console.log("Modelo de rostros cargado!");
}

loadFaceModel().catch(err => console.error("Error cargando modelo:", err));

// 6. Animación con detección de rostros
async function animate() {
    requestAnimationFrame(animate);
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && faceModel) {
        try {
            const faces = await faceModel.estimateFaces(video);
            
            if (faces.length > 0) {
                const nose = faces[0].scaledMesh[4]; // Punto de la nariz
                const positions = particlesGeometry.attributes.position.array;
                
                for (let i = 0; i < gridSize * gridSize; i++) {
                    positions[i * 3 + 2] = (nose[2] * 0.01) - 5; // Ajusta este valor
                }
                particlesGeometry.attributes.position.needsUpdate = true;
            }
        } catch (err) {
            console.error("Error detectando rostro:", err);
        }
    }
    
    renderer.render(scene, camera);
}

animate();

// 7. Ajustar tamaño al cambiar ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
