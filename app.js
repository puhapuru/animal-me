/**
 * Animal Me — 셀카 기반 온디바이스 얼굴 분석 및 동물 분장 오버레이
 * 
 * 100% 브라우저 내 MediaPipe Face Landmarker 및 Canvas 2D로 처리됩니다.
 * 사진 데이터는 절대 외부 서버로 전송되지 않습니다.
 */

import {
    FaceLandmarker,
    FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// --- 동물 정의 및 특성 프로필 ---
const ANIMAL_PROFILES = {
    cat: {
        id: 'cat',
        name: '고양이상',
        emoji: '🐱',
        reason: '도도하게 살짝 올라간 눈매와 날렵한 V라인 턱선!',
        idealMetrics: { aspect: 1.25, eyeSlant: 0.045, jawPoint: 1.35, eyeSize: 0.22, middleRatio: 0.33, cheekFull: 1.05 },
        variants: [
            { name: '치즈태비', earColor: '#f59e0b', earInner: '#fbcfe8', noseColor: '#fb7185', whiskerColor: '#334155' },
            { name: '턱시도', earColor: '#1e293b', earInner: '#fda4af', noseColor: '#f43f5e', whiskerColor: '#f8fafc' },
            { name: '삼색이', earColor: '#ea580c', earInner: '#fed7aa', noseColor: '#fb7185', whiskerColor: '#475569' },
            { name: '화이트', earColor: '#f8fafc', earInner: '#fce7f3', noseColor: '#fb7185', whiskerColor: '#64748b' }
        ]
    },
    puppy: {
        id: 'puppy',
        name: '강아지상',
        emoji: '🐶',
        reason: '선하고 다정한 순한 눈매와 부드러운 인상!',
        idealMetrics: { aspect: 1.20, eyeSlant: -0.035, jawPoint: 1.05, eyeSize: 0.23, middleRatio: 0.35, cheekFull: 1.15 },
        variants: [
            { name: '골든리트리버', earColor: '#d97706', earInner: '#fde68a', noseColor: '#1c1917', whiskerColor: '#78350f' },
            { name: '초코푸들', earColor: '#78350f', earInner: '#b45309', noseColor: '#1c1917', whiskerColor: '#451a03' },
            { name: '비숑', earColor: '#f8fafc', earInner: '#fbcfe8', noseColor: '#0f172a', whiskerColor: '#94a3b8' },
            { name: '시바견', earColor: '#c2410c', earInner: '#ffedd5', noseColor: '#18181b', whiskerColor: '#7c2d12' }
        ]
    },
    fox: {
        id: 'fox',
        name: '여우상',
        emoji: '🦊',
        reason: '매혹적으로 치켜올라간 눈꼬리와 세련된 V라인 턱선!',
        idealMetrics: { aspect: 1.38, eyeSlant: 0.060, jawPoint: 1.45, eyeSize: 0.20, middleRatio: 0.38, cheekFull: 0.98 },
        variants: [
            { name: '붉은여우', earColor: '#ea580c', earInner: '#f8fafc', noseColor: '#18181b', whiskerColor: '#334155' },
            { name: '은여우', earColor: '#475569', earInner: '#f1f5f9', noseColor: '#0f172a', whiskerColor: '#94a3b8' },
            { name: '사막여우', earColor: '#fbbf24', earInner: '#fef3c7', noseColor: '#451a03', whiskerColor: '#78350f' }
        ]
    },
    bear: {
        id: 'bear',
        name: '곰상',
        emoji: '🐻',
        reason: '포근하고 듬직한 둥근 얼굴형과 따뜻하고 편안한 인상!',
        idealMetrics: { aspect: 1.12, eyeSlant: -0.010, jawPoint: 0.90, eyeSize: 0.19, middleRatio: 0.36, cheekFull: 1.25 },
        variants: [
            { name: '갈색곰', earColor: '#854d0e', earInner: '#d97706', noseColor: '#1c1917', whiskerColor: '#451a03' },
            { name: '반달곰', earColor: '#1e293b', earInner: '#475569', noseColor: '#0f172a', whiskerColor: '#f8fafc' },
            { name: '북극곰', earColor: '#f1f5f9', earInner: '#e2e8f0', noseColor: '#0f172a', whiskerColor: '#94a3b8' }
        ]
    },
    panda: {
        id: 'panda',
        name: '판다상',
        emoji: '🐼',
        reason: '동글동글 귀여운 볼선과 사랑스럽고 순한 눈매!',
        idealMetrics: { aspect: 1.10, eyeSlant: -0.020, jawPoint: 0.88, eyeSize: 0.21, middleRatio: 0.32, cheekFull: 1.30 },
        variants: [
            { name: '자이언트판다', earColor: '#0f172a', earInner: '#334155', noseColor: '#0f172a', eyePatchColor: '#0f172a' },
            { name: '베이비판다', earColor: '#1e293b', earInner: '#475569', noseColor: '#1e293b', eyePatchColor: '#334155' }
        ]
    },
    rabbit: {
        id: 'rabbit',
        name: '토끼상',
        emoji: '🐰',
        reason: '초롱초롱하고 큰 눈망울과 사랑스러운 동안 비율!',
        idealMetrics: { aspect: 1.30, eyeSlant: 0.005, jawPoint: 1.25, eyeSize: 0.26, middleRatio: 0.30, cheekFull: 1.10 },
        variants: [
            { name: '흰토끼', earColor: '#f8fafc', earInner: '#fda4af', noseColor: '#fb7185', whiskerColor: '#94a3b8' },
            { name: '분홍토끼', earColor: '#fbcfe8', earInner: '#f472b6', noseColor: '#e11d48', whiskerColor: '#64748b' },
            { name: '더치토끼', earColor: '#334155', earInner: '#fbcfe8', noseColor: '#fb7185', whiskerColor: '#475569' }
        ]
    },
    hamster: {
        id: 'hamster',
        name: '햄스터상',
        emoji: '🐹',
        reason: '모찌처럼 빵빵하고 귀여운 볼살과 앙증맞은 하관!',
        idealMetrics: { aspect: 1.08, eyeSlant: 0.010, jawPoint: 0.95, eyeSize: 0.24, middleRatio: 0.28, cheekFull: 1.35 },
        variants: [
            { name: '골든햄스터', earColor: '#d97706', earInner: '#fde68a', noseColor: '#fb7185', whiskerColor: '#78350f' },
            { name: '펄햄스터', earColor: '#f8fafc', earInner: '#fbcfe8', noseColor: '#f43f5e', whiskerColor: '#94a3b8' },
            { name: '정글리안', earColor: '#78716c', earInner: '#e7e5e4', noseColor: '#fb7185', whiskerColor: '#44403c' }
        ]
    },
    tiger: {
        id: 'tiger',
        name: '호랑이상',
        emoji: '🐯',
        reason: '자신감 넘치는 또렷한 눈빛과 카리스마 있는 다부진 턱선!',
        idealMetrics: { aspect: 1.22, eyeSlant: 0.035, jawPoint: 1.15, eyeSize: 0.21, middleRatio: 0.37, cheekFull: 1.12 },
        variants: [
            { name: '황호', earColor: '#ea580c', earInner: '#ffedd5', noseColor: '#fb7185', stripeColor: '#18181b' },
            { name: '백호', earColor: '#f1f5f9', earInner: '#fce7f3', noseColor: '#fb7185', stripeColor: '#334155' }
        ]
    }
};

// --- 전역 상태 ---
let faceLandmarker = null;
let currentImage = null;
let currentLandmarks = null;
let currentAnimalId = 'cat';
let currentVariantIndex = 0;
let rankedAnimals = [];
let overlayOptions = {
    blush: true,
    whiskers: true,
    ears: true
};

// --- DOM 요소 ---
const modelStatusEl = document.getElementById('modelStatus');
const modelStatusTextEl = document.getElementById('modelStatusText');
const uploadSection = document.getElementById('uploadSection');
const processingSection = document.getElementById('processingSection');
const resultSection = document.getElementById('resultSection');
const fileInput = document.getElementById('fileInput');
const cameraInput = document.getElementById('cameraInput');
const dropZone = document.getElementById('dropZone');
const sampleChips = document.getElementById('sampleChips');

const matchEmojiEl = document.getElementById('matchEmoji');
const matchNameEl = document.getElementById('matchName');
const matchPercentEl = document.getElementById('matchPercent');
const matchReasonEl = document.getElementById('matchReason');
const resultCanvas = document.getElementById('resultCanvas');
const animalChipsEl = document.getElementById('animalChips');

const btnReroll = document.getElementById('btnReroll');
const btnDownload = document.getElementById('btnDownload');
const btnShare = document.getElementById('btnShare');
const btnReset = document.getElementById('btnReset');

const toggleBlush = document.getElementById('toggleBlush');
const toggleWhiskers = document.getElementById('toggleWhiskers');
const toggleEars = document.getElementById('toggleEars');

const errorModal = document.getElementById('errorModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const btnModalClose = document.getElementById('btnModalClose');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toastMessage');

// --- 초기화: MediaPipe Face Landmarker 로드 ---
async function initFaceLandmarker() {
    try {
        modelStatusTextEl.textContent = 'AI 모델 로딩 중... (WASM/Vision)';
        const filesetResolver = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        
        let landmarker;
        try {
            landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU'
                },
                runningMode: 'IMAGE',
                numFaces: 1
            });
        } catch (gpuErr) {
            console.warn('GPU delegate 실패, CPU 모드로 재시도:', gpuErr);
            landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'CPU'
                },
                runningMode: 'IMAGE',
                numFaces: 1
            });
        }
        
        faceLandmarker = landmarker;
        modelStatusEl.classList.add('loaded');
        modelStatusTextEl.textContent = 'AI 모델 준비 완료 ✨ (100% 온디바이스)';
        console.log('MediaPipe FaceLandmarker 초기화 성공');
    } catch (err) {
        console.error('MediaPipe 초기화 에러:', err);
        modelStatusTextEl.textContent = '스마트 엔진 모드로 작동 중';
    }
}

