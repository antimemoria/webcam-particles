// 1. Configuración de Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // Fondo negro
document.body.appendChild(renderer.domElement);

// 2. Configuración de la webcam y canvas para procesamiento
const video = document.createElement('video');
video.width = 160;  // Resolución baja para mejor rendimiento
video.height = 90;
const canvas = document.createElement('canvas');
canvas.width = video.width;
canvas.height = video.height;
const ctx = canvas.getContext('2d');

// 3. Solicitar acceso a la webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => console.error("Error al acceder a la webcam:", err));

// 4. Crear partículas en un plano grid 3D
const gridSize = 64; // 64x64 partículas (4096 total)
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(gridSize * gridSize * 3);
const colors = new Float32Array(gridSize * gridSize * 3);
const sizes = new Float32Array(gridSize * gridSize);

let i = 0;
for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
        // Posición inicial en un plano
        positions[i * 3] = (x / gridSize - 0.5) * 10; // x (-5 a 5)
        positions[i * 3 + 1] = (y / gridSize - 0.5) * 10; // y (-5 a 5)
        positions[i * 3 + 2] = 0; // z (profundidad inicial)

        // Color inicial (blanco)
        colors[i * 3] = 1; // R
        colors[i * 3 + 1] = 1; // G
        colors[i * 3 + 2] = 1; // B

        // Tamaño aleatorio
        sizes[i] = Math.random() * 0.1 + 0.05;
        i++;
    }
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
camera.position.z = 10;

// 5. Animación: deformar el plano con la webcam
function animate() {
    requestAnimationFrame(animate);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, video.width, video.height);
        const imageData = ctx.getImageData(0, 0, video.width, video.height);
        const data = imageData.data;
        const positions = particlesGeometry.attributes.position.array;

        for (let i = 0; i < gridSize * gridSize; i++) {
            const x = Math.floor((positions[i * 3] / 10 + 0.5) * video.width);
            const y = Math.floor((positions[i * 3 + 1] / 10 + 0.5) * video.height);

            if (x >= 0 && x < video.width && y >= 0 && y < video.height) {
                const pixelIndex = (y * video.width + x) * 4;
                const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 765; // 0-1

                // Deformar en Z basado en el brillo
                positions[i * 3 + 2] = (brightness - 0.5) * 5; // -2.5 a 2.5

                // Opcional: Cambiar color basado en el brillo
                particlesGeometry.attributes.color.array[i * 3] = brightness * 2; // R
                particlesGeometry.attributes.color.array[i * 3 + 1] = brightness * 0.5; // G
                particlesGeometry.attributes.color.array[i * 3 + 2] = 1 - brightness; // B
            }
        }

        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.color.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

animate();

// 6. Ajustar tamaño al cambiar ventana
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
