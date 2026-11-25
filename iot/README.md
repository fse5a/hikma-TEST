# IoT / smart pen

No real pen code yet. There is a simulator so the rest of the app can be tested without hardware.

- `PROTOCOL.md`: scan event format and how to run the simulator (Arabic).
- `simulator/`: `pen-sim.mjs` (command line) and `index.html` (test page, open it directly in a browser). `events.mjs` builds and validates the events.
- `tests/`: run by `npm test`.

Real firmware goes in `iot/firmware/`. The backend has no endpoint for pen events yet.
