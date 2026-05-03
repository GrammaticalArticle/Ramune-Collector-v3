import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { mapFlavor } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, Loader2, Tag, Trash2, CheckCircle2, Navigation, Search, BadgeCheck, ShieldOff, X, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getFullColor } from "@/lib/color-utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildPieIcon(count: number, colors: string[], isCluster: boolean, verified: boolean) {
  const r = isCluster ? 24 : 20;
  const cx = 28, cy = 28;
  const border = verified ? "#10b981" : isCluster ? "#e2e8f0" : "white";
  const borderWidth = verified ? 3 : isCluster ? 3 : 2.5;

  let slicesSvg = "";
  const n = colors.length;
  if (n === 0) {
    slicesSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#22d3ee"/>`;
  } else if (n === 1) {
    slicesSvg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${colors[0]}"/>`;
  } else {
    for (let i = 0; i < n; i++) {
      const start = (i / n) * 2 * Math.PI - Math.PI / 2;
      const end = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const large = end - start > Math.PI ? 1 : 0;
      slicesSvg += `<path d="M${cx},${cy} L${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large},1 ${x2.toFixed(2)},${y2.toFixed(2)} Z" fill="${colors[i]}"/>`;
    }
  }

  const fontSize = count > 99 ? 9 : count > 9 ? 11 : 13;
  const countSvg = `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-family="'Nunito',sans-serif" font-weight="900" font-size="${fontSize}" fill="white" style="text-shadow:0 1px 3px rgba(0,0,0,0.7)">${count}</text>`;

  const outerRing = verified
    ? `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-opacity="0.4" stroke-dasharray="4 3"/>`
    : isCluster
    ? `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>`
    : "";

  const svgSize = cx * 2 + 14;
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 10px rgba(0,0,0,0.32))">
      <svg width="${svgSize}" height="${svgSize}" viewBox="-7 -7 ${svgSize} ${svgSize}" overflow="visible">
        ${outerRing}
        ${slicesSvg}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${border}" stroke-width="${borderWidth}"/>
        <circle cx="${cx}" cy="${cy}" r="${isCluster ? 10 : 8}" fill="rgba(0,0,0,0.22)"/>
        ${countSvg}
      </svg>
      <div style="width:0;height:0;border-left:${isCluster ? 10 : 8}px solid transparent;border-right:${isCluster ? 10 : 8}px solid transparent;border-top:${isCluster ? 13 : 11}px solid ${border};margin-top:-3px"></div>
    </div>`;

  const iconW = svgSize + 6;
  return L.divIcon({
    html,
    className: "",
    iconSize: [iconW, iconW + (isCluster ? 13 : 11)],
    iconAnchor: [iconW / 2, iconW + (isCluster ? 13 : 11)],
    popupAnchor: [0, -(iconW + (isCluster ? 13 : 11))],
  });
}

function createLocationIcon(confirmedCount: number, colors: string[], verified: boolean) {
  return buildPieIcon(confirmedCount, colors, false, verified);
}

function createUserIcon() {
  const html = `<div style="width:16px;height:16px;border-radius:50%;background:#22d3ee;border:3px solid white;box-shadow:0 0 0 3px rgba(34,211,238,0.35),0 2px 8px rgba(0,0,0,0.25)"></div>`;
  return L.divIcon({ html, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
}

function createPinDropIcon() {
  const html = `<div style="width:28px;height:28px;border-radius:50% 50% 50% 4px;background:#f59e0b;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);transform:rotate(-45deg)"></div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 28] });
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyToCoords({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, Math.max(map.getZoom(), 10), { duration: 1.2 });
  }, [coords, map]);
  return null;
}

type NominatimResult = { place_id: number; display_name: string; lat: string; lon: string };

interface MappedLocation {
  id: number;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  verified: boolean;
  confirmed_count: number;
  flavor_colors: string[];
  added_by_uid: string | null;
  addedByUsername: string | null;
  flavors: Array<{
    flavor: { id: number; japaneseName: string; name: string; color: string; imageUrl: string | null };
    price: number | null;
    currency: string | null;
  }>;
}

