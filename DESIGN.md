# Design

How loi-moi does what SPEC describes.

## Overview

Running `quarto render learning-material/<collection>` triggers execution of loi-moi's `pre-render` script which

1. collects required information, most importantly
    1. a representation of the `building-blocks` tree
    1. the configuration from `loimoi.yml`
    1. the list of ingredients
    1. the recipe
1. clears `c/`
1. runs the recipe's actions for each entry in the ingredients list

Remarks:

- any error stops execution

## Tools

### Model of the building block source tree

Provide a handy representation of the building blocks source tree

### Model of a Quarto document

Make processing of Quarto files simple

Processing steps

1. Exercises: `exercise-sheet`, `exercise-scaffold`, `exercise-solution`
1. Also replaces placeholders (`${…}`) from a dictionary
1. Jupyter
1. Zip

## Process

The pre-render script runs the whole process:

### Configuration

Figure out defaults for entries missing in `loimoi.yml`

Per product: values for the placeholders (naming), filled into the settings

### List of ingredients

Collect the ingredients of each product

### Recipes

A recipe is a set of actions required to transform ingredients into a product

### Actions

#### Quarto file

Collect Quarto file from ingredients and process it.

#### Archive

Copy files into a folder and create an archive

## Decisions

## Development
