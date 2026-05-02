import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  useListLocations, useCreateLocation, useAddLocationFlavor,
  useRemoveLocationFlavor, getListLocationsQueryKey, useListFlavors, getListFlavorsQueryKey,
  useGetLocation, getGetLocationQueryKey
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, Loader2, Tag, Trash2, CheckCircle2, Navigation, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getFullColor } from "@/lib/color-utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createLocationIcon(confirmedCount: number, colors: string[]) {
  const primary = colors.length > 0 ? colors[0] : "#22d3ee";
  const extra = colors.length > 1 ? colors.slice(1, 4) : [];

  const swatchHtml = extra.map((c, i) =>
    `<div style="position:absolute;width:8px;height:8px;border-radius:50%;background:${c};bottom:${2 + i * 6}px;right:-2px;border:1px solid rgba(255,255,255,0.8)"></div>`
  ).join("");

  const html = `
    <div style="
      position:relative;
      width:36px;
      height:36px;
      border-radius:50% 50% 50% 4px;
      background:${primary};
      border:2.5px solid rgba(255,255,255,0.9);
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      transform:rotate(-45deg);
    ">
      <div style="
        transform:rotate(45deg);
        font-family:'Nunito',sans-serif;
        font-weight:900;
        font-size:${confirmedCount > 9 ? '10px' : '13px'};
        color:white;
        text-shadow:0 1px 2px rgba(0,0,0,0.3);
        line-height:1;
      ">${confirmedCount}</div>
      ${swatchHtml}
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
}

function createUserIcon() {
  const html = `
    <div style="
      width:16px;height:16px;
      border-radius:50%;
      background:#22d3ee;
      border:3px solid white;
      box-shadow:0 0 0 3px rgba(34,211,238,0.35),0 2px 8px rgba(0,0,0,0.25);
    "></div>`;
  return L.divIcon({ html, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
}

function createPinDropIcon() {
  const html = `
    <div style="
      width:28px;height:28px;
      border-radius:50% 50% 50% 4px;
      background:#f59e0b;
      border:2.5px solid white;
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      transform:rotate(-45deg);
    "></div>`;
  return L.divIcon({ html, className: "", iconSize: [28, 28], iconAnchor: [14, 28] });
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyToUser({ coords }: { coords: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords) map.flyTo(coords, Math.max(map.getZoom(), 10), { duration: 1.2 });
  }, [coords, map]);
  return null;
}

