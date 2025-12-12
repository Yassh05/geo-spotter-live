-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can insert vehicle locations" ON public.vehicle_locations;
DROP POLICY IF EXISTS "Anyone can read vehicle locations" ON public.vehicle_locations;

-- Create new policies that require authentication
CREATE POLICY "Authenticated users can read vehicle locations"
ON public.vehicle_locations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert vehicle locations"
ON public.vehicle_locations
FOR INSERT
TO authenticated
WITH CHECK (true);