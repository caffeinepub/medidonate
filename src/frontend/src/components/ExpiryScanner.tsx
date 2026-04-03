import { Button } from "@/components/ui/button";
import { Loader2, ScanLine } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface ExpiryScannerProps {
  onDateFound: (date: string) => void;
  onBatchDetected?: (batch: string) => void;
}

function parseExpiryDate(text: string): string | null {
  const patterns = [
    /(?:EXP(?:IRY|IRES?)?|USE\s+BY|BEST\s+BEFORE)\s*[:\s]\s*(\d{2}[/\-]\d{2,4})/i,
    /(\d{2})[/\-](\d{4})/,
    /(\d{2})[/\-](\d{2})(?!\d)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (
        pattern.source.includes("EXP") ||
        pattern.source.includes("USE") ||
        pattern.source.includes("BEST")
      ) {
        const raw = match[1];
        const parts = raw.split(/[/\-]/);
        if (parts.length === 2) {
          const mm = parts[0].padStart(2, "0");
          const yearPart = parts[1];
          const yyyy = yearPart.length === 2 ? `20${yearPart}` : yearPart;
          return `${yyyy}-${mm}-01`;
        }
      } else if (match[2]) {
        const mm = match[1].padStart(2, "0");
        const yearPart = match[2];
        const yyyy = yearPart.length === 2 ? `20${yearPart}` : yearPart;
        return `${yyyy}-${mm}-01`;
      }
    }
  }
  return null;
}

function parseBatchNumber(text: string): string | null {
  const patterns = [
    /(?:LOT\s*NO?\.?|BATCH\s*NO?\.?|LOT[:\s]+|BATCH[:\s]+)([A-Z0-9][A-Z0-9\-\/]{2,14})/i,
    /\bLOT\s*[:#]?\s*([A-Z0-9][A-Z0-9\-]{2,12})\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].trim().toUpperCase();
    }
  }
  return null;
}

declare global {
  interface Window {
    Tesseract?: {
      recognize(
        image: File | string,
        lang: string,
      ): Promise<{ data: { text: string } }>;
    };
  }
}

function loadTesseract(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Tesseract) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load OCR library"));
    document.head.appendChild(script);
  });
}

export function ExpiryScanner({
  onDateFound,
  onBatchDetected,
}: ExpiryScannerProps) {
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    try {
      await loadTesseract();
      if (!window.Tesseract) throw new Error("OCR library not available");
      const result = await window.Tesseract.recognize(file, "eng");
      const text = result.data.text;

      const isoDate = parseExpiryDate(text);
      if (isoDate) {
        const [yyyy, mm] = isoDate.split("-");
        onDateFound(isoDate);
        toast.success(`Expiry date found: ${mm}/${yyyy}`);
      } else {
        toast.error("No expiry date found in image");
      }

      if (onBatchDetected) {
        const batch = parseBatchNumber(text);
        if (batch) {
          onBatchDetected(batch);
          toast.success(`Batch number detected: ${batch}`);
        }
      }
    } catch {
      toast.error("Failed to scan image. Please try again.");
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
        data-ocid="donation.upload_button"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={scanning}
        onClick={() => fileInputRef.current?.click()}
        className="shrink-0 gap-1.5 border-primary/40 text-primary hover:bg-primary/5 hover:text-primary"
        data-ocid="donation.secondary_button"
      >
        {scanning ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ScanLine className="h-3.5 w-3.5" />
        )}
        {scanning ? "Scanning..." : "Scan Expiry"}
      </Button>
    </>
  );
}
