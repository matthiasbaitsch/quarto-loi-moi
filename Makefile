EXAMPLES = examples/python-flat examples/julia-parts examples/r-topics

# Copy the extension into the example projects (Quarto does not follow a symlink to an extension)
examples:
	for example in $(EXAMPLES); do \
		rm -rf $$example/_extensions/loimoi; \
		mkdir -p $$example/_extensions; \
		cp -R _extensions/loimoi $$example/_extensions/; \
	done

# Render all examples
render: $(addprefix render-,$(notdir $(EXAMPLES)))

# Render every collection of one example, e.g. `make render-julia-parts`; with `uv run` if the example has a
# pyproject.toml, so Quarto uses its virtual environment
render-%: examples
	run=""; \
	if [ -f examples/$*/pyproject.toml ]; then run="uv run --project $(CURDIR)/examples/$*"; fi; \
	for collection in examples/$*/learning-material/*/; do \
		(cd $$collection && $$run quarto render) || exit 1; \
	done

# Remove what loi-moi, Quarto and `make examples` produced in the examples
clean:
	rm -rf __output
	for example in $(EXAMPLES); do \
		rm -rf $$example/_extensions/loimoi $$example/learning-material/*/c $$example/learning-material/*/.quarto; \
	done

.PHONY: examples render clean
