---
layout: post
title: "OSMuf"
date: 2019-03-07
---
Edited 2 May 2020

OSMuf is a Python library for measuring urban form primarily in terms of buildings and land use. 

Minimal instructions

### First set up a new conda environment with all dependencies

1. Install Conda
2. Using Conda create a new Python 3 environment
3. Install OSMnx from conda-forge ´conda install -c conda-forge osmnx´ this will also install geopandas and most of the other packages that are needed.
4. Install Jupyter Lab, Seaborn and PySal - also from conda-forge

### Second clone OSMuf from GitHub and install into the conda environment

1. Install Git
2. Clone osmuf from GitHub ´git clone https://github.com/AtelierLibre/osmuf.git´
3. Inside the cloned folder of OSMuf run ´pip install -e .´