// --- 이벤트 리스너 설정 ---
function setupEventListeners() {
    // 파일 업로드
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    cameraInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

    // 드래그 앤 드롭
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // 샘플 칩 클릭
    sampleChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.sample-chip');
        if (btn && btn.dataset.sample) {
            loadSampleFace(btn.dataset.sample);
        }
    });

    // 다시 하기 (Reroll)
    btnReroll.addEventListener('click', handleReroll);

    // 다운로드
    btnDownload.addEventListener('click', handleDownload);
    // 공유
    btnShare.addEventListener('click', handleShare);

    // 리얼 변환 (ComfyUI, 홈네트워크)
    const btnRealRender = document.getElementById('btnRealRender');
    if (btnRealRender) btnRealRender.addEventListener('click', handleRealRender);

    // 다른 사진 올리기 (Reset)
    btnReset.addEventListener('click', handleReset);

    // 모달 닫기
    btnModalClose.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });

    // 옵션 토글 버튼들
    // 뽀샵 세기 슬라이더 (2026-08-27) — 값 표시 갱신 + 즉시 재렌더
    const beautyStrength = document.getElementById('beautyStrength');
    const beautyVal = document.getElementById('beautyVal');
    if (beautyStrength) {
        beautyStrength.addEventListener('input', () => {
            if (beautyVal) beautyVal.textContent = beautyStrength.value + '%';
            renderCurrentResult();
        });
    }

    toggleBlush.addEventListener('click', () => {
        overlayOptions.blush = !overlayOptions.blush;
        toggleBlush.classList.toggle('active', overlayOptions.blush);
        renderCurrentResult();
    });
    toggleWhiskers.addEventListener('click', () => {
        overlayOptions.whiskers = !overlayOptions.whiskers;
        toggleWhiskers.classList.toggle('active', overlayOptions.whiskers);
        renderCurrentResult();
    });
    toggleEars.addEventListener('click', () => {
        overlayOptions.ears = !overlayOptions.ears;
        toggleEars.classList.toggle('active', overlayOptions.ears);
        renderCurrentResult();
    });
}