export function MapView() {
  const { username } = useAuth();
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
  const [showSpotResults, setShowSpotResults] = useState(false);
  const searchBlurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useListLocations({
    query: { queryKey: getListLocationsQueryKey() },
  });

  const { data: flavors } = useListFlavors({
    query: { queryKey: getListFlavorsQueryKey() },
  });

  // Fetch full location details (with flavors) when a location is selected
  const { data: selectedLocation, isLoading: locationDetailLoading } = useGetLocation(
    selectedLocId ?? 0,
    {
      query: {
        enabled: !!selectedLocId,
        queryKey: getGetLocationQueryKey(selectedLocId ?? 0),
      }
    }
  );

  // Nearest spot computed from user coords
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

  // Search results
  const spotResults = useMemo(() => {
    if (!spotSearch.trim() || !locations) return [];
    const lower = spotSearch.toLowerCase();
    return locations.filter(l =>
      l.name.toLowerCase().includes(lower) ||
      l.city.toLowerCase().includes(lower) ||
      l.country.toLowerCase().includes(lower)
    ).slice(0, 8);
  }, [spotSearch, locations]);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(coords);
        setFlyToCoords(coords);
        setLocatingUser(false);
      },
      () => {
        toast({ title: "Could not get your location", variant: "destructive" });
        setLocatingUser(false);
      },
      { timeout: 10000 }
    );
  }, [toast]);

  const createLocation = useCreateLocation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Location added!", description: "Snack spot added successfully." });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        setSelectedCoord(null);
        setIsAddingMode(false);
        setNewLocName(""); setNewLocCity(""); setNewLocCountry("");
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as any).error || "Failed to add location", variant: "destructive" });
      },
    },
  });

  const addLocationFlavor = useAddLocationFlavor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Flavor added to location!" });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLocationQueryKey(selectedLocId ?? 0) });
        setAddFlavorId(""); setAddPrice("");
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as any).error || "Failed to add flavor", variant: "destructive" });
      },
    },
  });

  const removeLocationFlavor = useRemoveLocationFlavor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Flavor removed from location." });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetLocationQueryKey(selectedLocId ?? 0) });
      },
      onError: (err) => {
        toast({ title: "Error", description: (err as any).error || "Failed to remove flavor", variant: "destructive" });
      },
    },
  });

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddingMode) setSelectedCoord({ lat, lng });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord || !newLocName || !newLocCity || !newLocCountry) return;
    createLocation.mutate({ data: { name: newLocName, city: newLocCity, country: newLocCountry, lat: selectedCoord.lat, lng: selectedCoord.lng, addedBy: username || undefined } });
  };

  const handleAddFlavor = (locId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!addFlavorId) return;
    addLocationFlavor.mutate({
      id: locId,
      data: {
        flavorId: parseInt(addFlavorId),
        price: addPrice ? parseFloat(addPrice) : undefined,
        currency: addPrice ? addCurrency : undefined,
        addedBy: username || undefined
      }
    });
  };

  const handleRemoveFlavor = (locId: number, flavorId: number) => {
    if (confirm("Remove this flavor from the location?")) {
      removeLocationFlavor.mutate({ id: locId, data: { flavorId } });
    }
  };

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    const groups: Record<string, typeof flavors> = {};
    flavors.forEach(f => { const b = f.brand || "Other"; if (!groups[b]) groups[b] = []; groups[b].push(f); });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [flavors]);

  const handleSpotSearchFocus = () => {
    if (searchBlurTimer.current) clearTimeout(searchBlurTimer.current);
    setShowSpotResults(true);
  };

  const handleSpotSearchBlur = () => {
    searchBlurTimer.current = setTimeout(() => setShowSpotResults(false), 200);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] space-y-2 sm:space-y-3 animate-in fade-in duration-500">

      {/* Header row */}
      <div className="flex items-center justify-between shrink-0 gap-2 sm:gap-3">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mb-0.5">Snack Map</h1>
          <p className="text-muted-foreground font-medium text-xs sm:text-sm">Find places that sell ramune worldwide.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={locateMe}
            disabled={locatingUser}
            className="rounded-xl font-bold h-9 sm:h-10 px-3 sm:px-4 border-2 text-sm"
          >
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

      {/* Search bar */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          value={spotSearch}
          onChange={(e) => setSpotSearch(e.target.value)}
          onFocus={handleSpotSearchFocus}
          onBlur={handleSpotSearchBlur}
          placeholder="Search for a spot by name, city, or country..."
          className="pl-9 rounded-xl border-2 shadow-none h-9 sm:h-10 font-medium text-sm"
        />
        {showSpotResults && spotResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border-2 rounded-2xl shadow-xl z-[1000] max-h-48 overflow-y-auto">
            {spotResults.map(loc => (
              <button
                key={loc.id}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 font-bold text-sm transition-colors border-b last:border-b-0 flex justify-between items-center gap-2"
                onMouseDown={() => {
                  setSelectedLocId(loc.id);
                  setFlyToCoords([loc.lat, loc.lng]);
                  setSpotSearch("");
                  setShowSpotResults(false);
                  setIsAddingMode(false);
                }}
              >
                <span>{loc.name}</span>
                <span className="text-muted-foreground font-medium text-xs shrink-0">{loc.city}, {loc.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Nearest spot banner */}
      {nearestSpot && (
        <div
          className="shrink-0 flex items-center justify-between gap-3 bg-primary/10 border-2 border-primary/30 text-primary rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 cursor-pointer hover:bg-primary/15 transition-colors"
          onClick={() => {
            setSelectedLocId(nearestSpot.location.id);
            setFlyToCoords([nearestSpot.location.lat, nearestSpot.location.lng]);
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Navigation className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="font-black text-xs sm:text-sm truncate">Nearest: {nearestSpot.location.name}</span>
            <span className="font-medium text-xs sm:text-sm opacity-75 shrink-0">
              {nearestSpot.distanceKm < 1
                ? `${Math.round(nearestSpot.distanceKm * 1000)} m`
                : `${nearestSpot.distanceKm.toFixed(1)} km`} away
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

      {/* Map */}
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
          <FlyToUser coords={flyToCoords} />

          {locations?.map((loc) => {
            const colors = (loc as any).flavorColors as string[] | undefined;
            const icon = createLocationIcon(loc.confirmedCount ?? 0, colors ?? []);
            return (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={icon}
                eventHandlers={{ click: () => { setSelectedLocId(loc.id); setIsAddingMode(false); } }}
              />
            );
          })}

          {userCoords && (
            <Marker position={userCoords} icon={createUserIcon()} />
          )}

          {selectedCoord && (
            <Marker position={[selectedCoord.lat, selectedCoord.lng]} icon={createPinDropIcon()} />
          )}
        </MapContainer>
      </Card>

      {/* Location Details Dialog */}
      <Dialog open={!!selectedLocId} onOpenChange={(open) => !open && setSelectedLocId(null)}>
        <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
          {locationDetailLoading || !selectedLocation ? (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="p-5 sm:p-6 pb-0">
                <DialogHeader>
                  <DialogTitle className="font-black text-2xl sm:text-3xl mb-1">{selectedLocation.name}</DialogTitle>
                  <DialogDescription className="font-bold text-sm sm:text-base flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> {selectedLocation.city}, {selectedLocation.country}
                  </DialogDescription>
                  {selectedLocation.addedBy && (
                    <div className="text-sm font-medium text-muted-foreground mt-2">
                      Added by <span className="text-foreground font-bold">@{selectedLocation.addedBy}</span>
                    </div>
                  )}
                  {userCoords && (
                    <div className="text-sm font-medium text-primary mt-1">
                      {(() => {
                        const d = haversineKm(userCoords[0], userCoords[1], selectedLocation.lat, selectedLocation.lng);
                        return d < 1 ? `${Math.round(d * 1000)} m from you` : `${d.toFixed(1)} km from you`;
                      })()}
                    </div>
                  )}
                </DialogHeader>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="font-black text-lg sm:text-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmed Flavors
                </h3>

                {selectedLocation.flavors && selectedLocation.flavors.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {selectedLocation.flavors.map((lf, i) => {
                      const flavor = lf.flavor;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-2xl border-2 bg-card transition-all"
                          style={{ borderLeftColor: getFullColor(flavor.color), borderLeftWidth: "4px" }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {(flavor as any).imageUrl ? (
                              <img
                                src={(flavor as any).imageUrl}
                                alt={flavor.name}
                                className="w-8 h-10 object-contain shrink-0"
                              />
                            ) : (
                              <div
                                className="w-9 h-9 rounded-full shrink-0 shadow-sm border-2 border-background"
                                style={{ backgroundColor: getFullColor(flavor.color) }}
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-black text-sm sm:text-base leading-tight">{flavor.japaneseName}</p>
                              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider truncate">{flavor.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-3">
                            <div className="text-right">
                              {lf.price ? (
                                <p className="font-black text-primary text-sm">{lf.price} {lf.currency}</p>
                              ) : (
                                <p className="font-bold text-muted-foreground text-xs">Price unknown</p>
                              )}
                              {lf.addedBy && (
                                <p className="text-[10px] text-muted-foreground font-medium">by @{lf.addedBy}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost" size="icon"
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full w-8 h-8"
                              onClick={() => handleRemoveFlavor(selectedLocation.id, flavor.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
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
                                      <span
                                        className="inline-block w-3 h-3 rounded-full shrink-0"
                                        style={{ backgroundColor: getFullColor(f.color) }}
                                      />
                                      <span className="truncate max-w-[140px]">{f.japaneseName}</span>
                                      <span className="text-muted-foreground text-xs font-medium hidden sm:inline">{f.name}</span>
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
                      <Button type="submit" className="w-full rounded-xl font-bold h-11 sm:h-12" disabled={!addFlavorId || addLocationFlavor.isPending}>
                        {addLocationFlavor.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Flavor"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 text-center font-medium text-sm">
                    Set a username to add flavors to locations.
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
            <Button type="submit" className="w-full rounded-xl font-bold h-11 sm:h-12 mt-4 text-base sm:text-lg" disabled={createLocation.isPending}>
              {createLocation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Location"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
