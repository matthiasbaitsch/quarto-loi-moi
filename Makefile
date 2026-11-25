COURSES = examples/nummat examples/numpde examples/mathe-b
EXAMPLES = examples/python-flat examples/julia-parts examples/r-topics $(COURSES)
COLLECTIONS = examples/python-flat/learning-material/aufgaben examples/julia-parts/learning-material/exercises \
	examples/julia-parts/learning-material/slides examples/r-topics/learning-material/exercises \
	examples/r-topics/learning-material/theory-slides examples/r-topics/learning-material/programming-slides \
	examples/nummat/lernpfad/aufgaben \
	examples/nummat/lernpfad/folien examples/numpde/lernpfad/aufgaben examples/mathe-b/lernpfad/aufgaben

# Copy the extension into the example projects (Quarto does not follow a symlink to an extension)
examples:
	for example in $(EXAMPLES); do \
		rm -rf $$example/_extensions/loimoi; \
		mkdir -p $$example/_extensions; \
		cp -R _extensions/loimoi $$example/_extensions/; \
	done
	# Courses: tinh from the symlink <course>/tinh (to quarto-tinh/_extensions), if there
	for course in $(COURSES); do \
		if [ -d $$course/tinh ]; then \
			rm -rf $$course/_extensions/matthiasbaitsch; \
			cp -R $$course/tinh/ $$course/_extensions/matthiasbaitsch; \
		fi; \
	done

# Render the public examples; nummat and numpde need numMat and numPDE on this machine
render: render-python-flat render-julia-parts render-r-topics

# Python from the virtual environment of the example
render-python-flat: examples
	uv run --project examples/python-flat quarto render examples/python-flat/learning-material/aufgaben

render-julia-parts: examples
	quarto render examples/julia-parts/learning-material/exercises
	quarto render examples/julia-parts/learning-material/slides

render-r-topics: examples
	quarto render examples/r-topics/learning-material/exercises
	quarto render examples/r-topics/learning-material/theory-slides
	quarto render examples/r-topics/learning-material/programming-slides

# pyproject.toml and uv.lock are symlinks to numMat's; Jupyter is in its group `render`
render-nummat: examples
	uv run --project examples/nummat --group render quarto render examples/nummat/lernpfad/aufgaben
	quarto render examples/nummat/lernpfad/folien

# Project.toml, Manifest.toml and _setup.jl are symlinks to numPDE's
render-numpde: examples
	quarto render examples/numpde/lernpfad/aufgaben

# R packages from the R installation, as in Mathematik B
render-mathe-b: examples
	quarto render examples/mathe-b/lernpfad/aufgaben

# Remove what loi-moi, Quarto and `make examples` produced in the examples
clean:
	rm -rf __output
	for example in $(EXAMPLES); do rm -rf $$example/_extensions/loimoi; done
	for collection in $(COLLECTIONS); do rm -rf $$collection/c $$collection/generated $$collection/.quarto; done

.PHONY: examples render render-python-flat render-julia-parts render-r-topics render-nummat render-numpde render-mathe-b clean
