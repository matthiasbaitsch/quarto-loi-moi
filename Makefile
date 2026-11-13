EXAMPLES = examples/python-flat examples/julia-parts examples/r-topics

# Copy the extension into the example projects (Quarto does not follow a symlink to an extension)
examples:
	for d in $(EXAMPLES); do \
		rm -rf $$d/_extensions/loimoi; \
		mkdir -p $$d/_extensions; \
		cp -R _extensions/loimoi $$d/_extensions/; \
	done

.PHONY: examples
