#Circular.modules#

*description:*

> The modules module, part of Circular core. This allows you to add modules using new CircularModule(definition).

----

##Methods##

----

###new CircularModule({def})

*example:*

	new CircularModule({
		name	: 'alert',
		in		: function(ccattr,node,ccnode) {
			alert('in: '+ccattr.content.value)
		},
		out		: function(ccattr,node,ccnode) {
			alert('out: '+ccattr.content.value)
		}
	});

	  
*description:*

> A Circular module becomes an integral part of Circular after it initializes. A module named 'foo' by default represents an attribute named 'cc-foo' and can provide methods and properties accessible via Circular expressions like `{{@foo.bar}}``, or in vanilla javascript as `Circular.foo.bar`.
>
> Circular modules should be created before Circular initializes, and the creation order is important. 

*methods:*

	in		: function(ccattr,node,ccnode)
	out		: function(ccattr,node,ccnode)

*arguments:*

- **ccattr:** (*type:* object)
	an object describing the attribute that triggered this method. see the
	registry module for a detailed description of its format

- **node:** (*type:* html dom node)
	the node containing the attribute

- **ccnode:** (*type:* object)
	'live' properties of the node as they are being processed

*return value:*

	boolean false or undefined


*description:*

> While Circular processes the document, it looks at all attributes of all nodes to see if they contain expression and/or refer to a module. The attributes are sorted:  module attributes first, in the order in which they were created, than any other attributes. The order is relevant, because some attributes (like cc-context) can influence others.
>
> Circular then loops the attributes in that order and execute the `in()` method. 
>
> If in() does not return false, Circular will continue with the next attribute, and traverse into the node, depth-first, to process its children. Eventually it will bubble up and encounter your node again. It will process the same attributes as it did on the way in, but now in reverse order, and execute the `out()` method. 
>
> If in() does return (real boolean) false, Circular will not process the remaining attributes and not traverse into the node. It will loop the attributes it already processed in reverse order and execute `out()`.
>
> There is only one instance of your module, which may handle several nodes in the document. If you need to remember data related to the node, for example to reuse on the way out(), be sure to relate the node to that data. `$(node).data()` is your friend.







