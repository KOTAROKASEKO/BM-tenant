"use client";

import { useState, useRef, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Loader2, CheckCircle, AlertCircle, UploadCloud, ClipboardPaste, Trash2, FileJson, ArrowRight } from "lucide-react";

export default function DataEntryPage() {
  // 初期値は空にして連続投稿しやすくする
  const [jsonInput, setJsonInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // AIが生成しがちなMarkdown記法 (```json ... ```) を除去する関数
  const cleanJsonString = (str: string) => {
    return str
      .replace(/^```json\s*/g, "") // 先頭の ```json を削除
      .replace(/^```\s*/g, "")     // 先頭の ``` を削除
      .replace(/\s*```$/g, "")     // 末尾の ``` を削除
      .trim();
  };

  // ドキュメントIDを生成: スペースなしの小文字英数字のみ (例: "M Vertica" → "mvertica")
  const generateDocumentId = (name: string): string => {
    if (!name) throw new Error("Name field is required to generate document ID");
    return name
      .toLowerCase()           // 小文字に変換
      .replace(/\s+/g, "")     // スペースを削除
      .replace(/[^a-z0-9]/g, ""); // 英数字以外を削除
  };

  // クリップボードから読み取って貼り付け＆整形
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = cleanJsonString(text);
      
      // JSONとして有効かチェックして整形
      try {
        const parsed = JSON.parse(cleaned);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setMessage("✅ Pasted and formatted from clipboard");
        setStatus("idle");
      } catch {
        // JSONじゃない場合はそのまま貼り付け
        setJsonInput(cleaned);
        setMessage("⚠️ Pasted text (Invalid JSON format)");
      }
    } catch (err) {
      console.error("Clipboard access failed", err);
      setMessage("❌ Failed to read clipboard. Please paste manually.");
    }
  };

  // フォーマット整形ボタン用
  const handleFormat = () => {
    try {
      const cleaned = cleanJsonString(jsonInput);
      const parsed = JSON.parse(cleaned);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setStatus("idle");
      setMessage("✨ JSON formatted successfully");
    } catch (err: any) {
      setStatus("error");
      setMessage(`❌ Invalid JSON: ${err.message}`);
    }
  };

  // 入力クリア
  const handleClear = () => {
    setJsonInput("");
    setStatus("idle");
    setMessage("");
    textareaRef.current?.focus();
  };

  const handleUpload = async () => {
    if (!jsonInput.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const cleaned = cleanJsonString(jsonInput);
      const data = JSON.parse(cleaned);
      
      // nameフィールドからドキュメントIDを自動生成（スペースなしの小文字英数字のみ）
      if (!data.name) throw new Error("JSON must have a 'name' field to generate document ID.");
      
      const documentId = generateDocumentId(data.name);
      
      // データからidフィールドを削除（ドキュメントIDとして使用するため）
      const { id, ...dataWithoutId } = data;

      // Upload to 'condominiums' collection with auto-generated ID
      await setDoc(doc(db, "condominiums", documentId), dataWithoutId);

      setStatus("success");
      setMessage(`✅ Successfully uploaded: ${data.name} (ID: ${documentId})`);
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  // ショートカットキー (Ctrl/Cmd + Enter) でアップロード
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        if (status !== "loading" && jsonInput) {
          handleUpload();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jsonInput, status]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-zinc-800">
            <UploadCloud className="h-6 w-6" />
            Condo Data Uploader
          </h1>
          <div className="text-xs text-zinc-400 font-mono">
            CMD + Enter to Upload
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={handlePaste}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
            title="Paste from clipboard and format"
          >
            <ClipboardPaste className="h-4 w-4" /> Paste AI Output
          </button>
          <button
            onClick={handleFormat}
            className="flex items-center gap-2 px-3 py-2 bg-zinc-100 text-zinc-600 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-colors"
            title="Format JSON"
          >
            <FileJson className="h-4 w-4" /> Format
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors ml-auto"
            title="Clear input"
          >
            <Trash2 className="h-4 w-4" /> Clear
          </button>
        </div>

        {/* Text Area */}
        <div className="mb-4 relative">
          <textarea
            ref={textareaRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here (Markdown code blocks ```json are automatically handled)..."
            className={`w-full h-[500px] p-4 font-mono text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-black transition-all border ${
              status === "error" ? "bg-red-50 border-red-200 text-red-900" : "bg-zinc-900 text-green-400 border-transparent"
            }`}
          />
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center justify-between font-bold text-sm ${
            status === "success" ? "bg-green-100 text-green-800" : 
            status === "error" ? "bg-red-100 text-red-800" : "bg-blue-50 text-blue-800"
          }`}>
            <div className="flex items-center gap-3">
              {status === "success" ? <CheckCircle className="h-5 w-5" /> : 
               status === "error" ? <AlertCircle className="h-5 w-5" /> : 
               <CheckCircle className="h-5 w-5 opacity-0" />}
              {message}
            </div>
            
            {/* Success Action: Next Entry */}
            {status === "success" && (
              <button 
                onClick={handleClear}
                className="flex items-center gap-1 px-3 py-1 bg-green-200 hover:bg-green-300 text-green-900 rounded-lg text-xs transition-colors"
              >
                Next Entry <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Main Action Button */}
        <button
          onClick={handleUpload}
          disabled={status === "loading" || !jsonInput}
          className={`w-full py-4 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            status === "loading" ? "bg-zinc-400" : "bg-black hover:bg-zinc-800"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {status === "loading" ? <Loader2 className="animate-spin h-5 w-5" /> : "Upload to Firestore"}
        </button>
      </div>
    </div>
  );
}