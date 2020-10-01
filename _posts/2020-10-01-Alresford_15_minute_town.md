---
layout: post
title: "Is Alresford a 15 minute town"
date: 2020-10-01
---

*NOTE: This blog post is based on [this notebook](https://github.com/AtelierLibre/blog_post_notebooks/blob/master/201001_Is_Alresford_a_15_minute_town.ipynb).*

## The 15 minute town

A renewed focus on health and wellbeing in our towns and cities coupled with limited capacity on public transport and fears of congestion if people return to their cars has stoked interest in 'the 15 minute city' - the idea that all of the shops and services that we need on a daily basis should be accessible within a 15 minute walk of our homes.

[The previous post](/blog/2020/09/28/Alresford_Street_centrality) looked at techniques for identifying bottlenecks in a town's street network and a means of identifying the locations in a town that are closest to all of the others. But it questioned whether, if you asked for directions to the town centre, this is where you would be directed.

This post returns to [Alresford](https://www.openstreetmap.org/#map=15/51.0871/-1.1655) and looks at an alternative method for identifying the town centre based on clusters of shops and services. It then does a simple distance-based analysis of the street network to identify areas that are within a 15 minute walk of the town centre. This gives an absolutely minimal indication of whether the challenges of creating 15 minute neighbourhoods are equally relevant in smaller settlements as in major cities.

## Alresford's eccentric growth

Alresford is a historic market town that dates back to around the 12th century. The town centre was established close to a crossing of the river with which it shares its name. The river limits the expansion of the town to the north, all significant subsequent development has taken place to the south on the other side of what used to be the London and South Western railway line to Winchester. This has meant that over time the town centre has become more and more peripheral to the main body of the town.

By using OSMnx's ability to access other OpenStreetMap geometries rather than just the street network, we can download points of interest (POIs - in this case shops) and building footprints and then use a network constrained clustering technique to identify the town centre. Because this is an analysis of walking times we will work with an undirected network of drivable streets.

![New Alresford network buildings pois](/images/New_Alresford_network_buildings_pois.png "New Alresford network buildings pois")

## Identifying the town centre and generating isochrones/pedsheds

The clusters of shops are obvious to the human eye. To identify them automatically, we will use network constrained DBSCAN clustering. This is done by identifying the nodes with POIs close to them and then grouping the nodes based on a maximum distance (see [the notebook](https://github.com/AtelierLibre/blog_post_notebooks/blob/master/201001_Is_Alresford_a_15_minute_town.ipynb) for more details). The town centre is assumed to be the cluster with the most POIs in it. Having identified the town centre we calculate the distance (here expressed in terms of time) to every other street junction in the town and hence identify which parts of the town are within 15 minutes walk of the shops and services. By associating the buildings with the nearest street junction we can also then colour them according to the time from that junction to the centre:

![New Alresford walking time to town centre](/images/New_Alresford_Walking_time_to_town_centre.png "New Alresford walking time to town centre")

The majority of buildings in the town are more than a 15 minute walk to the town centre. As is typical of much English suburban expansion based around distributor roads and environmental areas, the newer areas in Alresford are arranged around cul-de-sacs deliberately designed to discourage through traffic. The poor accessibility that this creates is clear - it is possible to pick out pockets of housing which, while close to the town centre as the crow flies, are distant from the town centre along the street network.

## Including other centres

In small towns such as Alresford the distance of the town centre from much of the housing is compensated for by providing solitary convenience stores. DBSCAN identifies these as outliers, single points that do not form a cluster. If we include these, even at this most basic level of accessibility (can you buy a pint of milk and loaf of bread within a 15 minute walk of your home, ignoring access to education, healthcare, employment, etc.?) there are pockets of the town that do not manage it:

![New Alresford walking time to any centre](/images/New_Alresford_Walking_time_to_any_centre.png "New Alresford walking time to any centre")

The analysis above is purely based on walking along streets. As is common in this kind of layout there are additional footpaths that provide shortcuts between houses and back gardens. Even by including the footpaths that were excluded before, to give an absolutely minimal assessment of whether it is physically possible to walk from home to shop in 15 minutes (regardless of how desireable the route is), there are still areas that fall short:

![New Alresford walking time to any centre all footpaths](/images/New_Alresford_Walking_time_to_any_centre_all_footpaths.png "New Alresford walking time to any centre all footpaths")

#### References

- [Ville du 1/4h](https://annehidalgo2020.com/thematique/ville-du-1-4h/)
- [A Brief History of Alresford](http://www.alresford.org/history.php)
- Charmes, E. (2010). Cul-de-sacs, Superblocks and Environmental Areas as Supports of Residential Territorialization. Journal of Urban Design, 15(3), 357–374. [https://doi.org/10.1080/13574809.2010.487811](https://doi.org/10.1080/13574809.2010.487811)