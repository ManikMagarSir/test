// ============================================
// SE QUIZ ACADEMY - Interactive Learning App
// ============================================

// Quiz State
const quizState = {
    questions: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    streak: 0,
    selectedAnswer: null,
    isAnswered: false,
    activeTopic: 'All',
    usedQuestionIds: new Set(),
    sessionQuestions: []
};

// DOM Elements
const elements = {
    quizContent: document.getElementById('quizContent'),
    resultsScreen: document.getElementById('resultsScreen'),
    questionText: document.getElementById('questionText'),
    questionNumberDisplay: document.getElementById('questionNumberDisplay'),
    questionTopic: document.getElementById('questionTopic'),
    questionDifficulty: document.getElementById('questionDifficulty'),
    optionsContainer: document.getElementById('optionsContainer'),
    currentQuestionNum: document.getElementById('currentQuestionNum'),
    totalQuestionCount: document.getElementById('totalQuestionCount'),
    progressBar: document.getElementById('progressBar'),
    progressPercent: document.getElementById('progressPercent'),
    skipBtn: document.getElementById('skipBtn'),
    
    // New Modal Elements
    explanationModal: document.getElementById('explanationModal'),
    modalResultHeader: document.getElementById('modalResultHeader'),
    modalExplanationText: document.getElementById('modalExplanationText'),
    modalCorrectAnswer: document.getElementById('modalCorrectAnswer'),
    modalCorrectAnswerText: document.getElementById('modalCorrectAnswerText'),
    modalTimerText: document.getElementById('modalTimerText'),
    modalNextBtn: document.getElementById('modalNextBtn'),
    topicFilter: document.getElementById('topicFilter'),
    statCurrentScore: document.getElementById('currentScore'),
    statCorrectAnswers: document.getElementById('correctAnswers'),
    statStreak: document.getElementById('streak'),
    finalScore: document.getElementById('finalScore'),
    resultsMessage: document.getElementById('resultsMessage')
};

// ============================================
// INITIALIZATION
// ============================================

// Global reference for question data
let questionData = null;

