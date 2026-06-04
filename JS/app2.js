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

function dibujarCuadro(ctx, box, texto, color){
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    ctx.fillStyle = color;
    ctx.font = "18px Arial";
    ctx.fillText(texto, box.x, box.y > 20 ? box.y -5 : box.y +20);
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
        const detecciones = await faceapi.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceExpressions()
            .withFaceDescriptor();
        const resized = faceapi.resizeResults(detecciones, displaySize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0,0,canvas.width,canvas.height);
        resized.forEach(det => {
            const box = det.detection.box;
            if(!descriptorReferencia){
                dibujarCuadro(ctx, box, "Sin referencia", "orange")
            } else {
                const distancia = faceapi.euclideanDistance(descriptorReferencia,det.descriptor);
                if(distancia<0.45){
                    dibujarCuadro(ctx, box, "José Beraún", "lime")
                } else {
                    dibujarCuadro(ctx, box, "Desconocido", "red")
                }
            }
        });
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