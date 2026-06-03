const video = document.getElementById("video");
const selecionarCamara = document.getElementById("selecionarCamara");

async function cargarModelos() {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/weights");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/weights");
    await faceapi.nets.faceExpressionNet.loadFromUri("/weights");
}

video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = {
        width: video.width,
        height: video.height
    };

    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detecciones = await faceapi
            .detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions();

        const resized = faceapi.resizeResults(detecciones, displaySize);

        canvas
            .getContext("2d")
            .clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);
    }, 100);
});

async function verCamaras() {
    const dispositivos = await navigator.mediaDevices.enumerateDevices();

    const camaras = dispositivos.filter(d => {
        return d.kind === "videoinput";
    });

    selecionarCamara.innerHTML = "";

    camaras.forEach((camara, index) => {
        const option = document.createElement("option");
        option.value = camara.deviceId;
        option.text = camara.label || `Cámara ${index + 1}`;
        selecionarCamara.appendChild(option);
    });
}

async function iniciarCamara(idCamara = null) {
    const configuracion = {
        video: idCamara
            ? { deviceId: { exact: idCamara } }
            : true
    };

    navigator.mediaDevices
        .getUserMedia(configuracion)
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(error => {
            console.error("Error:", error);
            alert("No se pudo acceder a la cámara");
        });
}

async function iniciar() {
    await cargarModelos();
    await iniciarCamara();
    await verCamaras();
}

selecionarCamara.addEventListener("change", async () => {
    await iniciarCamara(selecionarCamara.value);
});

iniciar();