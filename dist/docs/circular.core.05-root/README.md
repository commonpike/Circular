#Circular.root#

*description:*

> The root module provides an attribute, `cc-root`, that triggers Circular engine to start cycling from that node downwards - depth first. You can have multiple roots.
>
> When no root is found, Circular will parse the whole document starting with `html`. 

----

##attributes##

----

###cc-root, data-cc-root

*example:* 

	<div cc-root>{{#title}}</div>

*description:*

> Tell Circular to parse this node and everything below it. When given a value, it sets the context that value, using the `context` module.

