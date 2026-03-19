/* =========================================
   AI Resume Screener — Frontend Logic
   ========================================= */

// --- State ---
let jdFile = null;
let resumeFiles = [];
let chartInstances = {};

// --- DOM Elements ---
const jdDropZone = document.getElementById('jd-drop-zone');
const jdFileInput = document.getElementById('jd-file-input');
const jdFilePreview = document.getElementById('jd-file-preview');
const jdFileName = document.getElementById('jd-file-name');
const jdRemoveBtn = document.getElementById('jd-remove-btn');

const resumeDropZone = document.getElementById('resume-drop-zone');
const resumeFileInput = document.getElementById('resume-file-input');
const resumeFileList = document.getElementById('resume-file-list');

const analyzeBtn = document.getElementById('analyze-btn');
const btnContent = analyzeBtn.querySelector('.btn-content');
const btnLoading = analyzeBtn.querySelector('.btn-loading');

const uploadSection = document.getElementById('upload-section');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const heroSection = document.getElementById('hero-section');

const newAnalysisBtn = document.getElementById('new-analysis-btn');

// --- File Upload: JD ---
jdDropZone.addEventListener('click', () => jdFileInput.click());

jdDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    jdDropZone.classList.add('drag-over');
});

jdDropZone.addEventListener('dragleave', () => {
    jdDropZone.classList.remove('drag-over');
});

jdDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    jdDropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) setJdFile(files[0]);
});

jdFileInput.addEventListener('change', () => {
    if (jdFileInput.files.length > 0) setJdFile(jdFileInput.files[0]);
});

jdRemoveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    jdFile = null;
    jdFilePreview.style.display = 'none';
    jdDropZone.querySelector('.drop-zone-content').style.display = 'flex';
    jdFileInput.value = '';
    updateAnalyzeBtn();
});

function setJdFile(file) {
    jdFile = file;
    jdFileName.textContent = file.name;
    jdFilePreview.style.display = 'flex';
    jdDropZone.querySelector('.drop-zone-content').style.display = 'none';
    updateAnalyzeBtn();
}

// --- File Upload: Resumes ---
resumeDropZone.addEventListener('click', (e) => {
    if (e.target.closest('.remove-btn')) return;
    resumeFileInput.click();
});

resumeDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    resumeDropZone.classList.add('drag-over');
});

resumeDropZone.addEventListener('dragleave', () => {
    resumeDropZone.classList.remove('drag-over');
});

resumeDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    resumeDropZone.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    addResumeFiles(files);
});

resumeFileInput.addEventListener('change', () => {
    const files = Array.from(resumeFileInput.files);
    addResumeFiles(files);
});

function addResumeFiles(files) {
    files.forEach(f => {
        if (!resumeFiles.find(rf => rf.name === f.name && rf.size === f.size)) {
            resumeFiles.push(f);
        }
    });
    renderResumeList();
    updateAnalyzeBtn();
}

function removeResumeFile(index) {
    resumeFiles.splice(index, 1);
    renderResumeList();
    updateAnalyzeBtn();
}

function renderResumeList() {
    if (resumeFiles.length === 0) {
        resumeFileList.style.display = 'none';
        resumeDropZone.querySelector('.drop-zone-content').style.display = 'flex';
        return;
    }

    resumeDropZone.querySelector('.drop-zone-content').style.display = 'none';
    resumeFileList.style.display = 'flex';
    resumeFileList.innerHTML = resumeFiles.map((f, i) => `
        <div class="file-list-item">
            <span>📄 ${f.name}</span>
            <button class="remove-btn" onclick="event.stopPropagation(); removeResumeFile(${i})" title="Remove">✕</button>
        </div>
    `).join('');
}

function updateAnalyzeBtn() {
    analyzeBtn.disabled = !(jdFile && resumeFiles.length > 0);
}

// --- Analyze ---
analyzeBtn.addEventListener('click', startAnalysis);

