#Circular.context#

*description:*

> The context module manages the context used for processing `{{expressions}}` while cycling the document. Any part of a expression starting with `#` is assumed to be relative to the current context. For example, `{{#title}}` will be evaluated as `foo.bar.title` if the current context is `'foo.bar'`.
>
> It's good to remember the current context is really just a string referencing to an object. It is only used to parse expressions that, when evaluated, can be objects.
>
> It's also good to remember 'global' variables on the `window` object can not be watched by the watchdog. Data binding will only work on deeper levels.

----

##config##

----

*example:* 

	Circular.init({rootcontext:'Data.import'})

*arguments:*

- **rootcontext:** (*type:* string, *default:* 'document') 
The context for processing nodes if no context is set.

----

##attributes##

----

###cc-context, data-cc-context

*example:* 

	<div cc-context="Data.import.people.person[21]">
		<img src="{{#profile.picture.url}}">
		<div cc-context="{{#biography}}">
			<p>{{#short}}</p>
		</div>
	</div>

*description:*

> Set the context to the given string or expression. If the value of this attribute is a string, that string will be taken as context, otherwise, the expression defining the (non-string) value will be used. In other words:
> 
> `<div cc-context="foo">` sets the context to the string 'foo'
> `<div cc-context="{{foo}}">` sets the context to the value of foo if foo is a string. Otherwise, it sets the context to the string 'foo'. 
>
> This allows you manage references in your data. Imagine `a = { b : 'c' }; c = { d : 'e' }`, then `<span cc-context="{{a.b}}">{{#d}}</span>` will print `e`. 

----

##methods##

----

###@context.get()

*return value:* (*type:* string) 
- the current context 
 
*description:*

> Returns the current context
	
	
###@context.set(context)

*arguments:*

- **context:** (*type:* string, *default:* @config.rootcontext) 
The context to use for this node and below

*description:*

> Sets the context to use for processing this node and below
	


