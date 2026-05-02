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
import { useLocation } from "wouter";
import { getFullColor, getTintedColor } from "@/lib/color-utils";

export function Catch() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialBarcode = searchParams.get("barcode") || "";

  const [barcodeInput, setBarcodeInput] = useState(initialBarcode);
  const [scannedBarcode, setScannedBarcode] = useState(initialBarcode);
  
  const barcodeRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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
          description: err.error || "An error occurred",
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
        // Invalid barcode format for JsBarcode while typing is fine, ignore
      }
    }
  }, [barcodeInput]);

  useEffect(() => {
    // Initialize scanner only if we don't already have an initial scan running
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        setScannedBarcode(decodedText);
        setBarcodeInput(decodedText);
        scanner.pause(true); // Pause scanning once found
      },
      (error) => {
        // Ignore errors during continuous scanning
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput) {
      setScannedBarcode(barcodeInput);
    }
  };

  const resumeScanner = () => {
    setScannedBarcode("");
    setBarcodeInput("");
    if (scannerRef.current) {
      scannerRef.current.resume();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Catch a Flavor</h1>
        <p className="text-muted-foreground font-medium text-lg">Scan a barcode or enter it manually.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner Column */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Camera Scanner
            </div>
            <div className="p-4">
              <div id="reader" className="w-full rounded-2xl overflow-hidden [&>div]:border-none [&_button]:bg-primary [&_button]:text-white [&_button]:rounded-full [&_button]:px-4 [&_button]:py-2 [&_button]:font-bold [&_button]:shadow-sm"></div>
            </div>
          </Card>

          <Card className="rounded-3xl border-2 shadow-sm">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <ScanBarcode className="w-5 h-5 text-primary" /> Manual Entry
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Input 
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode..."
                    className="rounded-xl border-2 shadow-none font-mono"
                  />
                  <Button type="submit" className="rounded-xl font-bold shadow-sm shrink-0">Look up</Button>
                </div>
                
                <div className="h-28 bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed p-4 text-muted-foreground overflow-hidden">
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
        <div className="flex flex-col h-full min-h-[400px]">
          {isFlavorLoading ? (
            <Card className="rounded-3xl border-2 h-full flex flex-col items-center justify-center p-12 text-muted-foreground shadow-sm">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="font-bold">Looking up database...</p>
            </Card>
          ) : scannedBarcode && flavor ? (
            <Card 
              className="rounded-3xl border-2 h-full flex flex-col shadow-sm"
              style={{ backgroundColor: getTintedColor(flavor.color, "15"), borderColor: getFullColor(flavor.color) }}
            >
              <div className="h-56 relative flex items-center justify-center border-b-2" style={{ borderColor: getFullColor(flavor.color) }}>
                {/* Bottle visualization */}
                <div className="w-24 h-40 rounded-t-[2rem] rounded-b-xl relative shadow-xl" style={{ backgroundColor: getFullColor(flavor.color) }}>
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/60 border-2 border-black/10 shadow-sm" />
                  <div className="absolute inset-x-0 top-1/3 bottom-3 bg-white/20 rounded-lg mx-2 backdrop-blur-sm border border-white/40 flex items-center justify-center flex-col">
                    <span className="text-[12px] font-black opacity-60 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 flex flex-col flex-1 text-center bg-card rounded-b-3xl">
                <h3 className="text-4xl font-black mb-2 text-foreground">{flavor.japaneseName}</h3>
                <p className="font-bold text-muted-foreground mb-4 uppercase tracking-widest text-sm">{flavor.name}</p>
                <p className="text-muted-foreground font-mono text-sm bg-muted inline-block mx-auto px-3 py-1 rounded-md">{flavor.barcode}</p>
                
                {flavor.description && (
                  <p className="mt-6 font-medium text-foreground">{flavor.description}</p>
                )}
                
                <div className="mt-auto pt-8 space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full rounded-2xl font-black text-xl h-16 shadow-lg hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: getFullColor(flavor.color), color: "#fff" }}
                    onClick={() => catchMutation.mutate({ data: { flavorId: flavor.id } })}
                    disabled={catchMutation.isPending}
                  >
                    {catchMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Catch it!"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl font-bold border-2 h-12"
                    onClick={resumeScanner}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isFlavorError ? (
            <Card className="rounded-3xl border-2 border-destructive h-full flex flex-col items-center justify-center p-12 text-center bg-destructive/5 shadow-sm">
              <div className="w-20 h-20 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-6">
                <span className="font-black text-4xl">?</span>
              </div>
              <h3 className="text-2xl font-black text-destructive mb-2">Not in database</h3>
              <p className="text-muted-foreground font-medium mb-8">We couldn't find a ramune flavor with barcode <span className="font-mono text-foreground bg-background px-2 py-1 rounded-md border">{scannedBarcode}</span>.</p>
              <Button variant="outline" className="rounded-xl font-bold border-2 h-12 px-8" onClick={resumeScanner}>
                Try again
              </Button>
            </Card>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground bg-muted/20 shadow-sm min-h-[400px]">
              <Scan className="w-20 h-20 mx-auto mb-6 opacity-30" />
              <p className="font-bold text-xl mb-2 text-foreground/70">Waiting for scan...</p>
              <p className="text-base">Point your camera at a barcode or type it in to see details.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}