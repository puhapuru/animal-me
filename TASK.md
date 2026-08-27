# TASK: animal-me v1 — 셀카 → 닮은 동물 분장 웹앱

전체 스펙: ~/workspace_shared/TASK_SPEC.md (반드시 먼저 읽을 것)

## 핵심 요구사항
1. 정적 웹앱(index.html + JS). 백엔드/DB 없음. GitHub Pages 배포 대상.
2. 셀카 업로드(input file + capture) → MediaPipe Face Landmarker(CDN)로 얼굴 특징점 추출
3. 얼굴 기하 비율 점수화 → 닮은 동물 선택(후보 ≥6종: 고양이·강아지·여우·곰·판다·햄스터·토끼·원숭이 등)
4. 특징점 위치에 동물 부속(귀·코·수염·털) canvas 오버레이 렌더링
5. "다시 하기" 버튼 → 다른 동물/변형으로 즉시 재렌더링(무제한)
6. 저장: PNG 다운로드 + Web Share API (미지원 시 다운로드 폴백)
7. 한국어 UI, 모바일 우선, 상단 프라이버시 배너 "서버에 사진이 저장되지 않습니다"

## 절대 규칙
- **얼굴 이미지 데이터를 네트워크로 전송하는 코드 금지** (fetch/XHR/axios에 blob·dataURL 실어 보내기 금지). CDN 라이브러리 로드는 허용.
- 생성형 AI API(Gemini 등)로 이미지 보내기 금지.
- iPhone Safari 최우선 지원.

## 산출물
- index.html, app.js, style.css (+필요한 assets)
- smoke_test.py (playwright, .testenv 패턴): 픽스처 얼굴 업로드→변환→캔버스 변화→'다시 하기' 반응→공유/저장 컨트롤 확인
- README.md: 구동 커맨드 1줄 명시

## 완료 조건
- git commit & push (origin main)
- smoke_test.py 통과
