// 1. Configura Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Elementos para la webcam
const video = document.createElement('video');
video.width = 80;  // Baja resolución para rendimiento
video.height = 60;
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
    .catch(err => alert("¡Permite el acceso a la webcam! " + err));

// 4. Crear partículas en forma de esfera
const particlesCount = 5000;
const particlesGeometry = new THREE.BufferGeometry();
const posArray = new Float32Array(particlesCount * 3);
const sizeArray = new Float32Array(particlesCount);

// Distribuir partículas en una esfera
const radius = 3;
for (let i = 0; i < particlesCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta); // x
    posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta); // y
    posArray[i * 3 + 2] = radius * Math.cos(phi); // z
    
    sizeArray[i] = Math.random() * 0.1 + 0.05; // Tamaño aleatorio
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.1,
    color: 0x00ff00,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8
});

const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
camera.position.z = 5;

// 5. Animación con deformación por webcam
function animate() {
    requestAnimationFrame(animate);
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, video.width, video.height);
        const imageData = ctx.getImageData(0, 0, video.width, video.height);
        const data = imageData.data;
        const positions = particlesGeometry.attributes.position.array;
        
        for (let i = 0; i < particlesCount; i++) {
            // Mapear partícula a posición en el video
            const x = Math.floor((positions[i * 3] / radius + 1) * 0.5 * video.width);
            const y = Math.floor((positions[i * 3 + 1] / radius + 1) * 0.5 * video.height);
            
            if (x >= 0 && x < video.width && y >= 0 && y < video.height) {
                const pixelIndex = (y * video.width + x) * 4;
                const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 765; // 0-1
                
                // Deformar la esfera basado en el brillo
                positions[i * 3 + 2] = radius * (positions[i * 3 + 2] / radius) * (brightness * 2);
            }
        }
        
        particlesGeometry.attributes.position.needsUpdate = true;
    }
    
    renderer.render(scene, camera);
}

animate();
