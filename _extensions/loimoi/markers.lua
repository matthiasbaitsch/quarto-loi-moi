-- Sheet, material and solution from one source, controlled by the metadata variable lm-target.
--
--   Part of the exercise                    sheet   material     solution   (no lm-target)
--   text                                    yes     title only   yes        yes
--   executable code (Div.cell)              no      yes          yes        yes
--   ::: {.lm-solution}                      no      no           marked     marked
--   ::: {.lm-scaffold}                      no      yes          no         marked
--   ::: {.lm-sheet}                         yes     no           yes        yes
--
-- Without lm-target (e.g. while writing an exercise) everything is shown, solution and scaffold marked.
--
-- In the solution, each exercise (::: {#exr-...}) is shortened to its title, its executable code and its
-- solution; an exercise without a solution gets "Keine Lösung.".
--
-- In the material, an empty code cell "# ..." replaces a solution with code that has no scaffold right before
-- or after it, so the students have a place for their code. Titles without code up to the next title are dropped there
-- (paper exercises, "Teil 1").
--
-- Executable code has already run when this filter sees it (Quarto runs the code first), it arrives as a Div with
-- class "cell". Non-executable code such as ```{.python} is a plain CodeBlock and counts as text.
--
-- Marked means: in HTML and Typst a block with a colored line on the left and a label (green "Lösung", blue
-- "Gerüst"), in other formats (e.g. ipynb) a bold label in front.

local TARGETS = { sheet = true, material = true, solution = true }
local LABELS = {
  de = { solution = "Lösung", scaffold = "Gerüst", none = "Keine Lösung." },
  en = { solution = "Solution", scaffold = "Scaffold", none = "No solution." },
}
local COLORS = { solution = "#4a8c4a", scaffold = "#107895" } -- same as in markers.css

-- Kind of a block: "solution", "scaffold", "sheet" (markers), "cell" (executable code) or nil (text)
local function kind_of(block)
  if block.t ~= "Div" then
    return nil
  end
  for _, kind in ipairs({ "solution", "scaffold", "sheet" }) do
    if block.classes:includes("lm-" .. kind) then
      return kind
    end
  end
  if block.classes:includes("cell") then
    return "cell"
  end
  return nil
end

-- Is a block part of an executable cell (its code or output)? Needed because Pandoc also passes the content of
-- a cell to select, and the material keeps only titles and code.
local function is_cell_part(block)
  return (block.t == "CodeBlock" and block.classes:includes("cell-code"))
    or (block.t == "Div" and block.classes:find_if(function(c) return c:match("^cell%-output") end) ~= nil)
end

-- Does a block contain executable code?
local function has_cell(block)
  local found = false
  pandoc.Blocks({ block }):walk({
    Div = function(el)
      found = found or el.classes:includes("cell")
    end,
  })
  return found
end

-- Is a block a solution or does it contain one?
local function has_solution(block)
  local found = false
  pandoc.Blocks({ block }):walk({
    Div = function(el)
      found = found or el.classes:includes("lm-solution")
    end,
  })
  return found
end

-- Shorten an exercise to title, executable code and solution (for the solution document)
local function shorten_exercise(exercise, none)
  local content = pandoc.Blocks({})
  for _, block in ipairs(exercise.content) do
    if block.t == "Header" or kind_of(block) == "cell" or has_solution(block) then
      content:insert(block)
    end
  end
  if not exercise.content:find_if(has_solution) then
    content:insert(pandoc.Div(pandoc.Para(pandoc.Emph(none)), { class = "lm-solution" }))
  end
  exercise.content = content
  return exercise
end

-- Language of the first executable cell, e.g. "python"
local function language(blocks)
  local lang
  blocks:walk({
    Div = function(el)
      if not lang and el.classes:includes("cell") then
        local code = el.content:find_if(function(b) return b.t == "CodeBlock" end)
        lang = code and code.classes[1]
      end
    end,
  })
  return lang
end

-- Marked content of a solution or scaffold
local function marked(content, kind, label)
  if quarto.doc.is_format("html") then
    quarto.doc.add_html_dependency({
      name = "loimoi-markers",
      version = "0.0.1",
      stylesheets = { quarto.utils.resolve_path("markers.css") },
    })
    return { pandoc.Div(content, { class = "lm-" .. kind, ["data-label"] = label }) }
  elseif quarto.doc.is_format("typst") then
    local color = 'rgb("' .. COLORS[kind] .. '")'
    local open = "#block(width: 100%, stroke: (left: 1.5pt + " .. color .. "), inset: (left: 0.8em, y: 0.3em))["
      .. "#block(below: 0.6em, text(size: 0.85em, weight: \"bold\", fill: " .. color .. ")[" .. label .. "])"
    return pandoc.Blocks({ pandoc.RawBlock("typst", open) }) .. content .. { pandoc.RawBlock("typst", "]") }
  end
  return pandoc.Blocks({ pandoc.Para(pandoc.Strong(label)) }) .. content
end

function Pandoc(doc)
  local target = doc.meta["lm-target"] and pandoc.utils.stringify(doc.meta["lm-target"])
  if target and not TARGETS[target] then
    error("lm-target must be sheet, material or solution, not " .. target)
  end
  local lang = doc.meta.lang and pandoc.utils.stringify(doc.meta.lang):match("^en") and "en" or "de"
  local labels = LABELS[lang]

  -- Empty code cell for the material, in the language of the document
  local code_language = language(doc.blocks) or "python"
  local function placeholder()
    return pandoc.Div({ pandoc.CodeBlock("# ...", { class = code_language .. " cell-code" }) }, { class = "cell" })
  end

  -- Select the blocks of a list for the target. Pandoc calls this for every list of blocks, outer lists first
  -- (topdown, see below): a marker decides before its content is looked at, so e.g. a cell in .lm-sheet stays
  -- on the sheet.
  local select
  function select(blocks)
    local result = pandoc.Blocks({})
    for i, block in ipairs(blocks) do
      local kind = kind_of(block)

      if target == nil then
        -- Everything, solution and scaffold marked
        if kind == "solution" or kind == "scaffold" then
          result:extend(marked(block.content, kind, labels[kind]))
        elseif kind == "sheet" then
          result:extend(block.content)
        else
          result:insert(block)
        end

      elseif target == "sheet" then
        if kind == "sheet" then
          result:extend(block.content)
        elseif kind == nil then
          result:insert(block)
        end

      elseif target == "material" then
        if kind == "scaffold" then
          result:extend(block.content)
        elseif kind == "cell" or block.t == "Header" or is_cell_part(block) then
          result:insert(block)
        elseif kind == "solution" then
          local before = blocks[i - 1] and kind_of(blocks[i - 1])
          local after = blocks[i + 1] and kind_of(blocks[i + 1])
          if before ~= "scaffold" and after ~= "scaffold" and has_cell(block) then
            result:insert(placeholder())
          end
        elseif kind == nil and block.t == "Div" then
          -- e.g. an exercise: keep the selected part of its content (title, code)
          result:extend(select(block.content))
        end

      elseif target == "solution" then
        if kind == "solution" then
          result:extend(marked(block.content, kind, labels[kind]))
        elseif kind == "sheet" then
          result:extend(block.content)
        elseif kind ~= "scaffold" then
          result:insert(block)
        end
      end
    end
    return result
  end

  if target == "solution" then
    doc = doc:walk({
      Div = function(el)
        if el.identifier:match("^exr%-") then
          return shorten_exercise(el, labels.none)
        end
      end,
    })
  end

  doc = doc:walk({ traverse = "topdown", Blocks = select })

  -- In the material, drop titles without code up to the next title (paper exercises, "Teil 1" etc.)
  if target == "material" then
    local blocks = pandoc.Blocks({})
    for i, block in ipairs(doc.blocks) do
      local keep = true
      if block.t == "Header" then
        keep = false
        for j = i + 1, #doc.blocks do
          if doc.blocks[j].t == "Header" then
            break
          end
          keep = keep or kind_of(doc.blocks[j]) == "cell"
        end
      end
      if keep then
        blocks:insert(block)
      end
    end
    doc.blocks = blocks
  end

  return doc
end
