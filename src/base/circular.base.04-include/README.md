#Circular.include#

----

##custom attributes##

----

###cc-include

*example:* 

		<div id="winners" cc-include="../winners.inc">
			loading ...
		</div>
	

*description:*

> The module loads the external content as specified by the url in the attribute, and places it inside the element, replacing the current content.
>
----

##executable comments##

----

###include

*example:* 

		<div id="winners">
			<!--@include["../winners.inc"]-->
		</div>

*description:*

> The module loads the external content as specified by the argument in the comment, and replaces the comment with that content.
>
