/**
 * THE CRUCIBLE - Application JavaScript
 * Orchestrates ambient audio synthesis, particle background, scroll-linked text highlighting,
 * psychological assessment engine, signature canvas, and persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. FORGE EMBERS BACKGROUND (CANVAS)
    // -------------------------------------------------------------------------
    const canvas = document.getElementById('embers-canvas');
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    const particles = [];
    const maxParticles = 60;
    
    class Ember {
        constructor() {
            this.reset(true);
        }
        
        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : height + 10;
            this.size = Math.random() * 3 + 1;
            this.speedY = Math.random() * 0.8 + 0.3;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.alpha = Math.random() * 0.5 + 0.1;
            this.fadeSpeed = Math.random() * 0.002 + 0.001;
            // Warm forge colors: gold, orange, red
            const colorChoices = [
                { r: 245, g: 158, b: 11 },   // gold
                { r: 217, g: 119, b: 6 },    // amber
                { r: 220, g: 38, b: 38 },    // crimson
                { r: 239, g: 68, b: 68 }     // red
            ];
            this.color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
        }
        
        update() {
            this.y -= this.speedY;
            this.x += this.speedX + Math.sin(this.y / 30) * 0.15;
            this.alpha -= this.fadeSpeed;
            
            if (this.alpha <= 0 || this.y < -10) {
                this.reset();
            }
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = this.size * 2;
            ctx.shadowColor = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
            ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Ember());
    }
    
    function animateParticles() {
        ctx.clearRect(0, 0, width, height);
        
        // Dark background wash
        ctx.fillStyle = 'rgba(9, 9, 11, 0.9)';
        ctx.fillRect(0, 0, width, height);
        
        // Draw & update embers
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        
        requestAnimationFrame(animateParticles);
    }
    
    animateParticles();
    
    // Handle resize
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // -------------------------------------------------------------------------
    // 2. AMBIENT SOUNDSCAPE GENERATOR (WEB AUDIO API)
    // -------------------------------------------------------------------------
    const soundToggle = document.getElementById('sound-toggle');
    let audioCtx = null;
    let mainOscillator = null;
    let detuneOscillator = null;
    let resonanceOscillator = null;
    let filterNode = null;
    let mainGainNode = null;
    let isAudioPlaying = false;
    
    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Main low drone (sawtooth / triangle hybrid via LPF filter)
        mainOscillator = audioCtx.createOscillator();
        mainOscillator.type = 'sawtooth';
        mainOscillator.frequency.setValueAtTime(55.00, audioCtx.currentTime); // A1 note
        
        // Slightly detuned oscillator for heavy beating effect
        detuneOscillator = audioCtx.createOscillator();
        detuneOscillator.type = 'triangle';
        detuneOscillator.frequency.setValueAtTime(55.35, audioCtx.currentTime); // Beat frequency ~0.35Hz
        
        // Occasional sub rumble oscillator
        resonanceOscillator = audioCtx.createOscillator();
        resonanceOscillator.type = 'sine';
        resonanceOscillator.frequency.setValueAtTime(27.50, audioCtx.currentTime); // A0 sub bass
        
        // High-cut filter to keep the sound dark and rumble-like
        filterNode = audioCtx.createBiquadFilter();
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(110, audioCtx.currentTime); // Cutoff 110Hz
        filterNode.Q.setValueAtTime(4, audioCtx.currentTime); // High resonance for low-end thickness
        
        // Main volume gain node
        mainGainNode = audioCtx.createGain();
        mainGainNode.gain.setValueAtTime(0, audioCtx.currentTime); // Start silent
        
        // Connecting node network
        mainOscillator.connect(filterNode);
        detuneOscillator.connect(filterNode);
        resonanceOscillator.connect(mainGainNode);
        
        filterNode.connect(mainGainNode);
        mainGainNode.connect(audioCtx.destination);
        
        // Start oscillators
        mainOscillator.start(0);
        detuneOscillator.start(0);
        resonanceOscillator.start(0);
        
        // Modulate filter frequency slowly over time for movement
        setInterval(() => {
            if (isAudioPlaying && audioCtx) {
                const targetFreq = 100 + Math.random() * 40;
                filterNode.frequency.exponentialRampToValueAtTime(targetFreq, audioCtx.currentTime + 3.0);
            }
        }, 4000);
    }
    
    function toggleAudio() {
        if (!audioCtx) {
            initAudio();
        }
        
        if (isAudioPlaying) {
            // Fade out
            mainGainNode.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + 1.0);
            soundToggle.classList.remove('active');
            soundToggle.querySelector('span').textContent = 'Activate Soundscape';
            isAudioPlaying = false;
        } else {
            // Resume context if suspended (browser security)
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            // Fade in (keep it low and ambient)
            mainGainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.5);
            soundToggle.classList.add('active');
            soundToggle.querySelector('span').textContent = 'Mute Soundscape';
            isAudioPlaying = true;
        }
    }
    
    soundToggle.addEventListener('click', toggleAudio);

    // -------------------------------------------------------------------------
    // 3. NAVIGATION MANAGEMENT
    // -------------------------------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.app-section');
    const enterBtn = document.getElementById('enter-btn');
    const nextBtns = document.querySelectorAll('.next-section-btn');
    
    function navigateToSection(targetId) {
        sections.forEach(sec => {
            sec.classList.remove('active');
        });
        
        const targetSec = document.getElementById(targetId);
        if (targetSec) {
            targetSec.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-target') === targetId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Auto-initialize audio drone if user clicks enter
        if (targetId !== 'hero-section' && !isAudioPlaying) {
            // Offer soundscape startup if they haven't explicitly muted
        }
    }
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            navigateToSection(targetId);
        });
    });
    
    enterBtn.addEventListener('click', () => {
        navigateToSection('codex-section');
    });
    
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateToSection(btn.getAttribute('data-target'));
        });
    });

    // -------------------------------------------------------------------------
    // 4. CRUCIBLE MIRROR - INTERACTIVE ASSESSMENT
    // -------------------------------------------------------------------------
    const questions = [
        {
            text: "When your alarm rings on a freezing morning, what is your immediate response?",
            options: [
                { text: "I snooze it. I believe in 'listening to my body' and sleeping in.", scores: { d: 1, a: 1, i: 1 } },
                { text: "I check my wearable tracker to review my recovery metrics first.", scores: { d: 2, a: 1, i: 2 } },
                { text: "I wake up immediately. My feet hit the cold floor before my brain has time to formulate an excuse.", scores: { d: 10, a: 10, i: 9 } },
                { text: "I lie in bed feeling guilt, scrolling fitness media to find inspiration.", scores: { d: 1, a: 0, i: 1 } }
            ]
        },
        {
            text: "You stumble across a new training program online. What do you do?",
            options: [
                { text: "I study all scientific feedback and write a detailed critiques for weeks.", scores: { d: 2, a: 1, i: 1 } },
                { text: "I print it out, scale back the hardest sets, and start when conditions are perfect.", scores: { d: 2, a: 3, i: 2 } },
                { text: "I take it to the iron today. I test the first workout with savage effort.", scores: { d: 8, a: 9, i: 10 } },
                { text: "I add it to my desktop folder of 40 other saved, unexecuted routines.", scores: { d: 0, a: 0, i: 0 } }
            ]
        },
        {
            text: "How do you control your nutritional standards on Friday and Saturday nights?",
            options: [
                { text: "I indulge in alcohol and junk food. Balance is vital for longevity.", scores: { d: 2, a: 2, i: 2 } },
                { text: "I eat whatever is in front of me, telling myself I will start fresh on Monday.", scores: { d: 1, a: 0, i: 3 } },
                { text: "I consume strictly clean fuel. The weekend does not excuse weakness.", scores: { d: 10, a: 10, i: 8 } },
                { text: "I try to keep clean, but bend immediately under social pressure.", scores: { d: 3, a: 3, i: 3 } }
            ]
        },
        {
            text: "During a heavy set, your lungs burn and muscles scream. How do you respond?",
            options: [
                { text: "I stop the set. I must avoid overtraining or injury at all costs.", scores: { d: 2, a: 2, i: 1 } },
                { text: "I grind out two more reps and drop the weight, satisfied with some effort.", scores: { d: 5, a: 5, i: 6 } },
                { text: "I push until mechanical failure. I welcome the biological shock.", scores: { d: 7, a: 8, i: 10 } },
                { text: "I check my phone between reps, losing focus on the strain.", scores: { d: 1, a: 0, i: 1 } }
            ]
        },
        {
            text: "What is the primary reason you are not in the absolute shape of your life?",
            options: [
                { text: "Bad genetics, heavy workload, stressful schedule, or family limits.", scores: { d: 1, a: 0, i: 2 } },
                { text: "I lack the optimal gym equipment, coach, or premium supplement stack.", scores: { d: 2, a: 1, i: 1 } },
                { text: "I have negotiated with my own comfort. The fault is 100% mine.", scores: { d: 8, a: 10, i: 8 } },
                { text: "I am in decent shape, but I yield to consistency over months and years.", scores: { d: 6, a: 5, i: 5 } }
            ]
        },
        {
            text: "What is your stance on wellness habits like ice baths, sauna, and biohacks?",
            options: [
                { text: "They are the core of my routine. I optimize recovery before pushing hard.", scores: { d: 3, a: 2, i: 2 } },
                { text: "Useful tools, but secondary to the primary taxes: heavy lifting, sleep, clean food.", scores: { d: 8, a: 8, i: 8 } },
                { text: "I buy them hoping they will cover up my lack of intense lifting and sleep.", scores: { d: 1, a: 1, i: 1 } },
                { text: "Pure marketing. I focus only on hard work and whole foods.", scores: { d: 9, a: 8, i: 8 } }
            ]
        },
        {
            text: "What is the fundamental goal of your physical training?",
            options: [
                { text: "To look moderately aesthetic with minimal effort to enjoy life.", scores: { d: 2, a: 3, i: 2 } },
                { text: "To live long, stay healthy, and avoid metabolic decay.", scores: { d: 5, a: 6, i: 4 } },
                { text: "To forge a capable physical weapon and test my ultimate capacity.", scores: { d: 10, a: 10, i: 10 } },
                { text: "To secure digital validation and impress others.", scores: { d: 1, a: 2, i: 4 } }
            ]
        }
    ];

    let currentQuestionIdx = 0;
    let scoresAccumulator = { discipline: 0, accountability: 0, intensity: 0 };
    
    const quizContainer = document.getElementById('quiz-container');
    const resultsContainer = document.getElementById('results-container');
    const questionNumberEl = document.getElementById('question-number');
    const questionTextEl = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const progressBar = document.getElementById('quiz-progress');
    const retestBtn = document.getElementById('retest-btn');
    
    // Archetype definitions
    const archetypes = [
        {
            title: "THE SOVEREIGN EXECUTOR",
            desc: "You make no excuses. You recognize that physical training is an unyielding contract. You possess high discipline, intense work ethic, and refuse to complain. You are forging a weapon. Keep sharpening the blade.",
            minScore: 80
        },
        {
            title: "THE WEEKEND ESCAPIST",
            desc: "You run a perfect protocol from Monday to Thursday, but dissolve completely on Friday night. You trade a week of hard labor for a weekend of cheap sensory validation. You are running in circles on a wheel of mediocrity.",
            condition: (d, a, i) => d < 70 && i >= 60 && a >= 50
        },
        {
            title: "THE OPTIMIZING COWARD",
            desc: "You possess a library of biological theories but execute none of them. You obsess over supplement timing and 'optimal' training splits to hide your terror of physical discomfort. You are an academic in a temple of action.",
            condition: (d, a, i) => d >= 40 && i < 50
        },
        {
            title: "THE COUCH PHILOSOPHER",
            desc: "You are drowning in excuses. You blame genetics, lack of time, and external factors for a physical vessel that is neglected. You seek comfort and dread friction. You must dismantle your identity and start from zero.",
            minScore: 0
        }
    ];

    function loadQuestion(idx) {
        if (idx >= questions.length) {
            showResults();
            return;
        }
        
        currentQuestionIdx = idx;
        const q = questions[idx];
        
        // Update progress bar
        const progressPercent = (idx / questions.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        questionNumberEl.textContent = `Question ${idx + 1} of ${questions.length}`;
        questionTextEl.textContent = q.text;
        
        optionsContainer.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.addEventListener('click', () => selectOption(opt.scores));
            optionsContainer.appendChild(btn);
        });
    }

    function selectOption(scores) {
        scoresAccumulator.discipline += scores.d;
        scoresAccumulator.accountability += scores.a;
        scoresAccumulator.intensity += scores.i;
        
        loadQuestion(currentQuestionIdx + 1);
    }

    function showResults() {
        progressBar.style.width = '100%';
        
        // Calculate percentages
        const maxScore = questions.length * 10;
        const dPct = Math.round((scoresAccumulator.discipline / maxScore) * 100);
        const aPct = Math.round((scoresAccumulator.accountability / maxScore) * 100);
        const iPct = Math.round((scoresAccumulator.intensity / maxScore) * 100);
        const avgPct = Math.round((dPct + aPct + iPct) / 3);
        
        // Hide quiz, show results
        quizContainer.classList.add('hidden');
        resultsContainer.classList.remove('hidden');
        
        // Determine Archetype
        let selectedArch = archetypes[archetypes.length - 1]; // Default to Couch Philosopher
        
        if (avgPct >= 80) {
            selectedArch = archetypes[0];
        } else if (archetypes[1].condition(dPct, aPct, iPct)) {
            selectedArch = archetypes[1];
        } else if (archetypes[2].condition(dPct, aPct, iPct)) {
            selectedArch = archetypes[2];
        }
        
        document.getElementById('archetype-title').textContent = selectedArch.title;
        document.getElementById('archetype-description').textContent = selectedArch.desc;
        
        // Update bars
        document.getElementById('bar-discipline').style.width = `${dPct}%`;
        document.getElementById('bar-accountability').style.width = `${aPct}%`;
        document.getElementById('bar-intensity').style.width = `${iPct}%`;
        
        // Render custom radar chart
        renderRadarChart(dPct, aPct, iPct);
    }

    function renderRadarChart(d, a, i) {
        const chartCanvas = document.getElementById('assessment-chart');
        const c = chartCanvas.getContext('2d');
        const cx = chartCanvas.width / 2;
        const cy = chartCanvas.height / 2;
        const radius = 90;
        
        c.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        
        // Draw grid concentric triangles
        c.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        c.lineWidth = 1;
        
        const levels = [0.25, 0.50, 0.75, 1.0];
        levels.forEach(lvl => {
            c.beginPath();
            for (let axis = 0; axis < 3; axis++) {
                const angle = -Math.PI / 2 + (axis * 2 * Math.PI) / 3;
                const r = radius * lvl;
                const x = cx + r * Math.cos(angle);
                const y = cy + r * Math.sin(angle);
                if (axis === 0) c.moveTo(x, y);
                else c.lineTo(x, y);
            }
            c.closePath();
            c.stroke();
        });
        
        // Draw Axes lines
        c.beginPath();
        for (let axis = 0; axis < 3; axis++) {
            const angle = -Math.PI / 2 + (axis * 2 * Math.PI) / 3;
            c.moveTo(cx, cy);
            c.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        }
        c.stroke();
        
        // Draw Axis Labels
        c.fillStyle = '#a1a1aa';
        c.font = 'bold 10px "Outfit"';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        
        const labels = ['DISCIPLINE', 'ACCOUNTABILITY', 'INTENSITY'];
        const offsets = [
            { x: 0, y: -12 },
            { x: 15, y: 10 },
            { x: -15, y: 10 }
        ];
        
        for (let axis = 0; axis < 3; axis++) {
            const angle = -Math.PI / 2 + (axis * 2 * Math.PI) / 3;
            const x = cx + (radius + 15) * Math.cos(angle) + offsets[axis].x;
            const y = cy + (radius + 15) * Math.sin(angle) + offsets[axis].y;
            c.fillText(labels[axis], x, y);
        }
        
        // Plot Scores
        const scores = [d, a, i];
        c.beginPath();
        for (let axis = 0; axis < 3; axis++) {
            const angle = -Math.PI / 2 + (axis * 2 * Math.PI) / 3;
            const val = scores[axis] / 100;
            const x = cx + radius * val * Math.cos(angle);
            const y = cy + radius * val * Math.sin(angle);
            if (axis === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
        }
        c.closePath();
        
        // Fill area
        c.fillStyle = 'rgba(245, 158, 11, 0.3)';
        c.fill();
        c.strokeStyle = '#f59e0b';
        c.lineWidth = 2.5;
        c.stroke();
        
        // Draw dots at vertices
        for (let axis = 0; axis < 3; axis++) {
            const angle = -Math.PI / 2 + (axis * 2 * Math.PI) / 3;
            const val = scores[axis] / 100;
            const x = cx + radius * val * Math.cos(angle);
            const y = cy + radius * val * Math.sin(angle);
            
            c.beginPath();
            c.arc(x, y, 5, 0, Math.PI * 2);
            c.fillStyle = '#fafafa';
            c.strokeStyle = '#d97706';
            c.lineWidth = 1.5;
            c.fill();
            c.stroke();
        }
    }

    retestBtn.addEventListener('click', () => {
        scoresAccumulator = { discipline: 0, accountability: 0, intensity: 0 };
        resultsContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        loadQuestion(0);
    });

    loadQuestion(0);

    // -------------------------------------------------------------------------
    // 5. COVENANT - SIGNATURE CANVAS & PERSISTENCE
    // -------------------------------------------------------------------------
    const sigCanvas = document.getElementById('signature-pad');
    const sigCtx = sigCanvas.getContext('2d');
    const clearSigBtn = document.getElementById('clear-sig');
    const sealBtn = document.getElementById('seal-btn');
    const covenantForm = document.getElementById('covenant-form');
    const covenantBuilder = document.getElementById('covenant-builder');
    const signaturePanel = document.getElementById('signature-panel');
    const sealedView = document.getElementById('covenant-sealed-view');
    const sealedNameEl = document.getElementById('sealed-signature-name');
    const lawsSummaryEl = document.getElementById('active-laws-summary');
    const breakCovenantBtn = document.getElementById('break-covenant-btn');
    const streakFlame = document.getElementById('streak-flame');
    const streakMsg = document.getElementById('streak-msg');
    
    let isDrawing = false;
    let signatureRegistered = false;
    
    // Configure canvas line rendering
    sigCtx.strokeStyle = '#f59e0b';
    sigCtx.lineWidth = 3;
    sigCtx.lineCap = 'round';
    sigCtx.lineJoin = 'round';
    
    function getMousePos(canvasDom, clientX, clientY) {
        const rect = canvasDom.getBoundingClientRect();
        // Calculate scale factors in case canvas is scaled via CSS
        const scaleX = canvasDom.width / rect.width;
        const scaleY = canvasDom.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }
    
    function startDrawing(e) {
        isDrawing = true;
        const pos = getMousePos(sigCanvas, e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY);
        sigCtx.beginPath();
        sigCtx.moveTo(pos.x, pos.y);
        signatureRegistered = true;
    }
    
    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getMousePos(sigCanvas, e.clientX || (e.touches && e.touches[0].clientX), e.clientY || (e.touches && e.touches[0].clientY));
        sigCtx.lineTo(pos.x, pos.y);
        sigCtx.stroke();
    }
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Mouse listeners
    sigCanvas.addEventListener('mousedown', startDrawing);
    sigCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    
    // Touch listeners for mobile devices
    sigCanvas.addEventListener('touchstart', startDrawing, { passive: false });
    sigCanvas.addEventListener('touchmove', draw, { passive: false });
    sigCanvas.addEventListener('touchend', stopDrawing);
    
    clearSigBtn.addEventListener('click', () => {
        sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
        signatureRegistered = false;
    });

    sealBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('cov-name');
        
        if (!nameInput.value.trim()) {
            alert("The Covenant requires a name. You cannot sign anonymously.");
            nameInput.focus();
            return;
        }
        
        if (!signatureRegistered) {
            alert("You must sign the canvas to seal the covenant.");
            return;
        }
        
        // Collect checked laws
        const selectedLaws = [];
        const checkboxes = covenantForm.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            if (cb.checked) {
                // Get sibling label text
                const text = cb.parentNode.querySelector('.checkbox-text').textContent;
                selectedLaws.push(text);
            }
        });
        
        const covenantData = {
            name: nameInput.value.trim(),
            laws: selectedLaws,
            signature: sigCanvas.toDataURL(),
            timestamp: new Date().getTime(),
            streak: 0,
            totalPaid: 0,
            lastPaidDate: null
        };
        
        localStorage.setItem('crucibleCovenant', JSON.stringify(covenantData));
        loadSealedCovenant(covenantData);
    });

    function loadSealedCovenant(data) {
        // Toggle view blocks
        covenantBuilder.classList.add('hidden');
        signaturePanel.classList.add('hidden');
        sealedView.classList.remove('hidden');
        
        sealedNameEl.textContent = data.name;
        
        lawsSummaryEl.innerHTML = '';
        data.laws.forEach(law => {
            const li = document.createElement('li');
            li.innerHTML = law;
            lawsSummaryEl.appendChild(li);
        });
        
        // Enable streak indicators
        streakFlame.classList.add('active');
        document.getElementById('streak-count').textContent = data.streak || 0;
        document.getElementById('total-taxes-paid').textContent = data.totalPaid || 0;
        
        if (data.streak > 0) {
            streakMsg.textContent = `The covenant is active. Streak maintained at ${data.streak} days. Stay disciplined.`;
        } else {
            streakMsg.textContent = "The covenant is signed. Stand before the Daily Tax and pay your physical dues.";
        }
        
        // Update Tax buttons
        updateTaxStatus();
    }
    
    breakCovenantBtn.addEventListener('click', () => {
        const confirmBreak = confirm("WARNING: Breaking the Covenant resets your record, voids your streak, and registers a physical default in the logs of the forge. Do you admit defeat?");
        if (confirmBreak) {
            localStorage.removeItem('crucibleCovenant');
            
            // Reset views
            sealedView.classList.add('hidden');
            covenantBuilder.classList.remove('hidden');
            signaturePanel.classList.remove('hidden');
            
            document.getElementById('cov-name').value = '';
            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            signatureRegistered = false;
            
            streakFlame.classList.remove('active');
            document.getElementById('streak-count').textContent = '0';
            document.getElementById('total-taxes-paid').textContent = '0';
            streakMsg.textContent = "Sign the covenant to begin your journey of absolute consistency.";
            
            updateTaxStatus();
        }
    });

    // -------------------------------------------------------------------------
    // 6. DAILY TAX / STRAIN PROTOCOLS
    // -------------------------------------------------------------------------
    const strainProtocols = [
        { code: "PROTOCOL 88", title: "The Death March", desc: "Perform a weighted walk of 5 miles, carrying 20% of your bodyweight in a rucksack. No headphones, no podcasts, no distractions. Only the weight and your thoughts." },
        { code: "PROTOCOL 14", title: "The Hundred Hammer", desc: "Execute 100 clean kettlebell swings or dumbbell snatches without letting the weight touch the floor. Rest only in the standing plank. Embrace the forearm burn." },
        { code: "PROTOCOL 32", title: "Fasted Iron Walk", desc: "Wake up, ingest nothing but black coffee or water, and walk 4 miles. Focus on your posture. Feel your metabolic system burn fat reserves as energy." },
        { code: "PROTOCOL 77", title: "The Sovereign Fast", desc: "Consume zero calories for 24 hours. Drink only water and black coffee. Test your mind's authority over biological hunger signals." },
        { code: "PROTOCOL 55", title: "The Cold Crucible", desc: "Perform a 5-minute shower at the absolute coldest setting your tap allows. No testing with your hand. Step in immediately. Control your breathing panic." },
        { code: "PROTOCOL 91", title: "Barbell Rigor Mortis", desc: "Hold a barbell in the deadlift lockout position for as long as possible. Accumulate a total of 5 minutes under load. Grip strength is a mirror of central nervous system capacity." },
        { code: "PROTOCOL 69", title: "The Century Burpee", desc: "Perform 100 full burpees (chest touching the floor, jump at the top) for time. Record your score. Aim to finish under 8 minutes." }
    ];

    const payTaxBtn = document.getElementById('pay-tax-btn');
    const rerollTaxBtn = document.getElementById('reroll-tax-btn');
    const taxCodeEl = document.getElementById('tax-code');
    const taxTitleEl = document.getElementById('tax-title');
    const taxDescEl = document.getElementById('tax-desc');
    const taxStatusTag = document.getElementById('tax-status');
    const taxCard = document.querySelector('.tax-card');
    
    let activeTaxIndex = 0;
    
    function loadDailyTax() {
        // Find if we already have a selected tax saved
        const savedTaxIdx = localStorage.getItem('crucibleActiveTaxIndex');
        if (savedTaxIdx !== null) {
            activeTaxIndex = parseInt(savedTaxIdx);
        } else {
            activeTaxIndex = Math.floor(Math.random() * strainProtocols.length);
            localStorage.setItem('crucibleActiveTaxIndex', activeTaxIndex);
        }
        
        const tax = strainProtocols[activeTaxIndex];
        taxCodeEl.textContent = tax.code;
        taxTitleEl.textContent = tax.title;
        taxDescEl.textContent = tax.desc;
    }
    
    function rerollTax() {
        // Select new tax index, ensuring it's different
        let newIdx = activeTaxIndex;
        while (newIdx === activeTaxIndex && strainProtocols.length > 1) {
            newIdx = Math.floor(Math.random() * strainProtocols.length);
        }
        activeTaxIndex = newIdx;
        localStorage.setItem('crucibleActiveTaxIndex', activeTaxIndex);
        
        const tax = strainProtocols[activeTaxIndex];
        taxCodeEl.textContent = tax.code;
        taxTitleEl.textContent = tax.title;
        taxDescEl.textContent = tax.desc;
        
        // Add visual indicator that excuse was logged
        alert("Excuse registered in the forge database. Challenge re-configured.");
    }
    
    function payTax() {
        const rawData = localStorage.getItem('crucibleCovenant');
        if (!rawData) {
            alert("You cannot pay the tax until you bind yourself to the Covenant. Sign the contract first.");
            navigateToSection('covenant-section');
            return;
        }
        
        const data = JSON.parse(rawData);
        const todayStr = new Date().toDateString();
        
        if (data.lastPaidDate === todayStr) {
            alert("You have already paid your physical tax for today. Rest and recover.");
            return;
        }
        
        // Increment streak
        data.streak = (data.streak || 0) + 1;
        data.totalPaid = (data.totalPaid || 0) + 1;
        data.lastPaidDate = todayStr;
        
        localStorage.setItem('crucibleCovenant', JSON.stringify(data));
        
        // Reload UI
        loadSealedCovenant(data);
    }
    
    function updateTaxStatus() {
        const rawData = localStorage.getItem('crucibleCovenant');
        if (!rawData) {
            taxStatusTag.textContent = "UNSEALED";
            payTaxBtn.disabled = true;
            payTaxBtn.textContent = "SIGN COVENANT TO PAY TAX";
            taxCard.classList.remove('paid');
            return;
        }
        
        const data = JSON.parse(rawData);
        const todayStr = new Date().toDateString();
        
        if (data.lastPaidDate === todayStr) {
            taxStatusTag.textContent = "PAID";
            payTaxBtn.disabled = true;
            payTaxBtn.textContent = "TAX PAID FOR TODAY";
            taxCard.classList.add('paid');
        } else {
            taxStatusTag.textContent = "UNPAID";
            payTaxBtn.disabled = false;
            payTaxBtn.textContent = "MARK PHYSICAL TAX PAID";
            taxCard.classList.remove('paid');
        }
    }
    
    rerollTaxBtn.addEventListener('click', rerollTax);
    payTaxBtn.addEventListener('click', payTax);
    
    // -------------------------------------------------------------------------
    // 7. INITIAL STARTUP LOGIC
    // -------------------------------------------------------------------------
    function init() {
        // Load stored covenant if it exists
        const rawData = localStorage.getItem('crucibleCovenant');
        if (rawData) {
            const data = JSON.parse(rawData);
            
            // Check if streak broke (if last log was over 36 hours ago)
            const now = new Date().getTime();
            const lastLogTime = data.timestamp; // wait, lastPaidDate is better
            // Let's do a simple date check to see if they missed a day
            if (data.lastPaidDate) {
                const lastPaid = new Date(data.lastPaidDate);
                const today = new Date(new Date().toDateString());
                const diffTime = Math.abs(today - lastPaid);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays > 1) {
                    // Streak broke!
                    data.streak = 0;
                    localStorage.setItem('crucibleCovenant', JSON.stringify(data));
                    alert("A gap in consistency was registered. Your streak has dissolved back to zero. Re-seal your focus.");
                }
            }
            
            loadSealedCovenant(data);
        }
        
        loadDailyTax();
        updateTaxStatus();
    }
    
    init();
});
