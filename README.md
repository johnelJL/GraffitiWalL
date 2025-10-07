# GraffitiWalL

GraffitiWalL is an interactive activation concept where visitors scan a QR code, use their mobile phones as controllers, and draw graffiti collaboratively on a shared video wall. Strokes fade automatically after a configurable amount of time (e.g., five minutes), keeping the canvas fresh for continuous play.

## Project Goals
- Deliver a wow-factor installation that feels immediate and collaborative.
- Support dozens of simultaneous mobile users without lag.
- Offer a creative toolset (spray, brush, marker, thickness, colors) that works intuitively on touch devices.
- Keep the wall content rotating by expiring older strokes and fading them out smoothly.

## Getting Started
1. Review the [Implementation Plan](docs/implementation_plan.md) for architecture, data flow, and deployment guidance.
2. Prototype the mobile controller UI and video wall renderer.
3. Stand up the WebSocket gateway and connect real-time messaging between controllers and the wall.
4. Iterate on visuals, moderation tools, and on-site deployment specifics.

## Repository Structure
```
README.md                # Project overview and quick start
/docs/implementation_plan.md  # Detailed plan covering architecture, data model, hardware, and roadmap
```

## Next Steps
- Flesh out UX/UI designs for both the controller and wall visuals.
- Choose the exact stack (e.g., React + Node.js + Redis) and set up the development environment.
- Begin implementing the milestones outlined in the plan.

