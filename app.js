// 1. Configura Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Elementos para procesar la webcam
const video = document.createElement('video');
video.width = 64;  // Reducción de resolución para mejor rendimiento
video.height = 48;
const canvas = document.createElement('canvas');
canvas.width = video.width;
canvas.height = video.height;
const ctx = canvas.getContext('2d');

// 3. Solicitar webcam
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => alert("¡Permite el acceso a la webcam! Error: " + err));

// 4. Crear partículas
const particlesCount = 2000;
const particlesGeometry = new THREE.BufferGeometry();
const posArray = new Float32Array(particlesCount * 3);
const colorArray = new Float32Array(particlesCount * 3);

for (let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
    colorArray[i] = Math.random(); // Colores iniciales aleatorios
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,  // Usar colores por partícula
    transparent: true,
    opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
camera.position.z = 5;

// 5. Animación con webcam
function animate() {
    requestAnimationFrame(animate);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Dibujar el video en el canvas
        ctx.drawImage(video, 0, 0, video.width, video.height);
        const imageData = ctx.getImageData(0, 0, video.width, video.height);
        const data = imageData.data;

        // Mapear píxeles a partículas
        const positions = particlesGeometry.attributes.position.array;
        const colors = particlesGeometry.attributes.color.array;

        for (let i = 0; i < particlesCount; i++) {
            // Mapear posición de partícula a píxel en el video
            const x = Math.floor((positions[i * 3] + 2.5) * (video.width / 5));
            const y = Math.floor((positions[i * 3 + 1] + 2.5) * (video.height / 5));

            if (x >= 0 && x < video.width && y >= 0 && y < video.height) {
                const pixelIndex = (y * video.width + x) * 4;
                const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 765; // 0-1

                // Mover partículas en Z basado en brillo
                positions[i * 3 + 2] = (brightness - 0.5) * 5;

                // Cambiar color basado en el píxel
                colors[i * 3] = data[pixelIndex] / 255;     // R
                colors[i * 3 + 1] = data[pixelIndex + 1] / 255; // G
                colors[i * 3 + 2] = data[pixelIndex + 2] / 255; // B
            }
        }

        particlesGeometry.attributes.position.needsUpdate = true;
        particlesGeometry.attributes.color.needsUpdate = true;
    }

    particles.rotation.y += 0.001;
    renderer.render(scene, camera);
}

animate();
