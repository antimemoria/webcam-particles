// 1. Configura Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Solicitar acceso a la webcam
const video = document.createElement('video');
document.body.appendChild(video); // Opcional: muestra el video en pantalla (útil para debug)

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
    })
    .catch(err => alert("¡Necesitas permitir el acceso a la webcam! Error: " + err));

// 3. Crear partículas
const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 2000;
const posArray = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5; // Posiciones aleatorias en 3D
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
const particlesMaterial = new THREE.PointsMaterial({
    size: 0.03,
    color: 0x00ff00 // Partículas verdes
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

camera.position.z = 3; // Alejar la cámara para ver las partículas

// 4. Animación (por ahora solo rotación)
function animate() {
    requestAnimationFrame(animate);
    particles.rotation.x += 0.005;
    particles.rotation.y += 0.005;
    renderer.render(scene, camera);
}
animate();