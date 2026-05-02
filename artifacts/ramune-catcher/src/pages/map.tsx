import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useListLocations, useCreateLocation, useAddLocationFlavor, useRemoveLocationFlavor, getListLocationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedCoord, setSelectedCoord] = useState<{lat: number, lng: number} | null>(null);
  const [newLocName, setNewLocName] = useState("");
  const [newLocCity, setNewLocCity] = useState("");
  const [newLocCountry, setNewLocCountry] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading } = useListLocations({
    query: { queryKey: getListLocationsQueryKey() }
  });

  const createLocation = useCreateLocation({
    mutation: {
      onSuccess: () => {
        toast({ title: "Location added!", description: "Snack spot added successfully." });
        queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
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
        lng: selectedCoord.lng
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-80px)] space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-1">Snack Map</h1>
          <p className="text-muted-foreground font-medium">Find places that sell ramune.</p>
        </div>
        <Button 
          onClick={() => {
            setIsAddingMode(!isAddingMode);
            setSelectedCoord(null);
          }}
          variant={isAddingMode ? "outline" : "default"}
          className="rounded-xl font-bold shadow-sm"
        >
          {isAddingMode ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> Add Spot</>}
        </Button>
      </div>

      {isAddingMode && !selectedCoord && (
        <div className="bg-primary text-primary-foreground p-3 rounded-xl font-bold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4 shrink-0">
          <MapPin className="w-5 h-5 animate-bounce" /> Click anywhere on the map to pin a new location!
        </div>
      )}

      <Card className="rounded-3xl border-2 overflow-hidden flex-1 relative z-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-sm">
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
            <Marker key={loc.id} position={[loc.lat, loc.lng]}>
              <Popup className="rounded-2xl">
                <div className="font-sans">
                  <h3 className="font-black text-lg">{loc.name}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{loc.city}, {loc.country}</p>
                  <div className="bg-muted p-2 rounded-lg text-center">
                    <span className="font-bold text-primary">{loc.confirmedCount}</span>
                    <span className="text-xs ml-1 font-medium">flavors confirmed here</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {selectedCoord && (
            <Marker position={[selectedCoord.lat, selectedCoord.lng]} opacity={0.7} />
          )}
        </MapContainer>
      </Card>

      <Dialog open={!!selectedCoord} onOpenChange={(open) => !open && setSelectedCoord(null)}>
        <DialogContent className="rounded-3xl border-2">
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
                className="rounded-xl border-2 shadow-none"
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
                  className="rounded-xl border-2 shadow-none"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold">Country</label>
                <Input 
                  value={newLocCountry} 
                  onChange={e => setNewLocCountry(e.target.value)} 
                  placeholder="e.g. USA"
                  className="rounded-xl border-2 shadow-none"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full rounded-xl font-bold h-12 mt-4"
              disabled={createLocation.isPending}
            >
              {createLocation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Location"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
