# 🐧 SlappyPenguin

A fun and competitive 2-player browser game where penguins battle it out on an iceberg! Knock your opponent off the ice using strategic movement and well-timed slaps. First penguin to win 10 rounds claims victory!

## 🎮 Live Demo (Development Version)

**[Play SlappyPenguin Now!](https://htmlpreview.github.io/?https://github.com/cpeppsi/slappypenguin/blob/README%2FTest/index.html)**

## 🎯 How to Play

### Objective
Knock your opponent's penguin off the iceberg by moving strategically and using your slap ability. The first player to win 10 rounds wins the game!

### Game Flow
1. **Character Selection**: Each player chooses a unique colored penguin
2. **Movement & Combat**: Use keyboard controls to move and slap
3. **Win Conditions**: Push your opponent off the edge or slap them off the iceberg
4. **Victory**: First to 10 round wins takes the championship!

### Controls

| Player | Movement | Slap |
|--------|----------|------|
| **Player 1** | W, A, S, D | SPACEBAR |
| **Player 2** | Arrow Keys | ENTER |

### Game Mechanics
- **Movement**: Smooth directional movement with momentum and friction
- **Slapping**: 1-second cooldown between slaps with visual feedback
- **Physics**: Realistic collision detection and force application
- **Boundaries**: Fall off any edge of the iceberg to lose the round

## 🚀 Quick Start

### Option 1: Play Online (Recommended)
Simply visit the [live demo link](https://cpeppsi.github.io/slappypenguin) and start playing immediately!

### Option 2: Download & Play Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/cpeppsi/slappypenguin.git
   cd slappypenguin
   ```

2. **Open the game**
   - Double-click `index.html` to open in your default browser
   - OR right-click `index.html` → "Open with" → Choose your preferred browser
   - OR serve locally with a simple HTTP server:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Python 2
     python -m SimpleHTTPServer 8000
     
     # Node.js (if you have http-server installed)
     npx http-server
     ```
   - Then visit `http://localhost:8000`

3. **Start Playing!**
   - Select your penguin colors
   - Read the instructions
   - Challenge a friend to an epic penguin battle!

## 🛠️ Technical Implementation

### Architecture
The game is built with vanilla web technologies for maximum compatibility and performance:

- **HTML5**: Semantic structure and game layout
- **CSS3**: Responsive design, animations, and visual effects
- **JavaScript (ES6+)**: Game logic, physics engine, and user interactions

### Key Features
- **Character Selection System**: 7 unique penguin colors with visual selection interface
- **Real-time Physics**: Custom physics engine with velocity, friction, and collision detection
- **Smooth Animations**: CSS transitions and JavaScript-driven movement
- **Visual Feedback**: Slap animations, scaling effects, and visual indicators
- **Responsive Design**: Adapts to different screen sizes
- **Game State Management**: Proper game flow with multiple screens and state tracking

### File Structure
```
slappypenguin/
├── index.html          # Main game HTML structure
├── style.css           # All styling and animations
├── script.js           # Game logic and physics engine
└── README.md          # This documentation
```

### Code Highlights

#### Physics Engine
- Custom collision detection between penguins
- Momentum-based movement with realistic friction
- Force application for slapping mechanics
- Boundary detection for win/lose conditions

#### Visual System
- Pixel-art style penguin sprites created with SVG
- CSS filter-based color variations
- Smooth animations for slapping and movement
- Dynamic visual feedback for game events

#### Game Logic
- Turn-based round system with score tracking
- Cooldown management for balanced gameplay
- Multiple game states (character selection, gameplay, game over)
- Event-driven input handling for responsive controls

## 🎨 Customization

### Adding New Penguin Colors
Edit the `colorFilters` object in `script.js`:
```javascript
const colorFilters = {
    newcolor: 'hue-rotate(XXXdeg) saturate(XXX%) brightness(XXX)',
    // Add your custom filter here
};
```

### Adjusting Game Mechanics
Key variables in `script.js` you can modify:
- `slapForce`: How hard penguins get knocked back
- `slapCooldown`: Time between slaps (milliseconds)
- `winScore`: Rounds needed to win the game
- `friction`: How quickly penguins slow down

### Styling Changes
Modify `style.css` to customize:
- Game arena appearance
- Penguin animations
- UI colors and fonts
- Button styles and effects

## 🔧 Browser Compatibility

- **Chrome**: Full support ✅
- **Firefox**: Full support ✅
- **Safari**: Full support ✅
- **Edge**: Full support ✅
- **Mobile browsers**: Optimized for touch devices ✅

*Note: Game requires JavaScript to be enabled*

## 📱 Mobile Support

While optimized for desktop with keyboard controls, the game includes responsive design for mobile viewing. For the best mobile experience, consider adding touch controls in a future update.

## 🤝 Contributing

Interested in improving SlappyPenguin? Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to your branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Ideas for Contributions
- Touch controls for mobile devices
- Sound effects and background music
- Power-ups and special abilities
- Tournament mode with multiple players
- Online multiplayer functionality
- Additional penguin customization options

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🎉 Credits

Created by [Casey Epps]. Built as a fun project to demonstrate game development with vanilla web technologies.

---

**Enjoy the game and may the best penguin win! 🐧🏆**