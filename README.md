# SE Quiz Academy - Interactive Learning Platform

An interactive web-based quiz application for mastering Software Engineering concepts. Built with modern web technologies including Three.js for immersive 3D visual effects.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Features

- **155+ Comprehensive Questions** covering 5 major software engineering topics
- **Interactive Quiz Interface** with instant feedback and detailed explanations
- **Three.js 3D Particle Background** for an engaging learning experience
- **Sound Effects System** - custom audio feedback for all interactions (Web Audio API)
- **Volume Control** - toggle sound on/off with one click
- **Topic Filtering** - focus on specific areas (PMBOK, Agile, Git, Risk, Testing)
- **Difficulty Levels** - Easy, Medium, Hard questions with weighted scoring
- **Progress Tracking** - real-time stats for score, correct answers, and streaks
- **Randomized Questions** - each session gets unique random questions, no repeats until all exhausted
- **Responsive Design** - works seamlessly on desktop, tablet, and mobile
- **Gamification** - points system, streak counter, and celebration particle effects
- **Beautiful UI** - dark theme with smooth animations and transitions

## Sound Effects

The application includes procedurally generated audio feedback for:
- **Click** - when selecting options and buttons
- **Hover** - subtle tone when moving over interactive elements
- **Correct Answer** - pleasant ascending chord
- **Incorrect Answer** - gentle descending buzz
- **Skip** - medium-pitched blip
- **Quiz Complete** - victory melody with celebration
- **Ambient Pad** - soft background atmosphere after completion

All sounds are generated using the Web Audio API—no external audio files required.

## Topics Covered

| Topic | Questions | Key Concepts |
|-------|-----------|--------------|
| PMBOK & Project Management | ~40 questions | Knowledge areas, process groups, SMART, Gantt, EVM, WBS, Critical Path |
| Agile & Scrum | ~40 questions | Scrum roles, ceremonies, Sprint, Velocity, DoD, Backlog, Planning |
| Version Control & Git | ~25 questions | Git commands, merge/rebase, branching, cherry-pick, bisect, submodules |
| Risk & Requirements | ~25 questions | Functional/Non-functional, RAID, risk strategies, MoSCoW, RTM |
| Software Testing | ~30 questions | Verification/Validation, testing levels, regression, black/white-box, coverage |

## Project Structure

```
fortest/
├── index.html          # Main HTML structure and styling
├── app.js              # Quiz logic, Three.js integration, interactivity
├── question-bank.json  # Complete question database
└── README.md           # This file
```

## Quick Start

1. **Clone or download** the repository
2. **Open** `index.html` in any modern web browser
3. **Start quizzing** - no build process or dependencies to install

### Running with a Local Server (Optional)

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8080` in your browser.

## Usage Guide

### Taking a Quiz
1. Select a **topic** from the sidebar (or choose "All")
2. Read each question carefully
3. Click an answer option to submit
4. View instant feedback and explanation
5. Track your progress with stats bar
6. Complete all questions to see final score

### Scoring System
- **Easy questions**: 100 points
- **Medium questions**: 200 points
- **Hard questions**: 300 points
- **Streak bonus**: Maintain correct answers for consecutive multipliers

### Navigation
- **Next Question** - proceed to the next question (enabled after answering)
- **Skip** - skip current question and break streak (still counted in progress)

## Technical Stack

| Technology | Purpose |
|------------|---------|
| HTML5 | Semantic structure |
| CSS3 | Modern styling, animations, gradients |
| JavaScript (ES6+) | Quiz logic and state management |
| Three.js (r128) | 3D particle background effect |
| Web Audio API | Procedural sound effects generation |

## Sound & Audio

All sound effects are generated in real-time using the Web Audio API—no audio files needed. This ensures instant loading and unlimited variation.

**Audio Features:**
- **Interactive feedback** for every user action
- **Dynamic mixing** with master volume control
- **Stereo panning** effects on some sounds
- **Non-blocking** - all sounds play asynchronously without UI lag
- **Graceful degradation** - works in all modern browsers

**Audio Controls:**
- Click the speaker icon in the top-right header to toggle mute/unmute
- Default volume set to 30% to avoid sudden loudness
- Browser autoplay policy requires one click before audio activates

## Customization

### Adding New Questions
Edit `question-bank.json` following this format:

```json
{
  "id": 31,
  "topic": "Your Topic",
  "difficulty": "medium",
  "question": "Your question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct": 0,
  "explanation": "Detailed explanation of the answer"
}
```

### Changing Colors
Modify CSS variables in `<style>` section of `index.html`:
- Primary gradient: `#6366f1` → `#8b5cf6`
- Success color: `#22c55e`
- Error color: `#ef4444`

### Adjusting Particle Effects
In `app.js`, find `initThreeJS()` function:
- `particleCount` - number of background particles
- Particle velocity in `particleVelocities` array
- Particle size in `particleMaterial.size`

## Browser Compatibility

| Browser | Supported |
|---------|-----------|
| Chrome 90+ | Yes |
| Firefox 88+ | Yes |
| Safari 14+ | Yes |
| Edge 90+ | Yes |

Requires WebGL support for Three.js effects.

## Educational Value

This application aggregates lecture materials from:
- PMBOK Guide (7th Edition)
- Scrum Framework (Scrum Guide 2020)
- Version Control with Git
- Software Testing Standards (ISTQB)
- Requirements Engineering Best Practices

Perfect for:
- Software engineering students
- Professionals preparing for certifications (PMP, CSM, etc.)
- Interview preparation
- Team training sessions

## Future Enhancements

- [ ] Timer mode for speed practice
- [ ] Multiple-choice question variations
- [ ] User accounts and progress persistence
- [ ] Leaderboard/competitive mode
- [ ] Additional question banks ( DevOps, Cloud, Security )
- [ ] Export quiz results as PDF
- [ ] Accessibility improvements (screen reader support)

## Contributing

Contributions are welcome! Feel free to:
- Add more questions
- Improve UI/UX
- Optimize Three.js performance
- Fix bugs

## License

This project is licensed under the MIT License - you can freely use, modify, and distribute.

## Credits

- **Lecture Materials**: University course resources (converted to quiz format)
- **Design**: Modern dark theme inspired by contemporary SaaS products
- **Three.js**: Rich 3D graphics for the browser (https://threejs.org/)

---

**Made with** ❤️ **for Software Engineering Students**

*Learning should be fun and interactive!*
