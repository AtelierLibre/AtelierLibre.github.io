---
layout: post
title: "Network constrained DBSCAN clustering with OSMnx and Pandana"
date: 2020-09-21
---

*NOTE: This blog post is based on [this notebook](https://github.com/AtelierLibre/blog_post_notebooks/blob/master/200921_Network_constrained_clustering.ipynb) which steps through the process.*

This blog post was originally inspired by another [blog post by Geoff Boeing](https://geoffboeing.com/2018/04/network-based-spatial-clustering/#more-3125) and an [associated notebook](https://github.com/gboeing/network-clustering/blob/master/network-clustering-node-based.ipynb) demonstrating the network constrained clustering of 1,000,000 points with [OSMnx](https://github.com/gboeing/osmnx), [NetworkX](https://networkx.github.io/) and [DBSCAN](https://scikit-learn.org/stable/modules/generated/sklearn.cluster.DBSCAN.html). While the use of a sparse matrix allowed a larger number of points to be handled on the network, there are still limitations on applying the suggested method to a large city such as London and using real-world Points-of-Interest (POIs) downloaded from OpenStreetMap.

I encountered two bottlenecks:

1. The 1,000,000 points in the example were actually quite tightly clustered when they were created. Once they have been attached to the nearest nodes in the network, there are actually only 549 nodes forming the basis of the origin-destination matrix.

Trying to apply this approach to London and real-world POIs downloaded from OpenStreetMap didn't work because, even though we may be starting with a much smaller number of POIs (35,000 instead of 1,000,000), the POIs are more evenly distributed and attach to a larger number of nearest nodes - in this example around 16,000. When following the example notebook just creating the OD matrix with that many entries was a challenge.

2. The street network in the example is relatively small. Apart from the difficulties handling a large number of POIs there are also challenges working with the street networks of larger cities. NetworkX can be slow when trying to calculate all of the shortest paths through the network.

[Pandana](https://github.com/UDST/pandana) uses contraction hierarchies to carry out extremely fast network-based nearest POI queries and also benefits from limiting its search to within a threshold distance from each node in the network.

The hypothesis of the blogpost and notebook is that, as DBSCAN also uses a threshold distance to identify nearest neighbours, it might be possible to combine the two libraries to allow network constrained clustering with both a larger number of starting POIs/nearest nodes and a larger street network. The notebook linked to above goes through the process step-by-step to produce the following image:

![Network constrained clustering shops and offices in London](images/London_network_constrained_clustering.png "Network constrained clustering shops and offices in London")

By overlaying the results on polygons of town centres downloaded from the [London Datastore](https://data.london.gov.uk/) it is possible to see that the clustering does work though there are a few points to note:

- The parameters for both Pandana and DBSCAN have not been carefully calibrated, the purpose of the notebook is to show the potential of the method.
- Pandana has a numeric limit on the number of POIs that it will find within the threshold distance as well. This may be problematic if the POIs are clustered tightly together.
- The DBSCAN results are potentially affected by the different relative densities of the various clusters.
- There are clearly a few extremely large clusters in the centre of the city with much smaller ones in the periphery. This may reflect where the bulk of the OSM community's mapping of POIs has been focussed in London, or it may indeed show that, despite claims that London already is a 15 minute city, at a higher level it remains extremely centralised.
