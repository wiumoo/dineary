# 분석서 다이어그램

[요구사항 분석서](../requirements-analysis.md)의 Mermaid 블록이 원본이다. SVG는 Mermaid CLI 11.17.0으로 생성했으며, 문서에서는 이미지를 바로 보여주고 접힌 영역에 Mermaid 원본을 보관한다.

| 파일 | 내용 |
| --- | --- |
| architecture.svg | 시스템 구성도 |
| erd-core.svg | 회원·음식점·리뷰·컬렉션 ERD |
| erd-service.svg | 예약·알림·운영 ERD |
| erd-coupon.svg | 쿠폰·대기열·사용 기록 ERD |
| sequence-signup.svg | 이메일 인증 흐름 |
| cache-flow.svg | 캐시 조회·갱신 흐름 |
| sequence-coupon.svg | 쿠폰 접수·발급 흐름 |

재생성할 때 해당 Mermaid 블록을 `.mmd` 파일로 추출하고 다음 명령의 입력·출력 경로를 지정한다. 렌더러는 개발 문서용이며 애플리케이션 런타임 의존성이 아니다.

```sh
npm exec --yes --package @mermaid-js/mermaid-cli@11.17.0 -- mmdc \
  -i /tmp/diagram.mmd -o docs/diagrams/diagram.svg \
  -c docs/diagrams/mermaid-config.json -b white
```

이미 설치된 Chrome을 사용할 때는 로컬 Puppeteer 설정 파일에 `executablePath`를 지정하고 `-p`로 전달한다. 운영체제별 Chrome 경로는 저장소 설정에 고정하지 않는다. SVG만 수정하지 말고 분석서 원본을 먼저 변경한 뒤 재생성한다.
