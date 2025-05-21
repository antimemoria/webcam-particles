// 1. Configura Three.js (como antes)
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Crear partículas (ejemplo: plano grid)
const gridSize = 64;
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(gridSize * gridSize * 3);
// ... (igual que antes)

// 3. Configurar TensorFlow.js y modelo de rostros
let faceModel;
async function setupFaceDetection() {
    await tf.ready(); // Esperar a que TensorFlow.js esté listo
    faceModel = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 } // Solo detectar un rostro
    );
}
setupFaceDetection();

// 4. Animación con detección de rostros
async function animate() {
    requestAnimationFrame(animate);
    
    if (video.readyState === video.HAVE_ENOUGH_DATA && faceModel) {
        // Detectar rostros
        const faces = await faceModel.estimateFaces(video);
        
        if (faces.length > 0) {
            const face = faces[0];
            // Obtener puntos clave del rostro (ej.: nariz, boca)
            const nose = face.scaledMesh[4]; // Punto de la nariz
            
            // Mover partículas hacia el rostro
            for (let i = 0; i < gridSize * gridSize; i++) {
                positions[i * 3 + 2] = -nose[2] * 0.1; // Ajustar profundidad
            }
            particlesGeometry.attributes.position.needsUpdate = true;
        }
    }
    renderer.render(scene, camera);
}
animate();
