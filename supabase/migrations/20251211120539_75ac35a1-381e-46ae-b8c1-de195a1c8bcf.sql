-- Create table for vehicle location tracking
CREATE TABLE public.vehicle_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL DEFAULT 'default',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  depth DOUBLE PRECISION DEFAULT 0,
  signal_strength INTEGER DEFAULT 100,
  zone TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_locations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read locations (public tracking)
CREATE POLICY "Anyone can read vehicle locations"
ON public.vehicle_locations
FOR SELECT
USING (true);

-- Allow anyone to insert locations (for mobile tracker)
CREATE POLICY "Anyone can insert vehicle locations"
ON public.vehicle_locations
FOR INSERT
WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_locations;

-- Index for faster queries
CREATE INDEX idx_vehicle_locations_device_created ON public.vehicle_locations(device_id, created_at DESC);