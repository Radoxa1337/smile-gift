document.addEventListener('DOMContentLoaded', async () => {
    const video = document.getElementById('cameraView');
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.padding = '20px';
    document.body.prepend(errorDiv);

    // 1. Проверка поддержки MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        errorDiv.innerHTML = 'Ваш браузер не поддерживает доступ к камере. Попробуйте Chrome или Firefox.';
        return;
    }

    // 2. Запрос доступа к камере
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });
        
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();

        // 3. Загрузка моделей face-api.js
        try {
            await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            await faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
            startDetection(video);
        } catch (modelError) {
            errorDiv.innerHTML = 'Ошибка загрузки моделей распознавания. Обновите страницу.';
            console.error(modelError);
        }
    } catch (cameraError) {
        errorDiv.innerHTML = `
            ❌ Ошибка доступа к камере: <strong>${cameraError.message}</strong><br>
            Пожалуйста:<br>
            1. Разрешите доступ к камере.<br>
            2. Проверьте, не блокирует ли её другое приложение.<br>
            3. Попробуйте другой браузер.
        `;
        console.error(cameraError);
    }

    function startDetection(video) {
        setInterval(async () => {
            const detections = await faceapi.detectAllFaces(video, 
                new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();
            
            if (detections.length > 0 && detections[0].expressions.happy > 0.8) {
                capturePhoto(video);
            }
        }, 500);
    }
});
