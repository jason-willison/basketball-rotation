// Basketball Rotation Manager - JavaScript Logic

class BasketballApp {
    constructor() {
        this.players = [];
        this.availablePlayers = [];
        this.rotationSchedule = [];
        this.gameTimer = 0; // in seconds
        this.isPlaying = false;
        this.timerInterval = null;
        this.currentHalf = 1;
        this.substitutionPoints = [];
        
        this.init();
    }
    
    init() {
        // Load saved data
        this.loadFromStorage();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if we have saved data and jump to appropriate section
        if (this.players.length > 0) {
            this.populatePlayerCheckboxes();
            if (this.availablePlayers.length > 0) {
                this.showSection('rotation');
                this.displayRotations();
            } else {
                this.showSection('availability');
            }
        }
        
        // PWA install prompt
        this.setupPWA();
    }
    
    setupEventListeners() {
        // Player input changes
        document.querySelectorAll('.player-input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.value.trim()) {
                    input.classList.add('filled');
                } else {
                    input.classList.remove('filled');
                }
            });
        });
    }
    
    setupPWA() {
        // Service Worker registration
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.log('SW registered', reg))
                .catch(err => console.log('SW registration failed', err));
        }
        
        // Install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            const installPrompt = document.createElement('div');
            installPrompt.className = 'install-prompt show';
            installPrompt.innerHTML = '📱 Install App';
            installPrompt.onclick = () => {
                deferredPrompt.prompt();
                installPrompt.remove();
            };
            
            document.body.appendChild(installPrompt);
            
            setTimeout(() => installPrompt.remove(), 10000);
        });
    }
    
    saveToStorage() {
        localStorage.setItem('basketballApp', JSON.stringify({
            players: this.players,
            availablePlayers: this.availablePlayers,
            rotationSchedule: this.rotationSchedule
        }));
    }
    
    loadFromStorage() {
        const saved = localStorage.getItem('basketballApp');
        if (saved) {
            const data = JSON.parse(saved);
            this.players = data.players || [];
            this.availablePlayers = data.availablePlayers || [];
            this.rotationSchedule = data.rotationSchedule || [];
        }
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show requested section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeNavBtn = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (activeNavBtn) {
            activeNavBtn.classList.add('active');
        }
    }
    
    saveRoster() {
        this.players = [];
        
        document.querySelectorAll('.player-input').forEach(input => {
            const name = input.value.trim();
            if (name) {
                this.players.push({
                    id: Date.now() + Math.random(),
                    name: name,
                    available: false
                });
            }
        });
        
        if (this.players.length < 5) {
            alert('You need at least 5 players for a basketball team!');
            return;
        }
        
        this.saveToStorage();
        this.populatePlayerCheckboxes();
        this.showSection('availability');
    }
    
    populatePlayerCheckboxes() {
        const container = document.getElementById('player-checkboxes');
        container.innerHTML = '';
        
        this.players.forEach(player => {
            const checkbox = document.createElement('div');
            checkbox.className = 'player-checkbox';
            checkbox.innerHTML = `
                <input type="checkbox" id="player-${player.id}" ${player.available ? 'checked' : ''}>
                <label for="player-${player.id}">${player.name}</label>
            `;
            
            checkbox.addEventListener('click', () => {
                const input = checkbox.querySelector('input');
                input.checked = !input.checked;
                this.updatePlayerAvailability();
            });
            
            container.appendChild(checkbox);
        });
        
        this.updatePlayerAvailability();
    }
    
    updatePlayerAvailability() {
        const checkboxes = document.querySelectorAll('#player-checkboxes input[type="checkbox"]');
        let selectedCount = 0;
        
        checkboxes.forEach(checkbox => {
            const playerId = checkbox.id.replace('player-', '');
            const player = this.players.find(p => p.id == playerId);
            
            if (player) {
                player.available = checkbox.checked;
                if (checkbox.checked) {
                    selectedCount++;
                }
            }
            
            // Update visual state
            const container = checkbox.closest('.player-checkbox');
            if (checkbox.checked) {
                container.classList.add('selected');
            } else {
                container.classList.remove('selected');
            }
        });
        
        document.getElementById('selected-count').textContent = selectedCount;
        
        // Enable/disable calculate button
        const calculateBtn = document.querySelector('[onclick="calculateRotations()"]');
        if (calculateBtn) {
            calculateBtn.disabled = selectedCount < 5;
            calculateBtn.style.opacity = selectedCount < 5 ? '0.5' : '1';
        }
    }
    
    calculateRotations() {
        this.availablePlayers = this.players.filter(p => p.available);
        
        if (this.availablePlayers.length < 5) {
            alert('You need at least 5 available players!');
            return;
        }
        
        if (this.availablePlayers.length > 10) {
            alert('This app works best with 10 or fewer players.');
            return;
        }
        
        // Calculate fair rotation
        this.generateRotationSchedule();
        this.saveToStorage();
        this.displayRotations();
        this.showSection('rotation');
    }
    
    generateRotationSchedule() {
        const totalPlayers = this.availablePlayers.length;
        const playersOnCourt = 5;
        const totalGameTime = 40; // 2 halves × 20 minutes
        const idealPlayingTime = Math.floor((playersOnCourt * totalGameTime) / totalPlayers);
        
        // Simple rotation algorithm - can be enhanced later
        this.rotationSchedule = {
            firstHalf: this.generateHalfRotation(0, 20, 1),
            secondHalf: this.generateHalfRotation(20, 40, 2),
            playingTimes: this.calculatePlayingTimes()
        };
    }
    
    generateHalfRotation(startMin, endMin, halfNumber) {
        const halfDuration = endMin - startMin;
        const rotationPeriods = [];
        
        // For simplicity, divide each half into periods based on player count
        const periodsPerHalf = Math.max(2, Math.ceil(this.availablePlayers.length / 5));
        const periodLength = halfDuration / periodsPerHalf;
        
        for (let i = 0; i < periodsPerHalf; i++) {
            const periodStart = startMin + (i * periodLength);
            const periodEnd = Math.min(endMin, periodStart + periodLength);
            
            // Rotate players - simple round-robin
            const startPlayerIndex = (i + ((halfNumber - 1) * periodsPerHalf)) % this.availablePlayers.length;
            const playersOnCourt = [];
            
            for (let j = 0; j < 5; j++) {
                const playerIndex = (startPlayerIndex + j) % this.availablePlayers.length;
                playersOnCourt.push(this.availablePlayers[playerIndex]);
            }
            
            rotationPeriods.push({
                startTime: Math.round(periodStart * 10) / 10,
                endTime: Math.round(periodEnd * 10) / 10,
                playersOnCourt: playersOnCourt,
                benchPlayers: this.availablePlayers.filter(p => !playersOnCourt.includes(p))
            });
        }
        
        return rotationPeriods;
    }
    
    calculatePlayingTimes() {
        const playingTimes = {};
        
        this.availablePlayers.forEach(player => {
            playingTimes[player.id] = 0;
        });
        
        // Calculate from first half
        this.rotationSchedule.firstHalf.forEach(period => {
            const periodLength = period.endTime - period.startTime;
            period.playersOnCourt.forEach(player => {
                playingTimes[player.id] += periodLength;
            });
        });
        
        // Calculate from second half
        this.rotationSchedule.secondHalf.forEach(period => {
            const periodLength = period.endTime - period.startTime;
            period.playersOnCourt.forEach(player => {
                playingTimes[player.id] += periodLength;
            });
        });
        
        return playingTimes;
    }
    
    displayRotations() {
        // Display first half
        this.displayHalfRotation('first-half-rotation', this.rotationSchedule.firstHalf);
        
        // Display second half
        this.displayHalfRotation('second-half-rotation', this.rotationSchedule.secondHalf);
        
        // Display playing time summary
        this.displayPlayingTimeSummary();
    }
    
    displayHalfRotation(containerId, periods) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        periods.forEach(period => {
            const periodDiv = document.createElement('div');
            periodDiv.className = 'rotation-period';
            
            const playersOnCourtHtml = period.playersOnCourt.map(p => 
                `<span class="player-badge">${p.name}</span>`
            ).join('');
            
            const benchPlayersHtml = period.benchPlayers.map(p => 
                `<span class="player-badge bench">${p.name}</span>`
            ).join('');
            
            periodDiv.innerHTML = `
                <h4>${period.startTime}-${period.endTime} min</h4>
                <div style="margin-bottom: 8px;">
                    <strong>On Court:</strong>
                    <div class="players-on-court">${playersOnCourtHtml}</div>
                </div>
                ${period.benchPlayers.length > 0 ? `
                <div>
                    <strong>Bench:</strong>
                    <div class="players-on-court">${benchPlayersHtml}</div>
                </div>
                ` : ''}
            `;
            
            container.appendChild(periodDiv);
        });
    }
    
    displayPlayingTimeSummary() {
        const container = document.getElementById('time-summary');
        container.innerHTML = '';
        
        const playingTimes = this.rotationSchedule.playingTimes;
        
        this.availablePlayers.forEach(player => {
            const playingTime = playingTimes[player.id] || 0;
            
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-time';
            playerDiv.innerHTML = `
                <span class="player-name">${player.name}</span>
                <span class="playing-time">${playingTime.toFixed(1)} min</span>
            `;
            
            container.appendChild(playerDiv);
        });
    }
    
    backToAvailability() {
        this.showSection('availability');
    }
    
    startGameTimer() {
        this.gameTimer = 0;
        this.currentHalf = 1;
        this.isPlaying = true;
        this.generateSubstitutionAlerts();
        this.showSection('timer');
        this.updateTimerDisplay();
        this.startTimer();
    }
    
    generateSubstitutionAlerts() {
        this.substitutionPoints = [];
        
        // Add alerts for each rotation period
        [...this.rotationSchedule.firstHalf, ...this.rotationSchedule.secondHalf].forEach(period => {
            this.substitutionPoints.push({
                time: period.startTime * 60, // convert to seconds
                period: period,
                alerted: false
            });
        });
        
        this.substitutionPoints.sort((a, b) => a.time - b.time);
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isPlaying) {
                this.gameTimer++;
                this.updateTimerDisplay();
                this.checkForSubstitutions();
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.gameTimer / 60);
        const seconds = this.gameTimer % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('game-timer').textContent = timeString;
        
        // Update half indicator
        if (this.gameTimer >= 1200) { // 20 minutes
            this.currentHalf = 2;
        }
        document.getElementById('current-half').textContent = 
            this.gameTimer < 1200 ? '1st Half' : '2nd Half';
        
        // Update current players on court
        this.updateCurrentPlayersDisplay();
        this.updateNextSubstitutionDisplay();
    }
    
    updateCurrentPlayersDisplay() {
        const currentTime = this.gameTimer / 60; // convert to minutes
        let currentPeriod = null;
        
        const allPeriods = [...this.rotationSchedule.firstHalf, ...this.rotationSchedule.secondHalf];
        
        for (let period of allPeriods) {
            if (currentTime >= period.startTime && currentTime < period.endTime) {
                currentPeriod = period;
                break;
            }
        }
        
        const container = document.getElementById('current-players');
        if (currentPeriod) {
            const playersHtml = currentPeriod.playersOnCourt.map(p => 
                `<span class="player-badge">${p.name}</span>`
            ).join('');
            container.innerHTML = `<div class="players-on-court">${playersHtml}</div>`;
        } else {
            container.innerHTML = '<div class="players-on-court">Game not started</div>';
        }
    }
    
    updateNextSubstitutionDisplay() {
        const container = document.getElementById('next-substitution');
        
        const nextSub = this.substitutionPoints.find(sub => sub.time > this.gameTimer);
        
        if (nextSub) {
            const minutesUntil = Math.ceil((nextSub.time - this.gameTimer) / 60);
            const subTime = Math.floor(nextSub.time / 60);
            
            container.innerHTML = `
                <strong>At ${subTime} minutes</strong><br>
                <small>In about ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}</small>
            `;
        } else {
            container.innerHTML = '<em>No more substitutions scheduled</em>';
        }
    }
    
    checkForSubstitutions() {
        this.substitutionPoints.forEach(sub => {
            if (!sub.alerted && this.gameTimer >= sub.time) {
                this.showSubstitutionAlert(sub);
                sub.alerted = true;
            }
        });
    }
    
    showSubstitutionAlert(substitution) {
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Show visual alert
        const alert = document.createElement('div');
        alert.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #FF6B35;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10000;
            text-align: center;
            font-weight: bold;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        const playersIn = substitution.period.playersOnCourt.map(p => p.name).join(', ');
        alert.innerHTML = `
            <h3>🏀 SUBSTITUTION TIME!</h3>
            <p>Players on court: ${playersIn}</p>
            <button onclick="this.parentElement.remove()" style="
                margin-top: 10px;
                padding: 8px 16px;
                border: none;
                background: white;
                color: #FF6B35;
                border-radius: 4px;
                font-weight: bold;
                cursor: pointer;
            ">Got it!</button>
        `;
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 10000);
    }
    
    toggleTimer() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause-btn');
        btn.textContent = this.isPlaying ? '⏸️ Pause' : '▶️ Play';
    }
    
    endGame() {
        this.isPlaying = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        if (confirm('End the game and return to roster?')) {
            this.gameTimer = 0;
            this.currentHalf = 1;
            this.showSection('roster');
        }
    }
}

// Global functions for HTML onclick handlers
function showSection(section) {
    window.app.showSection(section);
}

function saveRoster() {
    window.app.saveRoster();
}

function calculateRotations() {
    window.app.calculateRotations();
}

function backToAvailability() {
    window.app.backToAvailability();
}

function startGameTimer() {
    window.app.startGameTimer();
}

function toggleTimer() {
    window.app.toggleTimer();
}

function endGame() {
    window.app.endGame();
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BasketballApp();
});