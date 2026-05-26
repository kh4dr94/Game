# Stellar Vanguard - Space Shooter

A fast-paced arcade space shooter game built with vanilla HTML5 Canvas and JavaScript. No frameworks, no dependencies — just pure browser gaming.

![Game Preview](https://img.shields.io/badge/Game-Space%20Shooter-00ffff?style=for-the-badge)

## Features

- **Smooth 60fps gameplay** with HTML5 Canvas rendering
- **4 enemy types** — Basic, Zigzag, Tank, and Shooter with unique behaviors
- **Power-up system** — Weapon upgrades, shields, and fire rate boosts
- **Combo scoring** — Chain kills for multiplied points
- **Progressive difficulty** — Waves get harder with more enemy variety
- **Particle effects** — Explosions, thrusters, and pickup effects
- **Screen shake** — Impactful feedback on taking damage
- **Cyberpunk UI** — Neon-styled interface with glow effects

## How to Play

### Controls
| Key | Action |
|-----|--------|
| WASD / Arrow Keys | Move ship |
| Space | Shoot |
| P | Pause/Resume |

### Power-Ups
| Symbol | Effect |
|--------|--------|
| **P** (Green) | Upgrade weapon (up to triple shot) |
| **S** (Cyan) | Temporary shield |
| **F** (Yellow) | Increased fire rate |

### Enemy Types
| Type | Behavior |
|------|----------|
| Basic (Red) | Moves straight down |
| Zigzag (Orange) | Weaves side to side |
| Shooter (Yellow) | Fires aimed bullets at player |
| Tank (Purple) | High HP, slow moving |

## Getting Started

Simply open `index.html` in any modern browser — no build step or server required!

```bash
# Or use a local server
npx serve .
```

## Technical Details

- **Pure vanilla JS** — No libraries or frameworks
- **Canvas 2D rendering** — All graphics drawn procedurally
- **Responsive design** — Fixed 800x600 game area with styled container
- **No assets required** — Everything is code-generated (shapes, particles, effects)

## License

MIT
