import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useListLocations, useCreateLocation, useAddLocationFlavor, useRemoveLocationFlavor, getListLocationsQueryKey, useListFlavors, getListFlavorsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, Loader2, Tag, Trash2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getFullColor, getTintedColor } from "@/lib/color-utils";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LocationWithFlavors } from "@workspace/api-client-react";

// Fix Leaflet default icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView() {
  const { username } = useAuth();
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{lat: number, lng: number} | null>(null);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocCountry, setNewLocCountry] = useState("");
  
  const [selectedLocId, setSelectedLocId] = useState<number | null>(null);
  
  const [addFlavorId, setAddFlavorId] = useState<string>("");
  const [addPrice, setAddPrice] = useState("");
  const [addCurrency, setAddCurrency] = useState("SEK");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useListLocations({
    query: { queryKey: getListLocationsQueryKey() }
  });

  const { data: flavors, isLoading: flavorsLoading } = useListFlavors({
    query: { queryKey: getListFlavorsQueryKey() }
  });

  const createLocation = useCreateLocation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Location added!", description: "Snack spot added successfully." });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
        setSelectedCoord(null);
        setIsAddingMode(false);
        setNewLocName("");
        setNewLocCity("");
        setNewLocCountry("");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to add location", variant: "destructive" });
      }
    }
  });

  const addLocationFlavor = useAddLocationFlavor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Flavor added to location!" });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
        // Assuming we have an endpoint to get single location or we invalidate list
        setAddFlavorId("");
        setAddPrice("");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to add flavor", variant: "destructive" });
      }
    }
  });

  const removeLocationFlavor = useRemoveLocationFlavor({
    mutation: {
      onSuccess: () => {
        toast({ title: "Flavor removed from location." });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.error || "Failed to remove flavor", variant: "destructive" });
      }
    }
  });

  const handleMapClick = (lat: number, lng: number) => {
    if (isAddingMode) {
      setSelectedCoord({ lat, lng });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoord || !newLocName || !newLocCity || !newLocCountry) return;
    
    createLocation.mutate({
      data: {
        name: newLocName,
        city: newLocCity,
        country: newLocCountry,
        lat: selectedCoord.lat,
        lng: selectedCoord.lng,
        addedBy: username || undefined
      }
    });
  };

  const handleAddFlavor = (locId: number, e: React.FormEvent) => {
    e.preventDefault();
    if (!addFlavorId) return;

    addLocationFlavor.mutate({
      locationId: locId,
      data: {
        flavorId: parseInt(addFlavorId),
        price: addPrice ? parseFloat(addPrice) : undefined,
        currency: addPrice ? addCurrency : undefined,
        addedBy: username || undefined
      }
    });
  };

  const handleRemoveFlavor = (locId: number, flavorId: number) => {
    if (confirm("Are you sure you want to remove this flavor from the location?")) {
      removeLocationFlavor.mutate({
        locationId: locId,
        data: { flavorId }
      });
    }
  };

  const groupedFlavors = useMemo(() => {
    if (!flavors) return [];
    const groups: Record<string, typeof flavors> = {};
    flavors.forEach(f => {
      const brand = f.brand || "Other";
      if (!groups[brand]) groups[brand] = [];
      groups[brand].push(f);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [flavors]);

  // Use the list as the source of truth for now, and typecast to handle the flavors array if available.
  // The backend might return flavors array in the list endpoint. If not, we might need a separate query per location,
  // but based on typical setups, we'll assume it's returned or we can get it via getLocation.
  // For simplicity here, we'll try to find it in the list if it has flavors, else fallback.
  // In a real scenario, clicking a marker should ideally fetch the location details.
  const selectedLocation = useMemo(() => {
    return locations?.find(l => l.id === selectedLocId) as LocationWithFlavors | undefined;
  }, [locations, selectedLocId]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] space-y-4 animate-in fade-in duration-500">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-1">Snack Map</h1>
          <p className="text-muted-foreground font-medium">Find places that sell ramune worldwide.</p>
        </div>
        <Button 
          onClick={() => {
            setIsAddingMode(!isAddingMode);
            setSelectedCoord(null);
            setSelectedLocId(null);
          }}
          variant={isAddingMode ? "outline" : "default"}
          className="rounded-xl font-bold shadow-sm h-12 px-6"
        >
          {isAddingMode ? "Cancel Adding" : <><Plus className="w-5 h-5 mr-2" /> Add Spot</>}
        </Button>
      </div>

      {isAddingMode && !selectedCoord && (
        <div className="bg-primary text-primary-foreground p-3 rounded-xl font-bold flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 shrink-0 shadow-md">
          <MapPin className="w-6 h-6 animate-bounce" /> 
          <span>Click anywhere on the map to drop a pin!</span>
        </div>
      )}

      <Card className="rounded-3xl border-2 overflow-hidden flex-1 relative z-0 shadow-sm">
        {locationsLoading && (
          <div className="absolute inset-0 z-[1000] bg-background/50 flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        )}
        <MapContainer 
          center={[35.6895, 139.6917]} // Default to Tokyo
          zoom={3} 
          className="w-full h-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleMapClick} />
          
          {locations?.map((loc) => (
            <Marker 
              key={loc.id} 
              position={[loc.lat, loc.lng]}
              eventHandlers={{
                click: () => {
                  setSelectedLocId(loc.id);
                  setIsAddingMode(false);
                }
              }}
            >
              {/* Not using Popup anymore, using Dialog/Sheet instead for better UX */}
            </Marker>
          ))}

          {selectedCoord && (
            <Marker position={[selectedCoord.lat, selectedCoord.lng]} opacity={0.7} />
          )}
        </MapContainer>
      </Card>

      {/* Location Details Dialog */}
      <Dialog open={!!selectedLocId} onOpenChange={(open) => !open && setSelectedLocId(null)}>
        <DialogContent className="sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 p-0 gap-0">
          {selectedLocation ? (
            <>
              <div className="p-6 pb-0">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="font-black text-3xl mb-1">{selectedLocation.name}</DialogTitle>
                      <DialogDescription className="font-bold text-base flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {selectedLocation.city}, {selectedLocation.country}
                      </DialogDescription>
                    </div>
                  </div>
                  {selectedLocation.addedBy && (
                    <div className="text-sm font-medium text-muted-foreground mt-2 flex items-center gap-1">
                      Added by <span className="text-foreground font-bold">@{selectedLocation.addedBy}</span>
                    </div>
                  )}
                </DialogHeader>
              </div>

              <div className="p-6">
                <h3 className="font-black text-xl mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" /> Confirmed Flavors
                </h3>
                
                {selectedLocation.flavors && selectedLocation.flavors.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {selectedLocation.flavors.map((lf, i) => {
                      const flavor = lf.flavor;
                      return (
                        <div key={i} className="flex items-center justify-between p-3 rounded-2xl border-2 bg-card hover-elevate transition-all">
                          <div className="flex items-center gap-4 min-w-0">
                            <div 
                              className="w-10 h-10 rounded-full shrink-0 shadow-sm border-2 border-background"
                              style={{ backgroundColor: getFullColor(flavor.color) }}
                            />
                            <div className="min-w-0">
                              <p className="font-black text-lg leading-none truncate" title={flavor.japaneseName}>{flavor.japaneseName}</p>
                              <p className="text-muted-foreground font-bold text-[10px] uppercase tracking-wider truncate" title={flavor.name}>{flavor.name}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0 pl-4">
                            <div className="text-right">
                              {lf.price ? (
                                <p className="font-black text-primary">{lf.price} {lf.currency}</p>
                              ) : (
                                <p className="font-bold text-muted-foreground text-sm">Price unknown</p>
                              )}
                              {lf.addedBy && (
                                <p className="text-[10px] text-muted-foreground font-medium">by @{lf.addedBy}</p>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                              onClick={() => handleRemoveFlavor(selectedLocation.id, flavor.id)}
                            >
                              <Trash2 className="w-4 h-4" />
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
                  <div className="bg-muted/30 p-5 rounded-2xl border-2">
                    <h4 className="font-black text-lg mb-3">Add a confirmed flavor</h4>
                    <form onSubmit={(e) => handleAddFlavor(selectedLocation.id, e)} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold">Flavor</label>
                        <Select value={addFlavorId} onValueChange={setAddFlavorId} required>
                          <SelectTrigger className="w-full rounded-xl border-2 shadow-none font-medium h-12">
                            <SelectValue placeholder="Select a flavor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {groupedFlavors.map(([brand, brandFlavors]) => (
                              <SelectGroup key={brand}>
                                <SelectLabel className="font-black text-primary">{brand}</SelectLabel>
                                {brandFlavors.map(f => (
                                  <SelectItem key={f.id} value={f.id.toString()} className="font-bold">
                                    {f.japaneseName} <span className="text-muted-foreground text-xs ml-2 font-medium">{f.name}</span>
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <label className="text-sm font-bold">Price (Optional)</label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              value={addPrice}
                              onChange={(e) => setAddPrice(e.target.value)}
                              placeholder="0.00"
                              className="pl-9 rounded-xl border-2 shadow-none font-mono"
                            />
                          </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                          <label className="text-sm font-bold">Currency</label>
                          <Input 
                            value={addCurrency}
                            onChange={(e) => setAddCurrency(e.target.value.toUpperCase())}
                            placeholder="SEK"
                            className="rounded-xl border-2 shadow-none font-mono uppercase"
                            maxLength={3}
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full rounded-xl font-bold h-12"
                        disabled={!addFlavorId || addLocationFlavor.isPending}
                      >
                        {addLocationFlavor.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Flavor"}
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-primary/10 text-primary p-4 rounded-xl border border-primary/20 text-center font-medium">
                    You must set a username to add flavors to locations.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog open={!!selectedCoord} onOpenChange={(open) => !open && setSelectedCoord(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl border-2">
          <DialogHeader>
            <DialogTitle className="font-black text-2xl">Add Snack Spot</DialogTitle>
            <DialogDescription className="font-medium">
              Register a new store that sells ramune.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Store Name</label>
              <Input 
                value={newLocName} 
                onChange={e => setNewLocName(e.target.value)} 
                placeholder="e.g. Mitsuwa Marketplace"
                className="rounded-xl border-2 shadow-none h-12 font-medium"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold">City</label>
                <Input 
                  value={newLocCity} 
                  onChange={e => setNewLocCity(e.target.value)} 
                  placeholder="e.g. Edgewater"
                  className="rounded-xl border-2 shadow-none h-12 font-medium"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Country</label>
                <Input 
                  value={newLocCountry} 
                  onChange={e => setNewLocCountry(e.target.value)} 
                  placeholder="e.g. USA"
                  className="rounded-xl border-2 shadow-none h-12 font-medium"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl font-bold h-12 mt-4 text-lg"
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save Location"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}