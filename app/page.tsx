"use client";

import { FormEvent, useState } from "react";

type Level = "초등 5~6학년" | "중학교 1~2학년" | "중학교 3학년" | "고등학생" | "교사용";
type Length = "간단히" | "보통" | "자세히";

export default function Home() {
  const [url, setUrl] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [level, setLevel] = useState<Level>("중학교 1~2학년");
  const [length, setLength] = useState<Length>("보통");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, accessCode, level, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "요약 중 오류가 발생했습니다.");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "요약 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero">
        <span className="badge">교사용 AI 학습자료 도구</span>
        <h1>YouTube AI 학습노트</h1>
        <p>유튜브 주소를 넣으면 영상을 분석해 학생 수준에 맞는 요약·핵심개념·용어풀이·확인문제를 만듭니다.</p>
      </section>

      <section className="card form-card">
        <form onSubmit={onSubmit}>
          <label>유튜브 영상 주소</label>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="grid-2">
            <div>
              <label>학생 수준</label>
              <select value={level} onChange={(e) => setLevel(e.target.value as Level)}>
                <option>초등 5~6학년</option>
                <option>중학교 1~2학년</option>
                <option>중학교 3학년</option>
                <option>고등학생</option>
                <option>교사용</option>
              </select>
            </div>
            <div>
              <label>자료 분량</label>
              <select value={length} onChange={(e) => setLength(e.target.value as Length)}>
                <option>간단히</option>
                <option>보통</option>
                <option>자세히</option>
              </select>
            </div>
          </div>

          <label>교사용 접속코드</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="공유받은 접속코드"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "영상을 분석하고 있어요…" : "AI 학습자료 만들기"}
          </button>
        </form>
        <p className="hint">공개 YouTube 영상만 분석할 수 있습니다. 긴 영상은 생성에 시간이 더 걸릴 수 있습니다.</p>
      </section>

      {error && <section className="error-box">{error}</section>}

      {result && (
        <section className="card result-card">
          <div className="result-head">
            <h2>학습자료</h2>
            <button className="secondary" onClick={() => navigator.clipboard.writeText(result)}>전체 복사</button>
          </div>
          <article className="plain-result">{result}</article>
        </section>
      )}

      <footer>AI가 만든 자료는 원본 영상과 대조하여 수업에 활용해 주세요.</footer>
    </main>
  );
}
