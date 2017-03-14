#Circular.template#

----

##attributes##

----

###cc-template

*example:* 

		<span class="winner" cc-template id="oneliner">
				<i>{{#name}}</i> (<b>{{#date}}</b>)<br>
		</span>
	
		<!Ñ the 3 top winners Ñ>
	
		<h1>First prize</h1>
		<p cc-template="#oneliner" cc-context="{{#winners[0]}}"></p>
	
		<hr>
	
		<h2>Second prize</h2>
		<p cc-template="#oneliner" cc-context="{{#winners[1]}}"></p>
	
		<hr>
	
		<h3>Third prize</h3>
		<p cc-template="#oneliner" cc-context="{{#winners[2]}}"></p>
	

*description:*

> If the attribute has no value, the nodeis assumed to be a template and ignored; children are not processed. 
>
> If it has a value, the value is assumed to be a jquery selector idenitfying the template to use. The template is inserted and since it's a new sibling, Circular will cycle into it to process any expressions and attributes using the current context.

