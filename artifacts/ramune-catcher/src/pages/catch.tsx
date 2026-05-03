import { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import JsBarcode from "jsbarcode";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import type { Flavor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, ScanBarcode, Loader2, Scan, BadgeCheck, Plus, Trash2, Pencil, Check, X,
} from "lucide-react";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LookupState = "idle" | "loading" | "found" | "notfound";

function BarcodeManager({ flavorId, primaryBarcode, onClose, onPrimaryUpdated }: {
  flavorId: number;
  primaryBarcode: string | null | undefined;
  onClose: () => void;
  onPrimaryUpdated: () => void;
}) {
  const [editingPrimary, setEditingPrimary] = useState(false);
  const [primaryInput, setPrimaryInput] = useState(primaryBarcode ?? "");
  const [newAltInput, setNewAltInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: altBarcodes, isLoading: altLoading } = useQuery({
    queryKey: ["flavor_barcodes", flavorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("flavor_barcodes")
        .select("*")
        .eq("flavor_id", flavorId)
        .order("added_at");
      return data ?? [];
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const { error } = await supabase
        .from("flavors")
        .update({ barcode })
        .eq("id", flavorId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setEditingPrimary(false);
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      onPrimaryUpdated();
      toast({ title: "Primary barcode updated!" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addAltMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const { error } = await supabase
        .from("flavor_barcodes")
        .insert({ flavor_id: flavorId, barcode, region: "JP" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setNewAltInput("");
      queryClient.invalidateQueries({ queryKey: ["flavor_barcodes", flavorId] });
      toast({ title: "Alternate barcode added!" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteAltMutation = useMutation({
    mutationFn: async (barcode: string) => {
      const { error } = await supabase
        .from("flavor_barcodes")
        .delete()
        .eq("flavor_id", flavorId)
        .eq("barcode", barcode);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flavor_barcodes", flavorId] });
      toast({ title: "Barcode removed" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-2.5 pt-2 sm:pt-3 border-t-2 border-border/50">
      <div>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Primary</p>
        {editingPrimary ? (
          <div className="flex items-center gap-1">
            <Input
              value={primaryInput}
              onChange={e => setPrimaryInput(e.target.value.replace(/\D/g, ""))}
              placeholder="Barcode..."
              className="h-6 text-[10px] font-mono rounded-md shadow-none border-primary/50 px-2"
              autoFocus
              disabled={setPrimaryMutation.isPending}
              onKeyDown={e => {
                if (e.key === "Enter") setPrimaryMutation.mutate(primaryInput);
                if (e.key === "Escape") setEditingPrimary(false);
              }}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md shrink-0"
              onClick={() => setPrimaryMutation.mutate(primaryInput)} disabled={setPrimaryMutation.isPending}>
              <Check className="w-3 h-3 text-emerald-600" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md shrink-0"
              onClick={() => setEditingPrimary(false)}>
              <X className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[10px] text-muted-foreground font-bold tracking-widest truncate">
              {primaryBarcode ?? "None"}
            </span>
            <button
              onClick={() => { setPrimaryInput(primaryBarcode ?? ""); setEditingPrimary(true); }}
              className="flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              <Pencil className="w-2.5 h-2.5" />{primaryBarcode ? "Edit" : "Set"}
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Alternates</p>
        {altLoading ? (
          <p className="text-[10px] text-muted-foreground">Loading...</p>
        ) : altBarcodes && altBarcodes.length > 0 ? (
          <div className="space-y-1">
            {altBarcodes.map((b: { id: number; barcode: string }) => (
              <div key={b.id} className="flex items-center justify-between gap-1">
                <span className="font-mono text-[10px] text-muted-foreground font-bold tracking-widest truncate">{b.barcode}</span>
                <button
                  onClick={() => deleteAltMutation.mutate(b.barcode)}
                  disabled={deleteAltMutation.isPending}
                  className="text-destructive/60 hover:text-destructive transition-colors shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">None</p>
        )}
        <div className="flex items-center gap-1 mt-1.5">
          <Input
            value={newAltInput}
            onChange={e => setNewAltInput(e.target.value.replace(/\D/g, ""))}
            placeholder="Add alternate..."
            className="h-6 text-[10px] font-mono rounded-md shadow-none border-dashed px-2"
            disabled={addAltMutation.isPending}
            onKeyDown={e => { if (e.key === "Enter") addAltMutation.mutate(newAltInput); }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md shrink-0"
            onClick={() => addAltMutation.mutate(newAltInput)}
            disabled={addAltMutation.isPending || !newAltInput.trim()}>
            <Plus className="w-3 h-3 text-primary" />
          </Button>
        </div>
      </div>

      <button onClick={onClose} className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors">
        Done
      </button>
    </div>
  );
}

export function Catch() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialBarcode = searchParams.get("barcode") || "";

  const [barcodeInput, setBarcodeInput] = useState(initialBarcode);
  const [scannedBarcode, setScannedBarcode] = useState(initialBarcode);
  const [lookupState, setLookupState] = useState<LookupState>(initialBarcode ? "loading" : "idle");
  const [flavor, setFlavor] = useState<Flavor | null>(null);
  const [catching, setCatching] = useState(false);
  const [managingBarcodeFor, setManagingBarcodeFor] = useState<number | null>(null);

  const [newJpName, setNewJpName] = useState("");
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#4FC3F7");
  const [newCategory, setNewCategory] = useState("standard");
  const [savingNew, setSavingNew] = useState(false);

  const barcodeRef = useRef<SVGSVGElement>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (barcodeInput && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, barcodeInput, {
          format: "CODE128", width: 2, height: 60, displayValue: true,
          margin: 0, background: "transparent", lineColor: "currentColor",
        });
      } catch { /* invalid barcode while typing */ }
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
      () => {}
    );
    return () => { scanner.clear().catch(console.error); };
  }, []);

  const lookupBarcode = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;
    setLookupState("loading");
    setFlavor(null);

    const { data: primary } = await supabase
      .from("flavors")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (primary) {
      setFlavor(mapFlavor(primary as Record<string, unknown>));
      setLookupState("found");
      return;
    }

    const { data: alt } = await supabase
      .from("flavor_barcodes")
      .select("*, flavors(*)")
      .eq("barcode", barcode)
      .maybeSingle();

    if (alt?.flavors) {
      setFlavor(mapFlavor(alt.flavors as Record<string, unknown>));
      setLookupState("found");
      return;
    }

    setLookupState("notfound");
  }, []);

  useEffect(() => {
    if (scannedBarcode) lookupBarcode(scannedBarcode);
  }, [scannedBarcode, lookupBarcode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) setScannedBarcode(barcodeInput.trim());
  };

  const resetAll = () => {
    setScannedBarcode("");
    setBarcodeInput("");
    setLookupState("idle");
    setFlavor(null);
    setNewJpName("");
    setNewName("");
    setNewColor("#4FC3F7");
    setNewCategory("standard");
    setManagingBarcodeFor(null);
    if (scannerRef.current) {
      try { scannerRef.current.resume(); } catch { /* ignore */ }
    }
  };

  const handleCatch = async () => {
    if (!flavor || !user) return;
    setCatching(true);
    const { error } = await supabase
      .from("caught_flavors")
      .insert({ user_id: user.id, flavor_id: flavor.id });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already in your collection!", description: `${flavor.name} is already caught.` });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Caught!", description: `${flavor.name} added to your collection.` });
      queryClient.invalidateQueries({ queryKey: ["caught", user.id] });
      queryClient.invalidateQueries({ queryKey: ["caught_count", user.id] });
      resetAll();
    }
    setCatching(false);
  };

  const handleSaveAndCatch = async () => {
    if (!newJpName.trim() || !newName.trim() || !user) return;
    setSavingNew(true);

    const { data: newFlavor, error: insertErr } = await supabase
      .from("flavors")
      .insert({
        japanese_name: newJpName.trim(),
        name: newName.trim(),
        barcode: scannedBarcode || null,
        color: newColor,
        brand: "Unknown",
        category: newCategory,
        sort_order: 999,
      })
      .select()
      .single();

    if (insertErr) {
      toast({ title: "Error saving flavor", description: insertErr.message, variant: "destructive" });
      setSavingNew(false);
      return;
    }

    const { error: catchErr } = await supabase
      .from("caught_flavors")
      .insert({ user_id: user.id, flavor_id: newFlavor.id });

    if (catchErr && catchErr.code !== "23505") {
      toast({ title: "Saved but failed to catch", description: catchErr.message, variant: "destructive" });
    } else {
      toast({ title: "Saved & Caught!", description: `${newName.trim()} added to the database and your collection.` });
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      queryClient.invalidateQueries({ queryKey: ["caught", user.id] });
      queryClient.invalidateQueries({ queryKey: ["caught_count", user.id] });
      resetAll();
    }
    setSavingNew(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">Catch a Flavor</h1>
        <p className="text-muted-foreground font-medium text-base sm:text-lg">Scan the JAN/EAN barcode on your Ramune bottle.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Left: Scanner */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="rounded-3xl border-2 overflow-hidden shadow-sm">
            <div className="bg-muted p-3 sm:p-4 border-b-2 font-bold flex items-center gap-2 text-sm sm:text-base">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Camera Scanner
            </div>
            <div className="p-3 sm:p-4">
              <div
                id="reader"
                className="w-full rounded-2xl overflow-hidden [&>div]:border-none [&_button]:bg-primary [&_button]:text-white [&_button]:rounded-full [&_button]:px-4 [&_button]:py-2 [&_button]:font-bold [&_button]:shadow-sm"
              />
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
                    <svg ref={barcodeRef} className="max-w-full h-full text-foreground" />
                  ) : (
                    <span className="font-medium text-sm">Barcode preview</span>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Result */}
        <div className="flex flex-col min-h-[360px] sm:min-h-[400px]">
          {lookupState === "loading" ? (
            <Card className="rounded-3xl border-2 flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground shadow-sm">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
              <p className="font-bold">Looking up database...</p>
            </Card>

          ) : lookupState === "found" && flavor ? (
            <Card
              className="rounded-3xl border-2 flex-1 flex flex-col shadow-sm"
              style={{ backgroundColor: getTintedColor(flavor.color, "15"), borderColor: getFullColor(flavor.color) }}
            >
              <div
                className="relative flex items-center justify-center border-b-2 py-6 sm:py-8"
                style={{ borderColor: getFullColor(flavor.color) }}
              >
                {flavor.imageUrl ? (
                  <img src={flavor.imageUrl} alt={flavor.name} className="h-36 sm:h-44 w-auto object-contain drop-shadow-xl" />
                ) : (
                  <div className="w-20 sm:w-24 h-36 sm:h-40 rounded-t-[2rem] rounded-b-xl relative shadow-xl"
                    style={{ backgroundColor: getFullColor(flavor.color) }}>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/60 border-2 border-black/10 shadow-sm" />
                    <div className="absolute inset-x-0 top-1/3 bottom-3 bg-white/20 rounded-lg mx-2 backdrop-blur-sm border border-white/40 flex items-center justify-center">
                      <span className="text-[10px] sm:text-[12px] font-black opacity-60 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                  <BadgeCheck className="w-3.5 h-3.5" /> In database
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 flex flex-col flex-1 text-center bg-card rounded-b-3xl">
                <h3 className="text-2xl sm:text-4xl font-black mb-2 text-foreground leading-tight">{flavor.japaneseName}</h3>
                <p className="font-bold text-muted-foreground mb-3 sm:mb-4 uppercase tracking-widest text-xs sm:text-sm">{flavor.name}</p>
                <p className="text-muted-foreground font-mono text-xs sm:text-sm bg-muted inline-block mx-auto px-3 py-1 rounded-md">{scannedBarcode}</p>
                {flavor.description && (
                  <p className="mt-4 sm:mt-6 font-medium text-foreground text-sm sm:text-base">{flavor.description}</p>
                )}

                {isAdmin && (
                  managingBarcodeFor === flavor.id ? (
                    <BarcodeManager
                      flavorId={flavor.id}
                      primaryBarcode={flavor.barcode}
                      onClose={() => setManagingBarcodeFor(null)}
                      onPrimaryUpdated={() => lookupBarcode(scannedBarcode)}
                    />
                  ) : (
                    <button
                      onClick={() => setManagingBarcodeFor(flavor.id)}
                      className="mt-3 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                      Manage barcodes
                    </button>
                  )
                )}

                <div className="mt-auto pt-6 sm:pt-8 space-y-3">
                  <Button
                    size="lg"
                    className="w-full rounded-2xl font-black text-lg sm:text-xl h-14 sm:h-16 shadow-lg hover:scale-[1.02] transition-transform"
                    style={{ backgroundColor: getFullColor(flavor.color), color: "#fff" }}
                    onClick={handleCatch}
                    disabled={catching || !user}
                  >
                    {catching ? <Loader2 className="w-6 h-6 animate-spin" /> : "Catch it!"}
                  </Button>
                  <Button variant="outline" className="w-full rounded-2xl font-bold border-2 h-11 sm:h-12" onClick={resetAll}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

          ) : lookupState === "notfound" ? (
            <Card className="rounded-3xl border-2 flex-1 flex flex-col shadow-sm">
              <div className="p-6 sm:p-8 border-b-2 bg-amber-50 dark:bg-amber-950/30 rounded-t-3xl">
                <div className="w-14 h-14 bg-amber-500/20 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <span className="font-black text-2xl">?</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black mb-1">New Flavor!</h3>
                <p className="text-muted-foreground font-medium text-sm">
                  Barcode <span className="font-mono bg-background px-1.5 py-0.5 rounded border text-xs">{scannedBarcode}</span> isn't in the database yet.
                  Name it and add it!
                </p>
              </div>

              <CardContent className="p-6 sm:p-8 flex flex-col flex-1 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Japanese name (on bottle)</label>
                  <Input
                    placeholder="e.g. メロンラムネ"
                    value={newJpName}
                    onChange={e => setNewJpName(e.target.value)}
                    className="rounded-xl border-2 shadow-none font-bold text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">English name</label>
                  <Input
                    placeholder="e.g. Melon Ramune"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="rounded-xl border-2 shadow-none font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Category</label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger className="rounded-xl border-2 shadow-none h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="limited">Limited</SelectItem>
                        <SelectItem value="savory">Savory</SelectItem>
                        <SelectItem value="doraemon">Doraemon</SelectItem>
                        <SelectItem value="sangaria">Sangaria</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newColor}
                        onChange={e => setNewColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 cursor-pointer"
                      />
                      <span className="font-mono text-xs text-muted-foreground">{newColor}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3 pt-2">
                  <Button
                    className="w-full rounded-2xl font-black h-13 text-base shadow-sm gap-2"
                    onClick={handleSaveAndCatch}
                    disabled={savingNew || !newJpName.trim() || !newName.trim() || !user}
                  >
                    {savingNew ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus className="w-4 h-4" /> Save to Database & Catch</>}
                  </Button>
                  <Button variant="outline" className="w-full rounded-2xl font-bold border-2 h-11" onClick={resetAll}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>

          ) : (
            <Card className="rounded-3xl border-2 border-dashed flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center text-muted-foreground bg-muted/20 shadow-sm">
              <Scan className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 opacity-30" />
              <p className="font-bold text-lg sm:text-xl mb-2 text-foreground/70">Waiting for scan...</p>
              <p className="text-sm sm:text-base">Point your camera at a JAN/EAN barcode on a Ramune bottle.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
