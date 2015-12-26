#Circular.content#

*description:*

> The content module provides an attribute `cc-content`, that will print its value to the content of the node, overwriting anything that is in it. It is ued by Circular itself to generated `<span>` tags from expressions that float around in plain text. It's also usefull if you want to write expressions for your content but don't want the expressions visible before Circular gets around to parse the node.


----

##attributes##

----

###cc-content, data-cc-content

*example:* 

	<blink cc-content="{{#wild.thing}}"></blink>
	
*description:*

> Set the content of this node to the value given. It adds the class `.cc-content-generated` to the node when done.

