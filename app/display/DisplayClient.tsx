"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./display.module.css";
import type { Notice } from "@/lib/notices";

type DisplayPayload = {
  groupCode: string;
  updatedAt: string;
  serverTime: string;
  notices: Notice[];
  deviceCode?: string;
};

type SlideStyle = CSSProperties & {
  "--slide-scale"?: number;
};

function levelLabel(level: Notice["level"]) {
  if (level === "URGENT") return "Kháº©n cáº¥p";
  if (level === "IMPORTANT") return "Quan trá»ng";
  return "ThĂ´ng bĂ¡o";
}

export default function DisplayClient({ groupCode, deviceCode = "" }: { groupCode: string; deviceCode?: string }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [clock, setClock] = useState("");
  const [syncStatus, setSyncStatus] = useState("Äang Ä‘á»“ng bá»™");
  const [slideScale, setSlideScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastSignatureRef = useRef("");
  const slideRef = useRef<HTMLElement | null>(null);
  const fitBoxRef = useRef<HTMLDivElement | null>(null);

  const currentNotice = notices[currentIndex] || null;

  const slideStyle = useMemo<SlideStyle>(
    () => ({
      backgroundColor: currentNotice?.backgroundColor || "#111827",
      color: currentNotice?.textColor || "#f8fafc",
      "--slide-scale": slideScale
    }),
    [currentNotice, slideScale]
  );

  const fitCurrentSlide = useCallback(() => {
    const slideElement = slideRef.current;
    const fitBox = fitBoxRef.current;
    if (!slideElement || !fitBox || !currentNotice || currentNotice.type === "IMAGE") {
      setSlideScale(1);
      return;
    }

    const minScale = 0.34;
    let low = minScale;
    let high = 1;
    let best = minScale;

    const fits = (scale: number) => {
      slideElement.style.setProperty("--slide-scale", String(scale));
      return fitBox.scrollHeight <= fitBox.clientHeight + 2 && fitBox.scrollWidth <= fitBox.clientWidth + 2;
    };

    for (let index = 0; index < 12; index += 1) {
      const mid = (low + high) / 2;
      if (fits(mid)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    slideElement.style.setProperty("--slide-scale", String(best));
    setSlideScale(best);
  }, [currentNotice]);

  async function requestFullscreen() {
    const element = document.documentElement;
    try {
      if (!document.fullscreenElement && element.requestFullscreen) {
        await element.requestFullscreen();
      }
    } catch {
      // TrĂ¬nh duyá»‡t TV thÆ°á»ng chá»‰ cho fullscreen sau thao tĂ¡c ngÆ°á»i dĂ¹ng.
    }
  }

  useEffect(() => {
    async function loadNotices() {
      try {
        const response = await fetch(`/api/display/${encodeURIComponent(groupCode)}/notices${deviceCode ? `?device=${encodeURIComponent(deviceCode)}` : ""}`, { cache: "no-store" });
        if (!response.ok) throw new Error("KhĂ´ng táº£i Ä‘Æ°á»£c dá»¯ liá»‡u");
        const data = (await response.json()) as DisplayPayload;
        const nextSignature = JSON.stringify(data.notices || []);
        setSyncStatus(`Äá»“ng bá»™: ${new Date(data.serverTime).toLocaleTimeString("vi-VN")}`);

        if (nextSignature !== lastSignatureRef.current) {
          lastSignatureRef.current = nextSignature;
          setNotices(data.notices || []);
          setCurrentIndex(0);
        }
      } catch {
        setSyncStatus("Máº¥t káº¿t ná»‘i, Ä‘ang giá»¯ ná»™i dung cÅ©");
      }
    }

    loadNotices();
    const pollTimer = window.setInterval(loadNotices, 5000);
    return () => window.clearInterval(pollTimer);
  }, [groupCode, deviceCode]);

  useEffect(() => {
    if (!notices.length) return;
    const durationMs = Math.max(Number(currentNotice?.durationSeconds || 30), 5) * 1000;
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => (index + 1) % notices.length);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [currentNotice, notices.length]);

  useEffect(() => {
    function tickClock() {
      setClock(
        new Date().toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        })
      );
    }

    tickClock();
    const timer = window.setInterval(tickClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    function updateFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    updateFullscreenState();
    document.addEventListener("fullscreenchange", updateFullscreenState);
    return () => document.removeEventListener("fullscreenchange", updateFullscreenState);
  }, []);

  useEffect(() => {
    setSlideScale(1);
    const frame = window.requestAnimationFrame(fitCurrentSlide);
    return () => window.cancelAnimationFrame(frame);
  }, [currentNotice, fitCurrentSlide]);

  useEffect(() => {
    const slideElement = slideRef.current;
    if (!slideElement) return;

    const observer = new ResizeObserver(() => fitCurrentSlide());
    observer.observe(slideElement);
    if (fitBoxRef.current) observer.observe(fitBoxRef.current);
    return () => observer.disconnect();
  }, [fitCurrentSlide]);

  return (
    <main className={styles.screen} onClick={() => requestFullscreen()}>
      {!isFullscreen ? (
        <button className={styles.fullscreenButton} type="button" onClick={requestFullscreen}>
          Báº¥m Ä‘á»ƒ toĂ n mĂ n hĂ¬nh
        </button>
      ) : null}

      <section ref={slideRef} className={`${styles.slide} ${currentNotice?.type === "IMAGE" ? styles.imageSlide : ""} ${currentNotice?.fitMode === "contain" ? styles.contain : ""}`} style={slideStyle}>
        {!currentNotice ? <p className={styles.empty}>ChÆ°a cĂ³ thĂ´ng bĂ¡o Ä‘ang hiá»ƒn thá»‹</p> : null}

        {currentNotice?.type === "IMAGE" && currentNotice.imageUrl ? (
          <img src={currentNotice.imageUrl} alt={currentNotice.title || "ThĂ´ng bĂ¡o"} />
        ) : null}

        {currentNotice?.type === "MIXED" && currentNotice.imageUrl ? (
          <div ref={fitBoxRef} className={`${styles.fitBox} ${styles.mixedLayout}`}>
            <img src={currentNotice.imageUrl} alt={currentNotice.title || "ThĂ´ng bĂ¡o"} />
            <div className={styles.slideContent}>
              <div className={styles.badge}>{levelLabel(currentNotice.level)}</div>
              <h1 className={styles.title}>{currentNotice.title}</h1>
              <p className={styles.body}>{currentNotice.content}</p>
            </div>
          </div>
        ) : null}

        {currentNotice && (currentNotice.type === "TEXT" || (currentNotice.type !== "IMAGE" && !currentNotice.imageUrl)) ? (
          <div ref={fitBoxRef} className={`${styles.fitBox} ${styles.slideContent}`}>
            <div className={styles.badge}>{levelLabel(currentNotice.level)}</div>
            <h1 className={styles.title}>{currentNotice.title}</h1>
            <p className={styles.body}>{currentNotice.content}</p>
          </div>
        ) : null}
      </section>

      <footer className={styles.statusbar}>
        <span>NhĂ³m: {groupCode}</span>
        <span>{clock}</span>
        <span>{syncStatus}</span>
      </footer>
    </main>
  );
}

