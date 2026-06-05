const video = document.getElementById("video");
const seleccionarCamara = document.getElementById("seleccionarCamara");
const fotoReferencia = document.getElementById("fotoReferencia");
const resultado = document.getElementById("resultado");

let descriptorReferencia = null;
let canvas = null;

async function cargarModelos() {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/weights");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/weights");
    await faceapi.nets.faceExpressionNet.loadFromUri("/weights");
    await faceapi.nets.faceRecognitionNet.loadFromUri("/weights");
}

fotoReferencia.addEventListener("change", async() => {
    const archivo = fotoReferencia.files[0];
    if (!archivo) return;
    const imagen = await faceapi.bufferToImage(archivo);
    const deteccion = await faceapi.detectSingleFace(imagen, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withFaceDescriptor();
    if(!deteccion) {
        resultado.textContent = "No se detectó un rostro en la imagen";
    } else {
        descriptorReferencia = deteccion.descriptor;
        resultado.textContent = "Descriptor del rostro cargado correctamente";
    }
});

video.addEventListener("playing", () => {
    canvas = faceapi.createCanvasFromMedia(video);
    const cont = document.getElementById("cont");
    cont.appendChild(canvas);
    const displaySize = {
        width: video.clientWidth,
        height: video.clientHeight
    };
    faceapi.matchDimensions(canvas,displaySize);
    setInterval(async() => {
        const detecciones = await faceapi.detectSingleFace(video,new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptor();
        const resized = faceapi.resizeResults(detecciones, displaySize);
        canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
        faceapi.draw.drawDetections(canvas,resized);
        faceapi.draw.drawFaceLandmarks(canvas,resized);
        faceapi.draw.drawFaceExpressions(canvas,resized);
        if (detecciones && descriptorReferencia) {
            const distancia = faceapi.euclideanDistance(descriptorReferencia, detecciones.descriptor);
            console.log(distancia);
            if (distancia < 0.5) {
                resultado.textContent = "Persona identificada";
                resultado.style.color = "white";
            } else {
                resultado.textContent = "Persona NO identificada";
                resultado.style.color = "red";
            }
        }
    },100);
});

async function verCamaras() {
    const dispositivos = await navigator.mediaDevices.enumerateDevices();
    const camaras = dispositivos.filter(d => d.kind === "videoinput");
    seleccionarCamara.innerHTML = "";
    camaras.forEach((camara,index) => {
        const option = document.createElement("option");
        option.value = camara.deviceId;
        option.text = camara.label;
        seleccionarCamara.appendChild(option);
    });
}
async function iniciarCamara(idCamara = null) {
    const configuracion = {
        video: idCamara ? { deviceId: {exact: idCamara}} : true
    };
    navigator.mediaDevices.getUserMedia(configuracion)
        .then(stream => {
            video.srcObject = stream;}
        )
        .catch(error => {
            console.error("Error al acceder a la cámara", error);
            alert("No se pudo acceder a la cámara");
        });
}

async function iniciar() {
    await cargarModelos();
    iniciarCamara();
    verCamaras();
}

seleccionarCamara.addEventListener("change", async() => {
    await iniciarCamara(seleccionarCamara.value);
});

iniciar();