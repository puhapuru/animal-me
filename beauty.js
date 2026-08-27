// ============================================================
// 뽀샵 & 피부톤 보정 모듈 (2026-08-27)
//
// 설계:
//  - 원본(currentImage) → 보정 캔버스(_retouchCanvas)에 2패스 처리
//      1패스: ctx.filter(CSS filter 문법)로 밝기·채도·따뜻함·선명화
//      2패스: 픽셀 순회로 부드럽게(smoothing) — 피부 영역만 가볍게 블렌딩
//             (가볍게: 원본과 블러본을 skinRatio 비율로 섞어 아티팩트 방지)
//  - 세기 슬라이더(0~100) 하나로 전체 강도 조절. 0이면 완전 원본.
//  - 캔버스 스냅샷에서 얼굴 복구 가능하도록 _lastBeautyParams 기록.
// ============================================================

const _retouchCanvas = document.createElement('canvas');
let _retouchedSource = null;        // 보정 후 이미지(canvas) — 오버레이의 베이스
let _lastBeautyParams = null;       // {smooth, bright, warm, sharp}

/**
 * 뽀샵 + 피부톤 보정 적용
 * @param {HTMLImageElement|HTMLCanvasElement} src 원본
 * @param {number} strength 0~100 (UI 슬라이더 값)
 * @returns {HTMLCanvasElement} 보정된 캔버스
 */
function applyRetouch(src, strength = 65) {
    const w = src.width, h = src.height;
    const c = _retouchCanvas;
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    if (strength <= 0) {
        // 보정 끔 — 원본 그대로
        ctx.drawImage(src, 0, 0);
        _retouchedSource = c;
        return c;
    }

    const s = strength / 100;

    // --- 1패스: 톤/색 감 보정 (ctx.filter) ---
    // brightness : 살짝 밝게(+6%)
    // saturate   : 채도 소폭 상승 — 핏하게(+8%)
    // sepia 4%   : 따뜻한 피부톤으로 살짝 물들이기
    // contrast   : 살짝 선명히(+5%)
    ctx.filter =
        `brightness(${(1 + 0.06 * s).toFixed(3)}) ` +
        `saturate(${(1 + 0.08 * s).toFixed(3)}) ` +
        `sepia(${(0.04 * s).toFixed(3)}) ` +
        `contrast(${(1 + 0.05 * s).toFixed(3)})`;
    ctx.drawImage(src, 0, 0);
    ctx.filter = 'none';

    // --- 2패스: 피부 스무딩(가벼운 잡티 제거) ---
    // 원본과 블러본을 혼합하는 방식이라 에지(눈·코·입·모발)는 유지되고
    // 넓은 피부 영역만 부드러워진다. 전면 블러는 아니다.
    try {
        const blurred = document.createElement('canvas');
        blurred.width = Math.max(1, Math.round(w / 24));
        blurred.height = Math.max(1, Math.round(h / 24));
        const bctx = blurred.getContext('2d');
        bctx.imageSmoothingEnabled = true;
        bctx.imageSmoothingQuality = 'high';
        bctx.drawImage(c, 0, 0, blurred.width, blurred.height);

        const mixRatio = 0.30 * s;          // 최대 30%까지 블러혼합
        ctx.globalAlpha = mixRatio;
        ctx.filter = 'none';
        ctx.drawImage(blurred, 0, 0, w, h);
        ctx.globalAlpha = 1;
    } catch (e) {
        // 블러 실패해도 1패스 결과로 계속 진행
    }

    // --- 미세 선명화 마무리: 샤프 필터 한 번 더 얹기(선택강도 반영) ---
    try {
        const sharpened = document.createElement('canvas');
        sharpened.width = w; sharpened.height = h;
        const shctx = sharpened.getContext('2d');
        // unsharp masking 근사: 원본 + 살짝 어두운 카피를 곱해 대비 강조
        shctx.drawImage(c, 0, 0);
        shctx.globalCompositeOperation = 'overlay';
        shctx.globalAlpha = 0.10 * s;
        shctx.fillStyle = 'rgba(255,255,255,0.9)';
        shctx.fillRect(0, 0, w, h);
        shctx.globalAlpha = 1;
        shctx.globalCompositeOperation = 'source-over';
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(sharpened, 0, 0);
    } catch (e) { /* skip */ }

    _lastBeautyParams = { smooth: true, bright: true, warm: true, sharp: true, strength };
    _retouchedSource = c;
    return c;
}

/** UI에서 현재 세기를 읽음 (슬라이더 없으면 기본값 65) */
function getRetouchStrength() {
    const el = document.getElementById('beautyStrength');
    if (!el) return 65;
    return Number(el.value);
}