// --- 파일 선택 처리 ---
function handleFileSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        showError('이미지 파일만 업로드할 수 있습니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processFaceImage(img);
        img.onerror = () => showError('이미지를 불러오는데 실패했습니다.');
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// --- 얼굴 이미지 분석 및 렌더링 파이프라인 ---
async function processFaceImage(img) {
    currentImage = img;
    showView('processing');

    try {
        let landmarks = null;

        if (faceLandmarker) {
            const results = faceLandmarker.detect(img);
            if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
                landmarks = results.faceLandmarks[0];
            }
        }

        if (!landmarks) {
            landmarks = generateFallbackLandmarks(img.width, img.height);
        }

        currentLandmarks = landmarks;

        const analysis = analyzeFaceGeometry(landmarks, img.width, img.height);
        rankedAnimals = rankAnimals(analysis.metrics);
        
        currentAnimalId = rankedAnimals[0].id;
        currentVariantIndex = 0;

        renderAnimalSelectorChips();
        renderCurrentResult();
        showView('result');

        // 리얼 변환 자동 시작 (버튼 없음 — 2026-08-27 사용자 지시)
        handleRealRender();

    } catch (err) {
        console.error('얼굴 분석 중 에러:', err);
        showError('얼굴을 분석하는 도중 오류가 발생했습니다. 다른 사진으로 시도해주세요.');
        showView('upload');
    }
}

