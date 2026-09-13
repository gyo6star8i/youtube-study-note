import { NextResponse } from "next/server";

export const maxDuration = 300;

function isYoutubeUrl(value: string) {
  try {
    const u = new URL(value);
    const host = u.hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "youtu.be" || host === "m.youtube.com";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { url, level, length } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }
    if (!url || !isYoutubeUrl(url)) {
      return NextResponse.json({ error: "올바른 YouTube 주소를 입력해 주세요." }, { status: 400 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const prompt = `
너는 대한민국 학교의 교육자료 제작 전문가다. 아래 공개 YouTube 영상을 직접 분석하여 '${level}' 수준의 학습자료를 한국어로 작성하라.
자료 분량은 '${length}' 기준으로 조절하라.

[가장 중요한 원칙]
1. 영상에서 실제로 말하거나 화면으로 제시한 내용에 근거한다.
2. 영상에 없는 사실을 지어내지 않는다. 꼭 필요한 배경 설명을 추가하는 경우 '배경 설명'이라고 표시한다.
3. 학생 수준에 맞게 짧고 쉬운 문장을 사용한다.
4. 어려운 용어는 쉬운 말과 예시로 설명한다.
5. 핵심 내용에는 가능한 경우 [00:00] 형식의 타임스탬프를 붙인다.
6. 타임스탬프는 실제 영상 내용을 근거로 작성하고 확신이 없으면 생략한다.
7. 광고, 협찬, 인사말, 반복 내용은 핵심 학습 내용에서 제외한다.
8. 영상의 주장과 객관적으로 확인된 사실을 동일시하지 말고, 영상이 주장하는 내용이면 '영상에서는 ~라고 설명한다'고 표현한다.

[출력 형식]
# 🎬 이 영상은 무엇을 설명하나요?
2~4문장으로 영상의 목적과 주제를 설명한다.

## 📌 3줄 핵심 요약
- 핵심 1
- 핵심 2
- 핵심 3

## 🧠 꼭 알아야 할 핵심 개념
중요한 개념을 3~6개 선정하여 **개념어**: 쉬운 설명 형식으로 정리한다.

## ⏱ 영상 순서대로 이해하기
중요한 흐름을 시간 순서대로 정리한다. 가능한 경우 각 항목 앞에 타임스탬프를 붙인다.

## 📖 어려운 용어 쉽게 풀기
학생이 어려워할 만한 용어만 표 형식으로 정리한다. 열은 '용어 | 쉬운 뜻 | 쉬운 예'로 한다.

## 💡 이렇게 생각하면 쉬워요
핵심 개념 1~3개를 일상적인 비유나 사례로 설명한다. 비유는 영상 내용과 혼동되지 않게 '비유'라고 밝힌다.

## ⭐ 꼭 기억할 내용
시험 공부용 체크포인트처럼 3~6개로 정리한다.

## ✅ 확인 문제
영상 내용만으로 풀 수 있는 문제 5개를 만든다. 객관식 3문항, 단답형 2문항으로 한다.

## 📝 정답과 해설
각 문제의 답과 짧은 이유를 적는다.

## 🎯 한 문장으로 정리
영상 전체를 한 문장으로 정리한다.
`;

    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model,
        input: [
          { type: "text", text: prompt },
          { type: "video", uri: url },
        ],
      }),
    });

    const interaction = await geminiResponse.json();
    if (!geminiResponse.ok) {
      const apiMessage = interaction?.error?.message || `Gemini API 오류 (${geminiResponse.status})`;
      if (geminiResponse.status === 429) {
        return NextResponse.json({ error: "현재 무료 API 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
      }
      console.error("Gemini API error:", interaction);
      return NextResponse.json({ error: apiMessage }, { status: 502 });
    }

    const blocks = Array.isArray(interaction?.steps)
      ? interaction.steps
          .filter((step: any) => step?.type === "model_output")
          .flatMap((step: any) => Array.isArray(step.content) ? step.content : [])
          .filter((content: any) => content?.type === "text" && typeof content.text === "string")
          .map((content: any) => content.text)
      : [];
    const text = blocks.join("\n").trim();

    if (!text) {
      return NextResponse.json({ error: "AI가 결과를 만들지 못했습니다. 다른 공개 영상을 시도해 주세요." }, { status: 502 });
    }

    return NextResponse.json({ result: text });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    if (/429|RESOURCE_EXHAUSTED/i.test(message)) {
      return NextResponse.json({ error: "현재 무료 API 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }
    return NextResponse.json({ error: "영상 분석에 실패했습니다. 공개 영상인지 확인하고 다시 시도해 주세요." }, { status: 500 });
  }
}
