import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import type { Flavor } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Search, ScanBarcode, X, Loader2, Plus, Trash2, Pencil, BadgeCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import { useRarityStats } from "@/hooks/use-rarity-stats";
import { RarityBadge } from "@/components/rarity-badge";
import { RARITY_XP, RARITY_CONFIG } from "@/lib/rarity";
import { AvailabilityBadge } from "@/components/availability-badge";
import { Calendar } from "lucide-react";

const BRAND_ORDER = ["Hata Kosen", "Doraemon", "Sangaria"];

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "limited":  return "bg-amber-500 text-amber-950 border-amber-600";
    case "savory":   return "bg-orange-500 text-orange-950 border-orange-600";
    case "doraemon": return "bg-blue-600 text-blue-50 border-blue-700";
    case "sangaria": return "bg-teal-500 text-teal-950 border-teal-600";
    default:         return "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  }
}

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
      const { error } = await supabase.from("flavors").update({ barcode }).eq("id", flavorId);
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

function AvailabilityEditor({ flavorId, availableFrom, availableUntil, onSaved }: {
  flavorId: number;
  availableFrom: string | null;
  availableUntil: string | null;
  onSaved: (from: string | null, until: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(availableFrom ?? "");
  const [until, setUntil] = useState(availableUntil ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (vals: { from: string; until: string }) => {
      const { error } = await supabase
        .from("flavors")
        .update({ available_from: vals.from || null, available_until: vals.until || null })
        .eq("id", flavorId);
      if (error) throw new Error(error.message);
      return vals;
    },
    onSuccess: (vals) => {
      queryClient.invalidateQueries({ queryKey: ["flavors"] });
      onSaved(vals.from || null, vals.until || null);
      setOpen(false);
      toast({ title: "Availability saved!" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (!open) {
    return (
      <button
        onClick={() => { setFrom(availableFrom ?? ""); setUntil(availableUntil ?? ""); setOpen(true); }}
        className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground/60 hover:text-primary transition-colors"
      >
        <Calendar className="w-2.5 h-2.5" />
        {availableFrom || availableUntil ? "Edit availability" : "Set availability window"}
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 p-2.5 bg-muted/30 rounded-xl border border-dashed">
      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Availability Window</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5">From</p>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="h-7 text-xs rounded-lg shadow-none px-2" />
        </div>
        <div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase mb-0.5">Until</p>
          <Input type="date" value={until} onChange={e => setUntil(e.target.value)}
            className="h-7 text-xs rounded-lg shadow-none px-2" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="h-7 text-xs rounded-lg px-3"
          onClick={() => saveMutation.mutate({ from, until })} disabled={saveMutation.isPending}>
          Save
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-lg text-destructive px-3"
          onClick={() => saveMutation.mutate({ from: "", until: "" })} disabled={saveMutation.isPending}>
          Clear
        </Button>
        <button onClick={() => setOpen(false)} className="ml-auto text-[9px] font-bold text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function Collection() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "caught" | "uncaught">("all");
  const [managingBarcodeForId, setManagingBarcodeForId] = useState<number | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Flavor | null>(null);
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: rarityStats } = useRarityStats();

  const catchMutation = useMutation({
    mutationFn: async (flavorId: number) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase
        .from("caught_flavors")
        .insert({ user_id: user.id, flavor_id: flavorId });
      if (error) throw new Error(error.code === "23505" ? "Already in your collection!" : error.message);
    },
    onSuccess: (_, flavorId) => {
      queryClient.invalidateQueries({ queryKey: ["caught", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["caught_count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["caught_flavor_ids", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["rarity_stats"] });
      const info = rarityStats?.rarityMap[flavorId];
      const xp = info ? RARITY_XP[info.rarity] : 10;
      const cfg = info ? RARITY_CONFIG[info.rarity] : null;
      toast({
        title: `Caught! +${xp} XP`,
        description: cfg && info!.rarity !== "common"
          ? `${cfg.emoji} ${cfg.label} flavor!`
          : "Added to your collection.",
      });
    },
    onError: (err: Error) => toast({ title: err.message, variant: "destructive" }),
  });

  const { data: flavors, isLoading: flavorsLoading } = useQuery({
    queryKey: ["flavors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flavors")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []).map(row => mapFlavor(row as Record<string, unknown>));
    },
  });

  const { data: caughtRaw, isLoading: caughtLoading } = useQuery({
    queryKey: ["caught", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caught_flavors")
        .select("id, flavor_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const uncatchMutation = useMutation({
    mutationFn: async (flavorId: number) => {
      if (!user) return;
      const { error } = await supabase
        .from("caught_flavors")
        .delete()
        .eq("user_id", user.id)
        .eq("flavor_id", flavorId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caught", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["caught_count", user?.id] });
      toast({ title: "Removed from collection." });
    },
    onError: () => toast({ title: "Error removing flavor.", variant: "destructive" }),
  });

  const caughtFlavorIds = useMemo(() => {
    return new Set((caughtRaw ?? []).map(c => c.flavor_id));
  }, [caughtRaw]);

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    let filtered = flavors;

    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(lowerSearch) ||
        f.japaneseName.toLowerCase().includes(lowerSearch) ||
        (f.barcode ?? "").includes(lowerSearch)
      );
    }

    if (filter === "caught") filtered = filtered.filter(f => caughtFlavorIds.has(f.id));
    else if (filter === "uncaught") filtered = filtered.filter(f => !caughtFlavorIds.has(f.id));

    const groups: Record<string, Flavor[]> = {};
    filtered.forEach(f => {
      const brand = f.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(f);
    });

    Object.values(groups).forEach(g => g.sort((a, b) => a.sortOrder - b.sortOrder));

    return Object.entries(groups).sort(([a], [b]) => {
      const ia = BRAND_ORDER.indexOf(a), ib = BRAND_ORDER.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [flavors, search, filter, caughtFlavorIds]);

  const isLoading = flavorsLoading || caughtLoading;

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">{t.collection.title}</h1>
          <p className="text-muted-foreground font-medium text-base sm:text-lg">
            {!isLoading && flavors && caughtRaw != null ? (
              t.collection.subtitle(caughtRaw.length, flavors.length)
            ) : t.collection.loading}
          </p>
        </div>
        <button
          onClick={() => navigate("/catch")}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-bold px-5 py-2.5 rounded-2xl text-sm shadow-sm hover:opacity-90 transition-opacity shrink-0"
        >
          <ScanBarcode className="w-4 h-4" /> Scan to Catch
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
              {f === "all" ? t.collection.all : f === "caught" ? t.collection.caught : t.collection.uncaught}
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
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {brandFlavors.map((flavor) => {
                    const isCaught = caughtFlavorIds.has(flavor.id);
                    const isManaging = managingBarcodeForId === flavor.id;

                    return (
                      <Card
                        key={flavor.id}
                        onClick={() => !isManaging && setSelectedFlavor(flavor)}
                        className={cn(
                          "rounded-3xl border-2 overflow-hidden transition-all duration-300 shadow-sm group cursor-pointer hover:scale-[1.02]",
                          isCaught
                            ? "shadow-md ring-2 ring-offset-2 ring-offset-background"
                            : "opacity-60 hover:opacity-90"
                        )}
                        style={isCaught ? {
                          backgroundColor: getTintedColor(flavor.color, "10"),
                          borderColor: getFullColor(flavor.color),
                          "--tw-ring-color": getFullColor(flavor.color),
                        } as React.CSSProperties : {}}
                      >
                        <div
                          className="relative flex items-center justify-center py-4 sm:py-6 border-b-2"
                          style={isCaught ? { borderColor: getFullColor(flavor.color) } : {}}
                        >
                          {flavor.imageUrl ? (
                            <img src={flavor.imageUrl} alt={flavor.name} className="h-20 sm:h-28 w-auto object-contain drop-shadow-lg" />
                          ) : (
                            <div
                              className="w-12 sm:w-16 h-20 sm:h-28 rounded-t-[1.5rem] rounded-b-lg relative shadow-lg"
                              style={{ backgroundColor: getFullColor(flavor.color) }}
                            >
                              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 sm:w-5 h-4 sm:h-5 rounded-full bg-white/60 border border-black/10 shadow-sm" />
                              <div className="absolute inset-x-0 top-1/3 bottom-2 bg-white/20 rounded mx-1.5 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                                <span className="text-[8px] font-black opacity-50 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                              </div>
                            </div>
                          )}

                          {isCaught && (
                            <div
                              className="absolute top-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-md"
                              style={{ backgroundColor: getFullColor(flavor.color) }}
                            >
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={3} />
                            </div>
                          )}
                          {rarityStats?.rarityMap[flavor.id] && rarityStats.rarityMap[flavor.id].rarity !== "common" && (
                            <div className="absolute bottom-2 left-2">
                              <RarityBadge rarity={rarityStats.rarityMap[flavor.id].rarity} size="sm" />
                            </div>
                          )}

                          {isCaught && (
                            <button
                              onClick={(e) => { e.stopPropagation(); uncatchMutation.mutate(flavor.id); }}
                              disabled={uncatchMutation.isPending}
                              className="absolute top-2 left-2 w-7 h-7 bg-background/80 hover:bg-destructive/10 border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                              title="Remove from collection"
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </button>
                          )}
                        </div>

                        <div className="p-3 sm:p-4 bg-card">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="min-w-0">
                              <p className="font-black text-base sm:text-lg leading-tight">{flavor.japaneseName}</p>
                              <p className="text-muted-foreground font-medium text-[10px] sm:text-xs">{flavor.name}</p>
                              {(flavor.availableFrom || flavor.availableUntil) && (
                                <AvailabilityBadge
                                  availableFrom={flavor.availableFrom}
                                  availableUntil={flavor.availableUntil}
                                  size="sm"
                                  className="mt-1"
                                />
                              )}
                            </div>
                            <Badge
                              className={cn("text-[8px] sm:text-[9px] font-black border px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0", getCategoryColor(flavor.category))}
                            >
                              {flavor.category}
                            </Badge>
                          </div>

                          {isAdmin && (
                            isManaging ? (
                              <BarcodeManager
                                flavorId={flavor.id}
                                primaryBarcode={flavor.barcode}
                                onClose={() => setManagingBarcodeForId(null)}
                                onPrimaryUpdated={() => queryClient.invalidateQueries({ queryKey: ["flavors"] })}
                              />
                            ) : (
                              <button
                                onClick={() => setManagingBarcodeForId(flavor.id)}
                                className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground/60 hover:text-primary transition-colors"
                              >
                                <Pencil className="w-2 h-2" />
                                {flavor.barcode ? "Edit barcode" : "Add barcode"}
                              </button>
                            )
                          )}

                          {!isCaught && (
                            <button
                              onClick={() => navigate(`/catch?barcode=${flavor.barcode ?? ""}`)}
                              className="mt-2 w-full text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors text-center"
                            >
                              Scan to catch →
                            </button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-24 text-center text-muted-foreground">
          <Search className="w-16 h-16 mx-auto mb-6 opacity-30" />
          <p className="font-bold text-xl mb-2">No flavors found</p>
          <p>Try a different search or filter.</p>
        </div>
      )}

      {/* Flavor Detail Dialog */}
      <Dialog open={!!selectedFlavor} onOpenChange={(open) => !open && setSelectedFlavor(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2 p-0 gap-0 overflow-hidden">
          {selectedFlavor && (() => {
            const isCaught = caughtFlavorIds.has(selectedFlavor.id);
            const hexColor = getFullColor(selectedFlavor.color);
            const tintColor = getTintedColor(selectedFlavor.color, "12");
            return (
              <>
                <div
                  className="relative flex items-center justify-center py-10 border-b-2"
                  style={{ backgroundColor: tintColor, borderColor: hexColor }}
                >
                  {isCaught && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full shadow">
                      <BadgeCheck className="w-3.5 h-3.5" /> In your collection
                    </div>
                  )}
                  {selectedFlavor.imageUrl ? (
                    <img src={selectedFlavor.imageUrl} alt={selectedFlavor.name} className="h-36 w-auto object-contain drop-shadow-xl" />
                  ) : (
                    <div className="w-16 h-28 rounded-t-[2rem] rounded-b-xl relative shadow-xl" style={{ backgroundColor: hexColor }}>
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white/60 border border-black/10 shadow-sm" />
                      <div className="absolute inset-x-0 top-1/3 bottom-2 bg-white/20 rounded-lg mx-2 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <span className="text-[9px] font-black opacity-60 uppercase tracking-widest mix-blend-overlay rotate-[-90deg]">RAMUNE</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-card space-y-4">
                  <DialogHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <DialogTitle className="font-black text-3xl leading-tight">{selectedFlavor.japaneseName}</DialogTitle>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm mt-0.5">{selectedFlavor.name}</p>
                        {rarityStats?.rarityMap[selectedFlavor.id] && (
                          <div className="mt-2">
                            <RarityBadge
                              rarity={rarityStats.rarityMap[selectedFlavor.id].rarity}
                              showXp
                              size="md"
                            />
                          </div>
                        )}
                      </div>
                      <Badge className={cn("text-[9px] font-black border px-2 py-1 rounded-full uppercase tracking-wider shrink-0 mt-1", getCategoryColor(selectedFlavor.category))}>
                        {selectedFlavor.category}
                      </Badge>
                    </div>
                  </DialogHeader>

                  {selectedFlavor.description && (
                    <p className="text-sm text-foreground font-medium leading-relaxed bg-muted/40 rounded-2xl p-3">
                      {selectedFlavor.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted/40 rounded-xl p-2.5">
                      <p className="text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Brand</p>
                      <p className="font-black">{selectedFlavor.brand}</p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-2.5">
                      <p className="text-muted-foreground font-bold uppercase tracking-wider mb-0.5">Barcode</p>
                      <p className="font-mono font-bold">{selectedFlavor.barcode ?? "—"}</p>
                    </div>
                  </div>

                  {(selectedFlavor.availableFrom || selectedFlavor.availableUntil) && (
                    <div className="bg-muted/40 rounded-xl p-2.5 text-xs">
                      <p className="text-muted-foreground font-bold uppercase tracking-wider mb-1.5">Availability</p>
                      <AvailabilityBadge
                        availableFrom={selectedFlavor.availableFrom}
                        availableUntil={selectedFlavor.availableUntil}
                        size="md"
                      />
                    </div>
                  )}

                  {isAdmin && (
                    <AvailabilityEditor
                      flavorId={selectedFlavor.id}
                      availableFrom={selectedFlavor.availableFrom}
                      availableUntil={selectedFlavor.availableUntil}
                      onSaved={(from, until) =>
                        setSelectedFlavor(f => f ? { ...f, availableFrom: from, availableUntil: until } : null)
                      }
                    />
                  )}

                  <div className="pt-1 space-y-2">
                    {isCaught ? (
                      <Button
                        variant="outline"
                        className="w-full rounded-2xl font-bold border-2 h-12 border-destructive/30 text-destructive hover:bg-destructive/10"
                        onClick={() => { uncatchMutation.mutate(selectedFlavor.id); setSelectedFlavor(null); }}
                        disabled={uncatchMutation.isPending}
                      >
                        {uncatchMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove from Collection"}
                      </Button>
                    ) : (
                      <Button
                        className="w-full rounded-2xl font-black text-lg h-14 shadow-lg hover:scale-[1.02] transition-transform"
                        style={{ backgroundColor: hexColor, color: "#fff" }}
                        onClick={() => { catchMutation.mutate(selectedFlavor.id); setSelectedFlavor(null); }}
                        disabled={catchMutation.isPending || !user}
                      >
                        {catchMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Catch it!"}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