async function startAnalysis() {
    if (!jdFile || resumeFiles.length === 0) return;

    // UI: Show loading
    btnContent.style.display = 'none';
    btnLoading.style.display = 'flex';
    analyzeBtn.disabled = true;

    // Show loading section
    uploadSection.style.display = 'none';
    heroSection.style.display = 'none';
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';

    // Animate progress bar
    const loadingBar = document.getElementById('loading-bar');
    const loadingStatus = document.getElementById('loading-status');
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 8;
        if (progress > 90) progress = 90;
        loadingBar.style.width = progress + '%';
    }, 500);

    const statusMessages = [
        'Parsing uploaded documents...',
        'Extracting key requirements from JD...',
        'Analyzing candidate profiles...',
        'Scoring skills and experience match...',
        'Generating recommendations...',
        'Ranking candidates...',
        'Finalizing results...'
    ];
    let msgIndex = 0;
    const statusInterval = setInterval(() => {
        if (msgIndex < statusMessages.length) {
            loadingStatus.textContent = statusMessages[msgIndex];
            msgIndex++;
        }
    }, 2000);

    try {
        // Build FormData
        const formData = new FormData();
        formData.append('job_description', jdFile);
        resumeFiles.forEach(f => formData.append('resumes', f));

        // API Call
        const response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData
        });

        clearInterval(progressInterval);
        clearInterval(statusInterval);
        loadingBar.style.width = '100%';

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Analysis failed');
        }

        const data = await response.json();

        // Short delay for animation
        await new Promise(r => setTimeout(r, 600));

        // Render results
        renderResults(data);

    } catch (error) {
        clearInterval(progressInterval);
        clearInterval(statusInterval);

        alert('Error: ' + error.message);

        // Reset UI
        loadingSection.style.display = 'none';
        uploadSection.style.display = 'block';
        heroSection.style.display = 'block';
        btnContent.style.display = 'flex';
        btnLoading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// --- Render Results ---
function renderResults(data) {
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'block';

    // Header info
    document.getElementById('results-job-title').textContent = data.job_title || 'Position';
    document.getElementById('results-job-summary').textContent = data.job_summary || '';

    // Stats
    const results = data.results || [];
    const strong = results.filter(r => r.recommendation === 'Strong Fit').length;
    const moderate = results.filter(r => r.recommendation === 'Moderate Fit').length;
    const notfit = results.filter(r => r.recommendation === 'Not Fit').length;

    animateNumber('stat-total', results.length);
    animateNumber('stat-strong', strong);
    animateNumber('stat-moderate', moderate);
    animateNumber('stat-notfit', notfit);

    // Screening criteria
    const criteriaContainer = document.getElementById('criteria-tags');
    const criteria = data.screening_criteria || [];
    criteriaContainer.innerHTML = criteria.map(c =>
        `<span class="criteria-tag">${c}</span>`
    ).join('');

    // Charts
    renderScoreChart(results);
    renderFitChart(strong, moderate, notfit);

    // Ranking table
    renderRankingTable(results);

    // Detail cards
    renderDetailCards(results);

    // Reset button state
    btnContent.style.display = 'flex';
    btnLoading.style.display = 'none';
}

// --- Animate Numbers ---
function animateNumber(id, target) {
    const el = document.getElementById(id);
    let current = 0;
    const increment = Math.max(1, Math.floor(target / 20));
    const interval = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        el.textContent = current;
    }, 30);
}

// --- Charts ---
function renderScoreChart(results) {
    const ctx = document.getElementById('score-chart').getContext('2d');
    if (chartInstances.score) chartInstances.score.destroy();

    const labels = results.map(r => r.candidate_name);
    const scores = results.map(r => r.score);
    const colors = scores.map(s => {
        if (s >= 80) return 'rgba(52, 211, 153, 0.8)';
        if (s >= 50) return 'rgba(251, 191, 36, 0.8)';
        return 'rgba(248, 113, 113, 0.8)';
    });

    chartInstances.score = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Match Score',
                data: scores,
                backgroundColor: colors,
                borderRadius: 6,
                borderSkipped: false,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 30, 0.95)',
                    titleColor: '#f0f0f5',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true, max: 100,
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    ticks: { color: '#6b7280', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#6b7280', font: { size: 11 }, maxRotation: 45 }
                }
            },
            animation: { duration: 1200, easing: 'easeOutQuart' }
        }
    });
}

