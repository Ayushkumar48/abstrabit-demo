-- Enable Row Level Security on bookmarks table
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can update their own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON bookmarks;

-- Policy: Users can view only their own bookmarks
CREATE POLICY "Users can view their own bookmarks"
ON bookmarks
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks"
ON bookmarks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own bookmarks
CREATE POLICY "Users can update their own bookmarks"
ON bookmarks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks"
ON bookmarks
FOR DELETE
USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON bookmarks TO authenticated;

-- Optional: Grant usage on the table to anon users (if needed for public read)
-- GRANT SELECT ON bookmarks TO anon;
