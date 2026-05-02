import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import JsBarcode from "jsbarcode";
import { useGetFlavorByBarcode, useCatchFlavor, getGetFlavorByBarcodeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, ScanBarcode, Loader2, Scan, ScanText, BadgeCheck, RotateCcw, Circle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useAuth } from "@/hooks/use-auth";
import type { Flavor } from "@workspace/api-client-react";

type ScanMode = "barcode" | "label";

export function Catch() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialBarcode = searchParams.get("barcode") || "";

  const [mode, setMode] = useState<ScanMode>("barcode");
  const [barcodeInput, setBarcodeInput] = useState(initialBarcode);
  const [scannedBarcode, setScannedBarcode] = useState(initialBarcode);
  const [customBarcodeFlavorId, setCustomBarcodeFlavorId] = useState<number | null>(null);
  const [customBarcodeRegion, setCustomBarcodeRegion] = useState("JP");
  const [addingCustomBarcode, setAddingCustomBarcode] = useState(false);

  // Label scan state
  const [labelFlavor, setLabelFlavor] = useState<Flavor | null>(null);
  const [labelScanning, setLabelScanning] = useState(false);
  const [labelExtractedText, setLabelExtractedText] = useState<string | null>(null);
  const [labelConfidence, setLabelConfidence] = useState<string | null>(null);
  const [labelError, setLabelError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const barcodeRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { username } = useAuth();
  const isTima = username === "tima";

  const { data: flavor, isLoading: isFlavorLoading, isError: isFlavorError } = useGetFlavorByBarcode(scannedBarcode, {
    query: {
      enabled: !!scannedBarcode && mode === "barcode",
      queryKey: getGetFlavorByBarcodeQueryKey(scannedBarcode),
      retry: false
    }
  });

  const catchMutation = useCatchFlavor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Caught!", description: "Flavor added to your collection." });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/caught"] });
        resetAll();
      },
      onError: (err) => {
        toast({
          title: "Failed to catch",
          description: (err as any).data?.error || (err as any).message || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  useEffect(() => {
    if (barcodeInput && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeInput, {
          format: "CODE128", width: 2, height: 60, displayValue: true,
          margin: 0, background: "transparent", lineColor: "currentColor"
        });
      } catch { /* invalid barcode while typing */ }
    }
  }, [barcodeInput]);

  // Barcode scanner
  useEffect(() => {
    if (mode !== "barcode") return;
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      false
    );
    scannerRef.current = scanner;
    scanner.render(
      (decodedText) => {
        setScannedBarcode(decodedText);
        setBarcodeInput(decodedText);
        scanner.pause(true);
      },
      () => {}
    );
    return () => { scanner.clear().catch(console.error); };
  }, [mode]);

  // Live label camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera unavailable";
      setCameraError(msg.includes("Permission") || msg.includes("permission") ? "Camera permission denied." : "Could not access camera.");
    }
  }, []);

  useEffect(() => {
    if (mode === "label" && !capturedDataUrl && !labelScanning) {
      startCamera();
    }
    return () => {
      if (mode === "label") stopCamera();
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      const trimmed = barcodeInput.trim();
      if (trimmed === scannedBarcode) {
        setScannedBarcode("");
        setTimeout(() => setScannedBarcode(trimmed), 0);
      } else {
        setScannedBarcode(trimmed);
      }
    }
  };

  const resetAll = () => {
    setScannedBarcode("");
    setBarcodeInput("");
    setCustomBarcodeFlavorId(null);
    setLabelFlavor(null);
    setLabelExtractedText(null);
    setLabelConfidence(null);
    setLabelError(null);
    setCapturedDataUrl(null);
    if (scannerRef.current) {
      try { scannerRef.current.resume(); } catch { /* ignore if not paused */ }
    }
  };

  const retakePhoto = () => {
    setLabelFlavor(null);
    setLabelExtractedText(null);
    setLabelConfidence(null);
    setLabelError(null);
    setCapturedDataUrl(null);
    startCamera();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = dataUrl.split(",")[1];

    stopCamera();
    setCapturedDataUrl(dataUrl);
    setLabelScanning(true);
    setLabelError(null);

    try {
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLabelError(data.error || "Could not identify the flavor.");
        setLabelExtractedText(data.extractedText ?? null);
      } else {
        setLabelFlavor(data.flavor);
        setLabelExtractedText(data.extractedText);
        setLabelConfidence(data.confidence);
      }
    } catch {
      setLabelError("Something went wrong. Please try again.");
    } finally {
      setLabelScanning(false);
    }
  };

  const handleAddCustomBarcode = async () => {
    if (!scannedBarcode || !customBarcodeFlavorId || !isTima) return;
    setAddingCustomBarcode(true);
    try {
      const res = await fetch(`/api/flavors/${customBarcodeFlavorId}/barcodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: scannedBarcode, region: customBarcodeRegion, addedBy: "tima" }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "Failed to add barcode", variant: "destructive" });
      } else {
        toast({ title: "Barcode added!", description: `Barcode ${scannedBarcode} linked to this flavor.` });
        queryClient.invalidateQueries({ queryKey: getGetFlavorByBarcodeQueryKey(scannedBarcode) });
        resetAll();
      }
    } finally {
      setAddingCustomBarcode(false);
    }
  };

  const activeFlavor = mode === "barcode" ? flavor : labelFlavor;
  const imageUrl = (activeFlavor as any)?.imageUrl as string | null | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">Catch a Flavor</h1>
        <p className="text-muted-foreground font-medium text-base sm:text-lg">Scan a barcode or photograph the label.</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-2xl w-fit">
        <button
          onClick={() => { stopCamera(); setMode("barcode"); resetAll(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            mode === "barcode" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanBarcode className="w-4 h-4" /> Barcode
        </button>
        <button
          onClick={() => { setMode("label"); resetAll(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            mode === "label" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ScanText className="w-4 h-4" /> Label Scan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left Column */}
        <div className="space-y-4 sm:space-y-6">
          {mode === "barcode" ? (
            <>
              <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
                <div className="bg-muted p-3 sm:p-4 border-b-2 font-bold flex items-center gap-2 text-sm sm:text-base">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Camera Scanner
                </div>
                <div className="p-3 sm:p-4">
                  <div id="reader" className="w-full rounded-2xl overflow-hidden [&>div]:border-none [&_button]:bg-primary [&_button]:text-white [&_button]:rounded-full [&_button]:px-4 [&_button]:py-2 [&_button]:font-bold [&_button]:shadow-sm"></div>
                </div>
              </Card>

              <Card className="rounded-3xl border-2 shadow-sm">
                <div className="bg-muted p-3 sm:p-4 border-b-2 font-bold flex items-center gap-2 text-sm sm:text-base">
                  <ScanBarcode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Manual Entry
                </div>
                <CardContent className="p-4 sm:p-6">
                  <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        placeholder="Enter barcode number..."
                        className="rounded-xl border-2 shadow-none font-mono text-sm"
                      />
                      <Button type="submit" className="rounded-xl font-bold shadow-sm shrink-0 text-sm">Look up</Button>
                    </div>
                    <div className="h-24 sm:h-28 bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed p-4 text-muted-foreground overflow-hidden">
                      {barcodeInput ? (
                        <svg ref={barcodeRef} className="max-w-full h-full text-foreground"></svg>
                      ) : (
                        <span className="font-medium text-sm">Barcode preview</span>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Label Scan — Live Camera Card */
            <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
              <div className="bg-muted p-3 sm:p-4 border-b-2 font-bold flex items-center gap-2 text-sm sm:text-base">
                <ScanText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Label Camera
              </div>

              {/* Camera / captured view */}
              <div className="relative bg-black aspect-[4/3] w-full overflow-hidden">
                {/* Hidden canvas for frame grab */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Live video — always rendered so ref attaches; hidden after capture */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${capturedDataUrl ? "hidden" : "block"}`}
                />

                {/* Captured still */}
                {capturedDataUrl && (
                  <img src={capturedDataUrl} alt="Captured" className="w-full h-full object-cover" />
                )}

                {/* Scanning overlay */}
                {labelScanning && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <span className="text-white font-bold text-sm">Reading label...</span>
                  </div>
                )}

                {/* Camera loading */}
                {!capturedDataUrl && !cameraReady && !cameraError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}

                {/* Camera error */}
                {cameraError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <span className="text-white font-bold text-sm">{cameraError}</span>
                    <Button size="sm" variant="secondary" onClick={startCamera} className="rounded-xl font-bold">
                      Retry
                    </Button>
                  </div>
                )}

                {/* Viewfinder hint — only when live & ready */}
                {cameraReady && !capturedDataUrl && !labelScanning && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="border-2 border-white/60 rounded-2xl w-3/4 h-1/2 shadow-[0_0_0_9999px_rgba(0,0,0,0.25)]" />
                  </div>
                )}
              </div>

              {/* Controls below camera */}
              <div className="p-4 space-y-3">
                {capturedDataUrl && !labelScanning ? (
                  <Button
                    className="w-full rounded-2xl font-bold h-12 gap-2 text-sm"
                    variant="outline"
                    onClick={retakePhoto}
                  >
                    <RotateCcw className="w-4 h-4" /> Retake
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-2xl font-bold h-12 gap-2 text-sm"
                    onClick={handleCapture}
                    disabled={!cameraReady || labelScanning}
                  >
                    {labelScanning ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</>
                    ) : (
                      <><Circle className="w-4 h-4 fill-current" /> Capture</>
                    )}
                  </Button>
                )}

                {labelExtractedText && !labelScanning && (
                  <div className="bg-muted/50 rounded-xl p-3 border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Text found</p>
                    <p className="font-mono font-bold text-base">{labelExtractedText}</p>
                    {labelConfidence && (
                      <p className="text-xs text-muted-foreground mt-0.5">Confidence: {labelConfidence}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Result */}
        <div className="flex flex-col min-h-[360px] sm:min-h-[400px]">
          {(mode === "barcode" ? isFlavorLoading : labelScanning) ? (
            <Card className="rounded-3xl border-2 flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground shadow-sm">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="font-bold">{mode === "barcode" ? "Looking up database..." : "Identifying flavor..."}</p>
            </Card>
          ) : activeFlavor ? (
            <Card
              className="rounded-3xl border-2 flex-1 flex flex-col shadow-sm"
              style={{ backgroundColor: getTintedColor(activeFlavor.color, "15"), borderColor: getFullColor(activeFlavor.color) }}
            >
              <div className="relative flex items-center justify-center border-b-2 py-6 sm:py-8" style={{ borderColor: getFullColor(activeFlavor.color) }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={activeFlavor.name} className="h-36 sm:h-44 w-auto object-contain drop-shadow-xl" />
                ) : (
                  <div className="w-20 sm:w-24 h-36 sm:h-40 rounded-t-[2rem] rounded-b-xl relative shadow-xl" style={{ backgroundColor: getFullColor(activeFlavor.color) }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/60 border-2 border-black/10 shadow-sm" />
                    <div className="absolute inset-x-0 top-1/3 bottom-3 bg-white/20 rounded-lg mx-2 backdrop-blur-sm border border-white/40 flex items-center justify-center flex-col">
                      <span className="text-[10px] sm:text-[12px] font-black opacity-60 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                    </div>
                  </div>
                )}
                {mode === "label" && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                    <BadgeCheck className="w-3.5 h-3.5" /> Label verified
                  </div>
                )}
              </div>
              <CardContent className="p-6 sm:p-8 flex flex-col flex-1 text-center bg-card rounded-b-3xl">
                <h3 className="text-2xl sm:text-4xl font-black mb-2 text-foreground leading-tight">{activeFlavor.japaneseName}</h3>
                <p className="font-bold text-muted-foreground mb-3 sm:mb-4 uppercase tracking-widest text-xs sm:text-sm">{activeFlavor.name}</p>
                {mode === "barcode" && (
                  <p className="text-muted-foreground font-mono text-xs sm:text-sm bg-muted inline-block mx-auto px-3 py-1 rounded-md">{activeFlavor.barcode}</p>
                )}
                {activeFlavor.description && (
                  <p className="mt-4 sm:mt-6 font-medium text-foreground text-sm sm:text-base">{activeFlavor.description}</p>
                )}
                <div className="mt-auto pt-6 sm:pt-8 space-y-3">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl font-black text-lg sm:text-xl h-14 sm:h-16 shadow-lg hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: getFullColor(activeFlavor.color), color: "#fff" }}
                    onClick={() => catchMutation.mutate({ data: { flavorId: activeFlavor.id } })}
                    disabled={catchMutation.isPending}
                  >
                    {catchMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Catch it!"}
                  </Button>
                  <Button variant="outline" className="w-full rounded-2xl font-bold border-2 h-11 sm:h-12" onClick={resetAll}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : mode === "barcode" && isFlavorError ? (
            <Card className="rounded-3xl border-2 border-destructive flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-destructive/5 shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <span className="font-black text-3xl sm:text-4xl">?</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-destructive mb-2">Not in database</h3>
              <p className="text-muted-foreground font-medium mb-4 text-sm">
                No ramune flavor found for barcode{" "}
                <span className="font-mono text-foreground bg-background px-2 py-1 rounded-md border text-xs">{scannedBarcode}</span>
              </p>
              {isTima && (
                <div className="w-full mb-4 p-4 bg-muted/50 rounded-2xl border-2 space-y-3 text-left">
                  <p className="font-black text-sm text-foreground">Link barcode to a flavor (tima only)</p>
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Flavor ID</label>
                    <Input
                      type="number"
                      placeholder="Enter flavor ID..."
                      value={customBarcodeFlavorId ?? ""}
                      onChange={e => setCustomBarcodeFlavorId(e.target.value ? parseInt(e.target.value) : null)}
                      className="rounded-xl border-2 shadow-none h-10 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold">Region</label>
                    <Input
                      value={customBarcodeRegion}
                      onChange={e => setCustomBarcodeRegion(e.target.value.toUpperCase())}
                      placeholder="JP / EU / US"
                      maxLength={3}
                      className="rounded-xl border-2 shadow-none h-10 font-mono uppercase text-sm"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl font-bold h-10 text-sm"
                    onClick={handleAddCustomBarcode}
                    disabled={!customBarcodeFlavorId || addingCustomBarcode}
                  >
                    {addingCustomBarcode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Barcode"}
                  </Button>
                </div>
              )}
              <Button variant="outline" className="rounded-xl font-bold border-2 h-11 px-8 text-sm" onClick={resetAll}>
                Try again
              </Button>
            </Card>
          ) : mode === "label" && labelError ? (
            <Card className="rounded-3xl border-2 border-destructive flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-destructive/5 shadow-sm">
              <div className="w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4">
                <span className="font-black text-3xl">?</span>
              </div>
              <h3 className="text-xl font-black text-destructive mb-2">Flavor not recognized</h3>
              <p className="text-muted-foreground font-medium text-sm mb-2">{labelError}</p>
              {labelExtractedText && (
                <p className="text-sm font-mono bg-muted px-3 py-1 rounded-md mb-4">"{labelExtractedText}"</p>
              )}
              <p className="text-xs text-muted-foreground mb-4">Try a clearer photo of the flavor name text.</p>
              <Button variant="outline" className="rounded-xl font-bold border-2 h-11 px-8 text-sm gap-2" onClick={retakePhoto}>
                <RotateCcw className="w-4 h-4" /> Try again
              </Button>
            </Card>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center text-muted-foreground bg-muted/20 shadow-sm">
              {mode === "barcode" ? (
                <>
                  <Scan className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 opacity-30" />
                  <p className="font-bold text-lg sm:text-xl mb-2 text-foreground/70">Waiting for scan...</p>
                  <p className="text-sm sm:text-base">Point your camera at a barcode or type it in to see details.</p>
                </>
              ) : (
                <>
                  <ScanText className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 opacity-30" />
                  <p className="font-bold text-lg sm:text-xl mb-2 text-foreground/70">Aim at the label</p>
                  <p className="text-sm sm:text-base">
                    Point at the Japanese flavor name text on the bottle, then tap Capture.
                  </p>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
