EXAMPLES = examples/python-flat examples/julia-parts examples/r-topics examples/nummat
COLLECTIONS = examples/python-flat/learning-material/aufgaben examples/julia-parts/learning-material/exercises \
	examples/r-topics/learning-material/exercises examples/nummat/lernpfad/aufgaben

# Copy the extension into the example projects (Quarto does not follow a symlink to an extension)
examples:
	for example in $(EXAMPLES); do \
		rm -rf $$example/_extensions/loimoi; \
		mkdir -p $$example/_extensions; \
		cp -R _extensions/loimoi $$example/_extensions/; \
	done
	# nummat: tinh from the symlink examples/nummat/tinh (to quarto-tinh/_extensions), if there
	if [ -d examples/nummat/tinh ]; then \
		rm -rf examples/nummat/_extensions/matthiasbaitsch; \
		cp -R examples/nummat/tinh/ examples/nummat/_extensions/matthiasbaitsch; \
	fi

# Render the public examples; nummat needs numMat on this machine
render: render-python-flat render-julia-parts render-r-topics

# Python from the virtual environment of the example
render-python-flat: examples
	uv run --project examples/python-flat quarto render examples/python-flat/learning-material/aufgaben

render-julia-parts: examples
	quarto render examples/julia-parts/learning-material/exercises

render-r-topics: examples
	quarto render examples/r-topics/learning-material/exercises

# pyproject.toml and uv.lock are symlinks to numMat's; Jupyter is in its group `render`
render-nummat: examples
	uv run --project examples/nummat --group render quarto render examples/nummat/lernpfad/aufgaben

# Remove what loi-moi, Quarto and `make examples` produced in the examples
clean:
	rm -rf __output
	for example in $(EXAMPLES); do rm -rf $$example/_extensions/loimoi; done
	for collection in $(COLLECTIONS); do rm -rf $$collection/c $$collection/.quarto; done

.PHONY: examples render render-python-flat render-julia-parts render-r-topics render-nummat clean
