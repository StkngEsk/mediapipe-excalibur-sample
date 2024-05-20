import {
  Gestures,
  createGestureRecognizer,
  enableCam,
  hasGetUserMedia,
  isPredictionsStarted,
  lastGesture,
} from "./gesture";
import {
  Actor,
  CollisionType,
  Color,
  Engine,
  SolverStrategy,
  Vector,
  vec,
} from "excalibur";

const game = new Engine({
  width: 800,
  height: 600,
  canvasElementId: "game",
  fixedUpdateFps: 60,
  physics: {
    solver: SolverStrategy.Arcade,
    gravity: vec(0, 800),
  },
});

game.start().then(async () => {
  if (hasGetUserMedia()) {
    await createGestureRecognizer();
    enableCam();
  } else {
    alert("Tu navegador no soporte el uso de Webcam");
    console.warn("getUserMedia() no es soportado por tu navegador");
  }
});

const floor = new Actor({
  pos: vec(400, 560),
  width: 800,
  height: 80,
  color: Color.Green,
  collisionType: CollisionType.Fixed,
});

game.add(floor);

class Player extends Actor {
  constructor(pos: Vector) {
    super({
      pos,
      width: 64,
      height: 96,
      collisionType: CollisionType.Active,
      color: Color.Red,
    });
  }

  onPreUpdate(_engine: Engine<any>, _delta: number): void {
    if (!isPredictionsStarted) return;

    if (lastGesture === Gestures.ROCK) {
      this.vel.y = -600;
    }
  }
}

const player = new Player(vec(300, 300));

game.add(player);
