# Animal Me 🐱🐶🦊

셀카를 올리면 얼굴 특징을 분석해 **가장 닮은 동물**로 분장해주는 웹앱.
귀·코·수염·털을 얼굴에 합성하고, 마음에 들 때까지 다시 만들 수 있습니다.

## 프라이버시

🔒 **사진은 서버로 전송되지 않습니다.** 얼굴 인식과 분장은 전부 브라우저 안에서
(MediaPipe Face Landmarker) 처리됩니다. 업로드한 이미지는 페이지를 닫으면 사라집니다.

## 구동 커맨드

```bash
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080
```

정적 파일만 있으므로 로컬 HTTP 서버면 충분합니다. 배포는 GitHub Pages.

## 테스트

```bash
uv venv .testenv && uv pip install --python .testenv/bin/python playwright
uv run --python .testenv/bin/python playwright install chromium
.testenv/bin/python smoke_test.py
```

픽스처 얼굴(`test_fixtures/fixture_face.png`)로 자동 검증합니다.
