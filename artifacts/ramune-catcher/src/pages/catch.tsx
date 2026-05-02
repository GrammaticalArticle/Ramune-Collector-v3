import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import JsBarcode from "jsbarcode";
import { useGetFlavorByBarcode, useCatchFlavor, getGetFlavorByBarcodeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, ScanBarcode, Loader2, Scan } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";

export function Catch() {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const barcodeRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const { data: flavor, isLoading: isFlavorLoading, isError: isFlavorError, error } = useGetFlavorByBarcode(scannedBarcode, {
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
    // Initialize scanner
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
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Catch a Flavor</h1>
        <p className="text-muted-foreground font-medium text-lg">Scan a barcode or enter it manually.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scanner Column */}
        <div className="space-y-6">
          <Card className="rounded-3xl border-2 overflow-hidden">
            <div className="bg-muted p-4 border-b-2 font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" /> Camera Scanner
            </div>
            <div className="p-4">
              <div id="reader" className="w-full rounded-2xl overflow-hidden [&>div]:border-none [&_button]:bg-primary [&_button]:text-white [&_button]:rounded-full [&_button]:px-4 [&_button]:py-2 [&_button]:font-bold [&_button]:shadow-sm"></div>
            </div>
          </Card>

          <Card className="rounded-3xl border-2">
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
                  <Button type="submit" className="rounded-xl font-bold shadow-sm">Look up</Button>
                </div>
                
                <div className="h-24 bg-muted/50 rounded-2xl flex items-center justify-center border-2 border-dashed p-4 text-muted-foreground overflow-hidden">
                  {barcodeInput ? (
                    <svg ref={barcodeRef} className="max-w-full text-foreground"></svg>
                  ) : (
                    <span className="font-medium text-sm">Barcode preview</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Result Column */}
        <div>
          {isFlavorLoading ? (
            <Card className="rounded-3xl border-2 h-full flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="font-bold">Looking up database...</p>
            </Card>
          ) : scannedBarcode && flavor ? (
            <Card className="rounded-3xl border-2 h-full overflow-hidden flex flex-col">
              <div 
                className="h-48 relative flex items-center justify-center"
                style={{ backgroundColor: `${flavor.color}20` }}
              >
                {/* Bottle visualization */}
                <div className="w-20 h-32 rounded-t-2xl rounded-b-lg relative shadow-lg" style={{ backgroundColor: flavor.color }}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/50 border-2 border-black/10" />
                  <div className="absolute inset-x-0 top-1/3 bottom-2 bg-white/20 rounded-md mx-2 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-col">
                    <span className="text-[10px] font-black opacity-50 uppercase tracking-widest mix-blend-overlay">RAMUNE</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-8 flex flex-col flex-1 text-center">
                <h3 className="text-3xl font-black mb-2">{flavor.name}</h3>
                <p className="text-muted-foreground font-mono text-sm mb-6">{flavor.barcode}</p>
                {flavor.description && (
                  <p className="mb-8 font-medium">{flavor.description}</p>
                )}
                
                <div className="mt-auto space-y-3">
                  <Button 
                    size="lg" 
                    className="w-full rounded-2xl font-black text-lg h-14 shadow-sm"
                    onClick={() => catchMutation.mutate({ data: { flavorId: flavor.id } })}
                    disabled={catchMutation.isPending}
                  >
                    {catchMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Catch it!"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl font-bold border-2"
                    onClick={resumeScanner}
                  >
                    Scan another
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : isFlavorError ? (
            <Card className="rounded-3xl border-2 border-destructive h-full flex flex-col items-center justify-center p-12 text-center bg-destructive/5">
              <div className="w-16 h-16 bg-destructive/20 text-destructive rounded-full flex items-center justify-center mb-4">
                <span className="font-black text-2xl">?</span>
              </div>
              <h3 className="text-xl font-bold text-destructive mb-2">Not in database</h3>
              <p className="text-muted-foreground font-medium mb-6">We couldn't find a ramune flavor with barcode <span className="font-mono text-foreground">{scannedBarcode}</span>.</p>
              <Button variant="outline" className="rounded-xl font-bold border-2" onClick={resumeScanner}>
                Try again
              </Button>
            </Card>
          ) : (
            <Card className="rounded-3xl border-2 border-dashed h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Scan className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-bold text-lg mb-2">Waiting for scan...</p>
              <p className="text-sm">Point your camera at a barcode or type it in to see details.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
