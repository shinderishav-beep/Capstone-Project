# Hue & You — Restore the Color

A browser game about being yourself. The world has turned gray because everyone
stopped expressing their individuality — and you, the last spark of color, must
bring it back.

## The story

Explore a gray world as a small colorful hero. Four magical crystals lie hidden
in the four corners of the map, each guarded by a character who shares a quote
from a fictional book and challenges you to express who you really are. Every
crystal you earn restores color to part of the world — trees turn green,
flowers bloom, houses brighten — until the whole map is vibrant again.

Along the way the game quietly listens to your choices, and the ending tells
you **what kind of person you are**: The Bold Trailblazer, The Creative Spirit,
The Thoughtful Dreamer, The Kind Heart, The Curious Explorer, or The Joyful Spark.

## The four guardians, books and challenges

| Guardian | Place | Book quote | Challenge |
|---|---|---|---|
| Mira the Cat | Northwest Woods | *Alice's Adventures in Wonderland* — Lewis Carroll | Find your own way through a maze with many paths |
| Orin the Owl | Northeast Village | *Harry Potter and the Chamber of Secrets* — J.K. Rowling | Choose YOUR favorite color, not the most popular one |
| Pip the Songbird | Southwest Garden | *Happy Birthday to You!* — Dr. Seuss | Answer honest questions about your interests and strengths |
| Chroma the Chameleon | Southeast Meadow | *Wonder* — R.J. Palacio | Customize your character into a look that's truly yours |

Each quote is a lesson: your choices show who you are, there are many right
paths, no one is "Youer than You", and you were born to stand out.

## How to play

- **Move:** WASD or Arrow keys (on-screen controls appear on touch devices)
- **Talk:** E, Space, or Enter near a guardian
- Walk to each glowing crystal, talk to its guardian, read the quote, and
  complete the challenge. There are no wrong answers — only *your* answers.

## Running the game

It's a fully static site — no build step, no dependencies.

```bash
# option 1: just open it
open index.html

# option 2: serve it
npx http-server .
# then visit http://localhost:8080
```

## Project structure

```
index.html        page layout: title screen, HUD, dialog, modals, ending
style.css         all styling
js/data.js        guardians, quotes, challenge content, personality data
js/sprites.js     procedural canvas art (player, guardians, crystals)
js/challenges.js  the four challenges + personality scoring
js/game.js        world map, movement, dialogs, color restoration, ending
```

Everything is drawn procedurally on a `<canvas>` — there are no image assets.
The "color returns" effect works by storing every world color as RGB and
desaturating it toward gray per zone; collecting a crystal tweens that zone's
saturation from 0 back to 1.

## The message

When everyone tries to be the same, the world loses its light. Be proud of who
you are, make your own choices, and never be afraid to express yourself —
embracing individuality makes the world a better, brighter place.
