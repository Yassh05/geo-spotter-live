-- Add user_id column to vehicle_locations for ownership
ALTER TABLE public.vehicle_locations ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read vehicle locations" ON public.vehicle_locations;
DROP POLICY IF EXISTS "Authenticated users can insert vehicle locations" ON public.vehicle_locations;

-- Create new RLS policies that restrict access to user's own data
CREATE POLICY "Users can only read their own vehicle locations"
ON public.vehicle_locations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own vehicle locations"
ON public.vehicle_locations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);