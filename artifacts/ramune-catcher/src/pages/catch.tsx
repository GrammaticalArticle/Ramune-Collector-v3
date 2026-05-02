import { useState, useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import JsBarcode from "jsbarcode";
import { useGetFlavorByBarcode, useCatchFlavor, getGetFlavorByBarcodeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, ScanBarcode, Loader2, Scan } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function Catch() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialBarcode = searchParams.get("barcode") || "";

  const [barcodeInput, setBarcodeInput] = useState(initialBarcode);
  const [scannedBarcode, setScannedBarcode] = useState(initialBarcode);
  const [customBarcodeFlavorId, setCustomBarcodeFlavorId] = useState<number | null>(null);
  const [customBarcodeRegion, setCustomBarcodeRegion] = useState("JP");
  const [addingCustomBarcode, setAddingCustomBarcode] = useState(false);

  const barcodeRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { username } = useAuth();
  const isTima = username === "tima";

  const { data: flavor, isLoading: isFlavorLoading, isError: isFlavorError } = useGetFlavorByBarcode(scannedBarcode, {
    query: {
      enabled: !!scannedBarcode,
      queryKey: getGetFlavorByBarcodeQueryKey(scannedBarcode),
      retry: false
    }
  });

  const catchMutation = useCatchFlavor({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Caught!",
          description: "Flavor added to your collection.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/caught"] });
        setScannedBarcode("");
        setBarcodeInput("");
        resumeScanner();
      },
      onError: (err) => {
        toast({
          title: "Failed to catch",
          description: (err as any).error || "An error occurred",
          variant: "destructive"
        });
      }
    }
  });

  useEffect(() => {
    if (barcodeInput && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeInput, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          margin: 0,
          background: "transparent",
          lineColor: "currentColor"
        });
      } catch (e) {
        // Invalid barcode format while typing is fine, ignore
      }
    }
  }, [barcodeInput]);

  useEffect(() => {
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
      () => {
        // Ignore errors during continuous scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      const trimmed = barcodeInput.trim();
      if (trimmed === scannedBarcode) {
        // Force re-query by clearing first, then setting
        setScannedBarcode("");
        setTimeout(() => setScannedBarcode(trimmed), 0);
      } else {
        setScannedBarcode(trimmed);
      }
    }
  };

  const resumeScanner = () => {
    setScannedBarcode("");
    setBarcodeInput("");
    setCustomBarcodeFlavorId(null);
    if (scannerRef.current) {
      scannerRef.current.resume();
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
        // Invalidate the barcode lookup so next scan works
        queryClient.invalidateQueries({ queryKey: getGetFlavorByBarcodeQueryKey(scannedBarcode) });
        resumeScanner();
      }
    } finally {
      setAddingCustomBarcode(false);
    }
  };

  const imageUrl = (flavor as any)?.imageUrl as string | null | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">Catch a Flavor</h1>
        <p className="text-muted-foreground font-medium text-base sm:text-lg">Scan a barcode or enter it manually.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Scanner Column */}
        <div className="space-y-4 sm:space-y-6">
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
        </div>

        {/* Result Column */}
        <div className="flex flex-col min-h-[360px] sm:min-h-[400px]">
          {isFlavorLoading ? (
            <Card className="rounded-3xl border-2 flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground shadow-sm">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="font-bold">Looking up database...</p>
            </Card>
          ) : scannedBarcode && flavor ? (
            <Card 
              className="rounded-3xl border-2 flex-1 flex flex-col shadow-sm"
              style={{ backgroundColor: getTintedColor(flavor.color, "15"), borderColor: getFullColor(flavor.color) }}
            >
              <div className="relative flex items-center justify-center border-b-2 py-6 sm:py-8" style={{ borderColor: getFullColor(flavor.color) }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={flavor.name}
                    className="h-36 sm:h-44 w-auto object-contain drop-shadow-xl"
                  />
                ) : (
                  <div className="w-20 sm:w-24 h-36 sm:h-40 rounded-t-[2rem] rounded-b-xl relative shadow-xl" style={{ backgroundColor: getFullColor(flavor.color) }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/60 border-2 border-black/10 shadow-sm" />
                    <div className="absolute inset-x-0 top-1/3 bottom-3 bg-white/20 rounded-lg mx-2 backdrop-blur-sm border border-white/40 flex items-center justify-center flex-col">
                      <span className="text-[10px] sm:text-[12px] font-black opacity-60 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                    </div>
                  </div>
                )}
              </div>
              <CardContent className="p-6 sm:p-8 flex flex-col flex-1 text-center bg-card rounded-b-3xl">
                <h3 className="text-2xl sm:text-4xl font-black mb-2 text-foreground leading-tight">{flavor.japaneseName}</h3>
                <p className="font-bold text-muted-foreground mb-3 sm:mb-4 uppercase tracking-widest text-xs sm:text-sm">{flavor.name}</p>
                <p className="text-muted-foreground font-mono text-xs sm:text-sm bg-muted inline-block mx-auto px-3 py-1 rounded-md">{flavor.barcode}</p>
                
                {flavor.description && (
                  <p className="mt-4 sm:mt-6 font-medium text-foreground text-sm sm:text-base">{flavor.description}</p>
                )}
                
                <div className="mt-auto pt-6 sm:pt-8 space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full rounded-2xl font-black text-lg sm:text-xl h-14 sm:h-16 shadow-lg hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: getFullColor(flavor.color), color: "#fff" }}
                    onClick={() => catchMutation.mutate({ data: { flavorId: flavor.id } })}
                    disabled={catchMutation.isPending}
                  >
                    {catchMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Catch it!"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl font-bold border-2 h-11 sm:h-12"
                    onClick={resumeScanner}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isFlavorError ? (
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

              <Button variant="outline" className="rounded-xl font-bold border-2 h-11 px-8 text-sm" onClick={resumeScanner}>
                Try again
              </Button>
            </Card>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center text-muted-foreground bg-muted/20 shadow-sm">
              <Scan className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 opacity-30" />
              <p className="font-bold text-lg sm:text-xl mb-2 text-foreground/70">Waiting for scan...</p>
              <p className="text-sm sm:text-base">Point your camera at a barcode or type it in to see details.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
