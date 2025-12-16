"use client";

import { useEffect, useRef, useState } from "react";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "assistant", content: "Hi, I'm Fee!" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const reply = data?.reply ?? "No reply from /api/chat.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error calling /api/chat." },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function uploadPdf() {
    if (!pdfFile || uploading) return;

    setUploading(true);
    setUploadStatus("uploading...");

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadStatus(`upload failed`);
        return;
      }

      setUploadStatus(`uploaded: ${data.filename}`);
      setPdfFile(null);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "ok i got your pdf. what should i review?" },
      ]);
    } catch {
      setUploadStatus("upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#ceb5b7] flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="rounded-3xl bg-[#ff7477] shadow-lg p-6 mb-4 border border-black/10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black">
                SesMag AI - Fee
              </h1>
              <p className="mt-1 text-black/80 font-medium">by Ian Bharrat</p>
            </div>
            <div className="rounded-2xl bg-[#9cf6f6] px-4 py-2 text-sm font-semibold text-black border border-black/10">
              Upload + Chat
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl bg-[#e69597] shadow-lg border border-black/10 overflow-hidden">
          {/* Upload row */}
          <div className="px-4 sm:px-6 py-4 bg-[#b5d6d6] border-b border-black/10">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="rounded-2xl bg-white/90 border border-black/10 px-3 py-2 text-sm font-semibold text-black cursor-pointer w-full sm:w-auto">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                />
                {pdfFile ? pdfFile.name : "Choose PDF"}
              </label>

              <button
                onClick={uploadPdf}
                disabled={!pdfFile || uploading}
                className="rounded-2xl px-4 py-2 font-bold bg-[#9cf6f6] text-black border border-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>

              {uploadStatus && (
                <div className="text-sm font-semibold text-black/70">
                  {uploadStatus}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-[60vh] overflow-y-auto px-4 sm:px-6 py-5 space-y-3">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={[
                      "max-w-[88%] sm:max-w-[75%] rounded-3xl px-4 py-3 shadow-md border border-black/10",
                      isUser
                        ? "bg-[#9cf6f6] text-black"
                        : "bg-[#ceb5b7] text-black",
                    ].join(" ")}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-3xl px-4 py-3 shadow-md border border-black/10 bg-[#ceb5b7] text-black">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Composer */} 
          <div className="bg-[#b5d6d6] border-t border-black/10 p-4">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="type a message..."
                className="flex-1 rounded-2xl px-4 py-3 bg-white/90 text-black border border-black/10 outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="rounded-2xl px-5 py-3 font-bold bg-[#ff7477] text-black border border-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