function renderFitChart(strong, moderate, notfit) {
    const ctx = document.getElementById('fit-chart').getContext('2d');
    if (chartInstances.fit) chartInstances.fit.destroy();

    chartInstances.fit = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Strong Fit', 'Moderate Fit', 'Not Fit'],
            datasets: [{
                data: [strong, moderate, notfit],
                backgroundColor: [
                    'rgba(52, 211, 153, 0.85)',
                    'rgba(251, 191, 36, 0.85)',
                    'rgba(248, 113, 113, 0.85)'
                ],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 30, 0.95)',
                    titleColor: '#f0f0f5',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                }
            },
            animation: { duration: 1200, easing: 'easeOutQuart' }
        }
    });
}

// --- Ranking Table ---
function renderRankingTable(results) {
    const tbody = document.getElementById('ranking-tbody');
    tbody.innerHTML = results.map(r => {
        const rankClass = r.rank <= 3 ? `rank-${r.rank}` : 'rank-other';
        const scoreColor = r.score >= 80 ? 'var(--green)' : r.score >= 50 ? 'var(--yellow)' : 'var(--red)';
        const barColor = r.score >= 80 ? 'var(--green)' : r.score >= 50 ? 'var(--yellow)' : 'var(--red)';
        const recClass = r.recommendation === 'Strong Fit' ? 'rec-strong' :
                         r.recommendation === 'Moderate Fit' ? 'rec-moderate' : 'rec-notfit';

        return `
            <tr>
                <td><span class="rank-badge ${rankClass}">${r.rank}</span></td>
                <td class="candidate-name">${r.candidate_name}</td>
                <td>
                    <div class="score-bar-wrapper">
                        <span class="score-value" style="color:${scoreColor}">${r.score}</span>
                        <div class="score-bar">
                            <div class="score-bar-fill" style="width:${r.score}%; background:${barColor}"></div>
                        </div>
                    </div>
                </td>
                <td>${r.strengths.map(s => `<span class="strength-tag">${s}</span>`).join('')}</td>
                <td>${r.gaps.map(g => `<span class="gap-tag">${g}</span>`).join('')}</td>
                <td><span class="rec-badge ${recClass}">${r.recommendation}</span></td>
            </tr>
        `;
    }).join('');
}

// --- Detail Cards ---
function renderDetailCards(results) {
    const grid = document.getElementById('detail-cards-grid');
    grid.innerHTML = results.map((r, i) => {
        const fitClass = r.recommendation === 'Strong Fit' ? 'strong' :
                         r.recommendation === 'Moderate Fit' ? 'moderate' : 'notfit';
        const rankClass = r.rank <= 3 ? `rank-${r.rank}` : 'rank-other';
        const scoreClass = r.score >= 80 ? 'score-high' : r.score >= 50 ? 'score-mid' : 'score-low';

        return `
            <div class="detail-card glass-card ${fitClass}" style="animation-delay: ${i * 0.1}s">
                <div class="detail-card-header">
                    <div class="detail-card-name">
                        <span class="rank-badge ${rankClass}">${r.rank}</span>
                        <h4>${r.candidate_name}</h4>
                    </div>
                    <div class="detail-card-score ${scoreClass}">${r.score}</div>
                </div>
                <div class="detail-card-body">
                    <div>
                        <div class="detail-section-title">Strengths</div>
                        <ul class="detail-list strengths">
                            ${r.strengths.map(s => `<li>${s}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <div class="detail-section-title">Gaps</div>
                        <ul class="detail-list gaps">
                            ${r.gaps.map(g => `<li>${g}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <div class="detail-section-title">Summary</div>
                        <div class="detail-summary">${r.summary}</div>
                    </div>
                    <span class="rec-badge ${r.recommendation === 'Strong Fit' ? 'rec-strong' : r.recommendation === 'Moderate Fit' ? 'rec-moderate' : 'rec-notfit'}">${r.recommendation}</span>
                </div>
            </div>
        `;
    }).join('');
}

// --- New Analysis ---
newAnalysisBtn.addEventListener('click', () => {
    resultsSection.style.display = 'none';
    uploadSection.style.display = 'block';
    heroSection.style.display = 'block';

    // Reset files
    jdFile = null;
    resumeFiles = [];
    jdFilePreview.style.display = 'none';
    jdDropZone.querySelector('.drop-zone-content').style.display = 'flex';
    jdFileInput.value = '';
    resumeFileList.style.display = 'none';
    resumeFileList.innerHTML = '';
    resumeDropZone.querySelector('.drop-zone-content').style.display = 'flex';
    resumeFileInput.value = '';

    updateAnalyzeBtn();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
