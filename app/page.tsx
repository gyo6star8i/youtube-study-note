"use client";

import { FormEvent, useRef, useState } from "react";

type Level = "초등 5~6학년" | "중학교 1~2학년" | "중학교 3학년" | "고등학생" | "교사용";
type Length = "간단히" | "보통" | "자세히";

export default function Home() {
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState<Level>("중학교 1~2학년");
  const [length, setLength] = useState<Length>("보통");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult("");
    setLoading(true);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, level, length }),
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

  async function saveAsPdf() {
    if (!resultRef.current) return;

    setPdfLoading(true);
    setError("");

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDocument) => {
          clonedDocument.querySelectorAll(".no-export").forEach((el) => {
            (el as HTMLElement).style.display = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let y = margin;

      pdf.addImage(imgData, "JPEG", margin, y, contentWidth, imgHeight);
      remainingHeight -= printableHeight;

      while (remainingHeight > 0) {
        pdf.addPage();
        y = margin - (imgHeight - remainingHeight);
        pdf.addImage(imgData, "JPEG", margin, y, contentWidth, imgHeight);
        remainingHeight -= printableHeight;
      }

      const today = new Date();
      const date = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      pdf.save(`YouTube_AI_학습노트_${date}.pdf`);
    } catch (err) {
      console.error(err);
      setError("PDF 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero no-print">
        <span className="badge">AI 학습자료 도구</span>
        <h1>YouTube AI 학습노트</h1>
        <p>유튜브 주소를 넣으면 영상을 분석해 학생 수준에 맞는 요약·핵심개념·용어풀이·확인문제를 만듭니다.</p>
      </section>

      <section className="card form-card no-print">
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

          <button type="submit" disabled={loading}>
            {loading ? "영상을 분석하고 있어요…" : "AI 학습자료 만들기"}
          </button>
        </form>
        <p className="hint">공개 YouTube 영상만 분석할 수 있습니다. 긴 영상은 생성에 시간이 더 걸릴 수 있습니다.</p>
      </section>

      {error && <section className="error-box no-print">{error}</section>}

      {result && (
        <section className="card result-card" ref={resultRef}>
          <div className="result-head">
            <div>
              <h2>학습자료</h2>
              <p className="source-meta">원본 영상: {url}</p>
            </div>
            <div className="result-actions no-export no-print">
              <button className="secondary" onClick={() => navigator.clipboard.writeText(result)}>전체 복사</button>
              <button className="secondary" onClick={saveAsPdf} disabled={pdfLoading}>
                {pdfLoading ? "PDF 만드는 중…" : "PDF 저장"}
              </button>
              <button className="secondary" onClick={() => window.print()}>인쇄</button>
            </div>
          </div>
          <article className="plain-result">{result}</article>
        </section>
      )}

      <footer className="no-print">AI가 만든 자료는 원본 영상과 대조하여 수업에 활용해 주세요.</footer>
    </main>
  );
}
