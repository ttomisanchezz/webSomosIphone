// Registro central de GSAP + plugins (gratuitos desde GSAP 3.13).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/** El loop vacío de ScrollTrigger: `function f(){return x&&requestAnimationFrame(f)}`. */
const EMPTY_RAF_LOOP =
  /^function\s*[\w$]*\s*\(\)\s*\{\s*return\s+[\w$]+\s*&&\s*requestAnimationFrame\(\s*[\w$]+\s*\);?\s*\}$/;

// Al registrarse, ScrollTrigger arranca un requestAnimationFrame vacío que
// se vuelve a pedir a sí mismo para siempre (un arreglo para repintados de
// Firefox). En Chrome y Safari eso obliga al navegador a armar un frame
// completo en cada refresco aunque nada cambie: con la página quieta, un
// celular gastaba ~1/3 del procesador en eso. Fuera de Firefox se cancela
// ese loop (y nada más: si no se lo reconoce, queda todo como estaba). Los
// ScrollTrigger no lo usan para funcionar.
if (typeof window !== "undefined" && !/firefox/i.test(navigator.userAgent)) {
  const raf = window.requestAnimationFrame;
  const pedidos: [FrameRequestCallback, number][] = [];
  let anotando = true;
  // Pasa todo al rAF real; solo anota lo pedido mientras se registra (si
  // GSAP se guardara esta función, después sigue andando igual).
  window.requestAnimationFrame = (cb) => {
    const id = raf.call(window, cb);
    if (anotando) pedidos.push([cb, id]);
    return id;
  };
  try {
    gsap.registerPlugin(ScrollTrigger, SplitText);
  } finally {
    anotando = false;
    window.requestAnimationFrame = raf;
  }
  for (const [cb, id] of pedidos) {
    if (EMPTY_RAF_LOOP.test(String(cb))) window.cancelAnimationFrame(id);
  }
} else {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export { gsap, ScrollTrigger, SplitText };
