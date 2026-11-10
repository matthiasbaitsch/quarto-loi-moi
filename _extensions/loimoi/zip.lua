-- Write a zip file, called from TypeScript:
--
--   quarto pandoc lua zip.lua <zip file> <base folder> <file> <file> ...
--
-- The files are given relative to the base folder and keep these names in the zip file.

local zipfile, base = arg[1], arg[2]
local entries = {}
for i = 3, #arg do
  local f = assert(io.open(base .. "/" .. arg[i], "rb"))
  table.insert(entries, pandoc.zip.Entry(arg[i], f:read("a")))
  f:close()
end

local out = assert(io.open(zipfile, "wb"))
out:write(pandoc.zip.Archive(entries):bytestring())
out:close()
