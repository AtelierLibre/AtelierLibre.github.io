---
layout: post
title: "OSMuf"
date: 2019-03-07
---
Edited 3 May 2020

[OSMuf (OpenStreetMap: urban form)](https://github.com/AtelierLibre/osmuf) is a Python library for measuring urban form primarily in terms of buildings and land use. It was largely inspired by Geoff Boeing's [OSMnx](https://github.com/gboeing/osmnx)<sup>1</sup> which measures urban form in terms of street networks. It was developed in order to be able to investigate the interaction between street networks and building density. OSMuf is still available and includes a [demonstration notebook](https://github.com/AtelierLibre/osmuf/blob/master/notebooks/OSMuf_v0.1.ipynb).

## Installation instructions

The package was developed on Ubuntu and, while that shouldn't matter, my experience is that it is more straightforward to get a working Python environment for geospatial analysis up and running on Linux. I got the most consistent results by following Ted Petrou's advice on how to [Set up a lean, robust data science environment with Miniconda and Conda-Forge](https://medium.com/dunder-data/anaconda-is-bloated-set-up-a-lean-robust-data-science-environment-with-miniconda-and-conda-forge-b48e1ac11646), installing the additional geospatial components from conda-forge afterwards. On Windows, due to issues with C extensions, even though it's not recommended, I get better results installing everything from Conda's default channel, only installing any packages not available there from conda-forge at the end. Geoff Boeing's blog post ['Using geopandas on Windows'](https://geoffboeing.com/2014/09/using-geopandas-windows/) describes a similar experience.

### Once you have a working Python 3 environment

1. Install OSMnx from conda-forge `conda install -c conda-forge osmnx`
   (this will also install geopandas and most of the other packages that are needed).
2. Install Jupyter Lab, Seaborn and PySal
3. Download or clone osmuf from GitHub `git clone https://github.com/AtelierLibre/osmuf.git`
4. Inside the cloned folder of OSMuf and while working in the new virtual environment run `pip install -e .`

Further information is available on the [project homepage](https://github.com/AtelierLibre/osmuf) and in the [notebook](https://github.com/AtelierLibre/osmuf/blob/master/notebooks/OSMuf_v0.1.ipynb). Please note I am not currently maintaining OSMuf, as the series develops this may change, but my intention is to explore the thinking behind it in further blog posts.

#### Footnotes

1. Boeing, G. (2017). [OSMnx: New Methods for Acquiring, Constructing, Analyzing, and Visualizing Complex Street Networks](https://geoffboeing.com/publications/osmnx-complex-street-networks/). *Computers, Environment and Urban Systems* 65, 126-139. doi:10.1016/j.compenvurbsys.2017.05.004
