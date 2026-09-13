# YouTube AI 학습노트

공개 YouTube 영상 URL을 입력하면 Gemini가 영상을 직접 분석하여 학생 수준별 학습자료를 생성하는 교사용 웹앱입니다.

## 주요 기능
- 공개 YouTube URL 직접 분석
- 학생 수준 선택: 초5~6 / 중1~2 / 중3 / 고등학생 / 교사용
- 요약 분량 선택
- 3줄 요약, 핵심 개념, 타임스탬프별 흐름, 용어 풀이
- 객관식·단답형 확인 문제와 해설
- 공용 접속코드로 무분별한 API 사용 방지
- API 키는 서버 환경변수에만 보관

## 기술 구성
- Next.js
- Vercel
- Gemini API (Interactions API)

## 로컬 실행
1. Google AI Studio에서 Gemini API Key를 발급합니다.
2. `.env.example`을 `.env.local`로 복사합니다.
3. 값을 입력합니다.

```env
GEMINI_API_KEY=...
APP_ACCESS_CODE=...
GEMINI_MODEL=gemini-3.8-flash
```

4. 실행합니다.

```bash
npm install
npm run dev
```

## Vercel 배포
1. 이 저장소를 Vercel에서 Import합니다.
2. Environment Variables에 다음 값을 등록합니다.
   - `GEMINI_API_KEY`
   - `APP_ACCESS_CODE`
   - `GEMINI_MODEL` = `gemini-3.8-flash`
3. Deploy 합니다.

## 주의
- Gemini의 YouTube URL 입력은 Preview 기능입니다.
- 공개 YouTube 영상만 지원합니다.
- 무료 티어 사용량 및 제한은 Google 정책에 따라 바뀔 수 있습니다.
- 개인정보·비공개 수업영상은 입력하지 않는 것을 권장합니다.
