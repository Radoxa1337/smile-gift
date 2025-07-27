document.addEventListener('DOMContentLoaded', async () => {
    // Элементы интерфейса
    const video = document.getElementById('cameraView');
    const cameraSection = document.getElementById('cameraSection');
    const resultSection = document.getElementById('result');
    const capturedPhoto = document.getElementById('capturedPhoto');
    const dateElement = document.getElementById('date');
    const smileProgress = document.getElementById('smileProgress');
    
    // Переменные состояния
    let smileCounter = 0;
    const smileThreshold = 5; // Сколько кадров с улыбкой нужно для срабатывания
    
    // Загружаем модели face-api.js
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models')
    ]);
    
    // Запускаем камеру
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            startDetection();
        };
    } catch (err) {
        alert('Не удалось получить доступ к камере. Пожалуйста, разрешите доступ и обновите страницу.');
        console.error('Camera error:', err);
    }
    
    // Основная функция обнаружения
    function startDetection() {
        const detectionInterval = setInterval(async () => {
            const detections = await faceapi.detectAllFaces(
                video, 
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceExpressions();
            
            if (detections.length > 0) {
                const expressions = detections[0].expressions;
                const smileProbability = expressions.happy;
                
                // Обновляем индикатор улыбки
                smileProgress.style.width = `${smileProbability * 100}%`;
                
                if (smileProbability > 0.8) {
                    smileCounter++;
                    
                    // Если улыбались несколько кадров подряд
                    if (smileCounter >= smileThreshold) {
                        clearInterval(detectionInterval);
                        capturePhoto();
                    }
                } else {
                    smileCounter = Math.max(0, smileCounter - 1);
                }
            } else {
                smileProgress.style.width = '0%';
                smileCounter = 0;
            }
        }, 100);
    }
    
    // Функция захвата фото
    function capturePhoto() {
        // Создаем canvas для фото
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Рисуем кадр с видео
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Применяем эффекты
        applyNewspaperEffect(canvas);
        
        // Останавливаем камеру
        video.srcObject.getTracks().forEach(track => track.stop());
        
        // Показываем результат
        capturedPhoto.src = canvas.toDataURL('image/jpeg');
        dateElement.textContent = new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        
        // Воспроизводим звук
        playCaptureSound();
        
        // Анимация перехода
        cameraSection.style.opacity = 0;
        setTimeout(() => {
            cameraSection.classList.add('hidden');
            resultSection.style.display = 'block';
            createConfetti();
        }, 500);
    }
    
    // Эффект газетной печати
    function applyNewspaperEffect(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Преобразуем в ч/б с шумом
        for (let i = 0; i < data.length; i += 4) {
            // Яркость по формуле NTSC
            const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const noise = Math.random() * 40 - 20;
            const value = brightness + noise;
            
            // Дизеринг для газетного эффекта
            const threshold = 128;
            const newValue = value > threshold ? 220 + Math.random() * 20 : 50 - Math.random() * 20;
            
            data[i] = data[i + 1] = data[i + 2] = newValue;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    // Звук срабатывания затвора
    function playCaptureSound() {
        const sound = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-camera-shutter-click-1133.mp3');
        sound.volume = 0.3;
        sound.play().catch(e => console.log('Autoplay prevented:', e));
    }
    
    // Создаем конфетти
    function createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff9ff3'];
        const container = document.querySelector('.container');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = `${Math.random() * 100}%`;
            container.appendChild(confetti);
            
            // Анимация
            const animation = confetti.animate([
                { 
                    transform: `translateY(-20px) rotate(0deg)`,
                    opacity: 0 
                },
                { 
                    transform: `translateY(${Math.random() * 300 + 100}px) rotate(${Math.random() * 360}deg)`,
                    opacity: 1 
                }
            ], {
                duration: 1000 + Math.random() * 2000,
                easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)',
                delay: Math.random() * 500
            });
            
            animation.onfinish = () => confetti.remove();
        }
    }
});