async function init() {
    try {
        const response = await fetch('question-bank.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        questionData = await response.json();
    } catch (error) {
        console.error('Failed to load question bank:', error);
        alert('Failed to load questions. If viewing locally via file://, CORS may block fetch(). Please run a local server (e.g., npx serve) or use a browser extension.');
        return;
    }

    // Load questions from embedded data
    quizState.questions = questionData.questions;

    // Initialize audio system
    AudioSystem.init();

    // Initialize UI
    setupTopicFilter();
    filterQuestions('All');
    updateStats();
    initThreeJS();
    animateThreeJS();

    // Event listeners
    elements.modalNextBtn.addEventListener('click', () => {
        AudioSystem.playButtonClick();
        nextQuestion();
    });
    elements.skipBtn.addEventListener('click', () => {
        AudioSystem.playSkip();
        skipQuestion();
    });

    // Add hover sounds to option buttons
    const optionsContainer = document.getElementById('optionsContainer');
    if (optionsContainer) {
        optionsContainer.addEventListener('mouseover', (e) => {
            if (e.target.closest('.option-btn') && !quizState.isAnswered) {
                AudioSystem.playHover();
            }
        }, true);
    }
}

// ============================================
// TOPIC FILTERING
// ============================================

function setupTopicFilter() {
    const topics = ['All', ...questionData.topics];

    topics.forEach(topic => {
        updateTopicButton(topic);
    });
}

function updateTopicButton(topic) {
    const totalCount = topic === 'All'
        ? quizState.questions.length
        : quizState.questions.filter(q => q.topic === topic).length;

    const usedCount = topic === 'All'
        ? quizState.usedQuestionIds.size
        : quizState.questions.filter(q => q.topic === topic && quizState.usedQuestionIds.has(q.id)).length;

    const remainingCount = totalCount - usedCount;
    const count = `${remainingCount}/${totalCount} remaining`;

    // Find existing button or create new
    let btn = document.querySelector(`.topic-btn[data-topic="${topic}"]`);
    if (!btn) {
        btn = document.createElement('button');
        btn.className = `topic-btn ${topic === 'All' ? 'active' : ''}`;
        btn.setAttribute('data-topic', topic);
        btn.innerHTML = `${topic}<span class="topic-count">${count}</span>`;
        btn.onclick = () => {
            AudioSystem.playButtonClick();
            document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterQuestions(topic);
        };
        btn.addEventListener('mouseenter', () => AudioSystem.playHover());
        elements.topicFilter.appendChild(btn);
    } else {
        const countSpan = btn.querySelector('.topic-count');
        if (countSpan) countSpan.textContent = count;
    }
}

function updateTopicFilterCounts() {
    const topics = ['All', ...questionData.topics];
    topics.forEach(topic => updateTopicButton(topic));
}

function filterQuestions(topic) {
    AudioSystem.playButtonClick();
    quizState.activeTopic = topic;

    // Get candidates based on topic and exclude already used questions in this session
    const candidates = topic === 'All'
        ? quizState.questions.filter(q => !quizState.usedQuestionIds.has(q.id))
        : quizState.questions.filter(q => q.topic === topic && !quizState.usedQuestionIds.has(q.id));

    // If not enough unique questions available, offer to reset or show warning
    if (candidates.length === 0) {
        const reset = confirm(`No more unique questions available in ${topic}. Start a fresh session?`);
        if (reset) {
            quizState.usedQuestionIds.clear();
            return filterQuestions(topic);
        } else {
            // Reset to All topic
            document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.topic-btn').classList.add('active');
            return filterQuestions('All');
        }
    }

    // Shuffle and take a random subset (up to 20 questions per session for variety)
    shuffleArray(candidates);
    const maxQuestions = Math.min(candidates.length, 20); // Limit to 20 unique questions per session
    quizState.sessionQuestions = candidates.slice(0, maxQuestions);

    // Reset quiz state
    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.correctCount = 0;
    quizState.streak = 0;
    quizState.selectedAnswer = null;
    quizState.isAnswered = false;

    updateStats();
    loadQuestion();

    // Update topic filter to show remaining counts
    updateTopicFilterCounts();
}

// ============================================
// QUESTION LOADING
// ============================================

function loadQuestion() {
    if (quizState.currentIndex >= quizState.sessionQuestions.length) {
        // Mark all used question IDs for this session
        quizState.sessionQuestions.forEach(q => quizState.usedQuestionIds.add(q.id));
        // Update topic filter counts to reflect remaining questions
        updateTopicFilterCounts();
        showResults();
        return;
    }

    const question = quizState.sessionQuestions[quizState.currentIndex];
    quizState.selectedAnswer = null;
    quizState.isAnswered = false;

    // Update UI
    elements.questionNumberDisplay.textContent = `Question ${quizState.currentIndex + 1}`;
    elements.questionTopic.textContent = question.topic;
    elements.questionTopic.className = 'meta-tag topic-tag';

    // Difficulty badge
    elements.questionDifficulty.textContent = question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1);
    elements.questionDifficulty.className = `meta-tag difficulty-${question.difficulty}`;

    elements.questionText.textContent = question.question;

    // Options
    const letters = ['A', 'B', 'C', 'D'];
    elements.optionsContainer.innerHTML = '';

    // Shuffle options once per question
    if (question._shuffled === undefined) {
        let shuffledOptions = question.options.map((opt, index) => ({ text: opt, isCorrect: index === question.correct }));
        shuffleArray(shuffledOptions);
        
        question.correct = shuffledOptions.findIndex(opt => opt.isCorrect);
        question.options = shuffledOptions.map(opt => opt.text);
        question._shuffled = true;
    }

    question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
            <span class="option-letter">${letters[index]}</span>
            <span>${option}</span>
        `;
        btn.onclick = () => selectAnswer(index);
        btn.addEventListener('mouseenter', () => {
            if (!quizState.isAnswered) AudioSystem.playHover();
        });
        elements.optionsContainer.appendChild(btn);
    });

    // Reset UI state
    elements.modalNextBtn.disabled = true;
    elements.modalNextBtn.textContent = quizState.currentIndex === quizState.sessionQuestions.length - 1 ? 'Finish Quiz' : 'Next Question';

    // Update progress
    elements.currentQuestionNum.textContent = quizState.currentIndex + 1;
    elements.totalQuestionCount.textContent = quizState.sessionQuestions.length;
    const percent = Math.round(((quizState.currentIndex + 1) / quizState.sessionQuestions.length) * 100);
    elements.progressBar.style.width = `${percent}%`;
    elements.progressPercent.textContent = `${percent}%`;

    // Fade in animation
    elements.quizContent.style.animation = 'none';
    elements.quizContent.offsetHeight; // Trigger reflow
    elements.quizContent.style.animation = 'fadeIn 0.5s ease';
}

function selectAnswer(index) {
    if (quizState.isAnswered) return;

    quizState.selectedAnswer = index;
    quizState.isAnswered = true;

    const question = quizState.sessionQuestions[quizState.currentIndex];
    const options = elements.optionsContainer.querySelectorAll('.option-btn');

    // Disable all options
    options.forEach(opt => opt.disabled = true);

    // Mark selected
    options[index].classList.add('selected');

    // Check answer after a brief delay
    setTimeout(() => {
        if (index === question.correct) {
            options[index].classList.add('correct');
            quizState.score += getPointsForDifficulty(question.difficulty);
            quizState.correctCount++;
            quizState.streak++;
            AudioSystem.playCorrect();
            createParticles(window.innerWidth / 2, window.innerHeight / 2, '#22c55e');
        } else {
            options[index].classList.add('incorrect');
            options[question.correct].classList.add('correct');
            quizState.streak = 0;
            AudioSystem.playIncorrect();
            createParticles(window.innerWidth / 2, window.innerHeight / 2, '#ef4444');
        }

        // Update stats
        updateStats();

        // Show Modal Popup with Timer
        showExplanationModal(index === question.correct, question.explanation, question.options[question.correct]);

    }, 300);
}

function showExplanationModal(isCorrect, explanation, correctAnswerText) {
    if (isCorrect) {
        elements.modalResultHeader.className = 'modal-header correct';
        elements.modalResultHeader.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Correct!
        `;
        if (elements.modalCorrectAnswer) elements.modalCorrectAnswer.style.display = 'none';
    } else {
        elements.modalResultHeader.className = 'modal-header incorrect';
        elements.modalResultHeader.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Incorrect
        `;
        // Expose correct answer when they are wrong
        if (elements.modalCorrectAnswer) {
            elements.modalCorrectAnswer.style.display = 'block';
            elements.modalCorrectAnswerText.textContent = correctAnswerText;
        }
    }

    elements.modalExplanationText.textContent = explanation;
    
    // Reset button state
    elements.modalNextBtn.disabled = true;
    elements.explanationModal.classList.add('show');
    
    let timeLeft = 2;
    elements.modalTimerText.textContent = `Please read the explanation... (${timeLeft}s)`;
    
    if (window._modalTimer) clearInterval(window._modalTimer);
    
    window._modalTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            elements.modalTimerText.textContent = `Please read the explanation... (${timeLeft}s)`;
        } else {
            clearInterval(window._modalTimer);
            elements.modalTimerText.textContent = "You may now proceed.";
            elements.modalNextBtn.disabled = false;
        }
    }, 1000);
}

function getPointsForDifficulty(difficulty) {
    const points = { easy: 100, medium: 200, hard: 300 };
    return points[difficulty] || 100;
}

// ============================================
// NAVIGATION
// ============================================

function nextQuestion() {
    elements.explanationModal.classList.remove('show');
    quizState.currentIndex++;
    loadQuestion();
}

function skipQuestion() {
    AudioSystem.playSkip();
    quizState.streak = 0;
    quizState.currentIndex++;
    updateStats();
    loadQuestion();
}

function restartQuiz() {
    AudioSystem.playButtonClick();
    quizState.usedQuestionIds.clear();
    quizState.sessionQuestions = [];
    elements.resultsScreen.classList.remove('show');
    elements.quizContent.style.display = 'block';
    filterQuestions(quizState.activeTopic);
}

function updateStats() {
    elements.statCurrentScore.textContent = quizState.score;
    elements.statCorrectAnswers.textContent = quizState.correctCount;
    elements.statStreak.textContent = quizState.streak;
    // Update total questions stat to show remaining unique questions in this topic
    const totalRemaining = quizState.sessionQuestions.length;
    document.getElementById('totalQuestions').textContent = totalRemaining;
}

// ============================================
// RESULTS
// ============================================

function showResults() {
    const total = quizState.sessionQuestions.length;
    const percentage = Math.round((quizState.correctCount / total) * 100);

    elements.finalScore.textContent = `${quizState.correctCount}/${total} (${percentage}%)`;

    let message = '';
    if (percentage >= 90) message = 'Outstanding! You\'re a Software Engineering Expert! 🏆';
    else if (percentage >= 70) message = 'Excellent work! You have solid knowledge! 🌟';
    else if (percentage >= 50) message = 'Good job! Keep learning to improve further! 📚';
    else message = 'Keep studying! Every expert was once a beginner! 💪';

    elements.resultsMessage.textContent = message;

    elements.quizContent.style.display = 'none';
    elements.resultsScreen.classList.add('show');

    // Celebration sounds and particles
    AudioSystem.playComplete();
    setTimeout(() => AudioSystem.playAmbient(), 1000);
    createCelebrationParticles();
}

// ============================================
// AUDIO SYSTEM (Web Audio API)
// ============================================

const AudioSystem = {
    context: null,
    masterGain: null,
    isMuted: false,
    sounds: {},

    init() {
        // Create audio context on first user interaction (browser policy)
        const initContext = () => {
            if (!this.context) {
                this.context = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.context.createGain();
                this.masterGain.connect(this.context.destination);
                this.masterGain.gain.value = 0.3; // Default volume
                this.createSounds();
                document.removeEventListener('click', initContext);
            }
        };

        document.addEventListener('click', initContext, { once: true });
        this.setupVolumeToggle();
    },

    createSounds() {
        // Create sound generators
        this.sounds.click = () => this.playTone(800, 0.05, 'sine', 0.1);
        this.sounds.correct = () => this.playChord([523.25, 659.25, 783.99], 0.15, 'sine', 0.3);
        this.sounds.incorrect = () => this.playTone(150, 0.2, 'sawtooth', 0.15);
        this.sounds.complete = () => this.playVictory();
        this.sounds.skip = () => this.playTone(300, 0.1, 'triangle', 0.08);
        this.sounds.hover = () => this.playTone(600, 0.03, 'sine', 0.03);
    },

    playTone(frequency, duration, type = 'sine', volume = 0.2) {
        if (!this.context || this.isMuted) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    },

    playChord(frequencies, duration, type, volume) {
        frequencies.forEach(freq => {
            this.playTone(freq, duration, type, volume);
        });
    },

    playVictory() {
        if (!this.context || this.isMuted) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const time = this.context.currentTime;

        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.frequency.value = freq;
            osc.type = 'sine';

            const startTime = time + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            osc.start(startTime);
            osc.stop(startTime + 0.4);
        });
    },

    playAmbient() {
        if (!this.context || this.isMuted) return;

        // Create gentle ambient pad
        const osc1 = this.context.createOscillator();
        const osc2 = this.context.createOscillator();
        const gain = this.context.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        osc1.frequency.value = 110; // A2
        osc2.frequency.value = 165; // E3

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.value = 0;
        gain.gain.linearRampToValueAtTime(0.03, this.context.currentTime + 2);

        osc1.start();
        osc2.start();

        // Fade out after 5 seconds
        setTimeout(() => {
            gain.gain.linearRampToValueAtTime(0, this.context.currentTime + 2);
            setTimeout(() => {
                osc1.stop();
                osc2.stop();
            }, 2000);
        }, 5000);
    },

    playButtonClick() {
        if (this.sounds.click) this.sounds.click();
    },

    playCorrect() {
        if (this.sounds.correct) this.sounds.correct();
    },

    playIncorrect() {
        if (this.sounds.incorrect) this.sounds.incorrect();
    },

    playComplete() {
        if (this.sounds.complete) this.sounds.complete();
    },

    playSkip() {
        if (this.sounds.skip) this.sounds.skip();
    },

    playHover() {
        if (this.sounds.hover) this.sounds.hover();
    },

    setupVolumeToggle() {
        const volumeBtn = document.getElementById('volumeControl');
        if (!volumeBtn) return;

        volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMute();
        });
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        const volumeBtn = document.getElementById('volumeControl');
        if (volumeBtn) {
            volumeBtn.classList.toggle('off', this.isMuted);
        }
    }
};

let scene, camera, renderer, particles, particleGeometry, particleMaterial;
let particlePositions, particleVelocities;

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        2000
    );
    camera.position.z = 1000;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Create particles
    const particleCount = 150;
    particleGeometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleCount * 3);
    particleVelocities = [];

    for (let i = 0; i < particleCount * 3; i += 3) {
        particlePositions[i] = (Math.random() - 0.5) * 2000;
        particlePositions[i + 1] = (Math.random() - 0.5) * 2000;
        particlePositions[i + 2] = (Math.random() - 0.5) * 2000;

        particleVelocities.push({
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5,
            z: (Math.random() - 0.5) * 0.5
        });
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    // Create gradient material using canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');

    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 1)');
    gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.5)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    particleMaterial = new THREE.PointsMaterial({
        size: 15,
        map: texture,
        transparent: true,
        opacity: 0.8,
        vertexColors: false,
        color: 0x8b5cf6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Add some ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animateThreeJS() {
    requestAnimationFrame(animateThreeJS);

    const positions = particleGeometry.attributes.position.array;
    const time = Date.now() * 0.0001;

    for (let i = 0; i < positions.length; i += 3) {
        const idx = i / 3;

        positions[i] += particleVelocities[idx].x;
        positions[i + 1] += particleVelocities[idx].y;
        positions[i + 2] += particleVelocities[idx].z;

        // Wrap around boundaries
        if (Math.abs(positions[i]) > 1000) positions[i] *= -0.9;
        if (Math.abs(positions[i + 1]) > 1000) positions[i + 1] *= -0.9;
        if (Math.abs(positions[i + 2]) > 1000) positions[i + 2] *= -0.9;

        // Add subtle wave motion
        positions[i + 1] += Math.sin(time + idx) * 0.3;
    }

    particleGeometry.attributes.position.needsUpdate = true;

    // Rotate particle system slowly
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0002;

    renderer.render(scene, camera);
}

// ============================================
// PARTICLE EFFECTS
// ============================================

function createParticles(x, y, color) {
    // Simple canvas-based particles
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
        `;
        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        animateParticle(particle, x, y, vx, vy, color);
    }
}

function animateParticle(particle, x, y, vx, vy, color) {
    let posX = x;
    let posY = y;
    let opacity = 1;
    let scale = 1;

    function animate() {
        posX += vx;
        posY += vy;
        opacity -= 0.02;
        scale -= 0.02;

        particle.style.left = `${posX}px`;
        particle.style.top = `${posY}px`;
        particle.style.opacity = opacity;
        particle.style.transform = `scale(${scale})`;

        if (opacity > 0) {
            requestAnimationFrame(animate);
        } else {
            particle.remove();
        }
    }

    animate();
}

function createCelebrationParticles() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#22c55e', '#fbbf24'];

    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const color = colors[Math.floor(Math.random() * colors.length)];
            createParticles(x, y, color);
        }, i * 20);
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ============================================
// START APPLICATION
// ============================================

document.addEventListener('DOMContentLoaded', init);