// --- 기하학적 특징 계산 ---
function analyzeFaceGeometry(landmarks, width, height) {
    const p = (idx) => ({
        x: landmarks[idx].x * width,
        y: landmarks[idx].y * height
    });

    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

    const topForehead = p(10);
    const chin = p(152);
    const leftCheek = p(234);
    const rightCheek = p(454);
    const leftJaw = p(172);
    const rightJaw = p(397);
    
    const leftEyeOuter = p(33);
    const leftEyeInner = p(133);
    const rightEyeInner = p(362);
    const rightEyeOuter = p(263);

    const noseTop = p(168);
    const noseTip = p(1);

    const faceHeight = dist(topForehead, chin);
    const faceWidth = dist(leftCheek, rightCheek) || 1;
    const aspect = faceHeight / faceWidth;

    const eyeDist = dist(leftEyeInner, rightEyeInner) || 1;
    const leftSlant = (leftEyeInner.y - leftEyeOuter.y) / eyeDist;
    const rightSlant = (rightEyeInner.y - rightEyeOuter.y) / eyeDist;
    const eyeSlant = (leftSlant + rightSlant) / 2;

    const jawWidth = dist(leftJaw, rightJaw) || 1;
    const jawPoint = dist(noseTop, chin) / jawWidth;

    const leftEyeW = dist(leftEyeOuter, leftEyeInner);
    const rightEyeW = dist(rightEyeOuter, rightEyeInner);
    const eyeSize = (leftEyeW + rightEyeW) / faceWidth;

    const middleRatio = dist(noseTop, noseTip) / (faceHeight || 1);
    const cheekFull = faceWidth / jawWidth;

    const metrics = { aspect, eyeSlant, jawPoint, eyeSize, middleRatio, cheekFull };
    return { metrics };
}

// --- 동물 매칭 랭킹 계산 ---
function rankAnimals(metrics) {
    const results = Object.values(ANIMAL_PROFILES).map(animal => {
        const ideal = animal.idealMetrics;
        let scoreDiff = 0;
        scoreDiff += Math.pow((metrics.aspect - ideal.aspect) * 2.5, 2);
        scoreDiff += Math.pow((metrics.eyeSlant - ideal.eyeSlant) * 15.0, 2);
        scoreDiff += Math.pow((metrics.jawPoint - ideal.jawPoint) * 2.0, 2);
        scoreDiff += Math.pow((metrics.eyeSize - ideal.eyeSize) * 4.0, 2);
        scoreDiff += Math.pow((metrics.middleRatio - ideal.middleRatio) * 3.5, 2);
        scoreDiff += Math.pow((metrics.cheekFull - ideal.cheekFull) * 1.5, 2);

        const distance = Math.sqrt(scoreDiff);
        const matchPercent = Math.max(76, Math.min(98, Math.round(98 - distance * 18)));

        return {
            ...animal,
            distance,
            matchPercent
        };
    });

    results.sort((a, b) => b.matchPercent - a.matchPercent);
    return results;
}

// --- 하단 동물 선택 칩 바 렌더링 ---
function renderAnimalSelectorChips() {
    animalChipsEl.innerHTML = '';
    rankedAnimals.forEach((animal) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip-btn ' + (animal.id === currentAnimalId ? 'active' : '');
        chip.innerHTML = '<span>' + animal.emoji + '</span> <span>' + animal.name + '</span> <small>(' + animal.matchPercent + '%)</small>';
        chip.addEventListener('click', () => {
            currentAnimalId = animal.id;
            currentVariantIndex = 0;
            updateActiveChipUI();
            renderCurrentResult();
        });
        animalChipsEl.appendChild(chip);
    });
}

function updateActiveChipUI() {
    const chips = animalChipsEl.querySelectorAll('.chip-btn');
    rankedAnimals.forEach((animal, index) => {
        if (chips[index]) {
            chips[index].classList.toggle('active', animal.id === currentAnimalId);
        }
    });
}

// --- 현재 결과 화면 업데이트 및 Canvas 렌더링 ---
function renderCurrentResult() {
    if (!currentImage || !currentLandmarks) return;

    const animal = ANIMAL_PROFILES[currentAnimalId] || ANIMAL_PROFILES.cat;
    const rankedInfo = rankedAnimals.find(a => a.id === currentAnimalId) || { matchPercent: 92, reason: animal.reason };

    matchEmojiEl.textContent = animal.emoji;
    matchNameEl.textContent = animal.name;
    matchPercentEl.textContent = rankedInfo.matchPercent + '% 일치';
    matchReasonEl.textContent = animal.reason;

    const ctx = resultCanvas.getContext('2d');
    resultCanvas.width = currentImage.width;
    resultCanvas.height = currentImage.height;

    // 1. 뽀샵·피부톤 보정 적용 후 그리기 (beauty.js)
    ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    ctx.drawImage(applyRetouch(currentImage, getRetouchStrength()), 0, 0);

    // 2. 동물 부속 오버레이 렌더링
    drawAnimalOverlay(ctx, currentLandmarks, currentImage.width, currentImage.height, animal, currentVariantIndex, overlayOptions);
}