function mapLocationRow(row: Record<string, unknown>): MappedLocation {
  const locationFlavors = (row.location_flavors as Record<string, unknown>[]) ?? [];
  const mappedFlavors = locationFlavors.map(lf => {
    const f = lf.flavors as Record<string, unknown>;
    return {
      flavor: {
        id: f.id as number,
        japaneseName: f.japanese_name as string,
        name: f.name as string,
        color: f.color as string,
        imageUrl: f.image_url as string | null,
      },
      price: lf.price as number | null,
      currency: lf.currency as string | null,
    };
  });
  return {
    id: row.id as number,
    name: row.name as string,
    city: row.city as string,
    country: row.country as string,
    lat: row.lat as number,
    lng: row.lng as number,
    verified: (row.verified as boolean) ?? false,
    confirmed_count: mappedFlavors.length,
    flavor_colors: mappedFlavors.map(mf => getFullColor(mf.flavor.color)),
    added_by_uid: (row.added_by as string | null) ?? null,
    addedByUsername: null,
    flavors: mappedFlavors,
  };
}

export function MapView() {
  const { user, username, isAdmin } = useAuth();
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocCountry, setNewLocCountry] = useState("");
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  const [addFlavorId, setAddFlavorId] = useState<string>("");
  const [addPrice, setAddPrice] = useState("");
  const [addCurrency, setAddCurrency] = useState("SEK");
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [spotSearch, setSpotSearch] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState<NominatimResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [flavorFilter, setFlavorFilter] = useState<number | null>(null);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deletingLocation, setDeletingLocation] = useState(false);
  const [verifyingLocation, setVerifyingLocation] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*, location_flavors(*, flavors(*))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map(row => mapLocationRow(row as Record<string, unknown>));
      const uids = [...new Set(mapped.map(l => l.added_by_uid).filter(Boolean))] as string[];
      if (uids.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", uids);
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.username]));
        return mapped.map(l => ({ ...l, addedByUsername: l.added_by_uid ? (profileMap[l.added_by_uid] ?? null) : null }));
      }
      return mapped;
    },
  });

  const { data: selectedLocation, isLoading: locationDetailLoading } = useQuery({
    queryKey: ["location", selectedLocId],
    enabled: !!selectedLocId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locations")
        .select("*, location_flavors(*, flavors(*))")
        .eq("id", selectedLocId!)
        .single();
      if (error) throw error;
      const mapped = mapLocationRow(data as Record<string, unknown>);
      if (mapped.added_by_uid) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", mapped.added_by_uid)
          .maybeSingle();
        return { ...mapped, addedByUsername: profile?.username ?? null };
      }
      return mapped;
    },
  });

  const { data: flavors } = useQuery({
    queryKey: ["flavors"],
    queryFn: async () => {
      const { data } = await supabase.from("flavors").select("*").order("sort_order");
      return (data ?? []).map(row => mapFlavor(row as Record<string, unknown>));
    },
  });

  const spotResults = useMemo(() => {
    if (!spotSearch.trim() || !locations) return [];
    const lower = spotSearch.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(lower) ||
      l.city.toLowerCase().includes(lower) ||
      l.country.toLowerCase().includes(lower)
    ).slice(0, 6);
  }, [spotSearch, locations]);

  useEffect(() => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    if (!spotSearch.trim()) { setGeocodeResults([]); return; }
    geocodeTimer.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(spotSearch)}`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        setGeocodeResults(data);
      } catch { setGeocodeResults([]); }
      finally { setGeocoding(false); }
    }, 500);
  }, [spotSearch]);

  const nearestSpot = useMemo(() => {
    if (!userCoords || !locations || locations.length === 0) return null;
    let best = locations[0];
    let bestDist = haversineKm(userCoords[0], userCoords[1], best.lat, best.lng);
    for (const loc of locations.slice(1)) {
      const d = haversineKm(userCoords[0], userCoords[1], loc.lat, loc.lng);
      if (d < bestDist) { bestDist = d; best = loc; }
    }
    return { location: best, distanceKm: bestDist };
  }, [userCoords, locations]);

  const visibleLocations = useMemo(() => {
    if (!locations) return [];
    if (!flavorFilter) return locations;
    return locations.filter(loc => loc.flavors.some(lf => lf.flavor.id === flavorFilter));
  }, [locations, flavorFilter]);

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    const groups: Record<string, typeof flavors> = {};
    flavors.forEach(f => { const b = f.brand || "Other"; if (!groups[b]) groups[b] = []; groups[b].push(f); });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [flavors]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { toast({ title: "Geolocation not supported", variant: "destructive" }); return; }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setFlyToCoords(coords);
        setLocatingUser(false);
      },
      () => { toast({ title: "Could not get your location", variant: "destructive" }); setLocatingUser(false); },
      { timeout: 10000 }
    );
  }, [toast]);

  const createLocationMutation = useMutation({
    mutationFn: async (data: { name: string; city: string; country: string; lat: number; lng: number }) => {
      const { error } = await supabase
        .from("locations")
        .insert({ ...data, added_by: user?.id ?? null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Location added!", description: "Snack spot added successfully." });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations_count"] });
      setSelectedCoord(null); setIsAddingMode(false);
      setNewLocName(""); setNewLocCity(""); setNewLocCountry("");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addFlavorMutation = useMutation({
    mutationFn: async ({ locationId, flavorId, price, currency }: { locationId: number; flavorId: number; price?: number; currency?: string }) => {
      const { error } = await supabase
        .from("location_flavors")
        .insert({ location_id: locationId, flavor_id: flavorId, price: price ?? null, currency: currency ?? null, added_by: user?.id ?? null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Flavor added to location!" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", selectedLocId] });
      setAddFlavorId(""); setAddPrice("");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const removeFlavorMutation = useMutation({
    mutationFn: async ({ locationId, flavorId }: { locationId: number; flavorId: number }) => {
      const { error } = await supabase
        .from("location_flavors")
        .delete()
        .eq("location_id", locationId)
        .eq("flavor_id", flavorId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast({ title: "Flavor removed from location." });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", selectedLocId] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleMapClick = (lat: number, lng: number) => { if (isAddingMode) setSelectedCoord({ lat, lng }); };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord || !newLocName || !newLocCity || !newLocCountry) return;
    createLocationMutation.mutate({ name: newLocName, city: newLocCity, country: newLocCountry, lat: selectedCoord.lat, lng: selectedCoord.lng });
  };

  const handleAddFlavor = (locId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!addFlavorId) return;
    addFlavorMutation.mutate({
      locationId: locId,
      flavorId: parseInt(addFlavorId),
      price: addPrice ? parseFloat(addPrice) : undefined,
      currency: addPrice ? addCurrency : undefined,
    });
  };

  const handleRemoveFlavor = (locId: number, flavorId: number) => {
    if (confirm("Remove this flavor from the location?")) {
      removeFlavorMutation.mutate({ locationId: locId, flavorId });
    }
  };

  const handleDeleteLocation = async (locId: number) => {
    if (!confirm("Delete this spot permanently? This cannot be undone.")) return;
    setDeletingLocation(true);
    const { error } = await supabase.from("locations").delete().eq("id", locId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Spot deleted." });
      setSelectedLocId(null);
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["locations_count"] });
    }
    setDeletingLocation(false);
  };

  const handleVerifyLocation = async (locId: number, currentlyVerified: boolean) => {
    setVerifyingLocation(true);
    const { error } = await supabase
      .from("locations")
      .update({ verified: !currentlyVerified, verified_by: user?.id ?? null })
      .eq("id", locId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentlyVerified ? "Verification removed." : "Spot verified!" });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      queryClient.invalidateQueries({ queryKey: ["location", locId] });
    }
    setVerifyingLocation(false);
  };

  const locDataRef = useRef<Map<string, { colors: string[] }>>(new Map());
  useEffect(() => {
    locDataRef.current.clear();
    visibleLocations.forEach(loc => {
      const key = `${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}`;
      locDataRef.current.set(key, { colors: loc.flavor_colors });
    });
  }, [visibleLocations]);

  const clusterIconCreate = useCallback((cluster: unknown) => {
    const c = cluster as { getAllChildMarkers(): { getLatLng(): { lat: number; lng: number } }[] };
    const children = c.getAllChildMarkers();
    const seen = new Set<string>();
    const allColors: string[] = [];
    children.forEach(marker => {
      const pos = marker.getLatLng();
      const key = `${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}`;
      const data = locDataRef.current.get(key);
      if (data) data.colors.forEach(col => { if (!seen.has(col)) { seen.add(col); allColors.push(col); } });
    });
    return buildPieIcon(children.length, allColors, true, false);
  }, []);

  const hasSearchContent = spotSearch.trim().length > 0;
  const showDropdown = showSearchResults && hasSearchContent && (spotResults.length > 0 || geocodeResults.length > 0 || geocoding);
  const activeFlavorObj = flavorFilter ? flavors?.find(f => f.id === flavorFilter) : null;

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] space-y-2 sm:space-y-3 animate-in fade-in duration-500">

      <div className="flex items-center justify-between shrink-0 gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mb-0.5">Snack Map</h1>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm">Find places that sell ramune worldwide.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button variant="outline" onClick={locateMe} disabled={locatingUser} className="rounded-xl font-bold h-9 sm:h-10 px-3 sm:px-4 border-2 text-sm">
            {locatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            <span className="hidden sm:inline ml-2">Locate Me</span>
          </Button>
          <Button
            onClick={() => { setIsAddingMode(!isAddingMode); setSelectedCoord(null); setSelectedLocId(null); }}
            variant={isAddingMode ? "outline" : "default"}
            className="rounded-xl font-bold h-9 sm:h-10 px-3 sm:px-4 text-sm"
          >
            {isAddingMode ? "Cancel" : <><Plus className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Add Spot</span></>}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
          <Input
            value={spotSearch}
            onChange={(e) => setSpotSearch(e.target.value)}
            onFocus={() => { if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current); setShowSearchResults(true); }}
            onBlur={() => { searchBlurTimer.current = setTimeout(() => setShowSearchResults(false), 200); }}
            placeholder="Search spots or any place on the map..."
            className="pl-9 pr-8 rounded-xl border-2 shadow-none h-9 sm:h-10 font-medium text-sm"
          />
          {spotSearch && (
            <button onClick={() => { setSpotSearch(""); setGeocodeResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 rounded-2xl shadow-2xl z-[2000] overflow-hidden">
              {spotResults.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Snack Spots</div>
                  {spotResults.map(loc => (
                    <button key={loc.id} className="w-full px-4 py-2.5 text-left hover:bg-muted/60 font-bold text-sm transition-colors flex justify-between items-center gap-2"
                      onMouseDown={() => { setSelectedLocId(loc.id); setFlyToCoords([loc.lat, loc.lng]); setSpotSearch(""); setShowSearchResults(false); setIsAddingMode(false); }}>
                      <span className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary shrink-0" />{loc.name}</span>
                      <span className="text-muted-foreground font-medium text-xs shrink-0">{loc.city}, {loc.country}</span>
                    </button>
                  ))}
                </>
              )}
              {geocoding && <div className="px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching map...</div>}
              {!geocoding && geocodeResults.length > 0 && (
                <>
                  <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground border-t">Places on Map</div>
                  {geocodeResults.map(r => {
                    const parts = r.display_name.split(", ");
                    const shortName = parts.slice(0, 2).join(", ");
                    return (
                      <button key={r.place_id} className="w-full px-4 py-2.5 text-left hover:bg-muted/60 font-medium text-sm transition-colors flex items-center gap-2"
                        onMouseDown={() => { setFlyToCoords([parseFloat(r.lat), parseFloat(r.lon)]); setSpotSearch(shortName); setShowSearchResults(false); }}>
                        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{r.display_name}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        <Select value={flavorFilter?.toString() ?? "all"} onValueChange={(v) => setFlavorFilter(v === "all" ? null : parseInt(v))}>
          <SelectTrigger className="rounded-xl border-2 shadow-none h-9 sm:h-10 font-bold text-sm w-auto min-w-[120px] sm:min-w-[160px] gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            <SelectValue>
              {activeFlavorObj
                ? <span className="flex items-center gap-1.5 truncate max-w-[90px] sm:max-w-[120px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getFullColor(activeFlavorObj.color) }} />
                    {activeFlavorObj.japaneseName}
                  </span>
                : "All flavors"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64 z-[2000]">
            <SelectItem value="all" className="font-bold">All flavors</SelectItem>
            {groupedFlavors.map(([brand, brandFlavors]) => (
              <SelectGroup key={brand}>
                <SelectLabel className="font-black text-primary text-xs">{brand}</SelectLabel>
                {brandFlavors.map(f => (
                  <SelectItem key={f.id} value={f.id.toString()} className="font-bold text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getFullColor(f.color) }} />
                      {f.japaneseName}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFlavorObj && (
        <div className="flex items-center gap-2 shrink-0 -mt-1">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full px-3 py-1 text-xs font-bold">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getFullColor(activeFlavorObj.color) }} />
            Showing: {activeFlavorObj.japaneseName} ({visibleLocations.length} spot{visibleLocations.length !== 1 ? "s" : ""})
            <button onClick={() => setFlavorFilter(null)} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
          </div>
        </div>
      )}

      {nearestSpot && (
        <div
          className="shrink-0 flex items-center justify-between gap-3 bg-primary/10 border-2 border-primary/30 text-primary rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer hover:bg-primary/15 transition-colors"
          onClick={() => { setSelectedLocId(nearestSpot.location.id); setFlyToCoords([nearestSpot.location.lat, nearestSpot.location.lng]); }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-black text-xs sm:text-sm truncate">Nearest: {nearestSpot.location.name}</span>
            <span className="font-medium text-xs sm:text-sm opacity-75 shrink-0">
              {nearestSpot.distanceKm < 1 ? `${Math.round(nearestSpot.distanceKm * 1000)} m` : `${nearestSpot.distanceKm.toFixed(1)} km`} away
            </span>
          </div>
          <span className="text-xs font-bold opacity-60 shrink-0 hidden sm:block">{nearestSpot.location.city}, {nearestSpot.location.country}</span>
        </div>
      )}

      {isAddingMode && !selectedCoord && (
        <div className="bg-amber-500 text-white p-2.5 sm:p-3 rounded-xl font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 shrink-0 shadow-md text-sm">
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5 animate-bounce" />
          <span>Click anywhere on the map to drop a pin</span>
        </div>
      )}

      <Card className="rounded-3xl border-2 overflow-hidden flex-1 relative z-0 shadow-sm min-h-0">
        {locationsLoading && (
          <div className="absolute inset-0 z-[1000] bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}
        <MapContainer center={[35.6895, 139.6917]} zoom={3} className="w-full h-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          <FlyToCoords coords={flyToCoords} />
          <MarkerClusterGroup iconCreateFunction={clusterIconCreate} maxClusterRadius={60} showCoverageOnHover={false} spiderfyOnMaxZoom={true} chunkedLoading>
            {visibleLocations.map((loc) => {
              const icon = createLocationIcon(loc.confirmed_count, loc.flavor_colors, loc.verified);
              return (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={icon}
                  eventHandlers={{ click: () => { setSelectedLocId(loc.id); setIsAddingMode(false); } }}
                />
              );
            })}
          </MarkerClusterGroup>
          {userCoords && <Marker position={userCoords} icon={createUserIcon()} />}
          {selectedCoord && <Marker position={[selectedCoord.lat, selectedCoord.lng]} icon={createPinDropIcon()} />}
        </MapContainer>
      </Card>

      {/* Location Details Dialog */}
      <Dialog open={!!selectedLocId} onOpenChange={(open) => !open && setSelectedLocId(null)}>
        <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
          {locationDetailLoading || !selectedLocation ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="p-5 sm:p-6 pb-0">
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <DialogTitle className="font-black text-2xl sm:text-3xl">{selectedLocation.name}</DialogTitle>
                        {selectedLocation.verified && (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded-full px-2 py-0.5 text-xs font-bold shrink-0">
                            <BadgeCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </div>
                      <DialogDescription className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {selectedLocation.city}, {selectedLocation.country}
                      </DialogDescription>
                      {selectedLocation.addedByUsername && (
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          Added by <span className="font-bold">@{selectedLocation.addedByUsername}</span>
                        </p>
                      )}
                      {userCoords && (
                        <div className="text-sm font-medium text-primary mt-1">
                          {(() => {
                            const d = haversineKm(userCoords[0], userCoords[1], selectedLocation.lat, selectedLocation.lng);
                            return d < 1 ? `${Math.round(d * 1000)} m from you` : `${d.toFixed(1)} km from you`;
                          })()}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button size="sm"
                          variant={selectedLocation.verified ? "outline" : "default"}
                          className={cn("rounded-xl font-bold text-xs h-8 px-2.5 gap-1", selectedLocation.verified ? "border-emerald-400 text-emerald-600 hover:bg-emerald-50" : "bg-emerald-500 hover:bg-emerald-600 text-white border-0")}
                          onClick={() => handleVerifyLocation(selectedLocation.id, selectedLocation.verified)}
                          disabled={verifyingLocation}
                        >
                          {verifyingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : selectedLocation.verified ? <><ShieldOff className="w-3 h-3" /> Unverify</> : <><BadgeCheck className="w-3 h-3" /> Verify</>}
                        </Button>
                        <Button size="sm" variant="outline"
                          className="rounded-xl font-bold text-xs h-8 px-2.5 gap-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteLocation(selectedLocation.id)}
                          disabled={deletingLocation}
                        >
                          {deletingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Trash2 className="w-3 h-3" /> Delete</>}
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogHeader>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="font-black text-lg sm:text-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmed Flavors
                </h3>

                {selectedLocation.flavors.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {selectedLocation.flavors.map((lf, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-2xl border-2 bg-card transition-all"
                        style={{ borderLeftColor: getFullColor(lf.flavor.color), borderLeftWidth: "4px" }}>
                        <div className="flex items-center gap-3 min-w-0">
                          {lf.flavor.imageUrl ? (
                            <img src={lf.flavor.imageUrl} alt={lf.flavor.name} className="w-8 h-10 object-contain shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full shrink-0 shadow-sm border-2 border-background" style={{ backgroundColor: getFullColor(lf.flavor.color) }} />
                          )}
                          <div className="min-w-0">
                            <p className="font-black text-sm sm:text-base leading-tight">{lf.flavor.japaneseName}</p>
                            <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider truncate">{lf.flavor.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-3">
                          <div className="text-right">
                            {lf.price ? (
                              <p className="font-black text-primary text-sm">{lf.price} {lf.currency}</p>
                            ) : (
                              <p className="font-bold text-muted-foreground text-xs">Price unknown</p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon"
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8"
                            onClick={() => handleRemoveFlavor(selectedLocation.id, lf.flavor.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/30 border-2 border-dashed rounded-2xl p-6 text-center mb-6">
                    <p className="font-bold text-muted-foreground">No flavors confirmed here yet.</p>
                  </div>
                )}

                {username ? (
                  <div className="bg-muted/30 p-4 sm:p-5 rounded-2xl border-2">
                    <h4 className="font-black text-base sm:text-lg mb-3">Add a confirmed flavor</h4>
                    <form onSubmit={(e) => handleAddFlavor(selectedLocation.id, e)} className="space-y-3 sm:space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Flavor</label>
                        <Select value={addFlavorId} onValueChange={setAddFlavorId}>
                          <SelectTrigger className="w-full rounded-xl border-2 shadow-none font-medium h-11 sm:h-12">
                            <SelectValue placeholder="Select a flavor..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-56 overflow-y-auto">
                            {groupedFlavors.map(([brand, brandFlavors]) => (
                              <SelectGroup key={brand}>
                                <SelectLabel className="font-black text-primary text-xs">{brand}</SelectLabel>
                                {brandFlavors.map(f => (
                                  <SelectItem key={f.id} value={f.id.toString()} className="font-bold text-sm">
                                    <span className="flex items-center gap-2">
                                      <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: getFullColor(f.color) }} />
                                      <span className="truncate max-w-[140px]">{f.japaneseName}</span>
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <div className="col-span-2 space-y-2">
                          <label className="text-sm font-bold">Price (optional)</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input type="number" step="0.01" min="0" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} placeholder="0.00" className="pl-9 rounded-xl border-2 shadow-none font-mono" />
                          </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                          <label className="text-sm font-bold">Currency</label>
                          <Input value={addCurrency} onChange={(e) => setAddCurrency(e.target.value.toUpperCase())} placeholder="SEK" className="rounded-xl border-2 shadow-none font-mono uppercase" maxLength={3} />
                        </div>
                      </div>
                      <Button type="submit" className="w-full rounded-xl font-bold h-11 sm:h-12" disabled={!addFlavorId || addFlavorMutation.isPending}>
                        {addFlavorMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Flavor"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 text-center font-medium text-sm">
                    Log in to add flavors to locations.
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog open={!!selectedCoord} onOpenChange={(open) => !open && setSelectedCoord(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="font-black text-xl sm:text-2xl">Add Snack Spot</DialogTitle>
            <DialogDescription className="font-medium">Register a new store that sells ramune.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Store Name</label>
              <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="e.g. Mitsuwa Marketplace" className="rounded-xl border-2 shadow-none h-11 sm:h-12 font-medium" required />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">City</label>
                <Input value={newLocCity} onChange={e => setNewLocCity(e.target.value)} placeholder="e.g. Edgewater" className="rounded-xl border-2 shadow-none h-11 sm:h-12 font-medium" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Country</label>
                <Input value={newLocCountry} onChange={e => setNewLocCountry(e.target.value)} placeholder="e.g. USA" className="rounded-xl border-2 shadow-none h-11 sm:h-12 font-medium" required />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-xl font-bold h-11 sm:h-12 mt-4 text-base sm:text-lg" disabled={createLocationMutation.isPending}>
              {createLocationMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Location"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
