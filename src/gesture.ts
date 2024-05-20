import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
  GestureRecognizerResult,
} from "@mediapipe/tasks-vision";

import modelAssetPath from "../resources/gesture_recognizer.task?url";

export enum Gestures {
  NONE = "none",
  FOX = "fox",
  SCISSORS = "scissors",
  PAPER = "paper",
  ROCK = "rock",
}

let gestureRecognizer: GestureRecognizer;
let runningMode = "IMAGE";
const videoWidth = "360px"; // ancho de la webcam en el html
const videoHeight = "240px"; // altura de la webcam en el html
let webcamRunning = false;
export let isPredictionsStarted = false;
export let lastGesture: string = Gestures.NONE;

export const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath,
      delegate: "GPU",
    },
    // numHands: 2, /* Descomenta esta linea si entrenaste tu modelo de IA con imágenes que incluyen gestos de 2 manos */
    runningMode: runningMode as any,
    /* Hay mas parámetros que pueden serte de utilidad, solo modificar si sabes que es lo que estas haciendo */
  });
};

const video: HTMLVideoElement = document.getElementById(
  "webcam"
) as HTMLVideoElement;
const canvasElement: HTMLCanvasElement = document.getElementById(
  "output_canvas"
) as HTMLCanvasElement;
const canvasCtx = canvasElement.getContext("2d");
const gestureOutput: HTMLParagraphElement = document.getElementById(
  "gesture_output"
) as HTMLParagraphElement;

// Verificar acceso a la webcam
export function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// Iniciar la webcam y las predicciones de gestos
export function enableCam() {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }
  webcamRunning = true;

  const constraints = {
    video: true,
  };

  // Activar el stream de la data de tu webcam al código
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    video!.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results: GestureRecognizerResult;
async function predictWebcam() {
  isPredictionsStarted = true;
  const webcamElement: HTMLVideoElement = document.getElementById(
    "webcam"
  ) as HTMLVideoElement;
  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }
  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx?.save();
  canvasCtx?.clearRect(0, 0, canvasElement?.width, canvasElement?.height);
  const drawingUtils = new DrawingUtils(canvasCtx as CanvasRenderingContext2D);

  canvasElement.style.height = videoHeight;
  webcamElement.style.height = videoHeight;
  canvasElement.style.width = videoWidth;
  webcamElement.style.width = videoWidth;

  if (results.landmarks) {
    // Este fragmento de código es para dibujar los puntos rojos y las lineas en tu mano.
    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 2.5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 0.5,
      });
    }
  }

  canvasCtx?.restore();

  if (results.gestures.length > 0) {
    // Si hay una detección de gestos, osea se ven manos
    // Inicio de modificaciones en HTML para visualizar la detección de gestos
    gestureOutput.style.display = "block";
    gestureOutput.style.width = videoWidth;
    const categoryName = results.gestures[0][0].categoryName;
    const categoryScore = (results.gestures[0][0].score * 100).toFixed(2);
    gestureOutput.innerText = `Gesture: ${categoryName}\n Confidence: ${categoryScore}`;
    // Fin de modificaciones en HTML

    if (+categoryScore >= 50) {
      // Si la IA esta por lo menos 50% segura de que tienes un gesto, lo guardamos en la variable lastGesture
      lastGesture = categoryName.toLowerCase(); // Asignamos el gesto reconocido por la IA a una variable
    }
  } else {
    // Si no hay nada detectado, no hay gesto.
    gestureOutput.style.display = Gestures.NONE;
    lastGesture = Gestures.NONE;
  }
  // Esta función se llama en bucle para estar detectando continuamente tus manos.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