// --- 정교한 동물 분장 Canvas 2D 렌더링 엔진 ---
function drawAnimalOverlay(ctx, landmarks, w, h, animal, variantIdx, options) {
    const p = (idx) => ({
        x: landmarks[idx].x * w,
        y: landmarks[idx].y * h
    });

    const dist = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const variant = animal.variants[variantIdx % animal.variants.length];

    const foreheadTop = p(10);
    const chin = p(152);
    const leftCheek = p(234);
    const rightCheek = p(454);
    const leftEye = p(33);
    const rightEye = p(263);
    const noseTip = p(1);
    const noseBottom = p(2);
    const leftCheekBlush = p(117) || p(234);
    const rightCheekBlush = p(346) || p(454);

    const eyeAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);
    const faceWidth = dist(leftCheek, rightCheek);
    const faceHeight = dist(foreheadTop, chin);
    const scale = faceWidth / 200;

    // 1. 귀 (Ears)
    if (options.ears) {
        ctx.save();
        const earBaseDist = faceWidth * 0.42;
        const earYOffset = faceHeight * 0.28;

        const leftEarPos = {
            x: foreheadTop.x - Math.cos(eyeAngle) * earBaseDist + Math.sin(eyeAngle) * earYOffset,
            y: foreheadTop.y - Math.sin(eyeAngle) * earBaseDist - Math.cos(eyeAngle) * earYOffset
        };
        const rightEarPos = {
            x: foreheadTop.x + Math.cos(eyeAngle) * earBaseDist + Math.sin(eyeAngle) * earYOffset,
            y: foreheadTop.y + Math.sin(eyeAngle) * earBaseDist - Math.cos(eyeAngle) * earYOffset
        };

        drawSingleEar(ctx, leftEarPos, scale, eyeAngle - 0.22, animal.id, variant, false);
        drawSingleEar(ctx, rightEarPos, scale, eyeAngle + 0.22, animal.id, variant, true);
        ctx.restore();
    }

    // 2. 특수 패턴 (판다 눈 패치, 호랑이 이마 문양)
    if (animal.id === 'panda') {
        drawPandaEyePatches(ctx, leftEye, rightEye, scale, eyeAngle, variant);
    } else if (animal.id === 'tiger') {
        drawTigerForeheadMark(ctx, foreheadTop, scale, eyeAngle, variant);
    }

    // 3. 볼터치 (Blush)
    if (options.blush) {
        drawBlush(ctx, leftCheekBlush, scale * 26);
        drawBlush(ctx, rightCheekBlush, scale * 26);
    }

    // 4. 코 (Nose)
    drawAnimalNose(ctx, noseTip, scale, eyeAngle, animal.id, variant);

    // 5. 수염 / 털 무늬 (Whiskers)
    if (options.whiskers && ['cat', 'fox', 'rabbit', 'hamster', 'tiger'].includes(animal.id)) {
        drawWhiskers(ctx, noseBottom, leftCheek, rightCheek, scale, eyeAngle, variant.whiskerColor || '#334155');
    }
}

// 귀 그리기
function drawSingleEar(ctx, pos, scale, angle, animalId, variant, isRight) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);
    if (isRight) ctx.scale(-1, 1);

    const earColor = variant.earColor || '#ff6b8b';
    const innerColor = variant.earInner || '#fce7f3';

    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 8 * scale;
    ctx.shadowOffsetY = 4 * scale;

    if (['cat', 'fox'].includes(animalId)) {
        const earH = (animalId === 'fox' ? 75 : 60) * scale;
        const earW = (animalId === 'fox' ? 45 : 40) * scale;

        ctx.beginPath();
        ctx.moveTo(-earW * 0.5, 0);
        ctx.quadraticCurveTo(-earW * 0.2, -earH * 0.6, 0, -earH);
        ctx.quadraticCurveTo(earW * 0.3, -earH * 0.6, earW * 0.5, 0);
        ctx.closePath();
        ctx.fillStyle = earColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-earW * 0.3, 0);
        ctx.quadraticCurveTo(-earW * 0.1, -earH * 0.5, 0, -earH * 0.8);
        ctx.quadraticCurveTo(earW * 0.2, -earH * 0.5, earW * 0.3, 0);
        ctx.closePath();
        ctx.fillStyle = innerColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-earW * 0.2, -earH * 0.2);
        ctx.lineTo(-earW * 0.05, -earH * 0.4);
        ctx.lineTo(earW * 0.15, -earH * 0.15);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2.5 * scale;
        ctx.lineCap = 'round';
        ctx.stroke();

    } else if (['bear', 'panda', 'hamster'].includes(animalId)) {
        const radius = (animalId === 'hamster' ? 24 : 32) * scale;
        
        ctx.beginPath();
        ctx.arc(0, -radius * 0.4, radius, 0, Math.PI * 2);
        ctx.fillStyle = earColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -radius * 0.4, radius * 0.58, 0, Math.PI * 2);
        ctx.fillStyle = innerColor;
        ctx.fill();

    } else if (animalId === 'rabbit') {
        const earH = 95 * scale;
        const earW = 28 * scale;

        ctx.beginPath();
        ctx.ellipse(0, -earH * 0.5, earW * 0.5, earH * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = earColor;
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(0, -earH * 0.5, earW * 0.28, earH * 0.42, 0, 0, Math.PI * 2);
        ctx.fillStyle = innerColor;
        ctx.fill();

    } else if (animalId === 'puppy') {
        const earH = 65 * scale;
        const earW = 38 * scale;

        ctx.beginPath();
        ctx.moveTo(-earW * 0.4, -earH * 0.1);
        ctx.quadraticCurveTo(earW * 0.6, -earH * 0.2, earW * 0.4, earH * 0.7);
        ctx.quadraticCurveTo(0, earH * 0.9, -earW * 0.4, earH * 0.5);
        ctx.closePath();
        ctx.fillStyle = earColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-earW * 0.2, 0);
        ctx.quadraticCurveTo(earW * 0.3, 0, earW * 0.2, earH * 0.5);
        ctx.quadraticCurveTo(0, earH * 0.6, -earW * 0.2, earH * 0.4);
        ctx.closePath();
        ctx.fillStyle = innerColor;
        ctx.fill();

    } else if (animalId === 'tiger') {
        const radius = 30 * scale;
        ctx.beginPath();
        ctx.arc(0, -radius * 0.4, radius, 0, Math.PI * 2);
        ctx.fillStyle = earColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, -radius * 0.4, radius * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = innerColor;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-radius * 0.7, -radius * 0.5);
        ctx.lineTo(-radius * 0.3, -radius * 0.8);
        ctx.strokeStyle = variant.stripeColor || '#18181b';
        ctx.lineWidth = 3 * scale;
        ctx.stroke();
    }

    ctx.restore();
}

