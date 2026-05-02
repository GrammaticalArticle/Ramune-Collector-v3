import { useListFlavors, useListCaught, getListFlavorsQueryKey, getListCaughtQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Search, ScanBarcode, ScanText, X, Loader2, RotateCcw, BadgeCheck, Circle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useLocation } from "wouter";
import type { Flavor } from "@workspace/api-client-react";

const BRAND_ORDER = ["Hata Kosen", "Doraemon", "Sangaria"];

function getCategoryColor(category: string) {
  switch(category.toLowerCase()) {
    case 'limited': return 'bg-amber-500 text-amber-950 border-amber-600';
    case 'savory': return 'bg-orange-500 text-orange-950 border-orange-600';
    case 'doraemon': return 'bg-blue-600 text-blue-50 border-blue-700';
    case 'sangaria': return 'bg-teal-500 text-teal-950 border-teal-600';
    case 'standard': return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
    default: return 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700';
  }
}

type VerifyResult =
  | { status: "match"; extractedText: string }
  | { status: "mismatch"; foundFlavor: Flavor | null; extractedText: string }
  | { status: "error"; message: string };

function VerifyModal({ flavor, onClose, onVerified }: { flavor: Flavor; onClose: () => void; onVerified: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 720 }, height: { ideal: 1280 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
    } catch {
      setCameraError("Could not access camera.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maxDim = 1280;
    const scale = Math.min(1, maxDim / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
    const base64 = dataUrl.split(",")[1];

    stopCamera();
    setCapturedDataUrl(dataUrl);
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch("/api/scan-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ status: "error", message: data.error || "Could not identify the flavor." });
      } else if (data.flavor?.id === flavor.id) {
        setResult({ status: "match", extractedText: data.extractedText });
        onVerified();
      } else {
        setResult({ status: "mismatch", foundFlavor: data.flavor ?? null, extractedText: data.extractedText });
      }
    } catch {
      setResult({ status: "error", message: "Something went wrong. Please try again." });
    } finally {
      setScanning(false);
    }
  };

  const retake = () => {
    setCapturedDataUrl(null);
    setResult(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-t-3xl sm:rounded-3xl border-2 w-full sm:max-w-sm overflow-y-auto max-h-[90dvh] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Verifying</p>
            <h2 className="font-black text-lg leading-tight">{flavor.japaneseName}</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        {!result && (
          <p className="px-5 pb-2 text-sm text-muted-foreground font-medium">
            Point the camera at the flavor text on the label, then tap Capture.
          </p>
        )}

        {/* Camera / captured */}
        <div className="relative bg-black aspect-[3/4] w-full overflow-hidden">
          <canvas ref={canvasRef} className="hidden" />
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className={`w-full h-full object-cover ${capturedDataUrl ? "hidden" : "block"}`}
          />
          {capturedDataUrl && (
            <img src={capturedDataUrl} alt="Captured" className="w-full h-full object-cover" />
          )}
          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              <span className="text-white font-bold text-sm">Checking label...</span>
            </div>
          )}
          {!capturedDataUrl && !cameraReady && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="text-white font-bold text-sm">{cameraError}</span>
              <Button size="sm" variant="secondary" onClick={startCamera} className="rounded-xl font-bold">Retry</Button>
            </div>
          )}
          {cameraReady && !capturedDataUrl && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative w-2/5 h-3/4 rounded-3xl ring-2 ring-white/70 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.30)]">
                <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-white rounded-tr-xl" />
                <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-white rounded-br-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Result / controls */}
        <div className="p-4 space-y-3">
          {result?.status === "match" && (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl p-3">
              <BadgeCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-black text-emerald-700 dark:text-emerald-400">Verified!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">Label matches — <span className="font-mono">{result.extractedText}</span></p>
              </div>
            </div>
          )}
          {result?.status === "mismatch" && (
            <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-3">
              <AlertCircle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <p className="font-black text-amber-700 dark:text-amber-400">Different flavor found</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                  Read: <span className="font-mono">{result.extractedText}</span>
                  {result.foundFlavor && <> → {result.foundFlavor.japaneseName}</>}
                </p>
              </div>
            </div>
          )}
          {result?.status === "error" && (
            <div className="flex items-center gap-3 bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-3">
              <AlertCircle className="w-8 h-8 text-destructive shrink-0" />
              <p className="text-sm font-bold text-destructive">{result.message}</p>
            </div>
          )}

          {capturedDataUrl && !scanning ? (
            <Button variant="outline" className="w-full rounded-2xl font-bold h-11 gap-2" onClick={retake}>
              <RotateCcw className="w-4 h-4" /> Retake
            </Button>
          ) : (
            <Button
              className="w-full rounded-2xl font-bold h-12 gap-2"
              onClick={handleCapture}
              disabled={!cameraReady || scanning}
            >
              {scanning ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Checking...</>
              ) : (
                <><Circle className="w-4 h-4 fill-current" /> Capture</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Collection() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "caught" | "uncaught">("all");
  const [verifyingFlavor, setVerifyingFlavor] = useState<Flavor | null>(null);
  const [verifiedFlavorIds, setVerifiedFlavorIds] = useState<Set<number>>(new Set());
  const { username } = useAuth();

  const { data: flavors, isLoading: flavorsLoading } = useListFlavors({
    query: { queryKey: getListFlavorsQueryKey() }
  });

  const { data: caught, isLoading: caughtLoading } = useListCaught(
    { username: username ?? "" },
    { query: { queryKey: getListCaughtQueryKey({ username: username ?? "" }), enabled: !!username } }
  );

  const caughtFlavorIds = useMemo(() => {
    if (!caught) return new Set<number>();
    return new Set(caught.map(c => c.flavorId));
  }, [caught]);

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    
    let filtered = flavors;
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(lowerSearch) || 
        f.japaneseName.toLowerCase().includes(lowerSearch) ||
        f.barcode.includes(lowerSearch)
      );
    }

    if (filter === "caught") {
      filtered = filtered.filter(f => caughtFlavorIds.has(f.id));
    } else if (filter === "uncaught") {
      filtered = filtered.filter(f => !caughtFlavorIds.has(f.id));
    }

    const groups: Record<string, typeof flavors> = {};
    
    filtered.forEach(f => {
      const brand = f.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(f);
    });

    Object.keys(groups).forEach(brand => {
      groups[brand].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return Object.entries(groups).sort(([a], [b]) => {
      const idxA = BRAND_ORDER.indexOf(a);
      const idxB = BRAND_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [flavors, search, filter, caughtFlavorIds]);

  const isLoading = flavorsLoading || caughtLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      {verifyingFlavor && (
        <VerifyModal
          flavor={verifyingFlavor}
          onClose={() => setVerifyingFlavor(null)}
          onVerified={() => setVerifiedFlavorIds(prev => new Set(prev).add(verifyingFlavor.id))}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">My Collection</h1>
          <p className="text-muted-foreground font-medium text-base sm:text-lg">
            {!isLoading && flavors && caught ? (
              <>You've caught <strong className="text-primary">{caught.length}</strong> out of {flavors.length} flavors.</>
            ) : "Loading collection..."}
          </p>
        </div>
        <button
          onClick={() => navigate("/catch")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-2xl text-sm shadow-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <ScanBarcode className="w-4 h-4" />
          Scan to Catch
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center bg-card p-3 rounded-3xl border-2 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or barcode..." 
            className="pl-12 rounded-2xl border-none shadow-none h-11 font-medium bg-muted/50 focus-visible:bg-background"
          />
        </div>
        <div className="flex bg-muted/50 p-1 rounded-2xl overflow-hidden">
          {(["all", "caught", "uncaught"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 sm:w-24 px-3 py-2 rounded-xl font-bold text-sm transition-all capitalize",
                filter === f ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-3xl" />
          ))}
        </div>
      ) : groupedFlavors.length > 0 ? (
        <div className="space-y-8 sm:space-y-12">
          {groupedFlavors.map(([brand, brandFlavors]) => {
            const brandTotal = flavors?.filter(f => (f.brand || "Other") === brand).length || 0;
            const brandCaught = brandFlavors.filter(f => caughtFlavorIds.has(f.id)).length;
            
            return (
              <div key={brand} className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl font-black">{brand}</h2>
                  <Badge variant="outline" className="rounded-full px-3 font-bold border-2 text-xs sm:text-sm">
                    {brandCaught} / {brandTotal}
                  </Badge>
                  <div className="flex-1 h-0.5 bg-border rounded-full" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {brandFlavors.map((flavor) => {
                    const isCaught = caughtFlavorIds.has(flavor.id);
                    const hexColor = getFullColor(flavor.color);
                    const tintColor = getTintedColor(flavor.color, "1A");
                    const imageUrl = (flavor as any).imageUrl as string | null | undefined;
                    
                    return (
                      <Card 
                        key={flavor.id} 
                        className={cn(
                          "rounded-3xl border-2 overflow-hidden transition-all duration-300 relative border-l-4 sm:border-l-8",
                          isCaught ? "bg-card shadow-sm" : "opacity-75 bg-card"
                        )}
                        style={{ 
                          borderLeftColor: hexColor,
                          backgroundColor: isCaught ? tintColor : undefined
                        }}
                      >
                        <CardContent className="p-3 sm:p-5">
                          <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={flavor.name}
                                  className="w-10 h-14 sm:w-12 sm:h-16 object-contain shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-3 sm:w-4 h-12 sm:h-14 rounded-full shrink-0 mt-0.5"
                                  style={{ backgroundColor: hexColor }}
                                />
                              )}
                              <div className="space-y-0.5 min-w-0">
                                <h3
                                  className="font-black text-sm sm:text-base leading-snug"
                                  title={flavor.japaneseName}
                                  style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                                >
                                  {flavor.japaneseName}
                                </h3>
                                <p
                                  className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] sm:text-[10px] leading-tight"
                                  title={flavor.name}
                                  style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                                >
                                  {flavor.name}
                                </p>
                              </div>
                            </div>
                            <div 
                              className={cn(
                                "w-7 h-7 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-colors shrink-0",
                                isCaught ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-dashed text-muted-foreground"
                              )}
                            >
                              {isCaught && <Check className="w-3 h-3 sm:w-4 sm:h-4" strokeWidth={3} />}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                            <Badge className={cn("px-1.5 py-0.5 font-bold text-[9px] uppercase border", getCategoryColor(flavor.category))}>
                              {flavor.category}
                            </Badge>
                          </div>

                          <div className="pt-2 sm:pt-3 border-t-2 border-border/50 space-y-2">
                            <p className="font-mono text-[10px] sm:text-xs text-muted-foreground font-bold tracking-widest truncate">
                              {isCaught ? flavor.barcode : "Not caught yet"}
                            </p>
                            {isCaught && (
                              <button
                                onClick={() => setVerifyingFlavor(flavor)}
                                className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-bold transition-colors ${verifiedFlavorIds.has(flavor.id) ? "text-emerald-600 hover:text-emerald-500" : "text-primary hover:text-primary/80"}`}
                              >
                                {verifiedFlavorIds.has(flavor.id) ? (
                                  <><BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Verified</>
                                ) : (
                                  <><ScanText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />Verify label</>
                                )}
                              </button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed">
          <p className="font-bold text-xl mb-2">No flavors found</p>
          <p>Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}
