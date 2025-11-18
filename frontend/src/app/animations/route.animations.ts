import { trigger, transition, style, animate, query } from "@angular/animations";

/**
 * Animación de transición para rutas
 * Efecto: Fade in + slide desde abajo
 */
export const routeAnimations = trigger("routeAnimations", [
  transition("* <=> *", [
    // Estilo inicial para ambas páginas
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    // Página que sale: fade out y slide hacia arriba
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0%)" }),
        animate(
          "500ms ease-in-out",
          style({ opacity: 0, transform: "translateY(-15px)" }),
        ),
      ],
      { optional: true },
    ),
    // Página que entra: fade in y slide desde abajo
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(15px)" }),
        animate(
          "600ms ease-out",
          style({ opacity: 1, transform: "translateY(0%)" }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación más simple: solo fade in
 */
export const fadeInAnimation = trigger("fadeIn", [
  transition(":enter", [
    style({ opacity: 0 }),
    animate("600ms ease-out", style({ opacity: 1 })),
  ]),
  transition(":leave", [
    animate("400ms ease-in", style({ opacity: 0 })),
  ]),
]);

/**
 * Animación 3: Slide from right
 */
export const slideFromRightAnimation = trigger("slideFromRight", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateX(0%)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateX(-15px)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateX(15px)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "translateX(0%)" })),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación 4: Slide from left
 */
export const slideFromLeftAnimation = trigger("slideFromLeft", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateX(0%)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateX(15px)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateX(-15px)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "translateX(0%)" })),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación 5: Scale in
 */
export const scaleInAnimation = trigger("scaleIn", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "scale(1)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "scale(0.96)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "scale(0.96)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "scale(1)" })),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación 6: Rotate + fade
 */
export const rotateFadeAnimation = trigger("rotateFade", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "rotate(0deg)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "rotate(-3deg)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "rotate(3deg)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "rotate(0deg)" })),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación 7: Bounce in
 */
export const bounceInAnimation = trigger("bounceIn", [
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0) scale(1)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateY(10px) scale(0.95)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(25px) scale(0.9)" }),
        animate(
          "700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          style({ opacity: 1, transform: "translateY(0) scale(1)" }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);

/**
 * Animación combinada que aplica diferentes animaciones según el tipo de ruta
 */
export const routeAnimationsAdvanced = trigger("routeAnimationsAdvanced", [
  // slideRight: Slide from right (Login/Register)
  transition("* => slideRight", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateX(0%)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateX(-15px)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateX(15px)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "translateX(0%)" })),
      ],
      { optional: true },
    ),
  ]),
  // scaleIn: Scale in (Admin pages)
  transition("* => scaleIn", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "scale(1)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "scale(0.96)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "scale(0.96)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "scale(1)" })),
      ],
      { optional: true },
    ),
  ]),

  // slideLeft: Slide from left (Patient/Specialist pages)
  transition("* => slideLeft", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateX(0%)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateX(15px)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateX(-15px)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "translateX(0%)" })),
      ],
      { optional: true },
    ),
  ]),

  // bounceIn: Bounce in (Bienvenida)
  transition("* => bounceIn", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0) scale(1)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "translateY(10px) scale(0.95)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(25px) scale(0.9)" }),
        animate(
          "700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
          style({ opacity: 1, transform: "translateY(0) scale(1)" }),
        ),
      ],
      { optional: true },
    ),
  ]),

  // rotateFade: Rotate + fade (puede usarse para transiciones especiales)
  transition("* => rotateFade", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "rotate(0deg)" }),
        animate("500ms ease-in-out", style({ opacity: 0, transform: "rotate(-3deg)" })),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "rotate(3deg)" }),
        animate("600ms ease-out", style({ opacity: 1, transform: "rotate(0deg)" })),
      ],
      { optional: true },
    ),
  ]),

  // fadeSlide: Fade in + slide from bottom (default)
  transition("* => fadeSlide", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0%)" }),
        animate(
          "500ms ease-in-out",
          style({ opacity: 0, transform: "translateY(-15px)" }),
        ),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(15px)" }),
        animate(
          "600ms ease-out",
          style({ opacity: 1, transform: "translateY(0%)" }),
        ),
      ],
      { optional: true },
    ),
  ]),

  // Catch-all: Para cualquier cambio entre estados no definidos
  transition("* <=> *", [
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          left: 0,
          right: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [
        style({ opacity: 1, transform: "translateY(0%)" }),
        animate(
          "500ms ease-in-out",
          style({ opacity: 0, transform: "translateY(-15px)" }),
        ),
      ],
      { optional: true },
    ),
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(15px)" }),
        animate(
          "600ms ease-out",
          style({ opacity: 1, transform: "translateY(0%)" }),
        ),
      ],
      { optional: true },
    ),
  ]),
]);

