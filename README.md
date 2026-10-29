# 뮤엠영어 Kids

뮤엠영어 Kids 학습 콘텐츠(`qr.mumenglishkids.co.kr`)를 나이·카테고리·Vol별로 골라 보는 뷰어입니다.
웹사이트로 바로 쓸 수 있고, PWA로 설치하면 홈 화면 앱으로도 쓸 수 있습니다.

- **웹:** https://euiyoul-jeong.github.io/mum-english-kids/
- **앱 설치:** Android/PC Chrome·Edge는 화면의 **앱 설치** 버튼, iPhone/iPad는 Safari **공유 → 홈 화면에 추가**

## 기능
- 나이(4–7세), 카테고리, Vol 선택 (나이별 카테고리·제목 자동 반영)
- 이전/다음 Vol 버튼, 키보드 ←/→
- 마지막 선택 기억, 주소(`#age=7&cat=story&vol=1`)로 공유
- 가로 화면에서 콘텐츠 폭 조절
- 오프라인일 때 안내 화면 (콘텐츠 재생에는 인터넷 필요)

## 구조
| 파일 | 역할 |
|---|---|
| `index.html` | 앱 화면 |
| `css/app.css` | 스타일 |
| `js/data.js` | 나이·카테고리·Vol 제목 데이터 |
| `js/app.js` | 상태, 드롭다운, 설치, 오프라인 처리 |
| `sw.js` | 서비스 워커(앱 셸 캐시) — 파일을 고치면 `VERSION`을 올릴 것 |
| `manifest.webmanifest` | PWA 설정 |
| `legacy/` | 리팩토링 전 원본 |

## 로컬 실행
서비스 워커는 `http://localhost` 또는 HTTPS에서만 동작합니다(파일 더블클릭은 불가).

```bash
npx http-server -p 5173 -c-1
```

## 배포
`main` 브랜치에 푸시하면 GitHub Pages가 자동으로 다시 배포합니다.