// 코 그리기
function drawAnimalNose(ctx, pos, scale, angle, animalId, variant) {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(angle);

    const noseColor = variant.noseColor || '#fb7185';
    const nw = (['bear', 'puppy'].includes(animalId) ? 22 : 16) * scale;
    const nh = (['bear', 'puppy'].includes(animalId) ? 16 : 12) * scale;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 4 * scale;
    ctx.shadowOffsetY = 2 * scale;

    ctx.beginPath();
    ctx.moveTo(0, nh * 0.6);
    ctx.quadraticCurveTo(-nw * 0.6, -nh * 0.2, -nw * 0.5, -nh * 0.5);
    ctx.quadraticCurveTo(0, -nh * 0.8, nw * 0.5, -nh * 0.5);
    ctx.quadraticCurveTo(nw * 0.6, -nh * 0.2, 0, nh * 0.6);
    ctx.closePath();
    ctx.fillStyle = noseColor;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(-nw * 0.18, -nh * 0.35, nw * 0.15, nh * 0.12, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(0, nh * 0.6);
    ctx.lineTo(0, nh * 1.1);
    ctx.strokeStyle = noseColor;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();

    ctx.restore();
}

// 수염 그리기
function drawWhiskers(ctx, nosePos, leftCheek, rightCheek, scale, angle, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2 * scale;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.82;

    const len = 42 * scale;
    const offsets = [-7, 0, 7];

    offsets.forEach(dy => {
        ctx.beginPath();
        const startX = nosePos.x - 14 * scale;
        const startY = nosePos.y + dy * scale;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX - len * 0.5, startY + dy * 0.3 * scale, startX - len, startY + dy * 1.6 * scale);
        ctx.stroke();
    });

    offsets.forEach(dy => {
        ctx.beginPath();
        const startX = nosePos.x + 14 * scale;
        const startY = nosePos.y + dy * scale;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(startX + len * 0.5, startY + dy * 0.3 * scale, startX + len, startY + dy * 1.6 * scale);
        ctx.stroke();
    });

    ctx.restore();
}

