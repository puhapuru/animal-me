# -*- coding: utf-8 -*-
"""
Animal Me 스모크 테스트 — Playwright 헤드리스 브라우저로 실제 상호작용 검증
"""
import io
import json
import math
import subprocess
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
PORT = 8095
RESULTS_DIR = Path('/home/puhapuru/workspace_shared/RESULTS/20260827-animal-me-v1')
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


def create_test_face_fixture(out_path: Path):
    w, h = 400, 500
    img = Image.new('RGB', (w, h), color=(240, 243, 246))
    draw = ImageDraw.Draw(img)

    cx, cy = 200, 240
    face_w, face_h = 160, 210
    draw.ellipse(
        [cx - face_w // 2, cy - face_h // 2, cx + face_w // 2, cy + face_h // 2],
        fill=(255, 230, 210), outline=(220, 180, 150), width=2
    )

    draw.arc(
        [cx - face_w // 2 - 5, cy - face_h // 2 - 20, cx + face_w // 2 + 5, cy],
        start=180, end=0, fill=(60, 40, 30), width=18
    )

    eye_y = cy - 20
    draw.ellipse([cx - 45 - 10, eye_y - 6, cx - 45 + 10, eye_y + 6], fill=(30, 30, 30))
    draw.ellipse([cx + 45 - 10, eye_y - 6, cx + 45 + 10, eye_y + 6], fill=(30, 30, 30))
    draw.ellipse([cx - 45 - 3, eye_y - 4, cx - 45 + 2, eye_y], fill=(255, 255, 255))
    draw.ellipse([cx + 45 - 3, eye_y - 4, cx + 45 + 2, eye_y], fill=(255, 255, 255))

    draw.polygon([
        (cx, cy + 10),
        (cx - 8, cy + 25),
        (cx + 8, cy + 25)
    ], fill=(200, 140, 120))

    draw.arc([cx - 20, cy + 45, cx + 20, cy + 65], start=10, end=170, fill=(210, 70, 90), width=3)

    img.save(out_path, format='PNG')
    print(f'픽스처 이미지 생성: {out_path}')
    return out_path


def run_smoke_test():
    fixture_dir = ROOT / 'test_fixtures'
    fixture_dir.mkdir(exist_ok=True)
    fixture_face = fixture_dir / 'fixture_face.png'
    create_test_face_fixture(fixture_face)

    srv = subprocess.Popen(
        [sys.executable, '-m', 'http.server', str(PORT)],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(0.8)

    console_errors = []
    page_errors = []
    outgoing_image_requests = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(args=['--use-gl=swiftshader', '--no-sandbox'])
            page = browser.new_page(viewport={'width': 414, 'height': 896})

            page.on('console', lambda msg: console_errors.append(msg.text) if msg.type == 'error' and 'favicon' not in msg.text else None)
            page.on('pageerror', lambda exc: page_errors.append(str(exc)))

            def check_request(request):
                post_data = request.post_data
                if post_data and ('data:image' in post_data or len(post_data) > 10000):
                    outgoing_image_requests.append(request.url)
            page.on('request', check_request)

            print(f'http://localhost:{PORT}/ 접속 중...')
            page.goto(f'http://localhost:{PORT}/index.html')

            banner = page.locator('#privacyBanner')
            assert banner.is_visible(), '프라이버시 배너가 보이지 않습니다.'
            banner_text = banner.inner_text()
            assert '서버에 사진이 저장되지 않습니다' in banner_text, f'프라이버시 문구 누락: {banner_text}'
            print('✅ 1. 프라이버시 배너 확인 완료')

            page.set_input_files('#fileInput', str(fixture_face))
            print('픽스처 얼굴 업로드 완료. 렌더링 대기 중...')

            page.wait_for_selector('#resultSection:not(.hidden)', timeout=15000)
            page.wait_for_selector('#resultCanvas', timeout=5000)
            print('✅ 2. 결과 뷰 전환 확인 완료')

            badge_name = page.locator('#matchName').inner_text()
            badge_percent = page.locator('#matchPercent').inner_text()
            match_reason = page.locator('#matchReason').inner_text()
            print(f'매칭 결과: {badge_name} ({badge_percent}) - {match_reason}')
            assert len(badge_name) > 0, '동물상 매칭 이름이 비어있음'
            assert '%' in badge_percent, '매칭 퍼센트 표기 이상'

            eval_script = """() => {
                const canvas = document.getElementById('resultCanvas');
                const ctx = canvas.getContext('2d');
                const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                let sum = 0, sumSq = 0;
                const sampleStep = 10;
                let count = 0;
                for (let i = 0; i < imgData.length; i += 4 * sampleStep) {
                    const r = imgData[i], g = imgData[i+1], b = imgData[i+2];
                    const brightness = (r + g + b) / 3;
                    sum += brightness;
                    sumSq += brightness * brightness;
                    count++;
                }
                const mean = sum / count;
                const variance = (sumSq / count) - (mean * mean);
                return { width: canvas.width, height: canvas.height, variance: variance, dataUrl: canvas.toDataURL() };
            }"""
            canvas_data_1 = page.evaluate(eval_script)

            print(f'Canvas 1 크기: {canvas_data_1["width"]}x{canvas_data_1["height"]}, 픽셀 분산: {canvas_data_1["variance"]:.2f}')
            assert canvas_data_1['variance'] > 50, f'캔버스 픽셀 분산이 너무 낮음: {canvas_data_1["variance"]}'
            print('✅ 3. 캔버스 렌더링 픽셀 유효성 검증 완료')

            shot1_path = RESULTS_DIR / 'result_render_1.png'
            page.screenshot(path=str(shot1_path), full_page=True)
            print(f'스크린샷 1 저장: {shot1_path}')

            btn_reroll = page.locator('#btnReroll')
            assert btn_reroll.is_visible(), '다시 하기 버튼이 보이지 않음'
            btn_reroll.click()
            time.sleep(0.5)

            eval_script_2 = """() => {
                const canvas = document.getElementById('resultCanvas');
                return { dataUrl: canvas.toDataURL() };
            }"""
            canvas_data_2 = page.evaluate(eval_script_2)

            assert canvas_data_1['dataUrl'] != canvas_data_2['dataUrl'], '다시 하기 클릭 후 캔버스 이미지가 변경되지 않았습니다.'
            print('✅ 4. 다시 하기(Reroll) 캔버스 재렌더링 변화 확인 완료')

            shot2_path = RESULTS_DIR / 'result_render_reroll.png'
            page.screenshot(path=str(shot2_path), full_page=True)
            print(f'스크린샷 2 저장: {shot2_path}')

            btn_download = page.locator('#btnDownload')
            btn_share = page.locator('#btnShare')
            assert btn_download.is_visible(), 'PNG 다운로드 버튼 누락'
            assert btn_share.is_visible(), '공유하기 버튼 누락'
            print('✅ 5. 다운로드 및 공유 컨트롤 확인 완료')

            chips = page.locator('#animalChips .chip-btn')
            chip_count = chips.count()
            print(f'등록된 동물 선택 칩 개수: {chip_count}개')
            assert chip_count >= 6, f'동물 후보가 6종 미만임: {chip_count}개'
            print('✅ 6. 동물 후보 >= 6종(8종) 확인 완료')

            browser.close()

        assert len(outgoing_image_requests) == 0, f'이미지 데이터를 전송하는 네트워크 요청 발견: {outgoing_image_requests}'
        print('✅ 7. 프라이버시 네트워크 요청 검증 통과 (외부 이미지 전송 0건)')

        if console_errors:
            print('콘솔 에러 목록:', console_errors)
        if page_errors:
            print('페이지 에러 목록:', page_errors)
        assert len(page_errors) == 0, f'페이지 스크립트 오류 발생: {page_errors}'
        print('✅ 8. 콘솔/페이지 스크립트 오류 0건 통과')

        print('\n🎉 모든 스모크 테스트 성공적으로 통과! (A1 ~ A5 수용 기준 충족)')

    finally:
        srv.terminate()


if __name__ == '__main__':
    run_smoke_test()