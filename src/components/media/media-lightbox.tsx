import { Download, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { downloadFile, WORKSPACE_BUCKET } from "@/services/storage-service";
import { cn } from "@/lib/utils";

export type LightboxItem = {
  url: string;
  fileName: string;
  storagePath?: string;
  bucket?: string;
  kind?: "image" | "video";
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/** Full-screen in-app viewer with zoom and drag-to-pan. */
export function MediaLightbox({ item, onClose }: { item: LightboxItem | null; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [item?.url]);

  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") setZoom((z) => Math.min(MAX_ZOOM, z + 0.5));
      if (event.key === "-") setZoom((z) => Math.max(MIN_ZOOM, z - 0.5));
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [item, onClose]);

  if (!item) return null;

  const zoomed = zoom > 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={item.fileName}
    >
      <div className="safe-top flex items-center gap-1 border-b border-border/60 px-3 py-2">
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.fileName}</p>
        {item.kind !== "video" ? (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-10 text-center text-xs text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              aria-label="Reset zoom"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        ) : null}
        {item.storagePath ? (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl"
            aria-label="Download"
            onClick={() =>
              void downloadFile(
                item.storagePath!,
                item.fileName,
                item.bucket ?? WORKSPACE_BUCKET,
              ).catch((error) =>
                toast.error(error instanceof Error ? error.message : "Download failed"),
              )
            }
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          aria-label="Close viewer"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div
        className={cn(
          "flex flex-1 items-center justify-center overflow-hidden p-2",
          zoomed ? "cursor-grab touch-none" : "",
        )}
        onDoubleClick={() => {
          setZoom((z) => (z > 1 ? 1 : 2));
          setOffset({ x: 0, y: 0 });
        }}
        onPointerDown={(event) => {
          if (!zoomed) return;
          drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          setOffset({
            x: drag.current.ox + (event.clientX - drag.current.x),
            y: drag.current.oy + (event.clientY - drag.current.y),
          });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onWheel={(event) => {
          if (item.kind === "video") return;
          event.preventDefault();
          setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - event.deltaY / 500)));
        }}
      >
        {item.kind === "video" ? (
          <video src={item.url} controls autoPlay className="max-h-full max-w-full rounded-2xl" />
        ) : (
          <img
            src={item.url}
            alt={item.fileName}
            draggable={false}
            className="max-h-full max-w-full select-none rounded-2xl transition-transform"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          />
        )}
      </div>
    </div>
  );
}