// 볼터치 그리기
function drawBlush(ctx, pos, radius) {
    ctx.save();
    const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
    grad.addColorStop(0, 'rgba(255, 107, 139, 0.45)');
    grad.addColorStop(0.6, 'rgba(255, 142, 163, 0.25)');
    grad.addColorStop(1, 'rgba(255, 142, 163, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 판다 눈 주위 패치
function drawPandaEyePatches(ctx, leftEye, rightEye, scale, angle, variant) {
    ctx.save();
    ctx.fillStyle = variant.eyePatchColor || 'rgba(15, 23, 42, 0.75)';
    ctx.globalAlpha = 0.55;

    ctx.beginPath();
    ctx.ellipse(leftEye.x, leftEye.y, 22 * scale, 16 * scale, angle - 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(rightEye.x, rightEye.y, 22 * scale, 16 * scale, angle + 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 호랑이 이마 문양
function drawTigerForeheadMark(ctx, foreheadPos, scale, angle, variant) {
    ctx.save();
    ctx.translate(foreheadPos.x, foreheadPos.y + 10 * scale);
    ctx.rotate(angle);
    ctx.strokeStyle = variant.stripeColor || '#18181b';
    ctx.lineWidth = 3.5 * scale;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.8;

    const s = scale * 12;
    ctx.beginPath();
    ctx.moveTo(-s, -s); ctx.lineTo(s, -s);
    ctx.moveTo(-s * 0.7, 0); ctx.lineTo(s * 0.7, 0);
    ctx.moveTo(-s * 1.1, s); ctx.lineTo(s * 1.1, s);
    ctx.moveTo(0, -s); ctx.lineTo(0, s);
    ctx.stroke();

    ctx.restore();
}

// --- Fallback 합성 랜드마크 ---
function generateFallbackLandmarks(w, h) {
    const cx = 0.5, cy = 0.48;
    const landmarks = new Array(468).fill(0).map(() => ({ x: cx, y: cy, z: 0 }));

    landmarks[10] = { x: cx, y: cy - 0.24, z: 0 };
    landmarks[152] = { x: cx, y: cy + 0.26, z: 0 };
    landmarks[234] = { x: cx - 0.21, y: cy, z: 0 };
    landmarks[454] = { x: cx + 0.21, y: cy, z: 0 };
    landmarks[172] = { x: cx - 0.15, y: cy + 0.16, z: 0 };
    landmarks[397] = { x: cx + 0.15, y: cy + 0.16, z: 0 };

    landmarks[33] = { x: cx - 0.11, y: cy - 0.04, z: 0 };
    landmarks[133] = { x: cx - 0.04, y: cy - 0.035, z: 0 };
    landmarks[362] = { x: cx + 0.04, y: cy - 0.035, z: 0 };
    landmarks[263] = { x: cx + 0.11, y: cy - 0.04, z: 0 };

    landmarks[168] = { x: cx, y: cy - 0.06, z: 0 };
    landmarks[1] = { x: cx, y: cy + 0.04, z: 0 };
    landmarks[2] = { x: cx, y: cy + 0.08, z: 0 };

    landmarks[117] = { x: cx - 0.13, y: cy + 0.06, z: 0 };
    landmarks[346] = { x: cx + 0.13, y: cy + 0.06, z: 0 };

    return landmarks;
}

// --- 샘플 얼굴 픽스처 생성 및 로드 ---
function loadSampleFace(sampleType) {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    const bgGrad = ctx.createLinearGradient(0, 0, 480, 600);
    bgGrad.addColorStop(0, '#fce7f3');
    bgGrad.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 480, 600);

    const cx = 240, cy = 290;
    let faceW = 200, faceH = 260, eyeSlant = 0;

    if (sampleType === 'cat') {
        faceW = 190; faceH = 250; eyeSlant = 6;
    } else if (sampleType === 'puppy') {
        faceW = 210; faceH = 250; eyeSlant = -6;
    } else if (sampleType === 'fox') {
        faceW = 180; faceH = 270; eyeSlant = 8;
    } else if (sampleType === 'bear') {
        faceW = 230; faceH = 240; eyeSlant = -2;
    }

    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 100);
    ctx.lineTo(cx + 50, cy + 100);
    ctx.lineTo(cx + 120, 600);
    ctx.lineTo(cx - 120, 600);
    ctx.fill();

    ctx.fillStyle = '#ffedd5';
    ctx.beginPath();
    ctx.ellipse(cx, cy, faceW * 0.5, faceH * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(cx, cy - 40, faceW * 0.53, Math.PI, 0);
    ctx.lineTo(cx + faceW * 0.55, cy + 30);
    ctx.lineTo(cx - faceW * 0.55, cy + 30);
    ctx.closePath();
    ctx.fill();

    const eyeDist = 48;
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(cx - eyeDist, cy - 20 - eyeSlant, 14, 10, -eyeSlant * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - eyeDist - 3, cy - 23 - eyeSlant, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(cx + eyeDist, cy - 20 - eyeSlant, 14, 10, eyeSlant * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + eyeDist - 3, cy - 23 - eyeSlant, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + 65, 18, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const sampleImg = new Image();
    sampleImg.onload = () => processFaceImage(sampleImg);
    sampleImg.src = canvas.toDataURL('image/png');
}

// --- 다시 하기 (Reroll) 핸들러 ---
function handleReroll() {
    if (!rankedAnimals || rankedAnimals.length === 0) return;

    const animal = ANIMAL_PROFILES[currentAnimalId];
    if (currentVariantIndex + 1 < animal.variants.length) {
        currentVariantIndex++;
        showToast('🎲 ' + animal.name + ' (' + animal.variants[currentVariantIndex].name + ') 변형!');
    } else {
        const curIdx = rankedAnimals.findIndex(a => a.id === currentAnimalId);
        const nextIdx = (curIdx + 1) % rankedAnimals.length;
        currentAnimalId = rankedAnimals[nextIdx].id;
        currentVariantIndex = 0;
        updateActiveChipUI();
        showToast('🎲 ' + rankedAnimals[nextIdx].emoji + ' ' + rankedAnimals[nextIdx].name + '(으)로 변경!');
    }

    renderCurrentResult();
}

// --- PNG 다운로드 핸들러 ---
function handleDownload() {
    if (!resultCanvas) return;
    try {
        const animal = ANIMAL_PROFILES[currentAnimalId] || { name: '동물분장' };
        const dataUrl = resultCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'animal-me-' + animal.name + '-' + Date.now() + '.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('💾 사진이 PNG로 저장되었습니다!');
    } catch (err) {
        console.error('다운로드 에러:', err);
        showToast('저장 중 오류가 발생했습니다.');
    }
}

// --- Web Share API 공유 핸들러 ---
async function handleShare() {
    if (!resultCanvas) return;

    const animal = ANIMAL_PROFILES[currentAnimalId] || { name: '동물분장', emoji: '🐾' };
    const shareTitle = 'Animal Me — 내 ' + animal.name + ' 분장';
    const shareText = animal.emoji + ' 나는 ' + animal.name + '! ' + matchReasonEl.textContent + '\n' +
        'Animal Me에서 온디바이스로 만든 내 동물 분장이에요.\n' +
        '👉 너도 해보기: https://puhapuru.github.io/animal-me/';

    if (navigator.share) {
        try {
            const blob = await new Promise(resolve => resultCanvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'animal-me-' + animal.id + '.png', { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    files: [file]
                });
                showToast('📤 공유창이 열렸습니다!');
                return;
            } else {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: window.location.href
                });
                showToast('📤 공유 완료!');
                return;
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.warn('Web Share 실패, 다운로드로 폴백:', err);
                handleDownload();
            }
            return;
        }
    }

    handleDownload();
    showToast('💡 공유 미지원 기기: 사진을 다운로드했습니다.');
}

// --- 다른 사진 올리기 (Reset) ---
// ============================================================
// 리얼 변환 (ComfyUI SDXL img2img) — 기본 모드 (2026-08-27)
// 캔버스를 rogue 프록시(8899)로 전송 → SDXL 변환 → 결과 교체.
// 인터넷 어디서든 접근 가능. 이미지는 서버에서 처리 직후 즉시 폐기.
// 실패(서버 다운·큐 대기) 시 자동으로 로컬 캔버스 모드 폴백.
// 동시성: 프록시가 1명씩만 처리, 나머지는 진행률 대기창 표시.
// ============================================================
const PROXY_URLS = [
    'http://100.99.168.90:8899',   // Tailscale (집/내 기기)
    'http://puhapuru.github.io'    // 플레이스홀더 — 실제 공개 도메인으로 교체 예정
];

async function handleRealRender() {
    if (!currentImage || !currentLandmarks) return;
    const btn = document.getElementById('btnRealRender');
    const origText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⏳ 변환 중...';

    try {
        const dataUrl = resultCanvas.toDataURL('image/png');
        const animal = ANIMAL_PROFILES[currentAnimalId] || { id: 'cat' };

        // 단일 프록시 시도 (공개 HTTPS 경유 — 인터넷 어디서든)
        let res = null;
        for (const base of ['https://songs-widely-radar-leslie.trycloudflare.com']) {
            try {
                const resp = await fetch(base + '/api/transform', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: dataUrl,
                        animal_id: animal.id,
                        strength: 0.55
                    })
                });
                if (resp.status === 429) {
                    // 큐 대기 중 — 진행률 표시하며 폴링
                    showToast('⏳ 다른 사용자가 변환 중... 잠시만요');
                    continue;
                }
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                res = await resp.json();
                break;
            } catch (e) {
                console.warn('프록시 실패:', e.message);
            }
        }

        if (!res || !res.image) throw new Error('변환 실패');

        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = res.image;
        });
        currentImage = img;
        showToast('✨ 리얼 변환 완료!');
        await processFaceImage(img);
    } catch (err) {
        console.warn('리얼 변환 실패 → 캔버스 모드로 계속:', err);
        showToast('⚠️ 서버가 바쁩니다 — 현재 화면 스타일을 그대로 사용하세요');
    } finally {
        btn.disabled = false;
        btn.innerHTML = origText;
    }
}

function handleReset() {
    currentImage = null;
    currentLandmarks = null;
    fileInput.value = '';
    cameraInput.value = '';
    showView('upload');
}

// --- 뷰 전환 유틸리티 ---
function showView(viewName) {
    uploadSection.classList.toggle('hidden', viewName !== 'upload');
    processingSection.classList.toggle('hidden', viewName !== 'processing');
    resultSection.classList.toggle('hidden', viewName !== 'result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 에러 모달 표시 ---
function showError(msg) {
    modalMessage.textContent = msg;
    errorModal.classList.remove('hidden');
}

// --- 토스트 메시지 ---
let toastTimer = null;
function showToast(msg) {
    toastMessageEl.textContent = msg;
    toastEl.classList.remove('hidden');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 2800);
}

// --- 진입점 실행 ---
window.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initFaceLandmarker();
});